import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import talleresData from '../../assets/talleres.json';
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
    this.talleres = guardados ? JSON.parse(guardados) : talleresData;
  }

  ngOnInit() {
    this.http
      .get<any[]>('http://localhost:3000/talleres')
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
    if (taller) {
      this.formularioTaller = { ...taller };
    }
  }

  guardarTaller(): void {
    if (this.accion === 'crear') {
      const yaExiste = this.talleres.some(
        (t) => t.nombre === this.formularioTaller.nombre
      );
      if (yaExiste) {
        alert('Ya existe un taller con ese nombre.');
        return;
      }

      this.talleres.push({ ...this.formularioTaller });
    }

    if (this.accion === 'editar') {
      const index = this.talleres.findIndex(
        (t) => t.nombre === this.tallerSeleccionadoNombre
      );
      if (index !== -1) {
        this.talleres[index] = { ...this.formularioTaller };
        alert('Taller modificado localmente.');
      } else {
        alert('No se encontró el taller a modificar.');
        return;
      }
    }

    // 🔁 Guardar cambios reales en el JSON del servidor
    this.http.post('http://localhost:3000/talleres', this.talleres).subscribe({
      next: () => {
        alert('Cambios guardados correctamente en el archivo.');
        this.resetFormulario();
        this.accion = null;
        this.tallerSeleccionadoNombre = null;
      },
      error: () => {
        alert('Hubo un error al guardar en el servidor.');
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
