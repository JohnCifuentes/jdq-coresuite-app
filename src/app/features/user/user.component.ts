import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
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
import { LoginService, UserRole } from '../../services/seguridad/login.service';
import { RequiredFieldDirective } from '../../core/directives/required-field.directive';
import {
  DocumentRule,
  getDocumentRule,
  documentFormatValidator,
  noRepeatedSequenceValidator,
  sanitiseDocumentInput,
} from '../../core/utils/document-validation.util';
import { formatBackendDateTime } from '../../core/utils/date-time.util';

@Component({
  selector: 'app-user',
  imports: [CommonModule, ReactiveFormsModule, RequiredFieldDirective],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss'
})
export class UserComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  usuarios: ResponseUsuarioDTO[] = [];
  tiposIdentificacion: TipoIdentificacionDTO[] = [];
  form: FormGroup;
  loading = false;
  saving = false;
  errorMessage: string | null = null;
  loggedUserName = '-';
  estadoActual = 'ACTIVO';
  usuarioCreacion = '-';
  fechaCreacion = '-';
  usuarioActualizacion = '-';
  fechaActualizacion = '-';
  empresaId: number | null = null;
  selectedUsuarioId: number | null = null;
  userRole: UserRole = 'OPERACION';
  isSuperAdmin = false;
  currentDocumentRule: DocumentRule | null = null;
  readonly formatDateTime = formatBackendDateTime;
  numIdPlaceholder = 'Ej: 123456789';
  numIdHint = '';

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private tipoIdentificacionService: TipoIdentificacionService,
    private loginService: LoginService
  ) {
    this.form = this.fb.group({
      tipoIdentificacionId: [null, Validators.required],
      numeroIdentificacion: ['', Validators.required],
      nombre1: ['', Validators.required],
      nombre2: [''],
      apellido1: ['', Validators.required],
      apellido2: [''],
      correoElectronico: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$')]],
      telefono: ['', [Validators.required, Validators.pattern('^\\+57\\s?\\d{3}\\s?\\d{3}\\s?\\d{4}$')]],
      estado: [{ value: 'ACTIVO', disabled: true }],
      usuarioCreacion: [{ value: '-', disabled: true }],
      fechaCreacion: [{ value: '-', disabled: true }],
      usuarioActualizacion: [{ value: '-', disabled: true }],
      fechaActualizacion: [{ value: '-', disabled: true }]
    });
  }

  ngOnInit(): void {
    this.loadTiposIdentificacion();

    this.form.get('tipoIdentificacionId')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => this.onTipoIdentificacionChange(val));

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

      this.resetAuditInfo();

      const empresaId = user?.empresa?.id;

      if (!empresaId && !this.isSuperAdmin) {
        this.errorMessage = 'No se encontró la empresa del usuario logueado.';
        return;
      }

      this.empresaId = empresaId ?? null;

      if (this.isSuperAdmin) {
        this.loadAllUsuarios();
      } else if (empresaId) {
        this.loadUsuariosByEmpresa(empresaId);
      }
    } catch {
      this.errorMessage = 'No se pudo leer la información del usuario logueado.';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isEditMode(): boolean {
    return this.selectedUsuarioId !== null;
  }

  private onTipoIdentificacionChange(tipoId: number | null): void {
    const numIdCtrl = this.form.get('numeroIdentificacion')!;
    numIdCtrl.reset('');
    numIdCtrl.markAsUntouched();

    if (!tipoId) {
      this.currentDocumentRule = null;
      this.numIdPlaceholder = 'Ej: 123456789';
      this.numIdHint = '';
      numIdCtrl.setValidators([Validators.required]);
    } else {
      const tipo = this.tiposIdentificacion.find((t) => t.id === Number(tipoId));
      const rule = tipo ? getDocumentRule(tipo.codigo) : null;
      this.currentDocumentRule = rule;
      this.numIdPlaceholder = rule?.placeholder ?? 'Ej: 123456789';
      this.numIdHint = rule?.hint ?? '';
      numIdCtrl.setValidators([
        Validators.required,
        ...(rule ? [documentFormatValidator(rule)] : []),
        noRepeatedSequenceValidator,
      ]);
    }

    numIdCtrl.updateValueAndValidity();
  }

  onNumeroIdentificacionInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitised = sanitiseDocumentInput(input.value, this.currentDocumentRule);
    input.value = sanitised;
    this.form.get('numeroIdentificacion')!.setValue(sanitised, { emitEvent: false });
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
          this.refreshUsuarios();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible crear el usuario.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: (err: any) => {
        this.saving = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.error?.contenido || err?.error?.message || 'No fue posible crear el usuario.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  editUsuario(usuario: ResponseUsuarioDTO): void {
    this.selectedUsuarioId = usuario.id;
    this.setAuditInfoFromUsuario(usuario);

    // Set document rule first (without resetting the number field)
    const tipo = this.tiposIdentificacion.find((t) => t.id === usuario.tipoIdentificacion?.id);
    const rule = tipo ? getDocumentRule(tipo.codigo) : null;
    this.currentDocumentRule = rule;
    this.numIdPlaceholder = rule?.placeholder ?? 'Ej: 123456789';
    this.numIdHint = rule?.hint ?? '';
    const numIdCtrl = this.form.get('numeroIdentificacion')!;
    numIdCtrl.setValidators([
      Validators.required,
      ...(rule ? [documentFormatValidator(rule)] : []),
      noRepeatedSequenceValidator,
    ]);

    this.form.patchValue({
      tipoIdentificacionId: usuario.tipoIdentificacion?.id,
      numeroIdentificacion: usuario.numeroIdentificacion,
      nombre1: usuario.nombre1,
      nombre2: usuario.nombre2,
      apellido1: usuario.apellido1,
      apellido2: usuario.apellido2,
      correoElectronico: usuario.correoElectronico,
      telefono: usuario.telefono,
      estado: this.getEstadoLabel(usuario.estado),
      usuarioCreacion: usuario.usuarioCreacion || '-',
      fechaCreacion: usuario.fechaCreacion || '-',
      usuarioActualizacion: usuario.usuarioActualizacion || '-',
      fechaActualizacion: usuario.fechaActualizacion || '-'
    }, { emitEvent: false });

    numIdCtrl.updateValueAndValidity();
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

  deleteCurrentUsuario(): void {
    if (!this.selectedUsuarioId) {
      return;
    }

    const usuario = this.usuarios.find((item) => item.id === this.selectedUsuarioId);
    if (usuario) {
      void this.confirmDeleteUsuario(usuario);
    }
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
      telefono: '',
      estado: 'ACTIVO',
      usuarioCreacion: this.loggedUserName,
      fechaCreacion: this.getCurrentDateTime(),
      usuarioActualizacion: '-',
      fechaActualizacion: '-'
    });

    this.currentDocumentRule = null;
    this.numIdPlaceholder = 'Ej: 123456789';
    this.numIdHint = '';
    this.selectedUsuarioId = null;
    this.resetAuditInfo();
  }

  isActivo(estado: string): boolean {
    return estado?.toUpperCase() === 'ACTIVO' || estado?.toUpperCase() === 'A';
  }

  isBloqueado(estado: string): boolean {
    return estado?.toUpperCase() === 'B' || estado?.toUpperCase() === 'BLOQUEADO';
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

          this.refreshUsuarios();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible actualizar el usuario.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: (err: any) => {
        this.saving = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.error?.contenido || err?.error?.message || 'No fue posible actualizar el usuario.',
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

          this.refreshUsuarios();
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

  private loadAllUsuarios(): void {
    this.loading = true;
    this.errorMessage = null;

    this.usuarioService.getAllUsuarios().subscribe({
      next: (response) => {
        this.usuarios = response?.contenido ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No fue posible cargar los usuarios del sistema.';
      }
    });
  }

  desbloquearUsuario(usuario: ResponseUsuarioDTO): void {
    this.usuarioService.desbloquearUsuario(usuario.id).subscribe({
      next: (response) => {
        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operación exitosa',
            text: 'El usuario fue desbloqueado correctamente.',
            confirmButtonText: 'Aceptar'
          });

          this.refreshUsuarios();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible desbloquear el usuario.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible desbloquear el usuario.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  private refreshUsuarios(): void {
    if (this.isSuperAdmin) {
      this.loadAllUsuarios();
      return;
    }

    if (this.empresaId) {
      this.loadUsuariosByEmpresa(this.empresaId);
    }
  }

  private resetAuditInfo(): void {
    this.estadoActual = 'ACTIVO';
    this.usuarioCreacion = this.loggedUserName;
    this.fechaCreacion = this.getCurrentDateTime();
    this.usuarioActualizacion = '-';
    this.fechaActualizacion = '-';

    this.form.patchValue({
      estado: 'Activo',
      usuarioCreacion: this.usuarioCreacion,
      fechaCreacion: this.fechaCreacion,
      usuarioActualizacion: this.usuarioActualizacion,
      fechaActualizacion: this.fechaActualizacion
    }, { emitEvent: false });
  }

  private setAuditInfoFromUsuario(usuario: ResponseUsuarioDTO): void {
    this.estadoActual = usuario.estado || 'ACTIVO';
    this.usuarioCreacion = usuario.usuarioCreacion || '-';
    this.fechaCreacion = usuario.fechaCreacion || '-';
    this.usuarioActualizacion = usuario.usuarioActualizacion || '-';
    this.fechaActualizacion = usuario.fechaActualizacion || '-';
  }

  getEstadoLabel(estado: string): string {
    if (this.isActivo(estado)) {
      return 'Activo';
    }

    if (this.isBloqueado(estado)) {
      return 'Bloqueado';
    }

    return 'Inactivo';
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
