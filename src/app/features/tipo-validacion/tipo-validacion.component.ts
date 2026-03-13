import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import {
  CreateTipoValidacionDTO,
  ResponseTipoValidacionDTO,
  UpdateTipoValidacionDTO
} from '../../models/operacion/tipo-validacion.models';
import { TipoValidacionService } from '../../services/operacion/tipo-validacion.service';
import { formatBackendDateTime } from '../../core/utils/date-time.util';

@Component({
  selector: 'app-tipo-validacion',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tipo-validacion.component.html',
  styleUrl: './tipo-validacion.component.scss'
})
export class TipoValidacionComponent implements OnInit {
  tipoValidaciones: ResponseTipoValidacionDTO[] = [];
  form: FormGroup;
  loading = false;
  saving = false;
  errorMessage: string | null = null;
  loggedUserName = '-';
  selectedTipoValidacionId: number | null = null;
  readonly formatDateTime = formatBackendDateTime;

  constructor(
    private fb: FormBuilder,
    private tipoValidacionService: TipoValidacionService
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required]
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

    this.loadTipoValidaciones();
  }

  get isEditMode(): boolean {
    return this.selectedTipoValidacionId !== null;
  }

  submitTipoValidacion(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;

    if (this.isEditMode) {
      this.updateTipoValidacion();
      return;
    }

    const payload: CreateTipoValidacionDTO = {
      nombre: this.form.get('nombre')?.value?.trim(),
      descripcion: this.form.get('descripcion')?.value?.trim()
    };

    this.tipoValidacionService.createTipoValidacion(payload).subscribe({
      next: (response) => {
        this.saving = false;

        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operacion exitosa',
            text: 'El tipo de validacion fue creado correctamente.',
            confirmButtonText: 'Aceptar'
          });

          this.resetForm();
          this.loadTipoValidaciones();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible crear el tipo de validacion.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        this.saving = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible crear el tipo de validacion.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  editTipoValidacion(item: ResponseTipoValidacionDTO): void {
    this.selectedTipoValidacionId = item.id;

    this.form.patchValue({
      nombre: item.nombre,
      descripcion: item.descripcion
    });
  }

  resetForm(): void {
    this.form.reset({
      nombre: '',
      descripcion: ''
    });
    this.selectedTipoValidacionId = null;
  }

  isActivo(estado: string): boolean {
    return estado?.toUpperCase() === 'ACTIVO' || estado?.toUpperCase() === 'A';
  }

  private updateTipoValidacion(): void {
    if (!this.selectedTipoValidacionId) {
      this.saving = false;
      return;
    }

    const payload: UpdateTipoValidacionDTO = {
      nombre: this.form.get('nombre')?.value?.trim(),
      descripcion: this.form.get('descripcion')?.value?.trim()
    };

    this.tipoValidacionService.updateTipoValidacion(this.selectedTipoValidacionId, payload).subscribe({
      next: (response) => {
        this.saving = false;

        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operacion exitosa',
            text: 'El tipo de validacion fue actualizado correctamente.',
            confirmButtonText: 'Aceptar'
          });

          this.resetForm();
          this.loadTipoValidaciones();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible actualizar el tipo de validacion.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        this.saving = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible actualizar el tipo de validacion.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  private loadTipoValidaciones(): void {
    this.loading = true;
    this.errorMessage = null;

    this.tipoValidacionService.getAllTipoValidaciones().subscribe({
      next: (response) => {
        this.tipoValidaciones = response?.contenido ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No fue posible cargar los tipos de validacion registrados.';
      }
    });
  }
}
