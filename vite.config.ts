import { readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const root = import.meta.dirname;

// Every prototypes/<slug>/index.html becomes its own page of the app,
// served at /prototypes/<slug>/.
function prototypeInputs() {
  const dir = resolve(root, "prototypes");
  if (!existsSync(dir)) return {};
  return Object.fromEntries(
    readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && existsSync(resolve(dir, entry.name, "index.html")))
      .map((entry) => [entry.name, resolve(dir, entry.name, "index.html")]),
  );
}

export default defineConfig({
  // Set by the Pages workflow so assets resolve under /sandbox/.
  base: process.env.BASE_PATH ?? "/",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        home: resolve(root, "index.html"),
        ...prototypeInputs(),
      },
    },
  },
});
