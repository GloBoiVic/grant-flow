// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DeadlineView } from "@/components/deadlines/deadline-view";
import type { DeadlineViewDto } from "@/types/deadline";

const baseDto: DeadlineViewDto = {
  asOf: "2026-09-04",
  trackedGrantCount: 3,
  groups: {
    overdue: [{ id: "grant/overdue", title: "Overdue Grant", funderName: "North Star Foundation", deadline: "2026-09-03", status: "Research" }],
    dueSoon: [{ id: "grant due soon", title: "Due Soon Grant", funderName: "Community Fund", deadline: "2026-09-11", status: "Internal Review" }],
    later: [{ id: "grant-later", title: "Later Grant", funderName: "Future Foundation", deadline: "2026-09-12", status: "Writing" }],
  },
};

describe("DeadlineView", () => {
  it("renders the fixed heading hierarchy, grouped order, row details, and Sheet deep-links", () => {
    render(<DeadlineView dto={baseDto} />);

    expect(screen.getAllByRole("heading").map((heading) => heading.textContent)).toEqual([
      "Deadlines",
      "Overdue",
      "Due in the next 7 days",
      "Later in the next 30 days",
    ]);
    expect(screen.getByRole("heading", { level: 1, name: "Deadlines" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(3);
    expect(screen.getByText("As of September 4, 2026")).toBeInTheDocument();
    expect(screen.queryByText("Review pre-submission application deadlines and the work that needs attention.")).not.toBeInTheDocument();

    const overdueSection = screen.getByRole("region", { name: "Overdue" });
    const dueSoonSection = screen.getByRole("region", { name: "Due in the next 7 days" });
    const laterSection = screen.getByRole("region", { name: "Later in the next 30 days" });
    expect(overdueSection.parentElement).toHaveClass("border");
    expect(overdueSection.parentElement).not.toHaveClass("shadow-sm");
    expect(overdueSection.parentElement?.parentElement).toHaveClass("max-w-7xl");
    expect(screen.getByRole("heading", { name: "Overdue" }).parentElement).toHaveClass("py-5");
    expect(within(overdueSection).getByRole("listitem")).toHaveClass("py-4");
    expect(within(overdueSection).getByRole("list")).toBeInTheDocument();
    expect(within(dueSoonSection).getByRole("list")).toBeInTheDocument();
    expect(within(laterSection).getByRole("list")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Overdue Grant" })).toHaveAttribute("href", "/grants?grant=grant%2Foverdue");
    expect(screen.getByRole("link", { name: "Overdue Grant" })).toHaveClass("focus-visible:outline-2");
    expect(screen.getByRole("link", { name: "Due Soon Grant" })).toHaveAttribute("href", "/grants?grant=grant%20due%20soon");
    expect(screen.getByText("North Star Foundation")).toBeInTheDocument();
    expect(screen.getByText("Sep 3, 2026")).toHaveAttribute("dateTime", "2026-09-03");
    expect(screen.getByText("Internal Review")).toHaveClass("bg-status-in-progress", "text-status-in-progress-fg");
  });

  it("keeps groups and honest empty states visible for an empty portfolio", () => {
    render(<DeadlineView dto={{ asOf: "2026-09-04", trackedGrantCount: 0, groups: { overdue: [], dueSoon: [], later: [] } }} />);

    expect(screen.getByText("No grants tracked yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Import a spreadsheet" })).toHaveAttribute("href", "/import");
    expect(screen.getByRole("link", { name: "add a grant" })).toHaveAttribute("href", "/grants");
    expect(screen.getByText("No overdue deadlines.")).toBeInTheDocument();
    expect(screen.getByText("No deadlines due in the next 7 days.")).toBeInTheDocument();
    expect(screen.getByText("No other pre-submission deadlines in the next 30 days.")).toBeInTheDocument();
    expect(screen.getAllByRole("list")).toHaveLength(3);
  });

  it("distinguishes a portfolio with no eligible deadline rows", () => {
    render(<DeadlineView dto={{ asOf: "2026-09-04", trackedGrantCount: 4, groups: { overdue: [], dueSoon: [], later: [] } }} />);

    expect(screen.getByText("No eligible deadlines are currently in view.")).toBeInTheDocument();
    expect(screen.getByText("Deadlines here include only Research, Qualified, Planning, Writing, and Internal Review grants.")).toBeInTheDocument();
    expect(screen.queryByText(/no deadlines are recorded/i)).not.toBeInTheDocument();
  });

  it("keeps partial groups chronological and handles long text without overflow-prone markup", () => {
    const longTitle = "A grant title with enough detail to wrap safely on a narrow screen";
    const longFunder = "A funder name with enough detail to wrap safely on a narrow screen";
    render(
      <DeadlineView
        dto={{
          ...baseDto,
          groups: {
            overdue: [],
            dueSoon: [{ ...baseDto.groups.dueSoon[0], title: longTitle, funderName: longFunder }],
            later: [],
          },
        }}
      />,
    );

    expect(screen.getByText("No overdue deadlines.")).toBeInTheDocument();
    expect(screen.getByText("No other pre-submission deadlines in the next 30 days.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: longTitle })).toHaveClass("break-words");
    expect(screen.getByText(longFunder)).toHaveClass("break-words");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link").every((link) => !link.getAttribute("href")?.startsWith("/deadlines"))).toBe(true);
  });
});
