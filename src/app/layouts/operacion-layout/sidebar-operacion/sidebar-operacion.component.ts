import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { ResponseInterfazDTO } from '../../../models/operacion/interfaz.models';
import { ResponseModuloDTO } from '../../../models/operacion/modulo.models';
import { InterfazService } from '../../../services/operacion/interfaz.service';
import { ModuloService } from '../../../services/operacion/modulo.service';
import { LoginService } from '../../../services/seguridad/login.service';
import Swal from 'sweetalert2';

interface SidebarMenuInterface {
  id: number;
  nombre: string;
  ruta: string;
  indice: number;
}

interface SidebarMenuModule {
  id: number;
  nombre: string;
  icono: string;
  indice: number;
  expanded: boolean;
  interfaces: SidebarMenuInterface[];
}

interface StoredUserLike {
  id?: number;
  nombre1?: string;
  apellido1?: string;
  correoElectronico?: string;
  empresa?: { id?: number; razonSocial?: string; consecutivo?: number };
  empresaId?: number;
  empresaConsecutivo?: number;
}


@Component({
  selector: 'app-sidebar-operacion',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar-operacion.component.html',
  styleUrl: './sidebar-operacion.component.scss'
})
export class SidebarOperacionComponent implements OnInit {
  userName = 'Usuario';
  userRole = 'OPERACION';
  userInitials = 'US';
  loading = false;
  errorMessage: string | null = null;
  menu: SidebarMenuModule[] = [];

  constructor(
    private router: Router,
    private loginService: LoginService,
    private moduloService: ModuloService,
    private interfazService: InterfazService
  ) {}

  ngOnInit(): void {
    const user = this.getStoredUser();

    if (user) {
      const nameParts = [user.nombre1, user.apellido1]
        .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
        .map((part) => part.trim());

      if (nameParts.length > 0) {
        this.userName = nameParts.join(' ');
      } else if (user.correoElectronico) {
        this.userName = user.correoElectronico;
      }
    }

    this.userRole = this.loginService.getRoleFromToken();
    this.userInitials = this.buildInitials(this.userName);

    const empresaId = this.getEmpresaId(user);
    if (empresaId === null) {
      this.errorMessage = 'No se encontró la empresa del usuario autenticado.';
      return;
    }

    this.loadMenu(empresaId);
  }

  toggleModule(moduleId: number): void {
    this.menu = this.menu.map((item) =>
      item.id === moduleId
        ? { ...item, expanded: !item.expanded }
        : item
    );
  }

  trackByModuleId(_: number, item: SidebarMenuModule): number {
    return item.id;
  }

  trackByInterfaceId(_: number, item: SidebarMenuInterface): number {
    return item.id;
  }

