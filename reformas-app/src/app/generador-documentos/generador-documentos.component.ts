import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { generarDocumentoProyecto } from '../generadores/proyecto-word';
import { generarDocumentoFinalObra } from '../generadores/certificado-final-obra';
import { generarDocumentoTaller } from '../generadores/certificado-taller';
import { generarDocumentoResponsable } from '../generadores/declaracion-responsable';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable } from 'rxjs';
import saveAs from 'file-saver';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { buildModificacionesParagraphs } from '../Funciones/buildModificacionesParagraphs';
import { generarDocumentoMemoria } from '../generadores/memoria-tecnica';

@Component({
  selector: 'app-generador-documentos',
  imports: [CommonModule, FormsModule],
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
    buildModificacionesParagraphs(
      this.reformaData.modificaciones,
      this.reformaData
    );
  }

  async generar(tipo: string): Promise<void> {
    switch (tipo) {
      case 'proyecto':
        this.isLoading = true;
        await new Promise((resolve) => setTimeout(resolve, 0));

        try {
          const blobDocx: Blob = await generarDocumentoProyecto(
            this.reformaData
          );
          const nombreBase =
            `${this.reformaData.referenciaProyecto} PROYECTO ` +
            `${this.reformaData.marca} ${this.reformaData.modelo} ${this.reformaData.matricula}`;

          saveAs(blobDocx, `${nombreBase}.docx`);
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

      case 'memoria-tecnica':
        this.generarMemoria();
        break;
    }
  }

  // 🔹 Declaración Responsable con comunidad seleccionada
  generarDeclaracion(comunidad: 'valenciana' | 'murcia' | 'andalucia') {
    const dataCompleta = {
      ...this.reformaData,
      comunidad: comunidad,
    };

    generarDocumentoResponsable(dataCompleta);
  }

  comunidadSeleccionada: string | null = null;
  provinciaSeleccionada: string | null = null;

  provinciasAndalucia = [
    'Almería',
    'Cádiz',
    'Córdoba',
    'Granada',
    'Huelva',
    'Jaén',
    'Málaga',
    'Sevilla',
  ];

  seleccionarComunidad(comunidad: string) {
    this.comunidadSeleccionada = comunidad;
    this.provinciaSeleccionada = null;
  }

  generarMemoria() {
    generarDocumentoMemoria(this.reformaData);
  }

  confirmarDeclaracion() {
    const dataCompleta = {
      ...this.reformaData,
      comunidad: this.comunidadSeleccionada,
      provincia:
        this.comunidadSeleccionada === 'andalucia'
          ? this.provinciaSeleccionada
          : null,
    };

    generarDocumentoResponsable(dataCompleta);
  }

  guardarDB() {
    const url = 'http://192.168.1.41:3000/guardar-proyecto';

    const form = new FormData();
    form.append('metadata', JSON.stringify(this.reformaData));

    if (Array.isArray(this.reformaData.prevImages)) {
      this.reformaData.prevImages.forEach((file: File, idx: number) => {
        form.append('prevImage', file, file.name || `prev-${idx}.png`);
      });
    }

    if (Array.isArray(this.reformaData.postImages)) {
      this.reformaData.postImages.forEach((file: File, idx: number) => {
        form.append('postImage', file, file.name || `post-${idx}.png`);
      });
    }

    this.http
      .post<{ message: string; proyecto: string }>(url, form, {
        reportProgress: true,
        observe: 'events',
      })
      .subscribe(
        (event: HttpEvent<any>) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            this.progreso = Math.round((100 * event.loaded) / event.total);
          } else if (event.type === HttpEventType.Response) {
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
