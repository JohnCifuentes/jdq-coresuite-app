import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import {
  CreateInterfazDTO,
  Modulo,
  ResponseInterfazDTO,
  UpdateInterfazDTO
} from '../../models/operacion/interfaz.models';
import { InterfazService } from '../../services/operacion/interfaz.service';
import { ModuloService } from '../../services/operacion/modulo.service';
import { RequiredFieldDirective } from '../../core/directives/required-field.directive';
import { getDefaultAuditData, resolveAuditDate, resolveAuditValue, resolveEstadoLabel, sortByIndice } from '../../core/utils/admin-crud.util';
import { formatBackendDateTime } from '../../core/utils/date-time.util';

@Component({
  selector: 'app-interfaces',
  imports: [CommonModule, ReactiveFormsModule, RequiredFieldDirective],
  templateUrl: './interfaces.component.html',
  styleUrl: './interfaces.component.scss'
})
export class InterfacesComponent implements OnInit {
  interfaces: ResponseInterfazDTO[] = [];
  modulos: Modulo[] = [];
  form: FormGroup;
  loading = false;
  saving = false;
  errorMessage: string | null = null;
  loggedUserName = '-';
  empresaId: number | null = null;
  selectedInterfazId: number | null = null;
  estadoActual = '-';
  usuarioCreacion = '-';
  fechaCreacion = '-';
  usuarioActualizacion = '-';
  fechaActualizacion = '-';
  readonly formatDateTime = formatBackendDateTime;

