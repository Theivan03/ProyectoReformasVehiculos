import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import opciones from '../../../assets/opciones_reforma_vehiculos.json';

@Component({
  selector: 'app-seleccion-secciones',
  standalone: true,
  imports: [],
  templateUrl: './seleccion-secciones.component.html',
  styleUrls: ['./seleccion-secciones.component.css'],
})
export class SeleccionSeccionesComponent implements OnInit {
  private _pre: string[] = [];

  /** Preselecciones que llegan del padre (p. ej. al reanudar). */
  @Input() set seccionesPreseleccionadas(v: string[] | null | undefined) {
    this._pre = Array.isArray(v) ? v : [];
    this.syncFromPre();
  }
  get seccionesPreseleccionadas() {
    return this._pre;
  }

  /** Continuar → emitimos la selección ordenada */
  @Output() continuar = new EventEmitter<
    { codigo: string; descripcion: string }[]
  >();

  /** NUEVO: Volver → emitimos payload para que el padre regrese a Resumen */
  @Output() volver = new EventEmitter<{
    secciones: { codigo: string; descripcion: string }[];
    codigos: string[];
    extra?: any;
  }>();

  opcionesReforma: { codigo: string; descripcion: string }[] = opciones as any;
  seccionesSeleccionadas: { codigo: string; descripcion: string }[] = [];

  ngOnInit(): void {
    console.log(
      'Opciones de reforma cargadas en seleccion secciones:',
      this.opcionesReforma
    );
    this.syncFromPre();
  }

  /** Sincroniza el estado interno desde las preselecciones del padre */
  private syncFromPre() {
    const pre = new Set((this._pre || []).map(String));
    const lista = Array.isArray(this.opcionesReforma)
      ? this.opcionesReforma
      : [];
    this.seccionesSeleccionadas = lista.filter((op) =>
      pre.has(String(op.codigo))
    );
  }

  /** Marca/desmarca una opción al hacer click */
  toggleSeleccion(opcion: { codigo: string; descripcion: string }) {
    const existe = this.seccionesSeleccionadas.find(
      (s) => s.codigo === opcion.codigo
    );
    this.seccionesSeleccionadas = existe
      ? this.seccionesSeleccionadas.filter((s) => s.codigo !== opcion.codigo)
      : [...this.seccionesSeleccionadas, opcion];
  }

  /** Continuar → emite la selección ordenada por código */
  enviarSeleccion() {
    const ordenadas = [...this.seccionesSeleccionadas].sort(
      (a, b) => Number(a.codigo) - Number(b.codigo)
    );
    this.continuar.emit(ordenadas);
  }

  /** Volver → emite payload con secciones + códigos + metadatos */
  onVolver() {
    const codigos = this.seccionesSeleccionadas.map((s) => s.codigo);
    this.volver.emit({
      secciones: [...this.seccionesSeleccionadas],
      codigos,
      extra: {
        origen: 'seleccion-secciones',
        timestamp: Date.now(),
      },
    });
  }

  /** Utilidad: comprueba si un código está en la selección */
  estaSeleccionada(codigo: string): boolean {
    return this.seccionesSeleccionadas.some((s) => s.codigo === codigo);
  }

  /** (Opcional) Getter auxiliar con los códigos actuales */
  get codigosPreseleccionados(): string[] {
    return this.seccionesSeleccionadas.map((s) => s.codigo);
  }
}
