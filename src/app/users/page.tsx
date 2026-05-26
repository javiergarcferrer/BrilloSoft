import { RequireModule } from "@/components/auth/require-module";
import { UsersView } from "@/components/users/users-view";

export default function UsersPage() {
  return (
    <RequireModule module="users">
      <UsersView />
    </RequireModule>
  );
}
