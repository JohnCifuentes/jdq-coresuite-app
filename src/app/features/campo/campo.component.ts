import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { ResponseInterfazDTO } from '../../models/operacion/interfaz.models';
import { ResponseInterfaceGrupoCamposDTO } from '../../models/operacion/interface-grupo-campos.models';
import { ResponseTipoCampoDTO } from '../../models/operacion/tipo-campo.models';
import { ResponseListaValoresDTO } from '../../models/operacion/lista-valores.models';
import { CreateCampoDTO, ResponseCampoDTO, UpdateCampoDTO } from '../../models/operacion/campo.models';
import { InterfazService } from '../../services/operacion/interfaz.service';
import { InterfaceGrupoCamposService } from '../../services/operacion/interface-grupo-campos.service';
import { TipoCampoService } from '../../services/operacion/tipo-campo.service';
import { ListaValoresService } from '../../services/operacion/lista-valores.service';
import { CampoService } from '../../services/operacion/campo.service';
import { RequiredFieldDirective } from '../../core/directives/required-field.directive';
import { getDefaultAuditData, resolveAuditDate, resolveAuditValue, resolveEstadoLabel, sortByIndice, sortByNombre } from '../../core/utils/admin-crud.util';
import { formatBackendDateTime } from '../../core/utils/date-time.util';

@Component({
  selector: 'app-campo',
  imports: [CommonModule, ReactiveFormsModule, RequiredFieldDirective],
  templateUrl: './campo.component.html',
  styleUrl: './campo.component.scss'
})
export class CampoComponent implements OnInit {
  campos: ResponseCampoDTO[] = [];
  interfaces: ResponseInterfazDTO[] = [];
  gruposCampos: ResponseInterfaceGrupoCamposDTO[] = [];
  tiposCampo: ResponseTipoCampoDTO[] = [];
  listasValores: ResponseListaValoresDTO[] = [];
  form: FormGroup;
  loading = false;
  saving = false;
  errorMessage: string | null = null;
  loggedUserName = '-';
  empresaId: number | null = null;
  selectedCampoId: number | null = null;
  estadoActual = '-';
  usuarioCreacion = '-';
  fechaCreacion = '-';
  usuarioActualizacion = '-';
  fechaActualizacion = '-';
  readonly formatDateTime = formatBackendDateTime;
  private tiposConListaValores = new Set(['SELECT', 'RADIO', 'CHECKBOX']);

