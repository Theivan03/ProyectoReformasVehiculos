import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  FileText,
  Plus,
  MapPin,
  Trash2,
} from 'lucide-angular';

@Component({
  selector: 'app-memorias-lista',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    RouterModule,
    LucideAngularModule,
  ],
  template: `
    <div class="trello-container">
      <div
        class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3"
      >
        <div>
          <h2 class="fw-bold text-dark m-0">Edicion y descarga de memorias</h2>
          <p class="text-muted mt-1 mb-0">Gestion de expedientes tecnicos</p>
        </div>

        <div class="d-flex align-items-center gap-2">
          <span class="counter-badge">{{ memorias.length }} registros</span>
          <button
            class="btn btn-primary px-4 py-2 shadow-sm fw-bold d-flex align-items-center gap-2"
            (click)="nuevaMemoria()"
          >
            <lucide-icon [img]="icons.Plus" size="18"></lucide-icon>
            Nueva Memoria
          </button>
        </div>
      </div>

      <div class="list-column">
        <div *ngIf="cargando" class="status-card text-center py-5 text-muted">
          <div class="spinner-border mb-2" role="status"></div>
          <p class="mb-0">Cargando memorias...</p>
        </div>

        <div
          *ngIf="!cargando && memorias.length === 0"
          class="status-card text-center py-5"
        >
          <lucide-icon
            [img]="icons.FileText"
            size="48"
            class="text-muted mb-3 opacity-50"
          ></lucide-icon>
          <h5 class="text-muted">No hay memorias guardadas</h5>
          <p class="small text-muted mb-4">
            Crea la primera para empezar a trabajar.
          </p>
          <button class="btn btn-outline-primary btn-sm" (click)="nuevaMemoria()">
            Crear ahora
          </button>
        </div>

        <div *ngIf="!cargando && memorias.length > 0" class="cards-grid">
          <article
            *ngFor="let m of memorias"
            class="memory-card"
            [ngClass]="getTipoMemoriaCardClass(m)"
            (click)="abrirDetalle(m)"
          >
            <div class="d-flex justify-content-between align-items-start gap-2">
              <h3 class="card-title mb-1">
                {{ (m.titular?.apellidos ? m.titular.apellidos + ' ' : '') + (m.titular?.nombre || 'Sin nombre') }}
              </h3>
              <div class="d-flex flex-column align-items-end gap-1">
                <button
                  type="button"
                  class="delete-btn"
                  title="Eliminar memoria"
                  aria-label="Eliminar memoria"
                  (click)="confirmarEliminarMemoria(m, $event)"
                >
                  <lucide-icon [img]="icons.Trash2" size="14"></lucide-icon>
                </button>
                <span class="type-pill" [ngClass]="getTipoMemoriaCardClass(m)">
                  {{ getTipoMemoriaLabel(m) }}
                </span>
                <span class="date-pill">{{ m.fechaEdicion || m.fechaCreacion | date : 'shortDate' }}</span>
              </div>
            </div>

            <div class="small text-muted mb-2">{{ m.titular?.nif || 'Sin NIF/CIF' }}</div>

            <div class="card-subtitle">
              <lucide-icon [img]="icons.MapPin" size="16"></lucide-icon>
              <span>
                {{ m.emplazamiento?.direccion || 'Sin direccion' }}
              </span>
            </div>

            <div class="small text-muted">{{ m.emplazamiento?.localidad || m.emplazamiento?.poblacion || '-' }}</div>
          </article>
        </div>
      </div>
    </div>

    <div
      *ngIf="memoriaPendiente"
      class="action-backdrop"
      (click)="cerrarAccionMemoria()"
    >
      <section class="action-modal" (click)="$event.stopPropagation()">
        <h5 class="action-title">¿Qué quieres hacer?</h5>
        <p class="action-subtitle">
          Puedes descargar los documentos o abrir la memoria para editarla.
        </p>
        <div class="action-buttons">
          <button class="btn btn-primary" (click)="descargarPendiente()">
            Descargar documentos
          </button>
          <button class="btn btn-outline-secondary" (click)="editarPendiente()">
            Editar memoria
          </button>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        background-color: #f4f6f8;
        min-height: 100vh;
        font-family: 'Segoe UI', system-ui, sans-serif;
      }

      .trello-container {
        padding: 2rem;
      }

      .list-column {
        background: #ebecf0;
        border-radius: 12px;
        padding: 1.25rem;
        min-height: 520px;
        box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.02);
      }

      .counter-badge {
        background: #ffffff;
        border: 1px solid #d1d5db;
        border-radius: 999px;
        color: #374151;
        font-size: 0.85rem;
        font-weight: 700;
        padding: 0.35rem 0.85rem;
      }

      .status-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
      }

      .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 0.9rem;
      }

      .action-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999;
        padding: 1rem;
      }

      .action-modal {
        background: #ffffff;
        border-radius: 14px;
        box-shadow: 0 18px 50px rgba(15, 23, 42, 0.25);
        padding: 1.25rem 1.5rem;
        width: min(360px, 100%);
        text-align: center;
      }

      .action-title {
        font-weight: 700;
        margin-bottom: 0.4rem;
        color: #0f172a;
      }

      .action-subtitle {
        font-size: 0.9rem;
        color: #475569;
        margin-bottom: 1rem;
      }

      .action-buttons {
        display: flex;
        gap: 0.6rem;
        justify-content: center;
        flex-wrap: wrap;
      }

      .memory-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-left: 6px solid #2563eb;
        border-radius: 10px;
        padding: 1rem;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .memory-card.card-consumo {
        border-left-color: #2563eb;
        background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
      }

      .memory-card.card-autoconsumo {
        border-left-color: #16a34a;
        background: linear-gradient(180deg, #ecfdf5 0%, #ffffff 100%);
      }

      .memory-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
      }

      .memory-card.card-consumo:hover {
        background: linear-gradient(180deg, #dbeafe 0%, #ffffff 100%);
      }

      .memory-card.card-autoconsumo:hover {
        background: linear-gradient(180deg, #dcfce7 0%, #ffffff 100%);
      }

      .card-title {
        font-size: 1rem;
        color: #111827;
        font-weight: 700;
        line-height: 1.3;
      }

      .card-subtitle {
        color: #475569;
        font-size: 0.88rem;
        display: flex;
        align-items: center;
        gap: 0.45rem;
        margin-bottom: 0.2rem;
      }

      .date-pill {
        background: #f3f4f6;
        border: 1px solid #d1d5db;
        border-radius: 999px;
        color: #374151;
        font-size: 0.72rem;
        font-weight: 700;
        padding: 0.25rem 0.65rem;
        display: inline-block;
        white-space: nowrap;
      }

      .delete-btn {
        border: 1px solid #fecaca;
        background: #fff1f2;
        color: #be123c;
        border-radius: 999px;
        width: 1.75rem;
        height: 1.75rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .delete-btn:hover {
        background: #ffe4e6;
        border-color: #fca5a5;
      }

      .delete-btn:focus-visible {
        outline: 2px solid #fb7185;
        outline-offset: 1px;
      }

      .type-pill {
        border-radius: 999px;
        font-size: 0.68rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        padding: 0.2rem 0.55rem;
        border: 1px solid transparent;
        line-height: 1.1;
      }

      .type-pill.card-consumo {
        background: #dbeafe;
        color: #1d4ed8;
        border-color: #93c5fd;
      }

      .type-pill.card-autoconsumo {
        background: #dcfce7;
        color: #166534;
        border-color: #86efac;
      }

      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        z-index: 2100;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.2rem;
        backdrop-filter: blur(3px);
      }

      .modal-panel {
        width: min(1100px, 100%);
        max-height: 92vh;
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .modal-header {
        padding: 1rem 1.25rem;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
      }

      .modal-body {
        padding: 1rem;
        overflow: auto;
        background: #f9fafb;
      }

      .section-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 0.9rem;
        margin-bottom: 0.9rem;
      }

      .section-title {
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 0.7rem;
      }

      .form-label {
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        color: #6b7280;
        font-weight: 700;
      }

      .modal-footer {
        border-top: 1px solid #e5e7eb;
        padding: 0.9rem 1.25rem;
        display: flex;
        gap: 0.6rem;
        justify-content: flex-end;
        flex-wrap: wrap;
        background: #ffffff;
      }

      @media (max-width: 768px) {
        .trello-container {
          padding: 1rem;
        }

        .list-column {
          padding: 0.9rem;
          min-height: auto;
        }

        .cards-grid {
          grid-template-columns: 1fr;
        }

        .action-modal {
          width: 100%;
        }

        .modal-footer {
          justify-content: stretch;
        }

        .modal-footer .btn {
          width: 100%;
        }
      }
    `,
  ],
})
export class MemoriasListaComponent implements OnInit {
  memorias: any[] = [];
  cargando = true;
  memoriaSeleccionada: any = null;
  memoriaPendiente: any = null;
  guardandoDetalle = false;
  descargandoDetalle = false;

