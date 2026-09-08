import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { DeadlineItem, DeadlineViewDto } from "@/types/deadline";

const statusClass: Record<string, string> = {
  Research: "bg-status-to-apply text-status-to-apply-fg",
  Qualified: "bg-status-to-apply text-status-to-apply-fg",
  Planning: "bg-status-in-progress text-status-in-progress-fg",
  Writing: "bg-status-in-progress text-status-in-progress-fg",
  "Internal Review": "bg-status-in-progress text-status-in-progress-fg",
};

const groupConfig = [
  {
    key: "overdue",
    heading: "Overdue",
    emptyMessage: "No overdue deadlines.",
    sectionClass: "",
    headingClass: "text-destructive",
    rowClass: "hover:bg-destructive-soft/50",
  },
  {
    key: "dueSoon",
    heading: "Due in the next 7 days",
    emptyMessage: "No deadlines due in the next 7 days.",
    sectionClass: "border-t border-border",
    headingClass: "text-urgency-soon-fg",
    rowClass: "hover:bg-urgency-soon/20",
  },
  {
    key: "later",
    heading: "Later in the next 30 days",
    emptyMessage: "No other pre-submission deadlines in the next 30 days.",
    sectionClass: "border-t border-border",
    headingClass: "text-foreground",
    rowClass: "hover:bg-muted/50",
  },
] as const;

function formatDeadline(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatAsOf(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function DeadlineRow({ item, rowClass }: { item: DeadlineItem; rowClass: string }): React.ReactNode {
  return (
    <li className={`group flex min-w-0 flex-col gap-2 px-4 py-4 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${rowClass}`}>
      <div className="min-w-0 flex-1">
        <Link
          href={`/grants?grant=${encodeURIComponent(item.id)}`}
          className="block break-words rounded-sm font-medium text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
        >
          {item.title}
        </Link>
        <p className="mt-1 min-w-0 break-words text-sm text-muted-foreground">{item.funderName}</p>
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 sm:shrink-0">
        <time className="shrink-0 whitespace-nowrap text-sm tabular-nums text-muted-foreground font-sans" dateTime={item.deadline}>
          {formatDeadline(item.deadline)}
        </time>
        <Badge className={`shrink-0 font-sans ${statusClass[item.status] ?? ""}`}>{item.status}</Badge>
      </div>
    </li>
  );
}

export function DeadlineView({ dto }: { dto: DeadlineViewDto }): React.ReactNode {
  const hasDeadlineRows = Object.values(dto.groups).some((group) => group.length > 0);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-title tracking-tight text-balance">Deadlines</h1>
        </div>
        <p className="shrink-0 text-caption text-muted-foreground">As of {formatAsOf(dto.asOf)}</p>
      </header>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        {dto.trackedGrantCount === 0 ? (
          <div className="border-b border-border px-4 py-4">
            <p className="text-sm font-medium text-foreground">No grants tracked yet</p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              <Link href="/import" className="rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">
                Import a spreadsheet
              </Link>{" "}
              or{" "}
              <Link href="/grants" className="rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">
                add a grant
              </Link>{" "}
              to get started.
            </p>
          </div>
        ) : !hasDeadlineRows ? (
          <div className="border-b border-border px-4 py-4">
            <p className="text-sm font-medium text-foreground">No eligible deadlines are currently in view.</p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Deadlines here include only Research, Qualified, Planning, Writing, and Internal Review grants.
            </p>
          </div>
        ) : null}

        {groupConfig.map((group) => {
          const items = dto.groups[group.key];
          const headingId = `deadline-${group.key}-heading`;

          return (
            <section key={group.key} aria-labelledby={headingId} className={group.sectionClass}>
              <div className="px-4 py-5">
                <h2 id={headingId} className={`text-h2 tracking-tight text-balance ${group.headingClass}`}>
                  {group.heading}
                </h2>
              </div>
              <ul aria-label={`${group.heading} deadlines`} className="divide-y divide-border/70">
                {items.length === 0 ? (
                <li className="px-4 py-5 text-sm text-muted-foreground">{group.emptyMessage}</li>
                ) : (
                  items.map((item) => <DeadlineRow key={item.id} item={item} rowClass={group.rowClass} />)
                )}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
