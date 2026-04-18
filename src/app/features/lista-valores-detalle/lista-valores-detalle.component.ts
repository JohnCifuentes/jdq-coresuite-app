import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { ResponseListaValoresDTO } from '../../models/operacion/lista-valores.models';
import {
  CreateListaValoresDetalleDTO,
  ResponseListaValoresDetalleDTO,
  UpdateListaValoresDetalleDTO
} from '../../models/operacion/lista-valores-detalle.models';
import { ListaValoresService } from '../../services/operacion/lista-valores.service';
import { ListaValoresDetalleService } from '../../services/operacion/lista-valores-detalle.service';
import { formatBackendDateTime } from '../../core/utils/date-time.util';
import { RequiredFieldDirective } from '../../core/directives/required-field.directive';
import { getDefaultAuditData, resolveAuditDate, resolveAuditValue, resolveEstadoLabel, sortByNombre } from '../../core/utils/admin-crud.util';

@Component({
  selector: 'app-lista-valores-detalle',
  imports: [CommonModule, ReactiveFormsModule, RequiredFieldDirective],
  templateUrl: './lista-valores-detalle.component.html',
  styleUrl: './lista-valores-detalle.component.scss'
})
export class ListaValoresDetalleComponent implements OnInit {
  detalles: ResponseListaValoresDetalleDTO[] = [];
  listasValores: ResponseListaValoresDTO[] = [];
  form: FormGroup;
  loading = false;
  saving = false;
  errorMessage: string | null = null;
  loggedUserName = '-';
  empresaId: number | null = null;
  selectedDetalleId: number | null = null;
  estadoActual = '-';
  usuarioCreacion = '-';
  fechaCreacion = '-';
  usuarioActualizacion = '-';
  fechaActualizacion = '-';
  readonly formatDateTime = formatBackendDateTime;

  constructor(
    private fb: FormBuilder,
    private listaValoresService: ListaValoresService,
    private listaValoresDetalleService: ListaValoresDetalleService
  ) {
    this.form = this.fb.group({
      listaValoresId: [null, Validators.required],
      nombre: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const rawUser = localStorage.getItem('auth_user');
    if (!rawUser) {
      this.errorMessage = 'No se encontró información del usuario logueado.';
      return;
    }

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

      const empresaId = user?.empresa?.id;

      if (!empresaId) {
        this.errorMessage = 'No se encontró la empresa del usuario logueado.';
        return;
      }

      this.empresaId = empresaId;
      this.setAuditData();
      this.loadListasValoresByEmpresa(empresaId);
    } catch {
      this.errorMessage = 'No se pudo leer la información del usuario logueado.';
    }
  }

  get isEditMode(): boolean {
    return this.selectedDetalleId !== null;
  }

  submitDetalle(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;

    if (this.isEditMode) {
      this.updateDetalle();
      return;
    }

    const payload: CreateListaValoresDetalleDTO = {
      listaValoresId: Number(this.form.get('listaValoresId')?.value),
      nombre: this.form.get('nombre')?.value?.trim()
    };

    this.listaValoresDetalleService.createListaValoresDetalle(payload).subscribe({
      next: (response) => {
        this.saving = false;

        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operación exitosa',
            text: 'El detalle fue creado correctamente.',
            confirmButtonText: 'Aceptar'
          });

          this.resetForm(false);
          this.loadDetallesByListaValores(payload.listaValoresId);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible crear el detalle.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        this.saving = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible crear el detalle.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  editDetalle(detalle: ResponseListaValoresDetalleDTO): void {
    this.selectedDetalleId = detalle.id;
    this.setAuditData(detalle);
    this.form.patchValue({
      listaValoresId: detalle.listaValores?.id,
      nombre: detalle.nombre
    });
  }

  async confirmDeleteDetalle(detalle: ResponseListaValoresDetalleDTO): Promise<void> {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Confirmar acción',
      text: `¿Está seguro de inactivar el detalle ${detalle.nombre}?`,
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
      return;
    }

    this.inactiveDetalle(detalle);
  }

  deleteCurrentDetalle(): void {
    if (!this.selectedDetalleId) {
      return;
    }

    const detalle = this.detalles.find((item) => item.id === this.selectedDetalleId);
    if (detalle) {
      void this.confirmDeleteDetalle(detalle);
    }
  }

  onListaValoresChange(): void {
    const listaValoresId = Number(this.form.get('listaValoresId')?.value);

    if (!Number.isFinite(listaValoresId) || listaValoresId <= 0) {
      this.detalles = [];
      return;
    }

    this.loadDetallesByListaValores(listaValoresId);
  }

  resetForm(resetLista = true): void {
    this.form.reset({
      listaValoresId: resetLista ? null : this.form.get('listaValoresId')?.value,
      nombre: ''
    });

    this.selectedDetalleId = null;
    this.setAuditData();
  }

  isActivo(estado: string): boolean {
    return estado?.toUpperCase() === 'ACTIVO' || estado?.toUpperCase() === 'A';
  }

  private updateDetalle(): void {
    if (!this.selectedDetalleId) {
      this.saving = false;
      return;
    }

    const payload: UpdateListaValoresDetalleDTO = {
      listaValoresId: Number(this.form.get('listaValoresId')?.value),
      nombre: this.form.get('nombre')?.value?.trim(),
      estado: 'A'
    };

    this.listaValoresDetalleService.updateListaValoresDetalle(this.selectedDetalleId, payload).subscribe({
      next: (response) => {
        this.saving = false;

        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operación exitosa',
            text: 'El detalle fue actualizado correctamente.',
            confirmButtonText: 'Aceptar'
          });

          this.resetForm(false);
          this.loadDetallesByListaValores(payload.listaValoresId);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible actualizar el detalle.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        this.saving = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible actualizar el detalle.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  private inactiveDetalle(detalle: ResponseListaValoresDetalleDTO): void {
    const payload: UpdateListaValoresDetalleDTO = {
      listaValoresId: detalle.listaValores?.id,
      nombre: detalle.nombre,
      estado: 'I'
    };

    this.listaValoresDetalleService.updateListaValoresDetalle(detalle.id, payload).subscribe({
      next: (response) => {
        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operación exitosa',
            text: 'El detalle fue inactivado correctamente.',
            confirmButtonText: 'Aceptar'
          });

          if (this.selectedDetalleId === detalle.id) {
            this.resetForm(false);
          }

          this.loadDetallesByListaValores(payload.listaValoresId);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible inactivar el detalle.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible inactivar el detalle.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  private loadListasValoresByEmpresa(empresaId: number): void {
    this.listaValoresService.getListaValoresByEmpresa(empresaId).subscribe({
      next: (response) => {
        this.listasValores = sortByNombre(response?.contenido ?? []);

        const firstListaValoresId = this.listasValores[0]?.id;
        if (firstListaValoresId) {
          this.form.patchValue({ listaValoresId: firstListaValoresId });
          this.loadDetallesByListaValores(firstListaValoresId);
        }
      },
      error: () => {
        this.errorMessage = 'No fue posible cargar las listas de valores.';
      }
    });
  }

  private loadDetallesByListaValores(listaValoresId: number): void {
    this.loading = true;
    this.errorMessage = null;

    this.listaValoresDetalleService.getListaValoresDetalleByListaValores(listaValoresId).subscribe({
      next: (response) => {
        this.detalles = sortByNombre(response?.contenido ?? []);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No fue posible cargar los detalles registrados.';
      }
    });
  }

  private setAuditData(item?: ResponseListaValoresDetalleDTO): void {
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

