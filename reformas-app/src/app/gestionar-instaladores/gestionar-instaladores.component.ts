import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-gestionar-instaladores',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './gestionar-instaladores.component.html',
  styleUrl: './gestionar-instaladores.component.css',
})
export class GestionarInstaladoresComponent {
  guardado = false;
  accion: 'crear' | 'editar' | null = null;
  instaladores: any[] = [];
  instaladorSeleccionadoNombre: string | null = null;
  progreso = -1;
  procesando = false;
  nombrePendienteBorrar: string | null = null;

  formularioInstalador: any = {
    empresaInstaladoraOInstalador: '',
    cifODni: '',
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargarInstaladores();
  }

  cargarInstaladores(): void {
    this.http.get<any>('/instaladores').subscribe({
      next: (data) => {
        this.instaladores = Array.isArray(data) ? data : [data];
      },
      error: (err) => {
        console.error('Error al cargar instaladores:', err);
        this.instaladores = [];
      },
    });
  }

  seleccionarAccion(tipo: 'crear' | 'editar'): void {
    this.accion = tipo;
    this.instaladorSeleccionadoNombre = null;
    this.resetFormulario();
  }

  cargarInstalador(): void {
    const instalador = this.instaladores.find(
      (i) =>
        i.empresaInstaladoraOInstalador === this.instaladorSeleccionadoNombre,
    );

    if (instalador) {
      this.formularioInstalador = { ...instalador };
    } else {
      this.abrirModalError('Instalador no encontrado.');
    }
  }

  guardarInstalador(): void {
    this.procesando = true;
    this.progreso = 0;
    this.animateProgress(60);

    this.http.get<any>('/instaladores').subscribe({
      next: (data) => {
        const instaladores = Array.isArray(data) ? data : [data];
        const nombre = this.formularioInstalador.empresaInstaladoraOInstalador;

        if (this.accion === 'crear') {
          const yaExiste = instaladores.some(
            (i) =>
              String(i.empresaInstaladoraOInstalador).trim().toLowerCase() ===
              String(nombre).trim().toLowerCase(),
          );
          if (yaExiste) {
            this.abrirModalError(
              'Ya existe un instalador con ese nombre de empresa/instalador.',
            );
            this.procesando = false;
            return;
          }
          instaladores.push({ ...this.formularioInstalador });
        }

        if (this.accion === 'editar') {
          const index = instaladores.findIndex(
            (i) =>
              i.empresaInstaladoraOInstalador ===
              this.instaladorSeleccionadoNombre,
          );
          if (index !== -1) {
            instaladores[index] = { ...this.formularioInstalador };
          }
        }

        this.http
          .post('/instaladores', instaladores)
          .subscribe({
            next: () => {
              this.animateProgress(100);
              setTimeout(() => {
                this.procesando = false;
                this.progreso = -1;
                this.abrirModalExito('Cambios guardados correctamente.');
                this.volverAlInicio();
              }, 500);
            },
            error: () => {
              this.abrirModalError('Error al guardar en el servidor.');
              this.procesando = false;
              this.progreso = -1;
            },
          });
      },
      error: () => {
        this.abrirModalError('Error al acceder al servidor.');
        this.procesando = false;
        this.progreso = -1;
      },
    });
  }

  confirmarEliminacion(nombre: string): void {
    this.nombrePendienteBorrar = nombre;
    const modal = new Modal(document.getElementById('modalConfirmacion')!);
    modal.show();
  }

  eliminarInstaladorConfirmado(): void {
    if (!this.nombrePendienteBorrar) return;

    const nombreCodificado = encodeURIComponent(
      this.nombrePendienteBorrar.trim().toLowerCase(),
    );

    this.procesando = true;
    this.animateProgress(70);

    this.http
      .delete(`/instaladores/${nombreCodificado}`)
      .subscribe({
        next: () => {
          this.animateProgress(100);
          setTimeout(() => {
            this.procesando = false;
            this.progreso = -1;
            this.abrirModalExito('Instalador eliminado correctamente.');
            this.volverAlInicio();
          }, 600);
        },
        error: () => {
          this.abrirModalError('Error al eliminar el instalador.');
          this.procesando = false;
          this.progreso = -1;
        },
      });
  }

  private animateProgress(target: number) {
    if (this.progreso >= target) return;
    const step = () => {
      if (this.progreso < target) {
        this.progreso += 2;
        if (this.progreso > target) this.progreso = target;
        setTimeout(step, 20);
      }
    };
    step();
  }

  resetFormulario(): void {
    this.formularioInstalador = {
      empresaInstaladoraOInstalador: '',
      cifODni: '',
    };
  }

  volverAlInicio(): void {
    this.guardado = false;
    this.accion = null;
    this.instaladorSeleccionadoNombre = null;
    this.resetFormulario();
    this.cargarInstaladores();
  }

  abrirModalExito(mensaje: string) {
    const modalEl = document.getElementById('modalExito');
    const body = modalEl?.querySelector('.modal-body p');
    if (body) body.textContent = mensaje;
    if (modalEl) new Modal(modalEl).show();
  }

  abrirModalError(mensaje: string) {
    const modalEl = document.getElementById('modalError');
    const body = modalEl?.querySelector('.modal-body p');
    if (body) body.textContent = mensaje;
    if (modalEl) new Modal(modalEl).show();
  }
}
