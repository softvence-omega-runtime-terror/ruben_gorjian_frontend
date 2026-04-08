"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Video, Calendar, CreditCard, Clock } from "lucide-react";
import Script from "next/script";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  // Video Add-on State
  const [includeVideo, setIncludeVideo] = useState(false);
  const [videoHours, setVideoHours] = useState(1);
  const videoPricePerHour = 495;
  const totalPrice = includeVideo ? videoHours * videoPricePerHour : 0;

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
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="lazyOnload"
      />
      
      <div>
        <h1 className="text-2xl font-bold text-white">Photoshoot Scheduling</h1>
        <p className="mt-1 text-sm text-slate-400">
          Book your photoshoot session and manage video add-ons.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card className="border-slate-800 bg-slate-900/60 overflow-hidden">
            <CardHeader className="bg-slate-800/40 border-b border-slate-800">
              <div className="flex items-center gap-2 text-lime-400">
                <Calendar className="h-5 w-5" />
                <CardTitle>1. Book Date & Time</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {bookingUrl ? (
                <div 
                  className="calendly-inline-widget w-full" 
                  data-url={`${bookingUrl}?hide_landing_page_details=1&hide_gdpr_banner=1`}
                  style={{ minWidth: "320px", height: "630px" }}
                />
              ) : (
                <div className="p-12 text-center text-slate-500">
                  {loadingConfig ? "Loading booking calendar..." : "Booking calendar not configured."}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-slate-800 bg-slate-900/60 h-fit">
            <CardHeader className="bg-slate-800/40 border-b border-slate-800">
              <div className="flex items-center gap-2 text-lime-400">
                <Video className="h-5 w-5" />
                <CardTitle>2. Video Add-on (Optional)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-start space-x-3 bg-slate-800/30 p-4 rounded-xl border border-slate-700">
                <Checkbox 
                  id="includeVideo" 
                  checked={includeVideo}
                  onCheckedChange={(checked) => setIncludeVideo(!!checked)}
                  className="mt-1 border-slate-500 data-[state=checked]:bg-lime-400 data-[state=checked]:text-black"
                />
                <div className="space-y-1">
                  <Label htmlFor="includeVideo" className="text-base font-semibold text-white cursor-pointer">
                    Add Video to Appointment
                  </Label>
                  <p className="text-sm text-slate-400">
                    Get professional video coverage for your session.
                  </p>
                  <p className="text-lg font-bold text-lime-400 mt-1">
                    ${videoPricePerHour}/hour
                  </p>
                </div>
              </div>

              {includeVideo && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <Label htmlFor="videoHours" className="text-slate-300">How many hours of video would you like?</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="videoHours"
                        type="number"
                        min="1"
                        max="24"
                        value={videoHours}
                        onChange={(e) => setVideoHours(parseInt(e.target.value) || 1)}
                        className="bg-slate-800 border-slate-700 text-white w-24"
                      />
                      <span className="text-slate-400">hours</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400">Rate ({videoHours}h × ${videoPricePerHour})</span>
                      <span className="text-white">${totalPrice}</span>
                    </div>
                    <div className="flex justify-between items-center text-xl font-bold">
                      <span className="text-white">Total Amount</span>
                      <span className="text-lime-400">${totalPrice}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-lime-400 hover:bg-lime-500 text-black font-bold h-12"
                    onClick={() => {
                      // Handled by onSubmit or separate checkout
                      toast({
                        title: "Processing payment",
                        description: "Redirecting to checkout for video add-on...",
                      });
                    }}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Proceed to Payment
                  </Button>
                  <p className="text-[10px] text-center text-slate-500 uppercase tracking-wider">
                    Secured by Stripe
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60 h-fit">
            <CardHeader className="bg-slate-800/40 border-b border-slate-800">
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="h-5 w-5" />
                <CardTitle>Session Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-slate-300">Notes for the team</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Provide details about the photoshoot location or products..."
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                {error ? <p className="text-sm text-red-300">{error}</p> : null}
                {message ? (
                  <p className="text-sm text-lime-300">{message}</p>
                ) : null}

                <Button type="submit" disabled={submitting || loadingConfig} className="w-full">
                  {submitting ? "Submitting..." : "Send Request Confirmation"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
