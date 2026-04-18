import { formatBackendDateTime } from './date-time.util';

type GenericRecord = Record<string, unknown>;

export interface AuditDisplayData {
  estadoActual: string;
  usuarioCreacion: string;
  fechaCreacion: string;
  usuarioActualizacion: string;
  fechaActualizacion: string;
}

export function sortByIndice<T>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    const leftIndex = getNumericValue(left, ['indice', 'index', 'orden'], Number.MAX_SAFE_INTEGER);
    const rightIndex = getNumericValue(right, ['indice', 'index', 'orden'], Number.MAX_SAFE_INTEGER);

    if (leftIndex !== rightIndex) {
      return leftIndex - rightIndex;
    }

    return getTextValue(left).localeCompare(getTextValue(right), 'es', { sensitivity: 'base' });
  });
}

export function sortByNombre<T>(items: T[]): T[] {
  return [...items].sort((left, right) =>
    getTextValue(left).localeCompare(getTextValue(right), 'es', { sensitivity: 'base' })
  );
}

export function resolveAuditValue(item: unknown, keys: string[], fallback = '-'): string {
  const value = getValue(item, keys);

  if (value === null || value === undefined) {
    return fallback;
  }

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : fallback;
}

export function resolveAuditDate(item: unknown, keys: string[], fallback = '-'): string {
  const value = getValue(item, keys);

  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  return formatBackendDateTime(value as string | Date | number);
}

export function resolveEstadoLabel(item: unknown, fallback = '-'): string {
  const estado = resolveAuditValue(item, ['estado', 'status', 'estadoNombre'], fallback).toUpperCase();

  if (estado === 'A' || estado === 'ACTIVO') {
    return 'Activo';
  }

  if (estado === 'I' || estado === 'INACTIVO') {
    return 'Inactivo';
  }

  if (estado === 'B' || estado === 'BLOQUEADO') {
    return 'Bloqueado';
  }

  return estado === fallback.toUpperCase() ? fallback : estado;
}

export function getDefaultAuditData(loggedUserName: string, fallback = '-'): AuditDisplayData {
  const usuarioCreacion = loggedUserName?.trim() || fallback;

  return {
    estadoActual: 'Activo',
    usuarioCreacion,
    fechaCreacion: formatBackendDateTime(new Date()),
    usuarioActualizacion: fallback,
    fechaActualizacion: fallback
  };
}

function getNumericValue(item: unknown, keys: string[], fallback: number): number {
  const value = getValue(item, keys);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getTextValue(item: unknown): string {
  return resolveAuditValue(item, ['nombre', 'etiqueta', 'descripcion'], '');
}

function getValue(item: unknown, keys: string[]): unknown {
  if (!item || typeof item !== 'object') {
    return undefined;
  }

  const record = item as GenericRecord;

  for (const key of keys) {
    if (key in record) {
      return record[key];
    }
  }

  return undefined;
}
