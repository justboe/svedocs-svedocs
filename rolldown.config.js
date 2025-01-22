import { readFileSync } from "node:fs";
import { defineConfig } from "rolldown";
import svelte from "rollup-plugin-svelte";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

export default defineConfig({
  input: ["src/config.ts", "src/cli.ts", "src/entry.ts"],
  output: {
    dir: "dist",
    format: "esm",
  },

  externals: [...Object.keys(pkg.dependencies), "$routes", "virtual:uno.css"],
  plugins: [svelte()],
});
