import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthSeguridadGlobalService } from '../../auth-seguridad-global.service';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login-gestion-usuarios',
  imports: [FormsModule, HttpClientModule, CommonModule],
  standalone: true,
  templateUrl: './login-gestion-usuarios.component.html',
  styleUrls: ['./login-gestion-usuarios.component.css'],
})
export class LoginGestionUsuariosComponent {
  usuarioInputLoginGestionUsuarios: string = '';
  passwordInputLoginGestionUsuarios: string = '';
  mensajeErrorLoginGestionUsuarios: string = '';

  constructor(
    private authServiceInstanceGestionUsuarios: AuthSeguridadGlobalService,
    private routerInstanceGestionUsuarios: Router
  ) {}

  ejecutarLoginGestionUsuarios(): void {
    if (
      !this.usuarioInputLoginGestionUsuarios ||
      !this.passwordInputLoginGestionUsuarios
    ) {
      this.mensajeErrorLoginGestionUsuarios =
        'Por favor, rellene todos los campos.';
      return;
    }

    this.authServiceInstanceGestionUsuarios
      .loginUsuarioAuthService(
        this.usuarioInputLoginGestionUsuarios,
        this.passwordInputLoginGestionUsuarios
      )
      .subscribe({
        next: (respuesta) => {
          this.routerInstanceGestionUsuarios.navigate(['/']);
        },
        error: (error) => {
          this.mensajeErrorLoginGestionUsuarios =
            'Usuario o contraseña incorrectos.';
        },
      });
  }
}
