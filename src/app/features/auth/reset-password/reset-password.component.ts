import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthRoutingModule } from '../auth-routing.module';
import { Router, ActivatedRoute } from '@angular/router';
import { UsuarioService } from '../../../services/seguridad/usuario.service';
import { UsuarioCredencialesDTO } from '../../../models/seguridad/usuario.models';
import { RequiredFieldDirective } from '../../../core/directives/required-field.directive';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, ReactiveFormsModule, AuthRoutingModule, RequiredFieldDirective],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  email: string = '';
  firstAccess: boolean = false;
  showPassword = false;
  showConfirmPassword = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private usuarioService: UsuarioService
  ) {
    this.form = this.fb.group({
      password: ['', [Validators.required, this.passwordValidator]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      this.firstAccess = params['firstAccess'] === 'true';
      if (!this.email) {
        this.router.navigate(['/forgot-password']);
      }
    });
  }

  passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const minLength = value.length >= 8;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);

    if (minLength && hasUpperCase && hasNumber && hasSymbol) {
      return null;
    }

    return { invalidPassword: true };
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) return null;

    if (password.value === confirmPassword.value) {
      return null;
    }

    return { passwordMismatch: true };
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  getPasswordStrength(): { strength: string; percentage: number; rules: { [key: string]: boolean } } {
    const password = this.form.get('password')!.value || '';

    const rules = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };

    const passedRules = Object.values(rules).filter(Boolean).length;
    const percentage = (passedRules / Object.keys(rules).length) * 100;

    let strength = 'Débil';
    if (passedRules === 4) {
      strength = 'Fuerte';
    } else if (passedRules === 3) {
      strength = 'Medio';
    }

    return {
      strength,
      percentage,
      rules
    };
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    this.form.disable();
    const credentials: UsuarioCredencialesDTO = {
      correoElectronico: this.email,
      password: this.form.get('password')!.value
    };
    
    this.usuarioService.recuperarPassword(credentials).subscribe({
      next: () => {
        this.loading = false;
        Swal.fire({
          icon: 'success',
          title: 'Contraseña recuperada',
          text: 'Tu contraseña ha sido actualizada exitosamente.',
          confirmButtonText: 'Ir a iniciar sesión'
        }).then(() => {
          this.router.navigate(['/login']);
        });
      },
      error: () => {
        this.loading = false;
        this.form.enable();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible recuperar la contraseña. Intenta de nuevo.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }
}
