import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  notFound: vi.fn((): never => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  getGrant: vi.fn(),
  listFunders: vi.fn(),
  listTags: vi.fn(),
  GrantWorkspace: vi.fn(),
}));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("@/components/grants/grant-workspace", () => ({ GrantWorkspace: mocks.GrantWorkspace }));
vi.mock("@/lib/queries/funders", () => ({ listFunders: mocks.listFunders }));
vi.mock("@/lib/queries/grants", () => ({ getGrant: mocks.getGrant }));
vi.mock("@/lib/queries/tags", () => ({ listTags: mocks.listTags }));

import GrantWorkspaceRoute from "@/app/(authenticated)/(org-required)/grants/[grantId]/page";

const grant = {
  id: "00000000-0000-0000-0000-000000000123",
  funderId: "00000000-0000-0000-0000-000000000124",
  title: "Community Grant",
  status: "Research",
  currency: "USD",
  amountRequested: "1000.00",
  amountAwarded: null,
  deadline: null,
  decisionDate: null,
  awardTimeframe: null,
  designation: null,
  countyServed: null,
  nextSteps: null,
  notes: null,
  ownerId: null,
  createdById: "user-123",
  createdAt: "2026-08-20T00:00:00.000Z",
  updatedAt: "2026-08-20T00:00:00.000Z",
  tags: [],
  funder: {
    id: "00000000-0000-0000-0000-000000000124",
    name: "Community Funder",
    type: "FOUNDATION",
    website: null,
    createdAt: "2026-08-20T00:00:00.000Z",
    updatedAt: "2026-08-20T00:00:00.000Z",
  },
  activities: [],
};

describe("grant workspace route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.GrantWorkspace.mockReturnValue(null);
    mocks.listFunders.mockResolvedValue({ items: [{ id: "funder-123", name: "Community Funder", type: "FOUNDATION", website: null, createdAt: "2026-08-20T00:00:00.000Z", updatedAt: "2026-08-20T00:00:00.000Z" }] });
    mocks.listTags.mockResolvedValue({ items: [{ id: "tag-123", name: "Housing" }] });
  });

  it("awaits params, loads the authorized Grant, then passes the complete DTO and options to the workspace", async () => {
    const events: string[] = [];
    const grantId = "00000000-0000-0000-0000-000000000123";
    mocks.getGrant.mockImplementation(async (grantId: string) => {
      events.push(`grant:${grantId}`);
      return grant;
    });
    mocks.listFunders.mockImplementation(async () => {
      events.push("funders");
      return { items: [] };
    });
    mocks.listTags.mockImplementation(async () => {
      events.push("tags");
      return { items: [] };
    });

    const page = await GrantWorkspaceRoute({ params: Promise.resolve({ grantId }) });

    expect(events).toEqual([`grant:${grantId}`, "funders", "tags"]);
    expect(mocks.getGrant).toHaveBeenCalledWith(grantId);
    expect(mocks.listFunders).toHaveBeenCalledWith();
    expect(mocks.listTags).toHaveBeenCalledWith();
    expect(page).toMatchObject({ props: { grant, funders: [], tags: [] } });
  });

  it("not-found short-circuits before loading funder or tag options", async () => {
    mocks.getGrant.mockResolvedValue(null);

    await expect(GrantWorkspaceRoute({ params: Promise.resolve({ grantId: "00000000-0000-0000-0000-000000000099" }) })).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mocks.notFound).toHaveBeenCalledWith();
    expect(mocks.listFunders).not.toHaveBeenCalled();
    expect(mocks.listTags).not.toHaveBeenCalled();
    expect(mocks.GrantWorkspace).not.toHaveBeenCalled();
  });

  it("uses not-found for malformed Grant IDs before querying or loading options", async () => {
    await expect(GrantWorkspaceRoute({ params: Promise.resolve({ grantId: "not-a-real-grant" }) })).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mocks.notFound).toHaveBeenCalledWith();
    expect(mocks.getGrant).not.toHaveBeenCalled();
    expect(mocks.listFunders).not.toHaveBeenCalled();
    expect(mocks.listTags).not.toHaveBeenCalled();
    expect(mocks.GrantWorkspace).not.toHaveBeenCalled();
  });
});
