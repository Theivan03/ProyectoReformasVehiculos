import { FormsModule, NgForm } from '@angular/forms';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-cocheono',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './cocheono.component.html',
  styleUrls: ['./cocheono.component.css'],
})
export class CocheonoComponent implements OnInit {
  @Input() datosEntrada: any = {};

  /** Avanzar */
  @Output() continuar = new EventEmitter<any>();
  /** Volver */
  @Output() volver = new EventEmitter<any>();
  /** Autosave continuo */
  @Output() autosave = new EventEmitter<any>();

  /** Solo para coche: las 5 condiciones a marcar */
  opcionesCoche: boolean[] = [false, false, false, false, false];

  ngOnInit(): void {
    console.log('CocheonoComponent ngOnInit', this.datosEntrada);
    const tipo = (this.datosEntrada?.tipoVehiculo || '')
      .toString()
      .trim()
      .toLowerCase();

    // Carga estado previo si existe
    if (
      Array.isArray(this.datosEntrada?.opcionesCoche) &&
      this.datosEntrada.opcionesCoche.length === 5
    ) {
      this.opcionesCoche = [...this.datosEntrada.opcionesCoche];
    }

    // Primer autosave al entrar (por si recargan)
    this.emitAutosave();

    // Si NO es coche, saltamos este componente automáticamente (guardando antes)
    // if (tipo !== 'coche') {
    //   this.datosEntrada.opcionesCoche = this.opcionesCoche;
    //   this.emitAutosave();
    //   this.continuar.emit(this.datosEntrada);
    // }
  }

  /** Emite snapshot seguro */
  private emitAutosave() {
    this.autosave.emit({
      ...(this.datosEntrada || {}),
      opcionesCoche: this.opcionesCoche,
    });
  }

  /** Llamar desde el template en cada cambio (checkbox) */
  onCambioOpcion(): void {
    this.emitAutosave();
  }

  anyOpcionCocheSeleccionada(): boolean {
    return this.opcionesCoche.some((v) => v);
  }

  /** Botón “← Volver” */
  onVolver(): void {
    this.datosEntrada.opcionesCoche = this.opcionesCoche;
    this.emitAutosave();
    this.volver.emit(this.datosEntrada);
  }

  /** Botón “Siguiente” o “Continuar” */
  onContinuar(form?: NgForm): void {
    const tipo = (this.datosEntrada?.tipoVehiculo || '')
      .toString()
      .trim()
      .toLowerCase();

    // Guarda siempre antes de decidir
    this.datosEntrada.opcionesCoche = this.opcionesCoche;
    this.emitAutosave();

    if (tipo !== 'coche') {
      this.continuar.emit(this.datosEntrada);
      return;
    }

    // Para coche: requiere al menos una opción
    // if (this.anyOpcionCocheSeleccionada()) {
    this.continuar.emit(this.datosEntrada);
    // } else {
    //   form?.control.markAllAsTouched();
    // }
  }
}
