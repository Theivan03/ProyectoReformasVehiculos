import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthSeguridadGlobalService {
  private apiUrlAuthService = 'http://192.168.1.41:3000/api';

  constructor(
    private httpAuthService: HttpClient,
    private routerAuthService: Router
  ) {}

  loginUsuarioAuthService(
    usuarioLoginInput: string,
    passwordLoginInput: string
  ): Observable<any> {
    return this.httpAuthService
      .post<any>(`${this.apiUrlAuthService}/login`, {
        usuarioLoginApp: usuarioLoginInput,
        passwordLoginApp: passwordLoginInput,
      })
      .pipe(
        tap((respuestaServidor) => {
          if (respuestaServidor && respuestaServidor.token) {
            localStorage.setItem(
              'tokenCifradoAppSegura',
              respuestaServidor.token
            );
          }
        })
      );
  }

  logoutUsuarioAuthService(): void {
    localStorage.removeItem('tokenCifradoAppSegura');
    this.routerAuthService.navigate(['/login']);
  }

  estaAutenticadoAuthService(): boolean {
    const tokenGuardadoAuthService = localStorage.getItem(
      'tokenCifradoAppSegura'
    );
    return !!tokenGuardadoAuthService;
  }
}
