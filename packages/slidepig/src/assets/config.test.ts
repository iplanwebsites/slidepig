import { describe, expect, it } from "vitest";
import { hashRuleOptions, resolveConfig, resolveRule } from "./config";

describe("resolveConfig", () => {
  it("normalizes public paths", () => {
    const config = resolveConfig(
      { publicPath: "media/", sourcePublicPath: "assets" },
      "/app",
    );

    expect(config.publicPath).toBe("/media");
    expect(config.sourcePublicPath).toBe("/assets/");
  });

  it("refuses to write derivatives into the source directory", () => {
    expect(() =>
      resolveConfig({ root: "public", outDir: "public" }, "/app"),
    ).toThrow(/must differ/);
  });

  it("refuses an outDir outside the app", () => {
    expect(() => resolveConfig({ outDir: "../elsewhere" }, "/app")).toThrow(
      /inside the app/,
    );
  });

  it("sorts and de-duplicates widths", () => {
    expect(resolveConfig({ widths: [1024, 640, 1024] }, "/app").widths).toEqual(
      [640, 1024],
    );
  });
});

describe("resolveRule", () => {
  const config = resolveConfig(
    {
      widths: [640, 1280],
      formats: ["avif", "webp"],
      rules: [{ include: "og.png", formats: ["jpeg"], placeholder: false }],
    },
    "/app",
  );

  it("layers a matching rule over the defaults", () => {
    const rule = resolveRule(
      config,
      (candidate) => candidate.include === "og.png",
    );

    expect(rule.formats).toEqual(["jpeg"]);
    expect(rule.placeholder).toBe(false);
    expect(rule.widths).toEqual([640, 1280]);
  });

  it("falls back to the top-level options", () => {
    const rule = resolveRule(config, () => false);
    expect(rule.formats).toEqual(["avif", "webp"]);
  });
});

describe("hashRuleOptions", () => {
  const config = resolveConfig({}, "/app");
  const rule = resolveRule(config, () => false);
  const hash = () =>
    hashRuleOptions(rule, config.effort, config.placeholderWidth);

  it("is stable for the same options", () => {
    expect(hash()).toBe(hash());
  });

  it("changes when quality changes", () => {
    const other = resolveRule(
      resolveConfig({ quality: { avif: 30 } }, "/app"),
      () => false,
    );

    expect(
      hashRuleOptions(other, config.effort, config.placeholderWidth),
    ).not.toBe(hash());
  });
});
