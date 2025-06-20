import { FormsModule, NgForm } from '@angular/forms';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cocheono',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cocheono.component.html',
  styleUrl: './cocheono.component.css',
})
export class CocheonoComponent implements OnInit {
  @Input() datosEntrada: any;

  /** Emitimos para avanzar hacia el siguiente paso */
  @Output() continuar = new EventEmitter<any>();

  /** Emitimos para volver al paso anterior */
  @Output() volver = new EventEmitter<any>();

  /** Solo para coche: las 5 condiciones a marcar */
  opcionesCoche: boolean[] = [false, false, false, false, false];

  ngOnInit(): void {
    // Si NO es coche, saltamos este componente automáticamente
    if (this.datosEntrada.tipoVehiculo !== 'coche') {
      // reemitimos tal cual sin esperar a interacción
      this.opcionesCoche = [false, false, false, false, false];
      this.datosEntrada.opcionesCoche = this.opcionesCoche;
      this.continuar.emit(this.datosEntrada);
    } else {
      this.opcionesCoche = this.datosEntrada.opcionesCoche || [
        false,
        false,
        false,
        false,
        false,
      ];
    }
  }

  anyOpcionCocheSeleccionada(): boolean {
    return this.opcionesCoche.some((v) => v);
  }

  /** Botón “← Volver” */
  onVolver(): void {
    // Si estamos en sub‐paso (2), volvemos a paso 1

    // Si estamos en paso 1, volvemos al padre
    this.volver.emit(this.datosEntrada);
  }

  /** Botón “Siguiente” o “Continuar” */
  onContinuar(form?: NgForm): void {
    // Si NO es coche (por si el usuario tarda en arrancar), salvamos
    if (this.datosEntrada.tipoVehiculo !== 'coche') {
      this.datosEntrada.opcionesCoche = this.opcionesCoche;
      this.continuar.emit(this.datosEntrada);
      return;
    }

    // Paso 2: validamos al menos una opción marcada
    if (this.opcionesCoche.some((v) => v)) {
      // adjuntamos las respuestas y emitimos
      this.datosEntrada.opcionesCoche = this.opcionesCoche;
      this.continuar.emit(this.datosEntrada);
    } else {
      // marcamos el form como “tocado” para mostrar el error
      form?.control.markAllAsTouched();
    }
  }
}
