import type { FunderDto } from "@/types/funder";

interface FunderListProps {
  funders: FunderDto[];
}

const typeLabels: Record<FunderDto["type"], string> = {
  FOUNDATION: "Foundation",
  FAMILY_FUND: "Family Fund",
  CORPORATION: "Corporation",
  OTHER: "Other",
};

export function FunderList({ funders }: FunderListProps): React.ReactNode {
  if (funders.length === 0) {
    return (
      <section className="mt-6 rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center" aria-labelledby="empty-funders-title">
        <h2 id="empty-funders-title" className="text-h2 text-foreground">No funders yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Add your first funder to start connecting grants to the organizations that support your work.</p>
      </section>
    );
  }

  return (
    <section className="mt-6 overflow-hidden rounded-lg border border-border bg-card shadow-sm" aria-labelledby="funder-list-title">
      <h2 id="funder-list-title" className="sr-only">Funder list</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left text-sm">
          <thead className="border-b border-border bg-muted text-label text-muted-foreground">
            <tr><th scope="col" className="px-3 py-3 font-semibold sm:px-4">Name</th><th scope="col" className="px-3 py-3 font-semibold sm:px-4">Type</th><th scope="col" className="px-3 py-3 font-semibold sm:px-4">Website</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {funders.map((funder) => (
              <tr key={funder.id} className="h-(--layout-table-row-h) hover:bg-accent/50">
                <th scope="row" className="px-3 py-2 font-medium text-foreground sm:px-4">{funder.name}</th>
                <td className="px-3 py-2 text-muted-foreground sm:px-4">{typeLabels[funder.type]}</td>
                <td className="px-3 py-2 sm:px-4">{funder.website ? <a className="text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring" href={funder.website} target="_blank" rel="noreferrer">{funder.website}</a> : <span className="text-muted-foreground">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-border px-4 py-3 text-caption text-muted-foreground">Showing {funders.length} {funders.length === 1 ? "funder" : "funders"}</p>
    </section>
  );
}
