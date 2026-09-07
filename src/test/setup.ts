import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach } from "vitest";

type VitestGlobal = typeof globalThis & {
  jsdom?: { window: Window };
};

const testGlobal = globalThis as VitestGlobal;
const jsdomWindow = testGlobal.jsdom?.window;
const storageKeys = ["localStorage", "sessionStorage"] as const;
const originalStorageDescriptors = new Map<
  (typeof storageKeys)[number],
  PropertyDescriptor | undefined
>();

if (jsdomWindow) {
  for (const key of storageKeys) {
    const descriptor = Object.getOwnPropertyDescriptor(testGlobal, key);
    originalStorageDescriptors.set(key, descriptor);
    Object.defineProperty(testGlobal, key, {
      configurable: true,
      enumerable: descriptor?.enumerable ?? true,
      value: jsdomWindow[key],
      writable: true,
    });
  }

  afterAll(() => {
    for (const key of storageKeys) {
      const descriptor = originalStorageDescriptors.get(key);
      if (descriptor) {
        Object.defineProperty(testGlobal, key, descriptor);
      } else {
        delete testGlobal[key];
      }
    }
  });
}

// RTL does not auto-cleanup unless Vitest globals are enabled; wire it
// explicitly so DOM tests unmount between cases (GF-AUTH-001, Task 7).
afterEach(() => {
  cleanup();
});
