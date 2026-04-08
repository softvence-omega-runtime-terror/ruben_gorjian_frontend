import { Suspense } from "react";
import { CalendarProvider } from "./calendar-context";
import EnhancedCalendar from "./enhanced-calendar";

function CalendarContent() {
  return (
    <CalendarProvider>
      <EnhancedCalendar />
    </CalendarProvider>
  );
}

export default function CalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="text-slate-400">Loading calendar...</div>
        </div>
      }
    >
      <CalendarContent />
    </Suspense>
  );
}
