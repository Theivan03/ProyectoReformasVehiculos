import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-gestionar-taller',
  imports: [CommonModule, FormsModule, HttpClientModule],
  standalone: true,
  templateUrl: './gestionar-taller.component.html',
  styleUrl: './gestionar-taller.component.css',
})
export class GestionarTallerComponent {
  guardado = false;
  accion: 'crear' | 'editar' | null = null;
  talleres: any[] = [];
  tallerSeleccionadoNombre: string | null = null;

  formularioTaller: any = {
    nombre: '',
    direccion: '',
    poblacion: '',
    provincia: '',
    registroIndustrial: '',
    registroEspecial: '',
    responsable: '',
    telefono: '',
    especialidad: '',
  };

  constructor(private http: HttpClient) {
    // Cargar talleres desde localStorage o desde el JSON original
    const guardados = localStorage.getItem('talleres');
  }

  ngOnInit() {
    this.http
      .get<any[]>('http://192.168.1.41:3000/talleres')
      .subscribe((data) => (this.talleres = data));
  }

  seleccionarAccion(tipo: 'crear' | 'editar'): void {
    this.accion = tipo;
    this.tallerSeleccionadoNombre = null;
    this.resetFormulario();
  }

  cargarTaller(): void {
    const taller = this.talleres.find(
      (t) => t.nombre === this.tallerSeleccionadoNombre
    );
    console.log('Taller cargado:', taller); // ✅ Verifica que sea el taller completo

    if (taller) {
      this.formularioTaller = { ...taller };
    } else {
      console.warn('Taller no encontrado para cargar');
    }
  }

  guardarTaller(): void {
    this.http.get<any[]>('http://192.168.1.41:3000/talleres').subscribe({
      next: (talleres) => {
        const nombre = this.formularioTaller.nombre;

        if (this.accion === 'crear') {
          const yaExiste = talleres.some((t) => t.nombre === nombre);
          if (yaExiste) {
            alert('Ya existe un taller con ese nombre en el servidor.');
            return;
          }

          talleres.push({ ...this.formularioTaller });
        }

        if (this.accion === 'editar') {
          const index = talleres.findIndex(
            (t) => t.nombre === this.tallerSeleccionadoNombre
          );
          if (index !== -1) {
            talleres[index] = { ...this.formularioTaller };
          }
        }

        this.http
          .post('http://192.168.1.41:3000/talleres', talleres)
          .subscribe({
            next: () => {
              this.guardado = true;
              this.volverAlInicio();
            },
            error: () => {
              alert('Hubo un error al guardar en el servidor.');
            },
          });
      },
      error: () => {
        alert('No se pudo comprobar si el taller ya existe.');
      },
    });
  }

  eliminarTaller(): void {
    const nombre = this.formularioTaller?.nombre?.trim().toLowerCase();

    const confirmacion = confirm(`¿Eliminar el taller "${nombre}"?`);
    if (!confirmacion) return;

    const nombreCodificado = encodeURIComponent(nombre);

    this.http
      .delete(`http://192.168.1.41:3000/talleres/${nombreCodificado}`)
      .subscribe({
        next: () => {
          alert('Taller eliminado correctamente.');
          this.volverAlInicio();
        },
        error: (err) => {
          console.error('Error al eliminar:', err);
          alert(`No se pudo eliminar el taller "${nombre}".`);
        },
      });
  }

  resetFormulario(): void {
    this.formularioTaller = {
      nombre: '',
      direccion: '',
      poblacion: '',
      provincia: '',
      registroIndustrial: '',
      registroEspecial: '',
      responsable: '',
      telefono: '',
      especialidad: '',
    };
  }

  volverAlInicio(): void {
    this.guardado = false;
    this.accion = null;
    this.tallerSeleccionadoNombre = null;
    this.resetFormulario();

    // ✅ refrescar talleres desde el servidor
    this.http
      .get<any[]>('http://192.168.1.41:3000/talleres')
      .subscribe((data) => (this.talleres = data));
  }

  seguirEditando(): void {
    this.guardado = false;
    this.resetFormulario();
  }

  formatLabel(campo: string): string {
    return campo
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (c) => c.toUpperCase());
  }
}
