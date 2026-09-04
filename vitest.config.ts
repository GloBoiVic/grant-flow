import path from "node:path";
import { defineConfig } from "vitest/config";

// Unit/integration test configuration. Server tests use the node environment;
// component tests opt in per file with a `// @vitest-environment jsdom`
// docblock. The shared setup file wires RTL cleanup and jest-dom matchers.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/test/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
