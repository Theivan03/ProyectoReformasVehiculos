import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-memoria-tecnica-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="selector-wrap">
      <div class="selector-card">
        <h1 class="title">Tipo de Memoria Técnica</h1>
        <p class="subtitle">
          Selecciona el tipo de expediente que quieres generar.
        </p>

        <div class="options">
          <button class="option-btn consumo" (click)="irAConsumo()">
            <span class="option-title">Consumo</span>
            <span class="option-desc"
              >Memoria técnica de diseño estándar</span
            >
          </button>

          <button class="option-btn autoconsumo" (click)="irAAutoconsumo()">
            <span class="option-title">Autoconsumo</span>
            <span class="option-desc"
              >Versión de memoria técnica para autoconsumo</span
            >
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .selector-wrap {
        min-height: 70vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
      }

      .selector-card {
        width: 100%;
        max-width: 760px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 1rem;
        padding: 2rem;
        box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
      }

      .title {
        margin: 0 0 0.5rem;
        color: #0f172a;
        font-weight: 700;
      }

      .subtitle {
        margin: 0 0 1.5rem;
        color: #475569;
      }

      .options {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
      }

      .option-btn {
        text-align: left;
        border: 1px solid #cbd5e1;
        background: #f8fafc;
        border-radius: 0.75rem;
        padding: 1rem 1.1rem;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      .option-btn:hover {
        transform: translateY(-2px);
        border-color: #2563eb;
        box-shadow: 0 10px 18px rgba(37, 99, 235, 0.15);
      }

      .option-title {
        font-size: 1.05rem;
        font-weight: 700;
        color: #0f172a;
      }

      .option-desc {
        font-size: 0.92rem;
        color: #64748b;
      }

      .consumo {
        background: linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%);
      }

      .autoconsumo {
        background: linear-gradient(180deg, #ecfeff 0%, #f8fafc 100%);
      }

      @media (max-width: 768px) {
        .options {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class MemoriaTecnicaSelectorComponent {
  constructor(private router: Router) {}

  irAConsumo() {
    this.router.navigate(['/memoria-tecnica-diseno/consumo']);
  }

  irAAutoconsumo() {
    this.router.navigate(['/memoria-tecnica-diseno/autoconsumo']);
  }
}
