import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import {
  CreateListaValoresDTO,
  ResponseListaValoresDTO,
  UpdateListaValoresDTO
} from '../../models/operacion/lista-valores.models';
import { ListaValoresService } from '../../services/operacion/lista-valores.service';
import { LoginService, UserRole } from '../../services/seguridad/login.service';
import { formatBackendDateTime } from '../../core/utils/date-time.util';

@Component({
  selector: 'app-lista-valores',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './lista-valores.component.html',
  styleUrl: './lista-valores.component.scss'
})
export class ListaValoresComponent implements OnInit {
  listaValores: ResponseListaValoresDTO[] = [];
  form: FormGroup;
  loading = false;
  saving = false;
  errorMessage: string | null = null;
  loggedUserName = '-';
  empresaId: number | null = null;
  selectedListaValoresId: number | null = null;
  userRole: UserRole = 'OPERACION';
  isSuperAdmin = false;
  readonly formatDateTime = formatBackendDateTime;

  constructor(
    private fb: FormBuilder,
    private listaValoresService: ListaValoresService,
    private loginService: LoginService
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required]
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
      this.refreshListaValores();
    } catch {
      this.errorMessage = 'No se pudo leer la información del usuario logueado.';
    }
  }

  get isEditMode(): boolean {
    return this.selectedListaValoresId !== null;
  }

  submitListaValores(): void {
    if (this.form.invalid || !this.empresaId) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;

    if (this.isEditMode) {
      this.updateListaValores();
      return;
    }

    const payload: CreateListaValoresDTO = {
      empresaId: this.empresaId,
      nombre: this.form.get('nombre')?.value?.trim(),
      descripcion: this.form.get('descripcion')?.value?.trim()
    };

    this.listaValoresService.createListaValores(payload).subscribe({
      next: (response) => {
        this.saving = false;

        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operación exitosa',
            text: 'La lista de valores fue creada correctamente.',
            confirmButtonText: 'Aceptar'
          });

          this.resetForm();
          this.refreshListaValores();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible crear la lista de valores.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        this.saving = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible crear la lista de valores.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  editListaValores(item: ResponseListaValoresDTO): void {
    this.selectedListaValoresId = item.id;

    this.form.patchValue({
      nombre: item.nombre,
      descripcion: item.descripcion
    });
  }

  async confirmDeleteListaValores(item: ResponseListaValoresDTO): Promise<void> {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Confirmar acción',
      text: `¿Está seguro de inactivar la lista de valores ${item.nombre}?`,
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
      return;
    }

    this.inactiveListaValores(item);
  }

  resetForm(): void {
    this.form.reset({
      nombre: '',
      descripcion: ''
    });
    this.selectedListaValoresId = null;
  }

  isActivo(estado: string): boolean {
    return estado?.toUpperCase() === 'ACTIVO' || estado?.toUpperCase() === 'A';
  }

  private updateListaValores(): void {
    if (!this.selectedListaValoresId || !this.empresaId) {
      this.saving = false;
      return;
    }

    const payload: UpdateListaValoresDTO = {
      empresaId: this.empresaId,
      nombre: this.form.get('nombre')?.value?.trim(),
      descripcion: this.form.get('descripcion')?.value?.trim(),
      estado: 'A'
    };

    this.listaValoresService.updateListaValores(this.selectedListaValoresId, payload).subscribe({
      next: (response) => {
        this.saving = false;

        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operación exitosa',
            text: 'La lista de valores fue actualizada correctamente.',
            confirmButtonText: 'Aceptar'
          });

          this.resetForm();
          this.refreshListaValores();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible actualizar la lista de valores.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        this.saving = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible actualizar la lista de valores.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  private inactiveListaValores(item: ResponseListaValoresDTO): void {
    if (!this.empresaId) {
      return;
    }

    const payload: UpdateListaValoresDTO = {
      empresaId: this.empresaId,
      nombre: item.nombre,
      descripcion: item.descripcion,
      estado: 'I'
    };

    this.listaValoresService.updateListaValores(item.id, payload).subscribe({
      next: (response) => {
        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operación exitosa',
            text: 'La lista de valores fue inactivada correctamente.',
            confirmButtonText: 'Aceptar'
          });

          if (this.selectedListaValoresId === item.id) {
            this.resetForm();
          }

          this.refreshListaValores();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible inactivar la lista de valores.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible inactivar la lista de valores.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  private loadListaValoresByEmpresa(empresaId: number): void {
    this.loading = true;
    this.errorMessage = null;

    this.listaValoresService.getListaValoresByEmpresa(empresaId).subscribe({
      next: (response) => {
        this.listaValores = response?.contenido ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No fue posible cargar las listas de valores registradas.';
      }
    });
  }

  private loadAllListaValores(): void {
    this.loading = true;
    this.errorMessage = null;

    this.listaValoresService.getAllListaValores().subscribe({
      next: (response) => {
        this.listaValores = response?.contenido ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No fue posible cargar las listas de valores del sistema.';
      }
    });
  }

  private refreshListaValores(): void {
    if (this.isSuperAdmin) {
      this.loadAllListaValores();
      return;
    }

    if (!this.empresaId) {
      this.errorMessage = 'No se encontró la empresa del usuario logueado.';
      return;
    }

    this.loadListaValoresByEmpresa(this.empresaId);
  }
}
