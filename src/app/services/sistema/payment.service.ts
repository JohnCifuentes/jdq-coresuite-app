import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RespuestaDTO } from '../../models/response.dto';
import { Payment, PaymentStatusResponse, PendingPaymentSession, WompiTransactionResult } from '../../models/sistema/payment.models';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/payments`;
  private readonly storageKey = 'auth_token';
  private readonly paymentSessionKey = 'profile_wompi_payment';
  private readonly localReferenceKey = 'wompi_reference';

  constructor(private http: HttpClient) {}

  createPayment(planId: number): Observable<Payment> {
    return this.http.post<Payment>(
      `${this.apiUrl}/create`,
      { planId },
      this.getAuthOptions()
    );
  }

  getPaymentStatus(reference: string): Observable<RespuestaDTO<PaymentStatusResponse>> {
    return this.http.get<RespuestaDTO<PaymentStatusResponse>>(
      `${this.apiUrl}/${encodeURIComponent(reference)}`,
      this.getAuthOptions()
    );
  }

  syncPaymentStatus(reference: string): Observable<RespuestaDTO<PaymentStatusResponse>> {
    return this.http.get<RespuestaDTO<PaymentStatusResponse>>(
      `${this.apiUrl}/${encodeURIComponent(reference)}/sync`,
      this.getAuthOptions()
    );
  }

  cancelPayment(reference: string): Observable<RespuestaDTO<void>> {
    return this.http.post<RespuestaDTO<void>>(
      `${this.apiUrl}/${encodeURIComponent(reference)}/cancel`,
      {},
      this.getAuthOptions()
    );
  }

  openWidget(
    payment: Payment,
    onCancelled: () => void
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const WidgetCheckout = (window as any)['WidgetCheckout'];
    if (!WidgetCheckout) {
      throw new Error('El widget de Wompi no está disponible. Recargue la página e intente nuevamente.');
    }
    const checkout = new WidgetCheckout({
      currency: payment.currency,
      amountInCents: payment.amountInCents,
      reference: payment.reference,
      publicKey: payment.publicKey,
      signature: { integrity: payment.integritySignature }
    });
    checkout.open((result: { transaction: WompiTransactionResult | null | undefined }) => {
      const transaction = result?.transaction;
      // Con redirectUrl configurado, las transacciones completadas redirigen la página automáticamente.
      // Este callback solo aplica cuando el usuario cierra el widget sin realizar ninguna transacción.
      if (!transaction || !transaction.id) {
        onCancelled();
      }
    });
  }

  storePendingPaymentSession(session: PendingPaymentSession): void {
    sessionStorage.setItem(this.paymentSessionKey, JSON.stringify(session));
  }

  getPendingPaymentSession(): PendingPaymentSession | null {
    try {
      const raw = sessionStorage.getItem(this.paymentSessionKey);
      return raw ? JSON.parse(raw) as PendingPaymentSession : null;
    } catch {
      return null;
    }
  }

  clearPendingPaymentSession(): void {
    sessionStorage.removeItem(this.paymentSessionKey);
    this.clearLocalReference();
  }

  storeLocalReference(reference: string, planId: number): void {
    localStorage.setItem(this.localReferenceKey, JSON.stringify({ reference, planId }));
  }

  getLocalReference(): { reference: string; planId: number } | null {
    try {
      const raw = localStorage.getItem(this.localReferenceKey);
      return raw ? JSON.parse(raw) as { reference: string; planId: number } : null;
    } catch {
      return null;
    }
  }

  clearLocalReference(): void {
    localStorage.removeItem(this.localReferenceKey);
  }

  private getAuthOptions() {
    const token = localStorage.getItem(this.storageKey);
    if (!token) {
      return {};
    }

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }
}
