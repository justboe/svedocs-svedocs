import { defineCommand, createMain } from "citty";
import { readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer, searchForWorkspaceRoot, type Plugin } from "vite";
import { globSync } from "glob";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import unocss from "unocss/vite";
import {
  transformerCompileClass,
  transformerDirectives,
  transformerVariantGroup,
} from "unocss";
import { Marked } from "marked";
import shiki from "marked-shiki";
import { createHighlighterCore, type LanguageInput } from "shiki/core";
import github_dark from "@shikijs/themes/github-dark";
import github_light from "@shikijs/themes/github-light";
import { createOnigurumaEngine } from "shiki/engine-oniguruma.mjs";
import yaml from "yaml";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));
const SOURCE_DIR = join(fileURLToPath(import.meta.url), "../");
const ENTRY_FILE = join(SOURCE_DIR, "entry.mjs");
const HTML_TEMPLATE = `<!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body>
            <div id="app"></div>
            <script type="module" src="/@fs/${ENTRY_FILE}"></script
            </body>
            </html>`;

const dev = defineCommand({
  meta: {
    name: "dev",
    description: "Run the development server",
    version: pkg.version,
  },
  args: {
    cwd: {
      type: "positional",
      description: "The current working directory",
      default: process.cwd(),
    },
  },
  async run({ args }) {
    if (!isAbsolute(args.cwd)) args.cwd = join(process.cwd(), args.cwd);

    const server = await createServer({
      server: {
        fs: {
          allow: [
            args.cwd,
            SOURCE_DIR,
            searchForWorkspaceRoot(args.cwd),
            "$routes",
          ],
        },
      },
      plugins: [
        unocss({
          transformers: [
            transformerCompileClass(),
            transformerDirectives(),
            transformerVariantGroup(),
          ],
        }),
        svelte(),
        svedocs(args.cwd),
      ],
    });
    await server.listen();
    server.printUrls();
  },
});

const main = createMain({
  meta: {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
  },
  subCommands: { dev },
});

async function svedocs(cwd = process.cwd()) {
  const routes = await resolveRoutes({ cwd });

  return {
    name: "vite-plugin-nixt",
    enforce: "pre",
    load(id) {
      if (id === "$routes") return "$routes";
    },
    resolveId(source) {
      if (source === "$routes") return "$routes";
    },
    async transform(code, id) {
      // Routes
      if (id === "$routes") {
        return {
          code: `export default ${JSON.stringify(routes)};`,
          map: null,
        };
      }

      // Markdown
      if (id.endsWith(".md")) {
        const marked = new Marked();

        if (code.includes("```")) {
          const langs: LanguageInput[] = [];

          const matches = /```[\w]+/g.exec(code) || [];
          for (const match of matches) {
            langs.push(import(`@shikijs/langs/${match.slice(3)}`));
          }

          const highlighter = await createHighlighterCore({
            langs,
            themes: [github_dark, github_light],
            engine: createOnigurumaEngine(import("shiki/wasm")),
          });

          marked.use(
            shiki({
              highlight(code, lang, props) {
                return highlighter.codeToHtml(code, {
                  lang,
                  theme: "github-light",
                });
              },
            }),
          );
        }

        let frontmatter: any = "";

        marked.use({
          hooks: {
            preprocess(markdown) {
              const start = markdown.indexOf("---");
              const end = markdown.indexOf("---", start + 3);
              if ([start, end].includes(-1)) return markdown;

              frontmatter = yaml.parse(markdown.slice(start + 3, end).trim());

              return markdown.slice(end + 3).trim();
            },
          },
        });

        const html = String(await marked.parse(code)).trim();

        return {
          code: `export const html =  \`${html}\`;export const frontmatter = \`${JSON.stringify(frontmatter)}\`;`,
          map: null,
        };
      }
    },
    configureServer(server) {
      return () => {
        server.middlewares.use((req, res, next) => {
          return res.end(HTML_TEMPLATE);
        });
      };
    },
  } as Plugin;
}

async function resolveRoutes({
  cwd,
  ignore = [],
}: {
  cwd: string;
  ignore?: string[];
}) {
  const routes: Record<string, string> = {};

  for (const file of globSync("**/*.{svelte,md}", { cwd, ignore })) {
    let path = file
      .replaceAll(/\\/g, "/")
      .replace(/\.md$/, "")
      .replaceAll(/\[([\w]+)\]/g, ":$1");
    if (path.endsWith("index")) path = path.slice(0, path.length - 5);
    if (path.endsWith("/")) path = path.slice(0, -1);
    if (!path.startsWith("/")) path = "/" + path;

    routes[path] = join(cwd, file);
  }

  return routes;
}

main();
