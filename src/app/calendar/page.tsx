import { RequireModule } from "@/components/auth/require-module";
import { CalendarView } from "@/components/calendar/calendar-view";

export default function CalendarPage() {
  return (
    <RequireModule module="calendar">
      <CalendarView />
    </RequireModule>
  );
}
