import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import {
  CreateUsuarioDTO,
  InactiveUsuarioDTO,
  ResponseUsuarioDTO,
  UpdateUsuarioDTO
} from '../../models/seguridad/usuario.models';
import { UsuarioService } from '../../services/seguridad/usuario.service';
import { TipoIdentificacionService } from '../../services/catalogo/tipo-identificacion.service';
import { TipoIdentificacionDTO } from '../../models/catalogo/tipo-identificacion.models';

@Component({
  selector: 'app-user',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss'
})
export class UserComponent implements OnInit {
  usuarios: ResponseUsuarioDTO[] = [];
  tiposIdentificacion: TipoIdentificacionDTO[] = [];
  form: FormGroup;
  loading = false;
  saving = false;
  errorMessage: string | null = null;
  loggedUserName = '-';
  usuarioActualizacion = '-';
  fechaActualizacion = '-';
  empresaId: number | null = null;
  selectedUsuarioId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private tipoIdentificacionService: TipoIdentificacionService
  ) {
    this.form = this.fb.group({
      tipoIdentificacionId: [null, Validators.required],
      numeroIdentificacion: ['', Validators.required],
      nombre1: ['', Validators.required],
      nombre2: [''],
      apellido1: ['', Validators.required],
      apellido2: [''],
      correoElectronico: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern('^(\\+57)?[0-9]{10}$')]]
    });
  }

  ngOnInit(): void {
    this.loadTiposIdentificacion();

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
      this.loadUsuariosByEmpresa(empresaId);
    } catch {
      this.errorMessage = 'No se pudo leer la información del usuario logueado.';
    }
  }

  get isEditMode(): boolean {
    return this.selectedUsuarioId !== null;
  }

  submitUsuario(): void {
    if (this.form.invalid || !this.empresaId) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;

    if (this.isEditMode) {
      this.updateUsuario();
      return;
    }

    const payload: CreateUsuarioDTO = {
      empresaId: this.empresaId,
      tipoIdentificacionId: Number(this.form.get('tipoIdentificacionId')?.value),
      numeroIdentificacion: this.form.get('numeroIdentificacion')?.value?.trim(),
      nombre1: this.form.get('nombre1')?.value?.trim(),
      nombre2: this.form.get('nombre2')?.value?.trim() || '',
      apellido1: this.form.get('apellido1')?.value?.trim(),
      apellido2: this.form.get('apellido2')?.value?.trim() || '',
      telefono: this.form.get('telefono')?.value?.trim(),
      correoElectronico: this.form.get('correoElectronico')?.value?.trim()
    };

    this.usuarioService.createUsuario(payload).subscribe({
      next: (response) => {
        this.saving = false;

        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operación exitosa',
            text: 'El usuario fue creado correctamente.',
            confirmButtonText: 'Aceptar'
          });

          this.resetForm();
          this.loadUsuariosByEmpresa(this.empresaId!);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible crear el usuario.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        this.saving = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible crear el usuario.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  editUsuario(usuario: ResponseUsuarioDTO): void {
    this.selectedUsuarioId = usuario.id;
    this.usuarioActualizacion = '-';
    this.fechaActualizacion = '-';

    this.form.patchValue({
      tipoIdentificacionId: usuario.tipoIdentificacion?.id,
      numeroIdentificacion: usuario.numeroIdentificacion,
      nombre1: usuario.nombre1,
      nombre2: usuario.nombre2,
      apellido1: usuario.apellido1,
      apellido2: usuario.apellido2,
      correoElectronico: usuario.correoElectronico,
      telefono: usuario.telefono
    });
  }

  async confirmDeleteUsuario(usuario: ResponseUsuarioDTO): Promise<void> {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Confirmar acción',
      text: `¿Está seguro de inactivar el usuario ${this.getNombreCompleto(usuario)}?`,
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
      return;
    }

    this.inactiveUsuario(usuario.id);
  }

  resetForm(): void {
    this.form.reset({
      tipoIdentificacionId: this.tiposIdentificacion[0]?.id ?? null,
      numeroIdentificacion: '',
      nombre1: '',
      nombre2: '',
      apellido1: '',
      apellido2: '',
      correoElectronico: '',
      telefono: ''
    });

    this.usuarioActualizacion = '-';
    this.fechaActualizacion = '-';
    this.selectedUsuarioId = null;
  }

  isActivo(estado: string): boolean {
    return estado?.toUpperCase() === 'ACTIVO' || estado?.toUpperCase() === 'A';
  }

  getNombreCompleto(usuario: ResponseUsuarioDTO): string {
    return [usuario.nombre1, usuario.nombre2, usuario.apellido1, usuario.apellido2]
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

  private updateUsuario(): void {
    if (!this.selectedUsuarioId || !this.empresaId) {
      this.saving = false;
      return;
    }

    const payload: UpdateUsuarioDTO = {
      empresaId: this.empresaId,
      tipoIdentificacionId: Number(this.form.get('tipoIdentificacionId')?.value),
      numeroIdentificacion: this.form.get('numeroIdentificacion')?.value?.trim(),
      nombre1: this.form.get('nombre1')?.value?.trim(),
      nombre2: this.form.get('nombre2')?.value?.trim() || '',
      apellido1: this.form.get('apellido1')?.value?.trim(),
      apellido2: this.form.get('apellido2')?.value?.trim() || '',
      telefono: this.form.get('telefono')?.value?.trim(),
      correoElectronico: this.form.get('correoElectronico')?.value?.trim()
    };

    this.usuarioService.updateUsuario(this.selectedUsuarioId, payload).subscribe({
      next: (response) => {
        this.saving = false;

        if (!response.error) {
          this.usuarioActualizacion = this.loggedUserName;
          this.fechaActualizacion = this.getCurrentDateTime();

          Swal.fire({
            icon: 'success',
            title: 'Operación exitosa',
            text: 'El usuario fue actualizado correctamente.',
            confirmButtonText: 'Aceptar'
          });

          this.loadUsuariosByEmpresa(this.empresaId!);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible actualizar el usuario.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        this.saving = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible actualizar el usuario.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  private inactiveUsuario(usuarioId: number): void {
    const payload: InactiveUsuarioDTO = { estado: 'I' };

    this.usuarioService.inactiveUsuario(usuarioId, payload).subscribe({
      next: (response) => {
        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operación exitosa',
            text: 'El usuario fue inactivado correctamente.',
            confirmButtonText: 'Aceptar'
          });

          if (this.selectedUsuarioId === usuarioId) {
            this.resetForm();
          }

          this.loadUsuariosByEmpresa(this.empresaId!);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible inactivar el usuario.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible inactivar el usuario.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  private loadUsuariosByEmpresa(empresaId: number): void {
    this.loading = true;
    this.errorMessage = null;

    this.usuarioService.getUsuariosByEmpresa(empresaId).subscribe({
      next: (response) => {
        this.usuarios = response?.contenido ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No fue posible cargar los usuarios registrados.';
      }
    });
  }

  private loadTiposIdentificacion(): void {
    this.tipoIdentificacionService.getAllTiposIdentificacion().subscribe({
      next: (response) => {
        this.tiposIdentificacion = response?.contenido ?? [];

        if (this.tiposIdentificacion.length > 0 && !this.form.get('tipoIdentificacionId')?.value) {
          this.form.patchValue({
            tipoIdentificacionId: this.tiposIdentificacion[0].id
          });
        }
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
