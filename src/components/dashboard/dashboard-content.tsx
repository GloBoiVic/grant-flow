import Link from "next/link";

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
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value));
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

  const openPipelineLink = grantsLinkForStatuses(OPEN_PIPELINE_STATUSES);
  const deadlinesLink = "/deadlines";
  const hasAttention = dto.attention.overdueCount > 0 || dto.attention.dueIn7Count > 0;
  const hasOverdue = dto.attention.overdueCount > 0;
  const hasDueSoon = dto.attention.dueIn7Count > 0;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-title tracking-tight">Dashboard</h1>
        <p className="text-caption text-muted-foreground">
          As of{" "}
          {new Intl.DateTimeFormat(undefined, {
            month: "long",
            day: "numeric",
            year: "numeric",
          }).format(new Date(`${dto.asOf}T12:00:00`))}
        </p>
      </div>

      {dto.totals.trackedGrants === 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-border bg-card px-5 py-4">
          <p className="text-sm font-medium text-foreground">No grants tracked yet</p>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            <Link
              href="/import"
              className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring rounded-sm"
            >
              Import a spreadsheet
            </Link>{" "}
            or{" "}
            <Link
              href="/grants"
              className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring rounded-sm"
            >
              add a grant
            </Link>{" "}
            to get started.
          </p>
        </div>
      )}

      <section aria-labelledby="portfolio-metrics-heading" className="mt-8">
        <h2 id="portfolio-metrics-heading" className="sr-only">
          Portfolio metrics
        </h2>
        <div className="grid grid-cols-2 divide-x divide-y border-y border-border sm:grid-cols-4 sm:divide-y-0">
          <div className="min-w-0 px-4 py-4 pl-0 sm:px-5 sm:pl-0">
            <p className="text-sm text-muted-foreground">Tracked grants</p>
            <p className="mt-1 font-mono text-metric font-normal text-muted-foreground tabular-nums tracking-metric">{dto.totals.trackedGrants}</p>
            <Link
              href="/grants"
              className="mt-2 inline-flex max-w-full break-words text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring rounded-sm"
            >
              View all grants
            </Link>
          </div>

          <div className="min-w-0 px-4 py-4 sm:px-5">
            <p className="text-sm text-muted-foreground">Open pipeline</p>
            <p className="mt-1 font-mono text-metric font-normal text-muted-foreground tabular-nums tracking-metric">{dto.totals.openPipeline}</p>
            <Link
              href={openPipelineLink}
              className="mt-2 inline-flex max-w-full break-words text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring rounded-sm"
            >
              View open pipeline
            </Link>
          </div>

          <div className="min-w-0 px-4 py-4 pl-0 sm:px-5">
            <p className="text-sm text-muted-foreground">Requested</p>
            <p className="mt-1 font-mono text-metric font-normal text-muted-foreground tabular-nums tracking-metric">{formatMoney(dto.totals.requestedTotal, dto.totals.currency)}</p>
          </div>

          <div className="min-w-0 px-4 py-4 sm:px-5 sm:pr-0">
            <p className="text-sm text-muted-foreground">Awarded</p>
            <p className="mt-1 font-mono text-metric font-normal text-muted-foreground tabular-nums tracking-metric">{formatMoney(dto.totals.awardedTotal, dto.totals.currency)}</p>
          </div>
        </div>
        {showNoAmountCaption && <p className="mt-3 text-sm text-muted-foreground">No amounts recorded yet.</p>}
      </section>

      <section
        aria-labelledby="needs-attention-heading"
        className={`mt-8 rounded-lg border px-4 py-4 sm:px-5 ${hasAttention ? "border-destructive/40 bg-destructive-soft/20" : "border-border bg-card"}`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h2 id="needs-attention-heading" className="text-h2 tracking-tight">
            Needs attention
          </h2>
          <Link
            href={deadlinesLink}
            className="inline-flex self-start text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring rounded-sm sm:self-auto"
          >
            View deadlines
          </Link>
        </div>

        <dl className="mt-4 grid gap-6 sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-border">
          <div className="min-w-0 sm:pr-5">
            <dt className="text-sm text-muted-foreground">Overdue</dt>
            <dd className={`mt-1 text-2xl font-semibold tabular-nums ${hasOverdue ? "text-destructive" : "text-muted-foreground"}`}>
              {dto.attention.overdueCount}
            </dd>
          </div>

          <div className="min-w-0 sm:pl-5 sm:text-right">
            <dt className="text-sm text-muted-foreground">Due within 7 days</dt>
            <dd className={`mt-1 text-2xl font-semibold tabular-nums ${hasDueSoon ? "text-destructive" : "text-muted-foreground"}`}>
              {dto.attention.dueIn7Count}
            </dd>
          </div>
        </dl>

        {!hasAttention && <p className="mt-4 text-sm text-success">No deadlines need attention.</p>}
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <section aria-labelledby="upcoming-deadlines-heading" className="min-w-0 lg:col-span-3">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="upcoming-deadlines-heading" className="text-h2 tracking-tight">
              Upcoming deadlines
            </h2>
            <p className="shrink-0 text-sm text-muted-foreground">Next 30 days</p>
          </div>

          {dto.upcoming.length === 0 ? (
            <p className="mt-3 border-y border-border py-5 text-sm text-muted-foreground">No upcoming deadlines.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border border-y border-border" aria-label="Upcoming deadlines list">
              {dto.upcoming.map((item) => (
                <li key={item.id} className="flex min-w-0 items-center gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/grants?grant=${encodeURIComponent(item.id)}`}
                      className="line-clamp-1 font-medium text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring rounded-sm"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                      <span className="truncate">{item.funderName}</span>
                      <time className="tabular-nums" dateTime={item.deadline}>
                        {formatDeadline(item.deadline)}
                      </time>
                    </p>
                  </div>
                  <Badge className={`shrink-0 font-sans ${statusClass[item.status] ?? ""}`}>{item.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="status-breakdown-heading" className="min-w-0 lg:col-span-2">
          <h2 id="status-breakdown-heading" className="text-h2 tracking-tight">
            Status breakdown
          </h2>
          <ul className="mt-3 divide-y divide-border border-y border-border" aria-label="Status breakdown list">
            {dto.breakdown.map((row) => {
              const isZero = row.count === 0;
              return (
                <li key={row.status} className="flex min-w-0 items-center gap-3 py-2.5">
                  <Link
                    href={grantsLinkForStatus(row.status)}
                    className={`min-w-0 flex-1 truncate text-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring rounded-sm ${isZero ? "text-muted-foreground hover:text-foreground" : "font-medium text-foreground hover:text-primary"}`}
                  >
                    {row.status}
                  </Link>
                  <span className={`shrink-0 text-sm tabular-nums ${isZero ? "text-muted-foreground" : "font-medium text-foreground"}`}>
                    {row.count}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
