import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { generarDocumentoProyecto } from '../generadores/proyecto-word';
import { generarDocumentoFinalObra } from '../generadores/certificado-final-obra';
import { generarDocumentoTaller } from '../generadores/certificado-taller';
import { generarDocumentoResponsable } from '../generadores/declaracion-responsable';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable } from 'rxjs';
import saveAs from 'file-saver';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-generador-documentos',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './generador-documentos.component.html',
  styleUrl: './generador-documentos.component.css',
})
export class GeneradorDocumentosComponent implements OnInit {
  constructor(private http: HttpClient) {}

  progreso: number = -1;
  isLoading = false;

  @Input() reformaData: any;
  @Output() volverAlFormulario = new EventEmitter<void>();

  ngOnInit(): void {
    console.log('Datos de reforma recibidos:', this.reformaData);
    console.log(
      'Datos de reforma recibidos:\n',
      JSON.stringify(this.reformaData, null, 2)
    );
  }

  async generar(tipo: string): Promise<void> {
    switch (tipo) {
      case 'proyecto':
        this.isLoading = true;
        // Permitimos que Angular pinte el overlay antes del trabajo pesado
        await new Promise((resolve) => setTimeout(resolve, 0));

        try {
          // 1) Generar .docx
          const blobDocx: Blob = await generarDocumentoProyecto(
            this.reformaData
          );
          const nombreBase =
            `${this.reformaData.referenciaProyecto} PROYECTO ` +
            `${this.reformaData.marca} ${this.reformaData.modelo} ${this.reformaData.matricula}`;

          // 2) Descargar .docx
          saveAs(blobDocx, `${nombreBase}.docx`);

          // 3) Enviar al servidor para convertir a PDF
          // const formData = new FormData();
          // formData.append('doc', blobDocx, `${nombreBase}.docx`);

          // this.http
          //   .post('http://192.168.1.41:3000/convertir-docx-a-pdf', formData, {
          //     responseType: 'blob',
          //   })
          //   .subscribe({
          //     next: (blobPdf: Blob) => {
          //       // 4) Descargar PDF
          //       saveAs(blobPdf, `${nombreBase}.pdf`);
          //       this.isLoading = false;
          //     },
          //     error: (err) => {
          //       console.error('Error generando PDF:', err);
          //       alert('No se pudo generar el PDF en el servidor.');
          //       this.isLoading = false;
          //     },
          //   });
          this.isLoading = false;
        } catch (err) {
          console.error('Error generando DOCX:', err);
          alert('Ha ocurrido un error al crear el DOCX.');
          this.isLoading = false;
        }
        break;
      case 'certificado-obra':
        generarDocumentoFinalObra(this.reformaData);
        break;
      case 'certificado-taller':
        generarDocumentoTaller(this.reformaData);
        break;
      case 'declaracion-responsable':
        generarDocumentoResponsable(this.reformaData);
        break;
    }
  }

  guardarDB() {
    const url = 'http://192.168.1.41:3000/guardar-proyecto';

    // 1) Montamos el FormData
    const form = new FormData();
    // a) metadata
    form.append('metadata', JSON.stringify(this.reformaData));

    // b) imágenes previas
    if (Array.isArray(this.reformaData.prevImages)) {
      this.reformaData.prevImages.forEach((file: File, idx: number) => {
        form.append('prevImage', file, file.name || `prev-${idx}.png`);
      });
    }

    // c) imágenes posteriores
    if (Array.isArray(this.reformaData.postImages)) {
      this.reformaData.postImages.forEach((file: File, idx: number) => {
        form.append('postImage', file, file.name || `post-${idx}.png`);
      });
    }

    // 2) Envío con progreso opcional
    this.http
      .post<{ message: string; proyecto: string }>(url, form, {
        reportProgress: true,
        observe: 'events',
      })
      .subscribe(
        (event: HttpEvent<any>) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            // Calculamos el porcentaje de subida
            this.progreso = Math.round((100 * event.loaded) / event.total);
          } else if (event.type === HttpEventType.Response) {
            // Respuesta final del servidor
            console.log('Respuesta servidor:', event.body);
            alert(`Proyecto ${event.body.proyecto} guardado correctamente`);
            this.progreso = -1;
          }
        },
        (err) => {
          console.error('Error guardando proyecto:', err);
          alert('Ha ocurrido un error al guardar el proyecto.');
          this.progreso = -1;
        }
      );
  }

  volver(): void {
    this.volverAlFormulario.emit(this.reformaData);
  }

  sendDocxToPdf(file: Blob): Observable<Blob> {
    const formData = new FormData();
    formData.append('doc', file, 'document.docx');
    return this.http.post('/convertir-docx-a-pdf', formData, {
      responseType: 'blob',
    });
  }

  convertAndDownload(file: Blob) {
    this.sendDocxToPdf(file).subscribe((pdfBlob) => {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'documento.pdf';
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}
