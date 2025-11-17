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
  step: Step = 'tipo-vehiculo';

  codigosPreseleccionados: any = undefined;
  seccionesSeleccionadas: any = undefined;
  respuestasGuardadas: any = undefined;
  datosFormularioGuardados: any = undefined;
  datosGenerales: any = undefined;
  datosGuardadosTipoVehiculo: any = {
    tipoVehiculo: '',
    modificaciones: [],
  };
  datosResumenModificaciones: any = undefined;
  proyectoCargado = false;

  payloadResumen: any = null;

  origenImagenes: 'anterior' | 'siguiente' = 'anterior';

  private routeSub?: Subscription;
  private routerSub?: Subscription;
  private isPopstate = false;
  datosProyecto: any = {};

  editMode = false;
  vieneDePosterior = false;

  private editId: string | null = null;
  private storageKey = STORAGE_PREFIX;

  private editNavDone = false;

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
      enviadoPorCliente: this.datosProyecto?.enviadoPorCliente ?? false,
    };
  }

  private buildResumenPayload(extra?: any) {
    const tipo =
      this.datosGuardadosTipoVehiculo?.tipoVehiculo ??
      this.datosGenerales?.tipoVehiculo ??
      '';

    const mods =
      this.datosGuardadosTipoVehiculo?.modificaciones ??
      this.datosGenerales?.modificaciones ??
      [];

    const opcionesCoche =
      this.datosGuardadosTipoVehiculo?.opcionesCoche ??
      this.datosGenerales?.opcionesCoche;

    const marcadores =
      this.datosGuardadosTipoVehiculo?.marcadores ??
      this.datosGenerales?.marcadores;

    const base = {
      tipoVehiculo: tipo,
      modificaciones: mods,
      ...(this.datosGenerales || {}),
      opcionesCoche,
      marcadores,
      seccionesSeleccionadas: this.seccionesSeleccionadas || [],
      respuestasGuardadas: this.respuestasGuardadas || {},
      datosFormulario: this.datosFormularioGuardados || {},
      ...(extra || {}),
    };

    return base;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  private clearWizardStorage() {
    try {
      const toDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) || '';
        if (k.startsWith(STORAGE_PREFIX)) toDelete.push(k);
      }
      toDelete.push(STORAGE_PREFIX, `${STORAGE_PREFIX}-nueva`);
      Array.from(new Set(toDelete)).forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn('No se pudo limpiar localStorage completamente:', e);
    }
  }

  resetReforma() {
    try {
      this.clearWizardStorage();
      sessionStorage.clear();

      this.step = 'tipo-vehiculo';
      this.codigosPreseleccionados = [];
      this.seccionesSeleccionadas = [];
      this.respuestasGuardadas = {};
      this.datosFormularioGuardados = {};
      this.datosGenerales = {};
      this.datosGuardadosTipoVehiculo = {
        tipoVehiculo: '',
        modificaciones: [],
      };
      this.datosResumenModificaciones = {};
      this.datosProyecto = {};
      this.origenImagenes = 'anterior';
      this.vieneDePosterior = false;
      this.payloadResumen = null;
      this.editNavDone = false;

      this.editMode = false;
      this.editId = null;
      this.storageKey = `${STORAGE_PREFIX}-nueva`;

      (this as any).goToLastSignal = 0;

      this.persist();
      this.router.navigate(['/reforma', 'tipo-vehiculo'], {
        replaceUrl: true,
        queryParams: { fresh: 1 },
      });
    } catch (e) {
      console.error('Error al reiniciar la reforma:', e);
    }
  }

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
    const tipo = (
      this.datosGenerales?.tipoVehiculo ||
      this.datosGuardadosTipoVehiculo?.tipoVehiculo ||
      ''
    ).toLowerCase();

    return this.step === 'coche-o-no' && tipo === 'coche';
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
        return desired;
    }
  }

  ngOnInit(): void {
    this.proyectoCargado = true;
    this.editId = this.route.snapshot.queryParamMap.get('editId');
    this.editMode = !!this.editId;
    this.storageKey = this.editId
      ? `${STORAGE_PREFIX}-${this.editId}`
      : `${STORAGE_PREFIX}-nueva`;

    if (!this.editId) this.migrateLegacyKey();

    this.routerSub = this.router.events.subscribe((e) => {
      if (e instanceof NavigationStart) {
        this.isPopstate = !!e.restoredState;
      }
    });

    if (this.editId) {
      this.cargarProyectoDesdeServidor(this.editId);
      this.editNavDone = false;
    } else {
      this.migrateLegacyKey();
      this.restore();
      this.step = 'tipo-vehiculo';
    }

    this.routeSub = this.route.paramMap.subscribe((p: ParamMap) => {
      const requested = (p.get('step') as Step | null) ?? 'tipo-vehiculo';
      const saved = this.readStorage();
      const fresh = this.route.snapshot.queryParamMap.get('fresh');

      if (
        !this.isPopstate &&
        requested === 'tipo-vehiculo' &&
        saved?.step &&
        saved.step !== 'tipo-vehiculo' &&
        !fresh
      ) {
        const target = this.resolveStep(saved.step);
        this.step = target;
        this.persist();
        this.router.navigate(['/reforma', target], {
          replaceUrl: true,
          queryParams: { editId: this.editId },
        });
        return;
      }

      const target = this.resolveStep(requested);
      this.step = target;
      this.persist();
    });

    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  private migrateLegacyKey() {
    const legacy = localStorage.getItem(STORAGE_PREFIX);
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

  private stripHeavy = (obj: any) => {
    if (!obj || typeof obj !== 'object') return obj;
    const copy: any = Array.isArray(obj)
      ? obj.map((x) => ({ ...(x || {}) }))
      : { ...obj };

    for (const k of CrearReformaComponent.HEAVY_KEYS) {
      if (k in copy) delete copy[k];
    }

    return copy;
  };

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

  private buildSnapshotUltraLite(): SavedState {
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
      ),
      seccionesSeleccionadas: (this.seccionesSeleccionadas || []).map(
        (s: any) => ({ codigo: s?.codigo, descripcion: s?.descripcion })
      ),
      respuestasGuardadas: respuestasMin,
    } as SavedState;
  }

  private cargarProyectoDesdeServidor(id: string) {
    this.proyectoCargado = false; // BLOQUEA RENDER

    this.http
      .get(
        `http://192.168.1.41:3000/proyectos/${id}/proyecto.json?cache_bust=${new Date().getTime()}`
      )
      .subscribe({
        next: (data: any) => {
          this.datosProyecto = { ...data }; // Restaurar desde storage y mezclar

          this.restore(); // Ir al primer paso

          this.step = 'tipo-vehiculo'; // 🔥 SOLO AHORA desbloqueamos el render

          this.proyectoCargado = true;

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al cargar proyecto:', err);
          this.proyectoCargado = true; // evitar bloqueo
        },
      });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.routerSub?.unsubscribe();
    window.removeEventListener('beforeunload', this.beforeUnloadHandler);
  }

  navigate(next: Step) {
    const tipo = (
      this.datosGenerales?.tipoVehiculo ||
      this.datosGuardadosTipoVehiculo?.tipoVehiculo ||
      ''
    ).toLowerCase();

    if (next === 'coche-o-no' && tipo !== 'coche') {
      this.step = 'canva';
      this.persist();
      this.router.navigate(['/reforma', 'canva']);
      return;
    }

    if (this.step === 'canva' && next === 'coche-o-no' && tipo !== 'coche') {
      this.step = 'formulario';
      this.persist();
      this.router.navigate(['/reforma', 'formulario']);
      return;
    }

    this.step = this.resolveStep(next);
    this.persist();
    this.router.navigate(['/reforma', this.step]);
  }

  private persist() {
    try {
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

    this.step = 'tipo-vehiculo';

    const codigosDetalladosRoot =
      (saved as any)?.codigosDetallados || (base as any)?.codigosDetallados;
    const codigosDetalladosDG =
      (saved as any)?.datosGenerales?.codigosDetallados ||
      (base as any)?.datosGenerales?.codigosDetallados;

    const esBloqueTipoVehiculo = (obj: any) =>
      obj &&
      typeof obj === 'object' &&
      (typeof obj.tipoVehiculo === 'string' ||
        Array.isArray(obj.modificaciones));

    const normalizarRespuestas = (src: any) =>
      Object.fromEntries(
        Object.entries(src)
          .filter(([, v]) => Array.isArray(v))
          .map(([codigo, lista]) => [
            String(codigo),
            (lista as any[]).map((item: any) => ({
              codigo: String(item.codigo),
              descripcion: item.descripcion,
            })),
          ])
      );

    if (codigosDetalladosRoot && typeof codigosDetalladosRoot === 'object') {
      if (esBloqueTipoVehiculo(codigosDetalladosRoot)) {
        this.datosGuardadosTipoVehiculo = {
          ...(this.datosGuardadosTipoVehiculo || {}),
          tipoVehiculo: codigosDetalladosRoot.tipoVehiculo ?? '',
          modificaciones: Array.isArray(codigosDetalladosRoot.modificaciones)
            ? codigosDetalladosRoot.modificaciones
            : this.datosGuardadosTipoVehiculo?.modificaciones || [],
        };
        this.codigosPreseleccionados = saved?.codigosPreseleccionados
          ? saved.codigosPreseleccionados.map(String)
          : [];
        this.respuestasGuardadas = {};
      } else {
        this.codigosPreseleccionados = Object.keys(codigosDetalladosRoot)
          .filter((k) => Array.isArray((codigosDetalladosRoot as any)[k]))
          .map(String);
        this.respuestasGuardadas = normalizarRespuestas(codigosDetalladosRoot);
      }
    } else if (codigosDetalladosDG && typeof codigosDetalladosDG === 'object') {
      this.codigosPreseleccionados = Object.keys(codigosDetalladosDG)
        .filter((k) => Array.isArray((codigosDetalladosDG as any)[k]))
        .map(String);
      this.respuestasGuardadas = normalizarRespuestas(codigosDetalladosDG);
    } else if (Array.isArray(saved?.codigosPreseleccionados)) {
      this.codigosPreseleccionados = saved.codigosPreseleccionados.map(String);
    } else if (Array.isArray(saved?.seccionesSeleccionadas)) {
      this.codigosPreseleccionados = saved.seccionesSeleccionadas.map(
        (s: any) => String(s?.codigo)
      );
    } else {
      this.codigosPreseleccionados = [];
      this.respuestasGuardadas = {};
    } // ---- 2) Resto de estado (con fallback al top-level del proyecto) ---- // 🔥 CAMBIO DE LÓGICA: 'base' (servidor) primero, 'saved' (localStorage) después.

    this.seccionesSeleccionadas =
      base.seccionesSeleccionadas || saved?.seccionesSeleccionadas || [];

    this.respuestasGuardadas =
      this.respuestasGuardadas ||
      base.respuestasGuardadas ||
      saved?.respuestasGuardadas ||
      {};

    this.datosFormularioGuardados =
      base.datosFormularioGuardados || saved?.datosFormularioGuardados || base;

    this.datosGenerales = {
      ...base.datosGenerales,
      ...(saved?.datosGenerales || {}),
      ...base,
    };

    this.datosGuardadosTipoVehiculo = {
      ...this.datosGuardadosTipoVehiculo, // Memoria
      ...(base.datosGuardadosTipoVehiculo || {}), // Servidor (base)
      ...(saved?.datosGuardadosTipoVehiculo || {}), // LocalStorage (gana)
    }; // 🔒 Protección extra

    if (!this.datosGuardadosTipoVehiculo.tipoVehiculo) {
      this.datosGuardadosTipoVehiculo.tipoVehiculo =
        saved?.datosGenerales?.tipoVehiculo ||
        base.tipoVehiculo ||
        this.datosGenerales?.tipoVehiculo ||
        '';
    }

    if (
      (!this.datosGuardadosTipoVehiculo.modificaciones ||
        this.datosGuardadosTipoVehiculo.modificaciones.length === 0) &&
      Array.isArray(base.modificaciones)
    ) {
      this.datosGuardadosTipoVehiculo.modificaciones = base.modificaciones;
    }

    this.datosResumenModificaciones =
      base.datosResumenModificaciones ||
      saved?.datosResumenModificaciones ||
      {};
  }

  onContinuar(secciones: { codigo: string; descripcion: string }[]) {
    this.vieneDePosterior = false;
    this.seccionesSeleccionadas = Array.isArray(secciones) ? secciones : [];
    this.codigosPreseleccionados = this.seccionesSeleccionadas.map(
      (s: { codigo: any }) => s.codigo
    );
    this.persist();
    this.navigate('subseleccion');
  }

  onVolverDesdeSeleccion(event?: {
    secciones?: { codigo: string; descripcion: string }[];
    codigos?: string[];
    extra?: any;
  }) {
    if (event?.secciones && Array.isArray(event.secciones)) {
      this.seccionesSeleccionadas = [...event.secciones];
    }
    if (event?.codigos && Array.isArray(event.codigos)) {
      this.codigosPreseleccionados = [...event.codigos];
    } else if (!this.codigosPreseleccionados && this.seccionesSeleccionadas) {
      this.codigosPreseleccionados = this.seccionesSeleccionadas.map(
        (s: any) => s.codigo
      );
    }

    this.payloadResumen = this.buildResumenPayload(event?.extra);
    this.persist();
    this.navigate('resumen');
  }

  volverASeleccionDesdeSubseleccion() {
    this.vieneDePosterior = false;
    this.navigate('seleccion');
  }

  onFinalizarRecoleccion(event: any) {
    this.respuestasGuardadas = event || {};
    const TIPO_ACTUAL =
      this.datosGenerales?.tipoVehiculo ||
      this.datosGuardadosTipoVehiculo?.tipoVehiculo;
    this.datosFormularioGuardados = {
      ...(this.datosFormularioGuardados || {}),
      paginaActual: 1,
      tipoVehiculo: TIPO_ACTUAL || null,
    };
    this.persist();
    this.navigate('formulario');
  }

  onAutosaveFormulario(event: { datos: any; paginaActual: number }) {
    if (!event) return;

    this.mergeGenerales(event.datos);

    this.datosFormularioGuardados = {
      ...event.datos,
      paginaActual: event.paginaActual ?? event.datos?.paginaActual ?? 1,
    };
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
      this.mergeGenerales(event);

      if (!this.datosGuardadosTipoVehiculo) {
        this.datosGuardadosTipoVehiculo = {
          tipoVehiculo: '',
          modificaciones: [],
        };
      }
    }

    if (this.datosFormularioGuardados.reformasPrevias === true) {
      this.persist();
      this.navigate('reformas-previas');
    } else {
      this.persist();
      const tipo = (this.datosGenerales?.tipoVehiculo || '').toLowerCase();
      this.navigate(tipo === 'coche' ? 'coche-o-no' : 'canva');
    }
  }

  onAutosaveReformasPrevias(data: any) {
    this.mergeGenerales(data);
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
      this.datosGuardadosTipoVehiculo = {
        ...(this.datosGuardadosTipoVehiculo || {}),
        ...(this.datosGenerales || {}),
      };
    }
    this.persist();
    this.navigate('coche-o-no');
  }

  onAutosaveTipoVehiculo(event: {
    tipoVehiculo: string;
    modificaciones: any[];
  }) {
    if (!event) return;
    if (!Array.isArray(event.modificaciones)) return;

    this.datosGuardadosTipoVehiculo = {
      ...(this.datosGuardadosTipoVehiculo || {}),
      ...event,
    };

    this.datosGenerales = {
      ...(this.datosGenerales || {}),
      ...event,
    };

    this.datosProyecto = {
      ...(this.datosProyecto || {}),
      ...event,
      enviadoPorCliente: false,
    };

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
    this.navigate('tipo-vehiculo');
  }

  cargandoResumen = false;

  onContinuarTipoVehiculo(event: any) {
    this.proyectoCargado = true;

    if (event && Array.isArray(event.modificaciones)) {
      this.datosGuardadosTipoVehiculo = {
        ...(this.datosGuardadosTipoVehiculo || {}),
        ...event,
      };

      this.datosGenerales = {
        ...(this.datosGenerales || {}),
        ...event,
      };

      this.datosProyecto = {
        ...(this.datosProyecto || {}),
        ...event,
        enviadoPorCliente: false,
      };
    }

    this.payloadResumen = this.buildResumenPayload(event);
    this.persist();
    this.navigate('resumen');
  }

  get datosParaResumen(): any {
    const base = this.datosGenerales || {};
    const mods =
      this.datosGuardadosTipoVehiculo?.modificaciones ??
      this.datosGuardadosTipoVehiculo?.tipoVehiculo ??
      this.datosGenerales?.modificaciones ??
      [];

    return {
      ...base,
      modificaciones: [...mods],
    };
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
      this.mergeGenerales(event);
    }

    this.persist();
    this.navigate('seleccion');
  }

  onAutosaveCocheONo(event: any) {
    if (!event) return;
    this.mergeGenerales(event.datos);

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

  goToLastSignal = 0;

  onVolverDesdeCocheONo(event?: any) {
    if (event) {
      this.mergeGenerales(event);

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

    this.goToLastSignal++;

    this.datosFormularioGuardados = {
      ...(this.datosFormularioGuardados || {}),
      paginaActual: Number.MAX_SAFE_INTEGER,
    };

    if (this.datosFormularioGuardados.reformasPrevias === true) {
      this.persist();
      this.navigate('reformas-previas');
      return;
    } else {
      this.persist();
      this.navigate('formulario');
    }
  }

  onContinuarDesdeCocheONo(event: any) {
    if (event) {
      this.mergeGenerales(event);

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
    this.mergeGenerales(event.datos);

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
    if (event) {
      this.mergeGenerales(event);

      this.datosResumenModificaciones = {
        ...(this.datosResumenModificaciones || {}),
        ...event,
      };
    }

    this.persist();
    const tipo = (this.datosGenerales?.tipoVehiculo || '').toLowerCase();
    this.navigate(tipo === 'coche' ? 'coche-o-no' : 'formulario');
  }

  onContinuarDesdeCanva(event: any) {
    if (event) {
      this.mergeGenerales(event);

      this.datosResumenModificaciones = {
        ...(this.datosResumenModificaciones || {}),
        ...event,
      };
    }
    this.persist();
    this.origenImagenes = 'anterior';
    this.navigate('imagenes');
  }

  private mergeGenerales(event: any) {
    const TIPO_ACTUAL =
      this.datosGenerales?.tipoVehiculo ||
      this.datosGuardadosTipoVehiculo?.tipoVehiculo;

    this.datosGenerales = {
      ...this.datosGenerales,
      ...event,
    };

    if (!this.datosGenerales.tipoVehiculo && TIPO_ACTUAL) {
      this.datosGenerales.tipoVehiculo = TIPO_ACTUAL;
    }
  }

  onAutosaveImagenes(event: any) {
    if (!event) return;
    this.mergeGenerales(event.datos);

    this.datosResumenModificaciones = {
      ...(this.datosResumenModificaciones || {}),
      ...event,
    };
    this.persist();
  }

  onVolverDesdeImagenes(event?: any) {
    if (event) {
      this.mergeGenerales(event);

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
      this.mergeGenerales(event);

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
