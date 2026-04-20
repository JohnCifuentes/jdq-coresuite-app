import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import Swal from 'sweetalert2';

import { PrivateLayoutComponent } from './private-layout.component';
import { LicenciaService } from '../../services/sistema/licencia.service';

describe('PrivateLayoutComponent', () => {
  let component: PrivateLayoutComponent;
  let fixture: ComponentFixture<PrivateLayoutComponent>;

  const licenciaServiceMock = {
    getLicenciasByEmpresa: jasmine.createSpy('getLicenciasByEmpresa').and.returnValue(of({ error: false, contenido: [] }))
  };

  const buildToken = (payload: Record<string, unknown>): string => {
    const encoded = btoa(JSON.stringify(payload));
    return `header.${encoded}.signature`;
  };

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    licenciaServiceMock.getLicenciasByEmpresa.calls.reset();

    await TestBed.configureTestingModule({
      imports: [PrivateLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: LicenciaService, useValue: licenciaServiceMock }
      ]
    })
    .overrideComponent(PrivateLayoutComponent, {
      set: {
        template: '<div>private-layout</div>'
      }
    })
    .compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should create', () => {
    fixture = TestBed.createComponent(PrivateLayoutComponent);
    component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should validate the company license on init using the auth token', () => {
    localStorage.setItem('auth_token', buildToken({ empresaId: 25 }));

    fixture = TestBed.createComponent(PrivateLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(licenciaServiceMock.getLicenciasByEmpresa).toHaveBeenCalledOnceWith(25);
  });

  it('should show a toast when the active license expires within 15 days', () => {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);

    localStorage.setItem('auth_token', buildToken({ empresaId: 9 }));
    licenciaServiceMock.getLicenciasByEmpresa.and.returnValue(of({
      error: false,
      contenido: [{
        id: 1,
        empresa: { id: 9, razonSocial: 'Empresa Demo' },
        plan: { id: 1, nombre: 'Plan Base' },
        fechaCompra: '2026-01-01',
        fechaExpiracion: expirationDate.toISOString(),
        activo: true,
        estado: 'ACTIVO',
        usuarioCreacion: 'test',
        fechaCreacion: '2026-01-01',
        usuarioActualizacion: 'test',
        fechaActualizacion: '2026-01-01'
      }]
    }));
    const swalSpy = spyOn(Swal, 'fire').and.returnValue(Promise.resolve({} as never));

    fixture = TestBed.createComponent(PrivateLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(swalSpy).toHaveBeenCalled();
  });
});
