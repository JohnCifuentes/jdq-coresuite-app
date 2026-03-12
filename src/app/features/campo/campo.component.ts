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

@Component({
  selector: 'app-campo',
  imports: [CommonModule, ReactiveFormsModule],
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
  selectedCampoId: number | null = null;

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
      listaValoresId: [null, Validators.required],
      nombre: ['', Validators.required],
      etiqueta: ['', Validators.required],
      descripcion: ['', Validators.required],
      indice: [0, [Validators.required, Validators.min(0)]],
      columnas: [12, [Validators.required, Validators.min(1)]],
      valorDefecto: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const rawUser = localStorage.getItem('auth_user');

    if (rawUser) {
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
      } catch {
        this.loggedUserName = '-';
      }
    }

    this.loadCatalogos();
    this.loadCampos();
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
      listaValoresId: Number(this.form.get('listaValoresId')?.value),
      nombre: this.form.get('nombre')?.value?.trim(),
      etiqueta: this.form.get('etiqueta')?.value?.trim(),
      descripcion: this.form.get('descripcion')?.value?.trim(),
      indice: Number(this.form.get('indice')?.value),
      columnas: Number(this.form.get('columnas')?.value),
      valorDefecto: this.form.get('valorDefecto')?.value?.trim()
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
      valorDefecto: item.valorDefecto
    });
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
      columnas: 12,
      valorDefecto: ''
    });
    this.selectedCampoId = null;
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
      listaValoresId: Number(this.form.get('listaValoresId')?.value),
      nombre: this.form.get('nombre')?.value?.trim(),
      etiqueta: this.form.get('etiqueta')?.value?.trim(),
      descripcion: this.form.get('descripcion')?.value?.trim(),
      indice: Number(this.form.get('indice')?.value),
      columnas: Number(this.form.get('columnas')?.value),
      valorDefecto: this.form.get('valorDefecto')?.value?.trim()
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

  private loadCatalogos(): void {
    this.interfazService.getAllInterfaz().subscribe({
      next: (response) => {
        this.interfaces = response?.contenido ?? [];
      },
      error: () => {
        this.interfaces = [];
      }
    });

    this.interfaceGrupoCamposService.getAllInterfaceGrupoCampos().subscribe({
      next: (response) => {
        this.gruposCampos = response?.contenido ?? [];
      },
      error: () => {
        this.gruposCampos = [];
      }
    });

    this.tipoCampoService.getAllTipoCampos().subscribe({
      next: (response) => {
        this.tiposCampo = response?.contenido ?? [];
      },
      error: () => {
        this.tiposCampo = [];
      }
    });

    this.listaValoresService.getAllListaValores().subscribe({
      next: (response) => {
        this.listasValores = response?.contenido ?? [];
      },
      error: () => {
        this.listasValores = [];
      }
    });
  }

  private loadCampos(): void {
    this.loading = true;
    this.errorMessage = null;

    this.campoService.getAllCampos().subscribe({
      next: (response) => {
        this.campos = response?.contenido ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No fue posible cargar los campos registrados.';
      }
    });
  }
}
