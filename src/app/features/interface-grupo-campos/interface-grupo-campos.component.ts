import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { ResponseInterfazDTO } from '../../models/operacion/interfaz.models';
import {
  CreateInterfaceGrupoCamposDTO,
  ResponseInterfaceGrupoCamposDTO,
  UpdateInterfaceGrupoCamposDTO
} from '../../models/operacion/interface-grupo-campos.models';
import { InterfazService } from '../../services/operacion/interfaz.service';
import { InterfaceGrupoCamposService } from '../../services/operacion/interface-grupo-campos.service';
import { RequiredFieldDirective } from '../../core/directives/required-field.directive';
import { getDefaultAuditData, resolveAuditDate, resolveAuditValue, resolveEstadoLabel, sortByIndice } from '../../core/utils/admin-crud.util';
import { formatBackendDateTime } from '../../core/utils/date-time.util';

@Component({
  selector: 'app-interface-grupo-campos',
  imports: [CommonModule, ReactiveFormsModule, RequiredFieldDirective],
  templateUrl: './interface-grupo-campos.component.html',
  styleUrl: './interface-grupo-campos.component.scss'
})
export class InterfaceGrupoCamposComponent implements OnInit {
  gruposCampos: ResponseInterfaceGrupoCamposDTO[] = [];
  interfaces: ResponseInterfazDTO[] = [];
  form: FormGroup;
  loading = false;
  saving = false;
  errorMessage: string | null = null;
  loggedUserName = '-';
  empresaId: number | null = null;
  selectedGrupoId: number | null = null;
  estadoActual = '-';
  usuarioCreacion = '-';
  fechaCreacion = '-';
  usuarioActualizacion = '-';
  fechaActualizacion = '-';
  readonly formatDateTime = formatBackendDateTime;

