"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { FunderDto } from "@/types/funder";
import { FunderForm } from "./funder-form";
import { FunderList } from "./funder-list";

interface FunderPageProps {
  funders: FunderDto[];
}

export function FunderPage({ funders }: FunderPageProps): React.ReactNode {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-title text-foreground">Funders</h1>
          <p className="mt-1 text-sm text-muted-foreground">Organizations that support your grant portfolio.</p>
        </div>
        <Button type="button" onClick={() => setIsFormOpen(true)} aria-expanded={isFormOpen} aria-controls="add-funder-form">
          <Plus aria-hidden="true" /> Add funder
        </Button>
      </div>
      <FunderForm open={isFormOpen} onClose={() => setIsFormOpen(false)} />
      <FunderList funders={funders} />
    </div>
  );
}
