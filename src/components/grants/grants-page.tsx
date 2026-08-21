"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FunderDto } from "@/types/funder";
import type { GrantDetailDto, GrantListDto } from "@/types/grant";
import type { TagDto } from "@/types/tag";

import { GrantDetailSheet } from "./grant-detail-sheet";
import { GrantForm } from "./grant-form";

interface GrantsPageProps {
  grants: GrantListDto;
  funders: FunderDto[];
  selectedGrant: GrantDetailDto | null;
  tags: TagDto[];
  createOpen: boolean;
  cursor: string | null;
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

function money(value: string | null, currency: string): string {
  return value ? new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(value)) : "—";
}

function date(value: string | null): string {
  return value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)) : "—";
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest("a, button, input, select, textarea, summary, [contenteditable=\"true\"], [role=\"button\"], [role=\"link\"]"));
}

function TagSummary({ tags }: { tags: TagDto[] }): React.ReactNode {
  const visible = tags.slice(0, 2);
  const remaining = tags.length - visible.length;
  if (tags.length === 0) return null;

  return (
    <span className="mt-1 flex flex-wrap items-center gap-1" aria-label={`Tags: ${tags.map((tag) => tag.name).join(", ")}`}>
      {visible.map((tag) => <Badge key={tag.id} variant="secondary" className="text-caption font-medium">{tag.name}</Badge>)}
      {remaining > 0 && <span className="text-caption text-muted-foreground">+{remaining} more</span>}
    </span>
  );
}

export function GrantsPage({ grants, funders, selectedGrant, tags, createOpen, cursor }: GrantsPageProps): React.ReactNode {
  const router = useRouter();
  const closeSheet = (): void => router.replace(cursor ? `/grants?cursor=${encodeURIComponent(cursor)}` : "/grants");
  const openCreate = (): void => router.push("/grants?create=1");
  const openGrant = (grantId: string): void => router.push(`/grants?grant=${encodeURIComponent(grantId)}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
  const handleRowClick = (event: React.MouseEvent<HTMLTableRowElement>, grantId: string): void => {
    if (!isInteractiveTarget(event.target)) openGrant(grantId);
  };
  const handleRowKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>, grantId: string): void => {
    if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    openGrant(grantId);
  };

  return <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-title">Grants</h1><p className="mt-1 text-sm text-muted-foreground">Track opportunities, deadlines, and funding decisions.</p></div><Button onClick={openCreate} disabled={funders.length === 0} title={funders.length === 0 ? "Add a funder before creating a grant" : undefined}><Plus aria-hidden="true" /> Add grant</Button></div>
    {funders.length === 0 && <p className="mt-4 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground">Add a <a className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring" href="/funders">funder</a> before creating your first grant.</p>}
    {grants.items.length === 0 ? <section className="mt-6 rounded-lg border border-dashed border-border bg-card px-6 py-14 text-center"><h2 className="text-h2">No grants yet</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Create your first grant to replace the next row in your spreadsheet.</p><Button className="mt-5" onClick={openCreate} disabled={funders.length === 0}><Plus aria-hidden="true" /> Add grant</Button></section> : <section className="mt-6 overflow-hidden rounded-lg border border-border bg-card shadow-sm" aria-labelledby="grant-list-title"><h2 id="grant-list-title" className="sr-only">Grant list</h2><div className="overflow-x-auto"><table className="w-full min-w-[780px] border-collapse text-left text-sm"><thead className="border-b border-border bg-muted text-label text-muted-foreground"><tr><th scope="col" className="px-4 py-3">Title</th><th scope="col" className="px-4 py-3">Funder</th><th scope="col" className="px-4 py-3">Status</th><th scope="col" className="px-4 py-3 text-right">Amount</th><th scope="col" className="px-4 py-3">Due</th></tr></thead><tbody className="divide-y divide-border">{grants.items.map((grant) => <tr key={grant.id} tabIndex={0} aria-label={`Open ${grant.title}`} onClick={(event) => handleRowClick(event, grant.id)} onKeyDown={(event) => handleRowKeyDown(event, grant.id)} className="h-(--layout-table-row-h) cursor-pointer hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-[-2px]"><th scope="row" className="px-4 py-2 font-medium"><button className="text-left focus-visible:outline-2 focus-visible:outline-ring" onClick={() => openGrant(grant.id)}>{grant.title}<span className="block text-caption font-normal text-muted-foreground">{grant.designation ?? "Grant opportunity"}</span><TagSummary tags={grant.tags} /></button></th><td className="px-4 py-2 text-muted-foreground">{grant.funder.name}</td><td className="px-4 py-2"><span className={`inline-flex rounded-md px-2 py-0.5 text-caption font-semibold ${statusClass[grant.status]}`}>{grant.status}</span></td><td className="px-4 py-2 text-right tabular-nums">{money(grant.amountRequested, grant.currency)}</td><td className="px-4 py-2 whitespace-nowrap">{date(grant.deadline)}</td></tr>)}</tbody></table></div><div className="flex items-center justify-between border-t border-border px-4 py-3 text-caption text-muted-foreground"><span>Showing {grants.items.length} grant{grants.items.length === 1 ? "" : "s"}</span>{grants.nextCursor && <Button variant="outline" size="sm" onClick={() => router.push(`/grants?cursor=${encodeURIComponent(grants.nextCursor ?? "")}`)}>Next page <span aria-hidden="true">→</span></Button>}</div></section>}
    <GrantForm key={`${createOpen}-${selectedGrant?.updatedAt ?? "new"}`} open={createOpen} funders={funders} onClose={closeSheet} onCreated={() => router.refresh()} />
    {selectedGrant && <GrantDetailSheet grant={selectedGrant} funders={funders} tags={tags} open onClose={closeSheet} />}
  </div>;
}
