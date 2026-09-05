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

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
      <h1 className="text-title">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your portfolio at a glance — tracked grants, funding totals, upcoming deadlines, and status breakdown.
      </p>

      {dto.totals.trackedGrants === 0 && (
        <p className="mt-4 rounded-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          No grants tracked yet. Import an existing spreadsheet at{" "}
          <Link href="/import" className="font-medium text-primary underline-offset-4 hover:underline">
            /import
          </Link>{" "}
          or go to{" "}
          <Link href="/grants" className="font-medium text-primary underline-offset-4 hover:underline">
            /grants
          </Link>{" "}
          to begin building the portfolio.
        </p>
      )}

      {/* Portfolio totals */}
      <section aria-labelledby="portfolio-totals-heading" className="mt-6">
        <h2 id="portfolio-totals-heading" className="text-h2">
          Portfolio totals
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-card px-4 py-4 shadow-sm">
            <p className="text-label uppercase tracking-label text-muted-foreground">Tracked grants</p>
            <p className="mt-1 text-metric">{dto.totals.trackedGrants}</p>
            <Link
              href="/grants"
              className="mt-2 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
            >
              View all grants →
            </Link>
          </div>

          <div className="rounded-lg border border-border bg-card px-4 py-4 shadow-sm">
            <p className="text-label uppercase tracking-label text-muted-foreground">Open pipeline</p>
            <p className="mt-1 text-metric">{dto.totals.openPipeline}</p>
            <Link
              href={openPipelineLink}
              className="mt-2 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
            >
              View open pipeline →
            </Link>
          </div>

          <div className="rounded-lg border border-border bg-card px-4 py-4 shadow-sm">
            <p className="text-label uppercase tracking-label text-muted-foreground">Requested</p>
            <p className="mt-1 text-metric">{formatMoney(dto.totals.requestedTotal, dto.totals.currency)}</p>
          </div>

          <div className="rounded-lg border border-border bg-card px-4 py-4 shadow-sm">
            <p className="text-label uppercase tracking-label text-muted-foreground">Awarded</p>
            <p className="mt-1 text-metric">{formatMoney(dto.totals.awardedTotal, dto.totals.currency)}</p>
          </div>
        </div>
        {showNoAmountCaption && (
          <p className="mt-2 text-caption text-muted-foreground">No requested/awarded amounts recorded yet.</p>
        )}
      </section>

      {/* Needs attention */}
      <section aria-labelledby="needs-attention-heading" className="mt-8 rounded-lg border border-border bg-card px-4 py-4 shadow-sm">
        <h2 id="needs-attention-heading" className="text-h2">
          Needs attention
        </h2>
        <div className="mt-3 flex flex-col gap-1 text-sm">
          <p>Overdue: {dto.attention.overdueCount}</p>
          <p>Due within 7 days: {dto.attention.dueIn7Count}</p>
        </div>
        {dto.attention.overdueCount === 0 && dto.attention.dueIn7Count === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">No pre-submission application deadlines need attention.</p>
        )}
        <Link
          href={preSubmissionLink}
          className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
        >
          Review pre-submission deadlines →
        </Link>
      </section>

      {/* Upcoming deadlines */}
      <section aria-labelledby="upcoming-deadlines-heading" className="mt-8 rounded-lg border border-border bg-card px-4 py-4 shadow-sm">
        <h2 id="upcoming-deadlines-heading" className="text-h2">
          Upcoming deadlines
        </h2>
        {dto.upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No pre-submission deadlines in the next 30 days.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border" aria-label="Upcoming deadlines list">
            {dto.upcoming.map((item) => (
              <li key={item.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link
                    href={`/grants?grant=${encodeURIComponent(item.id)}`}
                    className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    {item.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {item.funderName} · {formatDeadline(item.deadline)}
                  </p>
                </div>
                <Badge className={statusClass[item.status] ?? ""}>{item.status}</Badge>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={preSubmissionLink}
          className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
        >
          Review grant deadlines →
        </Link>
      </section>

      {/* Status breakdown */}
      <section aria-labelledby="status-breakdown-heading" className="mt-8 rounded-lg border border-border bg-card px-4 py-4 shadow-sm">
        <h2 id="status-breakdown-heading" className="text-h2">
          Status breakdown
        </h2>
        <ul className="mt-3 divide-y divide-border" aria-label="Status breakdown list">
          {dto.breakdown.map((row) => (
            <li key={row.status} className="flex items-center justify-between gap-3 py-2">
              <Link
                href={grantsLinkForStatus(row.status)}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
              >
                {row.status}
              </Link>
              <div className="flex items-center gap-3">
                <div
                  className="hidden h-2 w-24 overflow-hidden rounded-full bg-muted sm:block"
                  aria-hidden="true"
                >
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${maxBreakdown > 0 ? (row.count / maxBreakdown) * 100 : 0}%` }}
                  />
                </div>
                <span className="min-w-6 text-right text-sm tabular-nums">{row.count}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
