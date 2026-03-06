import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register-company',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register-company.component.html',
  styleUrl: './register-company.component.scss'
})
export class RegisterCompanyComponent implements OnInit {
  paises: PaisDTO[] = [];
  tiposId: TipoIdentificacionDTO[] = [];
  departamentos: DepartamentoDTO[] = [];
  municipios: MunicipioDTO[] = [];
  seleccionadoPaisId: number | null = null;
  seleccionadoDepartamentoId: number | null = null;

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
    this.companyForm.get('pais')?.valueChanges.subscribe((val) => this.onPaisChange(val));
    this.companyForm.get('departamento')?.valueChanges.subscribe((val) => this.onDepartamentoChange(val));
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
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern('^\\+57[0-9]{7,10}$')]]
    });
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
    if (this.companyForm.invalid) {
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

    this.empresaService.createEmpresa(dto).subscribe({
      next: (res) => {
        console.log('empresa creada', res);
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
        console.error('error creando empresa', err);
        // backend indicated error --> show message
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
