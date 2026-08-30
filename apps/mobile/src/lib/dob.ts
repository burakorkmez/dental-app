const MAX_AGE = 120;

type FieldRange = { start: number; len: number; min: number; max: number };

/** Which of `MM / DD / YYYY` the next digit lands in, and its legal range. */
const fieldAt = (i: number, today: Date): FieldRange =>
  i < 2
    ? { start: 0, len: 2, min: 1, max: 12 }
    : i < 4
      ? { start: 2, len: 2, min: 1, max: 31 }
      : { start: 4, len: 4, min: today.getFullYear() - MAX_AGE, max: today.getFullYear() };

/** Can this half-typed field still grow into a number inside [min, max]? */
const fits = (partial: string, { len, min, max }: FieldRange) =>
  +partial.padEnd(len, '9') >= min && +partial.padEnd(len, '0') <= max;

function push(digits: string, c: string, today: Date): string {
  const field = fieldAt(digits.length, today);
  const partial = digits.slice(field.start) + c;

  if (fits(partial, field)) return digits + c;

  // A lone digit too big for the tens place: "5" in the month means May.
  if (partial.length === 1 && fits('0' + c, field)) return digits + '0' + c;

  // Two digits that can't be a month or day, where the first can stand alone:
  // "1" then "5" means January the 5th. Close the field and re-feed the digit.
  if (partial.length === 2 && field.len === 2 && fits('0' + partial[0], field)) {
    return push(digits.slice(0, -1) + '0' + partial[0], c, today);
  }

  return digits; // nothing sensible to do with it — drop it
}

/**
 * `MM / DD / YYYY` input mask. Digits only, and a digit is accepted solely when
 * the field it lands in can still reach a legal value — so no month past 12, no
 * day past 31, and no year outside the last 120. Separators are appended as each
 * group fills, never ahead of it, so backspace can't stick on one the mask keeps
 * re-adding. Impossible day/month pairings (Feb 30) are left to `isValidDob`.
 */
export function formatDob(input: string, today: Date = new Date()): string {
  let digits = '';
  for (const c of input.replace(/\D/g, '')) {
    if (digits.length >= 8) break;
    digits = push(digits, c, today);
  }
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)]
    .filter(Boolean)
    .join(' / ');
}

/** True only for a complete, real calendar date in the past, within 120 years. */
export function isValidDob(masked: string, today: Date = new Date()): boolean {
  const d = masked.replace(/\D/g, '');
  if (d.length !== 8) return false;
  const [month, day, year] = [+d.slice(0, 2), +d.slice(2, 4), +d.slice(4, 8)];
  const date = new Date(year, month - 1, day);
  // Date silently rolls impossible days over (Feb 30 -> Mar 2), so read it back.
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return false;
  }
  return date <= today && year >= today.getFullYear() - MAX_AGE;
}

/** Complete but wrong — the only state worth interrupting the user for. */
export const dobError = (masked: string): string | undefined =>
  masked.replace(/\D/g, '').length === 8 && !isValidDob(masked)
    ? 'Enter a valid date of birth'
    : undefined;
