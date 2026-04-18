"use client";

import { useState, useEffect, useMemo } from "react";
import { getUserSettings } from "@/app/dashboard/settings/utils";
import { getUserTimezone, getTimezoneAbbr, getTimezoneDisplayName } from "@/lib/timezone";

export function useTimezone() {
  const [timezone, setTimezone] = useState<string>(() => getUserTimezone());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTimezone() {
      try {
        const settings = await getUserSettings();
        const userTimezone = settings.business.timezone || getUserTimezone();
        setTimezone(userTimezone);
        
        // Store in localStorage for quick access
        if (typeof window !== "undefined") {
          localStorage.setItem("user_timezone", userTimezone);
        }
      } catch (error) {
        console.error("Failed to load user timezone:", error);
        // Use browser timezone as fallback
        const browserTz = getUserTimezone();
        setTimezone(browserTz);
      } finally {
        setLoading(false);
      }
    }

    loadTimezone();
  }, []);

  const abbr = useMemo(() => getTimezoneAbbr(timezone), [timezone]);
  const displayName = useMemo(() => getTimezoneDisplayName(timezone), [timezone]);

  return useMemo(() => ({
    timezone,
    timezoneAbbr: abbr,
    timezoneDisplayName: displayName,
    loading,
  }), [timezone, abbr, displayName, loading]);
}







