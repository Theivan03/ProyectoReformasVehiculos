import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  FileText,
  Plus,
  Search,
  Download,
  Save,
  X,
  MapPin,
  User,
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

    <div *ngIf="memoriaSeleccionada" class="modal-backdrop" (click)="cerrarDetalle()">
      <section class="modal-panel" (click)="$event.stopPropagation()">
        <header class="modal-header">
          <div>
            <h4 class="mb-1 fw-bold">Resumen rapido de memoria tecnica</h4>
            <div class="text-muted small">Edita datos y descarga el documento desde aqui</div>
          </div>
          <button class="btn btn-sm btn-outline-secondary" (click)="cerrarDetalle()">
            <lucide-icon [img]="icons.X" size="16"></lucide-icon>
          </button>
        </header>

        <div class="modal-body">
          <div class="section-card">
            <h6 class="section-title">Titular</h6>
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label">Nombre</label>
                <input class="form-control" [(ngModel)]="memoriaSeleccionada.titular.nombre" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Apellidos</label>
                <input class="form-control" [(ngModel)]="memoriaSeleccionada.titular.apellidos" />
              </div>
              <div class="col-md-4">
                <label class="form-label">NIF / CIF</label>
                <input class="form-control" [(ngModel)]="memoriaSeleccionada.titular.nif" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Telefono</label>
                <input class="form-control" [(ngModel)]="memoriaSeleccionada.titular.telefono" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Correo</label>
                <input class="form-control" [(ngModel)]="memoriaSeleccionada.titular.correo" />
              </div>
              <div class="col-md-12">
                <label class="form-label">Domicilio</label>
                <input class="form-control" [(ngModel)]="memoriaSeleccionada.titular.domicilio" />
              </div>
              <div class="col-md-3">
                <label class="form-label">CP</label>
                <input class="form-control" [(ngModel)]="memoriaSeleccionada.titular.cp" />
              </div>
              <div class="col-md-3">
                <label class="form-label">Localidad</label>
                <input class="form-control" [(ngModel)]="memoriaSeleccionada.titular.localidad" />
              </div>
              <div class="col-md-3">
                <label class="form-label">Poblacion</label>
                <input class="form-control" [(ngModel)]="memoriaSeleccionada.titular.poblacion" />
              </div>
              <div class="col-md-3">
                <label class="form-label">Provincia</label>
                <input class="form-control" [(ngModel)]="memoriaSeleccionada.titular.provincia" />
              </div>
            </div>
          </div>

          <div class="section-card">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="section-title mb-0">Emplazamiento</h6>
              <div class="form-check form-switch">
                <input
                  class="form-check-input"
                  type="checkbox"
                  [(ngModel)]="memoriaSeleccionada.mismaDireccion"
                  (ngModelChange)="onCambioMismaDireccion()"
                  id="mismaDireccionRapida"
                />
                <label class="form-check-label small" for="mismaDireccionRapida">
                  Misma direccion
                </label>
              </div>
            </div>

            <div class="row g-3">
              <div class="col-md-12">
                <label class="form-label">Direccion</label>
                <input class="form-control" [(ngModel)]="memoriaSeleccionada.emplazamiento.direccion" />
              </div>
              <div class="col-md-3">
                <label class="form-label">CP</label>
                <input class="form-control" [(ngModel)]="memoriaSeleccionada.emplazamiento.cp" />
              </div>
              <div class="col-md-3">
                <label class="form-label">Localidad</label>
                <input class="form-control" [(ngModel)]="memoriaSeleccionada.emplazamiento.localidad" />
              </div>
              <div class="col-md-3">
                <label class="form-label">Poblacion</label>
                <input class="form-control" [(ngModel)]="memoriaSeleccionada.emplazamiento.poblacion" />
              </div>
              <div class="col-md-3">
                <label class="form-label">Provincia</label>
                <input class="form-control" [(ngModel)]="memoriaSeleccionada.emplazamiento.provincia" />
              </div>
              <div class="col-md-4">
                <label class="form-label">CUPS</label>
                <input class="form-control font-monospace" [(ngModel)]="memoriaSeleccionada.emplazamiento.cups" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Ref. catastral</label>
                <input class="form-control" [(ngModel)]="memoriaSeleccionada.emplazamiento.refCatastral" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Uso</label>
                <select class="form-select" [(ngModel)]="memoriaSeleccionada.emplazamiento.uso">
                  <option value="">Seleccionar</option>
                  <option value="Vivienda">Vivienda</option>
                  <option value="Local">Local</option>
                  <option value="Garaje">Garaje</option>
                  <option value="Oficina">Oficina</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label">Superficie (m2)</label>
                <input class="form-control" type="number" [(ngModel)]="memoriaSeleccionada.emplazamiento.superficie" />
              </div>
            </div>
          </div>

          <div class="section-card">
            <h6 class="section-title">Caracteristicas</h6>
            <div class="row g-3">
              <div class="col-md-3">
                <label class="form-label">Potencia (kW)</label>
                <input class="form-control" type="number" [(ngModel)]="memoriaSeleccionada.caracteristicas.potenciaInstalada" />
              </div>
              <div class="col-md-3">
                <label class="form-label">Cable (mm2)</label>
                <select
                  class="form-select"
                  [(ngModel)]="memoriaSeleccionada.caracteristicas.tipoCableMm2"
                  (ngModelChange)="actualizarDiametroTuboSeleccionada()"
                >
                  <option value="6">6</option>
                  <option value="10">10</option>
                  <option value="16">16</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">Instalacion</label>
                <select
                  class="form-select"
                  [(ngModel)]="memoriaSeleccionada.caracteristicas.tipoInstalacion"
                  (ngModelChange)="actualizarDiametroTuboSeleccionada()"
                >
                  <option value="monofasica">Monofasica</option>
                  <option value="trifasica">Trifasica</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">Diametro tubo</label>
                <input
                  class="form-control"
                  [(ngModel)]="memoriaSeleccionada.caracteristicas.diametroTuboMm"
                  readonly
                />
              </div>
              <div class="col-md-4">
                <label class="form-label">Esquema unifilar</label>
                <select class="form-select" [(ngModel)]="memoriaSeleccionada.caracteristicas.esquemaUnifilar">
                  <option value="1">1</option>
                  <option value="2">2</option>
                </select>
              </div>
            </div>
          </div>

          <div class="section-card">
            <h6 class="section-title">Firma</h6>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Lugar</label>
                <input class="form-control" [(ngModel)]="memoriaSeleccionada.fechaFirma.lugar" />
              </div>
              <div class="col-md-2">
                <label class="form-label">Dia</label>
                <input class="form-control" [(ngModel)]="memoriaSeleccionada.fechaFirma.dia" />
              </div>
              <div class="col-md-2">
                <label class="form-label">Mes</label>
                <select class="form-select" [(ngModel)]="memoriaSeleccionada.fechaFirma.mes">
                  <option *ngFor="let mes of meses" [value]="mes">{{ mes }}</option>
                </select>
              </div>
              <div class="col-md-2">
                <label class="form-label">Anyo</label>
                <input class="form-control" [(ngModel)]="memoriaSeleccionada.fechaFirma.anyo" />
              </div>
            </div>
          </div>
        </div>

        <footer class="modal-footer">
          <button
            class="btn btn-outline-secondary"
            (click)="cerrarDetalle()"
            [disabled]="guardandoDetalle || descargandoDetalle"
          >
            Cerrar
          </button>
          <button
            class="btn btn-success d-flex align-items-center gap-2"
            (click)="guardarDetalle()"
            [disabled]="guardandoDetalle || descargandoDetalle"
          >
            <lucide-icon [img]="icons.Save" size="16"></lucide-icon>
            {{ guardandoDetalle ? 'Guardando...' : 'Guardar cambios' }}
          </button>
          <button
            class="btn btn-primary d-flex align-items-center gap-2"
            (click)="descargarDesdeDetalle()"
            [disabled]="guardandoDetalle || descargandoDetalle"
          >
            <lucide-icon [img]="icons.Download" size="16"></lucide-icon>
            {{ descargandoDetalle ? 'Preparando...' : 'Descargar documento' }}
          </button>
        </footer>
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
  guardandoDetalle = false;
  descargandoDetalle = false;

  private readonly apiBaseUrl = `http://${window.location.hostname || 'localhost'}:3000`;

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

  icons = {
    FileText,
    Plus,
    Search,
    Download,
    Save,
    X,
    MapPin,
    User,
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
            tipoMemoria: this.normalizarTipoMemoria(memoria?.tipoMemoria),
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

  abrirDetalle(memoria: any) {
    this.memoriaSeleccionada = this.normalizarMemoria(
      JSON.parse(JSON.stringify(memoria || {})),
    );
    this.actualizarDiametroTuboSeleccionada();
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

      const urlTree = this.router.createUrlTree(
        ['/memoria-tecnica-diseno', this.memoriaSeleccionada.id],
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
    );
    this.actualizarDiametroTuboSeleccionada();
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
      tipoMemoria: this.normalizarTipoMemoria(memoriaActualizada?.tipoMemoria),
    };
    this.memorias = [...this.memorias];
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
      },
      fechaFirma: { dia: '', mes: '', anyo: '', lugar: '' },
      fechaCreacion: '',
      fechaEdicion: '',
    };

    const normalizada = {
      ...base,
      ...memoria,
      tipoMemoria: this.normalizarTipoMemoria(memoria?.tipoMemoria),
      titular: { ...base.titular, ...(memoria?.titular || {}) },
      emplazamiento: {
        ...base.emplazamiento,
        ...(memoria?.emplazamiento || {}),
      },
      caracteristicas: {
        ...base.caracteristicas,
        ...(memoria?.caracteristicas || {}),
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
