// Run: node --experimental-strip-types src/lib/dob.test.ts
import { dobError, formatDob, isValidDob } from './dob.ts';

const NOW = new Date(2026, 7, 29); // 2026-08-29, so years run 1906..2026
const mask = (input: string) => formatDob(input, NOW);

const eq = (got: unknown, want: unknown, what: string) => {
  if (got !== want) throw new Error(`${what}: got ${String(got)}, want ${String(want)}`);
};

// --- mask: grouping ---
eq(mask('1'), '1', 'single digit');
eq(mask('12'), '12', 'no separator until the next digit arrives');
eq(mask('123'), '12 / 3', 'separator appears with the day');
eq(mask('12251990'), '12 / 25 / 1990', 'full date');
eq(mask('12 / '), '12', 'backspacing a separator does not restore it');
eq(mask('abc12/25!1990xyz'), '12 / 25 / 1990', 'non-digits stripped');
eq(mask('1225199099'), '12 / 25 / 1990', 'capped at 8 digits');

// --- mask: month cannot exceed 12 ---
eq(mask('9'), '09', 'a lone 9 can only mean September');
eq(mask('2'), '02', 'a lone 2 can only mean February');
eq(mask('1'), '1', 'a lone 1 stays open — 1, 10, 11 and 12 are all live');
eq(mask('13'), '01 / 3', '13 is not a month, so it reads as January the 3rd');
eq(mask('19'), '01 / 09', '19 rolls into January, and a lone 9 can only be the 9th');
eq(mask('11'), '11', 'November survives');
eq(mask('12'), '12', 'December survives');
eq(mask('10'), '10', 'October survives');
eq(mask('00'), '0', 'month 00 is rejected, the leading 0 stays');

// --- mask: day cannot exceed 31 ---
eq(mask('114'), '11 / 04', 'a lone 4 can only mean the 4th');
eq(mask('1131'), '11 / 31', 'the 31st survives');
eq(mask('1132'), '11 / 03 / 2', '32 is not a day, so 2 starts the year');
eq(mask('1130'), '11 / 30', 'the 30th survives');
eq(mask('1100'), '11 / 0', 'day 00 is rejected, the leading 0 stays');

// --- mask: year restricted to the last 120 ---
eq(mask('12251899'), '12 / 25 / 199', '1899 is out of range, the 8 is dropped');
eq(mask('12251906'), '12 / 25 / 1906', 'oldest allowed year');
eq(mask('12252026'), '12 / 25 / 2026', 'current year is typable');
eq(mask('12252027'), '12 / 25 / 202', 'next year is refused');
eq(mask('12252030'), '12 / 25 / 200', '203x is refused, the 0 that follows is kept');
eq(mask('12253'), '12 / 25', 'no year can start with 3');
eq(mask('122519'), '12 / 25 / 19', '19xx prefix accepted');
eq(mask('122520'), '12 / 25 / 20', '20xx prefix accepted');
eq(mask('122518'), '12 / 25 / 1', '18xx prefix refused');

// --- masking is idempotent: re-feeding output must not change it ---
for (const s of ['09', '01 / 3', '11 / 04', '12 / 25 / 1990', '12 / 25 / 20']) {
  eq(mask(s), s, `idempotent: ${s}`);
}

// --- validation: what the mask cannot catch ---
eq(isValidDob('12 / 25 / 1990', NOW), true, 'real past date');
eq(isValidDob('02 / 29 / 2024', NOW), true, 'leap day');
eq(isValidDob('02 / 30 / 2024', NOW), false, 'Feb 30 rejected, not rolled over');
eq(isValidDob('02 / 29 / 2023', NOW), false, 'leap day in a non-leap year');
eq(isValidDob('04 / 31 / 2000', NOW), false, 'April has 30 days');
eq(isValidDob('13 / 01 / 1990', NOW), false, 'month 13');
eq(isValidDob('00 / 10 / 1990', NOW), false, 'month 0');
eq(isValidDob('01 / 00 / 1990', NOW), false, 'day 0');
eq(isValidDob('01 / 01 / 0012', NOW), false, 'two-digit year not widened to 1912');
eq(isValidDob('12 / 25 / 2026', NOW), false, 'later this year is still the future');
eq(isValidDob('08 / 30 / 2026', NOW), false, 'tomorrow');
eq(isValidDob('08 / 29 / 2026', NOW), true, 'today');
eq(isValidDob('01 / 01 / 1899', NOW), false, 'older than 120 years');
eq(isValidDob('12 / 25 / 19', NOW), false, 'incomplete');
eq(isValidDob('', NOW), false, 'empty');

// --- error surfaces only once the mask is full ---
eq(dobError('12 / 2'), undefined, 'silent while incomplete');
eq(dobError('02 / 30 / 2024'), 'Enter a valid date of birth', 'complete but impossible');
eq(dobError('12 / 25 / 1990'), undefined, 'valid');

console.log('dob: all checks passed');
