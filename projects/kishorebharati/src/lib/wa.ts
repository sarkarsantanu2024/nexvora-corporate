/** WhatsApp click-to-chat links. No paid API: the sender's own WhatsApp opens with the text ready. */

/** Any Indian number → 9198xxxxxxxx, or '' when it cannot be one. */
export function waPhone(raw: string | null | undefined): string {
  const digits = (raw ?? '').replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return '';
}

export function waLink(phone: string | null | undefined, text = ''): string {
  const to = waPhone(phone);
  if (!to) return '';
  return `https://wa.me/${to}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

/**
 * "Namaste {name}" + { name: 'Asha' } → "Namaste Asha". A {word} with no value
 * is left as it is, so a typing mistake in the owner's wording shows up in the
 * message instead of silently disappearing.
 */
export function fillTemplate(template: string, values: Record<string, string | number | null | undefined>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => {
    const value = values[key];
    return value === undefined || value === null ? whole : String(value);
  });
}

export const telLink =(phone: string | null | undefined) => {
  const digits = (phone ?? '').replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : '';
};
