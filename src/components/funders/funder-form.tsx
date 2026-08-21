"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, X } from "lucide-react";

import { createFunder } from "@/app/(authenticated)/(org-required)/grants/actions";
import { Button } from "@/components/ui/button";
import { FunderType } from "@/lib/validations/funder";

const funderTypeLabels: Record<FunderType, string> = {
  FOUNDATION: "Foundation",
  FAMILY_FUND: "Family Fund",
  CORPORATION: "Corporation",
  OTHER: "Other",
};

interface FunderFormProps {
  open: boolean;
  onClose: () => void;
}

export function FunderForm({ open, onClose }: FunderFormProps): React.ReactNode {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<FunderType>(FunderType.FOUNDATION);
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setFormError(null);
    setSuccess(false);

    const result = await createFunder({ name, type, website });
    if (!result.success) {
      setErrors(result.errors ?? {});
      setFormError(result.error);
      setIsSubmitting(false);
      return;
    }

    setName("");
    setType(FunderType.FOUNDATION);
    setWebsite("");
    setSuccess(true);
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <section id="add-funder-form" className="mt-6 rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6" aria-labelledby="add-funder-title">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="add-funder-title" className="text-h2 text-foreground">Add funder</h2>
          <p className="mt-1 text-sm text-muted-foreground">Create the funder record you will connect to grants.</p>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Close add funder form" onClick={onClose}>
          <X aria-hidden="true" />
        </Button>
      </div>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
        {formError && (
          <p className="rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2 text-sm text-destructive" role="alert">
            {formError}
          </p>
        )}
        {success && (
          <p className="flex items-center gap-2 rounded-md border border-success/30 bg-status-approved px-3 py-2 text-sm text-status-approved-fg" role="status">
            <Check aria-hidden="true" className="size-4" /> Funder added successfully.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="funder-name" className="text-sm font-medium text-foreground">Name <span aria-hidden="true">*</span></label>
            <input id="funder-name" name="name" value={name} onChange={(event) => setName(event.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "funder-name-error" : undefined} autoComplete="organization" className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50" />
            {errors.name && <p id="funder-name-error" className="mt-1 text-sm text-destructive">{errors.name[0]}</p>}
          </div>
          <div>
            <label htmlFor="funder-type" className="text-sm font-medium text-foreground">Type <span aria-hidden="true">*</span></label>
            <select id="funder-type" name="type" value={type} onChange={(event) => setType(event.target.value as FunderType)} className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50">
              {Object.values(FunderType).map((value) => <option key={value} value={value}>{funderTypeLabels[value]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="funder-website" className="text-sm font-medium text-foreground">Website <span className="font-normal text-muted-foreground">(optional)</span></label>
            <input id="funder-website" name="website" type="url" inputMode="url" value={website} onChange={(event) => setWebsite(event.target.value)} aria-invalid={Boolean(errors.website)} aria-describedby={errors.website ? "funder-website-error" : undefined} placeholder="https://example.org" className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition placeholder:text-fg-muted focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50" />
            {errors.website && <p id="funder-website-error" className="mt-1 text-sm text-destructive">{errors.website[0]}</p>}
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Adding…" : <><Plus aria-hidden="true" /> Add funder</>}</Button>
        </div>
      </form>
    </section>
  );
}
