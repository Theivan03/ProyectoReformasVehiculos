import { FormsModule, NgForm } from '@angular/forms';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  OnChanges,
  SimpleChanges,
  OnInit,
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
export class FormularioProyectoComponent implements OnChanges, OnInit {
  paginaActual = 1;
  talleres: any[] = [];

  // 👇 Bandera que indica si debemos empezar siempre por la primera pantalla
  @Input() forzarPrimera = false;
  @Input() esEdicion = false;

  get necesitaPasoExtra(): boolean {
    const mma = parseFloat(this.datos.momAntes as any) || 0;
    const masa = parseFloat(this.datos.masaRealDespues as any) || 0;
    return !!mma && !!masa && Math.abs(mma - masa) / mma > 0.03;
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
    plazasAntes: '---',
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
    velocidadMaxima: '---',
    materialesUsados: 0,
    manoDeObra: 0,
    totalPresupuesto: 0,
    fechaProyecto: null,
    tipoVehiculo: null,
    taraTotal: 0,
    taraDelante: 0,
    taraDetras: 0,
    asientosDelanteros: 0,
    asientos2Fila: 0,
    asientos3Fila: 0,
    cargaUtilTotal: 0,
    distanciaEntreEjes: 0,
    ocupantesAdicionales: 0,
    modificaciones: [],
    cdgconductor: 0,
    cdgocdelant: 0,
    cdgocu2: 0,
    cdgocu3: 0,
    cdgcargautil: 0,
    cdgcargavert: 0,
  };

  año: string = '';

  compararTalleres = (a: any, b: any) =>
    a && b ? a.nombre === b.nombre : a === b;

  @Input() respuestas: any;
  @Output() volverAReforma = new EventEmitter<any>();
  @Input() datosIniciales: any;
  @Output() finalizarFormulario = new EventEmitter<any>();
  @Output() autosave = new EventEmitter<{ datos: any; paginaActual: number }>();

