import { inject } from '@angular/core';
import { CanActivateFn, Router} from '@angular/router';
import { LoginService } from '../services/seguridad/login.service';

export const roleGuard: CanActivateFn = (route, state) => {

  const router = inject(Router);
  const loginService = inject(LoginService);

  return router.createUrlTree([loginService.getRedirectFromToken()]);

};
