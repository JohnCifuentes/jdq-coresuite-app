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
    loadChildren: () =>
      import('./features/dashboard/dashboard.module')
        .then(m => m.DashboardModule)
  }
];