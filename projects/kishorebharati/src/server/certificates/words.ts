/**
 * A date of birth in words, as a transfer certificate writes it:
 * '2011-03-15' → 'Fifteenth March Two Thousand Eleven'.
 */
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const ORDINAL_ONES = ['', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth', 'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth', 'Sixteenth', 'Seventeenth', 'Eighteenth', 'Nineteenth'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function under100(n: number): string {
  if (n < 20) return ONES[n];
  return [TENS[Math.floor(n / 10)], ONES[n % 10]].filter(Boolean).join(' ');
}

/** 0 to 9999 in words. */
export function numberInWords(n: number): string {
  if (n === 0) return 'Zero';
  const parts: string[] = [];
  if (n >= 1000) parts.push(`${ONES[Math.floor(n / 1000)]} Thousand`);
  const hundreds = Math.floor((n % 1000) / 100);
  if (hundreds) parts.push(`${ONES[hundreds]} Hundred`);
  if (n % 100) parts.push(under100(n % 100));
  return parts.join(' ');
}

function dayOrdinal(d: number): string {
  if (d < 20) return ORDINAL_ONES[d];
  if (d === 20) return 'Twentieth';
  if (d === 30) return 'Thirtieth';
  return `${TENS[Math.floor(d / 10)]} ${ORDINAL_ONES[d % 10]}`;
}

export function dateInWords(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return '';
  return `${dayOrdinal(d)} ${MONTHS[m - 1]} ${numberInWords(y)}`;
}
