import { defineConfig } from "tsdown";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["es"],
  target: "node22",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  platform: "node",
});
