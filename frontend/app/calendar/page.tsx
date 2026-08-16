// Server Component (デフォルト)。実体はクライアントコンポーネントのCalendarViewに委譲する。

import { CalendarView } from "@/components/calendar/calendar-view";

export default function CalendarPage() {
  return <CalendarView />;
}
