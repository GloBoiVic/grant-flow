import { redirect } from "next/navigation";

import ProjectionPendingRetry from "@/components/auth/projection-pending-retry";
import { resolveAuthorization } from "@/lib/clerk/authorization";

export default async function AccessPage(): Promise<React.ReactNode> {
  const authorization = await resolveAuthorization();

  if (authorization.status === "unauthenticated") redirect("/login");
  if (authorization.status === "no-active-organization") redirect("/organization");
  if (authorization.status === "authenticated") redirect("/dashboard");

  const isProjectionPending = authorization.status === "projection-pending";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <section className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-sm" aria-labelledby="access-title">
        <p className="text-label text-muted-foreground">GrantFlow</p>
        <h1 id="access-title" className="mt-2 text-title text-foreground">
          {isProjectionPending ? "Getting things ready" : "Access unavailable"}
        </h1>
        {isProjectionPending ? (
          <ProjectionPendingRetry />
        ) : (
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Your access could not be confirmed. Please try again later.
          </p>
        )}
      </section>
    </main>
  );
}