import { inject } from '@angular/core';
import { CanActivateFn, Router} from '@angular/router';

export const roleGuard: CanActivateFn = (route, state) => {

  const router = inject(Router);

  const role = 'admin-empresa';

  return router.createUrlTree(['/app/super-admin-home']);

};
