import { RequireModule } from "@/components/auth/require-module";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export default function DashboardPage() {
  return (
    <RequireModule module="dashboard">
      <DashboardView />
    </RequireModule>
  );
}
