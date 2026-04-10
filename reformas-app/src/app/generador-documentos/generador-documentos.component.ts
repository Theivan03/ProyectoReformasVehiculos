import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ChangeDetectorRef,
} from '@angular/core';
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
  progreso: number = -1;
  isLoading = false;
  tallerConProyecto: boolean | null = null;
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

  @Input() reformaData: any;
  @Input() esEdicion = false;
  @Output() volverAlFormulario = new EventEmitter<void>();

  constructor(
    private http: HttpClient,
    private cdrGenerador: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    console.log('Modificaciones:', this.reformaData);
    buildModificacionesParagraphs(
      this.reformaData.modificaciones,
      this.reformaData,
      true,
    );
  }

  async generar(tipo: string, proyecto?: any): Promise<void> {
    switch (tipo) {
      case 'proyecto':
        this.isLoading = true;
        this.cdrGenerador.detectChanges();
        await new Promise((resolve) => setTimeout(resolve, 50));

        try {
          const blobDocx: Blob = await generarDocumentoProyecto(
            this.reformaData,
          );

          const refProyGenerador = this.reformaData.referenciaProyecto || '';
          const marcaProyGenerador = this.reformaData.marca || '';
          const modeloProyGenerador = this.reformaData.modelo || '';
          const matriculaProyGenerador = this.reformaData.matricula || '';

          const nombreBase =
            `${refProyGenerador} PROYECTO ${marcaProyGenerador} ${modeloProyGenerador} ${matriculaProyGenerador}`.trim();

          saveAs(blobDocx, `${nombreBase}.docx`);
        } catch (errGenerador) {
          console.error('Error generando DOCX:', errGenerador);
          alert('Ha ocurrido un error al crear el DOCX.');
        } finally {
          this.isLoading = false;
          this.cdrGenerador.detectChanges();
        }
        break;

      case 'certificado-obra':
        generarDocumentoFinalObra(this.reformaData);
        break;

      case 'certificado-taller':
        generarDocumentoTaller(this.reformaData, proyecto);
        break;

      case 'memoria-tecnica':
        this.generarMemoria();
        break;
    }
  }

  generarDeclaracion(comunidad: 'valenciana' | 'murcia' | 'andalucia') {
    const dataCompleta = {
      ...this.reformaData,
      comunidad: comunidad,
    };

    generarDocumentoResponsable(dataCompleta);
  }

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
    const url = '/guardar-proyecto';

    const form = new FormData();
    form.append('metadata', JSON.stringify(this.reformaData));
    form.append('esEdicion', String(this.esEdicion));

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
        (errDB) => {
          console.error('Error guardando proyecto:', errDB);
          alert('Ha ocurrido un error al guardar el proyecto.');
          this.progreso = -1;
        },
      );
  }

  volver(): void {
    this.volverAlFormulario.emit();
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