  constructor(private http: HttpClient) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['datosIniciales'] && this.datosIniciales) {
      const anteriorNumero = this.datos?.numeroProyecto;
      this.datos = { ...this.datos, ...this.datosIniciales };

      // normalizar fechas para inputs
      if (this.datos.fechaProyecto) {
        this.datos.fechaProyecto = this.datos.fechaProyecto
          .toString()
          .slice(0, 10);
      }
      if (this.datos.fechaMatriculacion) {
        this.datos.fechaMatriculacion = this.datos.fechaMatriculacion
          .toString()
          .slice(0, 10);
      }

      // si cambia el número de proyecto → regenerar referencia
      if (this.datos.numeroProyecto !== anteriorNumero) {
        const anyo = this.esEdicion
          ? new Date().getFullYear() // año actual (ej: 2025)
          : this.año;
        this.generarReferencia(anyo);
      }

      // 👉 Lógica de navegación
      if (this.forzarPrimera) {
        // siempre empezar por la primera si venimos del componente anterior
        this.paginaActual = 1;
      } else if (this.datos.paginaActual) {
        // si volvemos desde el siguiente, usamos la última visitada
        this.paginaActual = this.datos.paginaActual;
      } else {
        this.paginaActual = 1;
      }

      this.paginaActual = Math.min(this.paginaActual, this.totalPaginas);

      // enlazar el taller con la lista cargada
      if (this.talleres?.length) {
        if (this.datos.tallerSeleccionado) {
          const tallerReal = this.talleres.find(
            (t) => t.nombre === this.datos.tallerSeleccionado?.nombre
          );
          this.datos.tallerSeleccionado =
            tallerReal || this.datos.tallerSeleccionado;
        } else if (this.datos.taller) {
          const tallerReal = this.talleres.find(
            (t) => t.nombre === this.datos.taller?.nombre
          );
          this.datos.tallerSeleccionado = tallerReal || null;
        }
      }
    }

    if (this.respuestas) {
      const codigos = (Object.values(this.respuestas) as { codigo: string }[][])
        .flat()
        .map((op) => op.codigo)
        .join(' - ');
      this.datos.codigosReforma = codigos;
    }
  }

  ngOnInit(): void {
    // 1) cargar talleres
    this.http.get<any[]>('http://192.168.1.41:3000/talleres').subscribe({
      next: (data) => {
        this.talleres = data;
        const sel = this.datos.tallerSeleccionado || this.datos.taller;
        if (sel && this.talleres.length) {
          const id = this.datos.taller?.nombre || sel?.nombre;
          const tallerReal = this.talleres.find((t) => t.nombre === id);
          this.datos.tallerSeleccionado = tallerReal || null;
        }
      },
      error: (err) => {
        console.error('Error al cargar talleres del servidor:', err);
      },
    });

    // 2) solo generar nuevo número de proyecto si NO es edición
    if (!this.esEdicion) {
      this.http
        .get<{ siguiente: number; año: string }>(
          'http://192.168.1.41:3000/ultimo-proyecto'
        )
        .subscribe({
          next: (data) => {
            this.año = data.año;
            if (!this.datos.numeroProyecto) {
              this.datos.numeroProyecto = data.siguiente;
              this.generarReferencia(data.año);
            }
          },
          error: (err) =>
            console.error('Error al cargar último proyecto:', err),
        });
    }
  }

  onNumeroProyectoChange(valor: any): void {
    this.datos.numeroProyecto = valor;
    // usa el año del servidor si ya lo tienes, si no el actual
    this.generarReferencia(this.año || new Date().getFullYear());
  }

  actualizarTotal(): void {
    const mu = Number(this.datos.materialesUsados) || 0;
    const mo = Number(this.datos.manoDeObra) || 0;
    this.datos.totalPresupuesto = mu + mo;
  }

  private emitAutosave() {
    this.autosave.emit({
      datos: { ...this.datos, paginaActual: this.paginaActual },
      paginaActual: this.paginaActual,
    });
  }

  siguiente(): void {
    if (!this.validarPaginaActual()) return;

    if (this.paginaActual === 4 && this.necesitaPasoExtra) {
      this.paginaActual = 5;
    } else if (this.paginaActual === 4 || this.paginaActual === 5) {
      this.paginaActual = this.totalPaginas;
    } else if (this.paginaActual === 6) {
      this.enviarFormulario();
      return;
    } else {
      this.paginaActual++;
    }

    this.emitAutosave();
  }

  @ViewChild('formulario') formulario!: NgForm;

  validarPaginaActual(): boolean {
    if (!this.formulario) return false;
    Object.values(this.formulario.controls).forEach((control) =>
      control.markAsTouched()
    );
    return !!this.formulario.valid;
  }

  anterior(): void {
    if (this.paginaActual === this.totalPaginas && this.necesitaPasoExtra) {
      this.paginaActual = 5;
      this.emitAutosave();
      return;
    }

    if (this.paginaActual === 1) {
      this.datos.taller = this.datos.tallerSeleccionado;
      this.volverAReforma.emit({
        datosFormulario: this.datos,
        pagina: this.paginaActual,
      });
      return;
    }

    this.paginaActual--;
    this.emitAutosave();
  }

  enviarFormulario(): void {
    this.datos.taller = this.datos.tallerSeleccionado;
    const finalData = {
      ...this.datos,
      codigosDetallados: this.respuestas,
    };
    this.finalizarFormulario.emit(finalData);
  }

  generarReferencia(anyo?: any): void {
    const anio = anyo || new Date().getFullYear(); // si no pasas año → actual
    const añoCorto = anio.toString().slice(-2);

    this.datos.referenciaProyecto = `PTRV ${this.datos.numeroProyecto}/${añoCorto}`;
    this.datos.referenciaCFO = `CFO ${this.datos.numeroProyecto}/${añoCorto}`;
  }

  limitarDecimales(campo: keyof typeof this.datos, valor: any) {
    if (valor !== null && valor !== undefined && valor !== '') {
      this.datos[campo] = parseFloat(parseFloat(valor).toFixed(2));
    }
    this.actualizarTotal();
  }
}
