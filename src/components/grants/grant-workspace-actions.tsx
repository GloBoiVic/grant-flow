"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { changeGrantStatus } from "@/app/(authenticated)/(org-required)/grants/actions";
import { Button } from "@/components/ui/button";
import { GrantStatus } from "@/lib/validations/grant";
import type { FunderDto } from "@/types/funder";
import type { GrantDetailDto } from "@/types/grant";

import { GrantForm } from "./grant-form";

export interface GrantWorkspaceActionsProps {
  grant: GrantDetailDto;
  funders: FunderDto[];
}

export function GrantWorkspaceActions({ grant, funders }: GrantWorkspaceActionsProps): React.ReactNode {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState(grant.status);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function saveStatus(): Promise<void> {
    setIsSaving(true);
    setStatusError(null);
    setStatusSuccess(null);
    const result = await changeGrantStatus({ grantId: grant.id, status });
    if (!result.success) {
      setStatusError(result.error);
      setIsSaving(false);
      return;
    }

    setStatus(result.data.status);
    setStatusSuccess("Status updated successfully.");
    setIsSaving(false);
    if (grant.status !== result.data.status) router.refresh();
  }

  return (
    <div className="flex min-w-0 flex-col gap-3 sm:items-end">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)}>
          Edit grant
        </Button>
        <div className="flex min-w-0 items-center gap-2">
          <label htmlFor="grant-workspace-status" className="sr-only">Change grant status</label>
          <select
            id="grant-workspace-status"
            value={status}
            disabled={isSaving}
            onChange={(event) => setStatus(event.target.value as GrantDetailDto["status"])}
            className="h-8 min-w-0 max-w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {Object.values(GrantStatus).map((value) => <option key={value}>{value}</option>)}
          </select>
          <Button type="button" size="sm" onClick={() => void saveStatus()} disabled={isSaving}>
            {isSaving ? "Saving…" : "Change status"}
          </Button>
        </div>
      </div>
      {statusError && <p className="rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2 text-sm text-destructive" role="alert">{statusError}</p>}
      {statusSuccess && <p className="rounded-md border border-success/30 bg-status-approved px-3 py-2 text-sm text-status-approved-fg" role="status" aria-live="polite">{statusSuccess}</p>}
      {isEditing && (
        <GrantForm
          key={grant.updatedAt}
          open
          funders={funders}
          grant={grant}
          onClose={() => setIsEditing(false)}
          onSaved={() => {
            setIsEditing(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
