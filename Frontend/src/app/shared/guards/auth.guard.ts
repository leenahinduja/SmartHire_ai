import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.auth.isLoggedIn) return true;
    // Save the URL the user was trying to access so we can redirect after login
    localStorage.setItem('smarthire_redirect', state.url);
    this.router.navigate(['/login']);
    return false;
  }
}
