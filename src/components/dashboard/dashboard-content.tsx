import Link from "next/link";
import { AlertCircle, CalendarDays, CircleDot, Clock3, Layers } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { grantListSearchParams } from "@/lib/queries/grant-list-contract";
import type { DashboardDto } from "@/types/dashboard";
import type { GrantStatus } from "@/lib/validations/grant";

const statusClass: Record<string, string> = {
  Research: "bg-status-to-apply text-status-to-apply-fg",
  Qualified: "bg-status-to-apply text-status-to-apply-fg",
  Planning: "bg-status-in-progress text-status-in-progress-fg",
  Writing: "bg-status-in-progress text-status-in-progress-fg",
  "Internal Review": "bg-status-in-progress text-status-in-progress-fg",
  Submitted: "bg-status-submitted text-status-submitted-fg",
  Pending: "bg-status-submitted text-status-submitted-fg",
  Awarded: "bg-status-approved text-status-approved-fg",
  Reporting: "bg-status-approved text-status-approved-fg",
  Declined: "bg-status-declined text-status-declined-fg",
  Closed: "bg-status-to-apply text-status-to-apply-fg",
};

function statusBarClass(status: string): string {
  switch (status) {
    case "Research":
    case "Qualified":
    case "Closed":
      return "bg-muted-foreground/60";
    case "Planning":
    case "Writing":
    case "Internal Review":
      return "bg-primary";
    case "Submitted":
    case "Pending":
      return "bg-warning";
    case "Awarded":
    case "Reporting":
      return "bg-success";
    case "Declined":
      return "bg-destructive";
    default:
      return "bg-primary";
  }
}

const PRE_SUBMISSION_STATUSES: GrantStatus[] = [
  "Research",
  "Qualified",
  "Planning",
  "Writing",
  "Internal Review",
];

const OPEN_PIPELINE_STATUSES: GrantStatus[] = [
  "Research",
  "Qualified",
  "Planning",
  "Writing",
  "Internal Review",
  "Submitted",
  "Pending",
];

function formatMoney(value: string, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(value));
}

