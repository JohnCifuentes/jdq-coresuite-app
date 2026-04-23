import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PaymentStatus, getPaymentDisplayMessage } from '../../models/sistema/payment.models';

@Component({
  selector: 'app-payment-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-status.component.html',
  styleUrl: './payment-status.component.scss'
})
export class PaymentStatusComponent {
  @Input() status: PaymentStatus = PaymentStatus.Initial;
  @Input() message = '';
  @Input() reference: string | null = null;
  @Input() busy = false;
  @Input() showRetry = false;

  @Output() retry = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  readonly paymentStatus = PaymentStatus;

  get resolvedMessage(): string {
    return this.message || getPaymentDisplayMessage(this.status);
  }

  get alertClass(): string {
    switch (this.status) {
      case PaymentStatus.Approved:
        return 'status-card approved';
      case PaymentStatus.Declined:
        return 'status-card declined';
      case PaymentStatus.Error:
        return 'status-card error';
      case PaymentStatus.Cancelled:
        return 'status-card cancelled';
      case PaymentStatus.Pending:
      case PaymentStatus.Creating:
        return 'status-card pending';
      default:
        return 'status-card neutral';
    }
  }

  get icon(): string {
    switch (this.status) {
      case PaymentStatus.Approved:
        return 'check_circle';
      case PaymentStatus.Declined:
        return 'cancel';
      case PaymentStatus.Error:
        return 'error';
      case PaymentStatus.Cancelled:
        return 'close';
      case PaymentStatus.Pending:
      case PaymentStatus.Creating:
        return 'hourglass_top';
      default:
        return 'payments';
    }
  }
}