  logout(): void {
    Swal.fire({
      icon: 'question',
      title: '¿Cerrar sesión?',
      text: '¿Está seguro de que desea cerrar sesión?',
      showCancelButton: true,
      confirmButtonText: 'Si, cerrar sesion',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const userId = this.getCurrentUserId();

        if (userId === null) {
          this.finalizeLogout();
          return;
        }

        this.loginService.cerrarSesion(userId).subscribe({
          next: () => {
            this.finalizeLogout();
          },
          error: () => {
            this.finalizeLogout({
              icon: 'warning',
              title: 'Sesion cerrada localmente',
              text: 'No se pudo notificar el cierre de sesion al servidor, pero tu sesion local fue cerrada.'
            });
          }
        });
      }
    });
  }

  private loadMenu(empresaId: number): void {
    this.loading = true;
    this.errorMessage = null;

    this.moduloService.getModulosByEmpresa(empresaId).pipe(
      map((response) => this.sortByIndice((response?.contenido ?? []).filter((modulo) => (modulo?.empresa?.id ?? empresaId) === empresaId))),
      switchMap((modulos) => {
        if (!modulos.length) {
          return of([] as SidebarMenuModule[]);
        }

        return forkJoin(
          modulos.map((modulo) =>
            this.interfazService.getInterfazByModulo(modulo.id).pipe(
              map((response) => ({
                modulo,
                interfaces: this.sortByIndice(
                  (response?.contenido ?? []).filter((item) => item?.modulo?.id === modulo.id)
                ).map((item) => this.toMenuInterface(item))
              })),
              catchError(() => of({ modulo, interfaces: [] as SidebarMenuInterface[] }))
            )
          )
        ).pipe(
          map((results) =>
            results
              .filter((result) => result.interfaces.length > 0)
              .map((result, index) => ({
                id: result.modulo.id,
                nombre: result.modulo.nombre,
                icono: this.resolveModuleIcon(result.modulo.nombre),
                indice: result.modulo.indice ?? 0,
                expanded: index === 0,
                interfaces: result.interfaces
              }))
          )
        );
      }),
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      next: (menu) => {
        this.menu = this.sortByIndice(menu);
        if (!this.menu.length) {
          this.errorMessage = 'No hay módulos o interfaces configuradas para tu empresa.';
        }
      },
      error: () => {
        this.menu = [];
        this.errorMessage = 'No fue posible cargar el menú de navegación.';
      }
    });
  }

  private toMenuInterface(item: ResponseInterfazDTO): SidebarMenuInterface {
    return {
      id: item.id,
      nombre: item.nombre,
      ruta: `/app/operacion/${item.id}`,
      indice: item.indice ?? 0
    };
  }

  private resolveModuleIcon(nombre: string): string {
    const normalized = this.normalizeText(nombre);

    if (normalized.includes('seguridad')) {
      return 'security';
    }

    if (normalized.includes('config')) {
      return 'settings';
    }

    if (normalized.includes('operacion')) {
      return 'tune';
    }

    if (normalized.includes('usuario')) {
      return 'group';
    }

    return 'folder';
  }

  private normalizeText(value: string | null | undefined): string {
    return (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private sortByIndice<T extends { indice?: number }>(items: T[]): T[] {
    return [...items].sort((a, b) => (a.indice ?? 0) - (b.indice ?? 0));
  }

  private getStoredUser(): StoredUserLike | null {
    const rawUser = localStorage.getItem('auth_user');
    if (rawUser) {
      try {
        return JSON.parse(rawUser) as StoredUserLike;
      } catch {
        // noop
      }
    }

    const rawToken = localStorage.getItem('auth_token');
    if (!rawToken) {
      return null;
    }

    try {
      return JSON.parse(rawToken) as StoredUserLike;
    } catch {
      try {
        const payload = rawToken.split('.')[1];
        if (!payload) {
          return null;
        }

        const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
        const paddingLength = (4 - (normalizedPayload.length % 4)) % 4;
        const paddedPayload = normalizedPayload + '='.repeat(paddingLength);
        return JSON.parse(atob(paddedPayload)) as StoredUserLike;
      } catch {
        return null;
      }
    }
  }

  private getEmpresaId(user: StoredUserLike | null): number | null {
    const candidates = [
      user?.empresa?.id,
      user?.empresaId,
      user?.empresaConsecutivo,
      user?.empresa?.consecutivo
    ];

    const value = candidates.find((candidate) => typeof candidate === 'number');
    return typeof value === 'number' ? value : null;
  }

  private getCurrentUserId(): number | null {
    const user = this.getStoredUser();
    return typeof user?.id === 'number' ? user.id : null;
  }

  private finalizeLogout(alert?: { icon: 'success' | 'warning'; title: string; text: string }): void {
    this.loginService.clearToken();
    localStorage.removeItem('auth_user');

    this.router.navigate(['/login']).then(() => {
      Swal.fire({
        icon: alert?.icon ?? 'success',
        title: alert?.title ?? 'Sesion cerrada',
        text: alert?.text ?? 'Has cerrado sesion correctamente.',
        confirmButtonText: 'Aceptar'
      });
    });
  }

  private buildInitials(fullName: string): string {
    const words = fullName.split(' ').filter((word) => word.length > 0);
    if (words.length === 0) {
      return 'US';
    }

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
}
