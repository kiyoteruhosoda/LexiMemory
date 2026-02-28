/// <reference types="vitest" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // デフォルトはホストで開発する想定：localhost:8000
  // （composeで 8000:8000 を publish しておく）
  const apiBase = env.VITE_API_BASE ?? "http://localhost:8000";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "react-native": "react-native-web",
        "@": path.resolve(__dirname, "./src"),
        "@leximemory/core": path.resolve(__dirname, "./packages/core/src"),
        "@leximemory/core/storage": path.resolve(
          __dirname,
          "./packages/core/src/storage"
        ),
        "@leximemory/ui": path.resolve(__dirname, "./packages/ui/src"),
        "@leximemory/ui/components": path.resolve(
          __dirname,
          "./packages/ui/src/components"
        )
      }
    },
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      proxy: {
        // フロント → /api/* → {apiBase}/*
        "/api": {
          target: apiBase,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, "")
        }
      }
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      include: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/__tests__/**/*.{test,spec}.{ts,tsx}",
        "packages/**/*.{test,spec}.{ts,tsx}"
      ],
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html"],
        exclude: [
          "node_modules/",
          "src/test/",
          "**/*.test.{ts,tsx}",
          "**/*.spec.{ts,tsx}"
        ]
      }
    }
  };
});