import path from "node:path";
import type { Plugin } from "vite";
import {
  loadServerModule,
  prerender,
  readClientAssets,
  validateSite,
} from "./build";
import type { ServerModule } from "./build";

export type SlidepigSiteOptions = {
  /** The module whose default export is `defineSite(...)`. */
  site?: string;
  /** Fail the build on invalid pages or deck errors. Defaults to true. */
  validate?: boolean;
  /** Where the deployable site goes. Defaults to `dist`. */
  outDir?: string;
};

const CLIENT = "virtual:slidepig-site/client";
const SERVER = "virtual:slidepig-site/server";

/**
 * Everything a deck site needs from Vite:
 *
 * - `vite` serves server-rendered pages that hydrate, like production
 * - `vite build` builds the client, builds the renderer, prerenders every
 *   route into `dist/` and validates the result
 */
export function slidepigSite(options: SlidepigSiteOptions = {}): Plugin {
  let root = process.cwd();
  const outDir = options.outDir ?? "dist";
  const serverOutDir = `${outDir}-server`;
  const sitePath = () => path.resolve(root, options.site ?? "src/site.ts");

  return {
    name: "slidepig-site",

    config(config) {
      root = path.resolve(config.root ?? process.cwd());
      return {
        appType: "custom",
        // SITE_ORIGIN and friends are readable as import.meta.env.SITE_*.
        envPrefix: ["VITE_", "SITE_"],
        ssr: { noExternal: ["slidepig"] },
        environments: {
          client: {
            build: {
              outDir,
              manifest: true,
              rollupOptions: { input: { client: CLIENT } },
            },
          },
          ssr: {
            build: {
              outDir: serverOutDir,
              copyPublicDir: false,
              rollupOptions: { input: { server: SERVER } },
            },
          },
        },
        builder: {
          async buildApp(builder) {
            await builder.build(builder.environments.client!);
            await builder.build(builder.environments.ssr!);
            const dist = path.resolve(root, outDir);
            const server = await loadServerModule(
              path.resolve(root, serverOutDir, "server.js"),
            );
            await prerender(server, dist, await readClientAssets(dist));
            if (options.validate === false) return;
            const problems = await validateSite(server, dist);
            if (problems.length)
              throw new Error(
                `[slidepig/site] ${problems.length} problem(s):\n  ${problems.join("\n  ")}`,
              );
            console.log(
              `[slidepig/site] ${server.routes.length} pages validated`,
            );
          },
        },
      };
    },

    resolveId(id) {
      if (id === CLIENT || id === SERVER) return `\0${id}`;
    },

    load(id) {
      const site = JSON.stringify(sitePath());
      if (id === `\0${CLIENT}`)
        return [
          `import site from ${site};`,
          `import { hydrateSite } from "slidepig/site/client";`,
          `import "slidepig/styles.css";`,
          `hydrateSite(site);`,
        ].join("\n");
      if (id === `\0${SERVER}`)
        return [
          `import site from ${site};`,
          `import { createRenderer } from "slidepig/site/render";`,
          `export const { routes, render } = createRenderer(site);`,
          `export { site };`,
        ].join("\n");
    },

    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const url = (request.url ?? "/").split("?")[0]!;
        if (!url.endsWith("/") && !url.endsWith(".html")) return next();
        try {
          const module = (await server.ssrLoadModule(SERVER)) as ServerModule;
          // Resolved like a JS import so package export conditions apply,
          // which Vite's CSS @import resolver does not honour.
          const styles = await server.pluginContainer.resolveId(
            "slidepig/styles.css",
          );
          const page =
            module.render(url, {
              stylesheets: styles ? [`/@fs${styles.id}`] : [],
              scripts: [`/@id/__x00__${CLIENT}`],
            }) ?? module.render("/404.html", { stylesheets: [], scripts: [] });
          if (!page) return next();
          response.statusCode = page.status;
          response.setHeader("content-type", "text/html; charset=utf-8");
          response.end(await server.transformIndexHtml(url, page.html));
        } catch (error) {
          server.ssrFixStacktrace(error as Error);
          next(error);
        }
      });
    },
  };
}

export default slidepigSite;
