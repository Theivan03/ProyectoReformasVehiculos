import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Modal } from 'bootstrap';
import { generarInformeProyecto } from '../../funciones/generarInformeProyecto';

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

    console.log('📤 Enviando datos al servidor...', this.reformaData);

    // Excluimos imágenes para tratarlas aparte
    const { prevImages, postImages, ...soloDatos } = this.reformaData;

    // Añadimos flag de envío por cliente
    const datosConEstado = {
      ...soloDatos,
      enviadoPorCliente: true,
    };

    form.append('metadata', JSON.stringify(datosConEstado));

    // Subir imágenes previas
    if (Array.isArray(prevImages)) {
      prevImages.forEach((file: File, idx: number) => {
        form.append('prevImage', file, file.name || `prev-${idx}.png`);
      });
    }

    // Subir imágenes posteriores
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
        next: async (event: HttpEvent<any>) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            const porcentaje = Math.round((100 * event.loaded) / event.total);
            this.animateProgress(porcentaje);
          } else if (event.type === HttpEventType.Response) {
            this.animateProgress(100);

            const elapsed = Date.now() - startTime;
            const remaining = Math.max(1000 - elapsed, 0);

            setTimeout(async () => {
              try {
                console.log('🟢 Generando documento DOCX en cliente...');

                // 1️⃣ Generar DOCX en cliente (devuelve Blob)
                const blob = await generarInformeProyecto(this.reformaData);

                console.log(
                  `📄 Documento generado (${blob.size} bytes). Enviando al servidor...`
                );

                // 2️⃣ Enviar DOCX al servidor
                const formDocx = new FormData();
                formDocx.append(
                  'docx',
                  blob,
                  `${this.reformaData.referenciaProyecto}.docx`
                );
                formDocx.append(
                  'referenciaProyecto',
                  this.reformaData.referenciaProyecto
                );

                const docxUrl = 'http://192.168.1.41:3000/guardar-docx';
                await this.http.post(docxUrl, formDocx).toPromise();

                console.log(
                  `✅ Documento DOCX guardado correctamente en el servidor: ${this.reformaData.referenciaProyecto}.docx`
                );
              } catch (docxErr) {
                console.error(
                  '❌ Error generando o enviando el DOCX:',
                  docxErr
                );
              }

              // 3️⃣ Mostrar modal de éxito
              this.abrirModalExito();
              this.guardando = false;
              this.progreso = -1;
            }, remaining);
          }
        },
        error: (err) => {
          console.error('❌ Error al guardar el proyecto:', err);
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

  async enviarDocxAlServidor(data: any) {
    try {
      // 1️⃣ Generamos el DOCX en cliente
      const blob = await generarInformeProyecto(data); // función modificada para devolver Blob

      // 2️⃣ Lo enviamos al servidor
      const formData = new FormData();
      formData.append('docx', blob, `${data.referenciaProyecto}.docx`);
      formData.append('referenciaProyecto', data.referenciaProyecto);

      const url = 'http://192.168.1.41:3000/guardar-docx';
      const respuesta = await this.http.post(url, formData).toPromise();

      console.log('✅ Documento subido:', respuesta);
    } catch (err) {
      console.error('Error enviando DOCX:', err);
    }
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
