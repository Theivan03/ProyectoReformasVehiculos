import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-gestionar-arquitectos',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './gestionar-arquitectos.component.html',
  styleUrl: './gestionar-arquitectos.component.css',
})
export class GestionarArquitectosComponent {
  guardado = false;
  accion: 'crear' | 'editar' | null = null;
  arquitectos: any[] = [];
  arquitectoSeleccionadoNombre: string | null = null;
  progreso = -1;
  procesando = false;
  nombrePendienteBorrar: string | null = null;

  formularioArquitecto: any = {
    nombre: '',
    dni: '',
    direccionFiscal: '',
    codigoPostal: '',
    localidad: '',
    provincia: '',
    titulacion: '',
    colegio: '',
    universidad: '',
    numero: '',
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargarArquitectos();
  }

  cargarArquitectos(): void {
    this.http.get<any>('http://192.168.1.41:3000/arquitectos').subscribe({
      next: (data) => {
        this.arquitectos = Array.isArray(data) ? data : [data];
      },
      error: (err) => {
        console.error('Error al cargar arquitectos:', err);
        this.arquitectos = [];
      },
    });
  }

  seleccionarAccion(tipo: 'crear' | 'editar'): void {
    this.accion = tipo;
    this.arquitectoSeleccionadoNombre = null;
    this.resetFormulario();
  }

  cargarArquitecto(): void {
    const ing = this.arquitectos.find(
      (i) => i.nombre === this.arquitectoSeleccionadoNombre
    );

    if (ing) {
      this.formularioArquitecto = { ...ing };
    } else {
      this.abrirModalError('Arquitecto no encontrado.');
    }
  }

  guardarArquitecto(): void {
    this.procesando = true;
    this.progreso = 0;
    this.animateProgress(60);

    this.http.get<any>('http://192.168.1.41:3000/arquitectos').subscribe({
      next: (data) => {
        const arquitectos = Array.isArray(data) ? data : [data];
        const nombre = this.formularioArquitecto.nombre;

        this.formularioArquitecto.colegiado = `Colegiado ${this.formularioArquitecto.numero} - ${this.formularioArquitecto.colegio}`;
        this.formularioArquitecto.textoLegal =
          `EL PRESENTE DOCUMENTO ES COPIA DE SU ORIGINAL DEL QUE ES AUTOR EL ARQUITECTO ${this.formularioArquitecto.nombre}. ` +
          `SU UTILIZACIÓN TOTAL O PARCIAL, ASÍ COMO CUALQUIER CESIÓN A TERCEROS O REPRODUCCIÓN, ` +
          `REQUIERE LA PREVIA AUTORIZACIÓN EXPRESA DE SU AUTOR QUEDANDO EN TODO CASO PROHIBIDA CUALQUIER MODIFICACIÓN UNILATERAL DEL MISMO.`;

        if (this.accion === 'crear') {
          const yaExiste = arquitectos.some((i) => i.nombre === nombre);
          if (yaExiste) {
            this.abrirModalError('Ya existe un arquitecto con ese nombre.');
            this.procesando = false;
            return;
          }
          arquitectos.push({ ...this.formularioArquitecto });
        }

        if (this.accion === 'editar') {
          const index = arquitectos.findIndex(
            (i) => i.nombre === this.arquitectoSeleccionadoNombre
          );
          if (index !== -1) {
            arquitectos[index] = { ...this.formularioArquitecto };
          }
        }

        this.http
          .post('http://192.168.1.41:3000/arquitectos', arquitectos)
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

  eliminarArquitectoConfirmado(): void {
    if (!this.nombrePendienteBorrar) return;

    const nombreCodificado = encodeURIComponent(
      this.nombrePendienteBorrar.trim().toLowerCase()
    );

    this.procesando = true;
    this.animateProgress(70);

    this.http
      .delete(`http://192.168.1.41:3000/arquitectos/${nombreCodificado}`)
      .subscribe({
        next: () => {
          this.animateProgress(100);
          setTimeout(() => {
            this.procesando = false;
            this.progreso = -1;
            this.abrirModalExito('Arquitecto eliminado correctamente.');
            this.volverAlInicio();
          }, 600);
        },
        error: () => {
          this.abrirModalError('Error al eliminar el arquitecto.');
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
    this.formularioArquitecto = {
      nombre: '',
      dni: '',
      direccionFiscal: '',
      codigoPostal: '',
      localidad: '',
      provincia: '',
      titulacion: '',
      colegio: '',
      universidad: '',
      numero: '',
    };
  }

  volverAlInicio(): void {
    this.guardado = false;
    this.accion = null;
    this.arquitectoSeleccionadoNombre = null;
    this.resetFormulario();
    this.cargarArquitectos();
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
