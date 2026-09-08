import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { FunderDto } from "@/types/funder";
import type { GrantDetailDto } from "@/types/grant";
import type { TagDto } from "@/types/tag";

import { GrantWorkspaceActions } from "./grant-workspace-actions";
import { TagManager } from "./tag-manager";

export interface GrantWorkspaceProps {
  grant: GrantDetailDto;
  funders: FunderDto[];
  tags: TagDto[];
}

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

const funderTypeLabels: Record<FunderDto["type"], string> = {
  FOUNDATION: "Foundation",
  FAMILY_FUND: "Family Fund",
  CORPORATION: "Corporation",
  OTHER: "Other",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatAmount(value: string, currency: string): string {
  return `${currency} ${new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(value))}`;
}

function DetailField({ label, value, fullWidth = false }: { label: string; value: React.ReactNode; fullWidth?: boolean }): React.ReactNode {
  return (
    <div className={`min-w-0 ${fullWidth ? "sm:col-span-2" : ""}`}>
      <dt className="text-label text-muted-foreground">{label}</dt>
      <dd className="mt-1 min-w-0 break-words text-sm text-foreground">{value}</dd>
    </div>
  );
}

export function GrantWorkspace({ grant, funders, tags }: GrantWorkspaceProps): React.ReactNode {
  return (
    <div className="mx-auto w-full max-w-6xl overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
      <header className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <Link
          href="/grants"
          className="inline-flex rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
        >
          Back to Grants
        </Link>
        <div className="mt-5 flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-start gap-3">
              <h1 className="min-w-0 flex-1 break-words text-title tracking-tight text-balance">{grant.title}</h1>
              <Badge className={`shrink-0 ${statusClass[grant.status] ?? ""}`}>{grant.status}</Badge>
            </div>
            <p className="mt-3 min-w-0 break-words text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Funder:</span> {grant.funder.name}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{funderTypeLabels[grant.funder.type]}</p>
            {grant.funder.website ? (
              <a
                href={grant.funder.website}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block break-all rounded-sm text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
              >
                {grant.funder.website}
              </a>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Funder website: —</p>
            )}
          </div>
          <GrantWorkspaceActions key={grant.updatedAt} grant={grant} funders={funders} />
        </div>
      </header>

      <div className="mt-6 space-y-6">
        <section aria-labelledby="grant-overview-title" className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <h2 id="grant-overview-title" className="text-h2 tracking-tight text-balance">Overview</h2>
          <dl className="mt-5 grid min-w-0 grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <DetailField label="Funder" value={grant.funder.name} />
            <DetailField label="Status" value={<Badge className={statusClass[grant.status] ?? ""}>{grant.status}</Badge>} />
            <DetailField label="Amount requested" value={grant.amountRequested ? formatAmount(grant.amountRequested, grant.currency) : "—"} />
            <DetailField label="Amount awarded" value={grant.amountAwarded ? formatAmount(grant.amountAwarded, grant.currency) : "—"} />
            <DetailField label="Currency" value={grant.currency} />
            <DetailField label="Application deadline" value={grant.deadline ? formatDate(grant.deadline) : "—"} />
            <DetailField label="Decision date" value={grant.decisionDate ? formatDate(grant.decisionDate) : "—"} />
            <DetailField label="Award timeframe" value={grant.awardTimeframe || "—"} />
            <DetailField label="Designation" value={grant.designation || "—"} />
            <DetailField label="County served" value={grant.countyServed || "—"} />
            <DetailField
              label="Next steps"
              value={grant.nextSteps ? <span className="whitespace-pre-wrap">{grant.nextSteps}</span> : "—"}
              fullWidth
            />
          </dl>
          <TagManager grantId={grant.id} assignedTags={grant.tags} activeTags={tags} />
        </section>

        <section aria-labelledby="grant-notes-title" className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <h2 id="grant-notes-title" className="text-h2 tracking-tight text-balance">Notes</h2>
          {grant.notes ? (
            <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">{grant.notes}</p>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No notes recorded yet.</p>
          )}
        </section>

        <section aria-labelledby="grant-activity-title" className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <h2 id="grant-activity-title" className="text-h2 tracking-tight text-balance">Activity</h2>
          {grant.activities.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No activity recorded.</p>
          ) : (
            <ol aria-label="Grant activity" className="mt-5 space-y-5 border-l border-border pl-5">
              {grant.activities.map((activity) => (
                <li key={activity.id} className="min-w-0">
                  <p className="break-words text-sm font-medium text-foreground">{activity.description}</p>
                  <time className="mt-1 block text-caption text-muted-foreground" dateTime={activity.createdAt}>
                    {formatDate(activity.createdAt.slice(0, 10))}
                  </time>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
