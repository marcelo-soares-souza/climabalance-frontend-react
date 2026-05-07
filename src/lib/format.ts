import i18n from '@/config/i18n';

function getLocale(): string {
  return i18n.language || 'pt-BR';
}

export function formatCurrency(value: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

export function formatNumber(value: number, locale?: string, decimals = 2): string {
  return new Intl.NumberFormat(locale ?? getLocale(), { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
}

export function formatDate(dateStr: string, locale?: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(locale ?? getLocale(), { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function formatDateTime(dateStr: string, locale?: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString(locale ?? getLocale(), {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatTCO2e(value: number): string {
  return `${formatNumber(value)} tCO2e`;
}

export function formatKgCO2e(value: number): string {
  return `${formatNumber(value, undefined, 1)} kg CO2e`;
}

export function maskDocumentNumber(value: string): string {
  const visible = value.trim().slice(-4);
  return visible ? `***${visible}` : '***';
}

export function maskEmail(value: string | null | undefined): string {
  if (!value) return '';
  const atIndex = value.indexOf('@');
  if (atIndex <= 0) return value;
  const local = value.slice(0, atIndex);
  const domain = value.slice(atIndex);
  if (local.length <= 2) return `${local.slice(0, 1)}***${domain}`;
  return `${local.slice(0, 2)}***${domain}`;
}
