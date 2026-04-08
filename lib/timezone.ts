import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Get user's timezone, falling back to browser timezone
 */
export function getUserTimezone(): string {
  // Try to get from localStorage first (if user has set it)
  const stored = typeof window !== "undefined" ? localStorage.getItem("user_timezone") : null;
  if (stored) return stored;
  
  // Fallback to browser timezone
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Convert a date from user's timezone to UTC for storage
 */
export function toUTC(date: dayjs.Dayjs, userTimezone: string): Date {
  return date.tz(userTimezone).utc().toDate();
}

/**
 * Convert a UTC date to user's timezone for display
 */
export function fromUTC(utcDate: Date | string, userTimezone: string): dayjs.Dayjs {
  return dayjs.utc(utcDate).tz(userTimezone);
}

/**
 * Format a date for datetime-local input in user's timezone
 */
export function formatForDateTimeLocal(date: dayjs.Dayjs, userTimezone: string): string {
  return date.tz(userTimezone).format("YYYY-MM-DDTHH:mm");
}

/**
 * Parse datetime-local input value to UTC Date
 * The datetime-local input provides a value without timezone info
 * We interpret it as being in the user's configured timezone
 */
export function parseDateTimeLocal(value: string, userTimezone: string): Date {
  // datetime-local input value is in format "YYYY-MM-DDTHH:mm" (no timezone)
  // We interpret this as being in the user's configured timezone
  // Create a dayjs object in the user's timezone, then convert to UTC
  return dayjs.tz(value, userTimezone).utc().toDate();
}

/**
 * Get timezone abbreviation (e.g., "PST", "EST", "GMT")
 * Uses Intl API for reliable timezone abbreviation detection
 */
export function getTimezoneAbbr(userTimezone: string): string {
  // Validate timezone input
  if (!userTimezone || typeof userTimezone !== "string" || userTimezone.trim() === "") {
    // Fallback to browser timezone if invalid
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    userTimezone = browserTz;
  }

  try {
    // Use Intl API to get timezone abbreviation - more reliable than dayjs format("z")
    const formatter = new Intl.DateTimeFormat("en", {
      timeZone: userTimezone,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(new Date());
    const tzAbbr = parts.find((p) => p.type === "timeZoneName")?.value;
    
    // If we got a valid abbreviation (not empty, not just "Z"), return it
    if (tzAbbr && tzAbbr.length > 0 && tzAbbr !== "Z") {
      return tzAbbr;
    }
    
    // If Intl returns "Z", the timezone might actually be UTC
    // But let's also check the offset to be sure
    const now = dayjs().tz(userTimezone);
    const offset = now.utcOffset();
    
    // If offset is 0, it's actually UTC, so "Z" is correct
    if (offset === 0 && tzAbbr === "Z") {
      return "UTC";
    }
    
    // Fallback: get offset-based abbreviation for non-UTC timezones
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    const sign = offset >= 0 ? "+" : "-";
    
    // Return UTC offset format as fallback
    if (minutes === 0) {
      return `UTC${sign}${hours}`;
    }
    return `UTC${sign}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  } catch (error) {
    // Final fallback: try to extract a readable name from the timezone string
    console.warn("Failed to get timezone abbreviation for:", userTimezone, error);
    const parts = userTimezone.split("/");
    if (parts.length > 1) {
      // Return the last part (e.g., "Los_Angeles" from "America/Los_Angeles")
      return parts[parts.length - 1].replace(/_/g, " ");
    }
    return userTimezone || "UTC";
  }
}

/**
 * Get timezone display name (e.g., "America/Los_Angeles" -> "Pacific Time")
 */
export function getTimezoneDisplayName(userTimezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en", {
      timeZone: userTimezone,
      timeZoneName: "long",
    });
    const parts = formatter.formatToParts(new Date());
    const tzName = parts.find((p) => p.type === "timeZoneName")?.value;
    return tzName || userTimezone;
  } catch {
    return userTimezone;
  }
}

