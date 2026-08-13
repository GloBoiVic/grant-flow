import { OrganizationList, UserButton } from "@clerk/nextjs";

export default function OrganizationPage(): React.ReactNode {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <div className="mb-6 flex w-full max-w-md items-center justify-between">
        <div><p className="text-label text-muted-foreground">GrantFlow</p><h1 className="mt-1 text-title text-foreground">Choose an organization</h1></div>
        <UserButton />
      </div>
      <OrganizationList hidePersonal afterSelectOrganizationUrl="/dashboard" afterCreateOrganizationUrl="/dashboard" />
    </main>
  );
}
