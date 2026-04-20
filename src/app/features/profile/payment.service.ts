import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RespuestaDTO } from '../../models/response.dto';
import { Payment, PaymentStatusResponse, PendingPaymentSession } from './payment.models';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/payments`;
  private readonly storageKey = 'auth_token';
  private readonly paymentSessionKey = 'profile_wompi_payment';
  private scriptLoadingPromise: Promise<void> | null = null;

  constructor(private http: HttpClient) {}

  createPayment(planId: number): Observable<RespuestaDTO<Payment>> {
    return this.http.post<RespuestaDTO<Payment>>(
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

  loadCheckoutScript(): Promise<void> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return Promise.reject(new Error('El checkout solo está disponible en el navegador.'));
    }

    if ((window as any).WidgetCheckout) {
      return Promise.resolve();
    }

    if (this.scriptLoadingPromise) {
      return this.scriptLoadingPromise;
    }

    const existingScript = document.querySelector(
      'script[data-wompi-checkout="true"], script[src="https://checkout.wompi.co/widget.js"]'
    ) as HTMLScriptElement | null;

    if (existingScript) {
      if (existingScript.dataset['loaded'] === 'true' || (window as any).WidgetCheckout) {
        return this.waitForWidgetCheckout();
      }

      this.scriptLoadingPromise = new Promise<void>((resolve, reject) => {
        existingScript.addEventListener('load', () => {
          existingScript.dataset['loaded'] = 'true';
          this.waitForWidgetCheckout().then(resolve).catch(reject);
        }, { once: true });
        existingScript.addEventListener('error', () => {
          this.scriptLoadingPromise = null;
          reject(new Error('No se pudo cargar Wompi.'));
        }, { once: true });
      });

      return this.scriptLoadingPromise;
    }

    this.scriptLoadingPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.wompi.co/widget.js';
      script.async = true;
      script.dataset['wompiCheckout'] = 'true';
      script.onload = () => {
        script.dataset['loaded'] = 'true';
        this.waitForWidgetCheckout().then(resolve).catch(reject);
      };
      script.onerror = () => {
        this.scriptLoadingPromise = null;
        reject(new Error('No se pudo cargar Wompi.'));
      };
      document.head.appendChild(script);
    });

    return this.scriptLoadingPromise;
  }

  private waitForWidgetCheckout(timeoutMs = 5000): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const startedAt = Date.now();

      const checkWidget = () => {
        if ((window as any).WidgetCheckout) {
          resolve();
          return;
        }

        if (Date.now() - startedAt >= timeoutMs) {
          this.scriptLoadingPromise = null;
          reject(new Error('El widget de Wompi no quedó disponible después de cargar el script.'));
          return;
        }

        window.setTimeout(checkWidget, 50);
      };

      checkWidget();
    });
  }

  buildRedirectUrl(reference: string): string {
    if (typeof window === 'undefined') {
      return '';
    }

    const url = new URL(window.location.href);
    url.searchParams.set('paymentRef', reference);
    return url.toString();
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
