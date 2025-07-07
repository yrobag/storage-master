import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        content: resolve(__dirname, "src/contentScript.ts"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "content") return "contentScript.js";
          return "[name].js";
        },
      },
    },
    outDir: "dist",
    emptyOutDir: false,
  },
});
