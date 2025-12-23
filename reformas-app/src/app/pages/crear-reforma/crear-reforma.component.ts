import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import {
  ActivatedRoute,
  ParamMap,
  Router,
  NavigationStart,
} from '@angular/router';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import LZString, { compressToUTF16, decompressFromUTF16 } from 'lz-string';

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
  codigosDetallados?: any;
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
  // 🔥 PUENTE DE DATOS (Sobrevive a la recarga del componente)
  public static bridgePayload: any = null;

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

  payloadResumen: any = {};

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

  private generarPayloadResumenActualizado() {
    const base = this.datosGenerales || {};

    let mods = this.datosGuardadosTipoVehiculo?.modificaciones;
    if (!mods || mods.length === 0) {
      mods = this.datosGenerales?.modificaciones;
    }
    if (!mods || mods.length === 0) {
      mods = this.datosProyecto?.modificaciones;
    }
    mods = Array.isArray(mods) ? mods : [];

    let tipo = this.datosGuardadosTipoVehiculo?.tipoVehiculo;
    if (!tipo) tipo = this.datosGenerales?.tipoVehiculo;
    if (!tipo) tipo = this.datosProyecto?.tipoVehiculo;

    return {
      ...base,
      tipoVehiculo: tipo || '',
      modificaciones: [...mods],
    };
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
      CrearReformaComponent.bridgePayload = null; // Limpiar puente

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
      this.payloadResumen = {};
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

      // 🔥🔥 SOLUCIÓN DEL PUENTE 🔥🔥
      if (this.step === 'resumen') {
        // 1. Primero miramos si el componente estático tiene los datos "en la nevera"
        if (CrearReformaComponent.bridgePayload) {
          console.log('🌉 [INIT] Recuperando datos desde el PUENTE ESTÁTICO.');
          this.payloadResumen = CrearReformaComponent.bridgePayload;

          // Opcional: Limpiar el puente si quieres, o dejarlo por seguridad
          CrearReformaComponent.bridgePayload = null;
        } else {
          // 2. Si no hay puente (ej: recarga F5), intentamos regenerar desde memoria/storage
          console.log(
            '🔄 [INIT] No hay puente. Regenerando desde memoria local...'
          );
          this.payloadResumen = this.generarPayloadResumenActualizado();
        }
      }

      this.persist();
    });

    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  // ... [Tus métodos privados migrateLegacyKey, stripHeavy, buildSnapshotLight... igual que antes] ...
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
    for (const k of CrearReformaComponent.HEAVY_KEYS)
      if (k in copy) delete copy[k];
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
    this.proyectoCargado = false;
    this.http
      .get(
        `http://192.168.1.41:3000/proyectos/${id}/proyecto.json?cache_bust=${new Date().getTime()}`
      )
      .subscribe({
        next: (data: any) => {
          this.datosProyecto = { ...data };

          // Guardamos el paso actual antes de que restore() lo reinicie
          // Si el usuario ya navegó (ej: a 'resumen'), esto lo capturará.
          // También miramos la URL por seguridad.
          const pasoYaNavegado = this.step;
          const pasoEnUrl = this.route.snapshot.paramMap.get('step') as Step;

          // restore() reinicia internamente this.step a 'tipo-vehiculo',
          // por eso debemos proteger el paso real después de llamarlo.
          this.restore();

          // 🔥 CORRECCIÓN DEL BUG:
          // Si ya estamos en un paso distinto a 'tipo-vehiculo' (porque el usuario avanzó
          // mientras cargaba o porque recargó la página en el paso 3), RESPETA ESE PASO.
          if (pasoEnUrl && pasoEnUrl !== 'tipo-vehiculo') {
            this.step = this.resolveStep(pasoEnUrl);
          } else if (pasoYaNavegado && pasoYaNavegado !== 'tipo-vehiculo') {
            this.step = pasoYaNavegado;
          } else {
            // Solo si no hay indicación contraria, vamos al inicio
            this.step = 'tipo-vehiculo';
          }

          this.proyectoCargado = true;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al cargar proyecto:', err);
          this.proyectoCargado = true;
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

    const navigationExtras = {
      queryParams: { editId: this.editId }, // <--- ESTA ES LA CLAVE
      queryParamsHandling: 'merge' as const, // Mantiene otros parámetros si los hubiera
    };

    if (next === 'coche-o-no' && tipo !== 'coche') {
      this.step = 'canva';
      this.persist();
      this.router.navigate(['/reforma', 'canva'], navigationExtras);
      return;
    }
    if (this.step === 'canva' && next === 'coche-o-no' && tipo !== 'coche') {
      this.step = 'formulario';
      this.persist();
      this.router.navigate(['/reforma', 'formulario'], navigationExtras);
      return;
    }
    this.step = this.resolveStep(next);
    this.persist();
    this.router.navigate(['/reforma', this.step], navigationExtras);
  }

  private persist() {
    // 🔥 PROTECCIÓN CRÍTICA:
    // Si estamos editando un proyecto y aún no ha terminado de cargar (proyectoCargado es false),
    // PROHIBIDO guardar, porque sobrescribiríamos los datos buenos con el estado vacío inicial.
    if (this.editId && !this.proyectoCargado) {
      console.warn('⛔ [PERSIST] Bloqueado: El proyecto aún está cargando.');
      return;
    }

    try {
      const light = this.buildSnapshotLight();
      const compressed = compressToUTF16(JSON.stringify(light));
      localStorage.setItem(this.storageKey, compressed);
      return;
    } catch (e1) {
      console.warn('[persist] QuotaExceeded', e1);
    }
    try {
      const ultraLite = this.buildSnapshotUltraLite();
      const compressedUltra = compressToUTF16(JSON.stringify(ultraLite));
      localStorage.setItem(this.storageKey, compressedUltra);
    } catch (e2) {
      console.error('[persist] Error fatal', e2);
    }
  }

  private readStorage(): SavedState | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      let parsed: any = null;
      try {
        const d = decompressFromUTF16(raw);
        parsed = d ? JSON.parse(d) : JSON.parse(raw);
      } catch {
        parsed = JSON.parse(raw);
      }
      return parsed as SavedState;
    } catch (e) {
      return null;
    }
  }

  private restore() {
    const saved = this.readStorage();
    const base =
      this.datosProyecto && Object.keys(this.datosProyecto).length
        ? this.datosProyecto
        : {};

    if (!saved && Object.keys(base).length === 0) return;

    this.step = 'tipo-vehiculo';

    let codigosEncontrados: string[] = [];

    if (
      Array.isArray(saved?.codigosPreseleccionados) &&
      saved.codigosPreseleccionados.length > 0
    ) {
      codigosEncontrados = saved.codigosPreseleccionados.map(String);
    } else if (
      base.codigosDetallados &&
      Object.keys(base.codigosDetallados).length > 0
    ) {
      codigosEncontrados = Object.keys(base.codigosDetallados).filter((key) => {
        return Array.isArray(base.codigosDetallados[key]);
      });
    } else if (
      base.datosGenerales?.codigosDetallados &&
      Object.keys(base.datosGenerales.codigosDetallados).length > 0
    ) {
      codigosEncontrados = Object.keys(
        base.datosGenerales.codigosDetallados
      ).filter((key) => {
        return Array.isArray(base.datosGenerales.codigosDetallados[key]);
      });
    } else if (Array.isArray(base.seccionesSeleccionadas)) {
      codigosEncontrados = base.seccionesSeleccionadas.map((s: any) =>
        String(s?.codigo)
      );
    }

    this.codigosPreseleccionados = codigosEncontrados;

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

    let origenDatos = '';
    if (base.codigosDetallados || base.datosGenerales?.codigosDetallados) {
      origenDatos = 'codigosDetallados';
    }

    if (origenDatos.includes('codigosDetallados')) {
      const fuente =
        base.codigosDetallados || base.datosGenerales?.codigosDetallados;
      this.respuestasGuardadas = normalizarRespuestas(fuente);
    } else {
      this.respuestasGuardadas =
        saved?.respuestasGuardadas || base.respuestasGuardadas || {};
    }

    this.seccionesSeleccionadas =
      saved?.seccionesSeleccionadas ||
      base.seccionesSeleccionadas ||
      base.datosGenerales?.seccionesSeleccionadas ||
      [];

    this.datosFormularioGuardados =
      saved?.datosFormularioGuardados || base.datosFormularioGuardados || base;

    this.datosGenerales = {
      ...base,
      ...(base.datosGenerales || {}),
      ...(saved?.datosGenerales || {}),
    };

    if (this.datosFormularioGuardados) {
      this.datosGenerales = {
        ...this.datosGenerales,
        ...this.datosFormularioGuardados,
      };
    }

    this.datosGuardadosTipoVehiculo = {
      ...this.datosGuardadosTipoVehiculo,
      ...(base.datosGuardadosTipoVehiculo || {}),
      ...(saved?.datosGuardadosTipoVehiculo || {}),
    };

    if (!this.datosGuardadosTipoVehiculo.tipoVehiculo) {
      this.datosGuardadosTipoVehiculo.tipoVehiculo =
        saved?.datosGenerales?.tipoVehiculo ||
        base.tipoVehiculo ||
        this.datosGenerales?.tipoVehiculo ||
        '';
    }

    if (
      !this.datosGuardadosTipoVehiculo.modificaciones ||
      this.datosGuardadosTipoVehiculo.modificaciones.length === 0
    ) {
      if (
        Array.isArray(base.modificaciones) &&
        base.modificaciones.length > 0
      ) {
        this.datosGuardadosTipoVehiculo.modificaciones = base.modificaciones;
      } else if (Array.isArray(saved?.datosGenerales?.modificaciones)) {
        this.datosGuardadosTipoVehiculo.modificaciones =
          saved.datosGenerales.modificaciones;
      }
    }

    this.datosResumenModificaciones =
      base.datosResumenModificaciones ||
      saved?.datosResumenModificaciones ||
      {};
  }

  // ... [Métodos de navegación (onContinuar, onVolverDesdeSeleccion...) se mantienen igual] ...
  onContinuar(secciones: { codigo: string; descripcion: string }[]) {
    this.vieneDePosterior = false;
    this.seccionesSeleccionadas = Array.isArray(secciones) ? secciones : [];

    // Obtenemos los códigos válidos (ej: ['4'])
    const codigosValidos = this.seccionesSeleccionadas.map(
      (s: { codigo: any }) => s.codigo
    );
    this.codigosPreseleccionados = codigosValidos;

    // 🔥 LIMPIEZA DE HUÉRFANOS 🔥
    // Si teníamos guardado algo de la sección '3' y esta ya no está en codigosValidos,
    // creamos un nuevo objeto solo con las respuestas de las secciones que SÍ siguen activas.
    if (this.respuestasGuardadas) {
      const respuestasLimpias: any = {};

      codigosValidos.forEach((codigo: string) => {
        // Si existían respuestas para este código, las conservamos.
        if (this.respuestasGuardadas[codigo]) {
          respuestasLimpias[codigo] = this.respuestasGuardadas[codigo];
        }
      });

      this.respuestasGuardadas = respuestasLimpias;
    }

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
    this.payloadResumen = this.generarPayloadResumenActualizado();
    this.persist();
    this.navigate('resumen');
  }

  volverASeleccionDesdeSubseleccion(event?: any) {
    // 🔥 CAMBIO CLAVE: Si vienen datos del hijo, los guardamos antes de salir
    if (event && typeof event === 'object') {
      this.respuestasGuardadas = event;
      this.persist(); // Guardar en localStorage
    }

    this.vieneDePosterior = false;
    this.navigate('seleccion');
  }
  onFinalizarRecoleccion(event: any) {
    this.respuestasGuardadas = event || {};

    const TIPO_ACTUAL =
      this.datosGenerales?.tipoVehiculo ||
      this.datosGuardadosTipoVehiculo?.tipoVehiculo;

    // 🔥 CORRECCIÓN: Recuperamos las modificaciones guardadas
    const MODIFICACIONES_ACTUALES =
      this.datosGuardadosTipoVehiculo?.modificaciones ||
      this.datosGenerales?.modificaciones ||
      [];

    this.datosFormularioGuardados = {
      ...(this.datosFormularioGuardados || {}),
      paginaActual: 1,
      tipoVehiculo: TIPO_ACTUAL || null,
      modificaciones: MODIFICACIONES_ACTUALES, // <--- AHORA SÍ LAS PASAMOS AL FORMULARIO
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

    // ACTUALIZACIÓN CRÍTICA: Sincronizar payloadResumen con los datos nuevos del formulario
    this.payloadResumen = { ...(this.datosGenerales || {}) };

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

      if (this.datosFormularioGuardados) {
        this.datosGenerales = {
          ...this.datosGenerales,
          ...this.datosFormularioGuardados,
        };
      }

      this.datosGuardadosTipoVehiculo = {
        ...(this.datosGuardadosTipoVehiculo || {}),
        ...(this.datosGenerales || {}),
      };
    }

    // ACTUALIZACIÓN CRÍTICA: Sincronizar payloadResumen antes de ir a coche-o-no
    this.payloadResumen = { ...(this.datosGenerales || {}) };

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
    this.datosGenerales = { ...(this.datosGenerales || {}), ...event };
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

  // 🔥🔥 AQUÍ USAMOS EL PUENTE ESTÁTICO PARA GUARDAR LOS DATOS ANTES DE MORIR 🔥🔥
  onContinuarTipoVehiculo(event: any) {
    this.proyectoCargado = true;
    const datosEntrantes = event && event.datos ? event.datos : event;

    console.log('🔥 [ON-CONTINUAR] Datos:', datosEntrantes);

    if (datosEntrantes) {
      this.datosGuardadosTipoVehiculo = {
        ...(this.datosGuardadosTipoVehiculo || {}),
        ...datosEntrantes,
      };
      if (Array.isArray(datosEntrantes.modificaciones)) {
        this.datosGuardadosTipoVehiculo.modificaciones = [
          ...datosEntrantes.modificaciones,
        ];
      }
      this.datosGenerales = {
        ...(this.datosGenerales || {}),
        ...datosEntrantes,
      };
      this.datosProyecto = {
        ...(this.datosProyecto || {}),
        ...datosEntrantes,
        enviadoPorCliente: false,
      };
    }

    const modsReales = Array.isArray(datosEntrantes.modificaciones)
      ? [...datosEntrantes.modificaciones]
      : [];

    // Creamos el payload
    const payloadFinal = {
      ...(this.datosGenerales || {}),
      tipoVehiculo: datosEntrantes.tipoVehiculo || '',
      modificaciones: modsReales,
    };

    this.payloadResumen = payloadFinal;

    // GUARDAR EN EL PUENTE ESTÁTICO (Esto sobrevive a la destrucción del componente)
    CrearReformaComponent.bridgePayload = payloadFinal;
    console.log('🌉 [ON-CONTINUAR] Datos guardados en el PUENTE ESTÁTICO.');

    this.persist();
    this.navigate('resumen');
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
    this.datosGenerales = { ...this.datosGenerales, ...event };
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
