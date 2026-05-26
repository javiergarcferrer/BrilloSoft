import { RequireModule } from "@/components/auth/require-module";
import { AccountingView } from "@/components/accounting/accounting-view";

export default function AccountingPage() {
  return (
    <RequireModule module="accounting">
      <AccountingView />
    </RequireModule>
  );
}
