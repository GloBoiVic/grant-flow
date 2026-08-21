"use client";

import type { MouseEvent, KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Filter, Plus, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FunderDto } from "@/types/funder";
import type { GrantDetailDto, GrantListDto } from "@/types/grant";
import type { TagDto } from "@/types/tag";
import { GrantStatus } from "@/lib/validations/grant";
import { DEFAULT_GRANT_DIRECTION, DEFAULT_GRANT_SORT } from "@/lib/queries/grant-list-contract";

import { GrantDetailSheet } from "./grant-detail-sheet";
import { GrantForm } from "./grant-form";

interface GrantsPageProps {
  grants: GrantListDto;
  funders: FunderDto[];
  selectedGrant: GrantDetailDto | null;
  tags: TagDto[];
  createOpen: boolean;
  listQuery?: string;
}

type SortField = "title" | "funder" | "status" | "deadline" | "requested" | "awarded";

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

const sortLabels: Record<SortField, string> = { title: "Title", funder: "Funder", status: "Status", deadline: "Due", requested: "Requested", awarded: "Awarded" };

function filterParams(listQuery: string, createOpen: boolean, selectedGrant: GrantDetailDto | null): URLSearchParams {
  const params = new URLSearchParams(listQuery);
  if (createOpen) params.set("create", "1");
  if (selectedGrant) params.set("grant", selectedGrant.id);
  return params;
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

export function GrantsPage({ grants, funders, selectedGrant, tags, createOpen, listQuery }: GrantsPageProps): React.ReactNode {
  const router = useRouter();
  const params = new URLSearchParams(listQuery);
  const currentSearch = params.get("q") ?? "";
  const currentParams = (): URLSearchParams => filterParams(listQuery ?? "", createOpen, selectedGrant);
  const listPath = listQuery ? `/grants?${listQuery}` : "/grants";
  const closeSheet = (): void => router.replace(listPath);
  const openCreate = (): void => { const params = new URLSearchParams(listQuery); params.set("create", "1"); router.push(`/grants?${params}`); };
  const openGrant = (grantId: string): void => { const params = currentParams(); params.set("grant", grantId); params.delete("create"); router.push(`/grants?${params}`); };
  const updateList = (mutate: (params: URLSearchParams) => void): void => {
    const params = currentParams();
    params.delete("grant"); params.delete("create"); params.delete("page");
    mutate(params);
    if (createOpen) params.set("create", "1");
    if (selectedGrant) params.set("grant", selectedGrant.id);
    router.push(`/grants${params.toString() ? `?${params}` : ""}`);
  };
  const toggleValue = (key: "status" | "tag", value: string, checked: boolean): void => updateList((params) => {
    const values = params.getAll(key).filter((item) => item !== value);
    if (checked) values.push(value);
    params.delete(key); values.forEach((item) => params.append(key, item));
  });
  const removeFilter = (key: "q" | "status" | "tag", value?: string): void => {
    updateList((params) => {
    if (key === "q") params.delete("q");
    else { const remaining = params.getAll(key).filter((item) => item !== value); params.delete(key); remaining.forEach((item) => params.append(key, item)); }
    });
  };
  const sortBy = (field: SortField): void => updateList((params) => {
    const effectiveSort = params.get("sort") ?? DEFAULT_GRANT_SORT;
    const effectiveDirection = params.get("dir") ?? DEFAULT_GRANT_DIRECTION;
    const nextDirection = effectiveSort === field && effectiveDirection === "asc" ? "desc" : "asc";
    if (field === "deadline") params.delete("sort"); else params.set("sort", field);
    if (nextDirection === "asc") params.delete("dir"); else params.set("dir", nextDirection);
  });
  const goToPage = (page: number): void => { const params = currentParams(); if (page <= 1) params.delete("page"); else params.set("page", String(page)); router.push(`/grants?${params}`); };
  const handleRowClick = (event: MouseEvent<HTMLTableRowElement>, grantId: string): void => {
    if (!isInteractiveTarget(event.target)) openGrant(grantId);
  };
  const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, grantId: string): void => {
    if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    openGrant(grantId);
  };

  const currentStatuses = new Set(params.getAll("status"));
  const currentTags = new Set(params.getAll("tag"));
  const hasFilters = Boolean(currentSearch || currentStatuses.size || currentTags.size);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const firstFilterRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (filtersOpen) firstFilterRef.current?.focus(); }, [filtersOpen]);
  const clearFilters = (): void => updateList((params) => { params.delete("q"); params.delete("status"); params.delete("tag"); });
  const sort = (params.get("sort") as SortField | null) ?? DEFAULT_GRANT_SORT;
  const direction = params.get("dir") === "desc" ? "desc" : DEFAULT_GRANT_DIRECTION;
  const sortIndicator = (field: SortField): React.ReactNode => sort === field ? (direction === "asc" ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />) : null;

  return <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-title">Grants</h1><p className="mt-1 text-sm text-muted-foreground">Track opportunities, deadlines, and funding decisions.</p></div><Button onClick={openCreate} disabled={funders.length === 0} title={funders.length === 0 ? "Add a funder before creating a grant" : undefined}><Plus aria-hidden="true" /> Add grant</Button></div>
    {funders.length === 0 && <p className="mt-4 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground">Add a <a className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring" href="/funders">funder</a> before creating your first grant.</p>}
    <section className="mt-5" aria-label="Grant list filters">
      <div className="flex min-h-8 flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" aria-expanded={filtersOpen} aria-controls="grant-filter-options" onClick={() => setFiltersOpen((open) => !open)}><Filter aria-hidden="true" /> Add filter</Button>
        {currentSearch && <Button variant="secondary" size="xs" onClick={() => removeFilter("q")}>Search: {currentSearch} <X aria-hidden="true" /></Button>}
        {[...currentStatuses].map((status) => <Button key={status} variant="secondary" size="xs" onClick={() => removeFilter("status", status)}>{status} <X aria-hidden="true" /></Button>)}
        {[...currentTags].map((id) => <Button key={id} variant="secondary" size="xs" onClick={() => removeFilter("tag", id)}>{tags.find((tag) => tag.id === id)?.name ?? id} <X aria-hidden="true" /></Button>)}
        {hasFilters && <Button variant="link" size="sm" onClick={clearFilters}>Clear all</Button>}
      </div>
      {filtersOpen && <div id="grant-filter-options" className="mt-2 flex flex-wrap gap-5 rounded-md border border-border bg-popover p-3 shadow-sm" role="region" aria-label="Filter options">
        <fieldset className="flex flex-wrap gap-x-3 gap-y-2"><legend className="mb-1 w-full text-label text-muted-foreground">Status</legend>{Object.values(GrantStatus).map((status, index) => <label key={status} className="flex items-center gap-1.5 text-sm"><input ref={index === 0 ? firstFilterRef : undefined} type="checkbox" checked={currentStatuses.has(status)} onChange={(event) => toggleValue("status", status, event.target.checked)} />{status}</label>)}</fieldset>
        <fieldset className="flex flex-wrap gap-x-3 gap-y-2"><legend className="mb-1 w-full text-label text-muted-foreground">Tags</legend>{tags.length ? tags.map((tag) => <label key={tag.id} className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={currentTags.has(tag.id)} onChange={(event) => toggleValue("tag", tag.id, event.target.checked)} />{tag.name}</label>) : <p className="text-sm text-muted-foreground">No tags yet.</p>}</fieldset>
      </div>}
    </section>
    {grants.items.length === 0 ? <section className="mt-6 rounded-lg border border-dashed border-border bg-card px-6 py-14 text-center"><h2 className="text-h2">{hasFilters ? "No grants match these filters" : "No grants yet"}</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{hasFilters ? "Try removing a filter or searching for a different grant." : "Create your first grant to replace the next row in your spreadsheet."}</p>{hasFilters ? <Button className="mt-5" variant="outline" onClick={clearFilters}>Clear filters</Button> : <Button className="mt-5" onClick={openCreate} disabled={funders.length === 0}><Plus aria-hidden="true" /> Add grant</Button>}</section> : <section className="mt-6 overflow-hidden rounded-lg border border-border bg-card shadow-sm" aria-labelledby="grant-list-title"><h2 id="grant-list-title" className="sr-only">Grant list</h2><div className="overflow-x-auto"><table className="w-full min-w-[980px] border-collapse text-left text-sm"><thead className="border-b border-border bg-muted text-label text-muted-foreground"><tr>{(["title", "funder", "status", "deadline", "requested", "awarded"] as SortField[]).map((field) => <th key={field} scope="col" className={`px-4 py-3 ${field === "requested" || field === "awarded" ? "text-right" : ""}`}><button type="button" onClick={() => sortBy(field)} className="inline-flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-ring" aria-label={`Sort by ${sortLabels[field]}${sort === field ? `, currently ${direction}ending` : ""}`}>{sortLabels[field]}{sortIndicator(field)}</button></th>)}</tr></thead><tbody className="divide-y divide-border">{grants.items.map((grant) => <tr key={grant.id} tabIndex={0} aria-label={`Open ${grant.title}`} onClick={(event) => handleRowClick(event, grant.id)} onKeyDown={(event) => handleRowKeyDown(event, grant.id)} className="h-(--layout-table-row-h) cursor-pointer hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-[-2px]"><th scope="row" className="px-4 py-2 font-medium"><button className="text-left focus-visible:outline-2 focus-visible:outline-ring" onClick={() => openGrant(grant.id)}>{grant.title}<span className="block text-caption font-normal text-muted-foreground">{grant.designation ?? "Grant opportunity"}</span><TagSummary tags={grant.tags} /></button></th><td className="px-4 py-2 text-muted-foreground">{grant.funder.name}</td><td className="px-4 py-2"><span className={`inline-flex rounded-md px-2 py-0.5 text-caption font-semibold ${statusClass[grant.status]}`}>{grant.status}</span></td><td className="px-4 py-2 whitespace-nowrap">{date(grant.deadline)}</td><td className="px-4 py-2 text-right tabular-nums">{money(grant.amountRequested, grant.currency)}</td><td className="px-4 py-2 text-right tabular-nums">{money(grant.amountAwarded, grant.currency)}</td></tr>)}</tbody></table></div><div className="flex items-center justify-between border-t border-border px-4 py-3 text-caption text-muted-foreground"><span>Page {grants.page} · Showing {grants.items.length} grant{grants.items.length === 1 ? "" : "s"}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={!grants.hasPreviousPage} onClick={() => goToPage(grants.page - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={!grants.hasNextPage} onClick={() => goToPage(grants.page + 1)}>Next</Button></div></div></section>}
    <GrantForm key={`${createOpen}-${selectedGrant?.updatedAt ?? "new"}`} open={createOpen} funders={funders} onClose={closeSheet} onCreated={() => router.refresh()} />
    {selectedGrant && <GrantDetailSheet grant={selectedGrant} funders={funders} tags={tags} open onClose={closeSheet} />}
  </div>;
}
