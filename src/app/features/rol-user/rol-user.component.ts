import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import {
  CreateRolUsuarioDTO,
  InactiveRolUsuarioDTO,
  ResponseRolUsuarioDTO,
  UpdateRolUsuarioDTO
} from '../../models/seguridad/rol-usuario.models';
import { RolUsuarioService } from '../../services/seguridad/rol-usuario.service';
import { UsuarioService } from '../../services/seguridad/usuario.service';
import { RolService } from '../../services/seguridad/rol.service';
import { ResponseUsuarioDTO } from '../../models/seguridad/usuario.models';
import { ResponseRolDTO } from '../../models/seguridad/rol.models';
import { formatBackendDateTime } from '../../core/utils/date-time.util';

@Component({
  selector: 'app-rol-user',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './rol-user.component.html',
  styleUrl: './rol-user.component.scss'
})
export class RolUserComponent implements OnInit {
  usuarios: ResponseUsuarioDTO[] = [];
  usuariosFiltrados: ResponseUsuarioDTO[] = [];
  rolesDisponibles: ResponseRolDTO[] = [];
  asignacionesActuales: ResponseRolUsuarioDTO[] = [];

  form: FormGroup;
  loading = false;
  saving = false;
  errorMessage: string | null = null;
  loggedUserName = '-';
  empresaId: number | null = null;
  selectedUsuarioId: number | null = null;
  selectedRolIds: Set<number> = new Set();
  usuarioActualizacion = '-';
  fechaActualizacion = '-';
  searchQuery = '';
  readonly formatDateTime = formatBackendDateTime;

  constructor(
    private fb: FormBuilder,
    private rolUsuarioService: RolUsuarioService,
    private usuarioService: UsuarioService,
    private rolService: RolService
  ) {
    this.form = this.fb.group({
      usuarioId: [null, Validators.required]
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
      this.loadDatos(empresaId);
    } catch {
      this.errorMessage = 'No se pudo leer la información del usuario logueado.';
    }
  }

  onSearchUsuario(query: string): void {
    this.searchQuery = query.toLowerCase();
    if (!query.trim()) {
      this.usuariosFiltrados = this.usuarios;
      return;
    }

    this.usuariosFiltrados = this.usuarios.filter(u =>
      `${u.nombre1} ${u.apellido1}`.toLowerCase().includes(this.searchQuery) ||
      u.correoElectronico.toLowerCase().includes(this.searchQuery) ||
      u.numeroIdentificacion.includes(this.searchQuery)
    );
  }

  selectUsuario(usuario: ResponseUsuarioDTO): void {
    this.selectedUsuarioId = usuario.id;
    this.form.patchValue({ usuarioId: usuario.id });
    this.selectedRolIds.clear();
    this.usuarioActualizacion = '-';
    this.fechaActualizacion = '-';
    this.usuariosFiltrados = [];
    this.searchQuery = '';

    // Load existing roles for this usuario
    const asignacionesUsuario = this.asignacionesActuales.filter(a => a.usuario.id === usuario.id);
    asignacionesUsuario.forEach(a => this.selectedRolIds.add(a.rol.id));
  }

  getRolesAsignados(): string {
    if (!this.usuarioSeleccionado) {
      return '-';
    }
    const asignacionesUsuario = this.asignacionesActuales.filter(a => a.usuario.id === this.usuarioSeleccionado!.id);
    return asignacionesUsuario.map(a => a.rol.nombre).join(', ') || '-';
  }

  get usuarioSeleccionado(): ResponseUsuarioDTO | undefined {
    return this.usuarios.find(u => u.id === this.selectedUsuarioId);
  }

  toggleRol(rolId: number): void {
    if (this.selectedRolIds.has(rolId)) {
      this.selectedRolIds.delete(rolId);
    } else {
      this.selectedRolIds.add(rolId);
    }
  }

  isRolChecked(rolId: number): boolean {
    return this.selectedRolIds.has(rolId);
  }

  guardarAsignacion(): void {
    if (!this.selectedUsuarioId || !this.empresaId) {
      if (!this.selectedUsuarioId) {
        Swal.fire({
          icon: 'warning',
          title: 'Seleccione un usuario',
          text: 'Debe seleccionar un usuario antes de asignar roles.',
          confirmButtonText: 'Aceptar'
        });
      }
      return;
    }

    const usuarioSelectado = this.usuarios.find(u => u.id === this.selectedUsuarioId);
    if (!usuarioSelectado) {
      return;
    }

    const asignacionesUsuario = this.asignacionesActuales.filter(
      (asignacion) => asignacion.usuario.id === this.selectedUsuarioId && this.isActivo(asignacion.estado)
    );
    const rolesAsignadosIds = new Set(asignacionesUsuario.map((asignacion) => asignacion.rol.id));
    const rolesAAgregar = Array.from(this.selectedRolIds).filter((rolId) => !rolesAsignadosIds.has(rolId));
    const asignacionesAInactivar = asignacionesUsuario.filter(
      (asignacion) => !this.selectedRolIds.has(asignacion.rol.id)
    );

    if (rolesAAgregar.length === 0 && asignacionesAInactivar.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin cambios',
        text: 'No hay cambios para guardar en las asignaciones de roles.',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    this.saving = true;

    const totalOperaciones = rolesAAgregar.length + asignacionesAInactivar.length;
    let completados = 0;
    const errores: string[] = [];

    const finalizarOperacion = () => {
      completados++;

      if (completados !== totalOperaciones) {
        return;
      }

      this.saving = false;
      this.usuarioActualizacion = this.loggedUserName;
      this.fechaActualizacion = this.getCurrentDateTime();

      if (errores.length === 0) {
        Swal.fire({
          icon: 'success',
          title: 'Operación exitosa',
          text: 'Los roles fueron actualizados correctamente.',
          confirmButtonText: 'Aceptar'
        });
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Actualización parcial',
          text: `Se completaron algunas operaciones. Errores: ${errores.join(', ')}`,
          confirmButtonText: 'Aceptar'
        });
      }

      this.resetForm();
      this.loadAsignaciones(this.empresaId!);
    };

    rolesAAgregar.forEach(rolId => {
      const payload: CreateRolUsuarioDTO = {
        empresaId: this.empresaId!,
        usuarioId: this.selectedUsuarioId!,
        rolId: rolId
      };

      this.rolUsuarioService.createRolUsuario(payload).subscribe({
        next: (response) => {
          if (response.error) {
            errores.push(`Rol ${rolId}`);
          }

          finalizarOperacion();
        },
        error: () => {
          errores.push(`Rol ${rolId}`);
          finalizarOperacion();
        }
      });
    });

    asignacionesAInactivar.forEach((asignacion) => {
      const payload: InactiveRolUsuarioDTO = { estado: 'I' };

      this.rolUsuarioService.inactiveRolUsuario(asignacion.id, payload).subscribe({
        next: (response) => {
          if (response.error) {
            errores.push(`Rol ${asignacion.rol.nombre}`);
          }

          finalizarOperacion();
        },
        error: () => {
          errores.push(`Rol ${asignacion.rol.nombre}`);
          finalizarOperacion();
        }
      });
    });
  }

