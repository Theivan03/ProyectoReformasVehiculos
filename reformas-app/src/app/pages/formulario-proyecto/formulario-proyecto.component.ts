import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-formulario-proyecto',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './formulario-proyecto.component.html',
  styleUrl: './formulario-proyecto.component.css',
})
export class FormularioProyectoComponent implements OnChanges {
  constructor(private http: HttpClient) {}

  paginaActual = 1;
  totalPaginas = 4;

  talleres: any[] = [];

  datos: any = {
    numeroProyecto: '',
    tallerSeleccionado: null,
    referenciaProyecto: '',
    reformasPrevias: false,
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
  @Output() finalizarFormulario = new EventEmitter<any>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['datosIniciales'] && this.datosIniciales) {
      this.datos = { ...this.datosIniciales };
      if (this.datos.paginaActual) {
        this.paginaActual = this.datos.paginaActual;
      }

      if (this.datos.taller && this.talleres?.length) {
        const id = this.datos.taller.nombre;
        const tallerReal = this.talleres.find((t) => t.nombre === id);
        this.datos.tallerSeleccionado = tallerReal || null;
      }
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

  ngOnInit(): void {
    this.http.get<any[]>('http://localhost:3000/talleres').subscribe({
      next: (data) => {
        this.talleres = data;

        // Asignar el taller seleccionado si ya hay datos iniciales
        if (this.datos.taller && this.talleres.length) {
          const id = this.datos.taller.nombre;
          const tallerReal = this.talleres.find((t) => t.nombre === id);
          this.datos.tallerSeleccionado = tallerReal || null;
        }
      },
      error: (err) => {
        console.error('Error al cargar talleres del servidor:', err);
      },
    });
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
      // Asignamos el taller antes del emit
      this.datos.taller = this.datos.tallerSeleccionado;

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

    this.finalizarFormulario.emit(finalData);
  }

  generarReferencia(): void {
    const añoCorto = new Date().getFullYear().toString().slice(-2); // "25"
    this.datos.referenciaProyecto = `PTRV ${this.datos.numeroProyecto}_${añoCorto}`;
  }
}
