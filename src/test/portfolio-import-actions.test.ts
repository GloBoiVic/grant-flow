import * as XLSX from "xlsx";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authorizeAction: vi.fn(),
  revalidatePath: vi.fn(),
  funderFindMany: vi.fn(),
  funderCreateManyAndReturn: vi.fn(),
  grantCreateManyAndReturn: vi.fn(),
  activityCreateMany: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/clerk/authorization", () => ({ authorizeAction: mocks.authorizeAction }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    funder: { findMany: mocks.funderFindMany },
    $transaction: mocks.transaction,
  },
}));

import { analyzePortfolioImport, confirmPortfolioImport } from "@/app/(authenticated)/(org-required)/import/actions";

const headers = ["Funder", "Type", "Current Status", "Designation"];
const authorization = { organizationId: "org-a", userId: "user-a" };

function workbookFile(rows: unknown[][], name = "tracker.xlsx"): File {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), "Tracker");
  return new File([XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })], name);
}

function formData(file: File, acknowledged = false): FormData {
  const data = new FormData();
  data.append("file", file);
  if (acknowledged) data.append("acknowledged", "true");
  return data;
}

function transactionClient() {
  return {
    funder: { findMany: mocks.funderFindMany, createManyAndReturn: mocks.funderCreateManyAndReturn },
    grant: { createManyAndReturn: mocks.grantCreateManyAndReturn },
    activity: { createMany: mocks.activityCreateMany },
  };
}

describe("portfolio import Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authorizeAction.mockResolvedValue(authorization);
    mocks.funderFindMany.mockResolvedValue([]);
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback(transactionClient()));
    mocks.funderCreateManyAndReturn.mockImplementation(async (input: { data: Array<{ id: string }> }) => input.data.map(({ id }) => ({ id })));
    mocks.grantCreateManyAndReturn.mockImplementation(async (input: { data: Array<{ id: string }> }) => input.data.map(({ id }) => ({ id })));
    mocks.activityCreateMany.mockResolvedValue({ count: 0 });
  });

  it("authorizes before scoped funder lookup and returns a server-produced preview", async () => {
    const result = await analyzePortfolioImport(formData(workbookFile([headers, ["Funder A", "Foundation", "Submitted", "Program"]])));

    expect(result.success).toBe(true);
    expect(mocks.authorizeAction).toHaveBeenCalledBefore(mocks.funderFindMany);
    expect(mocks.funderFindMany).toHaveBeenCalledWith({
      where: { organizationId: "org-a", deletedAt: null },
      select: { id: true, name: true, type: true, deletedAt: true },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });
    if (result.success) expect(result.data.rows[0].funderDecision).toMatchObject({ kind: "create" });
  });

  it("re-resolves funders and persists only regenerated valid rows, ignoring client preview fields", async () => {
    mocks.funderFindMany.mockResolvedValue([{ id: "existing-a", name: "Funder A", type: "FOUNDATION", deletedAt: null }]);
    const data = formData(workbookFile([
      headers,
      ["Funder A", "Other", "Submitted", "Program"],
      ["Funder A", "Other", "Submitted", "Program"],
      ["Funder B", "Foundation", "To Apply", "Opportunity"],
    ]), true);
    data.append("organizationId", "org-b");
    data.append("funderId", "attacker-funder");
    data.append("preview", JSON.stringify({ counts: { valid: 999 } }));

    const result = await confirmPortfolioImport(data);

    expect(result.success).toBe(true);
    expect(mocks.funderFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { organizationId: "org-a", deletedAt: null } }));
    expect(mocks.funderCreateManyAndReturn).toHaveBeenCalledWith(expect.objectContaining({
      data: [expect.objectContaining({ organizationId: "org-a", name: "Funder B", type: "FOUNDATION" })],
    }));
    expect(mocks.grantCreateManyAndReturn).toHaveBeenCalledWith(expect.objectContaining({ data: expect.any(Array) }));
    expect(mocks.grantCreateManyAndReturn.mock.calls[0][0].data).toHaveLength(2);
    expect(mocks.activityCreateMany.mock.calls[0][0].data).toHaveLength(3);
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(1, "/grants");
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(2, "/funders");
  });

  it("does not persist or revalidate without acknowledgement", async () => {
    const result = await confirmPortfolioImport(formData(workbookFile([headers, ["Funder A", "Foundation", "Submitted"]])));

    expect(result).toEqual({ success: false, error: expect.stringContaining("acknowledge") });
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("keeps regenerated invalid rows out of the transaction write set", async () => {
    const result = await confirmPortfolioImport(formData(workbookFile([headers, ["Funder A", "Unknown status"]]), true));

    expect(result).toEqual({ success: false, error: "No valid grants are available to import." });
    expect(mocks.funderCreateManyAndReturn).not.toHaveBeenCalled();
    expect(mocks.grantCreateManyAndReturn).not.toHaveBeenCalled();
    expect(mocks.activityCreateMany).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("returns a safe failure when the transaction rejects, preserving rollback responsibility in Prisma", async () => {
    mocks.transaction.mockRejectedValue(new Error("database failure"));
    const result = await confirmPortfolioImport(formData(workbookFile([headers, ["Funder A", "Foundation", "Submitted"]]), true));

    expect(result).toEqual({ success: false, error: "The import could not be completed. No records were created." });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("does not disclose another organization's funder when the requester is unauthenticated", async () => {
    mocks.authorizeAction.mockResolvedValue({ success: false, error: "Unauthorized", code: "UNAUTHENTICATED" });
    const result = await analyzePortfolioImport(formData(workbookFile([headers, ["Funder A", "Foundation", "Submitted"]])));

    expect(result).toEqual({ success: false, error: "Unauthorized", code: "UNAUTHENTICATED" });
    expect(mocks.funderFindMany).not.toHaveBeenCalled();
  });
});
