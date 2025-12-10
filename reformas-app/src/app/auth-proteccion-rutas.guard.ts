import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthSeguridadGlobalService } from './auth-seguridad-global.service';

@Injectable({
  providedIn: 'root',
})
export class AuthProteccionRutasGuard implements CanActivate {
  constructor(
    private authServiceGuardia: AuthSeguridadGlobalService,
    private routerGuardia: Router
  ) {}

  canActivate(): boolean {
    if (this.authServiceGuardia.estaAutenticadoAuthService()) {
      return true;
    } else {
      this.routerGuardia.navigate(['/login']);
      return false;
    }
  }
}
