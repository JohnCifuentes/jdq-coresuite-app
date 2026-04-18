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
import { RequiredFieldDirective } from '../../core/directives/required-field.directive';
import { getDefaultAuditData, resolveAuditDate, resolveAuditValue, resolveEstadoLabel, sortByNombre } from '../../core/utils/admin-crud.util';

@Component({
  selector: 'app-tipo-validacion',
  imports: [CommonModule, ReactiveFormsModule, RequiredFieldDirective],
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
  estadoActual = '-';
  usuarioCreacion = '-';
  fechaCreacion = '-';
  usuarioActualizacion = '-';
  fechaActualizacion = '-';
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

    this.setAuditData();
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
    this.setAuditData(item);

    this.form.patchValue({
      nombre: item.nombre,
      descripcion: item.descripcion
    });
  }

  async confirmDeleteTipoValidacion(item: ResponseTipoValidacionDTO): Promise<void> {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Confirmar acción',
      text: `¿Está seguro de inactivar el tipo de validación ${item.nombre}?`,
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
      return;
    }

    this.inactiveTipoValidacion(item);
  }

  deleteCurrentTipoValidacion(): void {
    if (!this.selectedTipoValidacionId) {
      return;
    }

    const item = this.tipoValidaciones.find((value) => value.id === this.selectedTipoValidacionId);
    if (item) {
      void this.confirmDeleteTipoValidacion(item);
    }
  }

  resetForm(): void {
    this.form.reset({
      nombre: '',
      descripcion: ''
    });
    this.selectedTipoValidacionId = null;
    this.setAuditData();
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

  private inactiveTipoValidacion(item: ResponseTipoValidacionDTO): void {
    const payload: UpdateTipoValidacionDTO = {
      nombre: item.nombre,
      descripcion: item.descripcion,
      estado: 'I'
    };

    this.tipoValidacionService.updateTipoValidacion(item.id, payload).subscribe({
      next: (response) => {
        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operacion exitosa',
            text: 'El tipo de validacion fue inactivado correctamente.',
            confirmButtonText: 'Aceptar'
          });

          this.resetForm();
          this.loadTipoValidaciones();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible inactivar el tipo de validacion.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible inactivar el tipo de validacion.',
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
        this.tipoValidaciones = sortByNombre(response?.contenido ?? []);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No fue posible cargar los tipos de validacion registrados.';
      }
    });
  }

  private setAuditData(item?: ResponseTipoValidacionDTO): void {
    const defaults = getDefaultAuditData(this.loggedUserName);

    if (!item) {
      this.estadoActual = defaults.estadoActual;
      this.usuarioCreacion = defaults.usuarioCreacion;
      this.fechaCreacion = defaults.fechaCreacion;
      this.usuarioActualizacion = defaults.usuarioActualizacion;
      this.fechaActualizacion = defaults.fechaActualizacion;
      return;
    }

    this.estadoActual = resolveEstadoLabel(item, defaults.estadoActual);
    this.usuarioCreacion = resolveAuditValue(item, ['usuarioCreacion', 'createdBy', 'usuarioRegistro'], defaults.usuarioCreacion);
    this.fechaCreacion = resolveAuditDate(item, ['fechaCreacion', 'fechaRegistro', 'createdAt'], defaults.fechaCreacion);
    this.usuarioActualizacion = resolveAuditValue(item, ['usuarioActualizacion', 'updatedBy', 'usuarioModificacion'], defaults.usuarioActualizacion);
    this.fechaActualizacion = resolveAuditDate(item, ['fechaActualizacion', 'fechaModificacion', 'updatedAt'], defaults.fechaActualizacion);
  }
}

