import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reformas-previas',
  imports: [CommonModule, FormsModule],
  templateUrl: './reformas-previas.component.html',
  styleUrl: './reformas-previas.component.css',
})
export class ReformasPreviasComponent {
  @Input() datos: any;
  @Output() continuar = new EventEmitter<any>();
  @Output() volverAlFormulario = new EventEmitter<any>();

  continuarConGenerador() {
    this.continuar.emit(this.datos);
  }

  volver(): void {
    this.volverAlFormulario.emit(this.datos);
  }
}
