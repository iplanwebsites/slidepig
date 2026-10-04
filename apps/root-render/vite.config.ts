import { defaultClientConditions, defineConfig } from "vite";

// The condition only matters inside the slidepig monorepo, where it points
// at the library's TypeScript source. Published installs do not need it.
export default defineConfig({
  resolve: { conditions: ["slidepig-source", ...defaultClientConditions] },
});
