import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import talleres from '../../../assets/talleres.json';
import { Router } from '@angular/router';

@Component({
  selector: 'app-formulario-proyecto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './formulario-proyecto.component.html',
  styleUrl: './formulario-proyecto.component.css',
})
export class FormularioProyectoComponent {
  constructor(private router: Router) {}

  paginaActual = 1;
  totalPaginas = 4;

  talleres = talleres;

  datos: any = {
    numeroProyecto: '',
    tallerSeleccionado: null,
    referenciaProyecto: '',
    revision: '00',
    marca: '---',
    modelo: '---',
    denominacion: '---',
    tipo: '---',
    variante: '---',
    version: '---',
    matricula: '---',
    bastidor: '---',
    fechaMatriculacion: null,
    homologacion: '---',
    codigosReforma: '---',
    propietario: '---',
    categoria: '---',
    clasificacion: '---',
    longitudAntes: '---',
    anchuraAntes: '---',
    alturaAntes: '---',
    voladizoAntes: '---',
    viaDelanteraAntes: '---',
    viaTraseraAntes: '---',
    neumaticoAntes: '---',
    momAntes: '---',
    mmaAntes: '---',
    mmaEje1Antes: '---',
    mmaEje2Antes: '---',
    mmaConjuntoAntes: '---',
    mmrbarradetraccion: '---',
    mmrejecentral: '---',
    mmrsinfrenos: '---',
    cargavertical: '---',
    clasificacionAntes: '---',
    plazasDespues: '---',
    longitudDespues: '---',
    anchuraDespues: '---',
    alturaDespues: '---',
    voladizoDespues: '---',
    viaDelanteraDespues: '---',
    viaTraseraDespues: '---',
    neumaticoDespues: '---',
    masaRealDespues: '---',
    mmaDespues: '---',
    mmaEje1Despues: '---',
    mmaEje2Despues: '---',
    mmaConjuntoDespues: '---',
    clasificacionDespues: '---',
    mmrbarradetraccionDespues: '---',
    mmrejecentralDespues: '---',
    mmrsinfrenosDespues: '---',
    cargaverticalDespues: '---',
    plazasFinal: '---',
    fechaProyecto: null,
  };

  @Input() respuestas: any;
  @Output() volverAReforma = new EventEmitter<any>();
  @Input() datosIniciales: any;

  ngOnInit(): void {
    const state = history.state;
    if (state?.datosFormulario) {
      this.datos = { ...state.datosFormulario };
      this.paginaActual = state.pagina || 1;
      this.datos.tallerSeleccionado = this.datos.taller;
    }

    if (this.datosIniciales) {
      this.datos = { ...this.datosIniciales };
    }

    if (this.respuestas) {
      // Mostrar solo códigos en el input del formulario
      const codigos = (Object.values(this.respuestas) as { codigo: string }[][])
        .flat()
        .map((op) => op.codigo)
        .join(' - ');
      this.datos.codigosReforma = codigos;
    }

    if (!this.datos.fechaProyecto) {
      const hoy = new Date().toISOString().split('T')[0];
      this.datos.fechaProyecto = hoy;
    }
  }

  siguiente(): void {
    if (!this.validarPaginaActual()) {
      return; // No avanzar si hay errores
    }

    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
    }
  }

  @ViewChild('formulario') formulario!: NgForm;

  validarPaginaActual(): boolean {
    if (!this.formulario) return false;

    Object.values(this.formulario.controls).forEach((control) => {
      control.markAsTouched();
    });

    return !!this.formulario.valid;
  }

  anterior() {
    if (this.paginaActual === 1) {
      this.volverAReforma.emit({
        datosFormulario: this.datos,
        pagina: this.paginaActual,
      });
    } else {
      this.paginaActual--;
    }
  }

  enviarFormulario(): void {
    this.datos.taller = this.datos.tallerSeleccionado;
    const finalData = {
      ...this.datos,
      codigosDetallados: this.respuestas,
    };

    this.router.navigate(['/documentos'], {
      state: { reformaData: finalData },
    });
  }

  generarReferencia(): void {
    const añoCorto = new Date().getFullYear().toString().slice(-2); // "25"
    this.datos.referenciaProyecto = `PTRV ${this.datos.numeroProyecto}_${añoCorto}`;
  }
}
