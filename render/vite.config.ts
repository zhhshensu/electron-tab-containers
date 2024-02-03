import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: "render",
  base: "./",
  server: {
    port: 5000,
  },
  build: {
    outDir: resolve(__dirname, "../dist/pages"),
    rollupOptions: {
      input: {
        tabs: resolve(__dirname, "tabs/index.html"),
        error: resolve(__dirname, "error/index.html"),
      },
    },
  },
});
