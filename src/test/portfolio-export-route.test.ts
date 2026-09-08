import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  class MockAuthorizationError extends Error {
    constructor(readonly code: "UNAUTHENTICATED" | "MISSING_LOCAL_USER") {
      super("Unauthorized");
      this.name = "AuthorizationError";
    }
  }

  return {
    getPortfolioExport: vi.fn(),
    requireAuthorization: vi.fn(),
    AuthorizationError: MockAuthorizationError,
  };
});

vi.mock("@/lib/queries/portfolio-export", () => ({ getPortfolioExport: mocks.getPortfolioExport }));
vi.mock("@/lib/clerk/authorization", () => ({
  AuthorizationError: mocks.AuthorizationError,
  requireAuthorization: mocks.requireAuthorization,
}));

import { GET } from "@/app/(authenticated)/(org-required)/export/portfolio/route";

describe("portfolio export Route Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-08T01:00:00.000Z"));
    mocks.getPortfolioExport.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a current-UTC CSV attachment with safe cache/content headers", async () => {
    const response = await GET(new Request("https://grantflow.test/export/portfolio?q=secret"));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("Content-Disposition")).toBe('attachment; filename="grantflow-portfolio-2026-09-08.csv"');
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect([...new Uint8Array(await response.arrayBuffer()).slice(0, 3)]).toEqual([0xEF, 0xBB, 0xBF]);
    expect(mocks.getPortfolioExport).toHaveBeenCalledWith();
    expect(mocks.requireAuthorization).not.toHaveBeenCalled();
  });

  it("returns the valid header-only attachment for an empty portfolio", async () => {
    const response = await GET(new Request("https://grantflow.test/export/portfolio"));

    expect(await response.text()).toBe("\"Grant title\",\"Funder name\",\"Funder type\",\"Funder website\",\"Funder county served\",\"Funder notes\",\"Status\",\"Amount requested\",\"Amount awarded\",\"Currency\",\"Deadline\",\"Decision date\",\"Award timeframe\",\"Designation\",\"County served\",\"Next steps\",\"Notes\",\"Tags\"");
    expect(response.status).toBe(200);
    expect(response.headers.has("Content-Disposition")).toBe(true);
  });

  it("ignores arbitrary query parameters rather than passing them to the export query", async () => {
    await GET(new Request("https://grantflow.test/export/portfolio?organizationId=other-org&status=Closed&page=99"));

    expect(mocks.getPortfolioExport).toHaveBeenCalledTimes(1);
    expect(mocks.getPortfolioExport).toHaveBeenCalledWith();
  });

  it("returns a generic non-attachment 401 for an AuthorizationError", async () => {
    mocks.getPortfolioExport.mockRejectedValue(new mocks.AuthorizationError("UNAUTHENTICATED"));

    const response = await GET(new Request("https://grantflow.test/export/portfolio"));

    expect(response.status).toBe(401);
    expect(await response.text()).toBe("Unable to export this portfolio.");
    expect(response.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.has("Content-Disposition")).toBe(false);
  });

  it("returns a generic non-attachment 500 without partial CSV for unexpected failures", async () => {
    mocks.getPortfolioExport.mockRejectedValue(new Error("database secret"));

    const response = await GET(new Request("https://grantflow.test/export/portfolio"));

    expect(response.status).toBe(500);
    expect(await response.text()).toBe("We could not export this portfolio. Please try again.");
    expect(response.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
    expect(response.headers.has("Content-Disposition")).toBe(false);
  });
});
