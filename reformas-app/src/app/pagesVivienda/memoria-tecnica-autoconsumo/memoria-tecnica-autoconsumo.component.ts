import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemoriaTecnicaDisenoComponent } from '../memoria-tecnica-diseno/memoria-tecnica-diseno.component';

@Component({
  selector: 'app-memoria-tecnica-autoconsumo',
  standalone: true,
  imports: [CommonModule, MemoriaTecnicaDisenoComponent],
  template: `
    <div class="mode-banner">
      <h2>Memoria Técnica de Diseño - Autoconsumo</h2>
    </div>
    <app-memoria-tecnica-diseno></app-memoria-tecnica-diseno>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .mode-banner {
        background: #0f766e;
        color: #ffffff;
        border-radius: 0.75rem;
        padding: 0.75rem 1rem;
        margin-bottom: 1rem;
      }

      .mode-banner h2 {
        margin: 0;
        font-size: 1rem;
        font-weight: 700;
      }
    `,
  ],
})
export class MemoriaTecnicaAutoconsumoComponent {}
