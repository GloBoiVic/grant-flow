import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { getDashboard } from "@/lib/queries/dashboard";

export default async function DashboardPage(): Promise<React.ReactNode> {
  const dto = await getDashboard();
  return <DashboardContent dto={dto} />;
}
