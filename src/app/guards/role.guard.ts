import { inject } from '@angular/core';
import { CanActivateFn, Router} from '@angular/router';
import { LoginService } from '../services/seguridad/login.service';

export const roleGuard: CanActivateFn = (route, state) => {

  const router = inject(Router);
  const loginService = inject(LoginService);
  const redirectUrl = loginService.getRedirectFromToken();
  const currentUrl = state.url.split('?')[0];

  if (currentUrl === redirectUrl) {
    return true;
  }

  return router.parseUrl(redirectUrl);

};
