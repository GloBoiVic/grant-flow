// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FeaturePlaceholder } from "@/components/shared/feature-placeholder";

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
