import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject, finalize, takeUntil, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResponseLicenciaDTO } from '../../models/sistema/licencia.models';
import { ResponsePlanDTO } from '../../models/sistema/plan.models';
import { PaymentService } from './payment.service';
import { PaymentStatusComponent } from './payment-status.component';
import { ProfileService } from './profile.service';
import {
  Payment,
  PaymentFlowResult,
  PaymentStatus,
  PendingPaymentSession,
  UpdateUserPlanRequest,
  getPaymentDisplayMessage,
  resolvePaymentStatus
} from './payment.models';

@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [CommonModule, PaymentStatusComponent],
  templateUrl: './payment-modal.component.html',
  styleUrl: './payment-modal.component.scss'
})
export class PaymentModalComponent implements OnInit, OnDestroy {
  @Input() plan: ResponsePlanDTO | null = null;
  @Input() empresaId: number | null = null;
  @Input() licenciaId: number | null = null;
  @Input() licencia: ResponseLicenciaDTO | null = null;
  @Input() resumeReference: string | null = null;

  @Output() closed = new EventEmitter<PaymentFlowResult | null>();

  readonly paymentStatusEnum = PaymentStatus;

  status: PaymentStatus = PaymentStatus.Initial;
  message = '';
  reference: string | null = null;
  transactionId: string | null = null;
  busy = false;
  showRetry = false;

  private readonly destroy$ = new Subject<void>();
  private pollStop$ = new Subject<void>();
  private pollAttempts = 0;
  private readonly maxPollAttempts = 40;

  constructor(
    private paymentService: PaymentService,
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    if (this.resumeReference) {
      this.reference = this.resumeReference;
      this.status = PaymentStatus.Pending;
      this.message = 'Reanudando la validación de tu pago...';
      this.busy = true;
      this.startPolling(this.resumeReference);
      return;
    }

    this.createAndLaunchPayment();
  }

  ngOnDestroy(): void {
    this.stopPolling();
    this.destroy$.next();
    this.destroy$.complete();
  }

  closeModal(): void {
    this.closed.emit({
      status: this.status,
      reference: this.reference,
      planId: this.plan?.id ?? null,
      message: this.message || getPaymentDisplayMessage(this.status),
      transactionId: this.transactionId
    });
  }

  retryPayment(): void {
    this.stopPolling();
    this.paymentService.clearPendingPaymentSession();
    this.reference = null;
    this.transactionId = null;
    this.createAndLaunchPayment();
  }

  formatCurrency(value: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(Number(value ?? 0));
  }

