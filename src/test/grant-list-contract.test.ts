import { describe, expect, it } from "vitest";

import { grantListSearchParams, normalizeGrantListUrl } from "@/lib/queries/grant-list-contract";

describe("grant list URL contract", () => {
  it("normalizes invalid values and only keeps active tags", () => {
    const result = normalizeGrantListUrl({
      q: `  ${"x".repeat(120)}  `,
      status: ["Awarded", "not-a-status", "Awarded"],
      tag: ["active", "deleted", "active"],
      sort: "not-allowed",
      dir: "sideways",
      page: "0",
    }, ["active"]);

    expect(result).toEqual({ q: "x".repeat(100), statuses: ["Awarded"], tagIds: ["active"], sort: "deadline", direction: "asc", page: 1 });
  });

  it("supports repeated public status labels and bounded pages", () => {
    const result = normalizeGrantListUrl({ status: ["Internal Review", "Closed"], page: "10001", dir: "desc", sort: "funder" });
    expect(result.statuses).toEqual(["Internal Review", "Closed"]);
    expect(result.page).toBe(10_000);
    expect(grantListSearchParams(result)).toBe("status=Internal+Review&status=Closed&sort=funder&dir=desc&page=10000");
  });

  it("normalizes stale or invalid page values to the first page", () => {
    expect(normalizeGrantListUrl({ page: "999999999999", sort: "deadline", dir: "asc" }).page).toBe(10_000);
    expect(normalizeGrantListUrl({ page: "-4" }).page).toBe(1);
  });

  it("omits default deadline ascending state while preserving explicit descending state", () => {
    const ascending = normalizeGrantListUrl({ sort: "deadline", dir: "asc" });
    expect(grantListSearchParams(ascending)).toBe("");
    expect(grantListSearchParams({ ...ascending, direction: "desc" })).toBe("dir=desc");
  });
});
