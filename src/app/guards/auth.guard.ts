import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ApiService } from '../services/api.service';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const apiService = inject(ApiService);

  const router = inject(Router);
 const auth = apiService.isAuthenticated();
 console.log('Guard check - Authenticated?', auth);
  if (apiService.isAuthenticated()) {
    return true;
  } else {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
};


