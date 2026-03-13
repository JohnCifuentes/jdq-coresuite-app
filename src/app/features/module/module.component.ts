import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import {
  CreateModuloDTO,
  UpdateModuloDTO,
  ResponseModuloDTO
} from '../../models/operacion/modulo.models';
import { ModuloService } from '../../services/operacion/modulo.service';
import { LoginService, UserRole } from '../../services/seguridad/login.service';
import { formatBackendDateTime } from '../../core/utils/date-time.util';

@Component({
  selector: 'app-module',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './module.component.html',
  styleUrl: './module.component.scss'
})
export class ModuleComponent implements OnInit {
  modulos: ResponseModuloDTO[] = [];
  form: FormGroup;
  loading = false;
  saving = false;
  errorMessage: string | null = null;
  loggedUserName = '-';
  empresaId: number | null = null;
  selectedModuloId: number | null = null;
  usuarioActualizacion = '-';
  fechaActualizacion = '-';
  userRole: UserRole = 'OPERACION';
  isSuperAdmin = false;
  readonly formatDateTime = formatBackendDateTime;

  constructor(
    private fb: FormBuilder,
    private moduloService: ModuloService,
    private loginService: LoginService
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      indice: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.userRole = this.loginService.getRoleFromToken();
    this.isSuperAdmin = this.userRole === 'SUPER-ADMIN';

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

      if (!empresaId && !this.isSuperAdmin) {
        this.errorMessage = 'No se encontró la empresa del usuario logueado.';
        return;
      }

      this.empresaId = empresaId ?? null;
      this.refreshModulos();
    } catch {
      this.errorMessage = 'No se pudo leer la información del usuario logueado.';
    }
  }

  get isEditMode(): boolean {
    return this.selectedModuloId !== null;
  }

  submitModulo(): void {
    if (this.form.invalid || !this.empresaId) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;

    if (this.isEditMode) {
      this.updateModulo();
      return;
    }

    const payload: CreateModuloDTO = {
      empresaId: this.empresaId,
      nombre: this.form.get('nombre')?.value?.trim(),
      descripcion: this.form.get('descripcion')?.value?.trim(),
      indice: Number(this.form.get('indice')?.value)
    };

    this.moduloService.createModulo(payload).subscribe({
      next: (response) => {
        this.saving = false;

        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operación exitosa',
            text: 'El módulo fue creado correctamente.',
            confirmButtonText: 'Aceptar'
          });

          this.resetForm();
          this.refreshModulos();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible crear el módulo.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        this.saving = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible crear el módulo.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  editModulo(modulo: ResponseModuloDTO): void {
    this.selectedModuloId = modulo.id;
    this.usuarioActualizacion = '-';
    this.fechaActualizacion = '-';

    this.form.patchValue({
      nombre: modulo.nombre,
      descripcion: modulo.descripcion,
      indice: modulo.indice
    });
  }

  async confirmDeleteModulo(modulo: ResponseModuloDTO): Promise<void> {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Confirmar acción',
      text: `¿Está seguro de inactivar el módulo ${modulo.nombre}?`,
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
      return;
    }

    this.inactiveModulo(modulo.id);
  }

  resetForm(): void {
    this.form.reset({
      nombre: '',
      descripcion: '',
      indice: 0
    });

    this.usuarioActualizacion = '-';
    this.fechaActualizacion = '-';
    this.selectedModuloId = null;
  }

  isActivo(estado: string): boolean {
    return estado?.toUpperCase() === 'ACTIVO' || estado?.toUpperCase() === 'A';
  }

  private updateModulo(): void {
    if (!this.selectedModuloId || !this.empresaId) {
      this.saving = false;
      return;
    }

    const payload: UpdateModuloDTO = {
      empresaId: this.empresaId,
      nombre: this.form.get('nombre')?.value?.trim(),
      descripcion: this.form.get('descripcion')?.value?.trim(),
      indice: Number(this.form.get('indice')?.value),
      estado: 'A'
    };

    this.moduloService.updateModulo(this.selectedModuloId, payload).subscribe({
      next: (response) => {
        this.saving = false;

        if (!response.error) {
          this.usuarioActualizacion = this.loggedUserName;
          this.fechaActualizacion = this.getCurrentDateTime();

          Swal.fire({
            icon: 'success',
            title: 'Operación exitosa',
            text: 'El módulo fue actualizado correctamente.',
            confirmButtonText: 'Aceptar'
          });

          this.refreshModulos();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible actualizar el módulo.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        this.saving = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible actualizar el módulo.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  private inactiveModulo(moduloId: number): void {
    const payload: UpdateModuloDTO = {
      empresaId: this.empresaId!,
      nombre: '',
      descripcion: '',
      indice: 0,
      estado: 'I'
    };

    this.moduloService.updateModulo(moduloId, payload).subscribe({
      next: (response) => {
        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operación exitosa',
            text: 'El módulo fue inactivado correctamente.',
            confirmButtonText: 'Aceptar'
          });

          if (this.selectedModuloId === moduloId) {
            this.resetForm();
          }

          this.refreshModulos();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible inactivar el módulo.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible inactivar el módulo.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  private loadModulosByEmpresa(empresaId: number): void {
    this.loading = true;
    this.errorMessage = null;

    this.moduloService.getModulosByEmpresa(empresaId).subscribe({
      next: (response) => {
        this.modulos = (response?.contenido ?? []).map((modulo) => this.normalizeModulo(modulo));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No fue posible cargar los módulos registrados.';
      }
    });
  }

  private loadAllModulos(): void {
    this.loading = true;
    this.errorMessage = null;

    this.moduloService.getAllModulos().subscribe({
      next: (response) => {
        this.modulos = (response?.contenido ?? []).map((modulo) => this.normalizeModulo(modulo));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No fue posible cargar los módulos del sistema.';
      }
    });
  }

  private refreshModulos(): void {
    if (this.isSuperAdmin) {
      this.loadAllModulos();
      return;
    }

    if (!this.empresaId) {
      this.errorMessage = 'No se encontró la empresa del usuario logueado.';
      return;
    }

    this.loadModulosByEmpresa(this.empresaId);
  }

  getIndiceDisplay(modulo: ResponseModuloDTO): string {
    const indice = modulo?.indice;

    if (indice === null || indice === undefined) {
      return '-';
    }

    return String(indice);
  }

  private normalizeModulo(modulo: ResponseModuloDTO): ResponseModuloDTO {
    const rawModulo = modulo as unknown as Record<string, unknown>;
    const rawIndice = rawModulo['indice'] ?? rawModulo['index'] ?? rawModulo['orden'];
    const parsedIndice = Number(rawIndice);

    return {
      ...modulo,
      indice: Number.isFinite(parsedIndice) ? parsedIndice : 0
    };
  }

  private getCurrentDateTime(): string {
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date());
  }
}
