"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const ATTEMPT_KEY = "grantflow:projection-pending-refresh-attempts";
const MANUAL_CHECK_KEY = "grantflow:projection-pending-manual-check";
const MAX_AUTOMATIC_ATTEMPTS = 5;
const REFRESH_DELAY_MS = 2000;

function readAttemptCount(): number {
  const stored = window.sessionStorage.getItem(ATTEMPT_KEY);
  const attempts = stored === null ? 0 : Number.parseInt(stored, 10);
  return Number.isFinite(attempts) && attempts >= 0 ? attempts : 0;
}

function saveAttemptCount(attempts: number): void {
  window.sessionStorage.setItem(ATTEMPT_KEY, String(attempts));
}

function hasManualCheck(): boolean {
  return window.sessionStorage.getItem(MANUAL_CHECK_KEY) === "1";
}

function saveManualCheck(): void {
  window.sessionStorage.setItem(MANUAL_CHECK_KEY, "1");
}

export default function ProjectionPendingRetry(): React.ReactNode {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const automaticRefreshesEnabled = useRef(true);
  const [automaticChecksActive, setAutomaticChecksActive] = useState(true);

  useEffect(() => {
    // StrictMode re-runs this effect on the same instance; the flag must be
    // reset on every pass so automatic retries start reliably in dev. The
    // cleanup only clears the pending timer — it must not disable the flag.
    automaticRefreshesEnabled.current = !hasManualCheck();

    const scheduleNextRefresh = (): void => {
      if (!automaticRefreshesEnabled.current || readAttemptCount() >= MAX_AUTOMATIC_ATTEMPTS) {
        setAutomaticChecksActive(false);
        return;
      }

      timerRef.current = setTimeout(() => {
        if (!automaticRefreshesEnabled.current) return;
        const nextAttempt = readAttemptCount() + 1;
        saveAttemptCount(nextAttempt);
        router.refresh();
        scheduleNextRefresh();
      }, REFRESH_DELAY_MS);
    };

    scheduleNextRefresh();

    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [router]);

  const checkAgain = (): void => {
    automaticRefreshesEnabled.current = false;
    saveManualCheck();
    setAutomaticChecksActive(false);
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = null;
    router.refresh();
  };

  return (
    <>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {automaticChecksActive
          ? "Your access is still being set up. This page will check again automatically."
          : "Your access is still being set up. Automatic checks have paused — use “Check again” to retry."}
      </p>
      <button
        type="button"
        onClick={checkAgain}
        className="mt-5 h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Check again"
      >
        Check again
      </button>
    </>
  );
}