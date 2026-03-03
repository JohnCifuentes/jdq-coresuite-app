import { Component } from '@angular/core';
import { Router } from '@angular/router'
import { AuthRoutingModule } from "../auth-routing.module";
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoginService } from '../../../services/seguridad/login.service';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    AuthRoutingModule,
    ReactiveFormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})

export class LoginComponent {

  form: FormGroup;
  errorMessage: string | null = null;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private loginService: LoginService
  ){
    this.form = this.fb.group({
      correoElectronico: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  login(){
    if(this.form.invalid){
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = null;
    const creds = this.form.value;
    this.loginService.login(creds).subscribe({
      next: (res: any) => {
        if (!res.error) {
          this.loginService.setToken(res.contenido.token);
          this.router.navigate(['/app']);
        } else {
          this.errorMessage = 'Credenciales inválidas';
        }
      },
      error: (err: any) => {
        this.errorMessage = err.error.contenido || 'Error al iniciar sesión';
      }
    });
  }

}
