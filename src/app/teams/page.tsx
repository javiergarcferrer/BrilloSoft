import { RequireModule } from "@/components/auth/require-module";
import { TeamsView } from "@/components/teams/teams-view";

export default function TeamsPage() {
  return (
    <RequireModule module="teams">
      <TeamsView />
    </RequireModule>
  );
}
