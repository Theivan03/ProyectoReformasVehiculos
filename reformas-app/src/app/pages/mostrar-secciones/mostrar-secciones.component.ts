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
  @Input() set secciones(
    v: { codigo: string; descripcion: string }[] | null | undefined
  ) {
    this._secciones = Array.isArray(v) ? v : [];
    this.rebuild();
  }
  get secciones() {
    return this._secciones;
  }

  private _respuestas: {
    [codigo: string]: { codigo: string; descripcion: string }[];
  } = {};
  @Input() set respuestas(
    v:
      | { [codigo: string]: { codigo: string; descripcion: string }[] }
      | null
      | undefined
  ) {
    this._respuestas = v ?? {};
    this.rebuildIndice();
  }
  get respuestas() {
    return this._respuestas;
  }

  @Output() volverASeleccion = new EventEmitter<void>();
  @Output() finalizarRecoleccion = new EventEmitter<any>();

  indiceActual = 0;
  seccionesFiltradas: Array<{
    codigo: string;
    descripcion: string;
    opciones: any[];
  }> = [];

  ngOnInit(): void {
    this.rebuild();
  }

  private rebuild() {
    const all = (codigosReforma as any[]) || [];
    this.seccionesFiltradas = this._secciones.map((s) => {
      const opciones = all.filter((op) =>
        String(op?.codigo ?? '').startsWith(s.codigo + '.')
      );
      return { ...s, opciones };
    });
    this.rebuildIndice();
  }

  private rebuildIndice() {
    for (let i = this.seccionesFiltradas.length - 1; i >= 0; i--) {
      const codigo = this.seccionesFiltradas[i].codigo;
      if (this._respuestas[codigo]?.length) {
        this.indiceActual = i;
        return;
      }
    }
    this.indiceActual = 0;
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
    if (idx === -1)
      this._respuestas[seccionCodigo].push({
        codigo: opcion.codigo,
        descripcion: opcion.descripcion,
      });
    else this._respuestas[seccionCodigo].splice(idx, 1);
  }

  siguiente(): void {
    if (this.indiceActual < this.seccionesFiltradas.length - 1)
      this.indiceActual++;
    else this.finalizarRecoleccion.emit(this._respuestas);
  }

  volver(): void {
    if (this.indiceActual > 0) this.indiceActual--;
    else this.volverASeleccion.emit();
  }

  get seccionActual() {
    return this.seccionesFiltradas[this.indiceActual];
  }
}
