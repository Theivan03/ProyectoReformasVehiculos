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
  talleres: any[] = [];

  datos: any = {
    nombre: '---',
    apellidos: '---',
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
    fechaMatriculacion: '',
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
    modificaciones: [], // aquí llegan tus modificaciones dinámicas
    cdgconductor: 0,
    cdgocdelant: 0,
    cdgocu2: 0,
    cdgocu3: 0,
    cdgcargautil: 0,
    cdgcargavert: 0,
    opcionesCoche: [false, false, false, false, false],
    prevImages: [],
    postImages: [],
    prevPreviews: [],
    postPreviews: [],
    prevImagesB64: [],
    postImagesB64: [],
  };

  año: string = '';
  mostrarLongitud = false;
  mostrarAnchura = false;
  mostrarAltura = false;
  mostrarVoladizo = false;
  mostrarViaDelantera = false;
  mostrarViaTrasera = false;

  @Input() respuestas: any;
  @Input() datosIniciales: any;
  @Output() finalizarFormulario = new EventEmitter<any>();
  @Output() volverAReforma = new EventEmitter<any>();
  @ViewChild('formulario') formulario!: NgForm;

  constructor(private http: HttpClient) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['datosIniciales'] && this.datosIniciales) {
      this.datos = { ...this.datos, ...this.datosIniciales };
    }

    if (this.respuestas) {
      try {
        const codigos = (Object.values(this.respuestas) as any[])
          .flat()
          .filter((op: any) => op && typeof op === 'object' && 'codigo' in op)
          .map((op: any) => op.codigo)
          .join(' - ');
        this.datos.codigosReforma = codigos;
      } catch (e) {
        console.warn(
          'Estructura inesperada en respuestas:',
          this.respuestas,
          e
        );
      }
    }

    this.calcularCamposVisibles();
  }

  ngOnInit(): void {
    this.http
      .get<{ siguiente: number; año: string }>(
        'http://192.168.1.41:3000/ultimo-proyecto'
      )
      .subscribe({
        next: (data) => {
          this.año = data.año;
          this.datos.numeroProyecto = data.siguiente;
          this.generarReferencia(data.año);
        },
        error: (err) => console.error('Error al cargar último proyecto:', err),
      });
  }

  private calcularCamposVisibles(): void {
    const mods = Array.isArray(this.datos?.modificaciones)
      ? this.datos.modificaciones.filter((m: any) => m?.seleccionado)
      : [];

    // Longitud → elementos que sobresalen por delante o detrás
    this.mostrarLongitud = mods.some(
      (m: any) =>
        m.detalle?.cabrestante ||
        m.detalle?.paragolpesDelantero ||
        m.detalle?.paragolpesTrasero ||
        m.detalle?.defensaDelantera ||
        m.detalle?.soporteRuedaRepuesto ||
        m.detalle?.barraAntiempotramiento ||
        m.detalle?.cabrestanteCamper ||
        m.detalle?.paragolpesDelanteroCamper ||
        m.detalle?.paragolpesTraseroCamper ||
        m.detalle?.defensaDelanteraCamper ||
        m.detalle?.soporteRuedaRepuestoCamper
    );

    // Anchura → elementos que sobresalen lateralmente
    this.mostrarAnchura = mods.some(
      (m: any) =>
        m.detalle?.aletinesYSobrealetines ||
        m.detalle?.separadoresDeRueda ||
        m.detalle?.peldaños ||
        m.detalle?.talonerasEstribos ||
        m.detalle?.aletinesYSobrealetinesCamper ||
        m.detalle?.separadoresDeRuedaCamper ||
        m.detalle?.peldañosCamper ||
        m.detalle?.talonerasEstribosCamper ||
        m.detalle?.snorkel ||
        m.detalle?.snorkelCamper
    );

    // Altura → elementos que aumentan altura total del vehículo
    this.mostrarAltura = mods.some(
      (m: any) =>
        m.mobiliarioInterior?.claraboyas ||
        m.detalle?.bodyLift ||
        m.detalle?.claraboyaCamper ||
        m.detalle?.aleron ||
        m.detalle?.aleronCamper ||
        m.detalle?.focosDeTrabajo ||
        m.detalle?.focoEnTecho ||
        m.detalle?.placaSolar ||
        m.detalle?.placaSolarCamper
    );

    // Voladizo → básicamente paragolpes trasero (mide longitud parcial trasera)
    this.mostrarVoladizo = mods.some(
      (m: any) =>
        m.detalle?.paragolpesTrasero || m.detalle?.paragolpesTraseroCamper
    );

    // Vía delantera → piezas que afectan al ancho de los ejes delanteros
    this.mostrarViaDelantera = mods.some(
      (m: any) =>
        m.detalle?.aletinesYSobrealetines ||
        m.detalle?.separadoresDeRueda ||
        m.detalle?.aletinesYSobrealetinesCamper ||
        m.detalle?.separadoresDeRuedaCamper
    );

    // Vía trasera → igual que delantera pero para el eje trasero
    this.mostrarViaTrasera = this.mostrarViaDelantera;
  }

  enviarFormulario(): void {
    if (!this.formulario.valid) {
      Object.values(this.formulario.controls).forEach((ctrl) =>
        ctrl.markAsTouched()
      );
      return;
    }

    const finalData = {
      ...this.datos,
      codigosDetallados: this.respuestas,
      opcionesCoche: this.datos.opcionesCoche.map((v: boolean, i: number) =>
        i === 0 ? v : false
      ),
    };

    this.finalizarFormulario.emit(finalData);
  }

  volver(): void {
    this.volverAReforma.emit(this.datos);
  }

  generarReferencia(año: any): void {
    const añoCorto = año.toString().slice(-2);
    this.datos.referenciaProyecto = `PTRV ${this.datos.numeroProyecto}/${añoCorto}`;
    this.datos.referenciaCFO = `CFO ${this.datos.numeroProyecto}/${añoCorto}`;
  }

  // 👉 Aquí está el método que faltaba
  toggleAccion(mod: any, accion: string, checked: boolean): void {
    if (!mod.acciones) {
      mod.acciones = [];
    }

    if (checked) {
      if (!mod.acciones.includes(accion)) {
        mod.acciones.push(accion);
      }
    } else {
      mod.acciones = mod.acciones.filter((a: string) => a !== accion);
    }
  }
}
