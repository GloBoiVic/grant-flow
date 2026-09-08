// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardContent } from "@/components/dashboard/dashboard-content";
import type { DashboardDto } from "@/types/dashboard";

function makeDto(overrides: Partial<DashboardDto> = {}): DashboardDto {
  const base: DashboardDto = {
    asOf: "2026-09-04",
    totals: {
      trackedGrants: 5,
      openPipeline: 3,
      requestedTotal: "1234.50",
      awardedTotal: "567.00",
      currency: "USD",
    },
    attention: {
      overdueCount: 1,
      dueIn7Count: 2,
      oldestOverdueDays: 1,
    },
    upcoming: [
      { id: "grant-1", title: "Alpha", funderName: "Funder A", deadline: "2026-09-04", status: "Research" },
      { id: "grant-2", title: "Beta", funderName: "Funder B", deadline: "2026-09-05", status: "Qualified" },
    ],
    breakdown: [
      { status: "Research", count: 1 },
      { status: "Qualified", count: 1 },
      { status: "Planning", count: 0 },
      { status: "Writing", count: 1 },
      { status: "Internal Review", count: 0 },
      { status: "Submitted", count: 1 },
      { status: "Pending", count: 0 },
      { status: "Awarded", count: 1 },
      { status: "Declined", count: 0 },
      { status: "Reporting", count: 0 },
      { status: "Closed", count: 0 },
    ],
    ...overrides,
  };
  // Allow overriding nested totals/attention/breakdown via overrides
  if (overrides.totals) base.totals = { ...base.totals, ...overrides.totals };
  if (overrides.attention) base.attention = { ...base.attention, ...overrides.attention };
  if (overrides.breakdown) base.breakdown = overrides.breakdown;
  if (overrides.upcoming) base.upcoming = overrides.upcoming;
  return base;
}

