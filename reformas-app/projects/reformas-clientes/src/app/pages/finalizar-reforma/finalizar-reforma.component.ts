import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-finalizar-reforma',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './finalizar-reforma.component.html',
  styleUrl: './finalizar-reforma.component.css',
})
export class FinalizarReformaComponent {
  constructor(private http: HttpClient) {}

  @Input() reformaData: any;
  @Output() volverAlFormulario = new EventEmitter<any>();

  progreso: number = -1;
  guardando = false;

  proyectoGuardado: string = '';

  // -------- Enviar datos + imágenes al servidor --------
  guardarDB() {
    if (!this.reformaData) {
      this.abrirModalError();
      return;
    }

    this.guardando = true;
    this.progreso = 0;

    const url = 'http://192.168.1.41:3000/guardar-proyecto';
    const form = new FormData();

    const { prevImages, postImages, ...soloDatos } = this.reformaData;
    form.append('metadata', JSON.stringify(soloDatos));

    if (Array.isArray(prevImages)) {
      prevImages.forEach((file: File, idx: number) => {
        form.append('prevImage', file, file.name || `prev-${idx}.png`);
      });
    }
    if (Array.isArray(postImages)) {
      postImages.forEach((file: File, idx: number) => {
        form.append('postImage', file, file.name || `post-${idx}.png`);
      });
    }

    const startTime = Date.now();

    this.http
      .post<{ message: string; proyecto: string }>(url, form, {
        reportProgress: true,
        observe: 'events',
      })
      .subscribe({
        next: (event: HttpEvent<any>) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            // Calcula porcentaje real
            const porcentaje = Math.round((100 * event.loaded) / event.total);
            this.animateProgress(porcentaje);
          } else if (event.type === HttpEventType.Response) {
            // Fuerza que llegue a 100% suavemente
            this.animateProgress(100);

            // Espera mínimo 1 segundo antes de cerrar
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(1000 - elapsed, 0);

            setTimeout(() => {
              this.abrirModalExito();
              this.guardando = false;
              this.progreso = -1;
            }, remaining);
          }
        },
        error: (err) => {
          console.error('Error guardando proyecto:', err);
          this.abrirModalError();
          this.guardando = false;
          this.progreso = -1;
        },
      });
  }

  private animateProgress(target: number) {
    if (this.progreso >= target) return;

    const step = () => {
      if (this.progreso < target) {
        this.progreso += 2; // velocidad de subida
        if (this.progreso > target) this.progreso = target;
        setTimeout(step, 20); // cada 20ms sube
      }
    };
    step();
  }

  // -------- Botón volver --------
  volver(): void {
    this.volverAlFormulario.emit(this.reformaData);
  }

  // -------- Abrir/Cerrar modales con Bootstrap --------
  abrirModalExito() {
    const modalEl = document.getElementById('modalExito');
    if (modalEl) {
      const modal = new Modal(modalEl);
      modal.show();
    }
  }

  abrirModalError() {
    const modalEl = document.getElementById('modalError');
    if (modalEl) {
      const modal = new Modal(modalEl);
      modal.show();
    }
  }

  cerrarModal() {
    const modalEl1 = document.getElementById('modalExito');
    const modalEl2 = document.getElementById('modalError');

    if (modalEl1) {
      const modal = Modal.getInstance(modalEl1);
      modal?.hide();
    }
    if (modalEl2) {
      const modal = Modal.getInstance(modalEl2);
      modal?.hide();
    }
  }
}
