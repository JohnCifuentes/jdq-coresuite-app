import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateRolDTO, InactiveRolDTO, ResponseRolDTO, UpdateRolDTO } from '../../models/seguridad/rol.models';
import { RolService } from '../../services/seguridad/rol.service';
import { LoginService, UserRole } from '../../services/seguridad/login.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-rol',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './rol.component.html',
  styleUrl: './rol.component.scss'
})
export class RolComponent implements OnInit {
  roles: ResponseRolDTO[] = [];
  form: FormGroup;
  loading = false;
  creating = false;
  errorMessage: string | null = null;
  loggedUserName = '-';
  empresaId: number | null = null;
  selectedRolId: number | null = null;
  userRole: UserRole = 'OPERACION';
  isSuperAdmin = false;

  constructor(
    private fb: FormBuilder,
    private rolService: RolService,
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
      this.refreshRoles();
    } catch {
      this.errorMessage = 'No se pudo leer la información del usuario logueado.';
    }
  }

  get isEditMode(): boolean {
    return this.selectedRolId !== null;
  }

  submitRol(): void {
    if (this.form.invalid || !this.empresaId) {
      this.form.markAllAsTouched();
      return;
    }

    this.creating = true;

    if (this.isEditMode) {
      this.updateRol();
      return;
    }

    const payload: CreateRolDTO = {
      empresaId: this.empresaId,
      nombre: this.form.get('nombre')?.value?.trim(),
      descripcion: this.form.get('descripcion')?.value?.trim()
    };

    this.rolService.createRol(payload).subscribe({
      next: (response) => {
        this.creating = false;

        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operación exitosa',
            text: 'El rol fue creado correctamente.',
            confirmButtonText: 'Aceptar'
          });

          this.resetForm();
          this.refreshRoles();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible crear el rol.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        this.creating = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible crear el rol.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  editRol(rol: ResponseRolDTO): void {
    this.selectedRolId = rol.id;
    this.form.patchValue({
      nombre: rol.nombre,
      descripcion: rol.descripcion
    });
  }

  async confirmDeleteRol(rol: ResponseRolDTO): Promise<void> {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Confirmar acción',
      text: `¿Está seguro de inactivar el rol ${rol.nombre}?`,
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
      return;
    }

    this.inactiveRol(rol.id);
  }

  resetForm(): void {
    this.form.reset();
    this.selectedRolId = null;
  }

  isActivo(estado: string): boolean {
    return estado?.toUpperCase() === 'ACTIVO';
  }

  private updateRol(): void {
    if (!this.selectedRolId || !this.empresaId) {
      this.creating = false;
      return;
    }

    const payload: UpdateRolDTO = {
      empresaId: this.empresaId,
      nombre: this.form.get('nombre')?.value?.trim(),
      descripcion: this.form.get('descripcion')?.value?.trim()
    };

    this.rolService.updateRol(this.selectedRolId, payload).subscribe({
      next: (response) => {
        this.creating = false;

        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operación exitosa',
            text: 'El rol fue actualizado correctamente.',
            confirmButtonText: 'Aceptar'
          });

          this.resetForm();
          this.refreshRoles();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible actualizar el rol.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        this.creating = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible actualizar el rol.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  private inactiveRol(rolId: number): void {
    const payload: InactiveRolDTO = { estado: 'I' };

    this.rolService.inactiveRol(rolId, payload).subscribe({
      next: (response) => {
        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operación exitosa',
            text: 'El rol fue inactivado correctamente.',
            confirmButtonText: 'Aceptar'
          });

          if (this.selectedRolId === rolId) {
            this.resetForm();
          }

          this.refreshRoles();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible inactivar el rol.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible inactivar el rol.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  private loadRolesByEmpresa(empresaId: number): void {
    this.loading = true;
    this.errorMessage = null;

    this.rolService.getRolsByEmpresa(empresaId).subscribe({
      next: (response) => {
        this.roles = response?.contenido ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No fue posible cargar los roles registrados.';
      }
    });
  }

  private loadAllRoles(): void {
    this.loading = true;
    this.errorMessage = null;

    this.rolService.getAllRoles().subscribe({
      next: (response) => {
        this.roles = response?.contenido ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No fue posible cargar los roles del sistema.';
      }
    });
  }

  private refreshRoles(): void {
    if (this.isSuperAdmin) {
      this.loadAllRoles();
      return;
    }

    if (!this.empresaId) {
      this.errorMessage = 'No se encontró la empresa del usuario logueado.';
      return;
    }

    this.loadRolesByEmpresa(this.empresaId);
  }

}
