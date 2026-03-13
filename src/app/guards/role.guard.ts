import { inject } from '@angular/core';
import { CanActivateFn, Router} from '@angular/router';
import { LoginService } from '../services/seguridad/login.service';

export const roleGuard: CanActivateFn = (route, state) => {

  const router = inject(Router);
  const loginService = inject(LoginService);
  const redirectUrl = loginService.getRedirectFromToken();
  const currentUrl = state.url.split('?')[0];

  // Keep role-based landing redirect only when entering the app root.
  if (currentUrl === '/app' || currentUrl === '/app/') {
    return router.parseUrl(redirectUrl);
  }

  if (currentUrl === redirectUrl) {
    return true;
  }

  return true;

};
