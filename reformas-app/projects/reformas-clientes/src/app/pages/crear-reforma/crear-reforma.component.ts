import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  ActivatedRoute,
  ParamMap,
  Router,
  NavigationStart,
} from '@angular/router';
import { Subscription } from 'rxjs';

// Hijos standalone (ajusta paths si difieren)
import { FormularioProyectoComponent } from '../formulario-proyecto/formulario-proyecto.component';
import { ResumenModificacionesComponent } from '../resumen-modificaciones/resumen-modificaciones.component';
import { TipoVehiculoComponent } from '../tipo-vehiculo/tipo-vehiculo.component';
import { ImagenesComponent } from '../imagenes/imagenes.component';
import { FinalizarReformaComponent } from '../finalizar-reforma/finalizar-reforma.component';

type Step =
  | 'formulario'
  | 'reformas-previas'
  | 'tipo-vehiculo'
  | 'resumen'
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
  prevImagesB64?: string[];
  postImagesB64?: string[];
}

@Component({
  selector: 'app-crear-reforma',
  standalone: true,
  imports: [
    CommonModule,
    FormularioProyectoComponent,
    TipoVehiculoComponent,
    ResumenModificacionesComponent,
    ImagenesComponent,
    FinalizarReformaComponent,
  ],
  templateUrl: './crear-reforma.component.html',
})
export class CrearReformaComponent implements OnInit, OnDestroy {
  step: Step = 'tipo-vehiculo';

  // Estado compartido con hijos
  codigosPreseleccionados: any = undefined;
  seccionesSeleccionadas: any = undefined;
  respuestasGuardadas: any = undefined;
  datosFormularioGuardados: any = undefined;
  datosGenerales: any = undefined;
  datosGuardadosTipoVehiculo: any = undefined;
  datosResumenModificaciones: any = undefined;

  @ViewChild(TipoVehiculoComponent) tipoVehiculoComp!: TipoVehiculoComponent;

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
      localStorage.clear();
      sessionStorage.clear();

      this.step = 'tipo-vehiculo';
      this.codigosPreseleccionados = undefined;
      this.seccionesSeleccionadas = undefined;
      this.respuestasGuardadas = undefined;
      this.datosFormularioGuardados = undefined;
      this.datosGenerales = undefined;
      this.datosGuardadosTipoVehiculo = undefined;
      this.datosResumenModificaciones = undefined;

      // Navega
      this.router.navigate(['/reforma', 'tipo-vehiculo']).then(() => {
        // Reinicia el estado interno del componente
        if (this.tipoVehiculoComp) {
          this.tipoVehiculoComp.resetComponent();
        }
      });
    } catch (e) {
      console.error('Error al reiniciar la reforma:', e);
    }
  }

  // Getters para el template
  get mostrarFormularioProyecto() {
    return this.step === 'formulario';
  }
  get mostrarTipoVehiculo() {
    return this.step === 'tipo-vehiculo';
  }
  get mostrarResumenModificaciones() {
    return this.step === 'resumen';
  }
  get mostrarImagenes() {
    return this.step === 'imagenes';
  }
  get mostrarFinalizar() {
    return this.step === 'finalizar';
  }

  // -------- resolución de paso (evita bucles) --------
  private resolveStep(desired: Step): Step {
    return desired; // 'seleccion' y los demás por defecto
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
      const requested = (p.get('step') as Step | null) ?? 'tipo-vehiculo';
      const saved = this.readStorage();
      const fresh = this.route.snapshot.queryParamMap.get('fresh');

      // Auto-resume SOLO si no venimos de popstate (para no romper el botón Atrás)
      if (
        !this.isPopstate &&
        requested === 'tipo-vehiculo' &&
        saved?.step &&
        saved.step !== 'tipo-vehiculo' &&
        !fresh
      ) {
        // ⚠️ No redirigir si venimos de un "Volver" manual desde el formulario
        const cameFromForm = sessionStorage.getItem('cameFromForm') === 'true';
        if (cameFromForm) {
          sessionStorage.removeItem('cameFromForm');
        } else {
          const target = this.resolveStep(saved.step);
          this.step = target;
          this.persist();
          this.router.navigate(['/reforma', target], { replaceUrl: true });
          return;
        }
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
      prevImagesB64: this.datosGenerales?.prevImagesB64 || [],
      postImagesB64: this.datosGenerales?.postImagesB64 || [],
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch (err) {
      console.error('Error al persistir:', err);
    }
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

    this.step = saved.step ?? 'tipo-vehiculo';
    this.codigosPreseleccionados = saved.codigosPreseleccionados;
    this.seccionesSeleccionadas = saved.seccionesSeleccionadas;
    this.respuestasGuardadas = saved.respuestasGuardadas;
    this.datosFormularioGuardados = saved.datosFormularioGuardados;
    this.datosGenerales = saved.datosGenerales || {};
    this.datosGuardadosTipoVehiculo = saved.datosGuardadosTipoVehiculo;
    this.datosResumenModificaciones = saved.datosResumenModificaciones;

    // 🔹 Asegurar que si existen arrays se restauran como mínimo vacíos
    if (!Array.isArray(this.datosGenerales.prevImagesB64)) {
      this.datosGenerales.prevImagesB64 = [];
    }
    if (!Array.isArray(this.datosGenerales.postImagesB64)) {
      this.datosGenerales.postImagesB64 = [];
    }
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
    if (datos) {
      this.datosFormularioGuardados = { ...datos, paginaActual: pagina };
    }

    sessionStorage.setItem('cameFromForm', 'true');

    // 🔹 Forzar step correcto al volver
    this.step = 'tipo-vehiculo';
    this.persist();
    this.navigate('tipo-vehiculo');
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
    this.router.navigate(['/reforma', 'resumen'], {
      state: { from: 'formulario' },
    });
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
    this.navigate('tipo-vehiculo');
  }

  onContinuarTipoVehiculo(event: any) {
    if (event) {
      this.datosGuardadosTipoVehiculo = event;
      this.datosGenerales = { ...(this.datosGenerales || {}), ...event };
    }
    this.persist();
    this.navigate('formulario');
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
    this.navigate('formulario');
  }

  onContinuarDesdeResumenModificaciones(event: any) {
    if (event) {
      this.datosResumenModificaciones = {
        ...(this.datosResumenModificaciones || {}),
        ...event,
      };
      this.datosGenerales = { ...(this.datosGenerales || {}), ...event };
    }

    this.persist();
    this.navigate('imagenes');
  }

  onAutosaveImagenes(event: any) {
    if (!event) return;

    this.datosGenerales = {
      ...(this.datosGenerales || {}),
      ...event,
      prevImagesB64:
        Array.isArray(event.prevImagesB64) && event.prevImagesB64.length > 0
          ? event.prevImagesB64
          : this.datosGenerales?.prevImagesB64 || [],
      postImagesB64:
        Array.isArray(event.postImagesB64) && event.postImagesB64.length > 0
          ? event.postImagesB64
          : this.datosGenerales?.postImagesB64 || [],
    };

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
    this.router.navigate(['/reforma', 'resumen'], {
      state: { from: 'imagenes' },
    });
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
