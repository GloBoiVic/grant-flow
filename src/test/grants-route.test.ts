import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((path: string): never => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  listFunders: vi.fn(),
  listTags: vi.fn(),
  listGrants: vi.fn(),
  getGrant: vi.fn(),
  GrantsPage: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/components/grants/grants-page", () => ({ GrantsPage: mocks.GrantsPage }));
vi.mock("@/lib/queries/funders", () => ({ listFunders: mocks.listFunders }));
vi.mock("@/lib/queries/tags", () => ({ listTags: mocks.listTags }));
vi.mock("@/lib/queries/grants", () => ({ listGrants: mocks.listGrants, getGrant: mocks.getGrant }));

import GrantsRoute from "@/app/(authenticated)/(org-required)/grants/page";

describe("grants route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listFunders.mockResolvedValue({ items: [] });
    mocks.listTags.mockResolvedValue({ items: [{ id: "tag-housing", name: "Housing" }] });
    mocks.listGrants.mockResolvedValue({ items: [], page: 3, hasNextPage: false, hasPreviousPage: true });
  });

  it("redirects an empty out-of-range page to page 1 while preserving Sheet and list state", async () => {
    const searchParams = {
      q: "Housing",
      status: ["Research", "Awarded"],
      tag: "tag-housing",
      sort: "funder",
      dir: "desc",
      page: "3",
      grant: "grant-123",
      create: "1",
    };

    await expect(GrantsRoute({ searchParams: Promise.resolve(searchParams) })).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.listGrants).toHaveBeenCalledWith({
      q: "Housing",
      statuses: ["Research", "Awarded"],
      tagIds: ["tag-housing"],
      sort: "funder",
      direction: "desc",
      page: 3,
    });
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/grants?q=Housing&status=Research&status=Awarded&tag=tag-housing&sort=funder&dir=desc&grant=grant-123&create=1",
    );
    expect(mocks.GrantsPage).not.toHaveBeenCalled();
    expect(mocks.getGrant).not.toHaveBeenCalled();
  });
});
