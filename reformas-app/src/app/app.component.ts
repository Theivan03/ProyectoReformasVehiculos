import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthSeguridadGlobalService } from './auth-seguridad-global.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'reformas-app';

  constructor(
    private router: Router,
    private authService: AuthSeguridadGlobalService
  ) {}

  get usuarioLogueado(): boolean {
    return this.authService.estaAutenticadoAuthService();
  }

  get rolUsuario(): string {
    const token = localStorage.getItem('tokenCifradoAppSegura');
    if (!token) return '';

    try {
      const payloadBase64 = token.split('.')[1];
      const payloadDecoded = atob(payloadBase64);
      const datos = JSON.parse(payloadDecoded);
      return datos.rol || '';
    } catch (e) {
      return '';
    }
  }

  get esAdmin(): boolean {
    return this.rolUsuario === 'administrador';
  }

  get esRolCoche(): boolean {
    return this.rolUsuario === 'coche';
  }

  get esRolVivienda(): boolean {
    return this.rolUsuario === 'vivienda';
  }

  resetAndNavigate(route: string) {
    this.clearWizardStorage();
    this.router.navigate([route]);
  }

  cerrarSesion() {
    this.authService.logoutUsuarioAuthService();
  }

  clearWizardStorage() {
    try {
      const prefix = 'reforma-wizard-v1';

      const keysToDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i) || '';
        if (key.startsWith(prefix)) keysToDelete.push(key);
      }
      keysToDelete.forEach((k) => localStorage.removeItem(k));

      localStorage.removeItem(prefix);
      localStorage.removeItem(prefix + '-nueva');

      sessionStorage.clear();
    } catch (err) {
      console.error('Error limpiando almacenamiento:', err);
    }
  }
}
