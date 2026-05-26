import { RequireModule } from "@/components/auth/require-module";
import { MyJobsView } from "@/components/my-jobs/my-jobs-view";

export default function MyJobsPage() {
  return (
    <RequireModule module="my_jobs">
      <MyJobsView />
    </RequireModule>
  );
}
