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
  ingenieros: any[] = [];

  avisoCargaInvalida: string | null = null; // ⚠️ Mensaje si hay límites reglamentarios superados

  @Input() forzarPrimera = false;
  @Input() esEdicion = false;

  /**
   * Señal numérica que incrementa el padre para forzar ir a la última página.
   * Cada incremento dispara un salto a la última página (se calcula con totalPaginas).
   */
  @Input() goToLastSignal = 0;

  get necesitaPasoExtra(): boolean {
    const mma = parseFloat(this.datos.momAntes as any) || 0;
    const masa = parseFloat(this.datos.masaRealDespues as any) || 0;
    return !!mma && !!masa && Math.abs(mma - masa) / mma > 0.03;
  }

  get totalPaginas(): number {
    return this.necesitaPasoExtra ? 6 : 5;
  }

  datos: any = {
    numeroProyecto: '',
    tallerSeleccionado: null,
    ingenieroSeleccionado: null,
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
    cdgocu2: 0,
    cdgocu3: 0,
    cdgcargautil: 0,
    cdgcargavert: 0,
  };

  año: string = '';
  compararTalleres = (a: any, b: any) =>
    a && b ? a.nombre === b.nombre : a === b;
  compararIngenieros = (a: any, b: any) =>
    a && b ? a.nombre === b.nombre : a === b;

  @Input() respuestas: any;
  @Output() volverAReforma = new EventEmitter<any>();
  @Input() datosIniciales: any;
  @Output() finalizarFormulario = new EventEmitter<any>();
  @Output() autosave = new EventEmitter<{ datos: any; paginaActual: number }>();

  constructor(private http: HttpClient) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['datosIniciales'] && this.datosIniciales) {
      const esMismoProyecto =
        this.datos.numeroProyecto === this.datosIniciales.numeroProyecto;
      const esPrimeraCarga = changes['datosIniciales'].firstChange;

      if (!esMismoProyecto || esPrimeraCarga) {
        const anteriorNumero = this.datos?.numeroProyecto;

        this.datos = { ...this.datos, ...this.datosIniciales };

        if (this.datos.taller && !this.datos.tallerSeleccionado) {
          this.datos.tallerSeleccionado = this.datos.taller;
        }
        if (this.datos.ingeniero && !this.datos.ingenieroSeleccionado) {
          this.datos.ingenieroSeleccionado = this.datos.ingeniero;
        }

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

        if (this.datos.numeroProyecto !== anteriorNumero) {
          const anyo = this.esEdicion ? new Date().getFullYear() : this.año;
          this.generarReferencia(anyo);
        }

        this.intentarNormalizarListas();

        const p = Number(this.datosIniciales?.paginaActual);
        if (Number.isFinite(p) && p > 0) {
          this.paginaActual = this.clampToTotal(p);
        }
      } else {
        if (this.datosIniciales.tipoVehiculo !== undefined) {
          this.datos.tipoVehiculo = this.datosIniciales.tipoVehiculo;
        }
        if (this.datosIniciales.modificaciones !== undefined) {
          this.datos.modificaciones = this.datosIniciales.modificaciones;
        }
        if (this.datosIniciales.reformasPrevias !== undefined) {
          this.datos.reformasPrevias = this.datosIniciales.reformasPrevias;
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

    if (changes['goToLastSignal'] && !changes['goToLastSignal'].firstChange) {
      setTimeout(() => {
        this.paginaActual = this.totalPaginas || 1;
        this.emitAutosave();
      }, 0);
    }
  }

  ngOnInit(): void {
    // Carga catálogo talleres
    this.http.get<any[]>('http://192.168.1.41:3000/talleres').subscribe({
      next: (data) => {
        this.talleres = data;
        this.intentarNormalizarListas(); // <--- Normalizar cuando llegan los datos
      },
      error: (err) => console.error('Error al cargar talleres:', err),
    });

    // Carga catálogo ingenieros
    this.http.get<any[]>('http://192.168.1.41:3000/ingenieros').subscribe({
      next: (data) => {
        this.ingenieros = Array.isArray(data) ? data : [data];
        this.intentarNormalizarListas(); // <--- Normalizar cuando llegan los datos
      },
      error: (err) => console.error('Error al cargar ingenieros:', err),
    });

    // Carga número de proyecto / referencias si no es edición
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
        });
    }

    // Decidir página inicial
    if (this.forzarPrimera) {
      this.paginaActual = 1;
    } else {
      const p = Number(this.datosIniciales?.paginaActual);
      if (Number.isFinite(p) && p > 0) {
        this.paginaActual = this.clampToTotal(p);
      }
    }
  }

  private intentarNormalizarListas() {
    // Normalizar Taller
    if (this.talleres?.length && this.datos.tallerSeleccionado) {
      const encontrado = this.talleres.find(
        (t) => t.nombre === this.datos.tallerSeleccionado.nombre
      );
      if (encontrado) {
        this.datos.tallerSeleccionado = encontrado;
        // Importante: Actualizamos también la propiedad 'taller' para que estén sync
        this.datos.taller = encontrado;
      }
    }

    // Normalizar Ingeniero
    if (this.ingenieros?.length && this.datos.ingenieroSeleccionado) {
      const encontrado = this.ingenieros.find(
        (i) => i.nombre === this.datos.ingenieroSeleccionado.nombre
      );
      if (encontrado) {
        this.datos.ingenieroSeleccionado = encontrado;
        this.datos.ingenieroSeleccionado = encontrado;
      }
    }
  }

  onCambioTaller(nuevoTaller: any) {
    // Esto actualiza la vista inmediatamente
    this.datos.tallerSeleccionado = nuevoTaller;
    // Esto asegura que el dato que se guarda es el correcto
    this.datos.taller = nuevoTaller;
    // Guardamos
    this.emitAutosave();
  }

  onNumeroProyectoChange(valor: any): void {
    this.datos.numeroProyecto = valor;
    this.generarReferencia(this.año || new Date().getFullYear());
  }

  actualizarTotal(): void {
    const mu = Number(this.datos.materialesUsados) || 0;
    const mo = Number(this.datos.manoDeObra) || 0;
    this.datos.totalPresupuesto = mu + mo;
  }

  private emitAutosave() {
    // Sincronización JUSTO ANTES de guardar
    if (this.datos.tallerSeleccionado) {
      this.datos.taller = this.datos.tallerSeleccionado;
    }
    if (this.datos.ingenieroSeleccionado) {
      this.datos.ingeniero = this.datos.ingenieroSeleccionado;
    }

    this.autosave.emit({
      datos: { ...this.datos, paginaActual: this.paginaActual },
      paginaActual: this.paginaActual,
    });
  }

  // Verificación de condiciones de carga (reglamentarias)
  comprobarCondicionesCarga() {
    const n = (v: any) => Number(v) || 0;

    const mma = n(this.datos.mmaDespues);
    const mmaEje2 = n(this.datos.mmaEje2Despues);
    const masaReal = n(this.datos.masaRealDespues);

    const reparto = {
      masaReal: { del: 0.536, tras: 0.464 },
      ocupDel: { del: 0.78, tras: 0.22 },
      ocup2: { del: 0.96, tras: 0.04 },
      ocup3: { del: 0.0, tras: 0.0 },
      cargaUtil: { del: 0.105, tras: 0.895 },
    };

    const masaRealDel = Math.round(
      this.datos.masaRealTotal * reparto.masaReal.del
    );
    const masaRealTras = this.datos.masaRealTotal - masaRealDel;

    const ocupDelDel = Math.round(
      this.datos.ocupDelTotal * reparto.ocupDel.del
    );
    const ocupDelTras = this.datos.ocupDelTotal - ocupDelDel;

    const ocup2Del = Math.round(this.datos.ocup2Total * reparto.ocup2.del);
    const ocup2Tras = this.datos.ocup2Total - ocup2Del;

    const ocup3Del = Math.round(this.datos.ocup3Total * reparto.ocup3.del);
    const ocup3Tras = this.datos.ocup3Total - ocup3Del;

    const cargaUtilDel = Math.round(
      this.datos.cargaUtilTotal * reparto.cargaUtil.del
    );
    const cargaUtilTras = this.datos.cargaUtilTotal - cargaUtilDel;

    const sumaTras =
      masaRealTras + cargaUtilTras + ocup2Tras + ocup3Tras + ocupDelTras;

    // Cálculo de masa total con ocupantes (75 kg por persona + conductor)
    const ocupantes =
      n(this.datos.asientosDelanteros) +
      n(this.datos.asientos2Fila) +
      n(this.datos.asientos3Fila) +
      1; // conductor

    const masaTotal = masaReal + ocupantes * 75;

    // Comprobaciones reglamentarias
    const superaEje2 = sumaTras > mmaEje2 * 1.15;
    const superaTotal10 = masaTotal > mma * 1.1;
    const superaTotal100 = masaTotal > mma + 100;

    const problemas: string[] = [];
    if (superaEje2)
      problemas.push(
        `La carga sobre el eje trasero (${sumaTras.toFixed(
          0
        )} kg) supera en más del 15 % la MMA del eje (${mmaEje2.toFixed(
          0
        )} kg).`
      );
    if (superaTotal10)
      problemas.push(
        `La masa total (${masaTotal.toFixed(
          0
        )} kg) supera el 110 % de la MMA del vehículo (${mma.toFixed(0)} kg).`
      );
    if (superaTotal100)
      problemas.push(
        `La masa total excede la MMA en más de 100 kg (diferencia de ${(
          masaTotal - mma
        ).toFixed(0)} kg).`
      );

    if (problemas.length > 0) {
      this.avisoCargaInvalida =
        '⚠️ Proyecto no válido: se superan los límites reglamentarios.\n\n' +
        problemas.join('\n');
      console.warn('Proyecto inválido:', {
        masaTotal,
        mma,
        mmaEje2,
        sumaTras,
        problemas,
      });
    } else {
      this.avisoCargaInvalida = null;
    }
  }

  siguiente(): void {
    const n = (v: any) => Number(v) || 0;
    const ocupantes =
      n(this.datos.asientosDelanteros) +
      n(this.datos.asientos2Fila) +
      n(this.datos.asientos3Fila) +
      1;
    const mma = n(this.datos.mmaDespues);
    const masaReal = n(this.datos.masaRealDespues);
    this.datos.cargaUtilTotal = mma - (ocupantes * 75 + masaReal);

    // Validaciones reglamentarias informativas
    this.comprobarCondicionesCarga();

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
    this.comprobarCondicionesCarga();
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
    console.log('Formulario finalizado:', finalData);
    this.finalizarFormulario.emit(finalData);
  }

  generarReferencia(anyo?: any): void {
    const anio = anyo || new Date().getFullYear();
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

  // --- Utilidades internas ---

  /** Ajusta p a [1, totalPaginas], interpretando valores grandes (p.ej., 999) como "última". */
  private clampToTotal(p: number): number {
    const max = this.totalPaginas || 1;
    if (!Number.isFinite(p) || p <= 0) return 1;
    if (p >= 999 || p >= max) return max;
    return Math.min(max, Math.max(1, p));
  }
}
