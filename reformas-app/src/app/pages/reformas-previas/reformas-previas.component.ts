import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reformas-previas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reformas-previas.component.html',
})
export class ReformasPreviasComponent implements OnInit {
  @Input() datos: any = { descripcionReformas: '' };

  @Output() autosave = new EventEmitter<any>();
  @Output() continuar = new EventEmitter<any>();
  @Output() volverAlFormulario = new EventEmitter<any>();

  ngOnInit(): void {
    console.log('ReformasPreviasComponent ngOnInit', this.datos);
  }

  // Emitir autosave cada vez que cambia el textarea
  onChange() {
    this.autosave.emit(this.datos);
  }

  continuarConGenerador() {
    this.autosave.emit(this.datos); // asegurar que guarda antes de avanzar
    this.continuar.emit(this.datos);
  }

  volver() {
    this.autosave.emit(this.datos); // asegurar que guarda antes de volver
    this.volverAlFormulario.emit(this.datos);
  }
}
