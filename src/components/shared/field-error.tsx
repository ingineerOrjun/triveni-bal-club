/** Inline validation message tied to a field via `${id}-error`. */
export function FieldError({
  id,
  message,
}: {
  id: string;
  message?: string;
}) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} className="text-caption text-danger">
      {message}
    </p>
  );
}
