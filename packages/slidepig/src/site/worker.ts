/**
 * A Cloudflare Worker that serves a prerendered site from static assets.
 *
 * Every page gets validators: a weak ETag hashed from the page (production
 * asset bindings send HTML without one) and, with the `version_metadata`
 * binding, a Last-Modified from the deploy time. Weak, because Cloudflare
 * may rewrite HTML on the way out, and it drops strong ETags when it does.
 * A matching If-None-Match or If-Modified-Since gets a 304. The cache
 * policy around those validators:
 *
 * - content-hashed files are immutable for a year
 * - HTML is always revalidated, so a deploy shows up at once while an
 *   unchanged page still costs only a 304
 *
 * ```ts
 * // worker/index.ts
 * export { default } from "slidepig/site/worker";
 * ```
 */
export type SiteWorkerEnv = {
  ASSETS: { fetch(request: Request): Promise<Response> };
  /**
   * Optional `version_metadata` binding. Its timestamp becomes the pages'
   * Last-Modified, a validator Cloudflare keeps even when it strips ETags
   * from HTML (it does when zone features rewrite pages).
   */
  CF_VERSION_METADATA?: { timestamp?: string };
};

export type SiteWorkerOptions = {
  /** Paths whose files carry a content hash. */
  immutable?: RegExp;
  /** Extra headers on every response. */
  headers?: Record<string, string>;
};

export function createSiteWorker(options: SiteWorkerOptions = {}) {
  const immutable = options.immutable ?? /^\/(?:assets|_media)\//;
  const extra = {
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    ...options.headers,
  };

  return {
    async fetch(request: Request, env: SiteWorkerEnv): Promise<Response> {
      const response = await env.ASSETS.fetch(request);
      const { pathname } = new URL(request.url);
      const headers = new Headers(response.headers);
      const html = headers.get("content-type")?.startsWith("text/html");
      let body: BodyInit | null = response.body;

      if (immutable.test(pathname) && response.ok)
        headers.set("cache-control", "public, max-age=31536000, immutable");
      else if (html)
        headers.set("cache-control", "public, max-age=0, must-revalidate");
      for (const [name, value] of Object.entries(extra))
        headers.set(name, value);

      if (html && response.status === 200) {
        let etag = headers.get("etag");
        if (!etag) {
          // Prerendered pages are small, so hashing them is cheap.
          const bytes = await response.arrayBuffer();
          etag = `W/"${await sha256(bytes)}"`;
          headers.set("etag", etag);
          body = bytes;
        }
        const deployed = deployedAt(env);
        if (deployed && !headers.has("last-modified"))
          headers.set("last-modified", deployed.toUTCString());

        const ifNoneMatch = request.headers.get("if-none-match");
        const notModified = ifNoneMatch
          ? matches(ifNoneMatch, etag)
          : notModifiedSince(
              request.headers.get("if-modified-since"),
              deployed,
            );
        if (notModified) {
          headers.delete("content-length");
          return new Response(null, { status: 304, headers });
        }
      }

      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    },
  };
}

function deployedAt(env: SiteWorkerEnv): Date | undefined {
  const timestamp = env.CF_VERSION_METADATA?.timestamp;
  const date = timestamp ? new Date(timestamp) : undefined;
  return date && !Number.isNaN(date.getTime()) ? date : undefined;
}

/** HTTP dates have one-second precision, so compare whole seconds. */
function notModifiedSince(
  ifModifiedSince: string | null,
  deployed: Date | undefined,
): boolean {
  if (!ifModifiedSince || !deployed) return false;
  const since = Date.parse(ifModifiedSince);
  return (
    !Number.isNaN(since) &&
    Math.floor(deployed.getTime() / 1000) <= Math.floor(since / 1000)
  );
}

/** RFC 9110 weak comparison: `W/` prefixes are ignored, `*` matches. */
function matches(ifNoneMatch: string | null, etag: string): boolean {
  if (!ifNoneMatch) return false;
  const bare = (tag: string) => tag.trim().replace(/^W\//, "");
  return ifNoneMatch
    .split(",")
    .some((tag) => tag.trim() === "*" || bare(tag) === bare(etag));
}

async function sha256(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

export default createSiteWorker();
