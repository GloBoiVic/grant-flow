// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import OrganizationRequiredError from "@/app/(authenticated)/(org-required)/error";

describe("org-required error recovery", () => {
  it("renders an accessible alert with recovery copy", () => {
    render(<OrganizationRequiredError reset={() => {}} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "We couldn't load this page" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("calls reset when Try again is activated", () => {
    const reset = vi.fn();
    render(<OrganizationRequiredError reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("renders no shell chrome in the recovery panel", () => {
    render(<OrganizationRequiredError reset={() => {}} />);

    expect(screen.queryByRole("complementary", { name: "Application sidebar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open navigation" })).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Primary navigation" })).not.toBeInTheDocument();
  });
});
