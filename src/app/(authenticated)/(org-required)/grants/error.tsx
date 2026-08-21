"use client";

export default function Error({ reset }: { reset: () => void }): React.ReactNode {
  return <div className="mx-auto max-w-xl px-6 py-16 text-center"><h1 className="text-h2">Grants could not load</h1><p className="mt-2 text-sm text-muted-foreground">Your grants are unavailable right now. Try again.</p><button className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring" onClick={reset}>Try again</button></div>;
}
