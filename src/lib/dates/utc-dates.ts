/**
 * Minimal UTC date-only helpers for dashboard deadline windows.
 * Frozen contract:
 *   today   = current UTC calendar date at 00:00:00Z
 *   overdue = deadline < today
 *   next7   = today <= deadline <= today+7
 *   next30  = today <= deadline <= today+30
 * Null deadlines are excluded.
 * Keep this small; not a generic date library.
 */

/** Convert any wall-clock Date to UTC date-only midnight (00:00:00Z). */
export function toUtcDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Add UTC calendar days to a date-only Date. */
export function addUtcDays(date: Date, days: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
}

/** Serialize a date-only Date as YYYY-MM-DD. */
export function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Derive current UTC today (date-only midnight) from server clock. */
export function utcToday(): Date {
  return toUtcDateOnly(new Date());
}