  constructor(
    private fb: FormBuilder,
    private interfazService: InterfazService,
    private interfaceGrupoCamposService: InterfaceGrupoCamposService,
    private tipoCampoService: TipoCampoService,
    private listaValoresService: ListaValoresService,
    private campoService: CampoService
  ) {
    this.form = this.fb.group({
      interfazId: [null, Validators.required],
      interfaceGrupoCamposId: [null, Validators.required],
      tipoCampoId: [null, Validators.required],
      listaValoresId: [null],
      nombre: ['', Validators.required],
      etiqueta: ['', Validators.required],
      descripcion: ['', Validators.required],
      indice: [0, [Validators.required, Validators.min(0)]],
      columnas: [1, [Validators.required, Validators.min(1), Validators.max(3)]],
      valorDefecto: ['']
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
    this.setupConditionalValidators();
    this.loadCatalogos();
  }

  get isEditMode(): boolean {
    return this.selectedCampoId !== null;
  }

  submitCampo(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;

    if (this.isEditMode) {
      this.updateCampo();
      return;
    }

    const payload: CreateCampoDTO = {
      interfazId: Number(this.form.get('interfazId')?.value),
      interfaceGrupoCamposId: Number(this.form.get('interfaceGrupoCamposId')?.value),
      tipoCampoId: Number(this.form.get('tipoCampoId')?.value),
      listaValoresId: this.requiresListaValores()
        ? Number(this.form.get('listaValoresId')?.value)
        : null,
      nombre: this.form.get('nombre')?.value?.trim(),
      etiqueta: this.form.get('etiqueta')?.value?.trim(),
      descripcion: this.form.get('descripcion')?.value?.trim(),
      indice: Number(this.form.get('indice')?.value),
      columnas: Number(this.form.get('columnas')?.value),
      valorDefecto: this.normalizeOptionalText(this.form.get('valorDefecto')?.value)
    };

    this.campoService.createCampo(payload).subscribe({
      next: (response) => {
        this.saving = false;

        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operacion exitosa',
            text: 'El campo fue creado correctamente.',
            confirmButtonText: 'Aceptar'
          });

          this.resetForm();
          this.loadCampos();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible crear el campo.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        this.saving = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible crear el campo.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  editCampo(item: ResponseCampoDTO): void {
    this.selectedCampoId = item.id;
    this.setAuditData(item);

    this.form.patchValue({
      interfazId: item.interfaz?.id ?? null,
      interfaceGrupoCamposId: item.interfaceGrupoCampos?.id ?? null,
      tipoCampoId: item.tipoCampo?.id ?? null,
      listaValoresId: item.listaValores?.id ?? null,
      nombre: item.nombre,
      etiqueta: item.etiqueta,
      descripcion: item.descripcion,
      indice: item.indice,
      columnas: item.columnas,
      valorDefecto: item.valorDefecto ?? ''
    });
  }

  async confirmDeleteCampo(item: ResponseCampoDTO): Promise<void> {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Confirmar acción',
      text: `¿Está seguro de inactivar el campo ${item.nombre}?`,
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
      return;
    }

    this.inactiveCampo(item);
  }

  deleteCurrentCampo(): void {
    if (!this.selectedCampoId) {
      return;
    }

    const item = this.campos.find((campo) => campo.id === this.selectedCampoId);
    if (item) {
      void this.confirmDeleteCampo(item);
    }
  }

  resetForm(): void {
    this.form.reset({
      interfazId: null,
      interfaceGrupoCamposId: null,
      tipoCampoId: null,
      listaValoresId: null,
      nombre: '',
      etiqueta: '',
      descripcion: '',
      indice: 0,
      columnas: 1,
      valorDefecto: ''
    });
    this.selectedCampoId = null;
    this.setAuditData();
  }

  isActivo(estado: string): boolean {
    return estado?.toUpperCase() === 'ACTIVO' || estado?.toUpperCase() === 'A';
  }

  private updateCampo(): void {
    if (!this.selectedCampoId) {
      this.saving = false;
      return;
    }

    const payload: UpdateCampoDTO = {
      interfazId: Number(this.form.get('interfazId')?.value),
      interfaceGrupoCamposId: Number(this.form.get('interfaceGrupoCamposId')?.value),
      tipoCampoId: Number(this.form.get('tipoCampoId')?.value),
      listaValoresId: this.requiresListaValores()
        ? Number(this.form.get('listaValoresId')?.value)
        : null,
      nombre: this.form.get('nombre')?.value?.trim(),
      etiqueta: this.form.get('etiqueta')?.value?.trim(),
      descripcion: this.form.get('descripcion')?.value?.trim(),
      indice: Number(this.form.get('indice')?.value),
      columnas: Number(this.form.get('columnas')?.value),
      valorDefecto: this.normalizeOptionalText(this.form.get('valorDefecto')?.value)
    };

    this.campoService.updateCampo(this.selectedCampoId, payload).subscribe({
      next: (response) => {
        this.saving = false;

        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operacion exitosa',
            text: 'El campo fue actualizado correctamente.',
            confirmButtonText: 'Aceptar'
          });

          this.resetForm();
          this.loadCampos();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible actualizar el campo.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        this.saving = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible actualizar el campo.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  private inactiveCampo(item: ResponseCampoDTO): void {
    const payload: UpdateCampoDTO = {
      interfazId: item.interfaz?.id ?? Number(this.form.get('interfazId')?.value),
      interfaceGrupoCamposId: item.interfaceGrupoCampos?.id ?? Number(this.form.get('interfaceGrupoCamposId')?.value),
      tipoCampoId: item.tipoCampo?.id ?? Number(this.form.get('tipoCampoId')?.value),
      listaValoresId: item.listaValores?.id ?? null,
      nombre: item.nombre,
      etiqueta: item.etiqueta,
      descripcion: item.descripcion,
      indice: item.indice,
      columnas: item.columnas,
      valorDefecto: this.normalizeOptionalText(item.valorDefecto),
      estado: 'I'
    };

    this.campoService.updateCampo(item.id, payload).subscribe({
      next: (response) => {
        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operacion exitosa',
            text: 'El campo fue inactivado correctamente.',
            confirmButtonText: 'Aceptar'
          });

          this.resetForm();
          this.loadCampos();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible inactivar el campo.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible inactivar el campo.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  private loadCatalogos(): void {
    if (!this.empresaId) {
      this.errorMessage = 'No se encontró la empresa asociada al usuario logueado.';
      return;
    }

    this.interfazService.getAllInterfaz().subscribe({
      next: (response) => {
        this.interfaces = sortByIndice(
          (response?.contenido ?? []).filter((item) => this.belongsInterfazToEmpresa(item))
        );

        const allowedInterfazIds = new Set<number>(this.interfaces.map((item) => item.id));

        this.interfaceGrupoCamposService.getAllInterfaceGrupoCampos().subscribe({
          next: (groupResponse) => {
            this.gruposCampos = sortByIndice(
              (groupResponse?.contenido ?? []).filter((item) => this.belongsGrupoToEmpresa(item, allowedInterfazIds))
            );
            this.loadCampos();
          },
          error: () => {
            this.gruposCampos = [];
            this.campos = [];
            this.errorMessage = 'No fue posible cargar los grupos de campos de la empresa.';
          }
        });
      },
      error: () => {
        this.interfaces = [];
        this.gruposCampos = [];
        this.campos = [];
        this.errorMessage = 'No fue posible cargar las interfaces de la empresa.';
      }
    });

    this.tipoCampoService.getAllTipoCampos().subscribe({
      next: (response) => {
        this.tiposCampo = sortByNombre(response?.contenido ?? []);
      },
      error: () => {
        this.tiposCampo = [];
      }
    });

    this.listaValoresService.getListaValoresByEmpresa(this.empresaId).subscribe({
      next: (response) => {
        this.listasValores = sortByNombre(response?.contenido ?? []);
      },
      error: () => {
        this.listasValores = [];
      }
    });
  }

  private loadCampos(): void {
    this.loading = true;
    this.errorMessage = null;

    const allowedInterfazIds = new Set<number>(this.interfaces.map((item) => item.id));
    const allowedGrupoIds = new Set<number>(this.gruposCampos.map((item) => item.id));

    this.campoService.getAllCampos().subscribe({
      next: (response) => {
        this.campos = sortByIndice(
          (response?.contenido ?? []).filter((item) => this.belongsCampoToEmpresa(item, allowedInterfazIds, allowedGrupoIds))
        );
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No fue posible cargar los campos registrados.';
      }
    });
  }

  requiresListaValores(): boolean {
    const tipoCampoId = this.form.get('tipoCampoId')?.value;

    if (!tipoCampoId) {
      return false;
    }

    const tipoSeleccionado = this.tiposCampo.find((item) => item.id === Number(tipoCampoId));
    const nombreTipo = (tipoSeleccionado?.nombre ?? '').trim().toUpperCase();

    return this.tiposConListaValores.has(nombreTipo);
  }

  private setupConditionalValidators(): void {
    this.form.get('tipoCampoId')?.valueChanges.subscribe(() => {
      const listaValoresControl = this.form.get('listaValoresId');

      if (!listaValoresControl) {
        return;
      }

      if (this.requiresListaValores()) {
        listaValoresControl.setValidators([Validators.required]);
      } else {
        listaValoresControl.clearValidators();
        listaValoresControl.setValue(null);
      }

      listaValoresControl.updateValueAndValidity({ emitEvent: false });
    });
  }

  private normalizeOptionalText(value: unknown): string | null {
    const normalized = typeof value === 'string' ? value.trim() : '';
    return normalized.length > 0 ? normalized : null;
  }

  private belongsInterfazToEmpresa(item: ResponseInterfazDTO): boolean {
    const record = item as unknown as Record<string, unknown>;
    return this.readNestedNumber(record, ['modulo', 'empresa', 'id']) === this.empresaId;
  }

  private belongsGrupoToEmpresa(
    item: ResponseInterfaceGrupoCamposDTO,
    allowedInterfazIds: Set<number>
  ): boolean {
    const interfazId = item?.interfaz?.id;
    return typeof interfazId === 'number' && allowedInterfazIds.has(interfazId);
  }

  private belongsCampoToEmpresa(
    item: ResponseCampoDTO,
    allowedInterfazIds: Set<number>,
    allowedGrupoIds: Set<number>
  ): boolean {
    const interfazId = item?.interfaz?.id;
    const grupoId = item?.interfaceGrupoCampos?.id;
    const listaEmpresaId = item?.listaValores?.empresa?.id ?? null;

    return (typeof interfazId === 'number' && allowedInterfazIds.has(interfazId))
      || (typeof grupoId === 'number' && allowedGrupoIds.has(grupoId))
      || listaEmpresaId === this.empresaId;
  }

  private readNestedNumber(source: Record<string, unknown>, path: string[]): number | null {
    let current: unknown = source;

    for (const key of path) {
      if (!current || typeof current !== 'object') {
        return null;
      }

      current = (current as Record<string, unknown>)[key];
    }

    const parsed = Number(current);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private setAuditData(item?: ResponseCampoDTO): void {
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
