// src/app/guards/admin.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ApiService } from '../services/api.service';
import { NotificationService } from '../services/notification.service';
import { isMemberAdmin } from '../models/account.model';
import { map, catchError, of } from 'rxjs';

export const adminGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const apiService = inject(ApiService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  // Must be logged in
  if (!apiService.isAuthenticated()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  const currentUser = apiService.getCurrentUser();

  // Quick local check
  if (isMemberAdmin(currentUser)) {
    return true;
  }

  // Backend verification
  return apiService.getDashboardData().pipe(
    map((dashboardData: any) => {
      const hasAdmin = Array.isArray(dashboardData.roles) && dashboardData.roles.includes('ROLE_ADMIN');

      if (hasAdmin) {
        console.log('Admin guard - User has admin role via dashboard data');
        return true;
      }

      notificationService.show({
        type: 'error',
        title: 'Access Denied',
        message: 'You do not have permission to access this section. Admin privileges required.'
      });
      return router.createUrlTree(['/dashboard']);
    }),
    catchError((err) => {
      console.error('Admin check failed via dashboard data', err);
      notificationService.show({
        type: 'error',
        title: 'Access Denied',
        message: 'Could not verify your role. Admin privileges required.'
      });
      return of(router.createUrlTree(['/dashboard']));
    })
  );
};
