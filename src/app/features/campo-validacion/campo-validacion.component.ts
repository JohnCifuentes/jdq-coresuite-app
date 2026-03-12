import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { ResponseCampoDTO } from '../../models/operacion/campo.models';
import {
  CreateCampoValidacionDTO,
  ResponseCampoValidacionDTO,
  UpdateCampoValidacionDTO
} from '../../models/operacion/campo-validacion.models';
import { ResponseTipoValidacionDTO } from '../../models/operacion/tipo-validacion.models';
import { CampoService } from '../../services/operacion/campo.service';
import { CampoValidacionService } from '../../services/operacion/campo-validacion.service';
import { TipoValidacionService } from '../../services/operacion/tipo-validacion.service';

@Component({
  selector: 'app-campo-validacion',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './campo-validacion.component.html',
  styleUrl: './campo-validacion.component.scss'
})
export class CampoValidacionComponent implements OnInit {
  campoValidaciones: ResponseCampoValidacionDTO[] = [];
  campos: ResponseCampoDTO[] = [];
  tiposValidacion: ResponseTipoValidacionDTO[] = [];
  form: FormGroup;
  loading = false;
  saving = false;
  errorMessage: string | null = null;
  loggedUserName = '-';
  selectedCampoValidacionId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private campoService: CampoService,
    private campoValidacionService: CampoValidacionService,
    private tipoValidacionService: TipoValidacionService
  ) {
    this.form = this.fb.group({
      campoId: [null, Validators.required],
      tipoValidacionId: [null, Validators.required],
      valor: ['', Validators.required],
      campoReferenciaId: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    const rawUser = localStorage.getItem('auth_user');

    if (rawUser) {
      try {
        const user = JSON.parse(rawUser);
        const userNameParts = [user?.nombre1, user?.apellido1]
          .filter((value: string | undefined) => !!value)
          .map((value: string) => value.trim());

        if (userNameParts.length > 0) {
          this.loggedUserName = userNameParts.join(' ');
        } else if (user?.correoElectronico) {
          this.loggedUserName = user.correoElectronico;
        }
      } catch {
        this.loggedUserName = '-';
      }
    }

    this.loadCatalogos();
    this.loadCampoValidaciones();
  }

  get isEditMode(): boolean {
    return this.selectedCampoValidacionId !== null;
  }

  submitCampoValidacion(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;

    if (this.isEditMode) {
      this.updateCampoValidacion();
      return;
    }

    const payload: CreateCampoValidacionDTO = {
      campoId: Number(this.form.get('campoId')?.value),
      tipoValidacionId: Number(this.form.get('tipoValidacionId')?.value),
      valor: this.form.get('valor')?.value?.trim(),
      campoReferenciaId: Number(this.form.get('campoReferenciaId')?.value)
    };

    this.campoValidacionService.createCampoValidacion(payload).subscribe({
      next: (response) => {
        this.saving = false;

        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operacion exitosa',
            text: 'La validacion de campo fue creada correctamente.',
            confirmButtonText: 'Aceptar'
          });

          this.resetForm();
          this.loadCampoValidaciones();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible crear la validacion de campo.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        this.saving = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible crear la validacion de campo.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  editCampoValidacion(item: ResponseCampoValidacionDTO): void {
    this.selectedCampoValidacionId = item.id;

    this.form.patchValue({
      campoId: item.campo?.id ?? null,
      tipoValidacionId: item.tipoValidacion?.id ?? null,
      valor: item.valor,
      campoReferenciaId: item.campoReferencia?.id ?? null
    });
  }

  resetForm(): void {
    this.form.reset({
      campoId: null,
      tipoValidacionId: null,
      valor: '',
      campoReferenciaId: null
    });
    this.selectedCampoValidacionId = null;
  }

  isActivo(estado: string): boolean {
    return estado?.toUpperCase() === 'ACTIVO' || estado?.toUpperCase() === 'A';
  }

  private updateCampoValidacion(): void {
    if (!this.selectedCampoValidacionId) {
      this.saving = false;
      return;
    }

    const payload: UpdateCampoValidacionDTO = {
      campoId: Number(this.form.get('campoId')?.value),
      tipoValidacionId: Number(this.form.get('tipoValidacionId')?.value),
      valor: this.form.get('valor')?.value?.trim(),
      campoReferenciaId: Number(this.form.get('campoReferenciaId')?.value)
    };

    this.campoValidacionService.updateCampoValidacion(this.selectedCampoValidacionId, payload).subscribe({
      next: (response) => {
        this.saving = false;

        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operacion exitosa',
            text: 'La validacion de campo fue actualizada correctamente.',
            confirmButtonText: 'Aceptar'
          });

          this.resetForm();
          this.loadCampoValidaciones();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible actualizar la validacion de campo.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        this.saving = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible actualizar la validacion de campo.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  private loadCatalogos(): void {
    this.campoService.getAllCampos().subscribe({
      next: (response) => {
        this.campos = response?.contenido ?? [];
      },
      error: () => {
        this.campos = [];
      }
    });

    this.tipoValidacionService.getAllTipoValidaciones().subscribe({
      next: (response) => {
        this.tiposValidacion = response?.contenido ?? [];
      },
      error: () => {
        this.tiposValidacion = [];
      }
    });
  }

  private loadCampoValidaciones(): void {
    this.loading = true;
    this.errorMessage = null;

    this.campoValidacionService.getAllCampoValidaciones().subscribe({
      next: (response) => {
        this.campoValidaciones = response?.contenido ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No fue posible cargar las validaciones de campo registradas.';
      }
    });
  }
}
