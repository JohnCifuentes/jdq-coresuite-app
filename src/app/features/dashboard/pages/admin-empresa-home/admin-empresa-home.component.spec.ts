import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminEmpresaHomeComponent } from './admin-empresa-home.component';

describe('AdminEmpresaHomeComponent', () => {
  let component: AdminEmpresaHomeComponent;
  let fixture: ComponentFixture<AdminEmpresaHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminEmpresaHomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminEmpresaHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
