import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-editar-reforma',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './editar-reforma.component.html',
  styleUrl: './editar-reforma.component.css',
})
export class EditarReformaComponent implements OnInit {
  /** Cambia aquí la IP/puerto del backend */
  private readonly apiBase = 'http://192.168.1.41:3000';

  proyectos: any[] = [];
  cargando = false;
  error: string | null = null;

  proyectoSeleccionado: any = null;
  modalInstance: any;

  // filtros
  filtroMarca = '';
  filtroMatricula = '';
  filtroPropietario = '';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.cargarProyectos();
  }

  cargarProyectos(
    filtros: { marca?: string; matricula?: string; propietario?: string } = {}
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
        console.error('Error cargando proyectos', err);
        this.error =
          'No se pudieron cargar los proyectos. ¿El servidor en 192.168.1.41:3000 está encendido y accesible desde este dispositivo?';
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
    if (p?.enviadoPorCliente) {
      this.proyectoSeleccionado = p;
      const modalEl = document.getElementById('modalSelectorProyecto');
      if (modalEl) {
        this.modalInstance = new Modal(modalEl);
        this.modalInstance.show();
      }
    } else {
      this.irAModificarProyecto(p.id);
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
          // No persistimos las imágenes base64 en localStorage para no reventarlo
          const { prevImagesB64, postImagesB64, ...rest } = data || {};
          localStorage.setItem('proyectoSeleccionado', JSON.stringify(rest));

          this.router.navigate(['/crear-reforma'], {
            queryParams: { editId: proyectoId },
          });
        },
        error: (err) => {
          console.error('Error cargando proyecto', err);
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

  private irAModificarProyecto(proyectoId: string) {
    this.router.navigate(['/crear-reforma'], {
      queryParams: { editId: proyectoId },
    });
  }
}
