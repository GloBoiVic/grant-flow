import path from "node:path";
import { defineConfig } from "vitest/config";

// Unit/integration test configuration (GF-AUTH-001, Task 1; Task 7 adds
// jsdom). Auth unit tests target pure server logic (role mapping, webhook
// event parsing/validation, signature verification) and keep the node
// environment. Component/DOM tests opt in per file with a
// `// @vitest-environment jsdom` docblock (see context/coding-standards.md
// §12). The shared setup file wires RTL cleanup and jest-dom matchers.
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