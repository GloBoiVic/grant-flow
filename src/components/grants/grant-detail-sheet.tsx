"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { changeGrantStatus } from "@/app/(authenticated)/(org-required)/grants/actions";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { GrantStatus } from "@/lib/validations/grant";
import type { FunderDto } from "@/types/funder";
import type { GrantDetailDto } from "@/types/grant";
import type { TagDto } from "@/types/tag";

import { GrantForm } from "./grant-form";
import { TagManager } from "./tag-manager";

interface GrantDetailSheetProps {
  grant: GrantDetailDto;
  funders: FunderDto[];
  tags: TagDto[];
  open: boolean;
  onClose: () => void;
}

function date(value: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export function GrantDetailSheet({ grant: initialGrant, funders, tags, open, onClose }: GrantDetailSheetProps): React.ReactNode {
  const router = useRouter();
  const [grant, setGrant] = useState(initialGrant);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState(initialGrant.status);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function saveStatus(): Promise<void> {
    setIsSaving(true); setStatusError(null); setStatusSuccess(null);
    const result = await changeGrantStatus({ grantId: grant.id, status });
    if (!result.success) { setStatusError(result.error); setIsSaving(false); return; }
    setGrant(result.data); setStatus(result.data.status); setStatusSuccess("Status updated successfully."); setIsSaving(false); router.refresh();
  }

  return <>
    <Sheet open={open && !isEditing} onOpenChange={(next) => { if (!next && !isEditing) onClose(); }}>
      <SheetContent>
        <SheetHeader><SheetTitle>{grant.title}</SheetTitle><SheetDescription>{grant.funder.name} · Grant details</SheetDescription></SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5">
          <div className="flex flex-wrap gap-2 border-b border-border pb-4"><Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit</Button><div className="flex items-center gap-2"><label htmlFor="grant-detail-status" className="sr-only">Change grant status</label><select id="grant-detail-status" value={status} onChange={(event) => setStatus(event.target.value as GrantDetailDto["status"])} className="h-8 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50">{Object.values(GrantStatus).map((value) => <option key={value}>{value}</option>)}</select><Button size="sm" onClick={saveStatus} disabled={isSaving}>{isSaving ? "Saving…" : "Change status"}</Button></div></div>
          {statusError && <p role="alert" className="mt-3 rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2 text-sm text-destructive">{statusError}</p>}
          {statusSuccess && <p role="status" className="mt-3 rounded-md border border-success/30 bg-status-approved px-3 py-2 text-sm text-status-approved-fg">{statusSuccess}</p>}
          <dl className="mt-5 grid grid-cols-2 gap-3">{[["Amount requested", grant.amountRequested ? `${grant.currency} ${grant.amountRequested}` : "—"], ["Deadline", grant.deadline ? date(grant.deadline) : "—"], ["Status", grant.status], ["Next steps", grant.nextSteps || "—"]].map(([label, value]) => <div key={label} className="rounded-md border border-border bg-card p-3"><dt className="text-label text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-medium">{value}</dd></div>)}</dl>
          <TagManager grantId={grant.id} assignedTags={grant.tags} activeTags={tags} />
          <section className="mt-6" aria-labelledby="grant-activity-title"><h3 id="grant-activity-title" className="text-label text-muted-foreground">Activity</h3>{grant.activities.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No activity recorded.</p> : <ol className="mt-3 space-y-4 border-l border-border pl-4">{grant.activities.map((activity) => <li key={activity.id}><p className="text-sm font-medium">{activity.description}</p><time className="text-caption text-muted-foreground" dateTime={activity.createdAt}>{date(activity.createdAt.slice(0, 10))}</time></li>)}</ol>}</section>
        </div>
      </SheetContent>
    </Sheet>
    {isEditing && <GrantForm key={grant.updatedAt} open funders={funders} grant={grant} onClose={() => setIsEditing(false)} onSaved={(savedGrant) => { setGrant(savedGrant); setStatus(savedGrant.status); setIsEditing(false); router.refresh(); }} />}
  </>;
}