describe("DashboardContent", () => {
  it("renders four sections with correct heading hierarchy", () => {
    render(<DashboardContent dto={makeDto()} />);
    expect(screen.getByRole("heading", { level: 1, name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Portfolio totals" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Needs attention" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Upcoming deadlines" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Status breakdown" })).toBeInTheDocument();
  });

  it("formats totals as USD and links tracked/open pipeline correctly", () => {
    render(<DashboardContent dto={makeDto()} />);
    // Requested $1,234.50 and Awarded $567.00
    expect(screen.getByText("$1,234.50")).toBeInTheDocument();
    expect(screen.getByText("$567.00")).toBeInTheDocument();

    const trackedLink = screen.getByRole("link", { name: "View all grants →" });
    expect(trackedLink).toHaveAttribute("href", "/grants");

    const pipelineLink = screen.getByRole("link", { name: "View open pipeline →" });
    const href = pipelineLink.getAttribute("href") ?? "";
    expect(href.startsWith("/grants?")).toBe(true);
    const url = new URL(href, "http://localhost");
    expect(url.searchParams.getAll("status")).toEqual([
      "Research",
      "Qualified",
      "Planning",
      "Writing",
      "Internal Review",
      "Submitted",
      "Pending",
    ]);
    // No unsupported params
    expect(url.searchParams.has("overdue")).toBe(false);
    expect(url.searchParams.has("dueWithin")).toBe(false);
    expect(url.searchParams.has("deadlineWindow")).toBe(false);
  });

  it("shows overdue and due-within counts and honest continuation link", () => {
    render(<DashboardContent dto={makeDto()} />);
    expect(screen.getByText("Overdue: 1")).toBeInTheDocument();
    expect(screen.getByText("Oldest overdue: 1 day")).toBeInTheDocument();
    expect(screen.getByText("Due within 7 days: 2")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Review pre-submission deadlines →" });
    expect(link).toBeInTheDocument();
    const href = link.getAttribute("href") ?? "";
    const url = new URL(href, "http://localhost");
    expect(url.searchParams.getAll("status")).toEqual([
      "Research",
      "Qualified",
      "Planning",
      "Writing",
      "Internal Review",
    ]);
    // Must not be labeled as View overdue / View due in 7 days
    expect(screen.queryByRole("link", { name: /View overdue/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /View due in 7 days/i })).not.toBeInTheDocument();
    // No invented params
    expect(url.searchParams.has("overdue")).toBe(false);
    expect(url.searchParams.has("dueWithin")).toBe(false);
  });

  it("renders upcoming deadlines with ?grant= links, badge, and honest continuation", () => {
    const dto = makeDto({
      upcoming: [
        { id: "g1", title: "Alpha Grant", funderName: "Funder A", deadline: "2026-09-04", status: "Research" },
        { id: "g2", title: "Beta Grant", funderName: "Funder B", deadline: "2026-09-05", status: "Internal Review" },
      ],
    });
    render(<DashboardContent dto={dto} />);
    // Each upcoming row links to /grants?grant=<id>
    const alphaLink = screen.getByRole("link", { name: "Alpha Grant" });
    expect(alphaLink).toHaveAttribute("href", "/grants?grant=g1");
    const betaLink = screen.getByRole("link", { name: "Beta Grant" });
    expect(betaLink).toHaveAttribute("href", "/grants?grant=g2");
    // Deadline formatted contains year 2026 (UTC formatting)
    expect(screen.getByText(/Sep 4, 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Sep 5, 2026/)).toBeInTheDocument();
    // Status badges within upcoming section
    const upcomingList = screen.getByLabelText("Upcoming deadlines list");
    expect(within(upcomingList).getByText("Research")).toBeInTheDocument();
    expect(within(upcomingList).getByText("Internal Review")).toBeInTheDocument();
    // Upcoming continuation
    const reviewLink = screen.getByRole("link", { name: "Review grant deadlines →" });
    expect(reviewLink).toBeInTheDocument();
    const revUrl = new URL(reviewLink.getAttribute("href") ?? "", "http://localhost");
    expect(revUrl.searchParams.getAll("status")).toEqual([
      "Research",
      "Qualified",
      "Planning",
      "Writing",
      "Internal Review",
    ]);
  });

  it("limits upcoming to at most 5 and ensures no overdue preview table", () => {
    const five = Array.from({ length: 5 }, (_, i) => ({
      id: `g${i}`,
      title: `Grant ${i}`,
      funderName: `Funder ${i}`,
      deadline: "2026-09-05",
      status: "Research" as const,
    }));
    render(<DashboardContent dto={makeDto({ upcoming: five })} />);
    const upcomingList = screen.getByLabelText("Upcoming deadlines list");
    const links = within(upcomingList).getAllByRole("link", { name: /Grant \d/ });
    expect(links).toHaveLength(5);
    for (const link of links) {
      expect(link.getAttribute("href")).toMatch(/\/grants\?grant=g\d/);
    }
    // No fabricated overdue table — only upcoming list exists
    expect(screen.queryByText(/overdue Grant/i)).not.toBeInTheDocument();
  });

  it("status breakdown shows all 11 statuses in lifecycle order with correct links", () => {
    render(<DashboardContent dto={makeDto()} />);
    const breakdownSection = screen.getByLabelText("Status breakdown list");
    const items = within(breakdownSection).getAllByRole("listitem");
    expect(items).toHaveLength(11);
    const statuses = within(breakdownSection).getAllByRole("link").map((a) => a.textContent);
    expect(statuses).toEqual([
      "Research",
      "Qualified",
      "Planning",
      "Writing",
      "Internal Review",
      "Submitted",
      "Pending",
      "Awarded",
      "Declined",
      "Reporting",
      "Closed",
    ]);
    // Each link uses supported ?status= param
    for (const link of within(breakdownSection).getAllByRole("link")) {
      const href = link.getAttribute("href") ?? "";
      const url = new URL(href, "http://localhost");
      expect(url.pathname).toBe("/grants");
      expect(url.searchParams.getAll("status")).toHaveLength(1);
      expect(url.searchParams.has("overdue")).toBe(false);
      expect(url.searchParams.get("status")).toBe(link.textContent);
    }
    // Internal Review correctly encoded (space as + via URLSearchParams)
    const internalLink = screen.getByRole("link", { name: "Internal Review" });
    const internalHref = internalLink.getAttribute("href") ?? "";
    expect(internalHref).toMatch(/Internal(\+|%20)Review/);
    const internalUrl = new URL(internalHref, "http://localhost");
    expect(internalUrl.searchParams.get("status")).toBe("Internal Review");
  });

  it("handles no tracked grants empty state", () => {
    const dto = makeDto({
      totals: { trackedGrants: 0, openPipeline: 0, requestedTotal: "0", awardedTotal: "0", currency: "USD" },
      attention: { overdueCount: 0, dueIn7Count: 0, oldestOverdueDays: null },
      upcoming: [],
      breakdown: [
        { status: "Research", count: 0 },
        { status: "Qualified", count: 0 },
        { status: "Planning", count: 0 },
        { status: "Writing", count: 0 },
        { status: "Internal Review", count: 0 },
        { status: "Submitted", count: 0 },
        { status: "Pending", count: 0 },
        { status: "Awarded", count: 0 },
        { status: "Declined", count: 0 },
        { status: "Reporting", count: 0 },
        { status: "Closed", count: 0 },
      ],
    });
    render(<DashboardContent dto={dto} />);
    expect(screen.getAllByText("$0.00").length).toBeGreaterThanOrEqual(2);
    // Shows next-step to /import and /grants
    expect(screen.getByRole("link", { name: "/import" })).toHaveAttribute("href", "/import");
    // The /grants link for next step — there are multiple /grants links, ensure at least one present
    expect(screen.getAllByRole("link", { name: "/grants" }).length).toBeGreaterThanOrEqual(1);
    // Empty state message
    expect(screen.getByText(/No grants tracked yet/)).toBeInTheDocument();
    // No amount caption when no grants? Should NOT show caption because tracked=0
    expect(screen.queryByText("No requested/awarded amounts recorded yet.")).not.toBeInTheDocument();
  });

  it("shows muted caption when grants exist but no amounts", () => {
    const dto = makeDto({
      totals: { trackedGrants: 3, openPipeline: 2, requestedTotal: "0", awardedTotal: "0", currency: "USD" },
    });
    render(<DashboardContent dto={dto} />);
    expect(screen.getByText("No requested/awarded amounts recorded yet.")).toBeInTheDocument();
    // Totals still $0.00
    expect(screen.getAllByText("$0.00")).toHaveLength(2);
  });

  it("does not show amount caption when amounts exist", () => {
    render(<DashboardContent dto={makeDto()} />);
    expect(screen.queryByText("No requested/awarded amounts recorded yet.")).not.toBeInTheDocument();
  });

  it("shows no-attention text when both counts zero", () => {
    render(<DashboardContent dto={makeDto({ attention: { overdueCount: 0, dueIn7Count: 0, oldestOverdueDays: null } })} />);
    expect(screen.getByText("Overdue: 0")).toBeInTheDocument();
    expect(screen.getByText("Due within 7 days: 0")).toBeInTheDocument();
    expect(screen.queryByText(/Oldest overdue/)).not.toBeInTheDocument();
    expect(screen.getByText("No pre-submission application deadlines need attention.")).toBeInTheDocument();
  });

  it("renders plural oldest overdue age only for the overdue tile", () => {
    render(<DashboardContent dto={makeDto({ attention: { overdueCount: 2, dueIn7Count: 0, oldestOverdueDays: 34 } })} />);

    const age = screen.getByText("Oldest overdue: 34 days");
    expect(age).toBeInTheDocument();
    expect(age.parentElement).toContainElement(screen.getByText("Overdue: 2"));
    expect(screen.getByText("Due within 7 days: 0")).toBeInTheDocument();
  });

  it("does not show no-attention text when counts non-zero", () => {
    render(<DashboardContent dto={makeDto()} />);
    expect(screen.queryByText("No pre-submission application deadlines need attention.")).not.toBeInTheDocument();
  });

  it("shows no-upcoming text when empty and keeps section visible", () => {
    render(<DashboardContent dto={makeDto({ upcoming: [] })} />);
    expect(screen.getByText("No pre-submission deadlines in the next 30 days.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Upcoming deadlines" })).toBeInTheDocument();
    // Still has continuation link
    expect(screen.getByRole("link", { name: "Review grant deadlines →" })).toBeInTheDocument();
  });

  it("shows all-zero breakdown counts", () => {
    const zeroBreakdown = [
      { status: "Research" as const, count: 0 },
      { status: "Qualified" as const, count: 0 },
      { status: "Planning" as const, count: 0 },
      { status: "Writing" as const, count: 0 },
      { status: "Internal Review" as const, count: 0 },
      { status: "Submitted" as const, count: 0 },
      { status: "Pending" as const, count: 0 },
      { status: "Awarded" as const, count: 0 },
      { status: "Declined" as const, count: 0 },
      { status: "Reporting" as const, count: 0 },
      { status: "Closed" as const, count: 0 },
    ];
    render(<DashboardContent dto={makeDto({ breakdown: zeroBreakdown })} />);
    const breakdownSection = screen.getByLabelText("Status breakdown list");
    const counts = within(breakdownSection)
      .getAllByText("0")
      .filter((el) => el.tagName === "SPAN");
    expect(counts.length).toBe(11);
  });

  it("uses accessible link names and no unsupported params anywhere", () => {
    render(<DashboardContent dto={makeDto()} />);
    const allLinks = screen.getAllByRole("link");
    for (const link of allLinks) {
      expect(link.textContent?.trim().length).toBeGreaterThan(0);
      const href = link.getAttribute("href") ?? "";
      if (href.startsWith("/grants")) {
        const url = new URL(href, "http://localhost");
        expect(url.searchParams.has("overdue")).toBe(false);
        expect(url.searchParams.has("dueWithin")).toBe(false);
        expect(url.searchParams.has("deadlineWindow")).toBe(false);
        // Must not link to /deadlines
        expect(url.pathname).not.toBe("/deadlines");
      }
      // No link points to /deadlines
      expect(link.getAttribute("href")).not.toBe("/deadlines");
    }
    // Ensure no link directly targets /deadlines
    const deadlinesLinks = allLinks.filter((a) => (a.getAttribute("href") ?? "") === "/deadlines");
    expect(deadlinesLinks).toHaveLength(0);
    // Honest continuation links exist (contain deadlines word but point to /grants)
    expect(screen.getByRole("link", { name: "Review pre-submission deadlines →" })).toHaveAttribute(
      "href",
      expect.stringContaining("/grants"),
    );
    expect(screen.getByRole("link", { name: "Review grant deadlines →" })).toHaveAttribute(
      "href",
      expect.stringContaining("/grants"),
    );
  });

  it("renders zero totals as $0.00 not null or em dash", () => {
    const dto = makeDto({
      totals: { trackedGrants: 0, openPipeline: 0, requestedTotal: "0", awardedTotal: "0", currency: "USD" },
      upcoming: [],
      attention: { overdueCount: 0, dueIn7Count: 0, oldestOverdueDays: null },
    });
    render(<DashboardContent dto={dto} />);
    expect(screen.getAllByText("$0.00").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("—")).not.toBeInTheDocument();
    expect(screen.queryByText("null")).not.toBeInTheDocument();
  });
});
