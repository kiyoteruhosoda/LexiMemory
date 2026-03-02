import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

const frontendRoot = path.resolve(__dirname, "../..");

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    alias: {
      "react-native": "react-native-web",
      "@": path.resolve(frontendRoot, "src"),
      "@linguisticnode/core": path.resolve(frontendRoot, "packages/core/src"),
      "@linguisticnode/core/storage": path.resolve(frontendRoot, "packages/core/src/storage"),
      "@linguisticnode/ui": path.resolve(frontendRoot, "packages/ui/src"),
      "@linguisticnode/ui/components": path.resolve(frontendRoot, "packages/ui/src/components"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/api/, ""),
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
});
