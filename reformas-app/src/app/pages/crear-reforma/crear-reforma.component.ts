import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SeleccionSeccionesComponent } from '../seleccion-secciones/seleccion-secciones.component';
import { MostrarSeccionesComponent } from '../mostrar-secciones/mostrar-secciones.component';
import { FormularioProyectoComponent } from '../formulario-proyecto/formulario-proyecto.component';
import { GeneradorDocumentosComponent } from '../../generador-documentos/generador-documentos.component';
import { ReformasPreviasComponent } from '../reformas-previas/reformas-previas.component';
import { TipoVehiculoComponent } from '../tipo-vehiculo/tipo-vehiculo.component';

@Component({
  selector: 'app-crear-reforma',
  imports: [
    CommonModule,
    SeleccionSeccionesComponent,
    MostrarSeccionesComponent,
    FormularioProyectoComponent,
    GeneradorDocumentosComponent,
    ReformasPreviasComponent,
    TipoVehiculoComponent,
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
  mostrarTipoVehiculo = false;
  datosGuardadosTipoVehiculo: any = null;

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

  onFinalizarRecoleccion(respuestas: any): void {
    this.respuestasGuardadas = respuestas;

    // Ocultar selección y mostrar el formulario
    this.mostrarSeleccion = false;
    this.mostrarSubSelecciones = false;
    this.mostrarFormularioProyecto = true;
  }

  onVolverDesdeFormulario(event: any): void {
    this.datosFormularioGuardados = {
      ...event.datosFormulario,
      paginaActual: 1,
    };
    this.mostrarFormularioProyecto = false;
    this.mostrarSubSelecciones = true;
  }

  onFinalizarFormulario(data: any): void {
    this.datosGenerales = data;
    if (data.reformasPrevias === true) {
      this.mostrarFormularioProyecto = false;
      this.mostrarReformasPrevias = true;
    } else {
      this.mostrarFormularioProyecto = false;
      this.mostrarTipoVehiculo = true;
    }
  }

  onContinuarDesdeReformasPrevias(datos: any): void {
    this.datosGenerales = datos;
    this.mostrarReformasPrevias = false;
    this.mostrarTipoVehiculo = true;
  }

  onVolverDesdeReformasPrevias(data: any): void {
    this.datosFormularioGuardados = data;
    data.paginaActual = 4;
    this.mostrarReformasPrevias = false;
    this.mostrarFormularioProyecto = true;
  }

  onContinuarTipoVehiculo(data: any): void {
    this.datosGuardadosTipoVehiculo = data;

    this.datosGenerales.tipoVehiculo = data.tipoVehiculo;
    this.datosGenerales.modificaciones = data.modificaciones;
    this.mostrarTipoVehiculo = false;
    this.mostrarGenerador = true;
  }

  onVolverDesdeTipoVehiculo(data: any): void {
    this.datosGuardadosTipoVehiculo = data;
    this.datosGenerales.tipoVehiculo = data.tipoVehiculo;
    this.datosGenerales.modificaciones = data.modificaciones;

    this.datosFormularioGuardados = {
      ...this.datosGenerales,
      paginaActual: 4,
    };

    if (this.datosFormularioGuardados.reformasPrevias === true) {
      this.mostrarTipoVehiculo = false;
      this.mostrarReformasPrevias = true;
    } else {
      this.mostrarTipoVehiculo = false;
      this.mostrarFormularioProyecto = true;
    }
  }

  onVolverDesdeGenerador(data: any): void {
    this.datosFormularioGuardados = {
      ...data,
      paginaActual: 4,
    };

    this.datosGenerales = data;
    this.mostrarGenerador = false;
    this.mostrarTipoVehiculo = true;
  }
}