  private readonly apiBaseUrl = '';

  readonly meses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  readonly opcionesModalidadAutoconsumo = [
    { value: 'sinExcedentes', label: 'Sin excedentes' },
    { value: 'conExcedentes', label: 'Con excedentes' },
  ];

  readonly opcionesTipoInstalacionAutoconsumo = [
    { value: 'redInterior', label: 'Red interior' },
    {
      value: 'redInteriorDiversosConsumidores',
      label: 'Red interior de diversos consumidores',
    },
    { value: 'proximaApartirDeRed', label: 'Proxima a partir de red' },
  ];

  readonly opcionesTipoConexionAutoconsumo = [
    { value: 'redInterior', label: 'Red interior' },
    {
      value: 'redInteriorVariosConsumidores',
      label: 'Red interior de varios consumidores',
    },
    { value: 'proximaATravesDeRed', label: 'Proxima a traves de red' },
  ];

  readonly opcionesColectiva = [
    { value: 'si', label: 'Si' },
    { value: 'no', label: 'No' },
  ];

  readonly opcionesTipoActuacionAutoconsumo = [
    { value: 'nuevaInstalacion', label: 'Nueva instalacion' },
    {
      value: 'modificacionInstalacionExistente',
      label: 'Modificacion de instalacion existente',
    },
  ];

