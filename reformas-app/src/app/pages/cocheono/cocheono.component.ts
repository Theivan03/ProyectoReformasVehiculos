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

  /** Solo para coche: las condiciones a marcar */
  opcionesCoche: boolean[] = [false, false, false, false, false, false];

  ngOnInit(): void {
    console.log('CocheonoComponent ngOnInit', this.datosEntrada);
    const tipo = (this.datosEntrada?.tipoVehiculo || '')
      .toString()
      .trim()
      .toLowerCase();

    // Carga estado previo si existe
    if (Array.isArray(this.datosEntrada?.opcionesCoche)) {
      this.opcionesCoche = this.opcionesCoche.map((_, index) =>
        Boolean(this.datosEntrada.opcionesCoche[index]),
      );
    }

    // Primer autosave al entrar (por si recargan)
    this.emitAutosave();
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

    this.continuar.emit(this.datosEntrada);
  }
}
