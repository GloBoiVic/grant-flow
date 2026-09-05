import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { IMPORT_FILE_EXTENSION, MAX_IMPORT_FILE_BYTES, MAX_IMPORT_CANDIDATE_ROWS } from "@/lib/import/portfolio-xlsx";

describe("portfolio import bounds and transport configuration", () => {
  it("keeps the application limit bounded while leaving multipart headroom", () => {
    expect(IMPORT_FILE_EXTENSION).toBe(".xlsx");
    expect(MAX_IMPORT_FILE_BYTES).toBe(5 * 1024 * 1024);
    expect(MAX_IMPORT_CANDIDATE_ROWS).toBe(1_000);

    const config = readFileSync(path.resolve(process.cwd(), "next.config.ts"), "utf8");
    expect(config).toContain('bodySizeLimit: "6mb"');
  });

  it("uses the maintained official SheetJS distribution rather than the public registry release", () => {
    const packageJson = readFileSync(path.resolve(process.cwd(), "package.json"), "utf8");
    expect(packageJson).toContain('"xlsx": "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz"');
  });
});
