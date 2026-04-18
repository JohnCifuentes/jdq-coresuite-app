import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { HomeComponent } from './marketing/home/home.component';
import { ServiciosComponent } from './marketing/servicios/servicios.component';
import { NosotrosComponent } from './marketing/nosotros/nosotros.component';
import { PreciosComponent } from './marketing/precios/precios.component';
import { ContactoComponent } from './marketing/contacto/contacto.component';
import { PrivateLayoutComponent } from './layouts/private-layout/private-layout.component';
import { RegisterCompanyComponent } from './features/auth/register-company/register-company.component';
import { LoginComponent } from './features/auth/login/login.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';
import { SuperAdminHomeComponent } from './features/dashboard/pages/super-admin-home/super-admin-home.component';
import { AdminEmpresaHomeComponent } from './features/dashboard/pages/admin-empresa-home/admin-empresa-home.component';
import { roleGuard } from './guards/role.guard';
import { RolComponent } from './features/rol/rol.component';
import { UserComponent } from './features/user/user.component';
import { RolUserComponent } from './features/rol-user/rol-user.component';
import { ModuleComponent } from './features/module/module.component';
import { InterfacesComponent } from './features/interfaces/interfaces.component';
import { ListaValoresComponent } from './features/lista-valores/lista-valores.component';
import { ListaValoresDetalleComponent } from './features/lista-valores-detalle/lista-valores-detalle.component';
import { TipoCampoComponent } from './features/tipo-campo/tipo-campo.component';
import { TipoValidacionComponent } from './features/tipo-validacion/tipo-validacion.component';
import { InterfaceGrupoCamposComponent } from './features/interface-grupo-campos/interface-grupo-campos.component';
import { CampoComponent } from './features/campo/campo.component';
import { CampoValidacionComponent } from './features/campo-validacion/campo-validacion.component';
import { OperacionLayoutComponent } from './layouts/operacion-layout/operacion-layout.component';
import { OperacionDinamicaComponent } from './features/operacion-dinamica/operacion-dinamica.component';
import { ProfileComponent } from './features/profile/profile.component';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'servicios', component: ServiciosComponent },
      { path: 'nosotros', component: NosotrosComponent },
      { path: 'precios', component: PreciosComponent },
      { path: 'contacto', component: ContactoComponent },
      { path: 'register-company', component: RegisterCompanyComponent },
      { path: 'login', component: LoginComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent },
      { path: 'reset-password', component: ResetPasswordComponent}
    ]
  },
  {
    path: 'app',
    component: PrivateLayoutComponent,
    children: [
      {
        path: '',
        canActivate: [roleGuard],
        component: AdminEmpresaHomeComponent,
        pathMatch: 'full'
      },
      { path: 'super-admin-home', canActivate: [roleGuard], component: SuperAdminHomeComponent },
      { path: 'admin-empresa-home', canActivate: [roleGuard], component: AdminEmpresaHomeComponent },
      { path: 'rol', canActivate: [roleGuard], component: RolComponent },
      { path: 'user', canActivate: [roleGuard], component: UserComponent },
      { path: 'profile', canActivate: [roleGuard], component: ProfileComponent },
      { path: 'rol-user', canActivate: [roleGuard], component: RolUserComponent },
      { path: 'module', canActivate: [roleGuard], component: ModuleComponent },
      { path: 'interface', canActivate: [roleGuard], component: InterfacesComponent },
      { path: 'lista-valores', canActivate: [roleGuard], component: ListaValoresComponent },
      { path: 'lista-valores-detalle', canActivate: [roleGuard], component: ListaValoresDetalleComponent },
      { path: 'tipo-campo', canActivate: [roleGuard], component: TipoCampoComponent },
      { path: 'tipo-validacion', canActivate: [roleGuard], component: TipoValidacionComponent },
      { path: 'interface-grupo-campos', canActivate: [roleGuard], component: InterfaceGrupoCamposComponent },
      { path: 'campo', canActivate: [roleGuard], component: CampoComponent },
      { path: 'campo-validacion', canActivate: [roleGuard], component: CampoValidacionComponent }
    ]
  },
  {
    path: 'app/operacion',
    canActivate: [roleGuard],
    component: OperacionLayoutComponent,
    children: [
      { path: ':interfazId', component: OperacionDinamicaComponent }
    ]
  }
];