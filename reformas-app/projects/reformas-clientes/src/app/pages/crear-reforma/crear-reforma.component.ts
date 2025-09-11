import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  ActivatedRoute,
  ParamMap,
  Router,
  NavigationStart,
} from '@angular/router';
import { Subscription } from 'rxjs';

// Hijos standalone (ajusta paths si difieren)
import { SeleccionSeccionesComponent } from '../seleccion-secciones/seleccion-secciones.component';
import { MostrarSeccionesComponent } from '../mostrar-secciones/mostrar-secciones.component';
import { FormularioProyectoComponent } from '../formulario-proyecto/formulario-proyecto.component';
import { ReformasPreviasComponent } from '../reformas-previas/reformas-previas.component';
import { ResumenModificacionesComponent } from '../resumen-modificaciones/resumen-modificaciones.component';
import { TipoVehiculoComponent } from '../tipo-vehiculo/tipo-vehiculo.component';
import { CocheonoComponent } from '../cocheono/cocheono.component';
import { CanvaComponent } from '../canva/canva.component';
import { ImagenesComponent } from '../imagenes/imagenes.component';
import { FinalizarReformaComponent } from '../finalizar-reforma/finalizar-reforma.component';

type Step =
  | 'seleccion'
  | 'subseleccion'
  | 'formulario'
  | 'reformas-previas'
  | 'tipo-vehiculo'
  | 'resumen'
  | 'coche-o-no'
  | 'canva'
  | 'imagenes'
  | 'finalizar';

const STORAGE_KEY = 'reforma-wizard-v1';

interface SavedState {
  step: Step;
  codigosPreseleccionados?: any;
  seccionesSeleccionadas?: any;
  respuestasGuardadas?: any;
  datosFormularioGuardados?: any;
  datosGenerales?: any;
  datosGuardadosTipoVehiculo?: any;
  datosResumenModificaciones?: any;
}

@Component({
  selector: 'app-crear-reforma',
  standalone: true,
  imports: [
    CommonModule,
    SeleccionSeccionesComponent,
    MostrarSeccionesComponent,
    FormularioProyectoComponent,
    ReformasPreviasComponent,
    TipoVehiculoComponent,
    ResumenModificacionesComponent,
    CocheonoComponent,
    CanvaComponent,
    ImagenesComponent,
    FinalizarReformaComponent,
  ],
  templateUrl: './crear-reforma.component.html',
})
export class CrearReformaComponent implements OnInit, OnDestroy {
  step: Step = 'seleccion';

  // Estado compartido con hijos
  codigosPreseleccionados: any = undefined;
  seccionesSeleccionadas: any = undefined;
  respuestasGuardadas: any = undefined;
  datosFormularioGuardados: any = undefined;
  datosGenerales: any = undefined;
  datosGuardadosTipoVehiculo: any = undefined;
  datosResumenModificaciones: any = undefined;

  private routeSub?: Subscription;
  private routerSub?: Subscription;
  private isPopstate = false;

  private beforeUnloadHandler = (_e: BeforeUnloadEvent) => {
    try {
      this.persist();
    } catch {}
  };

  constructor(private route: ActivatedRoute, private router: Router) {}

  resetReforma() {
    try {
      // Borra todos los datos guardados en navegador
      localStorage.clear();
      sessionStorage.clear();

      // Reinicia el estado interno de la app
      this.step = 'seleccion';
      this.codigosPreseleccionados = undefined;
      this.seccionesSeleccionadas = undefined;
      this.respuestasGuardadas = undefined;
      this.datosFormularioGuardados = undefined;
      this.datosGenerales = undefined;
      this.datosGuardadosTipoVehiculo = undefined;
      this.datosResumenModificaciones = undefined;

      // Navega a la primera pantalla
      this.router.navigate(['/reforma', 'seleccion']);
    } catch (e) {
      console.error('Error al reiniciar la reforma:', e);
    }
  }

  // Getters para el template
  get mostrarSeleccion() {
    return this.step === 'seleccion';
  }
  get mostrarSubSelecciones() {
    return this.step === 'subseleccion';
  }
  get mostrarFormularioProyecto() {
    return this.step === 'formulario';
  }
  get mostrarReformasPrevias() {
    return this.step === 'reformas-previas';
  }
  get mostrarTipoVehiculo() {
    return this.step === 'tipo-vehiculo';
  }
  get mostrarResumenModificaciones() {
    return this.step === 'resumen';
  }
  get mostrarCocheOno() {
    return this.step === 'coche-o-no';
  }
  get mostrarCanva() {
    return this.step === 'canva';
  }
  get mostrarImagenes() {
    return this.step === 'imagenes';
  }
  get mostrarFinalizar() {
    return this.step === 'finalizar';
  }

