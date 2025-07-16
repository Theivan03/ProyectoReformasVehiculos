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
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-formulario-proyecto',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './formulario-proyecto.component.html',
  styleUrl: './formulario-proyecto.component.css',
})
export class FormularioProyectoComponent implements OnChanges {
  paginaActual = 1;

  talleres: any[] = [];

  get necesitaPasoExtra(): boolean {
    const mma = parseFloat(this.datos.momAntes as any) || 0;
    const masa = parseFloat(this.datos.masaRealDespues as any) || 0;
    const extra = !!mma && !!masa && Math.abs(mma - masa) / mma > 0.03;
    return extra;
  }

  /** Total de páginas dinámico: 5 o 6 */
  get totalPaginas(): number {
    return this.necesitaPasoExtra ? 6 : 5;
  }

  datos: any = {
    numeroProyecto: '',
    tallerSeleccionado: null,
    referenciaProyecto: '',
    referenciaCFO: '',
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
    momAntes: '1000',
    mmaAntes: '1',
    mmaEje1Antes: '2',
    mmaEje2Antes: '3',
    mmaConjuntoAntes: '4',
    mmrbarradetraccion: '5',
    mmrejecentral: '6',
    mmrsinfrenos: '7',
    cargavertical: '8',
    clasificacionAntes: '---',
    plazasDespues: '---',
    plazasAntes: '---',
    longitudDespues: '---',
    anchuraDespues: '---',
    alturaDespues: '---',
    voladizoDespues: '---',
    viaDelanteraDespues: '---',
    viaTraseraDespues: '---',
    neumaticoDespues: '---',
    masaRealDespues: '2000',
    mmaDespues: '123',
    mmaEje1Despues: '123',
    mmaEje2Despues: '123',
    mmaConjuntoDespues: '123',
    clasificacionDespues: '---',
    mmrbarradetraccionDespues: '321',
    mmrejecentralDespues: '321',
    mmrsinfrenosDespues: '321',
    cargaverticalDespues: '321',
    velocidadMaxima: '---',
    materialesUsados: 0,
    manoDeObra: 0,
    totalPresupuesto: 0,
    fechaProyecto: null,
    tipoVehiculo: null,
    taraTotal: 1,
    taraDelante: 2,
    taraDetras: 3,
    asientosDelanteros: 4,
    asientos2Fila: 5,
    asientos3Fila: 6,
    cargaUtilTotal: 7,
    distanciaEntreEjes: 10,
    ocupantesAdicionales: 11,
    modificaciones: [],
  };

  año: string = '';

  @Input() respuestas: any;
  @Output() volverAReforma = new EventEmitter<any>();
  @Input() datosIniciales: any;
  @Output() finalizarFormulario = new EventEmitter<any>();

  constructor(private http: HttpClient) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['datosIniciales'] && this.datosIniciales) {
      const anteriorNumero = this.datos?.numeroProyecto;

      this.datos = { ...this.datosIniciales };

      if (this.datos.numeroProyecto !== anteriorNumero) {
        this.generarReferencia(this.año);
      }

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
  }

  ngOnInit(): void {
    this.http.get<any[]>('http://192.168.1.41:3000/talleres').subscribe({
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

    this.http
      .get<{ siguiente: number; año: string }>(
        'http://192.168.1.41:3000/ultimo-proyecto'
      )
      .subscribe({
        next: (data) => {
          console.log(data);
          this.año = data.año;
          this.datos.numeroProyecto = data.siguiente;
          this.generarReferencia(data.año);
        },
        error: (err) => console.error('Error al cargar último proyecto:', err),
      });
  }

  onNumeroProyectoChange(valor: any): void {
    this.datos.numeroProyecto = valor;
    this.generarReferencia(this.año);
  }

  actualizarTotal(): void {
    const mu = Number(this.datos.materialesUsados) || 0;
    const mo = Number(this.datos.manoDeObra) || 0;
    this.datos.totalPresupuesto = mu + mo;
  }

  siguiente(): void {
    if (!this.validarPaginaActual()) {
      return;
    }
    // Si estamos en 4 y necesitamos la extra, vamos a 5; si no, saltamos a 6
    if (this.paginaActual === 4 && this.necesitaPasoExtra) {
      this.paginaActual = 5;
    } else if (this.paginaActual === 4 || this.paginaActual === 5) {
      // 4 sin extra o 5 (extra) siempre llevan al presupuesto (nuevo 6 o antiguo 5)
      this.paginaActual = this.totalPaginas;
    } else if (this.paginaActual === 6) {
      this.enviarFormulario();
    } else {
      this.paginaActual++;
    }

    console.log(this.paginaActual);
  }

  @ViewChild('formulario') formulario!: NgForm;

  validarPaginaActual(): boolean {
    if (!this.formulario) return false;

    Object.values(this.formulario.controls).forEach((control) => {
      control.markAsTouched();
    });

    return !!this.formulario.valid;
  }

  anterior(): void {
    if (this.paginaActual === this.totalPaginas && this.necesitaPasoExtra) {
      // desde 6 volvemos al extra (5)
      this.paginaActual = 5;
    } else if (this.paginaActual === 1) {
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

  generarReferencia(año: any): void {
    console.log('🧠 generando referencia con año:', año);
    const añoCorto = año.toString().slice(-2);
    this.datos.referenciaProyecto = `PTRV ${this.datos.numeroProyecto}/${añoCorto}`;
    this.datos.referenciaCFO = `CFO ${this.datos.numeroProyecto}/${añoCorto}`;
  }
}
