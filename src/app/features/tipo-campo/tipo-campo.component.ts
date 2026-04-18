import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import {
  CreateTipoCampoDTO,
  ResponseTipoCampoDTO,
  UpdateTipoCampoDTO
} from '../../models/operacion/tipo-campo.models';
import { TipoCampoService } from '../../services/operacion/tipo-campo.service';
import { formatBackendDateTime } from '../../core/utils/date-time.util';
import { RequiredFieldDirective } from '../../core/directives/required-field.directive';
import { getDefaultAuditData, resolveAuditDate, resolveAuditValue, resolveEstadoLabel, sortByNombre } from '../../core/utils/admin-crud.util';

@Component({
  selector: 'app-tipo-campo',
  imports: [CommonModule, ReactiveFormsModule, RequiredFieldDirective],
  templateUrl: './tipo-campo.component.html',
  styleUrl: './tipo-campo.component.scss'
})
export class TipoCampoComponent implements OnInit {
  tipoCampos: ResponseTipoCampoDTO[] = [];
  form: FormGroup;
  loading = false;
  saving = false;
  errorMessage: string | null = null;
  loggedUserName = '-';
  selectedTipoCampoId: number | null = null;
  estadoActual = '-';
  usuarioCreacion = '-';
  fechaCreacion = '-';
  usuarioActualizacion = '-';
  fechaActualizacion = '-';
  readonly formatDateTime = formatBackendDateTime;

  constructor(
    private fb: FormBuilder,
    private tipoCampoService: TipoCampoService
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
    this.loadTipoCampos();
  }

  get isEditMode(): boolean {
    return this.selectedTipoCampoId !== null;
  }

  submitTipoCampo(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;

    if (this.isEditMode) {
      this.updateTipoCampo();
      return;
    }

    const payload: CreateTipoCampoDTO = {
      nombre: this.form.get('nombre')?.value?.trim(),
      descripcion: this.form.get('descripcion')?.value?.trim()
    };

    this.tipoCampoService.createTipoCampo(payload).subscribe({
      next: (response) => {
        this.saving = false;

        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operación exitosa',
            text: 'El tipo de campo fue creado correctamente.',
            confirmButtonText: 'Aceptar'
          });

          this.resetForm();
          this.loadTipoCampos();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible crear el tipo de campo.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        this.saving = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible crear el tipo de campo.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  editTipoCampo(item: ResponseTipoCampoDTO): void {
    this.selectedTipoCampoId = item.id;
    this.setAuditData(item);

    this.form.patchValue({
      nombre: item.nombre,
      descripcion: item.descripcion
    });
  }

  async confirmDeleteTipoCampo(item: ResponseTipoCampoDTO): Promise<void> {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Confirmar acción',
      text: `¿Está seguro de inactivar el tipo de campo ${item.nombre}?`,
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
      return;
    }

    this.inactiveTipoCampo(item);
  }

  deleteCurrentTipoCampo(): void {
    if (!this.selectedTipoCampoId) {
      return;
    }

    const item = this.tipoCampos.find((value) => value.id === this.selectedTipoCampoId);
    if (item) {
      void this.confirmDeleteTipoCampo(item);
    }
  }

  resetForm(): void {
    this.form.reset({
      nombre: '',
      descripcion: ''
    });
    this.selectedTipoCampoId = null;
    this.setAuditData();
  }

  isActivo(estado: string): boolean {
    return estado?.toUpperCase() === 'ACTIVO' || estado?.toUpperCase() === 'A';
  }

  private updateTipoCampo(): void {
    if (!this.selectedTipoCampoId) {
      this.saving = false;
      return;
    }

    const payload: UpdateTipoCampoDTO = {
      nombre: this.form.get('nombre')?.value?.trim(),
      descripcion: this.form.get('descripcion')?.value?.trim(),
      estado: 'A'
    };

    this.tipoCampoService.updateTipoCampo(this.selectedTipoCampoId, payload).subscribe({
      next: (response) => {
        this.saving = false;

        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operación exitosa',
            text: 'El tipo de campo fue actualizado correctamente.',
            confirmButtonText: 'Aceptar'
          });

          this.resetForm();
          this.loadTipoCampos();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible actualizar el tipo de campo.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        this.saving = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible actualizar el tipo de campo.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  private inactiveTipoCampo(item: ResponseTipoCampoDTO): void {
    const payload: UpdateTipoCampoDTO = {
      nombre: item.nombre,
      descripcion: item.descripcion,
      estado: 'I'
    };

    this.tipoCampoService.updateTipoCampo(item.id, payload).subscribe({
      next: (response) => {
        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operación exitosa',
            text: 'El tipo de campo fue inactivado correctamente.',
            confirmButtonText: 'Aceptar'
          });

          if (this.selectedTipoCampoId === item.id) {
            this.resetForm();
          }

          this.loadTipoCampos();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible inactivar el tipo de campo.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible inactivar el tipo de campo.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  private loadTipoCampos(): void {
    this.loading = true;
    this.errorMessage = null;

    this.tipoCampoService.getAllTipoCampos().subscribe({
      next: (response) => {
        this.tipoCampos = sortByNombre(response?.contenido ?? []);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No fue posible cargar los tipos de campo registrados.';
      }
    });
  }

  private setAuditData(item?: ResponseTipoCampoDTO): void {
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

