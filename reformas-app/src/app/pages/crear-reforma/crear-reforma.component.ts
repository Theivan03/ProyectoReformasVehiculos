import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
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
import { TipoVehiculoComponent } from '../tipo-vehiculo/tipo-vehiculo.component';
import { ResumenModificacionesComponent } from '../resumen-modificaciones/resumen-modificaciones.component';
import { CocheonoComponent } from '../cocheono/cocheono.component';
import { CanvaComponent } from '../canva/canva.component';
import { ImagenesComponent } from '../imagenes/imagenes.component';
import { GeneradorDocumentosComponent } from '../../generador-documentos/generador-documentos.component';
import { HttpClient } from '@angular/common/http';
import LZString, { compressToUTF16, decompressFromUTF16 } from 'lz-string';

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
  | 'generador';

const STORAGE_PREFIX = 'reforma-wizard-v1';

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
    GeneradorDocumentosComponent,
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

  origenImagenes: 'anterior' | 'siguiente' = 'anterior';

  private routeSub?: Subscription;
  private routerSub?: Subscription;
  private isPopstate = false;
  datosProyecto: any = {};

  editMode = false;
  vieneDePosterior = false;

  private editId: string | null = null;
  private storageKey = STORAGE_PREFIX;

  private beforeUnloadHandler = (_e: BeforeUnloadEvent) => {
    try {
      this.persist();
    } catch {}
  };

  get datosParaTipoVehiculo(): any {
    return {
      tipoVehiculo:
        this.datosGuardadosTipoVehiculo?.tipoVehiculo ||
        this.datosGenerales?.tipoVehiculo ||
        this.datosProyecto?.tipoVehiculo ||
        '',
      modificaciones:
        this.datosGuardadosTipoVehiculo?.modificaciones ||
        this.datosGenerales?.modificaciones ||
        this.datosProyecto?.modificaciones ||
        [],
    };
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  resetReforma() {
    try {
      localStorage.removeItem(this.storageKey);
      sessionStorage.clear();

      this.step = 'seleccion';
      this.codigosPreseleccionados = undefined;
      this.seccionesSeleccionadas = undefined;
      this.respuestasGuardadas = undefined;
      this.datosFormularioGuardados = undefined;
      this.datosGenerales = undefined;
      this.datosGuardadosTipoVehiculo = undefined;
      this.datosResumenModificaciones = undefined;
      this.vieneDePosterior = false;

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
  get mostrarGenerador() {
    return this.step === 'generador';
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
    this.editId = this.route.snapshot.queryParamMap.get('editId');
    this.editMode = !!this.editId;
    this.storageKey = this.editId
      ? `${STORAGE_PREFIX}-${this.editId}`
      : `${STORAGE_PREFIX}-nueva`;

    console.log('Storage key usada:', this.storageKey);

    // 2) migrar sesiones antiguas (solo afecta a “nueva”)
    if (!this.editId) this.migrateLegacyKey();

    // Detectar navegación de historial (Atrás/Adelante)
    this.routerSub = this.router.events.subscribe((e) => {
      if (e instanceof NavigationStart) {
        this.isPopstate = !!e.restoredState;
      }
    });

    if (this.editId) {
      // Modo editar: traer datos del servidor
      this.cargarProyectoDesdeServidor(this.editId);
    } else {
      // Modo crear nuevo: restaurar de localStorage
      this.migrateLegacyKey();
      this.restore();
      this.step = 'seleccion';
    }

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
        this.router.navigate(['/reforma', target], {
          replaceUrl: true,
          queryParams: { editId: this.editId },
        });
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

  private migrateLegacyKey() {
    const legacy = localStorage.getItem(STORAGE_PREFIX); // versión vieja
    const nueva = `${STORAGE_PREFIX}-nueva`;
    if (legacy && !localStorage.getItem(nueva)) {
      localStorage.setItem(nueva, legacy);
      localStorage.removeItem(STORAGE_PREFIX);
    }
  }

  private static readonly HEAVY_KEYS = [
    'prevImagesB64',
    'postImagesB64',
    'prevImages',
    'postImages',
  ];

  // Quita campos pesados de un objeto (no muta el original)
  private stripHeavy = (obj: any) => {
    if (!obj || typeof obj !== 'object') return obj;
    // clonado superficial para no mutar
    const copy: any = Array.isArray(obj)
      ? obj.map((x) => ({ ...(x || {}) }))
      : { ...obj };

    // borra claves pesadas si existen
    for (const k of CrearReformaComponent.HEAVY_KEYS) {
      if (k in copy) delete copy[k];
    }

    // OJO: no tocamos 'modificaciones' ni 'detalle' para no perder lógica,
    // el mayor problema suelen ser las imágenes/base64.
    return copy;
  };

  // Construye un snapshot "normal" pero ya compactado
  private buildSnapshotLight(): SavedState {
    return {
      step: this.step,
      codigosPreseleccionados: this.codigosPreseleccionados,
      seccionesSeleccionadas: this.seccionesSeleccionadas,
      respuestasGuardadas: this.respuestasGuardadas,
      datosFormularioGuardados: this.stripHeavy(this.datosFormularioGuardados),
      datosGenerales: this.stripHeavy(this.datosGenerales),
      datosGuardadosTipoVehiculo: this.stripHeavy(
        this.datosGuardadosTipoVehiculo
      ),
      datosResumenModificaciones: this.stripHeavy(
        this.datosResumenModificaciones
      ),
    };
  }

  // Snapshot mínimo de supervivencia si todo falla (para reanudar)
  private buildSnapshotUltraLite(): SavedState {
    // Reducimos respuestasGuardadas a solo códigos, por si fuera enorme
    const respuestasMin: any = {};
    Object.entries(this.respuestasGuardadas || {}).forEach(([k, arr]: any) => {
      respuestasMin[k] = Array.isArray(arr)
        ? arr.map((x) => ({ codigo: x.codigo }))
        : [];
    });

    return {
      step: this.step,
      codigosPreseleccionados: (this.codigosPreseleccionados || []).slice(
        0,
        50
      ), // recorte defensivo
      seccionesSeleccionadas: (this.seccionesSeleccionadas || []).map(
        (s: any) => ({ codigo: s?.codigo, descripcion: s?.descripcion })
      ),
      respuestasGuardadas: respuestasMin,
      // el resto lo omitimos para no romper el límite
    } as SavedState;
  }

  private cargarProyectoDesdeServidor(id: string) {
    this.http
      .get(`http://localhost:3000/proyectos/${id}/proyecto.json`)
      .subscribe({
        next: (data: any) => {
          console.log('Datos del proyecto cargados desde servidor:', data);

          // Guardamos el proyecto completo en memoria
          this.datosProyecto = { ...data };

          // Restauramos estado en base a datosProyecto + localStorage
          this.restore();

          // Forzamos al primer paso
          this.step = 'seleccion';
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al cargar proyecto desde servidor:', err);
        },
      });
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
    try {
      // 1) intento con snapshot ya "light" + comprimido
      const light = this.buildSnapshotLight();
      const compressed = compressToUTF16(JSON.stringify(light));
      localStorage.setItem(this.storageKey, compressed);
      return;
    } catch (e1) {
      console.warn(
        '[persist] QuotaExceeded con snapshot light. Probando ultra-lite…',
        e1
      );
    }

    try {
      // 2) si falla, guardamos un snapshot ultra-ligero
      const ultraLite = this.buildSnapshotUltraLite();
      const compressedUltra = compressToUTF16(JSON.stringify(ultraLite));
      localStorage.setItem(this.storageKey, compressedUltra);
      console.warn(
        '[persist] Se guardó snapshot ULTRA-LITE. Estado completo sólo en memoria/servidor.'
      );
    } catch (e2) {
      console.error(
        '[persist] No se pudo guardar ni el ultra-lite en localStorage.',
        e2
      );
    }
  }

  private readStorage(): SavedState | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;

      // Primero intento descomprimir; si no, asumo que está en claro (compatibilidad)
      let parsed: any = null;
      try {
        const decompressed = decompressFromUTF16(raw);
        parsed = decompressed ? JSON.parse(decompressed) : JSON.parse(raw);
      } catch {
        parsed = JSON.parse(raw);
      }
      return parsed as SavedState;
    } catch (e) {
      console.error('Error leyendo storage:', e);
      return null;
    }
  }

  private restore() {
    const saved = this.readStorage();
    const base =
      this.datosProyecto && Object.keys(this.datosProyecto).length
        ? this.datosProyecto
        : {};

    if (!saved && !base) return;

    this.step = 'seleccion';

    // --- CODIGOS DETALLADOS ---
    const codigosDetalladosRoot =
      (base as any)?.codigosDetallados || (saved as any)?.codigosDetallados;
    const codigosDetalladosDG =
      (base as any)?.datosGenerales?.codigosDetallados ||
      (saved as any)?.datosGenerales?.codigosDetallados;

    if (codigosDetalladosRoot && typeof codigosDetalladosRoot === 'object') {
      this.codigosPreseleccionados = Object.keys(codigosDetalladosRoot).map(
        String
      );
      this.respuestasGuardadas = Object.fromEntries(
        Object.entries(codigosDetalladosRoot).map(([codigo, lista]) => [
          codigo,
          (lista as any[]).map((item) => ({
            codigo: String(item.codigo),
            descripcion: item.descripcion,
          })),
        ])
      );
    } else if (codigosDetalladosDG && typeof codigosDetalladosDG === 'object') {
      this.codigosPreseleccionados =
        Object.keys(codigosDetalladosDG).map(String);
      this.respuestasGuardadas = Object.fromEntries(
        Object.entries(codigosDetalladosDG).map(([codigo, lista]) => [
          codigo,
          (lista as any[]).map((item) => ({
            codigo: String(item.codigo),
            descripcion: item.descripcion,
          })),
        ])
      );
    } else if (Array.isArray(saved?.codigosPreseleccionados)) {
      this.codigosPreseleccionados = saved.codigosPreseleccionados.map(String);
    } else if (Array.isArray(saved?.seccionesSeleccionadas)) {
      this.codigosPreseleccionados = saved.seccionesSeleccionadas.map(
        (s: any) => String(s?.codigo)
      );
    } else {
      this.codigosPreseleccionados = [];
    }

    // --- RESTO DE ESTADO ---
    this.seccionesSeleccionadas =
      base.seccionesSeleccionadas || saved?.seccionesSeleccionadas || [];
    this.respuestasGuardadas =
      base.respuestasGuardadas ||
      this.respuestasGuardadas ||
      saved?.respuestasGuardadas ||
      {};
    this.datosFormularioGuardados =
      base.datosFormularioGuardados || saved?.datosFormularioGuardados || base;
    this.datosGenerales = base.datosGenerales || saved?.datosGenerales || base;
    this.datosGuardadosTipoVehiculo =
      base.datosGuardadosTipoVehiculo ||
      saved?.datosGuardadosTipoVehiculo ||
      {};
    this.datosResumenModificaciones =
      base.datosResumenModificaciones ||
      saved?.datosResumenModificaciones ||
      {};
  }

  // -------- handlers de hijos --------
  onContinuar(secciones: { codigo: string; descripcion: string }[]) {
    this.vieneDePosterior = false; // 👈 entra por el principio
    this.seccionesSeleccionadas = Array.isArray(secciones) ? secciones : [];
    this.codigosPreseleccionados = this.seccionesSeleccionadas.map(
      (s: { codigo: any }) => s.codigo
    );
    this.navigate('subseleccion');
  }

  volverASeleccionDesdeSubseleccion() {
    this.vieneDePosterior = false;
    this.navigate('seleccion');
  }

  onFinalizarRecoleccion(event: any) {
    this.respuestasGuardadas = event || {};
    this.navigate('formulario');
  }

  onAutosaveFormulario(event: { datos: any; paginaActual: number }) {
    if (!event) return;

    // guardamos todo, incluido paginaActual
    this.datosFormularioGuardados = {
      ...event.datos,
      paginaActual: event.paginaActual ?? event.datos?.paginaActual ?? 1,
    };

    // importante: persistir para no perderlo
    this.persist();
  }

  onVolverDesdeFormulario(event?: any) {
    const datos = event?.datosFormulario ?? event?.datos ?? event ?? null;
    this.vieneDePosterior = true;
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

      // ⚡ Inicializar también aquí datosGuardadosTipoVehiculo
      if (!this.datosGuardadosTipoVehiculo) {
        this.datosGuardadosTipoVehiculo = {
          tipoVehiculo: '',
          modificaciones: [],
        };
      }
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
    this.datosProyecto = { ...(this.datosProyecto || {}), ...data };
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
    if (event) {
      this.datosGenerales = { ...(this.datosGenerales || {}), ...event };

      // 👇 inicializamos también datosGuardadosTipoVehiculo
      this.datosGuardadosTipoVehiculo = {
        ...(this.datosGuardadosTipoVehiculo || {}),
        ...(this.datosGenerales || {}),
      };
    }

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
    this.datosProyecto = { ...(this.datosProyecto || {}), ...event };
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
    this.origenImagenes = 'anterior';
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
    this.navigate('generador');
  }

  onVolverDesdeGenerador(event?: any) {
    if (event?.datos) this.datosGenerales = event.datos;
    this.origenImagenes = 'siguiente';
    this.navigate('imagenes');
  }
}
