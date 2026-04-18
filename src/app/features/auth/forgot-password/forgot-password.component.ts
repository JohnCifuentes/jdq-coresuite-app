import { Component, ViewChild, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms'
import { AuthRoutingModule } from "../auth-routing.module";
import { CodigoService } from '../../../services/seguridad/codigo.service';
import { Router } from '@angular/router';
import { RequiredFieldDirective } from '../../../core/directives/required-field.directive';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, ReactiveFormsModule, AuthRoutingModule, RequiredFieldDirective],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  @ViewChildren('codeInput') codeInputs!: QueryList<ElementRef>;

  form: FormGroup;
  codeForm: FormGroup;
  codeSent = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private codigoService: CodigoService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.codeForm = this.fb.group({
      d1: ['', [Validators.required, Validators.maxLength(1)]],
      d2: ['', [Validators.required, Validators.maxLength(1)]],
      d3: ['', [Validators.required, Validators.maxLength(1)]],
      d4: ['', [Validators.required, Validators.maxLength(1)]],
      d5: ['', [Validators.required, Validators.maxLength(1)]],
      d6: ['', [Validators.required, Validators.maxLength(1)]]
    });
  }

  sendCode(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    const email = this.form.get('email')!.value;

    this.codigoService.generar({ correoElectronico: email }).subscribe({
      next: (response) => {
        this.loading = false;
        if (!response.error) {
          this.codeSent = true;
          Swal.fire({
            icon: 'success',
            title: 'Código enviado',
            text: `Se ha enviado un código de verificación a ${email}`,
            confirmButtonText: 'Aceptar'
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: response.contenido || 'No fue posible enviar el código. Intenta de nuevo.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible enviar el código. Intenta de nuevo.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  onCodeInput(index: number, event: any): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (value && index < 5) {
      this.codeInputs.toArray()[index + 1].nativeElement.focus();
    }

    if (!value && index > 0 && event.inputType === 'deleteContentBackward') {
      this.codeInputs.toArray()[index - 1].nativeElement.focus();
    }
  }

  isCodeComplete(): boolean {
    return this.codeForm.valid;
  }

  verifyCode(): void {
    if (!this.codeForm.valid) {
      return;
    }

    this.loading = true;
    const codigo = Object.keys(this.codeForm.controls)
      .sort()
      .map(key => this.codeForm.get(key)!.value)
      .join('');
    const email = this.form.get('email')!.value;

    this.codigoService.confirmarCodigo({
      correoElectronico: email,
      codigo: codigo
    }).subscribe({
      next: (response) => {
        this.loading = false;
        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Verificación exitosa',
            text: 'Tu código ha sido verificado correctamente.',
            confirmButtonText: 'Continuar'
          }).then(() => {
            this.router.navigate(['/reset-password'], {
              queryParams: { email: email }
            });
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Código inválido',
            text: response.contenido || 'El código ingresado no es válido. Intenta de nuevo.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible verificar el código. Intenta de nuevo.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }
}