  editarAsignacion(asignacion: ResponseRolUsuarioDTO): void {
    const usuario = this.usuarios.find(u => u.id === asignacion.usuario.id);
    if (!usuario) {
      return;
    }

    this.selectedUsuarioId = usuario.id;
    this.usuarioActualizacion = asignacion.usuarioActualizacion || '-';
    this.fechaActualizacion = asignacion.fechaActualizacion || '-';
    this.selectedRolIds.clear();

    // Load current roles for this user
    const asignacionesUsuario = this.asignacionesActuales.filter(a => a.usuario.id === usuario.id);
    asignacionesUsuario.forEach(a => this.selectedRolIds.add(a.rol.id));
  }

  async confirmarEliminarAsignacion(asignacion: ResponseRolUsuarioDTO): Promise<void> {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Confirmar acción',
      text: `¿Está seguro de eliminar la asignación del rol ${asignacion.rol.nombre} al usuario ${asignacion.usuario.nombre1}?`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
      return;
    }

    this.eliminarAsignacion(asignacion.id);
  }

  private eliminarAsignacion(asignacionId: number): void {
    const payload: InactiveRolUsuarioDTO = { estado: 'I' };

    this.rolUsuarioService.inactiveRolUsuario(asignacionId, payload).subscribe({
      next: (response) => {
        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operación exitosa',
            text: 'La asignación fue eliminada correctamente.',
            confirmButtonText: 'Aceptar'
          });

          this.loadAsignaciones(this.empresaId!);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible eliminar la asignación.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible eliminar la asignación.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  resetForm(): void {
    this.form.reset();
    this.selectedUsuarioId = null;
    this.selectedRolIds.clear();
    this.usuarioActualizacion = '-';
    this.fechaActualizacion = '-';
    this.searchQuery = '';
    this.usuariosFiltrados = [];
  }

  getNombreCompleto(usuario: ResponseUsuarioDTO): string {
    return [usuario.nombre1, usuario.apellido1]
      .filter((value: string | undefined) => !!value)
      .map((value: string) => value.trim())
      .join(' ');
  }

  getIniciales(usuario: ResponseUsuarioDTO): string {
    const fullName = this.getNombreCompleto(usuario);
    if (!fullName) {
      return '--';
    }

    const parts = fullName.split(' ').filter(Boolean);
    const first = parts[0]?.charAt(0) ?? '';
    const second = parts[1]?.charAt(0) ?? '';
    return `${first}${second}`.toUpperCase();
  }

  isActivo(estado: string): boolean {
    return estado?.toUpperCase() === 'ACTIVO' || estado?.toUpperCase() === 'A';
  }

  private loadDatos(empresaId: number): void {
    this.loading = true;
    this.errorMessage = null;

    // Load usuarios
    this.usuarioService.getUsuariosByEmpresa(empresaId).subscribe({
      next: (response) => {
        this.usuarios = response?.contenido ?? [];
      },
      error: () => {
        this.errorMessage = 'No fue posible cargar los usuarios registrados.';
      }
    });

    // Load roles
    this.rolService.getRolsByEmpresa(empresaId).subscribe({
      next: (response) => {
        this.rolesDisponibles = response?.contenido ?? [];
      },
      error: () => {
        this.errorMessage = 'No fue posible cargar los roles registrados.';
      }
    });

    // Load asignaciones
    this.loadAsignaciones(empresaId);
  }

  private loadAsignaciones(empresaId: number): void {
    this.rolUsuarioService.getRolUsuariosByEmpresa(empresaId).subscribe({
      next: (response: any) => {
        this.asignacionesActuales = response?.contenido ?? response ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No fue posible cargar las asignaciones.';
      }
    });
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