function formatDeadline(value: string): string {
  // value is YYYY-MM-DD from DTO; format in UTC like grants-page does
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function grantsLinkForStatuses(statuses: GrantStatus[]): string {
  const params = grantListSearchParams({
    statuses,
    tagIds: [],
    sort: "deadline",
    direction: "asc",
    page: 1,
  });
  return params ? `/grants?${params}` : "/grants";
}

function grantsLinkForStatus(status: GrantStatus): string {
  const params = grantListSearchParams({
    statuses: [status],
    tagIds: [],
    sort: "deadline",
    direction: "asc",
    page: 1,
  });
  return params ? `/grants?${params}` : "/grants";
}

export function DashboardContent({ dto }: { dto: DashboardDto }): React.ReactNode {
  const showNoAmountCaption =
    dto.totals.trackedGrants > 0 &&
    Number(dto.totals.requestedTotal) === 0 &&
    Number(dto.totals.awardedTotal) === 0;

  const maxBreakdown = Math.max(...dto.breakdown.map((b) => b.count), 1);

  const preSubmissionLink = grantsLinkForStatuses(PRE_SUBMISSION_STATUSES);
  const openPipelineLink = grantsLinkForStatuses(OPEN_PIPELINE_STATUSES);
  const hasAttention = dto.attention.overdueCount > 0 || dto.attention.dueIn7Count > 0;
  const hasOverdue = dto.attention.overdueCount > 0;
  const hasDueSoon = dto.attention.dueIn7Count > 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Page heading — calm, established, with as-of context */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-title tracking-tight">Dashboard</h1>
          <p className="mt-1 max-w-[60ch] text-sm leading-5 text-muted-foreground">
            Your portfolio at a glance — tracked grants, funding totals, upcoming deadlines, and status breakdown.
          </p>
        </div>
        <div className="flex items-center gap-2 text-caption text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5 opacity-60" aria-hidden="true" />
            As of{" "}
            {new Intl.DateTimeFormat(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            }).format(new Date(`${dto.asOf}T12:00:00`))}
          </span>
        </div>
      </div>

      {dto.totals.trackedGrants === 0 && (
        <div className="mt-5 rounded-xl border border-dashed border-border bg-card px-5 py-4 shadow-sm">
          <p className="text-sm font-medium text-foreground">No grants tracked yet</p>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            Import an existing spreadsheet at{" "}
            <Link href="/import" className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring rounded-sm">
              /import
            </Link>{" "}
            or go to{" "}
            <Link href="/grants" className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring rounded-sm">
              /grants
            </Link>{" "}
            to begin building the portfolio.
          </p>
        </div>
      )}

      {/* 1 — What does my portfolio look like? — distinctive, not generic */}
      <section aria-labelledby="portfolio-totals-heading" className="mt-6">
        <div className="flex items-center gap-2">
          <h2 id="portfolio-totals-heading" className="flex items-center gap-2 text-h2 tracking-tight">
            <span className="hidden size-6 items-center justify-center rounded-md bg-primary text-primary-foreground sm:inline-flex" aria-hidden="true">
              <Layers className="size-3.5" />
            </span>
            Portfolio totals
          </h2>
          <span className="hidden h-px flex-1 bg-border sm:block" aria-hidden="true" />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-colors hover:border-border-strong/60">
            <div className="h-1 w-full bg-primary/20" aria-hidden="true" />
            <div className="flex flex-1 flex-col px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-label uppercase tracking-label text-muted-foreground">Tracked grants</p>
                <span className="rounded-md bg-primary/10 p-1.5 text-primary" aria-hidden="true">
                  <Layers className="size-3.5" />
                </span>
              </div>
              <p className="mt-2 text-metric tabular-nums tracking-metric">{dto.totals.trackedGrants}</p>
              <p className="mt-1 text-caption leading-4 text-muted-foreground">Active records in this workspace</p>
              <Link
                href="/grants"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring rounded-sm"
              >
                View all grants →
              </Link>
            </div>
          </div>

          <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-colors hover:border-border-strong/60">
            <div className="h-1 w-full bg-accent-foreground/20" aria-hidden="true" />
            <div className="flex flex-1 flex-col px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-label uppercase tracking-label text-muted-foreground">Open pipeline</p>
                <span className="rounded-md bg-accent p-1.5 text-accent-foreground" aria-hidden="true">
                  <CircleDot className="size-3.5" />
                </span>
              </div>
              <p className="mt-2 text-metric tabular-nums tracking-metric">{dto.totals.openPipeline}</p>
              <p className="mt-1 text-caption leading-4 text-muted-foreground">Research → Pending</p>
              <Link
                href={openPipelineLink}
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring rounded-sm"
              >
                View open pipeline →
              </Link>
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="h-1 w-full bg-warning/30" aria-hidden="true" />
            <div className="flex flex-1 flex-col px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-label uppercase tracking-label text-muted-foreground">Requested</p>
                <span className="rounded-md bg-warning/10 p-1.5 text-warning" aria-hidden="true">
                  <span className="text-caption font-semibold leading-none">$</span>
                </span>
              </div>
              <p className="mt-2 text-metric tabular-nums tracking-metric">{formatMoney(dto.totals.requestedTotal, dto.totals.currency)}</p>
              <p className="mt-1 text-caption leading-4 text-muted-foreground">Total ask across tracked grants</p>
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="h-1 w-full bg-success/30" aria-hidden="true" />
            <div className="flex flex-1 flex-col px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-label uppercase tracking-label text-muted-foreground">Awarded</p>
                <span className="rounded-md bg-success/10 p-1.5 text-success" aria-hidden="true">
                  <span className="text-caption font-semibold leading-none">$</span>
                </span>
              </div>
              <p className="mt-2 text-metric tabular-nums tracking-metric">{formatMoney(dto.totals.awardedTotal, dto.totals.currency)}</p>
              <p className="mt-1 text-caption leading-4 text-muted-foreground">Recorded awards to date</p>
            </div>
          </div>
        </div>
        {showNoAmountCaption && (
          <p className="mt-2.5 rounded-md bg-muted/60 px-3 py-2 text-caption text-muted-foreground">No requested/awarded amounts recorded yet.</p>
        )}
      </section>

      {/* 2 — What needs my attention? — red urgency, distinctive */}
      <section
        aria-labelledby="needs-attention-heading"
        className={`mt-6 overflow-hidden rounded-xl border bg-card shadow-sm ${hasAttention ? "border-destructive/20" : "border-border"}`}
      >
        {/* urgent accent bar — red signals action (user: red = danger/urgency) */}
        {hasAttention && <div className="h-1 w-full bg-destructive" aria-hidden="true" />}
        <div className={`px-5 py-5 ${hasAttention ? "bg-destructive-soft/40" : ""}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 id="needs-attention-heading" className="flex items-center gap-2 text-h2 tracking-tight">
                <span
                  className={`inline-flex rounded-md p-1 ${hasAttention ? "bg-destructive text-destructive-foreground shadow-sm" : "bg-muted text-muted-foreground"}`}
                  aria-hidden="true"
                >
                  <AlertCircle className="size-4" />
                </span>
                Needs attention
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">Pre-submission deadlines requiring follow-up.</p>
            </div>
            <Link
              href={preSubmissionLink}
              className="inline-flex items-center gap-1 self-start rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-xs hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-ring sm:self-auto"
            >
              Review pre-submission deadlines →
            </Link>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div
              className={`flex items-center justify-between rounded-lg border px-4 py-3.5 transition-colors ${hasOverdue ? "border-destructive/25 bg-destructive-soft shadow-sm" : "border-border bg-card"}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`hidden size-8 items-center justify-center rounded-full sm:inline-flex ${hasOverdue ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground border border-border"}`}
                  aria-hidden="true"
                >
                  <AlertCircle className="size-4" />
                </span>
                <div>
                  <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">Overdue</p>
                  <p className={`text-sm ${hasOverdue ? "font-semibold text-destructive" : "text-muted-foreground"}`}>
                    Overdue: {dto.attention.overdueCount}
                  </p>
                </div>
              </div>
              <span className={`text-metric tabular-nums ${hasOverdue ? "text-destructive" : "text-muted-foreground/70"}`} aria-hidden="true">
                {dto.attention.overdueCount}
              </span>
            </div>

            <div
              className={`flex items-center justify-between rounded-lg border px-4 py-3.5 transition-colors ${hasDueSoon ? "border-border bg-card shadow-sm" : "border-border bg-card"}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`hidden size-8 items-center justify-center rounded-full sm:inline-flex ${hasDueSoon ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground border border-border"}`}
                  aria-hidden="true"
                >
                  <Clock3 className="size-4" />
                </span>
                <div>
                  <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">Due within 7 days</p>
                  <p className={`text-sm ${hasDueSoon ? "font-semibold text-destructive" : "text-muted-foreground"}`}>
                    Due within 7 days: {dto.attention.dueIn7Count}
                  </p>
                </div>
              </div>
              <span className={`text-metric tabular-nums ${hasDueSoon ? "text-destructive" : "text-muted-foreground/70"}`} aria-hidden="true">
                {dto.attention.dueIn7Count}
              </span>
            </div>
          </div>

          {dto.attention.overdueCount === 0 && dto.attention.dueIn7Count === 0 && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-success/10 px-2.5 py-1.5 text-sm text-success">
              <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
              No pre-submission application deadlines need attention.
            </p>
          )}
        </div>
      </section>

      {/* 3 + 4 — two-column on desktop for density: upcoming + lifecycle */}
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* 3 — What is coming up next? */}
        <section
          aria-labelledby="upcoming-deadlines-heading"
          className="flex flex-col rounded-xl border border-border bg-card shadow-sm lg:col-span-3"
        >
          <div className="border-b border-border bg-muted/20 px-5 py-4">
            <h2 id="upcoming-deadlines-heading" className="flex items-center gap-2 text-h2 tracking-tight">
              <span className="inline-flex rounded-md bg-card p-1 text-primary shadow-sm border border-border" aria-hidden="true">
                <CalendarDays className="size-4" />
              </span>
              Upcoming deadlines
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Next 5 pre-submission deadlines · 30-day window</p>
          </div>

          <div className="flex-1">
            {dto.upcoming.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <CalendarDays className="size-5" aria-hidden="true" />
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">No upcoming deadlines</p>
                <p className="mx-auto mt-1 max-w-[32ch] text-sm text-muted-foreground">
                  No pre-submission deadlines in the next 30 days.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border/70" aria-label="Upcoming deadlines list">
                {dto.upcoming.map((item) => (
                  <li
                    key={item.id}
                    className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/grants?grant=${encodeURIComponent(item.id)}`}
                        className="line-clamp-1 font-medium text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring rounded-sm"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                        <span className="truncate">{item.funderName}</span>
                        <span className="hidden size-1 rounded-full bg-border sm:inline-block" aria-hidden="true" />
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <CalendarDays className="size-3.5 opacity-60" aria-hidden="true" />
                          {formatDeadline(item.deadline)}
                        </span>
                      </p>
                    </div>
                    <Badge className={`${statusClass[item.status] ?? ""} shrink-0`}>{item.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-border px-5 py-3">
            <Link
              href={preSubmissionLink}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring rounded-sm"
            >
              Review grant deadlines →
            </Link>
          </div>
        </section>

        {/* 4 — Where are grants in the lifecycle? */}
        <section
          aria-labelledby="status-breakdown-heading"
          className="flex flex-col rounded-xl border border-border bg-card shadow-sm lg:col-span-2"
        >
          <div className="border-b border-border bg-muted/20 px-5 py-4">
            <h2 id="status-breakdown-heading" className="flex items-center gap-2 text-h2 tracking-tight">
              <span className="inline-flex rounded-md bg-card p-1 text-primary shadow-sm border border-border" aria-hidden="true">
                <Layers className="size-4" />
              </span>
              Status breakdown
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Lifecycle distribution · {dto.totals.trackedGrants} total</p>
          </div>

          <div className="flex-1 px-3 py-2">
            <ul className="divide-y divide-border/50" aria-label="Status breakdown list">
              {dto.breakdown.map((row) => {
                const isZero = row.count === 0;
                const width = maxBreakdown > 0 ? (row.count / maxBreakdown) * 100 : 0;
                return (
                  <li
                    key={row.status}
                    className="group flex items-center gap-3 px-2 py-2.5 transition-colors hover:bg-muted/40 rounded-md"
                  >
                    <Link
                      href={grantsLinkForStatus(row.status)}
                      className={`min-w-0 flex-1 truncate text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring rounded-sm ${isZero ? "text-muted-foreground hover:text-foreground" : "text-foreground hover:text-primary"}`}
                    >
                      {row.status}
                    </Link>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-muted sm:block"
                        aria-hidden="true"
                      >
                        <div
                          className={`h-full rounded-full transition-all ${isZero ? "bg-muted-foreground/20" : statusBarClass(row.status)}`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <span
                        className={`min-w-7 text-right text-sm tabular-nums ${isZero ? "text-muted-foreground/60" : "font-medium text-foreground"}`}
                      >
                        {row.count}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="border-t border-border bg-muted/20 px-5 py-2.5">
            <p className="text-caption leading-4 text-muted-foreground">
              Bars show relative volume by the most populated status. Click a status to filter the grant list.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
