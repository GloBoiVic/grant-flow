"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { FunderDto } from "@/types/funder";

import { FunderForm } from "./funder-form";

interface FunderDetailSheetProps {
  funder: FunderDto;
  open: boolean;
  onClose: () => void;
  onSaved: (funder: FunderDto) => void;
}

const typeLabels: Record<FunderDto["type"], string> = {
  FOUNDATION: "Foundation",
  FAMILY_FUND: "Family Fund",
  CORPORATION: "Corporation",
  OTHER: "Other",
};

function DetailField({ label, children, fullWidth = false }: { label: string; children: React.ReactNode; fullWidth?: boolean }): React.ReactNode {
  return (
    <div className={`min-w-0 ${fullWidth ? "sm:col-span-2" : ""}`}>
      <dt className="text-label text-muted-foreground">{label}</dt>
      <dd className="mt-1 min-w-0 break-words text-sm text-foreground">{children}</dd>
    </div>
  );
}

export function FunderDetailSheet({ funder, open, onClose, onSaved }: FunderDetailSheetProps): React.ReactNode {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isEditDirty, setIsEditDirty] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);

  function handleOpenChange(nextOpen: boolean): void {
    if (!nextOpen) {
      if (isEditing && isEditDirty && !window.confirm("Discard unsaved funder changes?")) return;
      setIsEditing(false);
      setIsEditDirty(false);
      onClose();
    }
  }

  function handleSaved(updatedFunder: FunderDto): void {
    setIsEditing(false);
    setIsEditDirty(false);
    setSuccess("Funder updated successfully.");
    onSaved(updatedFunder);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="min-w-0 overflow-hidden">
        {isEditing ? (
          <>
            <SheetHeader>
              <SheetTitle className="pr-8 text-h2">Edit funder</SheetTitle>
              <SheetDescription>Update the funder record without leaving your portfolio.</SheetDescription>
            </SheetHeader>
            <FunderForm key={funder.id} open funder={funder} onClose={() => { setIsEditing(false); setIsEditDirty(false); }} onDirtyChange={setIsEditDirty} onSaved={handleSaved} />
          </>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="pr-8 break-words text-h2">{funder.name}</SheetTitle>
              <SheetDescription>Funder record details and maintenance fields.</SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-5">
              {success && <p className="rounded-md border border-success/30 bg-status-approved px-3 py-2 text-sm text-status-approved-fg" role="status" aria-live="polite">{success}</p>}
              <dl className="mt-5 grid min-w-0 grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                <DetailField label="Name">{funder.name}</DetailField>
                <DetailField label="Type">{typeLabels[funder.type]}</DetailField>
                <DetailField label="Website">
                  {funder.website ? <a className="block break-all text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2" href={funder.website} target="_blank" rel="noreferrer">{funder.website}</a> : <span className="text-muted-foreground">—</span>}
                </DetailField>
                <DetailField label="County served">{funder.countyServed || <span className="text-muted-foreground">—</span>}</DetailField>
                <DetailField label="Notes" fullWidth>{funder.notes ? <p className="whitespace-pre-wrap break-words">{funder.notes}</p> : <span className="text-muted-foreground">No notes recorded.</span>}</DetailField>
              </dl>
            </div>
            <SheetFooter>
              <Button type="button" variant="outline" onClick={() => { setSuccess(null); setIsEditDirty(false); setIsEditing(true); }}>Edit funder</Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
