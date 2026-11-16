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

/** "Hello {name}" + { name: 'Riya' } → "Hello Riya" */
export const fillTemplate = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));

export const telLink = (phone: string | null | undefined) => {
  const digits = (phone ?? '').replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : '';
};
