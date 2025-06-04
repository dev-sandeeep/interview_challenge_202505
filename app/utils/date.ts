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
 * Fixed to handle timezone issues and calculation logic properly
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  
  // Calculate difference in milliseconds (now - past = positive for past dates)
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  // Handle future dates (shouldn't happen for notes, but just in case)
  if (diffInMs < 0) {
    return "just now";
  }

  // For very recent timestamps (within 2 minutes), always show "just now"
  if (diffInSeconds < 120) {
    return "just now";
  }

  // For dates more than 30 days old, show the full date
  if (diffInDays > 30) {
    return formatDate(dateObj);
  }

  // Use negative values for RELATIVE_FORMATTER since we want "X ago" format
  if (diffInDays > 0) {
    return RELATIVE_FORMATTER.format(-diffInDays, "day");
  }

  if (diffInHours > 0) {
    return RELATIVE_FORMATTER.format(-diffInHours, "hour");
  }

  if (diffInMinutes > 0) {
    return RELATIVE_FORMATTER.format(-diffInMinutes, "minute");
  }

  return "just now";
}
