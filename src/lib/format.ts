/**
 * Deterministic date formatting (fixed locale + UTC-agnostic display) so server
 * and client render identically and avoid hydration mismatches.
 */
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "12 Jul 2025" */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "12 July 2025" */
export function formatDateLong(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "10:00 AM" from an ISO datetime (uses the offset baked into the string). */
export function formatTime(iso: string): string {
  // Parse the wall-clock time from the ISO string directly to stay deterministic.
  const match = iso.match(/T(\d{2}):(\d{2})/);
  if (!match) return "";
  let h = parseInt(match[1], 10);
  const m = match[2];
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

/** "12 Jul 2025, 10:00 AM" from an ISO datetime. */
export function formatDateTime(iso: string): string {
  return `${formatDate(iso)}, ${formatTime(iso)}`;
}

/**
 * Convert an ISO/timestamp string to a value for <input type="datetime-local">
 * ("YYYY-MM-DDTHH:mm"). Returns "" for empty input.
 */
export function toDateTimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  return m ? `${m[1]}T${m[2]}` : "";
}

/** Day/month parts for compact "date chips" on event cards. */
export function dateParts(iso: string): { day: string; month: string } {
  const d = new Date(iso);
  return {
    day: String(d.getUTCDate()).padStart(2, "0"),
    month: MONTHS[d.getUTCMonth()].toUpperCase(),
  };
}
