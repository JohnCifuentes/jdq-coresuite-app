import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, finalize, takeUntil, timer } from 'rxjs';
import { ResponseLicenciaDTO } from '../../models/sistema/licencia.models';
import { ResponsePlanDTO } from '../../models/sistema/plan.models';
import { PaymentService } from '../../services/sistema/payment.service';
import { PaymentStatusComponent } from './payment-status.component';
import { ProfileService } from '../../services/sistema/profile.service';
import {
  Payment,
  PaymentFlowResult,
  PaymentStatus,
  PendingPaymentSession,
  UpdateUserPlanRequest,
  getPaymentDisplayMessage,
  resolvePaymentStatus
} from '../../models/sistema/payment.models';

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
  widgetReady = false;

  private storedPayment: Payment | null = null;

  private readonly destroy$ = new Subject<void>();
  private pollStop$ = new Subject<void>();
  private pollAttempts = 0;
  private consecutiveErrors = 0;
  private readonly maxPollAttempts = 10;
  private readonly maxConsecutiveErrors = 3;

  constructor(
    private paymentService: PaymentService,
    private profileService: ProfileService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.resumeReference) {
      this.reference = this.resumeReference;
      this.status = PaymentStatus.Pending;
      this.message = 'Sincronizando el estado del pago con Wompi...';
      this.busy = true;
      this.syncThenPollOrResolve(this.resumeReference);
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
    // Si hay una referencia activa y el pago aún no se resolvió, cancelar el registro en el backend
    const unresolvedStatuses = [PaymentStatus.Initial, PaymentStatus.Creating, PaymentStatus.Pending];
    if (this.reference && unresolvedStatuses.includes(this.status)) {
      this.paymentService.cancelPayment(this.reference)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          error: (err) => this.logDebug('No se pudo cancelar el registro al cerrar el modal', err)
        });
      this.paymentService.clearPendingPaymentSession();
    }

    this.closed.emit({
      status: this.status,
      reference: this.reference,
      planId: this.plan?.id ?? null,
      message: this.message || getPaymentDisplayMessage(this.status),
      transactionId: this.transactionId
    });
  }

  goToPaymentResponse(): void {
    if (this.reference) {
      this.closed.emit(null);
      this.router.navigate(['/payment-response'], { queryParams: { ref: this.reference } });
    }
  }

  retryPayment(): void {
    this.stopPolling();
    // Cancelar el registro anterior para que no quede en PENDING indefinidamente
    const previousReference = this.reference;
    if (previousReference) {
      this.paymentService.cancelPayment(previousReference)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          error: (err) => this.logDebug('No se pudo cancelar el registro anterior al reintentar', err)
        });
    }
    this.paymentService.clearPendingPaymentSession();
    this.reference = null;
    this.transactionId = null;
    this.storedPayment = null;
    this.widgetReady = false;
    this.createAndLaunchPayment();
  }

  launchWidget(): void {
    if (!this.storedPayment || !this.widgetReady) {
      return;
    }
    const payment = this.storedPayment;
    this.widgetReady = false;
    try {
      this.paymentService.openWidget(
        payment,
        () => {
          this.logDebug('Widget cerrado manualmente por el usuario', {});
          this.paymentService.clearPendingPaymentSession();
          // Notificar al backend para actualizar el registro a CANCELLED (best-effort)
          if (payment.reference) {
            this.paymentService.cancelPayment(payment.reference)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                error: (err) => this.logDebug('No se pudo cancelar el registro de pago en el backend', err)
              });
          }
          this.setResult(PaymentStatus.Cancelled, 'Cerraste el widget antes de completar el pago. Puedes intentarlo nuevamente.');
        }
      );
    } catch (e) {
      console.error('[Wompi] Error abriendo widget', e);
      this.widgetReady = true;
      this.setResult(PaymentStatus.Error, 'No fue posible abrir el widget de pago. Recargue la página e intente nuevamente.');
    }
  }

  formatCurrency(value: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(Number(value ?? 0));
  }

  private syncThenPollOrResolve(reference: string): void {
    this.paymentService.syncPaymentStatus(reference)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const payload = response?.contenido ?? response;
          const resolvedStatus = resolvePaymentStatus(payload);

          if (resolvedStatus === PaymentStatus.Approved) {
            this.completeApprovedFlow(payload);
          } else if (resolvedStatus === PaymentStatus.Pending || resolvedStatus === PaymentStatus.Initial) {
            // Aún pendiente: seguir consultando
            this.startPolling(reference);
          } else {
            // CANCELLED, DECLINED, ERROR: mostrar estado final
            this.paymentService.clearPendingPaymentSession();
            this.setResult(
              resolvedStatus,
              this.extractMessage(payload) || getPaymentDisplayMessage(resolvedStatus)
            );
          }
        },
        error: () => {
          // Si la sincronización falla, continuar con el polling normal
          this.startPolling(reference);
        }
      });
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
        next: (payment) => {
          if (!payment) {
            this.logDebug('Respuesta inválida en createPayment', payment);
            this.setResult(PaymentStatus.Error, 'No fue posible iniciar el pago. Intenta nuevamente.');
            return;
          }

          this.logDebug('Respuesta createPayment recibida', {
            reference: payment.reference,
            amountInCents: payment.amountInCents
          });

          if (!payment.reference || !payment.publicKey || !payment.integritySignature) {
            this.setResult(
              PaymentStatus.Error,
              'La respuesta del servidor no contiene los datos necesarios para continuar.'
            );
            return;
          }

          const session: PendingPaymentSession = {
            reference: payment.reference,
            planId: selectedPlan.id,
            planName: selectedPlan.nombre,
            createdAt: new Date().toISOString()
          };

          this.paymentService.storePendingPaymentSession(session);
          this.reference = payment.reference;
          this.storedPayment = payment;
          this.widgetReady = true;
          this.status = PaymentStatus.Initial;
          this.message = '';
          this.busy = false;
        },
        error: (err: any) => {
          console.error('[Wompi] Error creando transacción', err);
          const status = err?.status;
          const msg = status === 409
            ? 'No fue posible iniciar el pago. Intenta nuevamente.'
            : 'No fue posible iniciar el pago. Intenta nuevamente.';
          this.setResult(PaymentStatus.Error, msg);
        }
      });
  }



  private startPolling(reference: string): void {
    this.stopPolling();
    this.pollAttempts = 0;
    this.consecutiveErrors = 0;
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
          this.consecutiveErrors = 0;
          if (response?.error) {
            if (stopAfterThisCheck) {
              this.stopPolling();
              this.busy = false;
              this.showRetry = true;
              this.status = PaymentStatus.Pending;
              this.message = 'No fue posible confirmar el pago. Verifica el resultado en la página de pago.';
            }
            return;
          }

          this.handlePaymentVerification(response?.contenido ?? response, stopAfterThisCheck);
        },
        error: (err: any) => {
          this.logDebug('Error consultando estado del pago', err);
          this.consecutiveErrors += 1;
          const stopByErrors = this.consecutiveErrors >= this.maxConsecutiveErrors;
          if (stopAfterThisCheck || stopByErrors) {
            this.stopPolling();
            this.busy = false;
            this.showRetry = true;
            this.status = PaymentStatus.Pending;
            this.message = stopByErrors
              ? 'No fue posible conectar con el servidor. Verifica el resultado en la página de pago.'
              : 'No fue posible validar el pago en este momento. Verifica el resultado en la página de pago.';
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
      if (stopAfterThisCheck) {
        this.stopPolling();
        this.busy = false;
        this.showRetry = true;
        this.message = 'El pago no pudo confirmarse en el tiempo esperado. Verifica el resultado en la página de pago.';
      } else {
        this.message = 'Procesando pago. Consultando estado cada 3 segundos...';
        this.busy = true;
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

    const today = new Date();
    const fechaCompra = today.toISOString().split('T')[0];
    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 1);
    const fechaExpiracion = nextYear.toISOString().split('T')[0];

    const request: UpdateUserPlanRequest = {
      licenciaId,
      empresaId,
      planId: selectedPlan.id,
      fechaCompra,
      fechaExpiracion,
      activo: true
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

  private logDebug(message: string, data?: unknown): void {
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
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
