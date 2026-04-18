import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

// ─── Rule contract ──────────────────────────────────────────────────────────

export interface DocumentRule {
  /** Full regex the sanitised value must match */
  regex: RegExp;
  minLength: number;
  maxLength: number;
  /** When false, all non-digit characters are stripped on input */
  allowLetters: boolean;
  /** Letters are forced to uppercase (e.g. passport) */
  uppercase?: boolean;
  /** Input hint shown as placeholder */
  placeholder: string;
  /** Human-readable rule description shown below the input */
  hint: string;
  /** Whether the document type has a check digit (informational) */
  hasCheckDigit?: boolean;
}

// ─── Centralised rules by document código ───────────────────────────────────

export const DOCUMENT_RULES: Record<string, DocumentRule> = {
  /** Cédula de Ciudadanía */
  CC: {
    regex: /^[0-9]{8,10}$/,
    minLength: 8,
    maxLength: 10,
    allowLetters: false,
    placeholder: 'Ej: 1023456789',
    hint: 'Cédula de Ciudadanía: 8 a 10 dígitos',
  },
  /** Cédula de Extranjería */
  CE: {
    regex: /^[A-Z0-9]{6,12}$/,
    minLength: 6,
    maxLength: 12,
    allowLetters: true,
    uppercase: true,
    placeholder: 'Ej: E123456',
    hint: 'Cédula de Extranjería: 6 a 12 caracteres alfanuméricos',
  },
  /** Número de Identificación Tributaria */
  NIT: {
    regex: /^[0-9]{9,10}$/,
    minLength: 9,
    maxLength: 10,
    allowLetters: false,
    hasCheckDigit: true,
    placeholder: 'Ej: 9001234567',
    hint: 'NIT: 9 a 10 dígitos (sin guión ni dígito de verificación)',
  },
  /** Pasaporte */
  PA: {
    regex: /^[A-Z0-9]{6,12}$/,
    minLength: 6,
    maxLength: 12,
    allowLetters: true,
    uppercase: true,
    placeholder: 'Ej: AB123456',
    hint: 'Pasaporte: 6 a 12 caracteres alfanuméricos',
  },
  /** Tarjeta de Identidad */
  TI: {
    regex: /^[0-9]{10,11}$/,
    minLength: 10,
    maxLength: 11,
    allowLetters: false,
    placeholder: 'Ej: 12345678901',
    hint: 'Tarjeta de Identidad: 10 a 11 dígitos',
  },
  /** Registro Civil */
  RC: {
    regex: /^[0-9]{10,11}$/,
    minLength: 10,
    maxLength: 11,
    allowLetters: false,
    placeholder: 'Ej: 12345678901',
    hint: 'Registro Civil: 10 a 11 dígitos',
  },
};

/** Fallback applied when the selected type has no specific rule */
export const DEFAULT_DOCUMENT_RULE: DocumentRule = {
  regex: /^[A-Za-z0-9]{4,20}$/,
  minLength: 4,
  maxLength: 20,
  allowLetters: true,
  placeholder: 'Número de identificación',
  hint: 'Identificación: 4 a 20 caracteres',
};

/**
 * Returns the rule for the given document código (case-insensitive).
 * Falls back to DEFAULT_DOCUMENT_RULE when no specific rule is configured.
 */
export function getDocumentRule(codigo: string): DocumentRule {
  return DOCUMENT_RULES[codigo?.toUpperCase()] ?? DEFAULT_DOCUMENT_RULE;
}

// ─── Custom validators ───────────────────────────────────────────────────────

/**
 * Validator factory: validates format, length and character type for a
 * given DocumentRule. Returns null when the control is empty (required
 * validator handles that separately).
 */
export function documentFormatValidator(rule: DocumentRule): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = (control.value ?? '').toString().trim();
    if (!value) return null;

    if (!rule.allowLetters && /[^0-9]/.test(value)) {
      return { soloNumeros: true };
    }

    if (value.length < rule.minLength || value.length > rule.maxLength) {
      return {
        longitudInvalida: {
          min: rule.minLength,
          max: rule.maxLength,
          actual: value.length,
        },
      };
    }

    if (!rule.regex.test(value)) {
      return { formatoInvalido: true };
    }

    return null;
  };
}

/**
 * Validator: blocks trivially invalid identifiers such as all-same digits
 * (0000000000) or fully ascending/descending digit sequences (1234567890).
 */
export function noRepeatedSequenceValidator(
  control: AbstractControl
): ValidationErrors | null {
  const value: string = (control.value ?? '').toString().trim();
  if (!value || value.length < 4) return null;

  // All characters identical: 0000000000, AAAAAA, etc.
  if (/^(.)\1+$/.test(value)) {
    return { secuenciaRepetida: true };
  }

  // Fully ascending or descending digit runs (e.g. 123456789, 987654321)
  if (/^[0-9]+$/.test(value) && value.length >= 6) {
    const digits = [...value].map(Number);
    const isAsc = digits.every((d, i) => i === 0 || d === digits[i - 1] + 1);
    const isDesc = digits.every((d, i) => i === 0 || d === digits[i - 1] - 1);
    if (isAsc || isDesc) {
      return { secuenciaRepetida: true };
    }
  }

  return null;
}

/**
 * Sanitises a raw input value according to the active DocumentRule:
 * - Strips whitespace
 * - Removes disallowed characters (non-digits for numeric types;
 *   non-alphanumeric for alphanumeric types)
 * - Uppercases when required
 */
export function sanitiseDocumentInput(
  raw: string,
  rule: DocumentRule | null
): string {
  let value = raw.replace(/\s/g, '');

  if (!rule) return value;

  if (!rule.allowLetters) {
    value = value.replace(/[^0-9]/g, '');
  } else {
    value = value.replace(/[^A-Za-z0-9]/g, '');
    if (rule.uppercase) {
      value = value.toUpperCase();
    }
  }

  return value;
}
