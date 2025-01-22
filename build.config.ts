import { defineBuildConfig } from "unbuild";
import svelte from "rollup-plugin-svelte";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

export default defineBuildConfig({
  entries: ["src/entry.ts", "src/cli.ts", "src/config.ts"],
  externals: [...Object.keys(pkg.dependencies), "$routes", "virtual:uno.css"],
  declaration: true,
  failOnWarn: false,
  rollup: {
    esbuild: {},
  },
  hooks: {
    "rollup:options"(ctx, opts) {
      opts.plugins.push(svelte());
    },
  },
});
