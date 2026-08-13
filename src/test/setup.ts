import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// RTL does not auto-cleanup unless Vitest globals are enabled; wire it
// explicitly so DOM tests unmount between cases (GF-AUTH-001, Task 7).
afterEach(() => {
  cleanup();
});