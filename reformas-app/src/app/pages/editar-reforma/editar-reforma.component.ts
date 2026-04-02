import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Modal } from 'bootstrap';
import { GeneradorDocumentosComponent } from '../../generador-documentos/generador-documentos.component';

@Component({
  selector: 'app-editar-reforma',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    GeneradorDocumentosComponent,
  ],
  templateUrl: './editar-reforma.component.html',
  styleUrl: './editar-reforma.component.css',
})
export class EditarReformaComponent implements OnInit {
  private readonly apiBase = '';

  proyectos: any[] = [];
  cargando = false;
  error: string | null = null;

  proyectoSeleccionado: any = null;
  modalSelectorProyectoExternoInstance: any;
  modalSelectorProyectoInternoInstance: any;

  filtroMarca = '';
  filtroMatricula = '';
  filtroPropietario = '';

  mostrandoGeneradorDocumentos = false;
  proyectoDataCompleto: any = null;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit() {
    this.cargarProyectos();
  }

  cargarProyectos(
    filtros: { marca?: string; matricula?: string; propietario?: string } = {},
  ) {
    this.cargando = true;
    this.error = null;

    let params = new HttpParams();
    if (filtros.marca) params = params.set('marca', filtros.marca);
    if (filtros.matricula) params = params.set('matricula', filtros.matricula);
    if (filtros.propietario)
      params = params.set('propietario', filtros.propietario);

    this.http.get<any[]>(`${this.apiBase}/proyectos`, { params }).subscribe({
      next: (data) => {
        this.proyectos = data || [];
        this.cargando = false;
      },
      error: (err) => {
        this.error =
          'No se pudieron cargar los proyectos. Verifica que el backend esté levantado en el puerto 3000.';
        this.cargando = false;
      },
    });
  }

  buscar() {
    this.cargarProyectos({
      marca: this.filtroMarca.trim(),
      matricula: this.filtroMatricula.trim(),
      propietario: this.filtroPropietario.trim(),
    });
  }

  seleccionarProyecto(p: any) {
    this.proyectoSeleccionado = p;
    if (p?.enviadoPorCliente) {
      const modalEl = document.getElementById('modalSelectorProyecto');
      if (modalEl) {
        this.modalSelectorProyectoExternoInstance = new Modal(modalEl);
        this.modalSelectorProyectoExternoInstance.show();
      }
    } else {
      const modalIntEl = document.getElementById(
        'modalSelectorProyectoInterno',
      );
      if (modalIntEl) {
        this.modalSelectorProyectoInternoInstance = new Modal(modalIntEl);
        this.modalSelectorProyectoInternoInstance.show();
      }
    }
  }

  modificarProyecto() {
    if (!this.proyectoSeleccionado) return;
    const proyectoId = this.proyectoSeleccionado.id;

    this.http
      .get(`${this.apiBase}/proyectos/${proyectoId}/proyecto.json`)
      .subscribe({
        next: (data: any) => {
          localStorage.setItem('proyectoSeleccionadoId', proyectoId);
          const { prevImagesB64, postImagesB64, ...rest } = data || {};
          localStorage.setItem('proyectoSeleccionado', JSON.stringify(rest));

          this.router.navigate(['/crear-reforma'], {
            queryParams: { editId: proyectoId },
          });
        },
        error: (err) => {
          this.error = 'No se pudo cargar el proyecto seleccionado.';
        },
      });
  }

  descargarDocx() {
    if (!this.proyectoSeleccionado?.nombre) return;

    const referencia = this.proyectoSeleccionado.nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\/\\:*?"<>|]/g, '-')
      .trim();

    const url = `${this.apiBase}/documentos_generados/${referencia}.docx`;

    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `${referencia}.docx`;
    enlace.target = '_blank';
    enlace.click();
  }

  irAModificarProyectoInterno() {
    if (!this.proyectoSeleccionado) return;
    this.router.navigate(['/crear-reforma'], {
      queryParams: { editId: this.proyectoSeleccionado.id },
    });
  }

  abrirGeneradorDocumentos() {
    if (!this.proyectoSeleccionado) return;
    const proyectoId = this.proyectoSeleccionado.id;

    this.cargando = true;
    this.http
      .get(`${this.apiBase}/proyectos/${proyectoId}/proyecto.json`)
      .subscribe({
        next: async (data: any) => {
          // ¡Hacemos la función asíncrona!

          try {
            // 1. Clonamos el dato para no mutar el objeto original accidentalmente
            const proyectoDataCompleto = JSON.parse(JSON.stringify(data));

            // 2. Hidratar imágenes Previas (De Base64 a Blob/Buffer)
            if (Array.isArray(proyectoDataCompleto.prevImagesB64)) {
              proyectoDataCompleto.prevImages = await Promise.all(
                proyectoDataCompleto.prevImagesB64.map((b64: string) =>
                  this.dataUrlToBlob(b64),
                ),
              );
            } else {
              proyectoDataCompleto.prevImages = [];
            }

            // 3. Hidratar imágenes Posteriores (De Base64 a Blob/Buffer)
            if (Array.isArray(proyectoDataCompleto.postImagesB64)) {
              proyectoDataCompleto.postImages = await Promise.all(
                proyectoDataCompleto.postImagesB64.map((b64: string) =>
                  this.dataUrlToBlob(b64),
                ),
              );
            } else {
              proyectoDataCompleto.postImages = [];
            }

            // NOTA: Si 'proyecto-word.ts' también necesita la firma y el plano hidratados,
            // deberías descargarlos aquí si vienen como URL. Si 'proyecto-word.ts' ya sabe
            // manejar URLs, no hace falta.

            this.proyectoDataCompleto = proyectoDataCompleto;
            this.mostrandoGeneradorDocumentos = true;
            this.cargando = false;
          } catch (error) {
            console.error('Error al hidratar las imágenes:', error);
            this.error =
              'Error interno preparando las imágenes para el documento.';
            this.cargando = false;
          }
        },
        error: (err) => {
          this.error =
            'No se pudo cargar la información del proyecto para generar documentos.';
          this.cargando = false;
        },
      });
  }

  // --- FUNCIÓN AUXILIAR (La misma que usas en ImagenesComponent) ---
  private async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const res = await fetch(dataUrl);
    return await res.blob();
  }

  cerrarGeneradorDocumentos() {
    this.mostrandoGeneradorDocumentos = false;
    this.proyectoDataCompleto = null;
  }
}
