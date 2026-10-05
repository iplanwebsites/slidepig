import { describe, expect, it } from "vitest";
import { createSiteWorker } from "./worker";

const page = "<!DOCTYPE html><title>Deck</title>";

function env(headers: Record<string, string>, body = page, status = 200) {
  return {
    ASSETS: {
      fetch: async () => new Response(body, { status, headers }),
    },
  };
}

const worker = createSiteWorker();
const get = (path: string, headers: Record<string, string> = {}) =>
  new Request(`https://decks.example.com${path}`, { headers });

describe("site worker", () => {
  it("gives HTML a strong ETag and answers revalidation with a 304", async () => {
    const assets = env({ "content-type": "text/html; charset=utf-8" });
    const first = await worker.fetch(get("/tour"), assets);
    const etag = first.headers.get("etag")!;
    expect(etag).toMatch(/^W\/"[0-9a-f]{32}"$/);
    expect(first.headers.get("cache-control")).toBe(
      "public, max-age=0, must-revalidate",
    );
    expect(await first.text()).toBe(page);

    const again = await worker.fetch(
      get("/tour", { "if-none-match": etag.slice(2) }),
      assets,
    );
    expect(again.status).toBe(304);
    expect(await again.text()).toBe("");
  });

  it("sends Last-Modified from the deploy and honours If-Modified-Since", async () => {
    const assets = {
      ...env({ "content-type": "text/html" }),
      CF_VERSION_METADATA: { timestamp: "2026-10-04T22:30:00.500Z" },
    };
    const first = await worker.fetch(get("/"), assets);
    const lastModified = first.headers.get("last-modified")!;
    expect(lastModified).toBe("Sun, 04 Oct 2026 22:30:00 GMT");
    const fresh = await worker.fetch(
      get("/", { "if-modified-since": lastModified }),
      assets,
    );
    expect(fresh.status).toBe(304);
    const stale = await worker.fetch(
      get("/", { "if-modified-since": "Sun, 04 Oct 2026 22:00:00 GMT" }),
      assets,
    );
    expect(stale.status).toBe(200);
  });

  it("keeps an ETag the asset binding already sent", async () => {
    const assets = env({ "content-type": "text/html", etag: '"abc"' });
    const response = await worker.fetch(get("/"), assets);
    expect(response.headers.get("etag")).toBe('"abc"');
    const conditional = await worker.fetch(
      get("/", { "if-none-match": '"abc"' }),
      assets,
    );
    expect(conditional.status).toBe(304);
  });

  it("makes hashed assets immutable and leaves 404 pages uncached", async () => {
    const asset = await worker.fetch(
      get("/assets/client-abc.js"),
      env({ "content-type": "text/javascript" }, "x"),
    );
    expect(asset.headers.get("cache-control")).toBe(
      "public, max-age=31536000, immutable",
    );
    const missing = await worker.fetch(
      get("/nope/"),
      env({ "content-type": "text/html" }, page, 404),
    );
    expect(missing.status).toBe(404);
    expect(missing.headers.get("etag")).toBeNull();
    expect(missing.headers.get("x-content-type-options")).toBe("nosniff");
  });
});