  constructor(
    private fb: FormBuilder,
    private interfazService: InterfazService,
    private interfaceGrupoCamposService: InterfaceGrupoCamposService
  ) {
    this.form = this.fb.group({
      interfazId: [null, Validators.required],
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
    this.loadInterfaces();
  }

  get isEditMode(): boolean {
    return this.selectedGrupoId !== null;
  }

  submitGrupoCampos(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;

    if (this.isEditMode) {
      this.updateGrupoCampos();
      return;
    }

    const payload: CreateInterfaceGrupoCamposDTO = {
      interfazId: Number(this.form.get('interfazId')?.value),
      nombre: this.form.get('nombre')?.value?.trim(),
      descripcion: this.form.get('descripcion')?.value?.trim(),
      indice: Number(this.form.get('indice')?.value)
    };

    this.interfaceGrupoCamposService.createInterfaceGrupoCampos(payload).subscribe({
      next: (response) => {
        this.saving = false;

        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operacion exitosa',
            text: 'El grupo de campos fue creado correctamente.',
            confirmButtonText: 'Aceptar'
          });

          this.resetForm();
          this.loadGruposCampos();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible crear el grupo de campos.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        this.saving = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible crear el grupo de campos.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  editGrupoCampos(item: ResponseInterfaceGrupoCamposDTO): void {
    this.selectedGrupoId = item.id;
    this.setAuditData(item);

    this.form.patchValue({
      interfazId: item.interfaz?.id ?? null,
      nombre: item.nombre,
      descripcion: item.descripcion,
      indice: item.indice
    });
  }

  async confirmDeleteGrupoCampos(item: ResponseInterfaceGrupoCamposDTO): Promise<void> {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Confirmar acción',
      text: `¿Está seguro de inactivar el grupo de campos ${item.nombre}?`,
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
      return;
    }

    this.inactiveGrupoCampos(item);
  }

  deleteCurrentGrupoCampos(): void {
    if (!this.selectedGrupoId) {
      return;
    }

    const item = this.gruposCampos.find((grupo) => grupo.id === this.selectedGrupoId);
    if (item) {
      void this.confirmDeleteGrupoCampos(item);
    }
  }

  resetForm(): void {
    this.form.reset({
      interfazId: null,
      nombre: '',
      descripcion: '',
      indice: 0
    });
    this.selectedGrupoId = null;
    this.setAuditData();
  }

  isActivo(estado: string): boolean {
    return estado?.toUpperCase() === 'ACTIVO' || estado?.toUpperCase() === 'A';
  }

  private updateGrupoCampos(): void {
    if (!this.selectedGrupoId) {
      this.saving = false;
      return;
    }

    const payload: UpdateInterfaceGrupoCamposDTO = {
      interfazId: Number(this.form.get('interfazId')?.value),
      nombre: this.form.get('nombre')?.value?.trim(),
      descripcion: this.form.get('descripcion')?.value?.trim(),
      indice: Number(this.form.get('indice')?.value)
    };

    this.interfaceGrupoCamposService.updateInterfaceGrupoCampos(this.selectedGrupoId, payload).subscribe({
      next: (response) => {
        this.saving = false;

        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operacion exitosa',
            text: 'El grupo de campos fue actualizado correctamente.',
            confirmButtonText: 'Aceptar'
          });

          this.resetForm();
          this.loadGruposCampos();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible actualizar el grupo de campos.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        this.saving = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible actualizar el grupo de campos.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  private inactiveGrupoCampos(item: ResponseInterfaceGrupoCamposDTO): void {
    const payload: UpdateInterfaceGrupoCamposDTO = {
      interfazId: item.interfaz?.id ?? Number(this.form.get('interfazId')?.value),
      nombre: item.nombre,
      descripcion: item.descripcion,
      indice: item.indice,
      estado: 'I'
    };

    this.interfaceGrupoCamposService.updateInterfaceGrupoCampos(item.id, payload).subscribe({
      next: (response) => {
        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operacion exitosa',
            text: 'El grupo de campos fue inactivado correctamente.',
            confirmButtonText: 'Aceptar'
          });

          this.resetForm();
          this.loadGruposCampos();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible inactivar el grupo de campos.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible inactivar el grupo de campos.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  private loadInterfaces(): void {
    if (!this.empresaId) {
      this.interfaces = [];
      this.gruposCampos = [];
      this.errorMessage = 'No se encontró la empresa asociada al usuario logueado.';
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    this.interfazService.getAllInterfaz().subscribe({
      next: (response) => {
        this.interfaces = sortByIndice(
          (response?.contenido ?? []).filter((item) => this.belongsInterfazToEmpresa(item))
        );
        this.loadGruposCampos();
      },
      error: () => {
        this.interfaces = [];
        this.gruposCampos = [];
        this.loading = false;
        this.errorMessage = 'No fue posible cargar las interfaces asociadas a la empresa.';
      }
    });
  }

  private loadGruposCampos(): void {
    const allowedInterfaceIds = new Set<number>(
      this.interfaces
        .map((item) => item?.id)
        .filter((id): id is number => typeof id === 'number')
    );

    this.interfaceGrupoCamposService.getAllInterfaceGrupoCampos().subscribe({
      next: (response) => {
        this.gruposCampos = sortByIndice(
          (response?.contenido ?? []).filter((item) => this.belongsGrupoToEmpresa(item, allowedInterfaceIds))
        );
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No fue posible cargar los grupos de campos registrados.';
      }
    });
  }

  private belongsInterfazToEmpresa(item: ResponseInterfazDTO): boolean {
    return item?.modulo?.empresa?.id === this.empresaId;
  }

  private belongsGrupoToEmpresa(
    item: ResponseInterfaceGrupoCamposDTO,
    allowedInterfaceIds: Set<number>
  ): boolean {
    const interfazId = item?.interfaz?.id;
    return typeof interfazId === 'number' && allowedInterfaceIds.has(interfazId);
  }

  private setAuditData(item?: ResponseInterfaceGrupoCamposDTO): void {
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

