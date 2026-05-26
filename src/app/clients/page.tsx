import { RequireModule } from "@/components/auth/require-module";
import { ClientsView } from "@/components/clients/clients-view";

export default function ClientsPage() {
  return (
    <RequireModule module="clients">
      <ClientsView />
    </RequireModule>
  );
}
