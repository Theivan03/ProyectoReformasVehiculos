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
    return 6;
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
    longitudAntes: 0,
    anchuraAntes: 0,
    alturaAntes: 0,
    voladizoAntes: 0,
    viaDelanteraAntes: 0,
    viaTraseraAntes: 0,
    neumaticoAntes: '---',
    momAntes: 0,
    mmaAntes: 0,
    mmaEje1Antes: 0,
    mmaEje2Antes: 0,
    mmaConjuntoAntes: 0,
    mmrbarradetraccion: 0,
    mmrejecentral: 0,
    mmrsinfrenos: 0,
    cargavertical: 0,
    clasificacionAntes: '---',
    plazasDespues: 0,
    plazasAntes: 0,
    longitudDespues: 0,
    anchuraDespues: 0,
    alturaDespues: 0,
    voladizoDespues: 0,
    viaDelanteraDespues: 0,
    viaTraseraDespues: 0,
    neumaticoDespues: '---',
    masaRealDespues: 0,
    mmaDespues: 0,
    mmaEje1Despues: 0,
    mmaEje2Despues: 0,
    mmaConjuntoDespues: 0,
    clasificacionDespues: '---',
    mmrbarradetraccionDespues: 0,
    mmrejecentralDespues: 0,
    mmrsinfrenosDespues: 0,
    cargaverticalDespues: 0,
    velocidadMaxima: 0,
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
    mmaControlMasas: null,
    mmaEje1ControlMasas: null,
    mmaEje2ControlMasas: null,
    cargaVerticalAcoplControlMasas: null,
    asientosDelanterosControlMasas: null,
    asientos2FilaControlMasas: null,
    asientos3FilaControlMasas: null,
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

        this.intentarNormalizarListas();
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
    this.http.get<any[]>('/talleres').subscribe({
      next: (data) => {
        this.talleres = data;
        this.intentarNormalizarListas();
      },
      error: (err) => console.error('Error al cargar talleres:', err),
    });

    this.http.get<any[]>('/ingenieros').subscribe({
      next: (data) => {
        this.ingenieros = Array.isArray(data) ? data : [data];
        this.intentarNormalizarListas();
      },
      error: (err) => console.error('Error al cargar ingenieros:', err),
    });

    if (!this.esEdicion) {
      this.http
        .get<{
          siguiente: number;
          año: string;
        }>('/ultimo-proyecto')
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
    if (this.talleres?.length && this.datos.tallerSeleccionado) {
      const encontrado = this.talleres.find(
        (t) => t.nombre === this.datos.tallerSeleccionado.nombre,
      );

      if (encontrado) {
        this.datos.tallerSeleccionado = encontrado;
        this.datos.taller = encontrado;
      }
    }

    // Normalizar Ingeniero
    if (this.ingenieros?.length && this.datos.ingenieroSeleccionado) {
      const encontrado = this.ingenieros.find(
        (i) => i.nombre === this.datos.ingenieroSeleccionado.nombre,
      );
      if (encontrado) {
        this.datos.ingenieroSeleccionado = encontrado;
        this.datos.ingenieroSeleccionado = encontrado;
      }
    }
  }

  private tieneValor(value: unknown): boolean {
    return value !== null && value !== undefined && value !== '';
  }

  private syncControlMasasDefaults(): void {
    const mappings: Array<{ target: string; sources: string[] }> = [
      { target: 'mmaControlMasas', sources: ['mmaDespues'] },
      { target: 'mmaEje1ControlMasas', sources: ['mmaEje1Despues'] },
      { target: 'mmaEje2ControlMasas', sources: ['mmaEje2Despues'] },
      {
        target: 'cargaVerticalAcoplControlMasas',
        sources: ['cargaverticalDespues', 'cargavertical'],
      },
      {
        target: 'asientosDelanterosControlMasas',
        sources: ['asientosDelanteros'],
      },
      { target: 'asientos2FilaControlMasas', sources: ['asientos2Fila'] },
      { target: 'asientos3FilaControlMasas', sources: ['asientos3Fila'] },
    ];

    mappings.forEach(({ target, sources }) => {
      if (this.tieneValor(this.datos[target])) return;

      const sourceValue = sources
        .map((source) => this.datos[source])
        .find((value) => this.tieneValor(value));

      if (sourceValue !== undefined) {
        this.datos[target] = sourceValue;
      }
    });
  }

  private getControlMasasNumber(
    controlKey: string,
    ...fallbackKeys: string[]
  ): number {
    for (const key of [controlKey, ...fallbackKeys]) {
      const value = this.datos[key];
      if (this.tieneValor(value)) {
        return Number(value) || 0;
      }
    }

    return 0;
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
    const PESO_OCUPANTE = 75;

    const mma = this.getControlMasasNumber('mmaControlMasas', 'mmaDespues');
    const mmaEje2 = this.getControlMasasNumber(
      'mmaEje2ControlMasas',
      'mmaEje2Despues',
    );
    const distanciaEntreEjes = n(this.datos.distanciaEntreEjes);

    const taraDelante = n(this.datos.taraDelante);
    const taraDetras = n(this.datos.taraDetras);
    const taraTotal =
      taraDelante + taraDetras > 0
        ? taraDelante + taraDetras
        : n(this.datos.taraTotal);

    const ocupantesAdicionales = n(this.datos.ocupantesAdicionales);
    const ocupDelTotal =
      this.getControlMasasNumber(
        'asientosDelanterosControlMasas',
        'asientosDelanteros',
      ) * PESO_OCUPANTE;
    const ocup2Total =
      this.getControlMasasNumber('asientos2FilaControlMasas', 'asientos2Fila') *
      PESO_OCUPANTE;
    const ocup3Total =
      this.getControlMasasNumber('asientos3FilaControlMasas', 'asientos3Fila') *
      PESO_OCUPANTE;
    const totalKgOcupAdicionales = ocupantesAdicionales * PESO_OCUPANTE;

    const masaRealTotal = taraTotal + PESO_OCUPANTE;
    const cargaUtilTotal = mma - masaRealTotal - totalKgOcupAdicionales;

    const repartirPorEjes = (pesoTotal: number, distanciaCDG: number) => {
      if (!distanciaEntreEjes) return { del: pesoTotal, tras: 0 };
      const tras = (pesoTotal * n(distanciaCDG)) / distanciaEntreEjes;
      return { del: pesoTotal - tras, tras };
    };

    const conductor = repartirPorEjes(PESO_OCUPANTE, n(this.datos.cdgconductor));
    const masaRealTras = taraDetras + conductor.tras;

    const ocupDel = repartirPorEjes(ocupDelTotal, n(this.datos.cdgconductor));
    const ocup2 = repartirPorEjes(ocup2Total, n(this.datos.cdgocu2));
    const ocup3 = repartirPorEjes(ocup3Total, n(this.datos.cdgocu3));
    const cargaUtil = repartirPorEjes(cargaUtilTotal, n(this.datos.cdgcargautil));

    const sumaTras =
      masaRealTras +
      ocupDel.tras +
      ocup2.tras +
      ocup3.tras +
      cargaUtil.tras;

    const cargaVerticalAcopl = this.getControlMasasNumber(
      'cargaVerticalAcoplControlMasas',
      'cargaverticalDespues',
      'cargavertical',
    );
    const cargaUtilSinVerticalTotal = cargaUtilTotal - cargaVerticalAcopl;
    const cargaUtilSinVertical = repartirPorEjes(
      cargaUtilSinVerticalTotal,
      n(this.datos.cdgcargautil),
    );
    const vertical = repartirPorEjes(cargaVerticalAcopl, n(this.datos.cdgcargavert));
    const sumaTrasConVertical =
      masaRealTras +
      ocupDel.tras +
      ocup2.tras +
      ocup3.tras +
      cargaUtilSinVertical.tras +
      vertical.tras;

    const masaTotal = masaRealTotal + ocupDelTotal + ocup2Total + ocup3Total + cargaUtilTotal;

    // Comprobaciones reglamentarias
    const superaEje2 = Math.max(sumaTras, sumaTrasConVertical) > mmaEje2 * 1.15;
    const superaTotal10 = masaTotal > mma * 1.1;
    const superaTotal100 = masaTotal > mma + 100;

    const problemas: string[] = [];
    if (superaEje2)
      problemas.push(
        `La carga sobre el eje trasero (${sumaTras.toFixed(
          2,
        )} kg) supera en más del 15 % la MMA del eje (${mmaEje2.toFixed(
          2,
        )} kg).`,
      );
    if (superaTotal10)
      problemas.push(
        `La masa total (${masaTotal.toFixed(
          2,
        )} kg) supera el 110 % de la MMA del vehículo (${mma.toFixed(2)} kg).`,
      );
    if (superaTotal100)
      problemas.push(
        `La masa total excede la MMA en más de 100 kg (diferencia de ${(
          masaTotal - mma
        ).toFixed(2)} kg).`,
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
    const taraDelante = n(this.datos.taraDelante);
    const taraDetras = n(this.datos.taraDetras);
    const taraTotal =
      taraDelante + taraDetras > 0
        ? taraDelante + taraDetras
        : n(this.datos.taraTotal);
    const masaRealTotal = taraTotal + 75;
    const totalKgOcupAdicionales = n(this.datos.ocupantesAdicionales) * 75;
    this.datos.cargaUtilTotal =
      this.getControlMasasNumber('mmaControlMasas', 'mmaDespues') -
      masaRealTotal -
      totalKgOcupAdicionales;

    // Validaciones reglamentarias informativas
    this.comprobarCondicionesCarga();

    if (!this.validarPaginaActual()) return;

    if (this.paginaActual === 4) {
      this.paginaActual = 5;
    } else if (this.paginaActual === 5) {
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
      control.markAsTouched(),
    );
    return !!this.formulario.valid;
  }

  anterior(): void {
    this.comprobarCondicionesCarga();
    if (this.paginaActual === this.totalPaginas) {
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
