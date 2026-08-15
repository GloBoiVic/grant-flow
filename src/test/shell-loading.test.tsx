// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ShellLoading } from "@/components/shared/shell-loading";
import Loading from "@/app/(authenticated)/(org-required)/loading";

describe("shell loading skeleton", () => {
  it("renders a labeled status region flagged as busy", () => {
    render(<ShellLoading />);

    const status = screen.getByRole("status", { name: "Loading GrantFlow" });
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading content")).toBeInTheDocument();
  });

  it("renders skeleton placeholders without content chrome", () => {
    render(<ShellLoading />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("complementary", { name: "Application sidebar" })).not.toBeInTheDocument();
  });
});

describe("org-required loading route", () => {
  it("delegates to the shared loading skeleton without duplicating shell chrome", () => {
    render(<Loading />);

    expect(screen.getByRole("status", { name: "Loading GrantFlow" })).toBeInTheDocument();
    expect(screen.queryByRole("complementary", { name: "Application sidebar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open navigation" })).not.toBeInTheDocument();
  });
});
