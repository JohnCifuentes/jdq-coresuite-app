export interface Plan {
  id: number;
  nombre: string;
  valor: number;
  descripcion: string;
  cantidadUsuarios: number;
  estado?: string;
}

export interface Payment {
  reference: string;
  amountInCents: number;
  currency: string;
  signature: string;
  redirectUrl?: string;
  publicKey?: string;
}

export enum PaymentStatus {
  Initial = 'INITIAL',
  Creating = 'CREATING',
  Checkout = 'CHECKOUT',
  Pending = 'PENDING',
  Approved = 'APPROVED',
  Declined = 'DECLINED',
  Error = 'ERROR',
  Cancelled = 'CANCELLED'
}

export interface PaymentStatusResponse {
  reference?: string;
  status?: string;
  message?: string;
  transactionId?: string;
  data?: unknown;
}

export interface PendingPaymentSession {
  reference: string;
  planId: number;
  planName: string;
  amountInCents: number;
  currency: string;
  redirectUrl: string;
  createdAt: string;
}

export interface UpdateUserPlanRequest {
  licenciaId: number;
  empresaId: number;
  planId: number;
  fechaCompra: string;
  fechaExpiracion: string;
  activo: boolean;
}

export interface PaymentFlowResult {
  status: PaymentStatus;
  reference: string | null;
  planId: number | null;
  message: string;
  transactionId?: string | null;
}

function extractStatusCandidate(source: unknown): string {
  if (typeof source === 'string') {
    return source;
  }

  if (!source || typeof source !== 'object') {
    return '';
  }

  const record = source as Record<string, unknown>;
  const nestedCandidates = [
    record['status'],
    record['estado'],
    record['paymentStatus'],
    (record['transaction'] as Record<string, unknown> | undefined)?.['status'],
    (record['transaction'] as Record<string, unknown> | undefined)?.['status_message'],
    (record['data'] as Record<string, unknown> | undefined)?.['status'],
    ((record['data'] as Record<string, unknown> | undefined)?.['transaction'] as Record<string, unknown> | undefined)?.['status'],
    (record['contenido'] as Record<string, unknown> | undefined)?.['status'],
    ((record['contenido'] as Record<string, unknown> | undefined)?.['transaction'] as Record<string, unknown> | undefined)?.['status']
  ];

  const matched = nestedCandidates.find((candidate) => typeof candidate === 'string' && candidate.trim().length > 0);
  return typeof matched === 'string' ? matched : '';
}

export function resolvePaymentStatus(source: unknown): PaymentStatus {
  const normalized = extractStatusCandidate(source).trim().toUpperCase();

  switch (normalized) {
    case 'APPROVED':
      return PaymentStatus.Approved;
    case 'DECLINED':
    case 'DECLINED_BY_BUSINESS':
    case 'VOIDED':
    case 'FAILED':
      return PaymentStatus.Declined;
    case 'PENDING':
    case 'PENDING_VALIDATION':
    case 'PENDING_PAYMENT_IN_ENTITY':
      return PaymentStatus.Pending;
    case 'ERROR':
    case 'ERROR_PAYMENT':
      return PaymentStatus.Error;
    case 'CANCELLED':
    case 'CANCELED':
      return PaymentStatus.Cancelled;
    default:
      return PaymentStatus.Initial;
  }
}

export function getPaymentDisplayMessage(status: PaymentStatus): string {
  switch (status) {
    case PaymentStatus.Creating:
      return 'Preparando el cobro seguro de Wompi...';
    case PaymentStatus.Checkout:
      return 'Abriendo la pasarela de pago...';
    case PaymentStatus.Pending:
      return 'Procesando pago. Estamos validando el estado real con el backend.';
    case PaymentStatus.Approved:
      return 'Pago aprobado y plan actualizado correctamente.';
    case PaymentStatus.Declined:
      return 'El pago fue rechazado. El plan no fue modificado.';
    case PaymentStatus.Cancelled:
      return 'El flujo de pago fue cancelado o cerrado antes de finalizar.';
    case PaymentStatus.Error:
      return 'Ocurrió un error al validar el pago.';
    default:
      return 'Inicie el proceso para cambiar de plan.';
  }
}
