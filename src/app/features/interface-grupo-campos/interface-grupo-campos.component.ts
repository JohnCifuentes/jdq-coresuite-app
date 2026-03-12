import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { ResponseInterfazDTO } from '../../models/operacion/interfaz.models';
import {
  CreateInterfaceGrupoCamposDTO,
  ResponseInterfaceGrupoCamposDTO,
  UpdateInterfaceGrupoCamposDTO
} from '../../models/operacion/interface-grupo-campos.models';
import { InterfazService } from '../../services/operacion/interfaz.service';
import { InterfaceGrupoCamposService } from '../../services/operacion/interface-grupo-campos.service';

@Component({
  selector: 'app-interface-grupo-campos',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './interface-grupo-campos.component.html',
  styleUrl: './interface-grupo-campos.component.scss'
})
export class InterfaceGrupoCamposComponent implements OnInit {
  gruposCampos: ResponseInterfaceGrupoCamposDTO[] = [];
  interfaces: ResponseInterfazDTO[] = [];
  form: FormGroup;
  loading = false;
  saving = false;
  errorMessage: string | null = null;
  loggedUserName = '-';
  selectedGrupoId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private interfazService: InterfazService,
    private interfaceGrupoCamposService: InterfaceGrupoCamposService
  ) {
    this.form = this.fb.group({
      interfazId: [null, Validators.required],
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      indice: [0, [Validators.required, Validators.min(0)]]
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

    this.loadInterfaces();
    this.loadGruposCampos();
  }

  get isEditMode(): boolean {
    return this.selectedGrupoId !== null;
  }

  submitGrupoCampos(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;

    if (this.isEditMode) {
      this.updateGrupoCampos();
      return;
    }

    const payload: CreateInterfaceGrupoCamposDTO = {
      interfazId: Number(this.form.get('interfazId')?.value),
      nombre: this.form.get('nombre')?.value?.trim(),
      descripcion: this.form.get('descripcion')?.value?.trim(),
      indice: Number(this.form.get('indice')?.value)
    };

    this.interfaceGrupoCamposService.createInterfaceGrupoCampos(payload).subscribe({
      next: (response) => {
        this.saving = false;

        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operacion exitosa',
            text: 'El grupo de campos fue creado correctamente.',
            confirmButtonText: 'Aceptar'
          });

          this.resetForm();
          this.loadGruposCampos();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible crear el grupo de campos.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        this.saving = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible crear el grupo de campos.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  editGrupoCampos(item: ResponseInterfaceGrupoCamposDTO): void {
    this.selectedGrupoId = item.id;

    this.form.patchValue({
      interfazId: item.interfaz?.id ?? null,
      nombre: item.nombre,
      descripcion: item.descripcion,
      indice: item.indice
    });
  }

  resetForm(): void {
    this.form.reset({
      interfazId: null,
      nombre: '',
      descripcion: '',
      indice: 0
    });
    this.selectedGrupoId = null;
  }

  isActivo(estado: string): boolean {
    return estado?.toUpperCase() === 'ACTIVO' || estado?.toUpperCase() === 'A';
  }

  private updateGrupoCampos(): void {
    if (!this.selectedGrupoId) {
      this.saving = false;
      return;
    }

    const payload: UpdateInterfaceGrupoCamposDTO = {
      interfazId: Number(this.form.get('interfazId')?.value),
      nombre: this.form.get('nombre')?.value?.trim(),
      descripcion: this.form.get('descripcion')?.value?.trim(),
      indice: Number(this.form.get('indice')?.value)
    };

    this.interfaceGrupoCamposService.updateInterfaceGrupoCampos(this.selectedGrupoId, payload).subscribe({
      next: (response) => {
        this.saving = false;

        if (!response.error) {
          Swal.fire({
            icon: 'success',
            title: 'Operacion exitosa',
            text: 'El grupo de campos fue actualizado correctamente.',
            confirmButtonText: 'Aceptar'
          });

          this.resetForm();
          this.loadGruposCampos();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No fue posible actualizar el grupo de campos.',
            confirmButtonText: 'Aceptar'
          });
        }
      },
      error: () => {
        this.saving = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No fue posible actualizar el grupo de campos.',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  private loadInterfaces(): void {
    this.interfazService.getAllInterfaz().subscribe({
      next: (response) => {
        this.interfaces = response?.contenido ?? [];
      },
      error: () => {
        this.interfaces = [];
      }
    });
  }

  private loadGruposCampos(): void {
    this.loading = true;
    this.errorMessage = null;

    this.interfaceGrupoCamposService.getAllInterfaceGrupoCampos().subscribe({
      next: (response) => {
        this.gruposCampos = response?.contenido ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No fue posible cargar los grupos de campos registrados.';
      }
    });
  }
}
