/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  envDir: "..",
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  server: {
    port: 5173,
    host: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      // ロジック層(domain/lib純粋関数/mappers)のみをカバレッジ計測対象にする。
      // React コンポーネント・hooks・Firebase 連携層はまだテスト資産が薄く、
      // ここに含めると閾値が形骸化するため、UIテスト整備後に対象を広げる。
      include: [
        "src/domain/entities/**/*.ts",
        "src/domain/services/**/*.ts",
        "src/domain/valueObjects/**/*.ts",
        "src/infrastructure/mappers/**/*.ts",
        "src/lib/**/*.ts",
      ],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.d.ts",
        "src/lib/firebase.ts",
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
    },
  },
});
