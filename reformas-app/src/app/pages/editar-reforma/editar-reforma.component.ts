import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-editar-reforma',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './editar-reforma.component.html',
  styleUrl: './editar-reforma.component.css',
})
export class EditarReformaComponent implements OnInit {
  proyectos: any[] = [];
  cargando = false;
  error: string | null = null;

  // Filtros
  filtroMarca: string = '';
  filtroMatricula: string = '';
  filtroPropietario: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.cargarProyectos(); // carga inicial
  }

  cargarProyectos(filtros: any = {}) {
    this.cargando = true;
    const params: any = {};

    if (filtros.marca) params.marca = filtros.marca;
    if (filtros.matricula) params.matricula = filtros.matricula;
    if (filtros.propietario) params.propietario = filtros.propietario;
    if (filtros.enviadoPorCliente)
      params.enviadoPorCliente = filtros.enviadoPorCliente;

    this.http
      .get<any[]>('http://localhost:3000/proyectos', { params })
      .subscribe({
        next: (data) => {
          this.proyectos = data;
          this.cargando = false;
        },
        error: (err) => {
          console.error('Error cargando proyectos', err);
          this.error = 'No se pudieron cargar los proyectos';
          this.cargando = false;
        },
      });
  }

  buscar() {
    this.cargarProyectos({
      marca: this.filtroMarca,
      matricula: this.filtroMatricula,
      propietario: this.filtroPropietario,
    });
  }

  seleccionarProyecto(proyectoId: string) {
    this.http
      .get(`http://localhost:3000/proyectos/${proyectoId}/proyecto.json`)
      .subscribe({
        next: (data: {
          prevImagesB64?: any;
          postImagesB64?: any;
          [key: string]: any;
        }) => {
          localStorage.setItem('proyectoSeleccionadoId', proyectoId);
          const { prevImagesB64, postImagesB64, ...rest } = data;
          localStorage.setItem('proyectoSeleccionado', JSON.stringify(rest));

          this.router.navigate(['/crear-reforma'], {
            queryParams: { editId: proyectoId },
          });
        },
        error: (err) => {
          console.error('Error cargando proyecto', err);
          this.error = 'No se pudo cargar el proyecto';
        },
      });
  }
}
