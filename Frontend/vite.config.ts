import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tanstackStart(),
    nitro({ preset: "vercel" }),
    react(),
    tailwindcss(),
  ],
  nitro: {
    hooks: {
      compiled(nitro) {
        const staticAssetsDir = join(
          nitro.options.output.dir,
          "static",
          "assets",
        );
        const clientAsset = readdirSync(staticAssetsDir).find(
          (fileName) =>
            fileName.startsWith("index-") && fileName.endsWith(".js"),
        );

        if (!clientAsset) {
          throw new Error("Could not find the compiled client entry asset.");
        }

        const manifestPath = join(
          nitro.options.output.dir,
          "functions",
          "__server.func",
          "_tanstack-start-manifest_v.mjs",
        );
        const manifest = readFileSync(manifestPath, "utf8");
        const productionManifest = manifest.replaceAll(
          "/@id/virtual:tanstack-start-dev-client-entry",
          `/assets/${clientAsset}`,
        );

        if (productionManifest !== manifest) {
          writeFileSync(manifestPath, productionManifest);
        }
      },
    },
  },
});
