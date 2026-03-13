import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LoginService } from '../../../services/seguridad/login.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})

export class SidebarComponent implements OnInit {
  userName = 'Usuario';
  userRole = 'Usuario';
  userInitials = 'US';

  constructor(
    private router: Router,
    private loginService: LoginService
  ) {}

  ngOnInit(): void {
    const rawUser = localStorage.getItem('auth_user');

    if (!rawUser) {
      return;
    }

    try {
      const user = JSON.parse(rawUser);
      const nameParts = [user.nombre1, user.apellido1]
        .filter((part: string) => !!part)
        .map((part: string) => part.trim());

      if (nameParts.length > 0) {
        this.userName = nameParts.join(' ');
      }

      this.userInitials = this.buildInitials(this.userName);
    } catch {
      this.userName = 'Usuario';
      this.userInitials = 'US';
    }
  }

  logout(): void {
    Swal.fire({
      icon: 'question',
      title: '¿Cerrar sesión?',
      text: '¿Está seguro de que desea cerrar sesión?',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar sesión',
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
              title: 'Sesión cerrada localmente',
              text: 'No se pudo notificar el cierre de sesión al servidor, pero tu sesión local fue cerrada.'
            });
          }
        });
      }
    });
  }

  private getCurrentUserId(): number | null {
    const rawUser = localStorage.getItem('auth_user');

    if (!rawUser) {
      return null;
    }

    try {
      const user = JSON.parse(rawUser) as { id?: number };
      return typeof user.id === 'number' ? user.id : null;
    } catch {
      return null;
    }
  }

  private finalizeLogout(alert?: { icon: 'success' | 'warning'; title: string; text: string }): void {
    this.loginService.clearToken();
    localStorage.removeItem('auth_user');

    this.router.navigate(['/login']).then(() => {
      Swal.fire({
        icon: alert?.icon ?? 'success',
        title: alert?.title ?? 'Sesión cerrada',
        text: alert?.text ?? 'Has cerrado sesión correctamente.',
        confirmButtonText: 'Aceptar'
      });
    });
  }

  private buildInitials(fullName: string): string {
    const words = fullName.split(' ').filter(word => word.length > 0);
    if (words.length === 0) {
      return 'US';
    }

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

}
