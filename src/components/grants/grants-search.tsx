"use client";

import type { FormEvent, MouseEvent } from "react";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export function GrantsSearch(): React.ReactNode {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get("q") ?? "";
  const submitSearch = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("q");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (typeof value === "string" && value.trim()) params.set("q", value.trim()); else params.delete("q");
    router.push(`/grants${params.toString() ? `?${params}` : ""}`);
  };
  const clearSearch = (event: MouseEvent<HTMLButtonElement>): void => {
    const input = event.currentTarget.form?.elements.namedItem("q");
    if (input instanceof HTMLInputElement) input.value = "";
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q"); params.delete("page");
    router.push(`/grants${params.toString() ? `?${params}` : ""}`);
  };
  return <form onSubmit={submitSearch} className="w-full max-w-70">
    <label className="sr-only" htmlFor="grant-search">Search grants or funders</label>
    <div className="relative">
      <Search aria-hidden="true" className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
      <input key={currentSearch} id="grant-search" name="q" defaultValue={currentSearch} placeholder="Search grants, funders…" className="h-9 w-full rounded-md border border-input bg-muted pl-8 pr-8 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
      {currentSearch && <button type="button" aria-label="Clear search" onClick={clearSearch} className="absolute right-2 top-2 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"><X aria-hidden="true" className="size-4" /></button>}
    </div>
  </form>;
}
