import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, timer } from 'rxjs';
import { PaymentService } from '../../services/sistema/payment.service';
import { PaymentStatus, PaymentStatusResponse, resolvePaymentStatus } from '../../models/sistema/payment.models';

@Component({
  selector: 'app-payment-response',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payment-response.component.html',
  styleUrl: './payment-response.component.scss'
})
export class PaymentResponseComponent implements OnInit, OnDestroy {
  readonly PaymentStatus = PaymentStatus;

  status: PaymentStatus = PaymentStatus.Pending;
  message = 'Validando el estado de tu pago con el servidor...';
  reference: string | null = null;
  paymentData: PaymentStatusResponse | null = null;
  loading = true;
  pollFailed = false;

  private readonly destroy$ = new Subject<void>();
  private pollStop$ = new Subject<void>();
  private pollAttempts = 0;
  private readonly maxPollAttempts = 15;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.reference = this.route.snapshot.queryParamMap.get('ref');

    if (!this.reference) {
      this.status = PaymentStatus.Error;
      this.message = 'No se recibió una referencia de pago válida.';
      this.loading = false;
      return;
    }

    this.startPolling(this.reference);
  }

  ngOnDestroy(): void {
    this.stopPolling();
    this.destroy$.next();
    this.destroy$.complete();
  }

  retryValidation(): void {
    if (!this.reference) return;
    this.pollFailed = false;
    this.loading = true;
    this.status = PaymentStatus.Pending;
    this.message = 'Reintentando la validación del pago...';
    this.startPolling(this.reference);
  }

  goHome(): void {
    this.router.navigate(['/app']);
  }

  goProfile(): void {
    this.router.navigate(['/app/profile']);
  }

  formatCurrency(cents: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(Number(cents ?? 0) / 100);
  }

  get statusIcon(): string {
    switch (this.status) {
      case PaymentStatus.Approved: return 'check_circle';
      case PaymentStatus.Declined: return 'cancel';
      case PaymentStatus.Error: return 'error';
      case PaymentStatus.Cancelled: return 'close';
      case PaymentStatus.Pending: return 'hourglass_top';
      default: return 'payments';
    }
  }

  get statusClass(): string {
    switch (this.status) {
      case PaymentStatus.Approved: return 'response-card approved';
      case PaymentStatus.Declined: return 'response-card declined';
      case PaymentStatus.Error: return 'response-card error';
      case PaymentStatus.Cancelled: return 'response-card cancelled';
      default: return 'response-card pending';
    }
  }

  private startPolling(reference: string): void {
    this.stopPolling();
    this.pollAttempts = 0;

    timer(0, 3000)
      .pipe(takeUntil(this.pollStop$), takeUntil(this.destroy$))
      .subscribe(() => {
        this.pollAttempts += 1;
        const isLastAttempt = this.pollAttempts >= this.maxPollAttempts;
        this.checkStatus(reference, isLastAttempt);
      });
  }

  private stopPolling(): void {
    this.pollStop$.next();
    this.pollStop$.complete();
    this.pollStop$ = new Subject<void>();
  }

  private checkStatus(reference: string, isLastAttempt: boolean): void {
    const request$ = isLastAttempt
      ? this.paymentService.syncPaymentStatus(reference)
      : this.paymentService.getPaymentStatus(reference);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        const payload = response?.contenido ?? response;
        const resolved = resolvePaymentStatus(payload);

        if (resolved === PaymentStatus.Pending || resolved === PaymentStatus.Initial) {
          if (isLastAttempt) {
            this.stopPolling();
            this.status = PaymentStatus.Pending;
            this.message = 'El pago sigue en proceso. Puedes volver más tarde para verificar el estado.';
            this.loading = false;
            this.pollFailed = true;
          }
          return;
        }

        this.stopPolling();
        this.loading = false;
        this.paymentData = (payload && typeof payload === 'object') ? payload as PaymentStatusResponse : null;
        this.status = resolved;
        this.message = this.buildMessage(resolved);
        this.paymentService.clearPendingPaymentSession();
      },
      error: () => {
        if (isLastAttempt) {
          this.stopPolling();
          this.loading = false;
          this.pollFailed = true;
          this.status = PaymentStatus.Error;
          this.message = 'No fue posible verificar el estado del pago. Intenta nuevamente.';
        }
      }
    });
  }

  private buildMessage(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.Approved: return 'Tu pago fue aprobado correctamente. Gracias por tu compra.';
      case PaymentStatus.Declined: return 'El pago fue rechazado. No se realizó ningún cobro.';
      case PaymentStatus.Error: return 'Ocurrió un error durante el procesamiento del pago.';
      case PaymentStatus.Cancelled: return 'El pago fue cancelado.';
      default: return 'El pago está siendo procesado.';
    }
  }
}
