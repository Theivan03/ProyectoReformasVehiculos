
import { Component, OnInit } from '@angular/core';
import { SeleccionSeccionesComponent } from '../seleccion-secciones/seleccion-secciones.component';
import { MostrarSeccionesComponent } from '../mostrar-secciones/mostrar-secciones.component';
import { FormularioProyectoComponent } from '../formulario-proyecto/formulario-proyecto.component';
import { GeneradorDocumentosComponent } from '../../generador-documentos/generador-documentos.component';
import { ReformasPreviasComponent } from '../reformas-previas/reformas-previas.component';
import { TipoVehiculoComponent } from '../tipo-vehiculo/tipo-vehiculo.component';
import { ResumenModificacionesComponent } from '../resumen-modificaciones/resumen-modificaciones.component';
import { CocheonoComponent } from '../cocheono/cocheono.component';
import { CanvaComponent } from '../canva/canva.component';
import { ImagenesComponent } from '../imagenes/imagenes.component';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-crear-reforma',
  imports: [
    SeleccionSeccionesComponent,
    MostrarSeccionesComponent,
    FormularioProyectoComponent,
    GeneradorDocumentosComponent,
    ReformasPreviasComponent,
    TipoVehiculoComponent,
    ResumenModificacionesComponent,
    CocheonoComponent,
    CanvaComponent,
    ImagenesComponent
],
  standalone: true,
  templateUrl: './crear-reforma.component.html',
  styleUrl: './crear-reforma.component.css',
})
export class CrearReformaComponent implements OnInit {
  mostrarSeleccion = true;
  mostrarSubSelecciones = false;
  mostrarFormularioProyecto = false;
  mostrarGenerador = false;
  mostrarReformasPrevias = false;
  datosGenerales: any = {};
  mostrarTipoVehiculo = false;
  datosGuardadosTipoVehiculo: any = null;
  mostrarResumenModificaciones = false;
  mostrarCocheOno = false;
  datosResumenModificaciones: any = {};
  mostrarCanva = false;
  mostrarImagenes = false;

  respuestasGuardadas: {
    [codigo: string]: { codigo: string; descripcion: string }[];
  } = {};
  seccionesSeleccionadas: { codigo: string; descripcion: string }[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<void>('http://192.168.1.41:3000/ultimo-proyecto').subscribe({
      next: () => {},
      error: (err) => {
        console.error('No se pudo cargar el último proyecto:', err);
      },
    });
  }

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
    data.paginaActual = 5;
    this.mostrarReformasPrevias = false;
    this.mostrarFormularioProyecto = true;
  }

  onContinuarTipoVehiculo(data: any): void {
    this.datosGuardadosTipoVehiculo = data;

    this.datosGenerales.tipoVehiculo = data.tipoVehiculo;
    this.datosGenerales.modificaciones = data.modificaciones;

    this.datosResumenModificaciones = {
      ...this.datosGenerales,
    };

    this.mostrarTipoVehiculo = false;
    this.mostrarResumenModificaciones = true;
  }

  onVolverDesdeTipoVehiculo(data: any): void {
    this.datosGuardadosTipoVehiculo = data;
    this.datosGenerales.tipoVehiculo = data.tipoVehiculo;
    this.datosGenerales.modificaciones = data.modificaciones;

    this.datosFormularioGuardados = {
      ...this.datosGenerales,
      paginaActual: 5,
    };

    if (this.datosFormularioGuardados.reformasPrevias === true) {
      this.mostrarTipoVehiculo = false;
      this.mostrarReformasPrevias = true;
    } else {
      this.mostrarTipoVehiculo = false;
      this.mostrarFormularioProyecto = true;
    }
  }

  onVolverDesdeResumenModificaciones(data: any): void {
    this.datosResumenModificaciones = data;
    this.datosGuardadosTipoVehiculo = {
      tipoVehiculo: data.tipoVehiculo,
      modificaciones: data.modificaciones,
    };
    this.mostrarResumenModificaciones = false;
    this.mostrarTipoVehiculo = true;
  }

  onContinuarDesdeResumenModificaciones(data: any): void {
    this.mostrarResumenModificaciones = false;
    if (data.tipoVehiculo === 'coche') {
      this.datosGenerales = data;
      this.mostrarCocheOno = true;
    } else {
      this.datosGuardadosTipoVehiculo.opcionesCoche = [
        false,
        false,
        false,
        false,
        false,
      ];
      this.datosGenerales = data;
      this.mostrarCanva = true;
    }
  }

  onVolverDesdeCocheONo(data: any): void {
    this.datosResumenModificaciones = data;
    this.mostrarResumenModificaciones = true;
    this.mostrarCocheOno = false;
  }

  onContinuarDesdeCocheONo(data: any): void {
    this.datosGenerales = data;
    this.mostrarCanva = true;
    this.mostrarCocheOno = false;
  }

  onVolverDesdeCanva(): void {
    this.mostrarCanva = false;
    if (this.datosResumenModificaciones.tipoVehiculo === 'coche') {
      this.mostrarCocheOno = true;
    } else {
      this.mostrarResumenModificaciones = true;
    }
  }

  onContinuarDesdeCanva(data: any): void {
    this.datosGenerales = data;
    this.mostrarImagenes = true;
    this.mostrarCanva = false;
  }

  onVolverDesdeImagenes(data: any): void {
    this.mostrarImagenes = false;
    this.mostrarCanva = true;
  }

  onContinuarDesdeImagenes(data: any): void {
    this.datosGenerales = data;
    this.mostrarGenerador = true;
    this.mostrarImagenes = false;
  }

  onVolverDesdeGenerador(data: any): void {
    this.datosFormularioGuardados = {
      ...data,
      paginaActual: 5,
    };

    this.datosGenerales = data;
    this.mostrarGenerador = false;
    this.mostrarImagenes = true;
  }
}
