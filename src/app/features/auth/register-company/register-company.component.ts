import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { PaisService } from '../../../services/catalogo/pais.service';
import { PaisDTO } from '../../../models/catalogo/pais.models';
import { TipoIdentificacionService } from '../../../services/catalogo/tipo-identificacion.service';
import { TipoIdentificacionDTO } from '../../../models/catalogo/tipo-identificacion.models';
import { DepartamentoService } from '../../../services/catalogo/departamento.service';
import { DepartamentoDTO } from '../../../models/catalogo/departamento.models';
import { MunicipioService } from '../../../services/catalogo/municipio.service';
import { MunicipioDTO } from '../../../models/catalogo/municipio.models';
import { EmpresaService } from '../../../services/sistema/empresa.service';
import { CreateEmpresaDTO } from '../../../models/sistema/empresa.models';
import { RequiredFieldDirective } from '../../../core/directives/required-field.directive';
import { PolicyModalComponent } from '../../../components/policy-modal/policy-modal.component';
import {
  DocumentRule,
  getDocumentRule,
  documentFormatValidator,
  noRepeatedSequenceValidator,
  sanitiseDocumentInput,
} from '../../../core/utils/document-validation.util';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register-company',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RequiredFieldDirective, PolicyModalComponent],
  templateUrl: './register-company.component.html',
  styleUrl: './register-company.component.scss'
})
export class RegisterCompanyComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  paises: PaisDTO[] = [];
  tiposId: TipoIdentificacionDTO[] = [];
  departamentos: DepartamentoDTO[] = [];
  municipios: MunicipioDTO[] = [];
  seleccionadoPaisId: number | null = null;
  seleccionadoDepartamentoId: number | null = null;

  currentDocumentRule: DocumentRule | null = null;
  numIdPlaceholder = 'Número de identificación';
  numIdHint = '';
  isSubmitting = false;
  aceptaTerminos = false;
  showPolicyModal = false;

  openPolicyModal(): void {
    this.showPolicyModal = true;
  }

  closePolicyModal(): void {
    this.showPolicyModal = false;
  }

  companyForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private paisService: PaisService,
    private tipoIdService: TipoIdentificacionService,
    private departamentoService: DepartamentoService,
    private municipioService: MunicipioService,
    private empresaService: EmpresaService
  ) { }

  ngOnInit(): void {
    this.initForm();

    // load catalogs
    this.paisService.getAllPaises().subscribe((res) => {
      if (!res.error) {
        this.paises = res.contenido;
      }
    });

    this.tipoIdService.getAllTiposIdentificacion().subscribe((res) => {
      if (!res.error) {
        this.tiposId = res.contenido;
      }
    });

    // react to control changes
    this.companyForm.get('pais')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => this.onPaisChange(val));
    this.companyForm.get('departamento')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => this.onDepartamentoChange(val));
    this.companyForm.get('tipoIdentificacion')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => this.onTipoIdentificacionChange(val));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm() {
    this.companyForm = this.fb.group({
      razonSocial: ['', Validators.required],
      tipoIdentificacion: ['', Validators.required],
      numeroIdentificacion: ['', Validators.required],
      pais: ['', Validators.required],
      departamento: [{ value: '', disabled: true }, Validators.required],
      municipio: [{ value: '', disabled: true }, Validators.required],
      direccion: ['', Validators.required],
      correo: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$')]],
      telefono: ['', [Validators.required, Validators.pattern('^\\+57\\s?\\d{3}\\s?\\d{3}\\s?\\d{4}$')]]
    });
  }

  private onTipoIdentificacionChange(tipoId: string): void {
    const numIdCtrl = this.companyForm.get('numeroIdentificacion')!;
    numIdCtrl.reset('');
    numIdCtrl.markAsUntouched();

    if (!tipoId) {
      this.currentDocumentRule = null;
      this.numIdPlaceholder = 'Número de identificación';
      this.numIdHint = '';
      numIdCtrl.setValidators([Validators.required]);
    } else {
      const tipo = this.tiposId.find((t) => t.id === Number(tipoId));
      const rule = tipo ? getDocumentRule(tipo.codigo) : null;
      this.currentDocumentRule = rule;
      this.numIdPlaceholder = rule?.placeholder ?? 'Número de identificación';
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
    this.companyForm.get('numeroIdentificacion')!.setValue(sanitised, { emitEvent: false });
  }

  onPaisChange(paisId: string) {
    const id = Number(paisId);
    if (!id) {
      this.departamentos = [];
      this.municipios = [];
      this.seleccionadoPaisId = null;
      this.seleccionadoDepartamentoId = null;
      return;
    }
    this.seleccionadoPaisId = id;
    this.departamentoService.getAllDepartamentosByPais(id).subscribe((res) => {
      if (!res.error) {
        this.departamentos = res.contenido;
        this.municipios = [];
        this.seleccionadoDepartamentoId = null;
        // enable department control if we got options
        if (this.departamentos.length) {
          this.companyForm.get('departamento')?.enable();
        } else {
          this.companyForm.get('departamento')?.disable();
        }
        // always disable municipio when pais changes
        this.companyForm.get('municipio')?.disable();
      }
    });
  }

  onDepartamentoChange(deptoId: string) {
    const id = Number(deptoId);
    if (!id) {
      this.municipios = [];
      this.seleccionadoDepartamentoId = null;
      return;
    }
    this.seleccionadoDepartamentoId = id;
    this.municipioService.getAllMunicipiosByDepartamento(id).subscribe((res) => {
      if (!res.error) {
        this.municipios = res.contenido;
        if (this.municipios.length) {
          this.companyForm.get('municipio')?.enable();
        } else {
          this.companyForm.get('municipio')?.disable();
        }
      }
    });
  }

  onSubmit() {
    if (this.companyForm.invalid || this.isSubmitting) {
      this.companyForm.markAllAsTouched();
      return;
    }

    const v = this.companyForm.value;
    const dto: CreateEmpresaDTO = {
      tipoIdentificacionId: Number(v.tipoIdentificacion),
      paisId: Number(v.pais),
      departamentoId: Number(v.departamento),
      municipioId: Number(v.municipio),
      numeroIdentificacion: v.numeroIdentificacion,
      razonSocial: v.razonSocial,
      direccion: v.direccion,
      correoElectronico: v.correo,
      telefono: v.telefono
    };

    this.isSubmitting = true;

    this.empresaService.createEmpresa(dto).pipe(
      finalize(() => { this.isSubmitting = false; })
    ).subscribe({
      next: (res) => {
        if (!res.error) {
          Swal.fire({
            icon: 'success',
            title: 'Empresa creada',
            text: 'La empresa se ha registrado correctamente.',
            confirmButtonText: 'Aceptar'
          }).then(() => {
            window.location.reload();
          });
        }
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'No se pudo crear la empresa',
          text: err.error.contenido,
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }
}
