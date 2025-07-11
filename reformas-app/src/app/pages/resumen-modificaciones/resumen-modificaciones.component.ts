import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
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

  metricasTornillos: number[] = [
    4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 20, 22, 24, 27, 30, 33, 36,
    39, 42, 45, 48, 52, 56, 60, 64, 68,
  ];

  modificacionesSeleccionadas: any[] = [];

  ngOnInit(): void {
    this.modificacionesSeleccionadas = this.datosEntrada.modificaciones.filter(
      (mod: any) => mod.seleccionado
    );
    console.log(this.datosEntrada);
  }

  anadirMueble(mod: any, tipo: 'bajo' | 'alto' | 'aseo') {
    if (tipo === 'bajo') {
      mod.mueblesBajo = mod.mueblesBajo || [];
      mod.mueblesBajo.push({ medidas: '', cajones: 0 });
    }
    if (tipo === 'alto') {
      mod.mueblesAlto = mod.mueblesAlto || [];
      mod.mueblesAlto.push({ medidas: '' });
    }
    if (tipo === 'aseo') {
      mod.mueblesAseo = mod.mueblesAseo || [];
      mod.mueblesAseo.push({ medidas: '', descripcion: '' });
    }
    this.formSubmitted = false;
  }

  borrarUltimoMueble(mod: any, tipo: 'bajo' | 'alto' | 'aseo') {
    if (tipo === 'bajo' && mod.mueblesBajo?.length > 0) {
      mod.mueblesBajo.pop();
    }
    if (tipo === 'alto' && mod.mueblesAlto?.length > 0) {
      mod.mueblesAlto.pop();
    }
    if (tipo === 'aseo' && mod.mueblesAseo?.length > 0) {
      mod.mueblesAseo.pop();
    }
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
