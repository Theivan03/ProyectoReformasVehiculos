import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import opciones from '../../../assets/opciones_reforma_vehiculos.json';

@Component({
  selector: 'app-seleccion-secciones',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './seleccion-secciones.component.html',
  styleUrl: './seleccion-secciones.component.css',
})
export class SeleccionSeccionesComponent implements OnInit {
  @Input() seccionesPreseleccionadas: string[] = [];
  @Output() continuar = new EventEmitter<
    { codigo: string; descripcion: string }[]
  >();

  opcionesReforma: { codigo: string; descripcion: string }[] = opciones;
  seccionesSeleccionadas: { codigo: string; descripcion: string }[] = [];

  ngOnInit(): void {
    // Restaurar las selecciones anteriores si hay
    this.seccionesSeleccionadas = this.opcionesReforma.filter((op) =>
      this.seccionesPreseleccionadas.includes(op.codigo)
    );
  }

  toggleSeleccion(opcion: { codigo: string; descripcion: string }) {
    const existe = this.seccionesSeleccionadas.find(
      (s) => s.codigo === opcion.codigo
    );
    if (existe) {
      this.seccionesSeleccionadas = this.seccionesSeleccionadas.filter(
        (s) => s.codigo !== opcion.codigo
      );
    } else {
      this.seccionesSeleccionadas.push(opcion);
    }
  }

  enviarSeleccion() {
    const ordenadas = this.seccionesSeleccionadas.sort(
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