  private createAndLaunchPayment(): void {
    const selectedPlan = this.plan;

    if (!selectedPlan) {
      this.setResult(PaymentStatus.Error, 'No se encontró el plan seleccionado para procesar el pago.');
      return;
    }

    this.status = PaymentStatus.Creating;
    this.message = getPaymentDisplayMessage(PaymentStatus.Creating);
    this.busy = true;
    this.showRetry = false;

    this.paymentService.createPayment(selectedPlan.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.error || !response.contenido) {
            this.logDebug('Respuesta inválida en createPayment', response);
            this.setResult(PaymentStatus.Error, 'No fue posible iniciar el pago. Intenta nuevamente.');
            return;
          }

          const payment = response.contenido;
          this.logDebug('Respuesta createPayment recibida', {
            reference: payment.reference,
            amountInCents: payment.amountInCents,
            currency: payment.currency,
            hasSignature: !!payment.signature,
            hasPublicKey: !!(payment.publicKey || environment.wompiPublicKey)
          });
          const expectedAmount = Math.round(Number(selectedPlan.valor ?? 0) * 100);

          if (!payment.reference || Number(payment.amountInCents) !== expectedAmount) {
            this.setResult(
              PaymentStatus.Error,
              'El monto validado por el backend no coincide con el plan seleccionado. No se abrió el checkout.'
            );
            return;
          }

          const redirectUrl = payment.redirectUrl || this.paymentService.buildRedirectUrl(payment.reference);
          const session: PendingPaymentSession = {
            reference: payment.reference,
            planId: selectedPlan.id,
            planName: selectedPlan.nombre,
            amountInCents: payment.amountInCents,
            currency: payment.currency,
            redirectUrl,
            createdAt: new Date().toISOString()
          };

          this.paymentService.storePendingPaymentSession(session);
          this.reference = payment.reference;

          this.openCheckout({
            ...payment,
            redirectUrl
          });
        },
        error: (err: any) => {
          this.logDebug('Error HTTP en createPayment', err);
          this.setResult(PaymentStatus.Error, 'No fue posible iniciar el pago. Intenta nuevamente.');
        }
      });
  }

  private openCheckout(payment: Payment): void {
    this.status = PaymentStatus.Checkout;
    this.message = getPaymentDisplayMessage(PaymentStatus.Checkout);
    this.busy = true;

    const publicKey = environment.wompiPublicKey?.trim() || payment.publicKey?.trim();

    if (!environment.production) {
      console.debug('Wompi Public Key:', environment.wompiPublicKey);
    }

    const validationError = this.validatePaymentConfig(payment, publicKey);

    if (validationError) {
      this.logDebug('Configuración inválida de Wompi', { payment, validationError, publicKey });
      this.setResult(PaymentStatus.Error, 'No fue posible iniciar el pago. Intenta nuevamente.');
      return;
    }

    this.paymentService.loadCheckoutScript()
      .then(() => {
        const widgetConstructor = (window as any).WidgetCheckout;

        if (!environment.production) {
          console.debug('typeof WidgetCheckout:', typeof widgetConstructor);
          console.debug({
            reference: payment.reference,
            amountInCents: payment.amountInCents,
            currency: payment.currency,
            signature: payment.signature,
            publicKey
          });
        }

        this.logDebug('WidgetCheckout disponible', {
          isAvailable: typeof widgetConstructor === 'function',
          reference: payment.reference
        });

        if (typeof widgetConstructor !== 'function') {
          throw new Error('WidgetCheckout no está disponible después de cargar el script.');
        }

        const checkout = new widgetConstructor({
          currency: payment.currency,
          amountInCents: payment.amountInCents,
          reference: payment.reference,
          publicKey,
          signature: {
            integrity: payment.signature
          },
          redirectUrl: payment.redirectUrl || this.paymentService.buildRedirectUrl(payment.reference)
        });

        try {
          if (!environment.production) {
            console.debug('Abriendo checkout...');
          }

          checkout.open((result: unknown) => {
            this.logDebug('Callback de checkout ejecutado', result);
            this.verifyPaymentNow(payment.reference);
          });

          if (!environment.production) {
            console.debug('Checkout invocado correctamente.');
          }

          this.startPolling(payment.reference);
        } catch (error) {
          console.error('Error abriendo Wompi:', error);
          this.setResult(PaymentStatus.Error, 'No fue posible iniciar el pago. Intenta nuevamente.');
        }
      })
      .catch((error: Error) => {
        this.logDebug('Fallo al abrir checkout', error);
        this.setResult(PaymentStatus.Error, 'No fue posible iniciar el pago. Intenta nuevamente.');
      });
  }

  private startPolling(reference: string): void {
    this.stopPolling();
    this.pollAttempts = 0;
    this.busy = true;
    this.showRetry = false;
    this.status = PaymentStatus.Pending;
    this.message = 'Procesando pago. Consultando estado cada 3 segundos...';

    timer(0, 3000)
      .pipe(takeUntil(this.pollStop$), takeUntil(this.destroy$))
      .subscribe(() => {
        this.pollAttempts += 1;
        this.verifyPaymentNow(reference, this.pollAttempts >= this.maxPollAttempts);
      });
  }

  private stopPolling(): void {
    this.pollStop$.next();
    this.pollStop$.complete();
    this.pollStop$ = new Subject<void>();
  }

  private verifyPaymentNow(reference: string, stopAfterThisCheck = false): void {
    this.paymentService.getPaymentStatus(reference)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response?.error) {
            if (stopAfterThisCheck) {
              this.stopPolling();
              this.busy = false;
              this.showRetry = true;
              this.status = PaymentStatus.Pending;
              this.message = 'El pago sigue en proceso. Puede reintentar la validación en unos segundos.';
            }
            return;
          }

          this.handlePaymentVerification(response?.contenido ?? response, stopAfterThisCheck);
        },
        error: (err: any) => {
          this.logDebug('Error consultando estado del pago', err);
          if (stopAfterThisCheck) {
            this.stopPolling();
            this.busy = false;
            this.showRetry = true;
            this.status = PaymentStatus.Pending;
            this.message = 'No fue posible validar el pago en este momento. Puedes reintentar.';
          }
        }
      });
  }

  private handlePaymentVerification(payload: unknown, stopAfterThisCheck: boolean): void {
    const resolvedStatus = resolvePaymentStatus(payload);

    if (resolvedStatus === PaymentStatus.Approved) {
      this.completeApprovedFlow(payload);
      return;
    }

    if (resolvedStatus === PaymentStatus.Pending || resolvedStatus === PaymentStatus.Initial) {
      this.status = PaymentStatus.Pending;
      this.message = stopAfterThisCheck
        ? 'El pago continúa en proceso. Puede cerrar el modal y volver más tarde.'
        : 'Procesando pago. Consultando estado cada 3 segundos...';
      this.busy = !stopAfterThisCheck;
      this.showRetry = stopAfterThisCheck;

      if (stopAfterThisCheck) {
        this.stopPolling();
      }
      return;
    }

    this.paymentService.clearPendingPaymentSession();
    this.stopPolling();
    this.setResult(
      resolvedStatus,
      this.extractMessage(payload) || getPaymentDisplayMessage(resolvedStatus)
    );
  }

  private completeApprovedFlow(payload: unknown): void {
    this.stopPolling();

    const selectedPlan = this.plan;
    const empresaId = this.empresaId;
    const licenciaId = this.licenciaId;
    const licencia = this.licencia;

    if (!selectedPlan || !empresaId || !licenciaId || !licencia) {
      this.paymentService.clearPendingPaymentSession();
      this.setResult(PaymentStatus.Error, 'El pago fue aprobado, pero no se encontró la licencia activa para actualizar el plan.');
      return;
    }

    const request: UpdateUserPlanRequest = {
      licenciaId,
      empresaId,
      planId: selectedPlan.id,
      fechaCompra: licencia.fechaCompra,
      fechaExpiracion: licencia.fechaExpiracion,
      activo: licencia.activo
    };

    this.status = PaymentStatus.Pending;
    this.message = 'Pago aprobado. Actualizando el plan de la licencia...';
    this.busy = true;
    this.showRetry = false;

    this.profileService.updateUserPlan(request)
      .pipe(
        finalize(() => {
          this.busy = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          if (response.error) {
            this.paymentService.clearPendingPaymentSession();
            this.setResult(PaymentStatus.Error, 'El pago fue aprobado, pero no fue posible aplicar el nuevo plan.');
            return;
          }

          this.paymentService.clearPendingPaymentSession();
          this.transactionId = this.extractTransactionId(payload);
          this.setResult(PaymentStatus.Approved, 'Pago aprobado y plan actualizado correctamente.');
        },
        error: (err: any) => {
          this.logDebug('Pago aprobado pero falló actualización del plan', err);
          this.paymentService.clearPendingPaymentSession();
          this.setResult(PaymentStatus.Error, 'El pago fue aprobado, pero no fue posible aplicar el nuevo plan.');
        }
      });
  }

  private validatePaymentConfig(payment: Payment, publicKey: string | undefined): string | null {
    if (!payment.reference?.trim()) {
      return 'La referencia del pago es inválida.';
    }

    if (!Number.isFinite(Number(payment.amountInCents)) || Number(payment.amountInCents) <= 0) {
      return 'El monto del pago no es válido.';
    }

    if (payment.currency?.trim() !== 'COP') {
      return 'La moneda recibida no es soportada por este flujo.';
    }

    if (!payment.signature?.trim()) {
      return 'La firma de integridad es obligatoria.';
    }

    if (!publicKey || publicKey !== publicKey.trim()) {
      return 'La llave pública de Wompi no es válida.';
    }

    if (!(publicKey.startsWith('pub_test_') || publicKey.startsWith('pub_prod_'))) {
      return 'La llave pública de Wompi no tiene un formato válido.';
    }

    return null;
  }

  private logDebug(message: string, data?: unknown): void {
    if (!environment.production) {
      console.debug('[Wompi][Profile]', message, data ?? '');
    }
  }

  private extractMessage(payload: unknown): string {
    if (!payload || typeof payload !== 'object') {
      return '';
    }

    const record = payload as Record<string, unknown>;
    const possibleMessage = record['message']
      ?? record['mensaje']
      ?? (record['transaction'] as Record<string, unknown> | undefined)?.['status_message']
      ?? (record['data'] as Record<string, unknown> | undefined)?.['message'];

    return typeof possibleMessage === 'string' ? possibleMessage : '';
  }

  private extractTransactionId(payload: unknown): string | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const record = payload as Record<string, unknown>;
    const possibleId = record['transactionId']
      ?? (record['transaction'] as Record<string, unknown> | undefined)?.['id']
      ?? (record['data'] as Record<string, unknown> | undefined)?.['id'];

    return typeof possibleId === 'string' ? possibleId : null;
  }

  private setResult(status: PaymentStatus, message: string): void {
    this.status = status;
    this.message = message;
    this.busy = false;
    this.showRetry = status === PaymentStatus.Error || status === PaymentStatus.Declined || status === PaymentStatus.Cancelled;
  }
}
