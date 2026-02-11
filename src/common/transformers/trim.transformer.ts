import { Transform } from 'class-transformer';

/** Sanitize: trim string inputs to prevent padding/whitespace issues. */
export function Trim() {
  return Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  );
}
