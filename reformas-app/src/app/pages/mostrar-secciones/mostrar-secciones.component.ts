import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import codigosReforma from '../../../assets/codigos_reforma_vehiculo.json';


@Component({
  selector: 'app-mostrar-secciones',
  imports: [],
  standalone: true,
  templateUrl: './mostrar-secciones.component.html',
  styleUrl: './mostrar-secciones.component.css',
})
export class MostrarSeccionesComponent implements OnInit {
  @Input() secciones: { codigo: string; descripcion: string }[] = [];
  @Input() respuestas: {
    [codigo: string]: { codigo: string; descripcion: string }[];
  } = {};

  @Output() volverASeleccion = new EventEmitter<void>();
  @Output() finalizarRecoleccion = new EventEmitter<any>();
  indiceActual = 0;
  seccionesFiltradas: any[] = [];

  ngOnInit(): void {
    this.seccionesFiltradas = this.secciones.map((s) => {
      const codigos = codigosReforma.filter((op) =>
        op.codigo.startsWith(s.codigo + '.')
      );
      return { ...s, opciones: codigos };
    });
  }

  isOpcionSeleccionada(seccionCodigo: string, opcionCodigo: string): boolean {
    return (
      this.respuestas[seccionCodigo]?.some(
        (item) => item.codigo === opcionCodigo
      ) ?? false
    );
  }

  onToggleOpcion(
    seccionCodigo: string,
    opcion: { codigo: string; descripcion: string }
  ): void {
    if (!this.respuestas[seccionCodigo]) {
      this.respuestas[seccionCodigo] = [];
    }

    const index = this.respuestas[seccionCodigo].findIndex(
      (item: any) => item.codigo === opcion.codigo
    );

    if (index === -1) {
      this.respuestas[seccionCodigo].push({
        codigo: opcion.codigo,
        descripcion: opcion.descripcion,
      });
    } else {
      this.respuestas[seccionCodigo].splice(index, 1);
    }
  }

  siguiente(): void {
    if (this.indiceActual < this.seccionesFiltradas.length - 1) {
      this.indiceActual++;
    } else {
      console.log('Respuestas recopiladas:', this.respuestas);
      this.finalizarRecoleccion.emit(this.respuestas);
    }
  }

  volver(): void {
    if (this.indiceActual > 0) {
      this.indiceActual--;
    } else {
      this.volverASeleccion.emit(); // ← si ya estamos en la primera, volver al paso anterior
    }
  }

  get seccionActual() {
    return this.seccionesFiltradas[this.indiceActual];
  }
}
