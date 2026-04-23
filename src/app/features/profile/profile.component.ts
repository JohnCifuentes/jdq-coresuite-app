import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, forkJoin, map, of, Subject, switchMap, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { PaymentModalComponent } from './payment-modal.component';
import { PaymentStatusComponent } from './payment-status.component';
import { PlanSelectorComponent } from './plan-selector.component';
import { PaymentFlowResult, PaymentStatus } from '../../models/sistema/payment.models';
import { PaymentService } from '../../services/sistema/payment.service';
import { RequiredFieldDirective } from '../../core/directives/required-field.directive';
import {
  DocumentRule,
  documentFormatValidator,
  getDocumentRule,
  noRepeatedSequenceValidator,
  sanitiseDocumentInput
} from '../../core/utils/document-validation.util';
import { DepartamentoDTO } from '../../models/catalogo/departamento.models';
import { MunicipioDTO } from '../../models/catalogo/municipio.models';
import { PaisDTO } from '../../models/catalogo/pais.models';
import { TipoIdentificacionDTO } from '../../models/catalogo/tipo-identificacion.models';
import { InactiveUsuarioDTO, ResponseUsuarioDTO, UpdateUsuarioDTO } from '../../models/seguridad/usuario.models';
import { InactiveEmpresaDTO, ResponseEmpresaDTO, UpdateEmpresaDTO } from '../../models/sistema/empresa.models';
import { ResponseLicenciaDTO, UpdateLicenciaDTO } from '../../models/sistema/licencia.models';
import { ResponsePlanDTO } from '../../models/sistema/plan.models';
import { DepartamentoService } from '../../services/catalogo/departamento.service';
import { MunicipioService } from '../../services/catalogo/municipio.service';
import { PaisService } from '../../services/catalogo/pais.service';
import { TipoIdentificacionService } from '../../services/catalogo/tipo-identificacion.service';
import { LoginService } from '../../services/seguridad/login.service';
import { UsuarioService } from '../../services/seguridad/usuario.service';
import { EmpresaService } from '../../services/sistema/empresa.service';
import { LicenciaService } from '../../services/sistema/licencia.service';
import { PlanService } from '../../services/sistema/plan.service';

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RequiredFieldDirective,
    PlanSelectorComponent,
    PaymentModalComponent,
    PaymentStatusComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  form: FormGroup;
  loading = false;
  savingUser = false;
  savingEmpresa = false;
  savingLicencia = false;
  deactivating = false;
  errorMessage: string | null = null;

  tiposIdentificacion: TipoIdentificacionDTO[] = [];
  paises: PaisDTO[] = [];
  departamentos: DepartamentoDTO[] = [];
  municipios: MunicipioDTO[] = [];
  planes: ResponsePlanDTO[] = [];

  usuarioId: number | null = null;
  empresaId: number | null = null;
  licenciaId: number | null = null;
  licenciaFechaCompra = '';
  licenciaActual: ResponseLicenciaDTO | null = null;
  currentEmpresa: ResponseEmpresaDTO | null = null;
  loggedUserName = 'Usuario';
  selectedPlanForPayment: ResponsePlanDTO | null = null;
  isPaymentModalOpen = false;
  processingPlanChange = false;
  resumePaymentReference: string | null = null;
  lastPaymentResult: PaymentFlowResult | null = null;
  readonly paymentStatusEnum = PaymentStatus;
  private hasCheckedPendingPayment = false;

  usuarioDocumentRule: DocumentRule | null = null;
  empresaDocumentRule: DocumentRule | null = null;
  usuarioNumIdPlaceholder = 'Ej: 123456789';
  usuarioNumIdHint = '';
  empresaNumIdPlaceholder = 'Ej: 123456789';
  empresaNumIdHint = '';

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private empresaService: EmpresaService,
    private licenciaService: LicenciaService,
    private planService: PlanService,
    private tipoIdentificacionService: TipoIdentificacionService,
    private paisService: PaisService,
    private departamentoService: DepartamentoService,
    private municipioService: MunicipioService,
    private loginService: LoginService,
    private paymentService: PaymentService,
    private router: Router
  ) {
    this.form = this.fb.group({
      usuario: this.fb.group({
        tipoIdentificacionId: [null, Validators.required],
        numeroIdentificacion: ['', Validators.required],
        nombre1: ['', Validators.required],
        nombre2: [''],
        apellido1: ['', Validators.required],
        apellido2: [''],
        telefono: ['', [Validators.required, Validators.pattern('^\\+57\\s?\\d{3}\\s?\\d{3}\\s?\\d{4}$')]],
        correoElectronico: [{ value: '', disabled: true }, [Validators.required, Validators.pattern('^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$')]]
      }),
      empresa: this.fb.group({
        tipoIdentificacionId: [null, Validators.required],
        numeroIdentificacion: ['', Validators.required],
        razonSocial: ['', Validators.required],
        direccion: ['', Validators.required],
        telefono: ['', [Validators.required, Validators.pattern('^\\+57\\s?\\d{3}\\s?\\d{3}\\s?\\d{4}$')]],
        correoElectronico: [{ value: '', disabled: true }, [Validators.required, Validators.pattern('^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$')]],
        paisId: [null, Validators.required],
        departamentoId: [{ value: null, disabled: true }, Validators.required],
        municipioId: [{ value: null, disabled: true }, Validators.required]
      }),
      licencia: this.fb.group({
        planId: [null, Validators.required],
        fechaExpiracion: [{ value: '', disabled: true }],
        estado: [{ value: '-', disabled: true }]
      })
    });
  }

  get usuarioGroup(): FormGroup {
    return this.form.get('usuario') as FormGroup;
  }

  get empresaGroup(): FormGroup {
    return this.form.get('empresa') as FormGroup;
  }

  get licenciaGroup(): FormGroup {
    return this.form.get('licencia') as FormGroup;
  }

  ngOnInit(): void {
    this.setupWatchers();
    this.loadProfileData();
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  ngOnDestroy(): void {
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.destroy$.next();
    this.destroy$.complete();
  }

  onUsuarioNumeroIdentificacionInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitised = sanitiseDocumentInput(input.value, this.usuarioDocumentRule);
    input.value = sanitised;
    this.usuarioGroup.get('numeroIdentificacion')?.setValue(sanitised, { emitEvent: false });
  }

  onEmpresaNumeroIdentificacionInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitised = sanitiseDocumentInput(input.value, this.empresaDocumentRule);
    input.value = sanitised;
    this.empresaGroup.get('numeroIdentificacion')?.setValue(sanitised, { emitEvent: false });
  }

  reloadProfile(): void {
    this.loadProfileData();
  }

  onPlanSelected(planId: number): void {
    this.licenciaGroup.get('planId')?.setValue(planId);
    this.lastPaymentResult = null;
  }

  clearPaymentFeedback(): void {
    this.lastPaymentResult = null;
  }

  retryPaymentFlow(): void {
    if (this.lastPaymentResult?.status === PaymentStatus.Pending && this.lastPaymentResult.reference && this.selectedPlanForPayment) {
      this.resumePaymentReference = this.lastPaymentResult.reference;
      this.processingPlanChange = true;
      this.isPaymentModalOpen = true;
      return;
    }

    this.saveLicencia();
  }

  handlePaymentModalClose(result: PaymentFlowResult | null): void {
    this.isPaymentModalOpen = false;
    this.processingPlanChange = false;
    this.resumePaymentReference = null;

    if (!result || result.status !== PaymentStatus.Approved) {
      // Clear any leftover session so a page refresh does not re-open the modal.
      this.paymentService.clearPendingPaymentSession();
    }

    if (!result) {
      return;
    }

    this.lastPaymentResult = result;

    if (result.status === PaymentStatus.Approved) {
      this.loadProfileData();
    }
  }

  saveUsuario(): void {
    if (!this.usuarioId || !this.empresaId || this.savingUser || this.usuarioGroup.invalid) {
      this.usuarioGroup.markAllAsTouched();
      return;
    }

    const raw = this.usuarioGroup.getRawValue();
    const usuarioPayload: UpdateUsuarioDTO = {
      empresaId: this.empresaId,
      tipoIdentificacionId: Number(raw.tipoIdentificacionId),
      numeroIdentificacion: raw.numeroIdentificacion?.trim(),
      nombre1: raw.nombre1?.trim(),
      nombre2: raw.nombre2?.trim() || '',
      apellido1: raw.apellido1?.trim(),
      apellido2: raw.apellido2?.trim() || '',
      telefono: raw.telefono?.trim(),
      correoElectronico: raw.correoElectronico?.trim()
    };

    this.savingUser = true;
    this.usuarioService.updateUsuario(this.usuarioId, usuarioPayload)
      .pipe(
        finalize(() => {
          this.savingUser = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          if (response.error) {
            this.showError('No fue posible actualizar los datos del usuario.');
            return;
          }

          this.syncStoredUser(response.contenido, null);
          this.loadProfileData();

          Swal.fire({
            icon: 'success',
            title: 'Usuario actualizado',
            text: 'Los datos del usuario fueron actualizados correctamente.',
            confirmButtonText: 'Aceptar'
          });
        },
        error: (err: any) => {
          this.showError(err?.error?.contenido || err?.error?.message || 'No fue posible actualizar los datos del usuario.');
        }
      });
  }

  saveEmpresa(): void {
    if (!this.empresaId || this.savingEmpresa || this.empresaGroup.invalid) {
      this.empresaGroup.markAllAsTouched();
      return;
    }

    const raw = this.empresaGroup.getRawValue();
    const empresaPayload: UpdateEmpresaDTO = {
      tipoIdentificacionId: Number(raw.tipoIdentificacionId),
      paisId: Number(raw.paisId),
      departamentoId: Number(raw.departamentoId),
      municipioId: Number(raw.municipioId),
      numeroIdentificacion: raw.numeroIdentificacion?.trim(),
      razonSocial: raw.razonSocial?.trim(),
      direccion: raw.direccion?.trim(),
      correoElectronico: raw.correoElectronico?.trim(),
      telefono: raw.telefono?.trim()
    };

    this.savingEmpresa = true;
    this.empresaService.updateEmpresa(this.empresaId, empresaPayload)
      .pipe(
        finalize(() => {
          this.savingEmpresa = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          if (response.error) {
            this.showError('No fue posible actualizar los datos de la empresa.');
            return;
          }

          this.currentEmpresa = response.contenido;
          this.syncStoredUser(null, response.contenido);
          this.loadProfileData();

          Swal.fire({
            icon: 'success',
            title: 'Empresa actualizada',
            text: 'Los datos de la empresa fueron actualizados correctamente.',
            confirmButtonText: 'Aceptar'
          });
        },
        error: (err: any) => {
          this.showError(err?.error?.contenido || err?.error?.message || 'No fue posible actualizar los datos de la empresa.');
        }
      });
  }

  saveLicencia(): void {
    if (!this.empresaId || !this.licenciaId || !this.licenciaActual || this.licenciaGroup.invalid) {
      this.licenciaGroup.markAllAsTouched();
      return;
    }

    const selectedPlanId = Number(this.licenciaGroup.getRawValue().planId);

    if (!selectedPlanId) {
      return;
    }

    if (this.licenciaActual.plan?.id === selectedPlanId) {
      Swal.fire({
        icon: 'info',
        title: 'Sin cambios',
        text: 'Debe seleccionar un plan diferente al actual para continuar con el pago.',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    const selectedPlan = this.planes.find((plan) => plan.id === selectedPlanId) ?? null;

    if (!selectedPlan) {
      this.showError('No fue posible identificar el plan seleccionado.');
      return;
    }

    this.selectedPlanForPayment = selectedPlan;
    this.resumePaymentReference = null;
    this.lastPaymentResult = null;
    this.processingPlanChange = true;
    this.isPaymentModalOpen = true;
  }

  confirmDeactivateCompany(): void {
    if (!this.empresaId || this.deactivating) {
      return;
    }

    Swal.fire({
      icon: 'warning',
      title: '¿Inactivar cuenta? ',
      text: 'Se inactivará la empresa y todos los usuarios asociados.',
      showCancelButton: true,
      confirmButtonText: 'Sí, inactivar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (!result.isConfirmed || !this.empresaId) {
        return;
      }

      const empresaPayload: InactiveEmpresaDTO = { estado: 'I' };
      const usuarioPayload: InactiveUsuarioDTO = { estado: 'I' };

      this.deactivating = true;

      this.usuarioService.getUsuariosByEmpresa(this.empresaId)
        .pipe(
          switchMap((usuariosResponse) => {
            if (usuariosResponse.error) {
              throw new Error('No fue posible consultar los usuarios de la empresa.');
            }

            const usuarios = usuariosResponse.contenido ?? [];
            const inactiveRequests = usuarios.map((usuario) =>
              this.usuarioService.inactiveUsuario(usuario.id, usuarioPayload)
            );

            return forkJoin({
              empresa: this.empresaService.inactiveEmpresa(this.empresaId!, empresaPayload),
              usuarios: inactiveRequests.length > 0 ? forkJoin(inactiveRequests) : of([])
            });
          }),
          finalize(() => {
            this.deactivating = false;
          }),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: ({ empresa, usuarios }) => {
            const failedUsers = Array.isArray(usuarios) && usuarios.some((response) => response?.error);

            if (empresa.error || failedUsers) {
              this.showError('No fue posible inactivar completamente la cuenta de la empresa.');
              return;
            }

            Swal.fire({
              icon: 'success',
              title: 'Cuenta inactivada',
              text: 'La empresa y sus usuarios fueron inactivados correctamente.',
              confirmButtonText: 'Aceptar'
            }).then(() => {
              this.loginService.clearToken();
              localStorage.removeItem('auth_user');
              this.router.navigate(['/login']);
            });
          },
          error: (err: any) => {
            this.showError(err?.message || err?.error?.contenido || 'No fue posible inactivar la cuenta.');
          }
        });
    });
  }

  getEstadoBadgeClass(estado: unknown): string {
    return this.isActivo(estado)
      ? 'bg-success-subtle text-success'
      : 'bg-secondary-subtle text-secondary';
  }

  private setupWatchers(): void {
    this.usuarioGroup.get('tipoIdentificacionId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((tipoId) => this.applyDocumentRule('usuario', tipoId, true));

    this.empresaGroup.get('tipoIdentificacionId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((tipoId) => this.applyDocumentRule('empresa', tipoId, true));

    this.empresaGroup.get('paisId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((paisId) => this.onPaisChange(Number(paisId)));

    this.empresaGroup.get('departamentoId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((departamentoId) => this.onDepartamentoChange(Number(departamentoId)));
  }

  private loadProfileData(): void {
    const authContext = this.getAuthContext();
    this.usuarioId = authContext.usuarioId;
    this.empresaId = authContext.empresaId;
    this.loggedUserName = authContext.displayName;

    if (!this.usuarioId || !this.empresaId) {
      this.errorMessage = 'No se pudo identificar el usuario autenticado.';
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    forkJoin({
      tipos: this.tipoIdentificacionService.getAllTiposIdentificacion(),
      paises: this.paisService.getAllPaises(),
      planes: this.planService.getAllPlanes(),
      usuario: this.usuarioService.getUsuarioById(this.usuarioId),
      empresa: this.empresaService.getEmpresaById(this.empresaId),
      licencias: this.licenciaService.getLicenciasByEmpresa(this.empresaId)
    })
      .pipe(
        switchMap((result) => {
          if (result.tipos.error || result.paises.error || result.planes.error || result.usuario.error || result.empresa.error || result.licencias.error) {
            throw new Error('No se pudo cargar la información del perfil.');
          }

          this.tiposIdentificacion = result.tipos.contenido ?? [];
          this.paises = result.paises.contenido ?? [];
          this.planes = (result.planes.contenido ?? []).filter((plan) => this.isActivo(plan.estado));

          const usuario = result.usuario.contenido;
          const empresa = result.empresa.contenido;
          const licencia = (result.licencias.contenido ?? []).find((item) => item.activo || this.isActivo(item.estado)) ?? null;
          const paisId = empresa.pais?.id ?? null;
          const departamentoId = empresa.departamento?.id ?? null;

          if (!paisId) {
            return of({ usuario, empresa, licencia, departamentos: [] as DepartamentoDTO[], municipios: [] as MunicipioDTO[] });
          }

          return forkJoin({
            departamentos: this.departamentoService.getAllDepartamentosByPais(paisId),
            municipios: departamentoId
              ? this.municipioService.getAllMunicipiosByDepartamento(departamentoId)
              : of({ error: false, contenido: [] as MunicipioDTO[] })
          }).pipe(
            map(({ departamentos, municipios }) => {
              if (departamentos.error || municipios.error) {
                throw new Error('No se pudieron cargar las ubicaciones de la empresa.');
              }

              return {
                usuario,
                empresa,
                licencia,
                departamentos: departamentos.contenido ?? [],
                municipios: municipios.contenido ?? []
              };
            })
          );
        }),
        finalize(() => {
          this.loading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: ({ usuario, empresa, licencia, departamentos, municipios }) => {
          this.departamentos = departamentos;
          this.municipios = municipios;
          this.licenciaActual = licencia;
          this.licenciaId = licencia?.id ?? null;
          this.licenciaFechaCompra = licencia?.fechaCompra ?? '';
          this.currentEmpresa = empresa;

          if (this.departamentos.length > 0) {
            this.empresaGroup.get('departamentoId')?.enable({ emitEvent: false });
          }

          if (this.municipios.length > 0) {
            this.empresaGroup.get('municipioId')?.enable({ emitEvent: false });
          }

          this.form.patchValue({
            usuario: {
              tipoIdentificacionId: usuario.tipoIdentificacion?.id ?? null,
              numeroIdentificacion: usuario.numeroIdentificacion ?? '',
              nombre1: usuario.nombre1 ?? '',
              nombre2: usuario.nombre2 ?? '',
              apellido1: usuario.apellido1 ?? '',
              apellido2: usuario.apellido2 ?? '',
              telefono: usuario.telefono ?? '',
              correoElectronico: usuario.correoElectronico ?? ''
            },
            empresa: {
              tipoIdentificacionId: empresa.tipoIdentificacion?.id ?? null,
              numeroIdentificacion: empresa.numeroIdentificacion ?? '',
              razonSocial: empresa.razonSocial ?? '',
              direccion: empresa.direccion ?? '',
              telefono: empresa.telefono ?? '',
              correoElectronico: empresa.correoElectronico ?? '',
              paisId: empresa.pais?.id ?? null,
              departamentoId: empresa.departamento?.id ?? null,
              municipioId: empresa.municipio?.id ?? null
            },
            licencia: {
              planId: licencia?.plan?.id ?? null,
              fechaExpiracion: this.formatDateForInput(licencia?.fechaExpiracion ?? ''),
              estado: licencia ? (licencia.activo || this.isActivo(licencia.estado) ? 'Activa' : 'Inactiva') : 'Sin licencia activa'
            }
          }, { emitEvent: false });

          this.applyDocumentRule('usuario', usuario.tipoIdentificacion?.id ?? null, false);
          this.applyDocumentRule('empresa', empresa.tipoIdentificacion?.id ?? null, false);
          this.tryRestorePendingPayment();
        },
        error: () => {
          this.errorMessage = 'Ocurrió un error al cargar la información del perfil.';
        }
      });
  }

  private onPaisChange(paisId: number): void {
    if (!paisId) {
      this.departamentos = [];
      this.municipios = [];
      this.empresaGroup.patchValue({ departamentoId: null, municipioId: null }, { emitEvent: false });
      this.empresaGroup.get('departamentoId')?.disable({ emitEvent: false });
      this.empresaGroup.get('municipioId')?.disable({ emitEvent: false });
      return;
    }

    this.departamentoService.getAllDepartamentosByPais(paisId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.error) {
            return;
          }

          this.departamentos = response.contenido ?? [];
          this.municipios = [];
          this.empresaGroup.patchValue({ departamentoId: null, municipioId: null }, { emitEvent: false });

          if (this.departamentos.length > 0) {
            this.empresaGroup.get('departamentoId')?.enable({ emitEvent: false });
          } else {
            this.empresaGroup.get('departamentoId')?.disable({ emitEvent: false });
          }

          this.empresaGroup.get('municipioId')?.disable({ emitEvent: false });
        }
      });
  }

  private onDepartamentoChange(departamentoId: number): void {
    if (!departamentoId) {
      this.municipios = [];
      this.empresaGroup.patchValue({ municipioId: null }, { emitEvent: false });
      this.empresaGroup.get('municipioId')?.disable({ emitEvent: false });
      return;
    }

    this.municipioService.getAllMunicipiosByDepartamento(departamentoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.error) {
            return;
          }

          this.municipios = response.contenido ?? [];
          this.empresaGroup.patchValue({ municipioId: null }, { emitEvent: false });

          if (this.municipios.length > 0) {
            this.empresaGroup.get('municipioId')?.enable({ emitEvent: false });
          } else {
            this.empresaGroup.get('municipioId')?.disable({ emitEvent: false });
          }
        }
      });
  }

  private applyDocumentRule(scope: 'usuario' | 'empresa', tipoId: number | null, shouldResetValue: boolean): void {
    const group = scope === 'usuario' ? this.usuarioGroup : this.empresaGroup;
    const control = group.get('numeroIdentificacion');

    if (!control) {
      return;
    }

    if (shouldResetValue) {
      control.reset('');
      control.markAsUntouched();
    }

    if (!tipoId) {
      control.setValidators([Validators.required]);
      if (scope === 'usuario') {
        this.usuarioDocumentRule = null;
        this.usuarioNumIdPlaceholder = 'Ej: 123456789';
        this.usuarioNumIdHint = '';
      } else {
        this.empresaDocumentRule = null;
        this.empresaNumIdPlaceholder = 'Ej: 123456789';
        this.empresaNumIdHint = '';
      }
      control.updateValueAndValidity();
      return;
    }

    const tipo = this.tiposIdentificacion.find((item) => item.id === Number(tipoId));
    const rule = tipo ? getDocumentRule(tipo.codigo) : null;

    control.setValidators([
      Validators.required,
      ...(rule ? [documentFormatValidator(rule)] : []),
      noRepeatedSequenceValidator
    ]);

    if (scope === 'usuario') {
      this.usuarioDocumentRule = rule;
      this.usuarioNumIdPlaceholder = rule?.placeholder ?? 'Ej: 123456789';
      this.usuarioNumIdHint = rule?.hint ?? '';
    } else {
      this.empresaDocumentRule = rule;
      this.empresaNumIdPlaceholder = rule?.placeholder ?? 'Ej: 123456789';
      this.empresaNumIdHint = rule?.hint ?? '';
    }

    control.updateValueAndValidity();
  }

  private readonly onVisibilityChange = (): void => {
    if (document.visibilityState !== 'visible' || this.isPaymentModalOpen || this.loading) {
      return;
    }
    const ctx = this.paymentService.getLocalReference();
    if (ctx) {
      this.openResumeModal(ctx.reference, ctx.planId);
    }
  };

  private tryRestorePendingPayment(): void {
    if (this.hasCheckedPendingPayment) {
      return;
    }

    this.hasCheckedPendingPayment = true;

    const ctx = this.paymentService.getLocalReference();
    if (!ctx) {
      this.paymentService.clearPendingPaymentSession();
      return;
    }

    this.openResumeModal(ctx.reference, ctx.planId);
  }

  private openResumeModal(reference: string, planId: number): void {
    if (this.isPaymentModalOpen) {
      return;
    }

    // Payment already applied – clean up and do nothing
    if (this.licenciaActual?.plan?.id === planId) {
      this.paymentService.clearLocalReference();
      this.paymentService.clearPendingPaymentSession();
      return;
    }

    const plan = this.planes.find((p) => p.id === planId) ?? null;
    if (!plan) {
      return;
    }

    this.selectedPlanForPayment = plan;
    this.resumePaymentReference = reference;
    this.processingPlanChange = true;
    this.isPaymentModalOpen = true;
  }

  private getAuthContext(): { usuarioId: number | null; empresaId: number | null; displayName: string } {
    const token = localStorage.getItem('auth_token');
    const claims = token ? this.parseTokenClaims(token) : null;
    const storedUser = this.getStoredUser();

    const usuarioId = this.normalizeEntityId(
      claims?.['usuarioId'] ?? claims?.['userId'] ?? claims?.['id'] ?? claims?.['sub'] ?? storedUser?.id
    );

    const empresaId = this.normalizeEntityId(
      claims?.['empresaId'] ?? this.readNestedId(claims?.['empresa']) ?? storedUser?.empresa?.id
    );

    const displayName = [storedUser?.nombre1, storedUser?.apellido1]
      .filter((value): value is string => !!value)
      .map((value) => value.trim())
      .join(' ');

    return {
      usuarioId,
      empresaId,
      displayName: displayName || storedUser?.correoElectronico || 'Usuario'
    };
  }

  private parseTokenClaims(token: string): Record<string, unknown> | null {
    try {
      if (!token.includes('.')) {
        return JSON.parse(token) as Record<string, unknown>;
      }

      const payload = token.split('.')[1];
      const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
      const paddingLength = (4 - (normalizedPayload.length % 4)) % 4;
      const paddedPayload = normalizedPayload + '='.repeat(paddingLength);
      const decodedPayload = atob(paddedPayload);
      return JSON.parse(decodedPayload) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private getStoredUser(): (ResponseUsuarioDTO & { empresa?: { id?: number; razonSocial?: string } }) | null {
    try {
      const rawUser = localStorage.getItem('auth_user');
      return rawUser ? JSON.parse(rawUser) : null;
    } catch {
      return null;
    }
  }

  private syncStoredUser(usuario?: ResponseUsuarioDTO | null, empresa?: ResponseEmpresaDTO | null): void {
    const storedUser = this.getStoredUser();
    if (!storedUser) {
      return;
    }

    localStorage.setItem('auth_user', JSON.stringify({
      ...storedUser,
      ...(usuario ?? {}),
      empresa: {
        ...(storedUser.empresa ?? {}),
        ...(empresa ?? {})
      }
    }));
  }

  private normalizeEntityId(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private readNestedId(value: unknown): number | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    return this.normalizeEntityId((value as { id?: unknown }).id);
  }

  private isActivo(estado: unknown): boolean {
    const normalized = String(estado ?? '').trim().toUpperCase();
    return normalized === 'ACTIVO' || normalized === 'ACTIVA' || normalized === 'A' || normalized === 'TRUE';
  }

  private formatDateForInput(value: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value.slice(0, 10);
    }

    return date.toISOString().slice(0, 10);
  }

  private showError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
      confirmButtonText: 'Aceptar'
    });
  }
}
