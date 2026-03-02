import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "src/__tests__/**/*.{test,spec}.{ts,tsx}",
      "packages/**/*.{test,spec}.{ts,tsx}",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData",
        "src/main.tsx",
      ],
    },
  },
  resolve: {
    alias: {
      "react-native": "react-native-web",
      "@": path.resolve(__dirname, "./src"),
      "@linguisticnode/core": path.resolve(__dirname, "./packages/core/src"),
      "@linguisticnode/core/storage": path.resolve(__dirname, "./packages/core/src/storage"),
      "@linguisticnode/ui": path.resolve(__dirname, "./packages/ui/src"),
    },
  },
});
