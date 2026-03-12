import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AdminEmpresaHomeComponent } from './admin-empresa-home.component';
import { UsuarioService } from '../../../../services/seguridad/usuario.service';
import { SesionService } from '../../../../services/sistema/sesion.service';
import { LicenciaService } from '../../../../services/sistema/licencia.service';

describe('AdminEmpresaHomeComponent', () => {
  let component: AdminEmpresaHomeComponent;
  let fixture: ComponentFixture<AdminEmpresaHomeComponent>;

  const usuarioServiceMock = {
    getUsuariosByEmpresa: jasmine.createSpy('getUsuariosByEmpresa').and.returnValue(of({ error: false, contenido: [] }))
  };

  const sesionServiceMock = {
    getSesionesByEmpresa: jasmine.createSpy('getSesionesByEmpresa').and.returnValue(of({ error: false, contenido: [] }))
  };

  const licenciaServiceMock = {
    getLicenciasByEmpresa: jasmine.createSpy('getLicenciasByEmpresa').and.returnValue(of({ error: false, contenido: [] }))
  };

  beforeEach(async () => {
    localStorage.setItem('auth_user', JSON.stringify({
      empresa: {
        id: 1,
        razonSocial: 'Empresa Demo'
      }
    }));

    await TestBed.configureTestingModule({
      imports: [AdminEmpresaHomeComponent],
      providers: [
        { provide: UsuarioService, useValue: usuarioServiceMock },
        { provide: SesionService, useValue: sesionServiceMock },
        { provide: LicenciaService, useValue: licenciaServiceMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminEmpresaHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    localStorage.removeItem('auth_user');
  });
});
