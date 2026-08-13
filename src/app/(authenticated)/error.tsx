"use client";

interface AuthenticatedErrorProps {
  reset: () => void;
}

export default function AuthenticatedError({ reset }: AuthenticatedErrorProps): React.ReactNode {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <section className="w-full max-w-md rounded-md border border-border bg-card p-6 text-center shadow-sm">
        <h1 className="text-title text-foreground">We couldn’t load GrantFlow</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong while loading this page. Please try again.</p>
        <button type="button" onClick={reset} className="mt-5 h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Try again
        </button>
      </section>
    </main>
  );
}
