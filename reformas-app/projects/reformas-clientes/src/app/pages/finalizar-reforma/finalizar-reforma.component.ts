import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';

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

  // 🔹 Enviar datos + imágenes al servidor
  guardarDB() {
    if (!this.reformaData) {
      alert('No hay datos de la reforma para guardar.');
      return;
    }

    this.guardando = true;
    const url = 'http://192.168.1.41:3000/guardar-proyecto';
    const form = new FormData();

    // 📌 JSON con metadatos (sin blobs dentro)
    const { prevImages, postImages, ...soloDatos } = this.reformaData;
    form.append('metadata', JSON.stringify(soloDatos));

    // 📌 imágenes previas
    if (Array.isArray(prevImages)) {
      prevImages.forEach((file: File, idx: number) => {
        form.append('prevImage', file, file.name || `prev-${idx}.png`);
      });
    }

    // 📌 imágenes posteriores
    if (Array.isArray(postImages)) {
      postImages.forEach((file: File, idx: number) => {
        form.append('postImage', file, file.name || `post-${idx}.png`);
      });
    }

    this.http
      .post<{ message: string; proyecto: string }>(url, form, {
        reportProgress: true,
        observe: 'events',
      })
      .subscribe({
        next: (event: HttpEvent<any>) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            this.progreso = Math.round((100 * event.loaded) / event.total);
          } else if (event.type === HttpEventType.Response) {
            alert(`✅ Proyecto ${event.body.proyecto} guardado correctamente`);
            this.guardando = false;
            this.progreso = -1;
          }
        },
        error: (err) => {
          console.error('Error guardando proyecto:', err);
          alert('❌ Ha ocurrido un error al guardar el proyecto.');
          this.guardando = false;
          this.progreso = -1;
        },
      });
  }

  // 🔹 Volver al paso anterior
  volver() {
    this.volverAlFormulario.emit(this.reformaData);
  }
}
