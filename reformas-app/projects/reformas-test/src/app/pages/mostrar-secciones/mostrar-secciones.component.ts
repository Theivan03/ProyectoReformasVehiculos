import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import codigosReforma from '../../../assets/codigos_reforma_vehiculo.json';

@Component({
  selector: 'app-mostrar-secciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mostrar-secciones.component.html',
  styleUrls: ['./mostrar-secciones.component.css'],
})
export class MostrarSeccionesComponent implements OnInit {
  private _secciones: { codigo: string; descripcion: string }[] = [];
  get secciones() {
    return this._secciones;
  }
  @Input() set secciones(
    v: { codigo: string; descripcion: string }[] | null | undefined
  ) {
    this._secciones = Array.isArray(v) ? v : [];
    this.rebuild(); // recalcula opciones y checked
    this.aplicarIndice(); // posiciona según desdePosterior
  }

  private _respuestas: {
    [codigo: string]: { codigo: string; descripcion: string }[];
  } = {};
  get respuestas() {
    return this._respuestas;
  }
  @Input() set respuestas(
    v:
      | { [codigo: string]: { codigo: string; descripcion: string }[] }
      | null
      | undefined
  ) {
    this._respuestas = v ?? {};
    // No cambiamos el índice aquí; solo re-marcamos checks al rebuild
    // Si quieres re-posicionar al entrar con respuestas, lo harías con aplicarIndice()
  }

  // ⚠️ NUEVO: flag que viene del padre para saber si llegamos desde el paso posterior
  private _desdePosterior = false;
  @Input() set desdePosterior(v: boolean | null | undefined) {
    this._desdePosterior = !!v;
    // Cada vez que cambia este flag, re-posicionamos
    this.aplicarIndice();
  }

  @Output() volverASeleccion = new EventEmitter<{
    [codigo: string]: { codigo: string; descripcion: string }[];
  }>();
  @Output() finalizarRecoleccion = new EventEmitter<{
    [codigo: string]: { codigo: string; descripcion: string }[];
  }>();

  indiceActual = 0;
  seccionesFiltradas: Array<{
    codigo: string;
    descripcion: string;
    opciones: any[];
  }> = [];

  ngOnInit(): void {
    console.log('MostrarSeccionesComponent initialized with:', {
      secciones: this._secciones,
      respuestas: this._respuestas,
      desdePosterior: this._desdePosterior,
    });
    this.rebuild();
    this.aplicarIndice();
  }

  private rebuild() {
    const all = (codigosReforma as any[]) || [];
    this.seccionesFiltradas = this._secciones.map((s) => {
      const opciones = all.filter((op) =>
        String(op?.codigo ?? '').startsWith(s.codigo + '.')
      );

      // marca checked según respuestas actuales
      const opcionesMarcadas = opciones.map((op) => ({
        ...op,
        checked: this.isOpcionSeleccionada(s.codigo, op.codigo),
      }));

      return { ...s, opciones: opcionesMarcadas };
    });
  }

  // 🔑 Posiciona el índice según el flag que viene del padre
  private aplicarIndice() {
    if (!this.seccionesFiltradas.length) return;

    if (this._desdePosterior) {
      // Al volver desde el paso posterior → ir al ÚLTIMO
      this.indiceActual = this.seccionesFiltradas.length - 1;
    } else {
      // Al entrar “normal” desde selección → ir al PRIMERO
      this.indiceActual = 0;
    }
  }

  isOpcionSeleccionada(seccionCodigo: string, opcionCodigo: string): boolean {
    return (
      this._respuestas[seccionCodigo]?.some(
        (item) => item.codigo === opcionCodigo
      ) ?? false
    );
  }

  onToggleOpcion(
    seccionCodigo: string,
    opcion: { codigo: string; descripcion: string }
  ): void {
    if (!this._respuestas[seccionCodigo]) this._respuestas[seccionCodigo] = [];
    const idx = this._respuestas[seccionCodigo].findIndex(
      (it) => it.codigo === opcion.codigo
    );
    if (idx === -1) {
      this._respuestas[seccionCodigo].push({
        codigo: opcion.codigo,
        descripcion: opcion.descripcion,
      });
    } else {
      this._respuestas[seccionCodigo].splice(idx, 1);
    }
  }

  siguiente(): void {
    if (this.indiceActual < this.seccionesFiltradas.length - 1) {
      this.indiceActual++;
    } else {
      this.finalizarRecoleccion.emit(this._respuestas);
    }
  }

  volver(): void {
    if (this.indiceActual > 0) {
      this.indiceActual--;
    } else {
      this.volverASeleccion.emit(this._respuestas);
    }
  }

  get seccionActual() {
    return this.seccionesFiltradas[this.indiceActual];
  }
}
