import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-gestion-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-gestion-usuarios.component.html',
  styleUrls: ['./admin-gestion-usuarios.component.css'],
})
export class AdminGestionUsuariosComponent implements OnInit {
  listaUsuariosAdminPanel: any[] = [];
  nuevoUsuarioAdminPanel = {
    usuarioRegistroApp: '',
    passwordRegistroApp: '',
    tipoUsuarioApp: 'coche',
  };
  mensajeAdminPanel: string = '';

  private apiUrlAdminPanel = 'http://localhost:3000/api';

  constructor(private httpAdminPanel: HttpClient) {}

  ngOnInit(): void {
    this.cargarUsuariosAdminPanel();
  }

  cargarUsuariosAdminPanel(): void {
    this.httpAdminPanel
      .get<any[]>(`${this.apiUrlAdminPanel}/usuarios`)
      .subscribe({
        next: (datos) => {
          this.listaUsuariosAdminPanel = datos;
        },
        error: (err) => console.error('Error cargando usuarios', err),
      });
  }

  crearUsuarioAdminPanel(): void {
    if (
      !this.nuevoUsuarioAdminPanel.usuarioRegistroApp ||
      !this.nuevoUsuarioAdminPanel.passwordRegistroApp
    ) {
      this.mensajeAdminPanel = 'Faltan datos';
      return;
    }

    this.httpAdminPanel
      .post(`${this.apiUrlAdminPanel}/registro`, this.nuevoUsuarioAdminPanel)
      .subscribe({
        next: () => {
          this.mensajeAdminPanel = 'Usuario creado correctamente';
          this.nuevoUsuarioAdminPanel = {
            usuarioRegistroApp: '',
            passwordRegistroApp: '',
            tipoUsuarioApp: 'coche',
          };
          this.cargarUsuariosAdminPanel();
        },
        error: () => {
          this.mensajeAdminPanel = 'Error al crear usuario';
        },
      });
  }

  eliminarUsuarioAdminPanel(idUsuario: number): void {
    if (confirm('¿Seguro que quieres eliminar este usuario?')) {
      this.httpAdminPanel
        .delete(`${this.apiUrlAdminPanel}/usuarios/${idUsuario}`)
        .subscribe({
          next: () => {
            this.cargarUsuariosAdminPanel();
          },
          error: (err) => console.error('Error eliminando', err),
        });
    }
  }
}