  constructor(
    private fb: FormBuilder,
    private interfazService: InterfazService,
    private moduloService: ModuloService
  ) {
    this.form = this.fb.group({
      moduloId: [null, Validators.required],
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      indice: [0, [Validators.required, Validators.min(0)]]
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

      this.empresaId = user?.empresa?.id ?? null;
    } catch {
      this.errorMessage = 'No se pudo leer la información del usuario logueado.';
      return;
    }

    if (!this.empresaId) {
      this.errorMessage = 'No se encontró la empresa asociada al usuario logueado.';
      return;
    }

    this.setAuditData();
    this.loadModulos();
  }

  get isEditMode(): boolean {
    return this.selectedInterfazId !== null;
  }

  submitInterfaz(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;

    if (this.isEditMode) {
      this.updateInterfaz();
      return;
    }

    const payload: CreateInterfazDTO = {
      moduloId: Number(this.form.get('moduloId')?.value),
      nombre: this.form.get('nombre')?.value?.trim(),
      descripcion: this.form.get('descripcion')?.value?.trim(),
      indice: Number(this.form.get('indice')?.value)
    };

    this.interfazService.createInterfaz(payload).subscribe({
      next: (response) => {
        this.saving = false;

        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operacion exitosa',
            text: 'La interfaz fue creada correctamente.',
            confirmButtonText: 'Aceptar'
          });

          this.resetForm();
          this.loadInterfaces();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible crear la interfaz.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        this.saving = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible crear la interfaz.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  editInterfaz(item: ResponseInterfazDTO): void {
    this.selectedInterfazId = item.id;
    this.setAuditData(item);

    this.form.patchValue({
      moduloId: item.modulo?.id ?? null,
      nombre: item.nombre,
      descripcion: item.descripcion,
      indice: item.indice
    });
  }

  async confirmDeleteInterfaz(item: ResponseInterfazDTO): Promise<void> {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Confirmar acción',
      text: `¿Está seguro de inactivar la interfaz ${item.nombre}?`,
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
      return;
    }

    this.inactiveInterfaz(item);
  }

  deleteCurrentInterfaz(): void {
    if (!this.selectedInterfazId) {
      return;
    }

    const item = this.interfaces.find((interfaz) => interfaz.id === this.selectedInterfazId);
    if (item) {
      void this.confirmDeleteInterfaz(item);
    }
  }

  resetForm(): void {
    this.form.reset({
      moduloId: null,
      nombre: '',
      descripcion: '',
      indice: 0
    });
    this.selectedInterfazId = null;
    this.setAuditData();
  }

  isActivo(estado: string): boolean {
    return estado?.toUpperCase() === 'ACTIVO' || estado?.toUpperCase() === 'A';
  }

  private updateInterfaz(): void {
    if (!this.selectedInterfazId) {
      this.saving = false;
      return;
    }

    const payload: UpdateInterfazDTO = {
      moduloId: Number(this.form.get('moduloId')?.value),
      nombre: this.form.get('nombre')?.value?.trim(),
      descripcion: this.form.get('descripcion')?.value?.trim(),
      indice: Number(this.form.get('indice')?.value)
    };

    this.interfazService.updateInterfaz(this.selectedInterfazId, payload).subscribe({
      next: (response) => {
        this.saving = false;

        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operacion exitosa',
            text: 'La interfaz fue actualizada correctamente.',
            confirmButtonText: 'Aceptar'
          });

          this.resetForm();
          this.loadInterfaces();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible actualizar la interfaz.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        this.saving = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible actualizar la interfaz.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  private inactiveInterfaz(item: ResponseInterfazDTO): void {
    const payload: UpdateInterfazDTO = {
      moduloId: item.modulo?.id ?? Number(this.form.get('moduloId')?.value),
      nombre: item.nombre,
      descripcion: item.descripcion,
      indice: item.indice,
      estado: 'I'
    };

    this.interfazService.updateInterfaz(item.id, payload).subscribe({
      next: (response) => {
        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operacion exitosa',
            text: 'La interfaz fue inactivada correctamente.',
            confirmButtonText: 'Aceptar'
          });

          this.resetForm();
          this.loadInterfaces();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible inactivar la interfaz.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible inactivar la interfaz.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  private loadInterfaces(): void {
    this.loading = true;
    this.errorMessage = null;

    const allowedModuleIds = new Set<number>(
      this.modulos
        .map((modulo) => modulo?.id)
        .filter((id): id is number => typeof id === 'number')
    );

    this.interfazService.getAllInterfaz().subscribe({
      next: (response) => {
        const interfaces = response?.contenido ?? [];
        this.interfaces = this.sortInterfacesByModuloIndice(
          interfaces.filter((item) => this.belongsToEmpresa(item, allowedModuleIds))
        );
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No fue posible cargar las interfaces registradas.';
      }
    });
  }

  private loadModulos(): void {
    if (!this.empresaId) {
      this.modulos = [];
      this.interfaces = [];
      this.errorMessage = 'No se encontró la empresa asociada al usuario logueado.';
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    this.moduloService.getModulosByEmpresa(this.empresaId).subscribe({
      next: (response) => {
        this.modulos = sortByIndice(response?.contenido ?? []);
        this.loadInterfaces();
      },
      error: () => {
        this.modulos = [];
        this.interfaces = [];
        this.loading = false;
        this.errorMessage = 'No fue posible cargar los módulos asociados a la empresa.';
      }
    });
  }

  private belongsToEmpresa(item: ResponseInterfazDTO, allowedModuleIds: Set<number>): boolean {
    if (!this.empresaId) {
      return false;
    }

    const moduloId = item?.modulo?.id;
    const moduloEmpresaId = item?.modulo?.empresa?.id ?? null;

    return moduloEmpresaId === this.empresaId
      || (typeof moduloId === 'number' && allowedModuleIds.has(moduloId));
  }

  private sortInterfacesByModuloIndice(items: ResponseInterfazDTO[]): ResponseInterfazDTO[] {
    return [...items].sort((left, right) => {
      const leftModuloIndice = this.normalizeOrderValue(left?.modulo?.indice);
      const rightModuloIndice = this.normalizeOrderValue(right?.modulo?.indice);

      if (leftModuloIndice !== rightModuloIndice) {
        return leftModuloIndice - rightModuloIndice;
      }

      const leftModuloNombre = (left?.modulo?.nombre ?? '').trim().toLocaleLowerCase();
      const rightModuloNombre = (right?.modulo?.nombre ?? '').trim().toLocaleLowerCase();

      if (leftModuloNombre !== rightModuloNombre) {
        return leftModuloNombre.localeCompare(rightModuloNombre, 'es');
      }

      const leftIndice = this.normalizeOrderValue(left?.indice);
      const rightIndice = this.normalizeOrderValue(right?.indice);

      if (leftIndice !== rightIndice) {
        return leftIndice - rightIndice;
      }

      return (left?.nombre ?? '').localeCompare(right?.nombre ?? '', 'es');
    });
  }

  private normalizeOrderValue(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
  }

  private setAuditData(item?: ResponseInterfazDTO): void {
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
