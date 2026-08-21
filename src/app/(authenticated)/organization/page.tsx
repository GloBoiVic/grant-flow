import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { resolveAuthorization } from "@/lib/clerk/authorization";
import OrganizationOnboardingForm from "@/components/auth/organization-onboarding-form";

export default async function OrganizationPage(): Promise<React.ReactNode> {
  const authorization = await resolveAuthorization();
  if (authorization.status === "unauthenticated") redirect("/login");
  if (authorization.status !== "no-active-organization") redirect("/access");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <div className="mb-6 flex w-full max-w-md items-center justify-between">
        <div><p className="text-label text-muted-foreground">GrantFlow</p><h1 className="mt-1 text-title text-foreground">Choose an organization</h1></div>
        <UserButton />
      </div>
       <p className="max-w-md text-center text-sm leading-6 text-muted-foreground">Create your first organization to start using GrantFlow.</p>
       <OrganizationOnboardingForm />
    </main>
  );
}
