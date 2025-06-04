import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-resumen-modificaciones',
  imports: [CommonModule, FormsModule],
  templateUrl: './resumen-modificaciones.component.html',
  styleUrl: './resumen-modificaciones.component.css',
})
export class ResumenModificacionesComponent implements OnInit {
  @Input() datosEntrada: any;
  @Output() volver = new EventEmitter<any>();
  @Output() continuar = new EventEmitter<any>();
  formSubmitted = false;

  modificacionesSeleccionadas: any[] = [];

  ngOnInit(): void {
    this.modificacionesSeleccionadas = this.datosEntrada.modificaciones.filter(
      (mod: any) => mod.seleccionado
    );
  }

  formularioInvalido(): boolean {
    return this.modificacionesSeleccionadas.some((mod) => {
      if (
        mod.nombre === 'DISCO DE FRENO Y PINZA DE FRENO' &&
        mod.seleccionado
      ) {
        return !mod.tieneDisco && !mod.tienePastilla;
      }
      return false;
    });
  }

  onVolver(): void {
    this.volver.emit(this.datosEntrada);
  }

  onContinuar(form: NgForm): void {
    this.formSubmitted = true;

    if (form.invalid || this.formularioInvalido()) {
      return;
    }

    this.continuar.emit(this.datosEntrada);
  }
}
