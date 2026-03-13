export function formatBackendDateTime(value: string | Date | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const parsedDate = parseDate(value);

  if (!parsedDate) {
    return String(value);
  }

  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(parsedDate);
}

function parseDate(value: string | Date | number): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'number') {
    const dateFromNumber = new Date(value);
    return Number.isNaN(dateFromNumber.getTime()) ? null : dateFromNumber;
  }

  const normalized = normalizeIsoString(value);
  const parsed = new Date(normalized);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

function normalizeIsoString(value: string): string {
  const trimmed = value.trim().replace(' ', 'T');

  return trimmed.replace(/(\.\d{3})\d+/, '$1');
}
