"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { FunderDto } from "@/types/funder";
import { FunderDetailSheet } from "./funder-detail-sheet";
import { FunderForm } from "./funder-form";
import { FunderList } from "./funder-list";

interface FunderPageProps {
  funders: FunderDto[];
}

export function FunderPage({ funders }: FunderPageProps): React.ReactNode {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedFunder, setSelectedFunder] = useState<FunderDto | null>(null);

  function handleFunderSaved(funder: FunderDto): void {
    setSelectedFunder(funder);
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-title text-foreground">Funders</h1>
        </div>
        <Button type="button" onClick={() => setIsFormOpen(true)}>
          <Plus aria-hidden="true" /> Add funder
        </Button>
      </div>
      <FunderForm open={isFormOpen} onClose={() => setIsFormOpen(false)} />
      <FunderList funders={funders} onSelect={setSelectedFunder} />
      {selectedFunder && <FunderDetailSheet key={selectedFunder.id} funder={selectedFunder} open onClose={() => setSelectedFunder(null)} onSaved={handleFunderSaved} />}
    </div>
  );
}
