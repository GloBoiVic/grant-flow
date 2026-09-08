"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { changeGrantStatus } from "@/app/(authenticated)/(org-required)/grants/actions";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { GrantStatus } from "@/lib/validations/grant";
import type { FunderDto } from "@/types/funder";
import type { GrantDetailDto } from "@/types/grant";

import { GrantForm } from "./grant-form";

interface GrantDetailSheetProps {
  grant: GrantDetailDto;
  funders: FunderDto[];
  open: boolean;
  onClose: () => void;
}

function date(value: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function formatAmount(value: string, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function GrantDetailSheet({ grant: initialGrant, funders, open, onClose }: GrantDetailSheetProps): React.ReactNode {
  const router = useRouter();
  const grant = initialGrant;
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState(initialGrant.status);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function saveStatus(): Promise<void> {
    setIsSaving(true); setStatusError(null); setStatusSuccess(null);
    const result = await changeGrantStatus({ grantId: grant.id, status });
    if (!result.success) { setStatusError(result.error); setIsSaving(false); return; }
    setStatus(result.data.status); setStatusSuccess("Status updated successfully."); setIsSaving(false);
    if (grant.status !== result.data.status) router.refresh();
  }

  return <>
    <Sheet open={open && !isEditing} onOpenChange={(next) => { if (!next && !isEditing) onClose(); }}>
      <SheetContent>
        <SheetHeader><SheetTitle className="pr-8 break-words">{grant.title}</SheetTitle><SheetDescription>{grant.funder.name}</SheetDescription></SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5">
          <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4"><Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit grant</Button><Link href={`/grants/${encodeURIComponent(grant.id)}`} className="rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2">Open full grant</Link><div className="flex items-center gap-2"><label htmlFor="grant-detail-status" className="sr-only">Change grant status</label><select id="grant-detail-status" value={status} onChange={(event) => setStatus(event.target.value as GrantDetailDto["status"])} className="h-8 max-w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50">{Object.values(GrantStatus).map((value) => <option key={value}>{value}</option>)}</select><Button size="sm" onClick={() => void saveStatus()} disabled={isSaving}>{isSaving ? "Saving…" : "Change status"}</Button></div></div>
          {statusError && <p role="alert" className="mt-3 rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2 text-sm text-destructive">{statusError}</p>}
          {statusSuccess && <p role="status" className="mt-3 rounded-md border border-success/30 bg-status-approved px-3 py-2 text-sm text-status-approved-fg">{statusSuccess}</p>}
          <dl className="mt-5 divide-y border-y border-border"><div className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-4 py-3"><dt className="text-label text-muted-foreground">Deadline</dt><dd className="min-w-0 break-words text-sm font-medium">{grant.deadline ? date(grant.deadline) : "—"}</dd></div><div className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-4 py-3"><dt className="text-label text-muted-foreground">Amount requested</dt><dd className="min-w-0 break-words font-mono text-sm font-normal text-muted-foreground tabular-nums">{grant.amountRequested ? formatAmount(grant.amountRequested, grant.currency) : "—"}</dd></div><div className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-4 py-3"><dt className="text-label text-muted-foreground">Next steps</dt><dd className="min-w-0 whitespace-pre-wrap break-words text-sm font-medium">{grant.nextSteps || "—"}</dd></div></dl>
        </div>
      </SheetContent>
    </Sheet>
    {isEditing && <GrantForm key={grant.updatedAt} open funders={funders} grant={grant} onClose={() => setIsEditing(false)} onSaved={() => { setIsEditing(false); router.refresh(); }} />}
  </>;
}
