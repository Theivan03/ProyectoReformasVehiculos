import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-gestionar-ingeniero',
  standalone: true,
  imports: [FormsModule, HttpClientModule],
  templateUrl: './gestionar-ingeniero.component.html',
  styleUrl: './gestionar-ingeniero.component.css',
})
export class GestionarIngenieroComponent {
  guardado = false;
  accion: 'crear' | 'editar' | null = null;
  ingenieros: any[] = [];
  ingenieroSeleccionadoNombre: string | null = null;
  progreso = -1;
  procesando = false;
  nombrePendienteBorrar: string | null = null;

  formularioIngeniero: any = {
    nombre: '',
    dni: '',
    direccionFiscal: '',
    oficina: '',
    codigoPostal: '',
    localidad: '',
    provincia: '',
    titulacion: '',
    especialidad: '',
    colegio: '',
    numero: '',
    correo: '',
    tlf: '',
    web: '',
    url: '',
    correoEmpresa: '',
    colegiado: '',
    textoLegal: '',
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargarIngenieros();
  }

  cargarIngenieros(): void {
    this.http.get<any>('http://192.168.1.41:3000/ingenieros').subscribe({
      next: (data) => {
        this.ingenieros = Array.isArray(data) ? data : [data];
      },
      error: (err) => {
        console.error('Error al cargar ingenieros:', err);
        this.ingenieros = [];
      },
    });
  }

  seleccionarAccion(tipo: 'crear' | 'editar'): void {
    this.accion = tipo;
    this.ingenieroSeleccionadoNombre = null;
    this.resetFormulario();
  }

  cargarIngeniero(): void {
    const ing = this.ingenieros.find(
      (i) => i.nombre === this.ingenieroSeleccionadoNombre
    );

    if (ing) {
      this.formularioIngeniero = { ...ing };
    } else {
      this.abrirModalError('Ingeniero no encontrado.');
    }
  }

  guardarIngeniero(): void {
    this.procesando = true;
    this.progreso = 0;
    this.animateProgress(60);

    this.http.get<any>('http://192.168.1.41:3000/ingenieros').subscribe({
      next: (data) => {
        const ingenieros = Array.isArray(data) ? data : [data];
        const nombre = this.formularioIngeniero.nombre;

        this.formularioIngeniero.colegiado = `Colegiado ${this.formularioIngeniero.numero} - ${this.formularioIngeniero.colegio}`;
        this.formularioIngeniero.textoLegal =
          `EL PRESENTE DOCUMENTO ES COPIA DE SU ORIGINAL DEL QUE ES AUTOR EL INGENIERO ${this.formularioIngeniero.nombre}. ` +
          `SU UTILIZACIÓN TOTAL O PARCIAL, ASÍ COMO CUALQUIER CESIÓN A TERCEROS O REPRODUCCIÓN, ` +
          `REQUIERE LA PREVIA AUTORIZACIÓN EXPRESA DE SU AUTOR QUEDANDO EN TODO CASO PROHIBIDA CUALQUIER MODIFICACIÓN UNILATERAL DEL MISMO.`;

        if (this.accion === 'crear') {
          const yaExiste = ingenieros.some((i) => i.nombre === nombre);
          if (yaExiste) {
            this.abrirModalError('Ya existe un ingeniero con ese nombre.');
            this.procesando = false;
            return;
          }
          ingenieros.push({ ...this.formularioIngeniero });
        }

        if (this.accion === 'editar') {
          const index = ingenieros.findIndex(
            (i) => i.nombre === this.ingenieroSeleccionadoNombre
          );
          if (index !== -1) {
            ingenieros[index] = { ...this.formularioIngeniero };
          }
        }

        this.http
          .post('http://192.168.1.41:3000/ingenieros', ingenieros)
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

  eliminarIngenieroConfirmado(): void {
    if (!this.nombrePendienteBorrar) return;

    const nombreCodificado = encodeURIComponent(
      this.nombrePendienteBorrar.trim().toLowerCase()
    );

    this.procesando = true;
    this.animateProgress(70);

    this.http
      .delete(`http://192.168.1.41:3000/ingenieros/${nombreCodificado}`)
      .subscribe({
        next: () => {
          this.animateProgress(100);
          setTimeout(() => {
            this.procesando = false;
            this.progreso = -1;
            this.abrirModalExito('Ingeniero eliminado correctamente.');
            this.volverAlInicio();
          }, 600);
        },
        error: () => {
          this.abrirModalError('Error al eliminar el ingeniero.');
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
    this.formularioIngeniero = {
      nombre: '',
      dni: '',
      direccionFiscal: '',
      oficina: '',
      codigoPostal: '',
      localidad: '',
      provincia: '',
      titulacion: '',
      especialidad: '',
      colegio: '',
      numero: '',
      correo: '',
      tlf: '',
      web: '',
      url: '',
      correoEmpresa: '',
      colegiado: '',
      textoLegal: '',
    };
  }

  volverAlInicio(): void {
    this.guardado = false;
    this.accion = null;
    this.ingenieroSeleccionadoNombre = null;
    this.resetFormulario();
    this.cargarIngenieros();
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
