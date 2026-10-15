import { execFileSync } from "node:child_process";
import { readdirSync, existsSync, renameSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { deckPublish } from "./vite-plugins/deck-publish";

const root = import.meta.dirname;

const prototypesDir = resolve(root, "prototypes");

function prototypeSlugs() {
  if (!existsSync(prototypesDir)) return [];
  return readdirSync(prototypesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(resolve(prototypesDir, entry.name, "index.html")))
    .map((entry) => entry.name);
}

/**
 * When each prototype was last published and first added, in ms: the last commit that changed its
 * files (notes like FRAMING.md don't count) and the first that added it. Ones not committed yet
 * have no times, and the home page shows them first.
 */
function publishedTimes() {
  const git = (args: string[]) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  const times: Record<string, { published: number; added: number }> = {};
  for (const slug of prototypeSlugs()) {
    try {
      const dir = `prototypes/${slug}`;
      const published = git(["log", "-1", "--format=%cI", "--", dir, `:(exclude)${dir}/*.md`]);
      const added = git(["log", "--diff-filter=A", "--format=%cI", "--", `${dir}/index.html`]).split("\n").pop() ?? "";
      if (published) times[slug] = { published: Date.parse(published), added: Date.parse(added || published) };
    } catch {
      // Not a git checkout: fall back to the registry's dates.
    }
  }
  return times;
}

// Every prototypes/<slug>/index.html becomes its own page of the app.
function prototypeInputs() {
  return Object.fromEntries(prototypeSlugs().map((slug) => [slug, resolve(prototypesDir, slug, "index.html")]));
}

// Prototypes live in prototypes/<slug>/ but are served at /<slug>/: the dev
// server rewrites /<slug>/... to /prototypes/<slug>/..., and the build moves
// dist/prototypes/<slug>/ up to dist/<slug>/.
function flatPrototypeUrls(): Plugin {
  let base = "/";
  let outDir = "dist";
  return {
    name: "flat-prototype-urls",
    configResolved(config) {
      base = config.base;
      outDir = resolve(config.root, config.build.outDir);
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? "";
        if (url.startsWith(base)) {
          const rest = url.slice(base.length);
          const slug = rest.split(/[/?#]/)[0];
          if (slug && prototypeSlugs().includes(slug)) {
            // Match Pages, which redirects /<slug> to /<slug>/.
            if (rest.length === slug.length || "?#".includes(rest[slug.length])) {
              res.writeHead(301, { Location: `${base}${slug}/${rest.slice(slug.length)}` });
              res.end();
              return;
            }
            req.url = `${base}prototypes/${rest}`;
          }
        }
        next();
      });
    },
    closeBundle() {
      const built = resolve(outDir, "prototypes");
      if (!existsSync(built)) return;
      for (const slug of readdirSync(built)) {
        rmSync(resolve(outDir, slug), { recursive: true, force: true });
        renameSync(resolve(built, slug), resolve(outDir, slug));
      }
      rmSync(built, { recursive: true, force: true });
    },
  };
}

export default defineConfig({
  // Set by the Pages workflow so assets resolve under /sandbox/.
  base: process.env.BASE_PATH ?? "/",
  plugins: [react(), flatPrototypeUrls(), deckPublish()],
  define: {
    __PROJECT_PUBLISHED__: JSON.stringify(publishedTimes()),
  },
  build: {
    rollupOptions: {
      input: {
        home: resolve(root, "index.html"),
        ...prototypeInputs(),
      },
    },
  },
});
