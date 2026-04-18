import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, catchError, finalize, forkJoin, map, of, switchMap, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { RequiredFieldDirective } from '../../core/directives/required-field.directive';
import { ResponseCampoDTO } from '../../models/operacion/campo.models';
import { ResponseCampoValidacionDTO } from '../../models/operacion/campo-validacion.models';
import { ResponseInterfaceGrupoCamposDTO } from '../../models/operacion/interface-grupo-campos.models';
import { ResponseInterfazDTO } from '../../models/operacion/interfaz.models';
import { ResponseListaValoresDetalleDTO } from '../../models/operacion/lista-valores-detalle.models';
import { ResponseListaValoresDTO } from '../../models/operacion/lista-valores.models';
import { CampoService } from '../../services/operacion/campo.service';
import { CampoValidacionService } from '../../services/operacion/campo-validacion.service';
import { InterfaceGrupoCamposService } from '../../services/operacion/interface-grupo-campos.service';
import { InterfazService } from '../../services/operacion/interfaz.service';
import { ListaValoresDetalleService } from '../../services/operacion/lista-valores-detalle.service';
import { ListaValoresService } from '../../services/operacion/lista-valores.service';

interface DynamicOption {
  id: number;
  valor: string;
  descripcion: string;
}

type DynamicRenderType = 'text' | 'number' | 'date' | 'textarea' | 'checkbox' | 'select';

interface DynamicField {
  campoId: number;
  grupoId: number;
  nombre: string;
  tipo: string;
  etiqueta: string;
  requerido: boolean;
  indice: number;
  columnas: number;
  controlName: string;
  valorDefecto: string | boolean;
  renderType: DynamicRenderType;
  listaValores: DynamicOption[];
  validaciones: ResponseCampoValidacionDTO[];
}

interface DynamicGroup {
  grupoId: number;
  nombreGrupo: string;
  indice: number;
  campos: DynamicField[];
}

interface StoredUserLike {
  empresa?: { id?: number; consecutivo?: number };
  empresaId?: number;
  empresaConsecutivo?: number;
}

