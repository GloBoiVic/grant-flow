// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FeaturePlaceholder } from "@/components/shared/feature-placeholder";
import DashboardPage from "@/app/(authenticated)/(org-required)/dashboard/page";
import DeadlinesPage from "@/app/(authenticated)/(org-required)/deadlines/page";
import ImportPage from "@/app/(authenticated)/(org-required)/import/page";

describe("FeaturePlaceholder", () => {
  it("renders an honest Planned badge, title, and not-available copy", () => {
    render(<FeaturePlaceholder title="Grants" description="Coming soon." />);

    expect(screen.getByText("Planned")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Grants" })).toBeInTheDocument();
    expect(screen.getByText(/This GrantFlow feature is planned and is not available yet/)).toBeInTheDocument();
    expect(screen.getByText("Coming soon.")).toBeInTheDocument();
  });

  it("exposes no action buttons or fabricated controls", () => {
    render(<FeaturePlaceholder title="Grants" description="Coming soon." />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});

describe.each([
  ["Dashboard", DashboardPage, "Dashboard"],
  ["Deadlines", DeadlinesPage, "Deadlines"],
  ["Import", ImportPage, "Import"],
])("%s placeholder route", (_name, Page, title) => {
  it("renders the honest placeholder with no fabricated records or values", () => {
    const { container } = render(<Page />);

    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getByText("Planned")).toBeInTheDocument();
    expect(screen.getByText(/not available yet/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    // No fabricated numbers, status values, tables, or filters.
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/\$\d/);
    expect(text).not.toMatch(/Research|Qualified|Awarded|Submitted/);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});
