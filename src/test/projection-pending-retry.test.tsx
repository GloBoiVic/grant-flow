// @vitest-environment jsdom
import { StrictMode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const refreshMock = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

import ProjectionPendingRetry from "@/components/auth/projection-pending-retry";

const TWO_SECONDS = 2000;

const advance = (ms: number): void => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

describe("ProjectionPendingRetry", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    refreshMock.mockClear();
    // Only fake the timers the component uses; leave microtasks/Date real so
    // React's act() scheduling and RTL internals keep working.
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("performs exactly five automatic refreshes at a two-second cadence", () => {
    render(<ProjectionPendingRetry />);
    expect(refreshMock).not.toHaveBeenCalled();

    for (let refresh = 1; refresh <= 5; refresh += 1) {
      advance(TWO_SECONDS);
      expect(refreshMock).toHaveBeenCalledTimes(refresh);
    }
  });

  it("never schedules a sixth automatic refresh", () => {
    render(<ProjectionPendingRetry />);
    advance(TWO_SECONDS * 6);
    expect(refreshMock).toHaveBeenCalledTimes(5);
    advance(TWO_SECONDS * 10);
    expect(refreshMock).toHaveBeenCalledTimes(5);
  });

  it("persists the attempt budget across remounts via sessionStorage", () => {
    const { unmount } = render(<ProjectionPendingRetry />);
    advance(TWO_SECONDS * 2);
    expect(refreshMock).toHaveBeenCalledTimes(2);
    unmount();

    render(<ProjectionPendingRetry />);
    advance(TWO_SECONDS * 2);
    expect(refreshMock).toHaveBeenCalledTimes(4);
    advance(TWO_SECONDS * 2);
    expect(refreshMock).toHaveBeenCalledTimes(5);
    advance(TWO_SECONDS * 4);
    expect(refreshMock).toHaveBeenCalledTimes(5);
  });

  it("cleans up pending timers on unmount", () => {
    const { unmount } = render(<ProjectionPendingRetry />);
    advance(TWO_SECONDS - 500);
    expect(refreshMock).not.toHaveBeenCalled();
    unmount();
    advance(TWO_SECONDS * 10);
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("performs one manual refresh and stops all automatic retries", () => {
    render(<ProjectionPendingRetry />);
    advance(TWO_SECONDS - 500);
    fireEvent.click(screen.getByRole("button", { name: "Check again" }));
    expect(refreshMock).toHaveBeenCalledTimes(1);
    advance(TWO_SECONDS * 12);
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("keeps automatic retries paused across remounts after a manual check", () => {
    const { unmount } = render(<ProjectionPendingRetry />);
    fireEvent.click(screen.getByRole("button", { name: "Check again" }));
    expect(refreshMock).toHaveBeenCalledTimes(1);
    unmount();

    render(<ProjectionPendingRetry />);
    advance(TWO_SECONDS * 12);
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("starts reliably under React StrictMode and stays bounded at five", () => {
    render(
      <StrictMode>
        <ProjectionPendingRetry />
      </StrictMode>,
    );
    advance(TWO_SECONDS);
    expect(refreshMock).toHaveBeenCalledTimes(1);
    advance(TWO_SECONDS * 4);
    expect(refreshMock).toHaveBeenCalledTimes(5);
    advance(TWO_SECONDS * 6);
    expect(refreshMock).toHaveBeenCalledTimes(5);
  });

  it("pauses automatic checks and updates the copy after exhaustion", () => {
    render(<ProjectionPendingRetry />);
    expect(screen.getByText(/will check again automatically/)).toBeInTheDocument();

    advance(TWO_SECONDS * 5);
    expect(refreshMock).toHaveBeenCalledTimes(5);
    expect(screen.getByText(/Automatic checks have paused/)).toBeInTheDocument();
    expect(screen.queryByText(/will check again automatically/)).not.toBeInTheDocument();
  });

  it("updates the copy after a manual check", () => {
    render(<ProjectionPendingRetry />);
    expect(screen.getByText(/will check again automatically/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Check again" }));
    expect(screen.getByText(/Automatic checks have paused/)).toBeInTheDocument();
    expect(screen.queryByText(/will check again automatically/)).not.toBeInTheDocument();
  });
});