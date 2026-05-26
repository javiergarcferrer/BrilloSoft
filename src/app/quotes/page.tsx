import { RequireModule } from "@/components/auth/require-module";
import { QuotesView } from "@/components/quotes/quotes-view";

export default function QuotesPage() {
  return (
    <RequireModule module="quotes">
      <QuotesView />
    </RequireModule>
  );
}
