// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",

    lib: {
      entry: "src/main.ts",
      name: "TourWidget",
      fileName: "tour-widget",
      formats: ["iife"],
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        entryFileNames: "tour-widget.js",
        assetFileNames: "tour-widget.[ext]",
      },
    },
    minify: "terser",
    // Removed terserOptions - it will use defaults
  },
});
