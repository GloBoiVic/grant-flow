// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { signUpMock } = vi.hoisted(() => ({
  signUpMock: vi.fn((props: { fallbackRedirectUrl?: string }) => {
    void props;
    return <div data-testid="sign-up" />;
  }),
}));

vi.mock("@clerk/nextjs", () => ({ SignUp: signUpMock }));

import SignUpPage from "@/app/(public)/sign-up/[[...sign-up]]/page";

describe("SignUpPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("falls back to organization onboarding after sign-up", () => {
    render(<SignUpPage />);

    expect(signUpMock).toHaveBeenCalled();
    expect(signUpMock.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ fallbackRedirectUrl: "/organization" }),
    );
  });
});
