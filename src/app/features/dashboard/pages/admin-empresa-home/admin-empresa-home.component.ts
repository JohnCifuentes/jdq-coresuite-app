import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { ResponseUsuarioDTO } from '../../../../models/seguridad/usuario.models';
import { ResponseLicenciaDTO } from '../../../../models/sistema/licencia.models';
import { InactiveSesionDTO, ResponseSesionDTO } from '../../../../models/sistema/sesion.models';
import { UsuarioService } from '../../../../services/seguridad/usuario.service';
import { LicenciaService } from '../../../../services/sistema/licencia.service';
import { SesionService } from '../../../../services/sistema/sesion.service';

interface ActiveSessionView {
  id: number;
  initials: string;
  displayName: string;
  meta: string;
}

interface ChartSlot {
  label: string;
  count: number;
  heightPct: number;
  isActive: boolean;
}

@Component({
  selector: 'app-admin-empresa-home',
  imports: [CommonModule],
  templateUrl: './admin-empresa-home.component.html',
  styleUrl: './admin-empresa-home.component.scss'
})

export class AdminEmpresaHomeComponent implements OnInit, OnDestroy {
  loading = false;
  errorMessage: string | null = null;
  empresaId: number | null = null;
  empresaNombre = 'su empresa';
  totalUsuarios = 0;
  usuariosActivos = 0;
  usuariosPermitidos = 0;
  sesionesActivas: ActiveSessionView[] = [];
  chartSlots: ChartSlot[] = [];
  closingSessionId: number | null = null;
  closeSessionFeedback: string | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private usuarioService: UsuarioService,
    private sesionService: SesionService,
    private licenciaService: LicenciaService
  ) {}

  ngOnInit(): void {
    const rawUser = localStorage.getItem('auth_user');

    if (!rawUser) {
      this.errorMessage = 'No se encontró información del usuario logueado.';
      return;
    }

    try {
      const user = JSON.parse(rawUser);
      const empresaId = user?.empresa?.id;

      if (!empresaId) {
        this.errorMessage = 'No se encontró la empresa del usuario logueado.';
        return;
      }

      this.empresaId = empresaId;
      this.empresaNombre = user?.empresa?.razonSocial ?? this.empresaNombre;
      this.loadDashboardData(empresaId);
    } catch {
      this.errorMessage = 'No se pudo leer la información del usuario logueado.';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get porcentajeSaludSistema(): number {
    if (!this.usuariosPermitidos) {
      return 0;
    }

    return Math.min(100, Math.round((this.usuariosActivos / this.usuariosPermitidos) * 100));
  }

  closeSession(sessionId: number): void {
    if (this.closingSessionId !== null) {
      return;
    }
    this.closingSessionId = sessionId;
    this.closeSessionFeedback = null;
    const payload: InactiveSesionDTO = { estado: 'I' };
    this.sesionService.inactiveSesion(sessionId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.sesionesActivas = this.sesionesActivas.filter((s) => s.id !== sessionId);
          this.usuariosActivos = Math.max(0, this.usuariosActivos - 1);
          this.closingSessionId = null;
          this.closeSessionFeedback = 'Sesión cerrada correctamente.';
          setTimeout(() => { this.closeSessionFeedback = null; }, 3000);
        },
        error: () => {
          this.closingSessionId = null;
          this.closeSessionFeedback = 'No fue posible cerrar la sesión.';
          setTimeout(() => { this.closeSessionFeedback = null; }, 3000);
        }
      });
  }

  private loadDashboardData(empresaId: number): void {
    this.loading = true;
    this.errorMessage = null;
    forkJoin({
      usuarios: this.usuarioService.getUsuariosByEmpresa(empresaId),
      sesiones: this.sesionService.getSesionesByEmpresa(empresaId),
      licencias: this.licenciaService.getLicenciasByEmpresa(empresaId)
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ usuarios, sesiones, licencias }) => {
        this.loading = false;

        if (usuarios.error || sesiones.error || licencias.error) {
          this.errorMessage = 'No se pudo cargar la información del panel administrativo.';
          return;
        }

        const usuariosEmpresa = usuarios.contenido ?? [];
        const sesionesEmpresa = sesiones.contenido ?? [];
        const licenciasEmpresa = licencias.contenido ?? [];

        this.totalUsuarios = usuariosEmpresa.length;
        this.usuariosActivos = this.getSesionesActivas(sesionesEmpresa).length;
        this.usuariosPermitidos = this.getUsuariosPermitidos(licenciasEmpresa);
        this.sesionesActivas = this.buildActiveSessionsView(usuariosEmpresa, sesionesEmpresa);
        this.chartSlots = this.buildChartSlots(sesionesEmpresa);
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Ocurrió un error al consultar la información del dashboard.';
      }
    });
  }

  private getSesionesActivas(sesiones: ResponseSesionDTO[]): ResponseSesionDTO[] {
    return sesiones.filter((sesion) => this.isActivo(sesion.estado));
  }

  private getUsuariosPermitidos(licencias: ResponseLicenciaDTO[]): number {
    const licenciaActiva = licencias.find((licencia) => licencia.activo || this.isActivo(licencia.estado));
    const plan = licenciaActiva?.plan as (ResponseLicenciaDTO['plan'] & { cantidadUsuarios?: number }) | undefined;

    return plan?.cantidadUsuarios ?? 0;
  }

  private buildChartSlots(sesiones: ResponseSesionDTO[]): ChartSlot[] {
    const now = Date.now();
    const slotCount = 6;
    const slotSizeMs = 4 * 60 * 60 * 1000; // 4 h → cubre 24 h
    const windowStart = now - slotCount * slotSizeMs;

    const slots: ChartSlot[] = Array.from({ length: slotCount }, (_, i) => {
      const slotStart = windowStart + i * slotSizeMs;
      const slotEnd = slotStart + slotSizeMs;
      const hour = new Date(slotStart).getHours();
      const label = `${String(hour).padStart(2, '0')}:00`;
      const count = sesiones.filter((s) => {
        const t = new Date(s.fechaInicio || s.fechaCreacion).getTime();
        return t >= slotStart && t < slotEnd;
      }).length;
      return { label, count, heightPct: 0, isActive: i === slotCount - 1 };
    });

    const maxCount = Math.max(...slots.map((s) => s.count), 1);
    slots.forEach((s) => {
      s.heightPct = s.count === 0 ? 5 : Math.max(5, Math.round((s.count / maxCount) * 100));
    });
    return slots;
  }

  private buildActiveSessionsView(
    usuarios: ResponseUsuarioDTO[],
    sesiones: ResponseSesionDTO[]
  ): ActiveSessionView[] {
    const usuariosPorId = new Map<number, ResponseUsuarioDTO>(
      usuarios.map((usuario) => [usuario.id, usuario])
    );

    return this.getSesionesActivas(sesiones)
      .sort((left, right) => {
        const leftTime = new Date(left.fechaUltimoAcceso || left.fechaInicio).getTime();
        const rightTime = new Date(right.fechaUltimoAcceso || right.fechaInicio).getTime();

        return rightTime - leftTime;
      })
      .map((sesion) => {
        const usuario = usuariosPorId.get(sesion.usuario.id);
        const displayName = this.getDisplayName(usuario, sesion);

        return {
          id: sesion.id,
          initials: this.getInitials(displayName),
          displayName,
          meta: this.getSessionMeta(sesion)
        };
      });
  }

  private getDisplayName(usuario: ResponseUsuarioDTO | undefined, sesion: ResponseSesionDTO): string {
    const fullName = [
      usuario?.nombre1,
      usuario?.nombre2,
      usuario?.apellido1,
      usuario?.apellido2
    ]
      .filter((value): value is string => !!value)
      .map((value) => value.trim())
      .join(' ');

    if (fullName) {
      return fullName;
    }

    return usuario?.correoElectronico ?? sesion.usuario.nombre;
  }

  private getInitials(displayName: string): string {
    const initials = displayName
      .split(' ')
      .filter((part) => !!part)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');

    return initials || 'US';
  }

  private getSessionMeta(sesion: ResponseSesionDTO): string {
    const lastAccess = sesion.fechaUltimoAcceso || sesion.fechaInicio;

    return `Último acceso ${this.formatRelativeTime(lastAccess)}`;
  }

  private formatRelativeTime(dateValue: string): string {
    const timestamp = new Date(dateValue).getTime();

    if (Number.isNaN(timestamp)) {
      return 'reciente';
    }

    const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));

    if (diffMinutes < 1) {
      return 'ahora';
    }

    if (diffMinutes < 60) {
      return `hace ${diffMinutes}m`;
    }

    const diffHours = Math.round(diffMinutes / 60);

    if (diffHours < 24) {
      return `hace ${diffHours}h`;
    }

    const diffDays = Math.round(diffHours / 24);
    return `hace ${diffDays}d`;
  }

  private isActivo(estado: string): boolean {
    return estado?.toUpperCase() === 'ACTIVO' || estado?.toUpperCase() === 'A';
  }

}