@Component({
  selector: 'app-operacion-dinamica',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RequiredFieldDirective],
  templateUrl: './operacion-dinamica.component.html'
})
export class OperacionDinamicaComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  interfazId: number | null = null;
  interfazNombre = 'Operación dinámica';
  interfazDescripcion = 'Pantalla construida dinámicamente según la configuración de la interfaz seleccionada.';
  pantalla: DynamicGroup[] = [];
  form: FormGroup;
  loading = false;
  saving = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private interfazService: InterfazService,
    private interfaceGrupoCamposService: InterfaceGrupoCamposService,
    private campoService: CampoService,
    private campoValidacionService: CampoValidacionService,
    private listaValoresService: ListaValoresService,
    private listaValoresDetalleService: ListaValoresDetalleService
  ) {
    this.form = this.fb.group({});
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      map((params) => Number(params.get('interfazId'))),
      takeUntil(this.destroy$)
    ).subscribe((interfazId) => {
      if (!interfazId) {
        this.errorMessage = 'No se encontró la interfaz seleccionada.';
        this.pantalla = [];
        this.form = this.fb.group({});
        return;
      }

      this.loadPantalla(interfazId);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByGroupId(_: number, group: DynamicGroup): number {
    return group.grupoId;
  }

  trackByFieldId(_: number, field: DynamicField): number {
    return field.campoId;
  }

  getBootstrapColumnClass(field: DynamicField): string {
    const columnas = Math.max(1, Math.min(field.columnas || 1, 3));
    return `col-12 col-md-${columnas * 4}`;
  }

  getFieldErrorMessage(field: DynamicField): string {
    const control = this.form.get(field.controlName);
    if (!control?.errors) {
      return '';
    }

    if (control.errors['required'] || control.errors['requiredTrue']) {
      return 'Este campo es obligatorio.';
    }

    if (control.errors['email']) {
      return 'Ingrese un correo electrónico con formato válido.';
    }

    if (control.errors['minlength']) {
      return `La longitud mínima es ${control.errors['minlength'].requiredLength} caracteres.`;
    }

    if (control.errors['maxlength']) {
      return `La longitud máxima es ${control.errors['maxlength'].requiredLength} caracteres.`;
    }

    if (control.errors['min']) {
      return `El valor mínimo permitido es ${control.errors['min'].min}.`;
    }

    if (control.errors['max']) {
      return `El valor máximo permitido es ${control.errors['max'].max}.`;
    }

    if (control.errors['pattern']) {
      return 'El valor ingresado no cumple el formato esperado.';
    }

    return 'Verifique el valor ingresado.';
  }

  showFieldErrors(field: DynamicField): boolean {
    const control = this.form.get(field.controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  resetForm(): void {
    this.form.reset(this.getDefaultFormValues());
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;

    Swal.fire({
      icon: 'success',
      title: 'Formulario listo',
      text: 'La interfaz dinámica se cargó correctamente y está lista para procesarse.',
      confirmButtonText: 'Aceptar'
    }).finally(() => {
      this.saving = false;
    });
  }

  private loadPantalla(interfazId: number): void {
    this.interfazId = interfazId;
    this.loading = true;
    this.errorMessage = null;

    const empresaId = this.getEmpresaId();

    forkJoin({
      interfaz: this.interfazService.getInterfazById(interfazId).pipe(
        map((response) => response?.contenido ?? null),
        catchError(() => of(null))
      ),
      grupos: this.interfaceGrupoCamposService.getInterfaceGrupoCamposByInterfaz(interfazId).pipe(
        map((response) => this.sortByIndice(response?.contenido ?? [])),
        catchError(() => of([] as ResponseInterfaceGrupoCamposDTO[]))
      ),
      campos: this.campoService.getCamposByInterfaz(interfazId).pipe(
        map((response) => this.sortByIndice(response?.contenido ?? [])),
        catchError(() => of([] as ResponseCampoDTO[]))
      ),
      listasValores: empresaId
        ? this.listaValoresService.getListaValoresByEmpresa(empresaId).pipe(
            map((response) => response?.contenido ?? []),
            catchError(() => of([] as ResponseListaValoresDTO[]))
          )
        : of([] as ResponseListaValoresDTO[])
    }).pipe(
      switchMap(({ interfaz, grupos, campos, listasValores }) => {
        this.interfazNombre = interfaz?.nombre ?? 'Operación dinámica';
        this.interfazDescripcion = interfaz?.descripcion
          ?? 'Pantalla construida dinámicamente según la configuración de la interfaz seleccionada.';

        if (campos.length === 0 || grupos.length === 0) {
          return of({ grupos, fields: [] as DynamicField[] });
        }

        return forkJoin(
          campos.map((campo) => this.buildDynamicField(campo, listasValores))
        ).pipe(
          map((fields) => ({ grupos, fields }))
        );
      }),
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      next: ({ grupos, fields }) => {
        this.pantalla = this.buildPantalla(grupos, fields);
        this.form = this.buildForm(this.pantalla);

        if (!this.pantalla.length) {
          this.errorMessage = 'No hay grupos o campos configurados para esta interfaz.';
        }
      },
      error: () => {
        this.pantalla = [];
        this.form = this.fb.group({});
        this.errorMessage = 'No fue posible cargar la configuración de la pantalla.';
      }
    });
  }

  private buildDynamicField(
    campo: ResponseCampoDTO,
    listasValores: ResponseListaValoresDTO[]
  ) {
    const listaValoresId = campo.listaValores?.id ?? null;
    const isListaDisponible = typeof listaValoresId === 'number'
      && listasValores.some((item) => item.id === listaValoresId);

    return forkJoin({
      validaciones: this.campoValidacionService.getCampoValidacionesByCampo(campo.id).pipe(
        map((response) => response?.contenido ?? []),
        catchError(() => of([] as ResponseCampoValidacionDTO[]))
      ),
      opciones: isListaDisponible
        ? this.listaValoresDetalleService.getListaValoresDetalleByListaValores(listaValoresId as number).pipe(
            map((response) => this.mapOpciones(response?.contenido ?? [])),
            catchError(() => of([] as DynamicOption[]))
          )
        : of([] as DynamicOption[])
    }).pipe(
      map(({ validaciones, opciones }) => {
        const renderType = this.resolveRenderType(campo, opciones);
        const requerido = this.isRequiredField(validaciones);

        return {
          campoId: campo.id,
          grupoId: campo.interfaceGrupoCampos?.id ?? 0,
          nombre: campo.nombre,
          tipo: campo.tipoCampo?.nombre ?? 'Texto',
          etiqueta: campo.etiqueta || campo.nombre,
          requerido,
          indice: campo.indice ?? 0,
          columnas: campo.columnas ?? 1,
          controlName: `campo_${campo.id}`,
          valorDefecto: this.resolveDefaultValue(campo, renderType),
          renderType,
          listaValores: opciones,
          validaciones
        } satisfies DynamicField;
      })
    );
  }

  private buildPantalla(grupos: ResponseInterfaceGrupoCamposDTO[], fields: DynamicField[]): DynamicGroup[] {
    return this.sortByIndice(grupos)
      .map((grupo) => ({
        grupoId: grupo.id,
        nombreGrupo: grupo.nombre,
        indice: grupo.indice ?? 0,
        campos: this.sortByIndice(fields.filter((field) => field.grupoId === grupo.id))
      }))
      .filter((grupo) => grupo.campos.length > 0);
  }

  private buildForm(groups: DynamicGroup[]): FormGroup {
    const controls: Record<string, FormControl> = {};

    groups.forEach((group) => {
      group.campos.forEach((field) => {
        controls[field.controlName] = new FormControl(
          field.valorDefecto,
          this.buildValidators(field)
        );
      });
    });

    return this.fb.group(controls);
  }

  private buildValidators(field: DynamicField): ValidatorFn[] {
    const validators: ValidatorFn[] = [];

    if (field.requerido) {
      validators.push(field.renderType === 'checkbox' ? Validators.requiredTrue : Validators.required);
    }

    field.validaciones.forEach((validation) => {
      const tipo = this.normalizeText(validation.tipoValidacion?.nombre);
      const valor = validation.valor?.trim() ?? '';
      const numericValue = Number(valor);

      if ((tipo.includes('email'))) {
        validators.push(Validators.email);
        return;
      }

      if ((tipo.includes('minlength') || tipo.includes('longitud minima')) && !Number.isNaN(numericValue)) {
        validators.push(Validators.minLength(numericValue));
        return;
      }

      if ((tipo.includes('maxlength') || tipo.includes('longitud maxima')) && !Number.isNaN(numericValue)) {
        validators.push(Validators.maxLength(numericValue));
        return;
      }

      if ((tipo === 'min' || tipo.includes('valor minimo')) && !Number.isNaN(numericValue)) {
        validators.push(Validators.min(numericValue));
        return;
      }

      if ((tipo === 'max' || tipo.includes('valor maximo')) && !Number.isNaN(numericValue)) {
        validators.push(Validators.max(numericValue));
        return;
      }

      if ((tipo.includes('patron') || tipo.includes('regex')) && valor) {
        validators.push(Validators.pattern(valor));
      }
    });

    return validators;
  }


  private mapOpciones(items: ResponseListaValoresDetalleDTO[]): DynamicOption[] {
    return items.map((item) => ({
      id: item.id,
      valor: item.nombre,
      descripcion: item.nombre
    }));
  }

  private isRequiredField(validaciones: ResponseCampoValidacionDTO[]): boolean {
    return validaciones.some((validation) => {
      const tipo = this.normalizeText(validation.tipoValidacion?.nombre);
      return validation.campo?.requerido === true
        || tipo.includes('required')
        || tipo.includes('requerido')
        || tipo.includes('obligatorio');
    });
  }

  private resolveRenderType(campo: ResponseCampoDTO, opciones: DynamicOption[]): DynamicRenderType {
    const tipo = this.normalizeText(campo.tipoCampo?.nombre);

    if (tipo.includes('textarea') || tipo.includes('area de texto')) {
      return 'textarea';
    }

    if (tipo.includes('fecha') || tipo.includes('date')) {
      return 'date';
    }

    if (tipo.includes('checkbox') || tipo.includes('check')) {
      return 'checkbox';
    }

    if (tipo.includes('numero') || tipo.includes('number')) {
      return 'number';
    }

    if (tipo.includes('select') || tipo.includes('radio') || opciones.length > 0) {
      return 'select';
    }

    return 'text';
  }

  private resolveDefaultValue(campo: ResponseCampoDTO, renderType: DynamicRenderType): string | boolean {
    const rawValue = campo.valorDefecto ?? '';

    if (renderType === 'checkbox') {
      return ['true', '1', 'si', 'sí'].includes(this.normalizeText(rawValue));
    }

    return rawValue;
  }

  private getDefaultFormValues(): Record<string, string | boolean> {
    const values: Record<string, string | boolean> = {};

    this.pantalla.forEach((group) => {
      group.campos.forEach((field) => {
        values[field.controlName] = field.valorDefecto;
      });
    });

    return values;
  }

  private sortByIndice<T extends { indice?: number }>(items: T[]): T[] {
    return [...items].sort((a, b) => (a.indice ?? 0) - (b.indice ?? 0));
  }

  private normalizeText(value: string | null | undefined): string {
    return (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private getEmpresaId(): number | null {
    const rawUser = localStorage.getItem('auth_user');

    if (!rawUser) {
      return null;
    }

    try {
      const user = JSON.parse(rawUser) as StoredUserLike;
      const candidates = [
        user?.empresa?.id,
        user?.empresaId,
        user?.empresaConsecutivo,
        user?.empresa?.consecutivo
      ];

      const value = candidates.find((candidate) => typeof candidate === 'number');
      return typeof value === 'number' ? value : null;
    } catch {
      return null;
    }
  }
}
