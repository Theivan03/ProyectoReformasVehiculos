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

  @Input() set seccionesPreseleccionadas(v: string[] | null | undefined) {
    this._pre = Array.isArray(v) ? v : [];
    console.log('Input recibido en seleccion-secciones:', this._pre);
    this.syncFromPre();
  }
  get seccionesPreseleccionadas() {
    return this._pre;
  }

  @Output() continuar = new EventEmitter<
    { codigo: string; descripcion: string }[]
  >();

  opcionesReforma: { codigo: string; descripcion: string }[] = opciones as any;
  seccionesSeleccionadas: { codigo: string; descripcion: string }[] = [];

  ngOnInit(): void {
    this.syncFromPre();
    console.log('Preseleccionadas:', this.seccionesPreseleccionadas);
  }

  private syncFromPre() {
    const pre = new Set((this._pre || []).map(String));
    const opciones = Array.isArray(this.opcionesReforma)
      ? this.opcionesReforma
      : [];
    this.seccionesSeleccionadas = opciones.filter((op) =>
      pre.has(String(op.codigo))
    );
  }

  toggleSeleccion(opcion: { codigo: string; descripcion: string }) {
    const existe = this.seccionesSeleccionadas.find(
      (s) => s.codigo === opcion.codigo
    );
    this.seccionesSeleccionadas = existe
      ? this.seccionesSeleccionadas.filter((s) => s.codigo !== opcion.codigo)
      : [...this.seccionesSeleccionadas, opcion];
  }

  enviarSeleccion() {
    const ordenadas = [...this.seccionesSeleccionadas].sort(
      (a, b) => Number(a.codigo) - Number(b.codigo)
    );
    this.continuar.emit(ordenadas);
  }

  estaSeleccionada(codigo: string): boolean {
    return this.seccionesSeleccionadas.some((s) => s.codigo === codigo);
  }

  get codigosPreseleccionados(): string[] {
    return this.seccionesSeleccionadas.map((s) => s.codigo);
  }
}
