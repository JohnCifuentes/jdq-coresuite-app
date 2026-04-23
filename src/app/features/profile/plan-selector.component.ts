import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { Plan, Payment } from '../../models/sistema/payment.models';
import { PaymentService } from '../../services/sistema/payment.service';

@Component({
  selector: 'app-plan-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plan-selector.component.html',
  styleUrl: './plan-selector.component.scss'
})
export class PlanSelectorComponent implements AfterViewInit, OnDestroy {
  @Input() plans: Plan[] = [];
  @Input() currentPlanId: number | null = null;
  @Input() selectedPlanId: number | null = null;
  @Input() disabled = false;
  @Input() loading = false;

  @Output() planSelected = new EventEmitter<number>();
  @Output() changeRequested = new EventEmitter<void>();

  @ViewChild('wompiContainer') wompiContainer?: ElementRef<HTMLDivElement>;

  preparingPayment = false;
  paymentError: string | null = null;
  private activePayment: Payment | null = null;
  private createPaymentSub?: Subscription;
  private readonly destroy$ = new Subject<void>();

  constructor(private paymentService: PaymentService) {}

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onChangePlanClicked(): void {
    this.changeRequested.emit();
  }

  private injectWompiButton(payment: Payment): void {
    const container = this.wompiContainer?.nativeElement;
    if (!container) {
      return;
    }
    this.clearWompiContainer();
    const form = document.createElement('form');
    const script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';
    script.setAttribute('data-render', 'button');
    script.setAttribute('data-public-key', payment.publicKey);
    script.setAttribute('data-currency', payment.currency);
    script.setAttribute('data-amount-in-cents', String(payment.amountInCents));
    script.setAttribute('data-reference', payment.reference);
    script.setAttribute('data-signature:integrity', payment.integritySignature);
    form.appendChild(script);
    container.appendChild(form);
  }

  private clearWompiContainer(): void {
    const container = this.wompiContainer?.nativeElement;
    if (container) {
      container.innerHTML = '';
    }
  }

  get currentPlan(): Plan | undefined {
    return this.plans.find((plan) => plan.id === this.currentPlanId);
  }

  get selectedPlan(): Plan | undefined {
    return this.plans.find((plan) => plan.id === this.selectedPlanId);
  }

  formatCurrency(value: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(Number(value ?? 0));
  }

  onSelectionChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);

    // Cancel previous pending payment before creating a new one
    if (this.activePayment) {
      this.paymentService.cancelPayment(this.activePayment.reference)
        .pipe(takeUntil(this.destroy$))
        .subscribe({ error: () => {} });
      this.paymentService.clearLocalReference();
    }

    this.createPaymentSub?.unsubscribe();
    this.clearWompiContainer();
    this.activePayment = null;
    this.paymentError = null;
    this.preparingPayment = false;

    if (!Number.isFinite(value) || value <= 0) {
      return;
    }

    this.planSelected.emit(value);

    if (value === this.currentPlanId) {
      return;
    }

    this.preparingPayment = true;
    this.createPaymentSub = this.paymentService.createPayment(value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (payment) => {
          this.preparingPayment = false;
          this.activePayment = payment;
          this.paymentService.storeLocalReference(payment.reference, value);
          this.injectWompiButton(payment);
        },
        error: () => {
          this.preparingPayment = false;
          this.paymentError = 'No fue posible preparar el pago. Intenta nuevamente.';
        }
      });
  }
}
