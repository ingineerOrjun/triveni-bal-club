/**
 * Map registration failures to safe, user-facing messages.
 *
 * The capacity/deadline/publish trigger (0005) raises specific, friendly
 * messages we are happy to surface verbatim. Any other database error (e.g. a
 * constraint or connection failure) is replaced with a generic message so raw
 * Postgres internals never reach the UI.
 */
const ALLOWED = [
  "This event is full",
  "The registration deadline has passed",
  "Registration is not open for this event",
  "Event not found",
];

export function friendlyRegistrationError(message: string | undefined): string {
  const msg = (message ?? "").trim();
  if (ALLOWED.some((a) => msg.includes(a))) return msg;
  return "Could not register for this event. Please try again.";
}