  // -------- resolución de paso (evita bucles) --------
  private resolveStep(desired: Step): Step {
    switch (desired) {
      case 'subseleccion':
        return this.seccionesSeleccionadas?.length
          ? 'subseleccion'
          : 'seleccion';

      case 'formulario':
        return this.respuestasGuardadas &&
          Object.keys(this.respuestasGuardadas).length
          ? 'formulario'
          : this.resolveStep('subseleccion');

      default:
        return desired; // 'seleccion' y los demás por defecto
    }
  }

  // -------- ciclo de vida --------
  ngOnInit(): void {
    // Detectar navegación de historial (Atrás/Adelante)
    this.routerSub = this.router.events.subscribe((e) => {
      if (e instanceof NavigationStart) {
        this.isPopstate = !!e.restoredState;
      }
    });

    this.restore();

    this.routeSub = this.route.paramMap.subscribe((p: ParamMap) => {
      const requested = (p.get('step') as Step | null) ?? 'seleccion';
      const saved = this.readStorage();
      const fresh = this.route.snapshot.queryParamMap.get('fresh');

      // Auto-resume SOLO si no venimos de popstate (para no romper el botón Atrás)
      if (
        !this.isPopstate &&
        requested === 'seleccion' &&
        saved?.step &&
        saved.step !== 'seleccion' &&
        !fresh
      ) {
        const target = this.resolveStep(saved.step);
        // Recoloca a último paso, pero reemplazando URL solo esta vez
        this.step = target;
        this.persist();
        this.router.navigate(['/reforma', target], { replaceUrl: true });
        return;
      }

      // En el resto de casos, respeta lo que hay en la URL (con saneo)
      const target = this.resolveStep(requested);
      this.step = target;
      this.persist();
      // No navegamos si la URL ya es correcta; evitar “parpadeos”
      // (Si quisieras normalizar, podrías navegar cuando target !== requested)
    });

    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.routerSub?.unsubscribe();
    window.removeEventListener('beforeunload', this.beforeUnloadHandler);
  }

  // -------- navegación de botones --------
  navigate(next: Step) {
    this.step = this.resolveStep(next);
    this.persist();
    // Aquí SÍ añadimos al historial para que Atrás vaya paso a paso
    this.router.navigate(['/reforma', this.step]);
  }

