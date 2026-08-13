import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";

export default function DashboardBoundaryPage(): React.ReactNode {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <section className="w-full max-w-lg rounded-md border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4"><div><p className="text-label text-muted-foreground">Authenticated boundary</p><h1 className="mt-1 text-title text-foreground">Dashboard access is ready</h1></div><UserButton /></div>
        <p className="mt-3 text-sm text-muted-foreground">Your active organization is selected. GrantFlow features will appear here in a later task.</p>
        <div className="mt-5"><OrganizationSwitcher hidePersonal afterSelectOrganizationUrl="/dashboard" afterCreateOrganizationUrl="/dashboard" /></div>
      </section>
    </main>
  );
}
