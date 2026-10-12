import { readdirSync, existsSync, renameSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const root = import.meta.dirname;

const prototypesDir = resolve(root, "prototypes");

function prototypeSlugs() {
  if (!existsSync(prototypesDir)) return [];
  return readdirSync(prototypesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(resolve(prototypesDir, entry.name, "index.html")))
    .map((entry) => entry.name);
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
      server.middlewares.use((req, _res, next) => {
        const url = req.url ?? "";
        if (url.startsWith(base)) {
          const slug = url.slice(base.length).split(/[/?#]/)[0];
          if (slug && prototypeSlugs().includes(slug)) {
            req.url = `${base}prototypes/${url.slice(base.length)}`;
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
  plugins: [react(), flatPrototypeUrls()],
  build: {
    rollupOptions: {
      input: {
        home: resolve(root, "index.html"),
        ...prototypeInputs(),
      },
    },
  },
});
