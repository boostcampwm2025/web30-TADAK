const ROMAN_NUMERALS: Record<number, string> = {
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
};

export function toRomanNumeral(division: number): string {
  return ROMAN_NUMERALS[division] || String(division);
}
