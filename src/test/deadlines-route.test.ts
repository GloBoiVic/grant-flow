import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDeadlineView: vi.fn(),
  DeadlineView: vi.fn(),
}));

vi.mock("@/lib/queries/deadlines", () => ({ getDeadlineView: mocks.getDeadlineView }));
vi.mock("@/components/deadlines/deadline-view", () => ({ DeadlineView: mocks.DeadlineView }));

import DeadlinesPage from "@/app/(authenticated)/(org-required)/deadlines/page";

describe("deadlines route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getDeadlineView.mockResolvedValue({
      asOf: "2026-09-04",
      trackedGrantCount: 0,
      groups: { overdue: [], dueSoon: [], later: [] },
    });
    mocks.DeadlineView.mockReturnValue(null);
  });

  it("calls the server-owned query without client input and passes its DTO to the view", async () => {
    const page = await DeadlinesPage();
    const dto = { asOf: "2026-09-04", trackedGrantCount: 0, groups: { overdue: [], dueSoon: [], later: [] } };

    expect(mocks.getDeadlineView).toHaveBeenCalledWith();
    expect(page).toMatchObject({ props: { dto } });
  });
});
