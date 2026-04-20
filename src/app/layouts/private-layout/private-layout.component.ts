import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { catchError, map, of, switchMap, take } from 'rxjs';
import Swal from 'sweetalert2';
import { ResponseLicenciaDTO } from '../../models/sistema/licencia.models';
import { LicenciaService } from '../../services/sistema/licencia.service';
import { SidebarComponent } from "./sidebar/sidebar.component";
import { HeaderPrivateComponent } from "./header-private/header-private.component";

@Component({
  selector: 'app-private-layout',
  imports: [CommonModule, SidebarComponent, HeaderPrivateComponent, RouterOutlet],
  templateUrl: './private-layout.component.html',
  styleUrl: './private-layout.component.scss'
})

export class PrivateLayoutComponent implements OnInit {
  private readonly warningThresholdDays = 15;
  private readonly sessionWarningKey = 'license-expiry-warning';

  constructor(
    private router: Router,
    private licenciaService: LicenciaService
  ) {}

  ngOnInit(): void {
    this.validateLicenseExpiry();
  }

  isOperacionRoute(): boolean {
    return this.router.url.startsWith('/app/operacion');
  }

  private validateLicenseExpiry(): void {
    of(this.getEmpresaIdFromAuthToken())
      .pipe(
        switchMap((empresaId) => {
          if (!empresaId) {
            return of(null);
          }

          return this.licenciaService.getLicenciasByEmpresa(empresaId).pipe(
            take(1),
            map((response) => {
              if (response.error) {
                return null;
              }

              return (response.contenido ?? []).find((licencia) => licencia.activo || this.isActivo(licencia.estado)) ?? null;
            }),
            catchError(() => of(null))
          );
        })
      )
      .subscribe((licencia) => {
        if (licencia) {
          this.showLicenseExpiryNotification(licencia);
        }
      });
  }

  private showLicenseExpiryNotification(licencia: ResponseLicenciaDTO): void {
    const expirationDate = this.parseDate(licencia.fechaExpiracion);

    if (!expirationDate) {
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expirationDate.setHours(0, 0, 0, 0);

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const daysRemaining = Math.ceil((expirationDate.getTime() - today.getTime()) / millisecondsPerDay);

    if (daysRemaining > this.warningThresholdDays) {
      return;
    }

    const warningKey = `${this.sessionWarningKey}-${licencia.id}-${expirationDate.toISOString().slice(0, 10)}`;
    if (sessionStorage.getItem(warningKey) === 'true') {
      return;
    }

    sessionStorage.setItem(warningKey, 'true');

    const formattedDate = this.formatDate(expirationDate);
    const expired = daysRemaining < 0;

    void Swal.fire({
      toast: true,
      position: 'top-end',
      icon: expired ? 'error' : 'warning',
      title: expired ? 'Licencia vencida' : 'Licencia próxima a vencer',
      text: expired
        ? `Tu licencia venció el ${formattedDate}. Por favor, renueva tu plan.`
        : `Tu licencia vence el ${formattedDate}. Por favor, renueva tu plan.`,
      showConfirmButton: false,
      timer: 7000,
      timerProgressBar: true
    });
  }

  private getEmpresaIdFromAuthToken(): number | null {
    const token = localStorage.getItem('auth_token');
    const claims = token ? this.parseTokenClaims(token) : null;
    const storedUser = this.getStoredUser();

    return this.normalizeEntityId(
      claims?.['empresaId'] ?? this.readNestedId(claims?.['empresa']) ?? storedUser?.empresa?.id ?? storedUser?.empresaId
    );
  }

  private parseTokenClaims(token: string): Record<string, unknown> | null {
    try {
      if (!token.includes('.')) {
        return JSON.parse(token) as Record<string, unknown>;
      }

      const payload = token.split('.')[1];
      if (!payload) {
        return null;
      }

      const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
      const paddingLength = (4 - (normalizedPayload.length % 4)) % 4;
      const paddedPayload = normalizedPayload + '='.repeat(paddingLength);
      const decodedPayload = atob(paddedPayload);
      return JSON.parse(decodedPayload) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private getStoredUser(): { empresa?: { id?: number }; empresaId?: number } | null {
    try {
      const rawUser = localStorage.getItem('auth_user');
      return rawUser ? JSON.parse(rawUser) as { empresa?: { id?: number }; empresaId?: number } : null;
    } catch {
      return null;
    }
  }

  private readNestedId(value: unknown): number | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    return this.normalizeEntityId((value as { id?: unknown }).id);
  }

  private normalizeEntityId(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private isActivo(estado: unknown): boolean {
    const normalized = String(estado ?? '').trim().toUpperCase();
    return normalized === 'ACTIVO' || normalized === 'ACTIVA' || normalized === 'A' || normalized === 'TRUE';
  }

  private parseDate(value: string): Date | null {
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  private formatDate(value: Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(value);
  }
}
