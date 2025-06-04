const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat("en-US", {
  numeric: "auto",
});

/**
 * Format a date to a readable string (e.g., "Jan 15, 2024, 3:30 PM")
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return DATE_FORMATTER.format(dateObj);
}

/**
 * Format a date to a relative string (e.g., "2 days ago", "just now")
 * Fixed to handle timezone issues properly
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  
  // Calculate difference in milliseconds, then convert to seconds
  const diffInMs = dateObj.getTime() - now.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  // For very recent timestamps (within 2 minutes), always show "just now"
  if (Math.abs(diffInSeconds) < 120) {
    return "just now";
  }

  if (Math.abs(diffInDays) > 30) {
    return formatDate(dateObj);
  }

  if (Math.abs(diffInDays) > 0) {
    return RELATIVE_FORMATTER.format(diffInDays, "day");
  }

  if (Math.abs(diffInHours) > 0) {
    return RELATIVE_FORMATTER.format(diffInHours, "hour");
  }

  if (Math.abs(diffInMinutes) > 0) {
    return RELATIVE_FORMATTER.format(diffInMinutes, "minute");
  }

  return "just now";
}