  // -------- persistencia --------
  private persist() {
    const snapshot: SavedState = {
      step: this.step,
      codigosPreseleccionados: this.codigosPreseleccionados,
      seccionesSeleccionadas: this.seccionesSeleccionadas,
      respuestasGuardadas: this.respuestasGuardadas,
      datosFormularioGuardados: this.datosFormularioGuardados,
      datosGenerales: this.datosGenerales,
      datosGuardadosTipoVehiculo: this.datosGuardadosTipoVehiculo,
      datosResumenModificaciones: this.datosResumenModificaciones,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {}
  }

  private readStorage(): SavedState | null {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch {
      return null;
    }
  }

  private restore() {
    const saved = this.readStorage();
    if (!saved) return;
    this.step = saved.step ?? 'seleccion';
    this.codigosPreseleccionados = saved.codigosPreseleccionados;
    this.seccionesSeleccionadas = saved.seccionesSeleccionadas;
    this.respuestasGuardadas = saved.respuestasGuardadas;
    this.datosFormularioGuardados = saved.datosFormularioGuardados;
    this.datosGenerales = saved.datosGenerales;
    this.datosGuardadosTipoVehiculo = saved.datosGuardadosTipoVehiculo;
    this.datosResumenModificaciones = saved.datosResumenModificaciones;
  }

  // -------- handlers de hijos --------
  onContinuar(secciones: { codigo: string; descripcion: string }[]) {
    this.seccionesSeleccionadas = Array.isArray(secciones) ? secciones : [];
    this.codigosPreseleccionados = this.seccionesSeleccionadas.map(
      (s: { codigo: any }) => s.codigo
    );
    this.navigate('subseleccion');
  }

  volverASeleccionDesdeSubseleccion() {
    this.navigate('seleccion');
  }

  onFinalizarRecoleccion(event: any) {
    this.respuestasGuardadas = event || {};
    this.navigate('formulario');
  }

  onAutosaveFormulario(event: { datos: any; paginaActual: number }) {
    if (!event) return;
    this.datosFormularioGuardados = {
      ...event.datos,
      paginaActual: event.paginaActual ?? event.datos?.paginaActual ?? 1,
    };
    this.persist();
  }

  onVolverDesdeFormulario(event?: any) {
    const datos = event?.datosFormulario ?? event?.datos ?? event ?? null;
    const pagina =
      event?.pagina ?? event?.paginaActual ?? datos?.paginaActual ?? 1;
    if (datos)
      this.datosFormularioGuardados = { ...datos, paginaActual: pagina };
    this.persist();
    this.navigate('subseleccion');
  }

  onFinalizarFormulario(event: any) {
    if (event) {
      this.datosFormularioGuardados = { ...event, paginaActual: 1 };
      this.datosGenerales = event;
    }
    const reformas =
      event?.reformasPrevias ??
      event?.datos?.reformasPrevias ??
      this.datosFormularioGuardados?.reformasPrevias ??
      false;

    this.persist();
    this.navigate(reformas ? 'reformas-previas' : 'tipo-vehiculo');
  }

  onAutosaveReformasPrevias(data: any) {
    this.datosGenerales = { ...(this.datosGenerales || {}), ...(data || {}) };
    this.persist();
  }

  onVolverDesdeReformasPrevias(event?: any) {
    if (event)
      this.datosGenerales = { ...(this.datosGenerales || {}), ...event };
    this.datosGenerales = {
      ...(this.datosGenerales || {}),
      reformasPrevias: true,
    };
    this.datosFormularioGuardados = {
      ...(this.datosFormularioGuardados || {}),
      ...this.datosGenerales,
      paginaActual: 999,
    };
    this.persist();
    this.navigate('formulario');
  }

  onContinuarDesdeReformasPrevias(event: any) {
    if (event)
      this.datosGenerales = { ...(this.datosGenerales || {}), ...event };
    this.persist();
    this.navigate('tipo-vehiculo');
  }

  onAutosaveTipoVehiculo(event: {
    tipoVehiculo: string;
    modificaciones: any[];
  }) {
    if (!event) return;
    this.datosGuardadosTipoVehiculo = {
      ...(this.datosGuardadosTipoVehiculo || {}),
      ...event,
    };
    this.datosGenerales = { ...(this.datosGenerales || {}), ...event };
    this.persist();
  }

  onVolverDesdeTipoVehiculo(event?: any) {
    if (event?.datos) this.datosGuardadosTipoVehiculo = event.datos;
    else if (event) this.datosGuardadosTipoVehiculo = event;

    this.persist();

    if (this.datosGenerales?.reformasPrevias === true) {
      this.navigate('reformas-previas');
      return;
    }
    this.datosFormularioGuardados = {
      ...(this.datosFormularioGuardados || {}),
      paginaActual: 999,
    };
    this.persist();
    this.navigate('formulario');
  }

  onContinuarTipoVehiculo(event: any) {
    if (event) {
      this.datosGuardadosTipoVehiculo = event;
      this.datosGenerales = { ...(this.datosGenerales || {}), ...event };
    }
    this.persist();
    this.navigate('resumen');
  }

  get datosParaResumen(): any {
    const base = this.datosGenerales || {};
    const mods =
      this.datosGuardadosTipoVehiculo?.modificaciones ??
      this.datosGenerales?.modificaciones ??
      [];
    return { ...base, modificaciones: mods };
  }

  onVolverDesdeResumenModificaciones(event?: any) {
    if (event?.datos) this.datosResumenModificaciones = event.datos;
    else if (event) this.datosResumenModificaciones = event;

    this.datosGuardadosTipoVehiculo = {
      ...(this.datosGuardadosTipoVehiculo || {}),
      tipoVehiculo:
        event?.tipoVehiculo ??
        this.datosResumenModificaciones?.tipoVehiculo ??
        this.datosGuardadosTipoVehiculo?.tipoVehiculo,
      modificaciones:
        event?.modificaciones ??
        this.datosResumenModificaciones?.modificaciones ??
        this.datosGuardadosTipoVehiculo?.modificaciones,
    };

    this.persist();
    this.navigate('tipo-vehiculo');
  }

  onContinuarDesdeResumenModificaciones(event: any) {
    if (event) {
      this.datosResumenModificaciones = {
        ...(this.datosResumenModificaciones || {}),
        ...event,
      };
      this.datosGenerales = { ...(this.datosGenerales || {}), ...event };
    }

    const tipo = (
      event?.tipoVehiculo ??
      this.datosGuardadosTipoVehiculo?.tipoVehiculo ??
      this.datosGenerales?.tipoVehiculo ??
      ''
    )
      .toString()
      .trim()
      .toLowerCase();

    this.persist();
    this.navigate(tipo === 'coche' ? 'coche-o-no' : 'canva');
  }

  onAutosaveCocheONo(event: any) {
    if (!event) return;
    this.datosGenerales = { ...(this.datosGenerales || {}), ...event };
    this.datosGuardadosTipoVehiculo = {
      ...(this.datosGuardadosTipoVehiculo || {}),
      tipoVehiculo:
        event.tipoVehiculo ?? this.datosGuardadosTipoVehiculo?.tipoVehiculo,
      modificaciones:
        event.modificaciones ?? this.datosGuardadosTipoVehiculo?.modificaciones,
      opcionesCoche:
        event.opcionesCoche ?? this.datosGuardadosTipoVehiculo?.opcionesCoche,
    };
    this.persist();
  }

  onVolverDesdeCocheONo(event?: any) {
    if (event) {
      this.datosGenerales = { ...(this.datosGenerales || {}), ...event };
      this.datosGuardadosTipoVehiculo = {
        ...(this.datosGuardadosTipoVehiculo || {}),
        tipoVehiculo:
          event.tipoVehiculo ?? this.datosGuardadosTipoVehiculo?.tipoVehiculo,
        modificaciones:
          event.modificaciones ??
          this.datosGuardadosTipoVehiculo?.modificaciones,
        opcionesCoche:
          event.opcionesCoche ?? this.datosGuardadosTipoVehiculo?.opcionesCoche,
      };
    }
    this.persist();
    this.navigate('resumen');
  }

  onContinuarDesdeCocheONo(event: any) {
    if (event) {
      this.datosGenerales = { ...(this.datosGenerales || {}), ...event };
      this.datosGuardadosTipoVehiculo = {
        ...(this.datosGuardadosTipoVehiculo || {}),
        tipoVehiculo:
          event.tipoVehiculo ?? this.datosGuardadosTipoVehiculo?.tipoVehiculo,
        modificaciones:
          event.modificaciones ??
          this.datosGuardadosTipoVehiculo?.modificaciones,
        opcionesCoche:
          event.opcionesCoche ?? this.datosGuardadosTipoVehiculo?.opcionesCoche,
      };
    }
    this.persist();
    this.navigate('canva');
  }

  onAutosaveCanva(event: any) {
    if (!event) return;
    this.datosGenerales = { ...(this.datosGenerales || {}), ...event };
    this.datosGuardadosTipoVehiculo = {
      ...(this.datosGuardadosTipoVehiculo || {}),
      tipoVehiculo:
        event.tipoVehiculo ?? this.datosGuardadosTipoVehiculo?.tipoVehiculo,
      modificaciones:
        event.modificaciones ?? this.datosGuardadosTipoVehiculo?.modificaciones,
      opcionesCoche:
        event.opcionesCoche ?? this.datosGuardadosTipoVehiculo?.opcionesCoche,
      marcadores:
        event.marcadores ?? this.datosGuardadosTipoVehiculo?.marcadores,
    };
    this.persist();
  }

  onVolverDesdeCanva(event?: any) {
    // 1) mergea lo que venga del Canva
    if (event) {
      this.datosGenerales = { ...(this.datosGenerales || {}), ...event };
      this.datosResumenModificaciones = {
        ...(this.datosResumenModificaciones || {}),
        ...event,
      };
    }

    // 2) detecta el tipo desde cualquier fuente fiable
    const tipo = (
      this.datosGuardadosTipoVehiculo?.tipoVehiculo ??
      this.datosGenerales?.tipoVehiculo ??
      ''
    )
      .toString()
      .trim()
      .toLowerCase();

    // 3) persiste y navega al paso correcto
    this.persist();
    if (tipo === 'coche') {
      this.navigate('coche-o-no'); // si es coche, vuelve al paso “coche-o-no”
    } else {
      this.navigate('resumen'); // si NO es coche, vuelve a “resumen-modificaciones”
    }
  }

  onContinuarDesdeCanva(event: any) {
    if (event) {
      this.datosGenerales = { ...(this.datosGenerales || {}), ...event };
      this.datosResumenModificaciones = {
        ...(this.datosResumenModificaciones || {}),
        ...event,
      };
    }
    this.persist();
    this.navigate('imagenes');
  }

  onAutosaveImagenes(event: any) {
    if (!event) return;
    this.datosGenerales = { ...(this.datosGenerales || {}), ...event };
    this.datosResumenModificaciones = {
      ...(this.datosResumenModificaciones || {}),
      ...event,
    };
    this.persist();
  }

  onVolverDesdeImagenes(event?: any) {
    if (event) {
      this.datosGenerales = { ...(this.datosGenerales || {}), ...event };
      this.datosResumenModificaciones = {
        ...(this.datosResumenModificaciones || {}),
        ...event,
      };
    }
    this.persist();
    this.navigate('canva');
  }

  onContinuarDesdeImagenes(event: any) {
    if (event) {
      this.datosGenerales = { ...(this.datosGenerales || {}), ...event };
      this.datosResumenModificaciones = {
        ...(this.datosResumenModificaciones || {}),
        ...event,
      };
    }
    this.persist();
    this.navigate('finalizar');
  }

  onVolverDesdeFinalizar(event?: any) {
    if (event?.datos) this.datosGenerales = event.datos;
    this.navigate('imagenes');
  }
}
