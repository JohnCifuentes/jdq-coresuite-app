import { Component } from '@angular/core';
import { Router } from '@angular/router'
import { AuthRoutingModule } from "../auth-routing.module";
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { LoginService } from '../../../services/seguridad/login.service';
import { UsuarioService } from '../../../services/seguridad/usuario.service';
import { UsuarioCredencialesDTO } from '../../../models/seguridad/usuario.models';
import { ConfirmarUsuarioCodigoDTO } from '../../../models/seguridad/codigo.models';
import { RequiredFieldDirective } from '../../../core/directives/required-field.directive';
import { PolicyModalComponent } from '../../../components/policy-modal/policy-modal.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    AuthRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    RequiredFieldDirective,
    PolicyModalComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})

export class LoginComponent {

  form: FormGroup;
  errorMessage: string | null = null;
  private failedAttemptsByEmail = new Map<string, number>();
  showPassword = false;
  showPolicyModal = false;
  aceptaTerminos = false;
  mostrar2FA = false;
  codigo2FA = '';
  isLoading = false;
  private correoTemporal = '';

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  openPolicyModal(): void {
    this.showPolicyModal = true;
  }

  closePolicyModal(): void {
    this.showPolicyModal = false;
  }

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private loginService: LoginService,
    private usuarioService: UsuarioService
  ){
    this.form = this.fb.group({
      correoElectronico: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$')]],
      password: ['', Validators.required]
    });
  }

  login(){
    if(this.form.invalid){
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = null;
    const creds: UsuarioCredencialesDTO = this.form.value;
    this.isLoading = true;
    this.loginService.login(creds).pipe(
      finalize(() => { this.isLoading = false; })
    ).subscribe({
      next: (res) => {
        if (!res.error) {
          this.failedAttemptsByEmail.delete(creds.correoElectronico.toLowerCase().trim());
          if (res.contenido === 'Codigo generado correctamente') {
            this.correoTemporal = creds.correoElectronico;
            this.mostrar2FA = true;
          } else {
            // Flujo sin 2FA: el contenido es directamente el token
            const token = res.contenido;
            this.completarLogin(token, creds);
          }
        } else {
          this.handleFailedLogin(creds.correoElectronico, 'Credenciales inválidas');
        }
      },
      error: (err: any) => {
        this.handleFailedLogin(creds.correoElectronico, err?.error?.contenido || 'Error al iniciar sesión');
      }
    });
  }

  confirmarCodigo2FA(): void {
    if (!this.codigo2FA.trim()) {
      return;
    }

    const payload: ConfirmarUsuarioCodigoDTO = {
      correoElectronico: this.correoTemporal,
      codigo: this.codigo2FA.trim()
    };

    this.isLoading = true;
    this.loginService.login2FA(payload).pipe(
      finalize(() => { this.isLoading = false; })
    ).subscribe({
      next: (res) => {
        if (res.error === true) {
          const mensaje = typeof res.contenido === 'string' && res.contenido.trim()
            ? res.contenido
            : 'Error al validar el código. Intente nuevamente.';
          Swal.fire({ icon: 'error', title: 'Código inválido', text: mensaje, confirmButtonText: 'Aceptar' });
          return;
        }

        const token = (res.contenido as { token: string }).token;
        this.mostrar2FA = false;
        this.codigo2FA = '';
        const creds: UsuarioCredencialesDTO = this.form.value;
        this.completarLogin(token, creds);
      },
      error: (err: any) => {
        const mensaje = typeof err?.error?.contenido === 'string' && err.error.contenido.trim()
          ? err.error.contenido
          : 'Error al validar el código. Intente nuevamente.';
        Swal.fire({ icon: 'error', title: 'Error', text: mensaje, confirmButtonText: 'Aceptar' });
      }
    });
  }

  cancelar2FA(): void {
    this.mostrar2FA = false;
    this.codigo2FA = '';
    this.correoTemporal = '';
  }

  private completarLogin(token: string, creds: UsuarioCredencialesDTO): void {
    this.loginService.setToken(token);
    const redirectUrl = this.loginService.getRedirectFromToken(token);
    this.usuarioService.getUsuarioByCorreoElectronicoAndPassword(creds).subscribe({
      next: userRes => {
        if (!userRes.error && userRes.contenido) {
          localStorage.setItem('auth_user', JSON.stringify(userRes.contenido));
        }
        if (!userRes.error && userRes.contenido?.primerAcceso) {
          Swal.fire({
            icon: 'info',
            title: 'Primer acceso',
            text: 'Debes asignar una nueva contraseña para continuar.',
            confirmButtonText: 'Aceptar'
          }).then(() => {
            this.router.navigate(['/reset-password'], { queryParams: { email: creds.correoElectronico, firstAccess: 'true' } });
          });
        } else {
          this.router.navigateByUrl(redirectUrl);
        }
      },
      error: () => {
        this.router.navigateByUrl(redirectUrl);
      }
    });
  }

  private handleFailedLogin(correoElectronico: string, message: string): void {
    const key = correoElectronico.toLowerCase().trim();
    const attempts = (this.failedAttemptsByEmail.get(key) ?? 0) + 1;
    this.failedAttemptsByEmail.set(key, attempts);

    if (attempts >= 3) {
      this.usuarioService.bloquearUsuario(correoElectronico).subscribe({
        next: () => {
          this.failedAttemptsByEmail.delete(key);
          this.errorMessage = null;
          Swal.fire({
            icon: 'error',
            title: 'Usuario bloqueado',
            text: 'Tu usuario ha sido bloqueado y debes contactarte con el administrador del sistema.',
            confirmButtonText: 'Aceptar'
          });
        },
        error: () => {
          this.failedAttemptsByEmail.delete(key);
          this.errorMessage = null;
          Swal.fire({
            icon: 'error',
            title: 'Usuario bloqueado',
            text: 'Tu usuario ha sido bloqueado y debes contactarte con el administrador del sistema.',
            confirmButtonText: 'Aceptar'
          });
        }
      });
      return;
    }

    this.errorMessage = message;
  }

}