  readonly opcionesConfiguracionMedida = [
    {
      value: 'A',
      label: 'A - Un equipo de medida bidireccional en punto frontera',
    },
    {
      value: 'B',
      label:
        'B - Un equipo de medida bidireccional en punto de frontera y otro de generacion neta',
    },
    {
      value: 'C',
      label:
        'C - Un equipo de medida del consumo total y otro bidireccional de generacion neta',
    },
    {
      value: 'D',
      label:
        'D - Un equipo de medida del consumo total, otro de generacion bruta y otro de consumo de servicios auxiliares',
    },
    { value: 'E', label: 'E - Configuracion singular' },
  ];

  icons = {
    FileText,
    Plus,
    MapPin,
    Trash2,
  };

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.cargarMemorias();
  }

  cargarMemorias() {
    this.cargando = true;
    this.http.get<any[]>(`${this.apiBaseUrl}/api/memorias`).subscribe({
      next: (data) => {
        this.memorias = (data || [])
          .map((memoria) => ({
            ...memoria,
            tipoMemoria: this.normalizarTipoMemoria(
              memoria?.tipoMemoria,
              this.inferirTipoMemoriaDesdeDatos(memoria),
            ),
          }))
          .reverse();
        this.cargando = false;
      },
      error: (e) => {
        console.error('Error cargando memorias', e);
        this.cargando = false;
      },
    });
  }

  nuevaMemoria() {
    this.router.navigate(['/memoria-tecnica-diseno']);
  }

  getTipoMemoriaCardClass(memoria: any): 'card-consumo' | 'card-autoconsumo' {
    return this.normalizarTipoMemoria(memoria?.tipoMemoria) === 'autoconsumo'
      ? 'card-autoconsumo'
      : 'card-consumo';
  }

  getTipoMemoriaLabel(memoria: any): 'Autoconsumo' | 'Consumo' {
    return this.normalizarTipoMemoria(memoria?.tipoMemoria) === 'autoconsumo'
      ? 'Autoconsumo'
      : 'Consumo';
  }

  get esAutoconsumoSeleccionada(): boolean {
    return (
      this.normalizarTipoMemoria(
        this.memoriaSeleccionada?.tipoMemoria,
        this.inferirTipoMemoriaDesdeDatos(this.memoriaSeleccionada),
      ) === 'autoconsumo'
    );
  }

  abrirDetalle(memoria: any) {
    if (!memoria?.id) {
      alert('No se pudo abrir la memoria seleccionada.');
      return;
    }

    this.memoriaPendiente = memoria;
  }

  cerrarAccionMemoria() {
    if (this.guardandoDetalle || this.descargandoDetalle) return;
    this.memoriaPendiente = null;
  }

  descargarPendiente() {
    if (!this.memoriaPendiente?.id) return;
    const ruta = this.resolverRutaMemoria(this.memoriaPendiente);
    const urlTree = this.router.createUrlTree(
      [ruta, this.memoriaPendiente.id],
      {
        queryParams: {
          autoDownload: '1',
          dlToken: this.crearTokenDescarga(),
        },
      },
    );
    const url = this.router.serializeUrl(urlTree);
    this.dispararDescargaEnSegundoPlano(url);
    this.memoriaPendiente = null;
  }

  editarPendiente() {
    if (!this.memoriaPendiente?.id) return;
    const ruta = this.resolverRutaMemoria(this.memoriaPendiente);
    const id = this.memoriaPendiente.id;
    this.memoriaPendiente = null;
    this.router.navigate([ruta, id]);
  }


  confirmarEliminarMemoria(memoria: any, event: MouseEvent) {
    event.stopPropagation();

    if (!memoria?.id) {
      alert('No se pudo identificar la memoria a eliminar.');
      return;
    }

    const titular = [
      memoria?.titular?.apellidos || '',
      memoria?.titular?.nombre || '',
    ]
      .join(' ')
      .trim();

    const nombreMemoria = titular || 'esta memoria';
    const confirmado = window.confirm(
      `Estas seguro de eliminar ${nombreMemoria}? Esta accion no se puede deshacer.`,
    );

    if (!confirmado) return;
    this.eliminarMemoria(memoria.id);
  }

  cerrarDetalle() {
    if (this.guardandoDetalle || this.descargandoDetalle) return;
    this.memoriaSeleccionada = null;
  }

  onCambioMismaDireccion() {
    if (!this.memoriaSeleccionada?.mismaDireccion) return;

    const titularLocalidad =
      this.memoriaSeleccionada.titular.localidad ||
      this.memoriaSeleccionada.titular.poblacion ||
      '';
    this.memoriaSeleccionada.emplazamiento.direccion =
      this.memoriaSeleccionada.titular.domicilio || '';
    this.memoriaSeleccionada.emplazamiento.cp =
      this.memoriaSeleccionada.titular.cp || '';
    this.memoriaSeleccionada.emplazamiento.localidad = titularLocalidad;
    this.memoriaSeleccionada.emplazamiento.poblacion =
      this.memoriaSeleccionada.titular.poblacion || titularLocalidad;
    this.memoriaSeleccionada.emplazamiento.provincia =
      this.memoriaSeleccionada.titular.provincia || '';
    this.memoriaSeleccionada.emplazamiento.telefono =
      this.memoriaSeleccionada.titular.telefono || '';
    this.memoriaSeleccionada.emplazamiento.correo =
      this.memoriaSeleccionada.titular.correo || '';
  }

  actualizarDiametroTuboSeleccionada() {
    if (!this.memoriaSeleccionada?.caracteristicas) return;

    const tipoInstalacionNormalizado =
      this.memoriaSeleccionada.caracteristicas.tipoInstalacion === 'trifasica'
        ? 'trifasica'
        : 'monofasica';
    this.memoriaSeleccionada.caracteristicas.tipoInstalacion =
      tipoInstalacionNormalizado;

    const tipoCableNormalizado = Number(
      this.memoriaSeleccionada.caracteristicas.tipoCableMm2,
    );
    const tipoCable = [6, 10, 16].includes(tipoCableNormalizado)
      ? tipoCableNormalizado
      : 6;
    this.memoriaSeleccionada.caracteristicas.tipoCableMm2 = String(tipoCable);

    const esquemaNormalizado = String(
      this.memoriaSeleccionada.caracteristicas.esquemaUnifilar || '1',
    );
    this.memoriaSeleccionada.caracteristicas.esquemaUnifilar = ['1', '2'].includes(
      esquemaNormalizado,
    )
      ? esquemaNormalizado
      : '1';

    if (tipoCable === 16) {
      this.memoriaSeleccionada.caracteristicas.diametroTuboMm = '50';
      return;
    }

    if (tipoCable === 6 || tipoCable === 10) {
      this.memoriaSeleccionada.caracteristicas.diametroTuboMm =
        tipoInstalacionNormalizado === 'trifasica' ? '40' : '32';
      return;
    }

    this.memoriaSeleccionada.caracteristicas.diametroTuboMm = '';
  }

  onCambioColectivaSeleccionada() {
    if (
      !this.memoriaSeleccionada?.caracteristicas ||
      this.memoriaSeleccionada.caracteristicas.colectiva === 'si'
    ) {
      return;
    }
    this.memoriaSeleccionada.caracteristicas.numeroConsumidores = '';
  }

  private normalizarCamposAutoconsumoSeleccionada() {
    if (!this.memoriaSeleccionada) return;

    const caracteristicas = this.memoriaSeleccionada.caracteristicas || {};
    const normalizarOpcion = (
      valor: any,
      opciones: { value: string }[],
      fallback: string,
    ): string =>
      opciones.some((opcion) => opcion.value === valor) ? valor : fallback;

    caracteristicas.modalidadAutoconsumo = normalizarOpcion(
      caracteristicas.modalidadAutoconsumo,
      this.opcionesModalidadAutoconsumo,
      'sinExcedentes',
    );
    caracteristicas.tipoInstalacionAutoconsumo = normalizarOpcion(
      caracteristicas.tipoInstalacionAutoconsumo,
      this.opcionesTipoInstalacionAutoconsumo,
      'redInterior',
    );
    caracteristicas.tipoConexionAutoconsumo = normalizarOpcion(
      caracteristicas.tipoConexionAutoconsumo,
      this.opcionesTipoConexionAutoconsumo,
      'redInterior',
    );
    caracteristicas.colectiva = normalizarOpcion(
      caracteristicas.colectiva,
      this.opcionesColectiva,
      'no',
    );

    if (caracteristicas.colectiva !== 'si') {
      caracteristicas.numeroConsumidores = '';
    } else {
      const numero = Number(caracteristicas.numeroConsumidores);
      caracteristicas.numeroConsumidores =
        Number.isFinite(numero) && numero > 0 ? String(Math.trunc(numero)) : '';
    }

    this.memoriaSeleccionada.caracteristicas = caracteristicas;

    this.memoriaSeleccionada.configuracionMedida = normalizarOpcion(
      this.memoriaSeleccionada.configuracionMedida,
      this.opcionesConfiguracionMedida,
      'A',
    );

    const memoriaDescriptiva = this.memoriaSeleccionada.memoriaDescriptiva || {};
    memoriaDescriptiva.tipoActuacion =
      memoriaDescriptiva.tipoActuacion === 'modificacionInstalacionExistente'
        ? 'modificacionInstalacionExistente'
        : 'nuevaInstalacion';

    if (memoriaDescriptiva.tipoActuacion !== 'modificacionInstalacionExistente') {
      memoriaDescriptiva.numeroRegAutoconsumo = '';
    } else {
      memoriaDescriptiva.numeroRegAutoconsumo = String(
        memoriaDescriptiva.numeroRegAutoconsumo || '',
      ).trim();
    }

    this.memoriaSeleccionada.memoriaDescriptiva = memoriaDescriptiva;
  }

  async guardarDetalle() {
    await this.persistirDetalle(false);
  }

  async descargarDesdeDetalle() {
    this.descargandoDetalle = true;

    try {
      const ok = await this.persistirDetalle(true);
      if (!ok || !this.memoriaSeleccionada?.id) {
        return;
      }

      const tipoMemoriaSeleccionada = this.normalizarTipoMemoria(
        this.memoriaSeleccionada?.tipoMemoria,
        this.inferirTipoMemoriaDesdeDatos(this.memoriaSeleccionada),
      );
      const rutaEdicion =
        tipoMemoriaSeleccionada === 'autoconsumo'
          ? '/memoria-tecnica-diseno/autoconsumo'
          : '/memoria-tecnica-diseno/consumo';

      const urlTree = this.router.createUrlTree(
        [rutaEdicion, this.memoriaSeleccionada.id],
        {
          queryParams: {
            autoDownload: '1',
            dlToken: this.crearTokenDescarga(),
          },
        },
      );
      const url = this.router.serializeUrl(urlTree);
      this.dispararDescargaEnSegundoPlano(url);
    } finally {
      this.descargandoDetalle = false;
    }
  }

  private dispararDescargaEnSegundoPlano(url: string) {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);

    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
      } catch {}
    }, 30000);
  }

  private crearTokenDescarga(): string {
    return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  private persistirDetalle(silencioso: boolean): Promise<boolean> {
    if (!this.memoriaSeleccionada) return Promise.resolve(false);

    this.guardandoDetalle = true;
    this.memoriaSeleccionada.tipoMemoria = this.normalizarTipoMemoria(
      this.memoriaSeleccionada.tipoMemoria,
      this.inferirTipoMemoriaDesdeDatos(this.memoriaSeleccionada),
    );
    if (this.esAutoconsumoSeleccionada) {
      this.normalizarCamposAutoconsumoSeleccionada();
    } else {
      this.actualizarDiametroTuboSeleccionada();
    }
    this.sincronizarLocalidadPoblacionSeleccionada();
    this.onCambioMismaDireccion();
    this.sincronizarLocalidadPoblacionSeleccionada();

    return new Promise((resolve) => {
      this.http
        .post(`${this.apiBaseUrl}/api/memorias`, this.memoriaSeleccionada)
        .subscribe({
          next: (response: any) => {
            this.guardandoDetalle = false;

            if (response?.id) {
              this.memoriaSeleccionada.id = response.id;
            }

            this.memoriaSeleccionada.fechaEdicion = new Date().toISOString();
            this.actualizarMemoriaEnLista(this.memoriaSeleccionada);

            if (!silencioso) {
              alert('Datos guardados correctamente.');
            }

            resolve(true);
          },
          error: (error) => {
            this.guardandoDetalle = false;
            console.error('Error guardando memoria', error);
            alert('No se pudo guardar la memoria.');
            resolve(false);
          },
        });
    });
  }

  private eliminarMemoria(id: number) {
    this.http.delete(`${this.apiBaseUrl}/api/memorias/${id}`).subscribe({
      next: () => {
        this.memorias = this.memorias.filter((m) => m.id !== id);
        if (this.memoriaSeleccionada?.id === id) {
          this.memoriaSeleccionada = null;
        }
        alert('Memoria eliminada correctamente.');
      },
      error: (error) => {
        console.error('Error eliminando memoria', error);
        alert('No se pudo eliminar la memoria.');
      },
    });
  }

  private actualizarMemoriaEnLista(memoriaActualizada: any) {
    const idx = this.memorias.findIndex((m) => m.id === memoriaActualizada.id);
    if (idx === -1) {
      this.cargarMemorias();
      return;
    }

    this.memorias[idx] = {
      ...JSON.parse(JSON.stringify(memoriaActualizada)),
      tipoMemoria: this.normalizarTipoMemoria(
        memoriaActualizada?.tipoMemoria,
        this.inferirTipoMemoriaDesdeDatos(memoriaActualizada),
      ),
    };
    this.memorias = [...this.memorias];
  }

  private inferirTipoMemoriaDesdeDatos(memoria: any): 'consumo' | 'autoconsumo' {
    if (!memoria || typeof memoria !== 'object') {
      return 'consumo';
    }

    const caracteristicas = memoria?.caracteristicas || {};
    const memoriaDescriptiva = memoria?.memoriaDescriptiva || {};

    const tieneCamposAutoconsumo = Boolean(
      caracteristicas?.tipoInstalacionAutoconsumo ||
        caracteristicas?.modalidadAutoconsumo ||
        caracteristicas?.tipoConexionAutoconsumo ||
        caracteristicas?.colectiva ||
        memoriaDescriptiva?.tipoActuacion ||
        memoriaDescriptiva?.numeroRegAutoconsumo ||
        memoria?.configuracionMedida ||
        Array.isArray(memoria?.contadores) ||
        Array.isArray(memoria?.placas) ||
        Array.isArray(memoria?.inversores) ||
        Array.isArray(memoria?.lineas),
    );

    return tieneCamposAutoconsumo ? 'autoconsumo' : 'consumo';
  }

  private normalizarTipoMemoria(
    tipoMemoria: any,
    fallback: 'consumo' | 'autoconsumo' = 'consumo',
  ): 'consumo' | 'autoconsumo' {
    const valor = String(tipoMemoria || '').toLowerCase();
    if (valor === 'autoconsumo') return 'autoconsumo';
    if (valor === 'consumo') return 'consumo';
    return fallback;
  }

  private resolverRutaMemoria(memoria: any): string {
    const tipoMemoria = this.normalizarTipoMemoria(
      memoria?.tipoMemoria,
      this.inferirTipoMemoriaDesdeDatos(memoria),
    );
    return tipoMemoria === 'autoconsumo'
      ? '/memoria-tecnica-diseno/autoconsumo'
      : '/memoria-tecnica-diseno/consumo';
  }

  private normalizarMemoria(memoria: any) {
    const base = {
      id: null,
      tipoMemoria: 'consumo',
      mismaDireccion: false,
      titular: {
        nombre: '',
        apellidos: '',
        nif: '',
        domicilio: '',
        cp: '',
        localidad: '',
        poblacion: '',
        provincia: '',
        telefono: '',
        correo: '',
      },
      emplazamiento: {
        direccion: '',
        localidad: '',
        poblacion: '',
        provincia: '',
        cp: '',
        cups: '',
        refCatastral: '',
        telefono: '',
        correo: '',
        tension: '',
        empresaDistribuidora: 'I-DE REDES ELÉCTRICAS INTELIGENTES, S.A.U.',
        uso: '',
        superficie: '',
        planoImagen: null,
      },
      caracteristicas: {
        potenciaInstalada: '',
        tipoCableMm2: '6',
        tipoInstalacion: 'monofasica',
        diametroTuboMm: '32',
        esquemaUnifilar: '1',
        tipoInstalacionAutoconsumo: 'redInterior',
        modalidadAutoconsumo: 'sinExcedentes',
        tipoConexionAutoconsumo: 'redInterior',
        colectiva: 'no',
        numeroConsumidores: '',
      },
      memoriaDescriptiva: {
        tipoActuacion: 'nuevaInstalacion',
        numeroRegAutoconsumo: '',
        cambios: {
          deConExcedentesASinExcedentes: false,
          deSinExcedentesAConExcedentes: false,
          deProduccionTodoTodoASinExcedentes: false,
          deProduccionTodoTodoAConExcedentes: false,
          conVariacionPotencia: false,
          sustitucionEquipos: false,
          otros: false,
        },
        descripcionOtros: '',
      },
      configuracionMedida: 'A',
      fechaFirma: { dia: '', mes: '', anyo: '', lugar: '' },
      fechaCreacion: '',
      fechaEdicion: '',
    };

    const normalizada = {
      ...base,
      ...memoria,
      tipoMemoria: this.normalizarTipoMemoria(
        memoria?.tipoMemoria,
        this.inferirTipoMemoriaDesdeDatos(memoria),
      ),
      titular: { ...base.titular, ...(memoria?.titular || {}) },
      emplazamiento: {
        ...base.emplazamiento,
        ...(memoria?.emplazamiento || {}),
      },
      caracteristicas: {
        ...base.caracteristicas,
        ...(memoria?.caracteristicas || {}),
      },
      memoriaDescriptiva: {
        ...base.memoriaDescriptiva,
        ...(memoria?.memoriaDescriptiva || {}),
        cambios: {
          ...base.memoriaDescriptiva.cambios,
          ...(memoria?.memoriaDescriptiva?.cambios || {}),
        },
      },
      fechaFirma: { ...base.fechaFirma, ...(memoria?.fechaFirma || {}) },
    };

    this.sincronizarLocalidadPoblacion(normalizada.titular);
    this.sincronizarLocalidadPoblacion(normalizada.emplazamiento);

    return normalizada;
  }

  private sincronizarLocalidadPoblacion(obj: any) {
    if (!obj) return;

    const localidad = (obj.localidad || '').trim();
    const poblacion = (obj.poblacion || '').trim();

    if (!localidad && poblacion) {
      obj.localidad = poblacion;
    }
    if (!poblacion && localidad) {
      obj.poblacion = localidad;
    }
  }

  private sincronizarLocalidadPoblacionSeleccionada() {
    if (!this.memoriaSeleccionada) return;

    this.sincronizarLocalidadPoblacion(this.memoriaSeleccionada.titular);
    this.sincronizarLocalidadPoblacion(this.memoriaSeleccionada.emplazamiento);
  }
}
