import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  FileText,
  Plus,
  Pencil,
  Trash2,
  Search,
} from 'lucide-angular';

@Component({
  selector: 'app-memorias-lista',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule, LucideAngularModule],
  template: `
    <div class="main-container">
      <div class="app-card">
        <div
          class="app-header d-flex justify-content-between align-items-center"
        >
          <div>
            <h1 class="h4 fw-bold mb-1">Memorias Guardadas</h1>
            <p class="mb-0 opacity-75 small">Gestión de expedientes técnicos</p>
          </div>
          <button
            class="btn btn-primary d-flex align-items-center gap-2"
            (click)="nuevaMemoria()"
          >
            <lucide-icon [img]="icons.Plus" size="18"></lucide-icon> Nueva
            Memoria
          </button>
        </div>

        <div class="content-area p-4">
          <div *ngIf="cargando" class="text-center py-5 text-muted">
            <div class="spinner-border mb-2" role="status"></div>
            <p>Cargando memorias...</p>
          </div>

          <div
            *ngIf="!cargando && memorias.length === 0"
            class="text-center py-5"
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
            <button
              class="btn btn-outline-primary btn-sm"
              (click)="nuevaMemoria()"
            >
              Crear Ahora
            </button>
          </div>

          <div
            *ngIf="!cargando && memorias.length > 0"
            class="table-responsive"
          >
            <table class="table table-hover align-middle">
              <thead class="table-light">
                <tr>
                  <th>Titular</th>
                  <th>Dirección</th>
                  <th>Fecha Edición</th>
                  <th class="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let m of memorias">
                  <td>
                    <div class="fw-bold">
                      {{ m.titular.nombre || 'Sin Nombre' }}
                    </div>
                    <div class="small text-muted">{{ m.titular.nif }}</div>
                  </td>
                  <td>
                    <div>
                      {{ m.emplazamiento.direccion || 'Sin Dirección' }}
                    </div>
                    <div class="small text-muted">
                      {{ m.emplazamiento.poblacion }}
                    </div>
                  </td>
                  <td>
                    <span class="badge bg-light text-dark border">
                      {{
                        m.fechaEdicion || m.fechaCreacion | date : 'shortDate'
                      }}
                    </span>
                  </td>
                  <td class="text-end">
                    <button
                      class="btn btn-sm btn-outline-primary me-2"
                      (click)="editarMemoria(m.id)"
                      title="Editar"
                    >
                      <lucide-icon [img]="icons.Pencil" size="16"></lucide-icon>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        background-color: #f1f5f9;
        min-height: 100vh;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
          sans-serif;
      }
      .main-container {
        padding: 2rem 1rem;
      }
      .app-card {
        border: none;
        border-radius: 1rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        background-color: white;
        max-width: 1000px;
        margin: 0 auto;
      }
      .app-header {
        background-color: #0f172a;
        padding: 1.5rem 2rem;
        color: white;
      }
      .table-hover tbody tr:hover {
        background-color: #f8fafc;
      }
    `,
  ],
})
export class MemoriasListaComponent implements OnInit {
  memorias: any[] = [];
  cargando = true;
  private readonly apiBaseUrl = `http://${window.location.hostname || 'localhost'}:3000`;
  icons = { FileText, Plus, Pencil, Trash2, Search };

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.cargarMemorias();
  }

  cargarMemorias() {
    this.cargando = true;
    this.http.get<any[]>(`${this.apiBaseUrl}/api/memorias`).subscribe({
      next: (data) => {
        this.memorias = data.reverse(); // Mostrar las más recientes primero
        this.cargando = false;
      },
      error: (e) => {
        console.error('Error cargando memorias', e);
        this.cargando = false;
      },
    });
  }

  nuevaMemoria() {
    // Navega al componente de diseño SIN id
    this.router.navigate(['/memoria-tecnica-diseno']);
  }

  editarMemoria(id: number) {
    // Navega al componente de diseño CON id
    this.router.navigate(['/memoria-tecnica-diseno', id]);
  }
}
