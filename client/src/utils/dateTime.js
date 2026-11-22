// datetime-local values have no timezone. Preserve the user's local wall time.
export function toLocalDateTimeInput(value) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return '';
  const pad = number => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
