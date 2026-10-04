/**
 * A Cloudflare Worker that serves a prerendered site from static assets.
 *
 * The asset binding already answers conditional requests (ETag and
 * If-None-Match → 304). This handler sets the cache policy around those
 * validators:
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

      if (immutable.test(pathname) && response.ok)
        headers.set("cache-control", "public, max-age=31536000, immutable");
      else if (headers.get("content-type")?.startsWith("text/html"))
        headers.set("cache-control", "public, max-age=0, must-revalidate");
      for (const [name, value] of Object.entries(extra))
        headers.set(name, value);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    },
  };
}

export default createSiteWorker();
