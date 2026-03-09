import { Component } from '@angular/core';
import { Router } from '@angular/router'
import { AuthRoutingModule } from "../auth-routing.module";
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoginService } from '../../../services/seguridad/login.service';
import { UsuarioService } from '../../../services/seguridad/usuario.service';
import { UsuarioCredencialesDTO } from '../../../models/seguridad/usuario.models';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    AuthRoutingModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})

export class LoginComponent {

  form: FormGroup;
  errorMessage: string | null = null;
  failedAttempts = 0;
  userBlocked = false;
  showPassword = false;
  showPolicyModal = false;
  aceptaTerminos = false;

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
      correoElectronico: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  login(){
    if (this.userBlocked) {
      Swal.fire({
        icon: 'error',
        title: 'Usuario bloqueado',
        text: 'Tu usuario ha sido bloqueado y debes contactarte con el administrador del sistema.',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    if(this.form.invalid){
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = null;
    const creds: UsuarioCredencialesDTO = this.form.value;
    this.loginService.login(creds).subscribe({
      next: (res: any) => {
        if (!res.error) {
          this.failedAttempts = 0;
          this.loginService.setToken(res.contenido.token);
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
                this.router.navigate(['/app']);
              }
            },
            error: () => {
              this.router.navigate(['/app']);
            }
          });
        } else {
          this.handleFailedLogin(creds.correoElectronico, 'Credenciales inválidas');
        }
      },
      error: (err: any) => {
        this.handleFailedLogin(creds.correoElectronico, err?.error?.contenido || 'Error al iniciar sesión');
      }
    });
  }

  private handleFailedLogin(correoElectronico: string, message: string): void {
    this.failedAttempts += 1;

    if (this.failedAttempts >= 3) {
      this.usuarioService.bloquearUsuario(correoElectronico).subscribe({
        next: () => {
          this.userBlocked = true;
          this.errorMessage = 'Usuario bloqueado';
          Swal.fire({
            icon: 'error',
            title: 'Usuario bloqueado',
            text: 'Tu usuario ha sido bloqueado y debes contactarte con el administrador del sistema.',
            confirmButtonText: 'Aceptar'
          });
        },
        error: () => {
          this.userBlocked = true;
          this.errorMessage = 'Usuario bloqueado';
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
