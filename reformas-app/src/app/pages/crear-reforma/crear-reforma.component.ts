import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SeleccionSeccionesComponent } from '../seleccion-secciones/seleccion-secciones.component';
import { MostrarSeccionesComponent } from '../mostrar-secciones/mostrar-secciones.component';
import { FormularioProyectoComponent } from '../formulario-proyecto/formulario-proyecto.component';
import { GeneradorDocumentosComponent } from '../../generador-documentos/generador-documentos.component';
import { ReformasPreviasComponent } from '../reformas-previas/reformas-previas.component';

@Component({
  selector: 'app-crear-reforma',
  imports: [
    CommonModule,
    SeleccionSeccionesComponent,
    MostrarSeccionesComponent,
    FormularioProyectoComponent,
    GeneradorDocumentosComponent,
    ReformasPreviasComponent,
  ],
  standalone: true,
  templateUrl: './crear-reforma.component.html',
  styleUrl: './crear-reforma.component.css',
})
export class CrearReformaComponent {
  mostrarSeleccion = true;
  mostrarSubSelecciones = false;
  mostrarFormularioProyecto = false;
  mostrarGenerador = false;
  mostrarReformasPrevias = false;
  datosGenerales: any = {};

  respuestasGuardadas: {
    [codigo: string]: { codigo: string; descripcion: string }[];
  } = {};
  seccionesSeleccionadas: { codigo: string; descripcion: string }[] = [];

  onSeleccionCompletada(secciones: { codigo: string; descripcion: string }[]) {
    this.seccionesSeleccionadas = secciones;
    this.mostrarSeleccion = true;
  }

  onContinuar(secciones: { codigo: string; descripcion: string }[]) {
    const codigosNuevos = secciones.map((s) => s.codigo);
    const nuevasRespuestas: {
      [codigo: string]: { codigo: string; descripcion: string }[];
    } = {};
    for (const cod of codigosNuevos) {
      if (this.respuestasGuardadas[cod]) {
        nuevasRespuestas[cod] = this.respuestasGuardadas[cod];
      }
    }

    this.respuestasGuardadas = nuevasRespuestas;
    this.seccionesSeleccionadas = secciones;
    this.mostrarSeleccion = false;
    this.mostrarSubSelecciones = true;
  }

  get codigosPreseleccionados(): string[] {
    return this.seccionesSeleccionadas.map((s) => s.codigo);
  }

  datosFormularioGuardados: any;

  onVolverDesdeFormulario(event: any): void {
    this.datosFormularioGuardados = {
      ...event.datosFormulario,
      paginaActual: 1,
    };
    this.mostrarFormularioProyecto = false;
    this.mostrarSubSelecciones = true;
  }

  onFinalizarRecoleccion(respuestas: any): void {
    this.respuestasGuardadas = respuestas;

    // Ocultar selección y mostrar el formulario
    this.mostrarSeleccion = false;
    this.mostrarSubSelecciones = false;
    this.mostrarFormularioProyecto = true;
  }

  onVolverDesdeGenerador(data: any): void {
    this.datosFormularioGuardados = data;
    data.paginaActual = 4;
    this.mostrarGenerador = false;
    if (data.reformasPrevias) {
      this.mostrarReformasPrevias = true;
    } else {
      this.mostrarFormularioProyecto = true;
    }
  }

  onFinalizarFormulario(data: any): void {
    this.datosGenerales = data;
    if (data.reformasPrevias === true) {
      this.mostrarFormularioProyecto = false;
      this.mostrarReformasPrevias = true;
    } else {
      this.mostrarFormularioProyecto = false;
      this.mostrarGenerador = true;
    }
  }

  irAGenerador(datos: any): void {
    this.datosGenerales = datos;
    this.mostrarReformasPrevias = false;
    this.mostrarGenerador = true;
  }

  onVolverDesdeReformasPrevias(data: any): void {
    this.datosFormularioGuardados = data;
    data.paginaActual = 4;
    this.mostrarReformasPrevias = false;
    this.mostrarFormularioProyecto = true;
  }
}
