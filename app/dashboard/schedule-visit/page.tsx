"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type VisitConfigResponse = {
  bookingUrl: string | null;
  apiConfigured: boolean;
};

export default function ScheduleVisitPage() {
  const detectedTimezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    [],
  );
  const [scheduledAt, setScheduledAt] = useState("");
  const [timezone, setTimezone] = useState(detectedTimezone);
  const [notes, setNotes] = useState("");
  const [bookingUrl, setBookingUrl] = useState<string | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);
    setScheduledAt(now.toISOString().slice(0, 16));
  }, []);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/visits/config", {
          credentials: "include",
          cache: "no-store",
        });
        const data = (await res.json()) as VisitConfigResponse;
        if (res.ok) {
          setBookingUrl(data.bookingUrl ?? null);
        }
      } catch (err) {
        console.error("Failed to load visits config", err);
      } finally {
        setLoadingConfig(false);
      }
    }

    loadConfig();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!scheduledAt) {
      setError("Please choose an appointment time.");
      return;
    }
    if (!timezone.trim()) {
      setError("Timezone is required.");
      return;
    }

    setSubmitting(true);
    try {
      const isoDate = new Date(scheduledAt).toISOString();
      const res = await fetch("/api/visits/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          scheduledAt: isoDate,
          timezone: timezone.trim(),
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Unable to schedule visit.");
      }

      setMessage(
        "Visit request sent. Admin will be notified through Calendly workflow.",
      );
      const returnedBookingUrl =
        typeof data?.calendly?.bookingUrl === "string"
          ? data.calendly.bookingUrl
          : (data?.bookingUrl ?? null);

      if (returnedBookingUrl) {
        window.open(returnedBookingUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to schedule visit.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Schedule a Visit</h1>
        <p className="mt-1 text-sm text-slate-400">
          Book a visit with Talexia team while social publishing access is
          pending.
        </p>
      </div>

      <Card className="border-slate-800 bg-slate-900/60">
        <CardHeader>
          <CardTitle>Appointment Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Preferred Date & Time</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="America/New_York"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="What should the visit focus on?"
              />
            </div>

            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            {message ? (
              <p className="text-sm text-lime-300">{message}</p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={submitting || loadingConfig}>
                {submitting ? "Scheduling..." : "Schedule Visit"}
              </Button>
              {bookingUrl ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    window.open(bookingUrl, "_blank", "noopener,noreferrer")
                  }
                >
                  Open Calendly
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
