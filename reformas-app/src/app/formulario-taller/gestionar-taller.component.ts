import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-gestionar-taller',
  standalone: true,
  imports: [FormsModule, HttpClientModule],
  templateUrl: './gestionar-taller.component.html',
  styleUrl: './gestionar-taller.component.css',
})
export class GestionarTallerComponent {
  guardado = false;
  accion: 'crear' | 'editar' | null = null;
  talleres: any[] = [];
  tallerSeleccionadoNombre: string | null = null;
  progreso = -1;
  procesando = false;
  nombrePendienteBorrar: string | null = null;

  formularioTaller: any = {
    nombre: '',
    direccion: '',
    poblacion: '',
    provincia: '',
    registroIndustrial: '',
    registroEspecial: '',
    responsable: '',
    telefono: '',
    especialidad: '',
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargarTalleres();
  }

  cargarTalleres(): void {
    this.http.get<any>('http://192.168.1.41:3000/talleres').subscribe({
      next: (data) => {
        this.talleres = Array.isArray(data) ? data : [data];
      },
      error: (err) => {
        console.error('Error al cargar talleres:', err);
        this.talleres = [];
      },
    });
  }

  seleccionarAccion(tipo: 'crear' | 'editar'): void {
    this.accion = tipo;
    this.tallerSeleccionadoNombre = null;
    this.resetFormulario();
  }

  cargarTaller(): void {
    const taller = this.talleres.find(
      (t) => t.nombre === this.tallerSeleccionadoNombre
    );

    if (taller) {
      this.formularioTaller = { ...taller };
    } else {
      this.abrirModalError('Taller no encontrado.');
    }
  }

  guardarTaller(): void {
    this.procesando = true;
    this.progreso = 0;
    this.animateProgress(60);

    this.http.get<any>('http://192.168.1.41:3000/talleres').subscribe({
      next: (data) => {
        const talleres = Array.isArray(data) ? data : [data];
        const nombre = this.formularioTaller.nombre;

        if (this.accion === 'crear') {
          const yaExiste = talleres.some((t) => t.nombre === nombre);
          if (yaExiste) {
            this.abrirModalError('Ya existe un taller con ese nombre.');
            this.procesando = false;
            return;
          }
          talleres.push({ ...this.formularioTaller });
        }

        if (this.accion === 'editar') {
          const index = talleres.findIndex(
            (t) => t.nombre === this.tallerSeleccionadoNombre
          );
          if (index !== -1) {
            talleres[index] = { ...this.formularioTaller };
          }
        }

        this.http
          .post('http://192.168.1.41:3000/talleres', talleres)
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
              this.abrirModalError('Hubo un error al guardar en el servidor.');
              this.procesando = false;
              this.progreso = -1;
            },
          });
      },
      error: () => {
        this.abrirModalError('No se pudo conectar con el servidor.');
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

  eliminarTallerConfirmado(): void {
    if (!this.nombrePendienteBorrar) return;

    const nombreCodificado = encodeURIComponent(
      this.nombrePendienteBorrar.trim().toLowerCase()
    );

    this.procesando = true;
    this.animateProgress(70);

    this.http
      .delete(`http://192.168.1.41:3000/talleres/${nombreCodificado}`)
      .subscribe({
        next: () => {
          this.animateProgress(100);
          setTimeout(() => {
            this.procesando = false;
            this.progreso = -1;
            this.abrirModalExito('Taller eliminado correctamente.');
            this.volverAlInicio();
          }, 600);
        },
        error: () => {
          this.abrirModalError('No se pudo eliminar el taller.');
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
    this.formularioTaller = {
      nombre: '',
      direccion: '',
      poblacion: '',
      provincia: '',
      registroIndustrial: '',
      registroEspecial: '',
      responsable: '',
      telefono: '',
      especialidad: '',
    };
  }

  volverAlInicio(): void {
    this.guardado = false;
    this.accion = null;
    this.tallerSeleccionadoNombre = null;
    this.resetFormulario();
    this.cargarTalleres();
  }

  formatLabel(campo: string): string {
    return campo
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (c) => c.toUpperCase());
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
