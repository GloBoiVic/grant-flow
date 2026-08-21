// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { signInMock } = vi.hoisted(() => ({
  signInMock: vi.fn((props: { fallbackRedirectUrl?: string }) => {
    void props;
    return <div data-testid="sign-in" />;
  }),
}));

vi.mock("@clerk/nextjs", () => ({ SignIn: signInMock }));

import LoginPage from "@/app/(public)/login/[[...sign-in]]/page";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("falls back to the root route after sign-in", () => {
    render(<LoginPage />);

    expect(signInMock).toHaveBeenCalled();
    expect(signInMock.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ fallbackRedirectUrl: "/" }),
    );
  });
});
