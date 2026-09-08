"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, X } from "lucide-react";

import { createFunder, editFunder } from "@/app/(authenticated)/(org-required)/grants/actions";
import { Button } from "@/components/ui/button";
import { FunderType } from "@/lib/validations/funder";
import type { FunderDto } from "@/types/funder";

const funderTypeLabels: Record<FunderType, string> = {
  FOUNDATION: "Foundation",
  FAMILY_FUND: "Family Fund",
  CORPORATION: "Corporation",
  OTHER: "Other",
};

interface FunderFormProps {
  open: boolean;
  onClose: () => void;
  funder?: FunderDto;
  onSaved?: (funder: FunderDto) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

interface FunderFormValues {
  name: string;
  type: FunderType;
  website: string;
  countyServed: string;
  notes: string;
}

const blankValues: FunderFormValues = {
  name: "",
  type: FunderType.FOUNDATION,
  website: "",
  countyServed: "",
  notes: "",
};

function valuesFromFunder(funder: FunderDto): FunderFormValues {
  return {
    name: funder.name,
    type: funder.type,
    website: funder.website ?? "",
    countyServed: funder.countyServed ?? "",
    notes: funder.notes ?? "",
  };
}

function nullableValue(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

const inputClassName = "mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50";

export function FunderForm({ open, onClose, funder, onSaved, onDirtyChange }: FunderFormProps): React.ReactNode {
  const router = useRouter();
  const isEditing = Boolean(funder);
  const [values, setValues] = useState<FunderFormValues>(() => funder ? valuesFromFunder(funder) : blankValues);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  if (!open) return null;

  function setValue(key: keyof FunderFormValues, value: string): void {
    setValues((current) => ({ ...current, [key]: value }));
    setIsDirty(true);
    onDirtyChange?.(true);
  }

  function closeForm(): void {
    if (isEditing && isDirty && !window.confirm("Discard unsaved funder changes?")) return;
    setIsDirty(false);
    onDirtyChange?.(false);
    onClose();
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setFormError(null);
    setSuccess(false);

    const input = {
      name: values.name,
      type: values.type,
      website: nullableValue(values.website),
      countyServed: nullableValue(values.countyServed),
      notes: nullableValue(values.notes),
    };
    const result = funder
      ? await editFunder({ funderId: funder.id, ...input })
      : await createFunder(input);
    if (!result.success) {
      setErrors(result.errors ?? {});
      setFormError(result.error);
      setIsSubmitting(false);
      return;
    }

    setIsDirty(false);
    onDirtyChange?.(false);
    setIsSubmitting(false);
    if (funder) {
      onSaved?.(result.data);
      return;
    }

    setValues(blankValues);
    setSuccess(true);
    router.refresh();
  }

  const idPrefix = isEditing ? "edit-funder" : "funder";
  const errorId = (key: keyof FunderFormValues): string => `${idPrefix}-${key}-error`;
  const fieldError = (key: keyof FunderFormValues): React.ReactNode => errors[key] && <p id={errorId(key)} className="mt-1 text-sm text-destructive">{errors[key][0]}</p>;
  const feedback = (
    <>
      {formError && <p className="rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2 text-sm text-destructive" role="alert">{formError}</p>}
      {!isEditing && success && <p className="flex items-center gap-2 rounded-md border border-success/30 bg-status-approved px-3 py-2 text-sm text-status-approved-fg" role="status" aria-live="polite"><Check aria-hidden="true" className="size-4" /> Funder added successfully.</p>}
    </>
  );
  const fields = (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor={`${idPrefix}-name`} className="text-sm font-medium text-foreground">Name <span aria-hidden="true">*</span></label>
        <input id={`${idPrefix}-name`} name="name" value={values.name} onChange={(event) => setValue("name", event.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? errorId("name") : undefined} autoComplete="organization" className={inputClassName} />
        {fieldError("name")}
      </div>
      <div>
        <label htmlFor={`${idPrefix}-type`} className="text-sm font-medium text-foreground">Type <span aria-hidden="true">*</span></label>
        <select id={`${idPrefix}-type`} name="type" value={values.type} onChange={(event) => setValue("type", event.target.value)} aria-invalid={Boolean(errors.type)} aria-describedby={errors.type ? errorId("type") : undefined} autoComplete="off" className={inputClassName}>
          {Object.values(FunderType).map((value) => <option key={value} value={value}>{funderTypeLabels[value]}</option>)}
        </select>
        {fieldError("type")}
      </div>
      <div>
        <label htmlFor={`${idPrefix}-website`} className="text-sm font-medium text-foreground">Website <span className="font-normal text-muted-foreground">(optional)</span></label>
        <input id={`${idPrefix}-website`} name="website" type="url" inputMode="url" value={values.website} onChange={(event) => setValue("website", event.target.value)} aria-invalid={Boolean(errors.website)} aria-describedby={errors.website ? errorId("website") : undefined} autoComplete="url" placeholder="example.org or https://example.org" className={`${inputClassName} placeholder:text-fg-muted`} />
        {fieldError("website")}
      </div>
      <div>
        <label htmlFor={`${idPrefix}-county-served`} className="text-sm font-medium text-foreground">County served <span className="font-normal text-muted-foreground">(optional)</span></label>
        <input id={`${idPrefix}-county-served`} name="countyServed" value={values.countyServed} onChange={(event) => setValue("countyServed", event.target.value)} aria-invalid={Boolean(errors.countyServed)} aria-describedby={errors.countyServed ? errorId("countyServed") : undefined} autoComplete="address-level2" className={inputClassName} />
        {fieldError("countyServed")}
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`${idPrefix}-notes`} className="text-sm font-medium text-foreground">Notes <span className="font-normal text-muted-foreground">(optional)</span></label>
        <textarea id={`${idPrefix}-notes`} name="notes" value={values.notes} onChange={(event) => setValue("notes", event.target.value)} aria-invalid={Boolean(errors.notes)} aria-describedby={errors.notes ? errorId("notes") : undefined} autoComplete="off" rows={5} className={`${inputClassName} h-auto min-h-28 resize-y py-2`} />
        {fieldError("notes")}
      </div>
    </div>
  );
  const actions = (
    <div className={`flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end ${isEditing ? "px-4 pb-4" : ""}`}>
      <Button type="button" variant="outline" onClick={closeForm} disabled={isSubmitting}>Cancel</Button>
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? (isEditing ? "Saving…" : "Adding…") : isEditing ? "Save changes" : <><Plus aria-hidden="true" /> Add funder</>}</Button>
    </div>
  );

  if (isEditing) {
    return <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit} noValidate><div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-4">{feedback}{fields}</div>{actions}</form>;
  }

  return (
    <section id="add-funder-form" className="mt-6 rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6" aria-labelledby="add-funder-title">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="add-funder-title" className="text-h2 text-foreground">Add funder</h2>
          <p className="mt-1 text-sm text-muted-foreground">Create the funder record you will connect to grants.</p>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Close add funder form" onClick={closeForm}>
          <X aria-hidden="true" />
        </Button>
      </div>
      <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
        {feedback}
        {fields}
        {actions}
      </form>
    </section>
  );
}
