"use client";

import { useState, useTransition } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import { createFirstOrganization } from "@/app/(authenticated)/organization/actions";

export default function OrganizationOnboardingForm(): React.ReactNode {
  const router = useRouter();
  const { setActive } = useClerk();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function submit(formData: FormData): void {
    setError(null);
    startTransition(async () => {
      const result = await createFirstOrganization({ name: formData.get("name") });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setPending(true);
      try {
        await setActive({ organization: result.clerkOrgId });
        router.push("/dashboard");
        router.refresh();
      } catch {
        setError("Your organization is created and is still activating. Check again shortly.");
      }
    });
  }

  if (pending) {
    return <p className="mt-2 text-center text-sm leading-6 text-muted-foreground">Organization created. Activating your workspace…</p>;
  }

  return (
    <form action={submit} className="mt-6 space-y-4 text-left">
      <label className="block text-sm font-medium text-foreground" htmlFor="organization-name">Organization name</label>
      <input id="organization-name" name="name" required maxLength={120} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <button type="submit" disabled={isPending} className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
        {isPending ? "Creating…" : "Create organization"}
      </button>
    </form>
  );
}
