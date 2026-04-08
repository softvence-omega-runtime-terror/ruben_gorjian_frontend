"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { CalendarProvider } from "@/app/dashboard/calendar/calendar-context";
import EnhancedCalendar from "@/app/dashboard/calendar/enhanced-calendar";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

function CalendarContent({ userId }: { userId: string }) {
  return (
    <CalendarProvider targetUserId={userId}>
      <div className="mb-4">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Admin Dashboard
          </Button>
        </Link>
      </div>
      <EnhancedCalendar />
    </CalendarProvider>
  );
}

export default function AdminUserCalendarPage() {
  const params = useParams();
  const userId = params.id as string;

  return (
    <div className="p-6">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen">
            <div className="text-slate-400">Loading client calendar...</div>
          </div>
        }
      >
        <CalendarContent userId={userId} />
      </Suspense>
    </div>
  );
}
