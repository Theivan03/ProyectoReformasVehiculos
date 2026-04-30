import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  ReformaCampoCompartidoGrupo,
} from '../../interfaces/modificacion';
import { DatosReformaService } from '../../services/datos-reforma.service';

interface EntidadCompartidaRegistro {
  grupo: ReformaCampoCompartidoGrupo;
  entidad: Record<string, any>;
}

@Component({
  selector: 'app-resumen-modificaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resumen-modificaciones.component.html',
  styleUrls: ['./resumen-modificaciones.component.css'],
})
export class ResumenModificacionesComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() datosEntrada: any = {};
  @Output() volver = new EventEmitter<any>();
  @Output() continuar = new EventEmitter<any>();
  formSubmitted = false;

  public readonly REMOLQUE_TAMBIEN_HOMOLOGADO =
    'REMOLQUE HOMOLOGADO EN EMPLAZAMIENTO TAMBIÉN HOMOLOGADO';
  public readonly REMOLQUE_NO_HOMOLOGADO =
    'REMOLQUE HOMOLOGADO EN EMPLAZAMIENTO NO HOMOLOGADO';
  readonly BARRA_ALINEAMIENTO =
    'BARRA PARA REGULAR LA CONVERGENCIA DE LAS RUEDAS (alineamiento)';
  readonly BARRA_MOV_LATERAL =
    'BARRA PARA REGULAR LA CONVERGENCIA DE LAS RUEDAS (movimiento lateral)';
  readonly BANQUETA_INDIVIDUAL =
    'SUSTITUCIÓN DE BANQUETA DE ASIENTOS POR ASIENTO INDIVIDUAL';

  metricasTornillos: number[] = [
    4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 20, 22, 24, 27, 30, 33, 36,
    39, 42, 45, 48, 52, 56, 60, 64, 68,
  ];

  metricasAs: { [key: number]: number } = {
    4: 8.78,
    5: 14.19,
    6: 20.14,
    7: 28.81,
    8: 36.64,
    9: 48.15,
    10: 58.03,
    11: 72.32,
    12: 84.32,
    14: 115.52,
    15: 135.35,
    16: 146.52,
    17: 192.6,
    20: 244.94,
    22: 303.56,
    24: 353.7,
    27: 459.63,
    30: 560.91,
    33: 693.91,
    36: 817.16,
    39: 976.23,
    42: 1121.49,
    45: 1306.63,
    48: 1473.89,
    52: 1758.65,
    56: 2030.94,
    60: 2363.01,
    64: 2677.18,
    68: 3056.58,
  };

  tornillosDB = [
    {
      diametro: 4,
      pasoRosca: 0.7,
      calidad: 'UM8.8',
      seccionTension: 3.24,
      resistenciaMaterial: 64,
      cargaMax: 207,
      parAprete: 120,
      radioSinRoscar: 2,
      radioEfectivo: 1.015,
      areaResistente: 8.78,
    },
    {
      diametro: 5,
      pasoRosca: 0.8,
      calidad: 'UM8.8',
      seccionTension: 5.93,
      resistenciaMaterial: 64,
      cargaMax: 380,
      parAprete: 290,
      radioSinRoscar: 2.5,
      radioEfectivo: 1.374,
      areaResistente: 14.2,
    },
    {
      diametro: 6,
      pasoRosca: 1,
      calidad: 'UM8.8',
      seccionTension: 7.97,
      resistenciaMaterial: 64,
      cargaMax: 510,
      parAprete: 1100,
      radioSinRoscar: 3,
      radioEfectivo: 1.593,
      areaResistente: 20.1,
    },
    {
      diametro: 8,
      pasoRosca: 1.25,
      calidad: 'UM8.8',
      seccionTension: 15.78,
      resistenciaMaterial: 64,
      cargaMax: 1010,
      parAprete: 2600,
      radioSinRoscar: 4,
      radioEfectivo: 2.241,
      areaResistente: 36.6,
    },
  ];

  modificacionesSeleccionadas: any[] = [];
  private estadoCompartidoSub?: Subscription;
  private readonly proxiesCamposCompartidos = new WeakMap<object, any>();
  private readonly targetsCamposCompartidos = new WeakMap<object, object>();
  private readonly camposAutorellenados = new WeakMap<object, Map<string, any>>();
  private readonly camposLimpiadosManualmente = new WeakMap<object, Set<string>>();
  private readonly backupPinzasDiscos = new WeakMap<object, Record<string, any>>();
  private readonly estadoPinzasDiscos = new WeakMap<object, boolean>();
  private sincronizandoCamposCompartidos = false;

  constructor(private readonly datosReformaService: DatosReformaService) {}

  ngOnChanges(changes: SimpleChanges): void {
    console.log('--- DEBUG: ngOnChanges disparado ---', changes);
    if (changes['datosEntrada']) {
      console.log('--- DEBUG: Detectado cambio en datosEntrada ---');
      this.rebuild();
    }
  }

  ngOnInit(): void {
    this.estadoCompartidoSub = this.datosReformaService.estadoCompartido$.subscribe(
      () => {
        if (this.sincronizandoCamposCompartidos) return;
        this.aplicarEstadoCompartidoActual();
      },
    );

    console.log(
      '--- DEBUG: ngOnInit disparado ---  datosEntrada en resumen modificaciones:',
      this.datosEntrada,
    );
    this.rebuild();
  }

  ngOnDestroy(): void {
    this.estadoCompartidoSub?.unsubscribe();
  }

  private rebuild() {
    console.group('--- DEBUG REBUILD EXECUTION ---');

    if (!this.datosEntrada) {
      console.error('ERROR: datosEntrada es null o undefined');
      this.modificacionesSeleccionadas = [];
      console.groupEnd();
      return;
    }

    console.log('Datos Entrada recibidos:', this.datosEntrada);

    if (!Array.isArray(this.datosEntrada.modificaciones)) {
      console.error(
        'ERROR: datosEntrada.modificaciones NO es un array',
        this.datosEntrada.modificaciones,
      );
      this.modificacionesSeleccionadas = [];
      console.groupEnd();
      return;
    }

    const total = this.datosEntrada.modificaciones.length;
    console.log(`Array original tiene ${total} elementos.`);

    this.modificacionesSeleccionadas = this.datosEntrada.modificaciones.filter(
      (m: any) => {
        const isSelected =
          m?.seleccionado === true || m?.seleccionado === 'true';
        if (isSelected) console.log('Elemento aceptado:', m.nombre);
        return isSelected;
      },
    );

    console.log(
      'LONGITUD FINAL modificacionesSeleccionadas:',
      this.modificacionesSeleccionadas.length,
    );

    if (this.modificacionesSeleccionadas.length === 0) {
      console.warn('ALERTA: El array final está vacío.');
    }

    // --- AQUÍ EMPIEZA LA INICIALIZACIÓN DE VARIABLES ---
    this.modificacionesSeleccionadas.forEach((m) => {
      // 1. L?gica existente de Mobiliario
      if (m.nombre === 'MOBILIARIO INTERIOR VEHÍCULO') {
        if (m.diametroTornilloSeleccionado === undefined) {
          m.diametroTornilloSeleccionado = null;
        }
        if (m.areaResistenteTornilloSeleccionado === undefined) {
          m.areaResistenteTornilloSeleccionado = null;
        }

        if (Array.isArray(m.mueblesBajo)) {
          m.mueblesBajo.forEach((mueble: any) => {
            if (mueble?.metricaTornillosMuebleBajo === undefined) {
              mueble.metricaTornillosMuebleBajo = null;
            }
            if (mueble?.configuracionMuebleBajo === undefined) {
              mueble.configuracionMuebleBajo = '';
            }
            if (
              !mueble.configuracionMuebleBajo &&
              mueble?.cajones !== undefined &&
              mueble?.cajones !== null &&
              mueble?.cajones !== ''
            ) {
              mueble.configuracionMuebleBajo = `${mueble.cajones} cajones`;
            }
          });
        }

        if (Array.isArray(m.mueblesAlto)) {
          m.mueblesAlto.forEach((mueble: any) => {
            if (mueble?.metricaTornillosMuebleAlto === undefined) {
              mueble.metricaTornillosMuebleAlto = null;
            }
            if (mueble?.configuracionMuebleAlto === undefined) {
              mueble.configuracionMuebleAlto = '';
            }
          });
        }

        if (Array.isArray(m.mueblesAseo)) {
          m.mueblesAseo.forEach((mueble: any) => {
            if (mueble?.metricaTornillosMuebleAseo === undefined) {
              mueble.metricaTornillosMuebleAseo = null;
            }
            if (mueble?.configuracionMuebleAseo === undefined) {
              mueble.configuracionMuebleAseo = '';
            }
          });
        }

        m.mueblesBajo = (m.mueblesBajo || []).map((mueble: any) =>
          this.createMuebleItem('bajo', mueble),
        );
        m.mueblesAlto = (m.mueblesAlto || []).map((mueble: any) =>
          this.createMuebleItem('alto', mueble),
        );
        m.mueblesAseo = (m.mueblesAseo || []).map((mueble: any) =>
          this.createMuebleItem('aseo', mueble),
        );

        this.onDiametroTornilloChange(m);
      }

      // 2. L?gica existente de Instalaci?n El?ctrica
      if (m.nombre === 'INSTALACIÓN ELÉCTRICA') {
        this.ensureInstalacionElectricaDefaults(m);
      }

      if (m.nombre === 'INTERMITENTES') {
        this.ensureIntermitentesDefaults(m);
      }

      if (m.nombre === 'PELDAÑOS') {
        this.ensurePeldanosDefaults(m);
      }

      if (m.nombre === 'CLARABOYA') {
        this.ensureClaraboyaDefaults(m);
      }

      if (m.nombre === 'VENTANA') {
        this.ensureVentanaDefaults(m);
      }

      if (m.nombre === 'CAMPO LIBRE SOBRE REFORMAS NO EXISTENTES') {
        if (!Array.isArray(m.reformasAdicionalesItems)) {
          m.reformasAdicionalesItems = [];
        }

        if (
          m.reformasAdicionalesItems.length === 0 &&
          typeof m.reformasAdicionales === 'string' &&
          m.reformasAdicionales.trim()
        ) {
          m.reformasAdicionalesItems = m.reformasAdicionales
            .split(/\r?\n/)
            .map((line: string) => line.trim())
            .filter((line: string) => line.length > 0)
            .map((line: string, index: number) =>
              this.createReformaAdicionalItem({
                titulo: `Reforma adicional ${index + 1}`,
                descripcion: line,
              }),
            );
        }

        m.reformasAdicionalesItems = m.reformasAdicionalesItems.map((item: any) =>
          this.createReformaAdicionalItem(item),
        );
      }

      if (m.nombre === 'SUSTITUCIÓN DE DISCOS DE FRENO') {
        if (typeof m.modificaPinzasDiscos === 'string') {
          m.modificaPinzasDiscos = m.modificaPinzasDiscos === 'true';
        }
        if (m.modificaPinzasDiscos == null) {
          m.modificaPinzasDiscos = this.tieneDatosPinzasDiscos(m);
        }
      }

      if (m.nombre === 'BARRAS ANTIVUELCO') {
        this.ensureBarrasAntivuelcoDefaults(m);
      }

      if (m.nombre === 'REFUERZO PARAGOLPES') {
        this.syncRefuerzoLegacyData(m);
      }

      if (m.nombre === 'DIFUSOR TRASERO') {
        this.ensureDifusorDefaults(m);
      }
      if (m.nombre === 'LIP DELANTERO') {
        this.ensureLipDelanteroDefaults(m);
      }
      if (m.nombre === 'MATRÍCULA Y PORTAMATRÍCULA') {
        // if (m.velocidadAireV2msAletines == null) {
        //   m.velocidadAireV2msAletines = 38.89;
        // }
        // if (m.densidadAireKgM3Aletines == null) {
        //   m.densidadAireKgM3Aletines = 1.29;
        // }
        // if (m.radioCurvaRAletines == null) {
        //   m.radioCurvaRAletines = 8;
        // }
        if (m.radioCurvaRPortamatricula == null) {
          m.radioCurvaRPortamatricula = 8;
        }
        // if (m.coefSeguridadKAletines == null) {
        //   m.coefSeguridadKAletines = 3;
        // }
        // if (m.coefAerodinamicoCwAletines == null) {
        //   m.coefAerodinamicoCwAletines = 0.82;
        // }
        // if (m.resTraccionMinTornillo88Kgmm2Aletines == null) {
        //   m.resTraccionMinTornillo88Kgmm2Aletines = 80;
        // }
        // if (m.seccionResistenteAsAletines == null) {
        //   m.seccionResistenteAsAletines =
        //     this.getAreaResistenteByMetrica(m.metricaAletines) ?? 36.64;
        // }
      }
      if (m.nombre === 'PELDAÑOS') {
        this.ensurePeldanosDefaults(m);
      }
      if (m.nombre === 'CALANDRA') {
        // if (m.velocidadAireV2msAletines == null) {
        //   m.velocidadAireV2msAletines = 38.89;
        // }
        // if (m.densidadAireKgM3Aletines == null) {
        //   m.densidadAireKgM3Aletines = 1.29;
        // }
        // if (m.radioCurvaRAletines == null) {
        //   m.radioCurvaRAletines = 8;
        // }
        if (m.radioCurvaRCalandra == null) {
          m.radioCurvaRCalandra = 8;
        }
        // if (m.coefSeguridadKAletines == null) {
        //   m.coefSeguridadKAletines = 3;
        // }
        // if (m.coefAerodinamicoCwAletines == null) {
        //   m.coefAerodinamicoCwAletines = 0.82;
        // }
        // if (m.resTraccionMinTornillo88Kgmm2Aletines == null) {
        //   m.resTraccionMinTornillo88Kgmm2Aletines = 80;
        // }
        // if (m.seccionResistenteAsAletines == null) {
        //   m.seccionResistenteAsAletines =
        //     this.getAreaResistenteByMetrica(m.metricaAletines) ?? 36.64;
        // }
      }
      if (m.nombre === 'PLANCHA CAPÓ') {
        // if (m.velocidadAireV2msAletines == null) {
        //   m.velocidadAireV2msAletines = 38.89;
        // }
        // if (m.densidadAireKgM3Aletines == null) {
        //   m.densidadAireKgM3Aletines = 1.29;
        // }
        // if (m.radioCurvaRAletines == null) {
        //   m.radioCurvaRAletines = 8;
        // }
        if (m.radioCurvaRPlanchaCapo == null) {
          m.radioCurvaRPlanchaCapo = 8;
        }
        // if (m.coefSeguridadKAletines == null) {
        //   m.coefSeguridadKAletines = 3;
        // }
        // if (m.coefAerodinamicoCwAletines == null) {
        //   m.coefAerodinamicoCwAletines = 0.82;
        // }
        // if (m.resTraccionMinTornillo88Kgmm2Aletines == null) {
        //   m.resTraccionMinTornillo88Kgmm2Aletines = 80;
        // }
        // if (m.seccionResistenteAsAletines == null) {
        //   m.seccionResistenteAsAletines =
        //     this.getAreaResistenteByMetrica(m.metricaAletines) ?? 36.64;
        // }
      }
      if (m.nombre === 'REFUERZO PARAGOLPES') {
        // if (m.velocidadAireV2msAletines == null) {
        //   m.velocidadAireV2msAletines = 38.89;
        // }
        // if (m.densidadAireKgM3Aletines == null) {
        //   m.densidadAireKgM3Aletines = 1.29;
        // }
        // if (m.radioCurvaRAletines == null) {
        //   m.radioCurvaRAletines = 8;
        // }
        if (m.radioCurvaRRefuerzo == null) {
          m.radioCurvaRRefuerzo = 8;
        }
        // if (m.coefSeguridadKAletines == null) {
        //   m.coefSeguridadKAletines = 3;
        // }
        // if (m.coefAerodinamicoCwAletines == null) {
        //   m.coefAerodinamicoCwAletines = 0.82;
        // }
        // if (m.resTraccionMinTornillo88Kgmm2Aletines == null) {
        //   m.resTraccionMinTornillo88Kgmm2Aletines = 80;
        // }
        // if (m.seccionResistenteAsAletines == null) {
        //   m.seccionResistenteAsAletines =
        //     this.getAreaResistenteByMetrica(m.metricaAletines) ?? 36.64;
        // }
      }
      if (m.nombre === 'ALETINES Y SOBREALETINES') {
        if (m.velocidadAireV2msAletines == null) {
          m.velocidadAireV2msAletines = 38.89;
        }
        if (m.densidadAireKgM3Aletines == null) {
          m.densidadAireKgM3Aletines = 1.29;
        }
        if (m.radioCurvaRAletines == null) {
          m.radioCurvaRAletines = 8;
        }
        if (m.curvaturaSobrealetines == null) {
          m.curvaturaSobrealetines = 8;
        }
        if (m.coefSeguridadKAletines == null) {
          m.coefSeguridadKAletines = 3;
        }
        if (m.coefAerodinamicoCwAletines == null) {
          m.coefAerodinamicoCwAletines = 0.82;
        }
        if (m.resTraccionMinTornillo88Kgmm2Aletines == null) {
          m.resTraccionMinTornillo88Kgmm2Aletines = 80;
        }
        if (m.superficieFrontalM2Aletines == null) {
          m.superficieFrontalM2Aletines = 0;
        }
        if (m.seccionResistenteAsAletines == null) {
          m.seccionResistenteAsAletines =
            this.getAreaResistenteByMetrica(m.metricaAletines) ?? 36.64;
        }
        if (!m.detalle) {
          m.detalle = { aletines: false, sobrealetines: false };
        }
      }
      if (m.nombre === 'CABRESTANTE') {
        if (m.metricaCabrestante == null) {
          m.metricaCabrestante = 8;
        }
        if (m.diametroPernoCmCabrestante == null) {
          m.diametroPernoCmCabrestante = 1;
        }
        if (m.tensionMinCortanteKgCm2Cabrestante == null) {
          m.tensionMinCortanteKgCm2Cabrestante = 3100;
        }
        if (m.tensionMinCortanteChasisKgCm2Cabrestante == null) {
          m.tensionMinCortanteChasisKgCm2Cabrestante = 1948.06;
        }
        if (m.materialPernoCabrestante == null) {
          m.materialPernoCabrestante = 'Acero 8.8';
        }
        if (m.materialPernoChasisCabrestante == null) {
          m.materialPernoChasisCabrestante = 'Acero 8.8';
        }
        if (!m.detalle) {
          m.detalle = { aletines: false, sobrealetines: false };
        }
      }
      if (m.nombre === 'ANTIEMPOTRAMIENTO') {
        if (m.nTornillosAntiempotramiento == null && m.nTornillos != null) {
          m.nTornillosAntiempotramiento = m.nTornillos;
        }
        if (m.nTornillos == null && m.nTornillosAntiempotramiento != null) {
          m.nTornillos = m.nTornillosAntiempotramiento;
        }
        if (m.seccionResistenteAsAntiempotramiento == null) {
          m.seccionResistenteAsAntiempotramiento =
            this.getAreaResistenteByMetrica(m.metricaAntiempotramiento) ??
            36.64;
        }
        if (m.resTraccionMinTornillo88Kgmm2Antiempotramiento == null) {
          m.resTraccionMinTornillo88Kgmm2Antiempotramiento = 80;
        }
        if (m.cwCoefAerodinamicoAntiempotramiento == null) {
          m.cwCoefAerodinamicoAntiempotramiento = 0.82;
        }
        if (m.densidadAireKgM3Antiempotramiento == null) {
          m.densidadAireKgM3Antiempotramiento = 1.29;
        }
        if (m.velocidadAireV2msAntiempotramiento == null) {
          m.velocidadAireV2msAntiempotramiento = 38.89;
        }
        if (m.radioCurvaRAntiempotramiento == null) {
          m.radioCurvaRAntiempotramiento = 8;
        }
        if (m.coefSeguridadKAntiempotramiento == null) {
          m.coefSeguridadKAntiempotramiento = 3;
        }
        if (
          m.medidasAntiempotramiento &&
          m.superficieFrontalM2Antiempotramiento == null
        ) {
          this.calcularSuperficieAntiempotramiento(m);
        }
        if (!m.detalle) {
          m.detalle = { aletines: false, sobrealetines: false };
        }
      }
      if (m.nombre === 'SOPORTES PARA LUCES DE USO ESPECÍFICO') {
        if (m.calidadTornilloLucesEspecificas == null) {
          m.calidadTornilloLucesEspecificas = 8.8;
        }
        if (m.seccionResistenteAsLucesEspecificas == null) {
          m.seccionResistenteAsLucesEspecificas =
            this.getAreaResistenteByMetrica(m.metricaLucesEspecificas) ?? 36.64;
        }
        if (m.resTraccionMinTornillo88Kgmm2LucesEspecificas == null) {
          m.resTraccionMinTornillo88Kgmm2LucesEspecificas = 80;
        }
        if (m.cwCoefAerodinamicoLucesEspecificas == null) {
          m.cwCoefAerodinamicoLucesEspecificas = 0.82;
        }
        if (m.densidadAireKgM3LucesEspecificas == null) {
          m.densidadAireKgM3LucesEspecificas = 1.29;
        }
        if (m.velocidadAireV2msLucesEspecificas == null) {
          m.velocidadAireV2msLucesEspecificas = 38.89;
        }
        if (m.radioCurvaRLucesEspecificas == null) {
          m.radioCurvaRLucesEspecificas = 8;
        }
        if (m.coefSeguridadKLucesEspecificas == null) {
          m.coefSeguridadKLucesEspecificas = 3;
        }
        if (!m.detalle) {
          m.detalle = { aletines: false, sobrealetines: false };
        }
      }

      if (m.nombre === 'PARAGOLPES DELANTERO') {
        if (m.seccionResistenteAsParagolpesDelantero == null) {
          m.seccionResistenteAsParagolpesDelantero =
            this.getAreaResistenteByMetrica(m.metricaParaDelantero) ?? 36.64;
        }

        if (m.resTraccionMinTornillo88Kgmm2ParagolpesDelantero == null) {
          m.resTraccionMinTornillo88Kgmm2ParagolpesDelantero = 80;
        }
        if (m.cwCoefAerodinamicoParagolpesDelantero == null) {
          m.cwCoefAerodinamicoParagolpesDelantero = 0.82;
        }
        if (m.densidadAireKgM3ParagolpesDelantero == null) {
          m.densidadAireKgM3ParagolpesDelantero = 1.29;
        }
        if (m.velocidadAireV2msParagolpesDelantero == null) {
          m.velocidadAireV2msParagolpesDelantero = 38.89;
        }
        if (m.radioCurvaRParagolpesDelantero == null) {
          m.radioCurvaRParagolpesDelantero = 8;
        }
        if (m.coefSeguridadKParagolpesDelantero == null) {
          m.coefSeguridadKParagolpesDelantero = 3;
        }
        if (!m.detalle) {
          m.detalle = { aletines: false, sobrealetines: false };
        }
      }

      if (m.nombre === 'PARAGOLPES TRASERO') {
        if (m.calidadTornilloParagolpesTrasero == null) {
          m.calidadTornilloParagolpesTrasero = 8.8;
        }
        if (m.seccionResistenteAsParagolpesTrasero == null) {
          m.seccionResistenteAsParagolpesTrasero =
            this.getAreaResistenteByMetrica(m.metricaParaTrasero) ?? 36.64;
        }
        if (m.resTraccionMinTornillo88Kgmm2ParagolpesTrasero == null) {
          m.resTraccionMinTornillo88Kgmm2ParagolpesTrasero = 80;
        }
        if (m.coefAerodinamicoParagolpesTrasero == null) {
          m.coefAerodinamicoParagolpesTrasero = 0.82;
        }
        if (m.densidadAireKgM3ParagolpesTrasero == null) {
          m.densidadAireKgM3ParagolpesTrasero = 1.29;
        }
        if (m.velocidadAireV2msParagolpesTrasero == null) {
          m.velocidadAireV2msParagolpesTrasero = 38.89;
        }
        if (m.radioCurvaRParagolpesTrasero == null) {
          m.radioCurvaRParagolpesTrasero = 8;
        }
        if (m.coefSeguridadKParagolpesTrasero == null) {
          m.coefSeguridadKParagolpesTrasero = 3;
        }
        if (!m.detalle) {
          m.detalle = { aletines: false, sobrealetines: false };
        }
      }

      if (m.nombre === 'ESTRIBOS LATERALES O TALONERAS') {
        if (m.coefAerodinamicoEstribos == null) {
          m.coefAerodinamicoEstribos = 0.82;
        }
        if (m.calidadTornilloEstribos == null) {
          m.calidadTornilloEstribos = 8.8;
        }
        if (m.seccionResistenteAsEstribos == null) {
          m.seccionResistenteAsEstribos =
            this.getAreaResistenteByMetrica(m.metricaTalonera) ?? 36.64;
        }
        if (m.resTraccionMinTornillo88Kgmm2Estribos == null) {
          m.resTraccionMinTornillo88Kgmm2Estribos = 80;
        }
        if (m.densidadAireKgM3Estribos == null) {
          m.densidadAireKgM3Estribos = 1.29;
        }
        if (m.velocidadAireV2msEstribos == null) {
          m.velocidadAireV2msEstribos = 38.89;
        }
        if (m.radioCurvaREstribos == null) {
          m.radioCurvaREstribos = 8;
        }
        if (m.coefSeguridadKEstribos == null) {
          m.coefSeguridadKEstribos = 3;
        }
        if (!m.detalle) {
          m.detalle = { aletines: false, sobrealetines: false };
        }
      }

      if (m.nombre === 'ALERÓN') {
        if (!m.coefAerodinamicoCwAleron) m.coefAerodinamicoCwAleron = 0.82;
        if (!m.velocidadAireV2msAleron) m.velocidadAireV2msAleron = 38.89;
        if (!m.densidadAireKgM3Aleron) m.densidadAireKgM3Aleron = 1.29;
        if (!m.coefSeguridadKAleron) m.coefSeguridadKAleron = 3;
        if (m.curvaturaAleron == null) {
          m.curvaturaAleron = 8;
        }
        if (!m.calidadTornilloAleron) m.calidadTornilloAleron = 8.8;
        if (!m.resTraccionMinTornillo88Kgmm2Aleron)
          m.resTraccionMinTornillo88Kgmm2Aleron = 80;
        if (!m.metricaAleron) m.metricaAleron = 4;
        if (!m.seccionResistenteAsAleron) {
          m.seccionResistenteAsAleron =
            this.getAreaResistenteByMetrica(m.metricaAleron) ?? 11.33;
        }
      }

      if (m.nombre === 'SNORKEL') {
        this.ensureSnorkelDefaults(m);
      }

      if (m.nombre === 'LUCES DE LARGO ALCANCE') {
        this.ensureLargoAlcanceDefaults(m);
      }

      if (m.nombre === 'TOLDO') {
        this.ensureToldoDefaults(m);
      }

      if (m.nombre === 'DEFENSA DELANTERA') {
        this.ensureDefensaDelanteraDefaults(m);
      }

      if (
        m.nombre ===
        'TODA LA CASUÍSTICA DE MUELLES, BALLESTAS Y AMORTIGUADORES QUE SE PUEDEN DAR'
      ) {
        this.ensureSuspensionCasuisticaDefaults(m);
      }

      if (m.nombre === 'SUSTITUCIÓN DE DISCOS DE FRENO') {
        this.ensureAngulosContactoSustitucionDiscos(m);
      }

      this.syncAreaResistenteByMetrica(m);
      this.syncCalidadByMetrica(m);
    });

    this.rebuildCamposCompartidos();
    console.groupEnd();
  }

  private rebuildCamposCompartidos(): void {
    const entidades = this.collectSharedEntities();

    this.sincronizandoCamposCompartidos = true;
    try {
      this.datosReformaService.resetEstadoCompartido();

      entidades.forEach(({ grupo, entidad }) => {
        const target = this.unwrapSharedEntity(entidad);
        this.aplicarValoresCompartidosEnEntidad(grupo, target);
        this.datosReformaService.capturarEntidadCompartida(grupo, target, true);
      });
    } finally {
      this.sincronizandoCamposCompartidos = false;
    }
  }

  private aplicarEstadoCompartidoActual(): void {
    this.sincronizandoCamposCompartidos = true;
    try {
      this.collectSharedEntities().forEach(({ grupo, entidad }) => {
        this.aplicarValoresCompartidosEnEntidad(
          grupo,
          this.unwrapSharedEntity(entidad),
        );
      });
    } finally {
      this.sincronizandoCamposCompartidos = false;
    }
  }

  private collectSharedEntities(): EntidadCompartidaRegistro[] {
    const entidades: EntidadCompartidaRegistro[] = [];

    this.modificacionesSeleccionadas.forEach((mod) => {
      if (mod.nombre === 'CLARABOYA') {
        this.agregarEntidadesCompartidas(
          entidades,
          'claraboya',
          mod.claraboyas,
        );
      }

      if (mod.nombre === 'VENTANA') {
        this.agregarEntidadesCompartidas(entidades, 'ventana', mod.ventanas);
      }

      if (mod.nombre === 'INSTALACIÃ“N ELÃ‰CTRICA') {
        this.agregarEntidadesCompartidas(
          entidades,
          'placaSolar',
          mod.placasSolares,
        );
      }

      if (mod.nombre === 'MOBILIARIO INTERIOR VEHÃCULO') {
        this.agregarEntidadesCompartidas(
          entidades,
          'muebleBajo',
          mod.mueblesBajo,
        );
        this.agregarEntidadesCompartidas(
          entidades,
          'muebleAlto',
          mod.mueblesAlto,
        );
        this.agregarEntidadesCompartidas(
          entidades,
          'muebleAseo',
          mod.mueblesAseo,
        );
      }

      if (mod.nombre === 'CAMPO LIBRE SOBRE REFORMAS NO EXISTENTES') {
        this.agregarEntidadesCompartidas(
          entidades,
          'reformaAdicional',
          mod.reformasAdicionalesItems,
        );
      }
    });

    return entidades;
  }

  private agregarEntidadesCompartidas(
    registros: EntidadCompartidaRegistro[],
    grupo: ReformaCampoCompartidoGrupo,
    entidades: any[],
  ): void {
    if (!Array.isArray(entidades)) return;

    entidades.forEach((entidad) => {
      if (!entidad || typeof entidad !== 'object') return;
      registros.push({ grupo, entidad });
    });
  }

  private aplicarValoresCompartidosEnEntidad(
    grupo: ReformaCampoCompartidoGrupo,
    entidad: Record<string, any>,
  ): void {
    const valoresCompartidos = this.datosReformaService.getGrupoCompartido(grupo);

    Object.entries(valoresCompartidos).forEach(([campo, valor]) => {
      if (!this.debeAutorrellenarseCampo(entidad, campo)) return;

      const siguienteValor = this.clonarValorCompartido(valor);
      entidad[campo] = siguienteValor;
      this.marcarCampoAutorellenado(entidad, campo, siguienteValor);
      this.limpiarCampoLimpiadoManual(entidad, campo);
    });
  }

  private debeAutorrellenarseCampo(
    entidad: Record<string, any>,
    campo: string,
  ): boolean {
    if (this.estaCampoLimpiadoManual(entidad, campo)) {
      return false;
    }

    const valorActual = entidad[campo];
    if (this.isMissingValue(valorActual)) {
      return true;
    }

    const valorAutorellenado = this.obtenerCampoAutorellenado(entidad, campo);
    return (
      valorAutorellenado !== undefined &&
      this.sonValoresIguales(valorActual, valorAutorellenado)
    );
  }

  private wrapEntidadCompartida<T extends Record<string, any>>(
    grupo: ReformaCampoCompartidoGrupo,
    entidad: T,
  ): T {
    const target = this.unwrapSharedEntity(entidad) as T;
    const proxyExistente = this.proxiesCamposCompartidos.get(target);
    if (proxyExistente) {
      return proxyExistente as T;
    }

    const proxy = new Proxy(target, {
      set: (rawTarget, prop, value, receiver) => {
        const valorAnterior = Reflect.get(rawTarget, prop, receiver);
        const actualizado = Reflect.set(rawTarget, prop, value, receiver);

        if (
          actualizado &&
          typeof prop === 'string' &&
          this.datosReformaService.esCampoCompartido(grupo, prop) &&
          !this.sonValoresIguales(valorAnterior, value)
        ) {
          this.onCambioCampoCompartido(grupo, rawTarget, prop, value);
        }

        return actualizado;
      },
    });

    this.proxiesCamposCompartidos.set(target, proxy);
    this.targetsCamposCompartidos.set(proxy, target);
    return proxy as T;
  }

  private unwrapSharedEntity<T>(entidad: T): T {
    if (!entidad || typeof entidad !== 'object') {
      return entidad;
    }

    return (this.targetsCamposCompartidos.get(entidad as object) ?? entidad) as T;
  }

  private onCambioCampoCompartido(
    grupo: ReformaCampoCompartidoGrupo,
    entidad: Record<string, any>,
    campo: string,
    valor: any,
  ): void {
    if (this.sincronizandoCamposCompartidos) return;

    if (this.isMissingValue(valor)) {
      this.marcarCampoLimpiadoManual(entidad, campo);
      this.limpiarCampoAutorellenado(entidad, campo);
    } else {
      this.limpiarCampoLimpiadoManual(entidad, campo);

      const valorAutorellenado = this.obtenerCampoAutorellenado(entidad, campo);
      if (
        valorAutorellenado !== undefined &&
        !this.sonValoresIguales(valorAutorellenado, valor)
      ) {
        this.limpiarCampoAutorellenado(entidad, campo);
      }
    }

    this.datosReformaService.capturarEntidadCompartida(grupo, entidad, true);
  }

  private registrarCamposCompartidosPorDefecto(
    grupo: ReformaCampoCompartidoGrupo,
    entidad: Record<string, any>,
    inicial: Record<string, any>,
    defaults: Record<string, any>,
  ): void {
    this.limpiarMetadatosCamposCompartidos(grupo, entidad);

    this.datosReformaService.getCamposCompartidos(grupo).forEach((campo) => {
      if (!this.isMissingValue(inicial?.[campo])) return;
      if (this.isMissingValue(defaults?.[campo])) return;

      this.marcarCampoAutorellenado(
        entidad,
        campo,
        this.clonarValorCompartido(entidad[campo]),
      );
    });
  }

  private limpiarMetadatosCamposCompartidos(
    grupo: ReformaCampoCompartidoGrupo,
    entidad: Record<string, any>,
  ): void {
    this.datosReformaService.getCamposCompartidos(grupo).forEach((campo) => {
      this.limpiarCampoAutorellenado(entidad, campo);
      this.limpiarCampoLimpiadoManual(entidad, campo);
    });
  }

  private marcarCampoAutorellenado(
    entidad: Record<string, any>,
    campo: string,
    valor: any,
  ): void {
    const campos = this.camposAutorellenados.get(entidad) ?? new Map<string, any>();
    campos.set(campo, this.clonarValorCompartido(valor));
    this.camposAutorellenados.set(entidad, campos);
  }

  private obtenerCampoAutorellenado(
    entidad: Record<string, any>,
    campo: string,
  ): any {
    return this.camposAutorellenados.get(entidad)?.get(campo);
  }

  private limpiarCampoAutorellenado(
    entidad: Record<string, any>,
    campo: string,
  ): void {
    this.camposAutorellenados.get(entidad)?.delete(campo);
  }

  private marcarCampoLimpiadoManual(
    entidad: Record<string, any>,
    campo: string,
  ): void {
    const campos =
      this.camposLimpiadosManualmente.get(entidad) ?? new Set<string>();
    campos.add(campo);
    this.camposLimpiadosManualmente.set(entidad, campos);
  }

  private estaCampoLimpiadoManual(
    entidad: Record<string, any>,
    campo: string,
  ): boolean {
    return this.camposLimpiadosManualmente.get(entidad)?.has(campo) ?? false;
  }

  private limpiarCampoLimpiadoManual(
    entidad: Record<string, any>,
    campo: string,
  ): void {
    this.camposLimpiadosManualmente.get(entidad)?.delete(campo);
  }

  private sonValoresIguales(actual: unknown, siguiente: unknown): boolean {
    return JSON.stringify(actual) === JSON.stringify(siguiente);
  }

  private clonarValorCompartido(valor: any): any {
    if (Array.isArray(valor)) return [...valor];
    if (valor && typeof valor === 'object') return { ...valor };
    return valor;
  }

  getTornilloActivo(mod: any) {
    if (!mod?.diametroTornilloSeleccionado) return null;
    return this.tornillosDB.find(
      (t) => t.diametro === mod.diametroTornilloSeleccionado,
    );
  }

  onFrenosChange(mod: any) {
    this.ensureAngulosContactoSustitucionDiscos(mod);

    this.syncPinzasDiscos(mod);

    if (mod.sonIguales) {
      // Datos básicos
      mod.marcaDiscoTrasero = mod.marcaDiscos;
      mod.modeloDiscoTrasero = mod.modeloDiscos;
      mod.referenciaDiscoTrasero = mod.referenciaDiscos;
      mod.diametroDiscoTrasero = mod.diametroDiscos;
      mod.espesorDiscoTrasero = mod.espesorDiscos;

      // Datos de cálculo (Técnicos)
      mod.numDiscosTrasero = mod.numDiscosDelantero; // NUEVO
      if (mod.modificaPinzasDiscos !== false) {
        mod.numPinzasTraseras = mod.numPinzasDelanteras; // NUEVO
      }
      mod.diametroExteriorDiscoTrasero = mod.diametroExteriorDiscos;
      mod.diametroInteriorDiscoTrasero = mod.diametroInteriorDiscos;
      if (mod.modificaPinzasDiscos !== false) {
        mod.diametroBombaDiscoTrasero = mod.diametroBombaDiscos;
        mod.dimensionPistonDiscoTrasero = mod.dimensionPistonDiscos;
        mod.numPistonesDiscoTrasero = mod.numPistonesDiscos;
      }
      mod.anguloContactoDiscoTrasero = mod.anguloContactoDiscos;
      mod.perfilNeumaticoDiscoTrasero = mod.perfilNeumaticoDiscos;
      mod.anchoNeumaticoDiscoTrasero = mod.anchoNeumaticoDiscos;
      mod.radioEfectivoDiscoTrasero = mod.radioEfectivoDiscos;
    }
  }

  private tieneDatosPinzasDiscos(mod: any): boolean {
    return [
      mod?.numPinzasDelanteras,
      mod?.numPinzasTraseras,
      mod?.diametroBombaDiscos,
      mod?.dimensionPistonDiscos,
      mod?.numPistonesDiscos,
      mod?.diametroBombaDiscoTrasero,
      mod?.dimensionPistonDiscoTrasero,
      mod?.numPistonesDiscoTrasero,
    ].some((valor) => valor !== undefined && valor !== null && valor !== '');
  }

  private obtenerBackupPinzasDiscos(mod: any): Record<string, any> {
    return {
      numPinzasDelanteras: mod?.numPinzasDelanteras ?? null,
      numPinzasTraseras: mod?.numPinzasTraseras ?? null,
      diametroBombaDiscos: mod?.diametroBombaDiscos ?? null,
      dimensionPistonDiscos: mod?.dimensionPistonDiscos ?? null,
      numPistonesDiscos: mod?.numPistonesDiscos ?? null,
      diametroBombaDiscoTrasero: mod?.diametroBombaDiscoTrasero ?? null,
      dimensionPistonDiscoTrasero: mod?.dimensionPistonDiscoTrasero ?? null,
      numPistonesDiscoTrasero: mod?.numPistonesDiscoTrasero ?? null,
    };
  }

  private aplicarBackupPinzasDiscos(mod: any, backup: Record<string, any>): void {
    if (!mod || !backup) return;
    Object.assign(mod, backup);
  }

  private limpiarDatosPinzasDiscos(mod: any): void {
    if (!mod) return;

    mod.numPinzasDelanteras = null;
    mod.numPinzasTraseras = null;
    mod.diametroBombaDiscos = null;
    mod.dimensionPistonDiscos = null;
    mod.numPistonesDiscos = null;
    mod.diametroBombaDiscoTrasero = null;
    mod.dimensionPistonDiscoTrasero = null;
    mod.numPistonesDiscoTrasero = null;
  }

  private syncPinzasDiscos(mod: any): void {
    if (!mod) return;
    this.estadoPinzasDiscos.set(mod, mod.modificaPinzasDiscos !== false);
  }

  private ensureAngulosContactoSustitucionDiscos(mod: any): void {
    if (!mod) return;

    const keys = [
      'anguloContactoDiscos',
      'anguloContactoDiscoTrasero',
      'ant_anguloContactoDiscoDelantero',
      'ant_anguloContactoDiscoTrasero',
    ] as const;

    keys.forEach((key) => {
      if (mod[key] === undefined || mod[key] === null || mod[key] === '') {
        mod[key] = 0.7;
      }
    });
  }

  calcularSuperficieAleron(mod: any) {
    if (!mod.medidasAleron) {
      return;
    }

    const valorLimpio = mod.medidasAleron
      .toString()
      .toLowerCase()
      .replace(/mm/g, '')
      .replace(/\s/g, '');

    if (valorLimpio.includes('x')) {
      const partes = valorLimpio.split('x');
      const largo = parseFloat(partes[0]);
      const ancho = parseFloat(partes[1]);

      if (!isNaN(largo) && !isNaN(ancho)) {
        const areaM2 = (largo * ancho) / 1000000;
        mod.superficieFrontalM2Aleron = parseFloat(areaM2.toFixed(4));
      }
    }
  }

  calcularSuperficieParagolpesDelantero(mod: any) {
    if (!mod.medidasParagolpesDelantero) {
      return;
    }

    const valorLimpio = mod.medidasParagolpesDelantero
      .toString()
      .toLowerCase()
      .replace(/mm/g, '')
      .replace(/\s/g, '');

    if (valorLimpio.includes('x')) {
      const partes = valorLimpio.split('x');
      const largo = parseFloat(partes[0]);
      const ancho = parseFloat(partes[1]);

      if (!isNaN(largo) && !isNaN(ancho)) {
        const areaM2 = (largo * ancho) / 1000000;
        mod.superficieFrontalM2ParagolpesDelantero = parseFloat(
          areaM2.toFixed(4),
        );
      }
    }
  }

  calcularSuperficieAntiempotramiento(mod: any) {
    if (!mod.medidasAntiempotramiento) {
      return;
    }

    const valorLimpio = mod.medidasAntiempotramiento
      .toString()
      .toLowerCase()
      .replace(/mm/g, '')
      .replace(/\s/g, '');

    if (valorLimpio.includes('x')) {
      const partes = valorLimpio.split('x');
      const largo = parseFloat(partes[0]);
      const ancho = parseFloat(partes[1]);

      if (!isNaN(largo) && !isNaN(ancho)) {
        const areaM2 = (largo * ancho) / 1000000;
        mod.superficieFrontalM2Antiempotramiento = parseFloat(
          areaM2.toFixed(4),
        );
      }
    }
  }

  onMetricaChange(mod: any) {
    this.syncAreaResistenteByMetrica(mod);
    this.syncCalidadByMetrica(mod);
  }

  onDiametroTornilloChange(mod: any) {
    if (!mod) return;
    const tornillo = this.getTornilloSeleccionado(
      mod.diametroTornilloSeleccionado,
    );
    mod.areaResistenteTornilloSeleccionado = tornillo?.areaResistente ?? null;
  }

  private getAreaResistenteByMetrica(metrica: any): number | null {
    if (metrica === null || metrica === undefined || metrica === '')
      return null;
    const metricaNum = Number(metrica);
    if (Number.isNaN(metricaNum)) return null;
    const area = this.metricasAs[metricaNum];
    return typeof area === 'number' ? area : null;
  }

  private syncAreaResistenteByMetrica(mod: any) {
    if (!mod) return;

    const metricToAreaMap: Array<{ metricaKey: string; areaKey: string }> = [
      { metricaKey: 'metricaTalonera', areaKey: 'seccionResistenteAsEstribos' },
      { metricaKey: 'metricaPeldanos', areaKey: 'seccionResistenteAsPeldanos' },
      { metricaKey: 'metricaToldo', areaKey: 'seccionResistenteAsToldo' },
      {
        metricaKey: 'metricaParaTrasero',
        areaKey: 'seccionResistenteAsParagolpesTrasero',
      },
      {
        metricaKey: 'metricaLucesEspecificas',
        areaKey: 'seccionResistenteAsLucesEspecificas',
      },
      {
        metricaKey: 'metricaLargoAlcance',
        areaKey: 'seccionResistenteAsLargoAlcance',
      },
      { metricaKey: 'metricaSnorkel', areaKey: 'seccionResistenteAsSnorkel' },
      {
        metricaKey: 'metricaLipDelantero',
        areaKey: 'seccionResistenteAsLipDelantero',
      },
      { metricaKey: 'metricaDifusor', areaKey: 'seccionResistenteAsDifusor' },
      { metricaKey: 'metricaBarras', areaKey: 'seccionResistenteAsBarras' },
      {
        metricaKey: 'metricaParaDelantero',
        areaKey: 'seccionResistenteAsParagolpesDelantero',
      },
      {
        metricaKey: 'metricaAntiempotramiento',
        areaKey: 'seccionResistenteAsAntiempotramiento',
      },
      { metricaKey: 'metricaAletines', areaKey: 'seccionResistenteAsAletines' },
      { metricaKey: 'metricaAleron', areaKey: 'seccionResistenteAsAleron' },
    ];

    metricToAreaMap.forEach(({ metricaKey, areaKey }) => {
      const area = this.getAreaResistenteByMetrica(mod[metricaKey]);
      if (area != null) {
        mod[areaKey] = area;
      }
    });
  }

  private ensureSnorkelDefaults(mod: any): void {
    if (!mod) return;

    if (mod.curvaturaSnorkel == null) mod.curvaturaSnorkel = 8;
    if (mod.cwCoefAerodinamicoSnorkel == null)
      mod.cwCoefAerodinamicoSnorkel = 0.82;
    if (mod.densidadAireKgM3Snorkel == null) mod.densidadAireKgM3Snorkel = 1.29;
    if (mod.velocidadAireV2msSnorkel == null)
      mod.velocidadAireV2msSnorkel = 38.89;
    if (mod.coefSeguridadKSnorkel == null) mod.coefSeguridadKSnorkel = 3;

    if (mod.resTraccionMinTornillo88Kgmm2Snorkel == null) {
      mod.resTraccionMinTornillo88Kgmm2Snorkel = 80;
    }

    if (mod.seccionResistenteAsSnorkel == null) {
      mod.seccionResistenteAsSnorkel =
        this.getAreaResistenteByMetrica(mod.metricaSnorkel) ?? 36.64;
    }

    if (
      mod.medidasSnorkel &&
      (mod.anchuraPiezaMSnorkel == null || mod.alturaPiezaMSnorkel == null)
    ) {
      this.onDimensionesChange(
        mod,
        'medidasSnorkel',
        'anchuraPiezaMSnorkel',
        'alturaPiezaMSnorkel',
      );
    }

    this.syncCalidadByMetrica(mod);
  }

  private ensureLipDelanteroDefaults(mod: any): void {
    if (!mod) return;

    if (
      mod.medidasLipDelantero &&
      (
        mod.anchuraPiezaMLipDelantero == null ||
        mod.alturaPiezaMLipDelantero == null
      )
    ) {
      this.onDimensionesChange(
        mod,
        'medidasLipDelantero',
        'anchuraPiezaMLipDelantero',
        'alturaPiezaMLipDelantero',
      );
    }

    if (mod.radioCurvaRLipDelantero == null) mod.radioCurvaRLipDelantero = 8;
    if (mod.cwCoefAerodinamicoLipDelantero == null)
      mod.cwCoefAerodinamicoLipDelantero = 0.82;
    if (mod.densidadAireKgM3LipDelantero == null)
      mod.densidadAireKgM3LipDelantero = 1.29;
    if (mod.velocidadAireV2msLipDelantero == null)
      mod.velocidadAireV2msLipDelantero = 38.89;
    if (mod.coefSeguridadKLipDelantero == null)
      mod.coefSeguridadKLipDelantero = 3;

    if (mod.resTraccionMinTornillo88Kgmm2LipDelantero == null) {
      mod.resTraccionMinTornillo88Kgmm2LipDelantero = 80;
    }

    if (mod.seccionResistenteAsLipDelantero == null) {
      mod.seccionResistenteAsLipDelantero =
        this.getAreaResistenteByMetrica(mod.metricaLipDelantero) ?? 36.64;
    }

    this.syncCalidadByMetrica(mod);
  }

  private syncDifusorDimensions(mod: any): void {
    if (!mod) return;

    const anchuraMm = this.toNumberOrNull(mod.largoDifusor);
    const alturaMm = this.toNumberOrNull(mod.altoDifusor);

    if (anchuraMm == null && alturaMm == null) {
      return;
    }

    mod.anchuraPiezaMDifusor =
      anchuraMm == null ? null : Number((anchuraMm / 1000).toFixed(4));
    mod.alturaPiezaMDifusor =
      alturaMm == null ? null : Number((alturaMm / 1000).toFixed(4));
  }

  onDifusorDimensionsChange(mod: any): void {
    this.syncDifusorDimensions(mod);
  }

  private ensureDifusorDefaults(mod: any): void {
    if (!mod) return;

    this.syncDifusorDimensions(mod);

    if (mod.radioCurvaRDifusor == null) mod.radioCurvaRDifusor = 8;
    if (mod.cwCoefAerodinamicoDifusor == null)
      mod.cwCoefAerodinamicoDifusor = 0.82;
    if (mod.densidadAireKgM3Difusor == null) mod.densidadAireKgM3Difusor = 1.29;
    if (mod.velocidadAireV2msDifusor == null)
      mod.velocidadAireV2msDifusor = 38.89;
    if (mod.coefSeguridadKDifusor == null) mod.coefSeguridadKDifusor = 3;

    if (mod.resTraccionMinTornillo88Kgmm2Difusor == null) {
      mod.resTraccionMinTornillo88Kgmm2Difusor = 80;
    }

    if (mod.seccionResistenteAsDifusor == null) {
      mod.seccionResistenteAsDifusor =
        this.getAreaResistenteByMetrica(mod.metricaDifusor) ?? 36.64;
    }

    this.syncCalidadByMetrica(mod);
  }

  private ensureBarrasAntivuelcoDefaults(mod: any): void {
    if (!mod) return;

    if (
      mod.medidasBarras &&
      (mod.anchuraPiezaMBarras == null || mod.alturaPiezaMBarras == null)
    ) {
      this.onDimensionesChange(
        mod,
        'medidasBarras',
        'anchuraPiezaMBarras',
        'alturaPiezaMBarras',
      );
    }

    if (mod.curvaturaBarras == null) mod.curvaturaBarras = 8;
    if (mod.cwCoefAerodinamicoBarras == null) mod.cwCoefAerodinamicoBarras = 0.82;
    if (mod.densidadAireKgM3Barras == null) mod.densidadAireKgM3Barras = 1.29;
    if (mod.velocidadAireV2msBarras == null) mod.velocidadAireV2msBarras = 38.89;
    if (mod.coefSeguridadKBarras == null) mod.coefSeguridadKBarras = 3;

    if (mod.resTraccionMinTornillo88Kgmm2Barras == null) {
      mod.resTraccionMinTornillo88Kgmm2Barras = 80;
    }

    if (mod.seccionResistenteAsBarras == null) {
      mod.seccionResistenteAsBarras =
        this.getAreaResistenteByMetrica(mod.metricaBarras) ?? 36.64;
    }

    this.syncCalidadByMetrica(mod);
  }

  private ensureLargoAlcanceDefaults(mod: any): void {
    if (!mod) return;

    if (mod.curvaturaLargoAlcance == null) mod.curvaturaLargoAlcance = 8;
    if (mod.cwCoefAerodinamicoLargoAlcance == null)
      mod.cwCoefAerodinamicoLargoAlcance = 0.82;
    if (mod.densidadAireKgM3LargoAlcance == null)
      mod.densidadAireKgM3LargoAlcance = 1.29;
    if (mod.velocidadAireV2msLargoAlcance == null)
      mod.velocidadAireV2msLargoAlcance = 38.89;
    if (mod.coefSeguridadKLargoAlcance == null)
      mod.coefSeguridadKLargoAlcance = 3;

    if (mod.resTraccionMinTornillo88Kgmm2LargoAlcance == null) {
      mod.resTraccionMinTornillo88Kgmm2LargoAlcance = 80;
    }

    if (mod.seccionResistenteAsLargoAlcance == null) {
      mod.seccionResistenteAsLargoAlcance =
        this.getAreaResistenteByMetrica(mod.metricaLargoAlcance) ?? 36.64;
    }

    if (
      mod.medidasLargoAlcance &&
      (
        mod.anchuraPiezaMLargoAlcance == null ||
        mod.alturaPiezaMLargoAlcance == null
      )
    ) {
      this.onDimensionesChange(
        mod,
        'medidasLargoAlcance',
        'anchuraPiezaMLargoAlcance',
        'alturaPiezaMLargoAlcance',
      );
    }

    this.syncCalidadByMetrica(mod);
  }

  calcularSuperficieAletines(mod: any): void {
    if (mod.anchoAletines != null && mod.altoAletines != null) {
      const ancho = Number(mod.anchoAletines) / 1000;
      const alto = Number(mod.altoAletines) / 1000;
      mod.superficieFrontalM2Aletines = Number((ancho * alto).toFixed(4));
    } else {
      mod.superficieFrontalM2Aletines = null;
    }
  }

  private syncCalidadByMetrica(mod: any): void {
    if (!mod) return;

    const configs: Array<{
      nombre: string;
      metricaKey: string;
      calidadKey: string;
    }> = [
      {
        nombre: 'SNORKEL',
        metricaKey: 'metricaSnorkel',
        calidadKey: 'calidadTornilloSnorkel',
      },
      {
        nombre: 'LUCES DE LARGO ALCANCE',
        metricaKey: 'metricaLargoAlcance',
        calidadKey: 'calidadTornilloLargoAlcance',
      },
      {
        nombre: 'LIP DELANTERO',
        metricaKey: 'metricaLipDelantero',
        calidadKey: 'calidadTornilloLipDelantero',
      },
      {
        nombre: 'DIFUSOR TRASERO',
        metricaKey: 'metricaDifusor',
        calidadKey: 'calidadTornilloDifusor',
      },
      {
        nombre: 'BARRAS ANTIVUELCO',
        metricaKey: 'metricaBarras',
        calidadKey: 'calidadTornilloBarras',
      },
      {
        nombre: 'PELDAÑOS',
        metricaKey: 'metricaPeldanos',
        calidadKey: 'calidadTornilloPeldanos',
      },
      {
        nombre: 'PARAGOLPES DELANTERO',
        metricaKey: 'metricaParaDelantero',
        calidadKey: 'calidadTornilloParagolpesDelantero',
      },
      {
        nombre: 'ANTIEMPOTRAMIENTO',
        metricaKey: 'metricaAntiempotramiento',
        calidadKey: 'calidadTornilloAntiempotramiento',
      },
      {
        nombre: 'TOLDO',
        metricaKey: 'metricaToldo',
        calidadKey: 'calidadTornilloToldo',
      },
      {
        nombre: 'DEFENSA DELANTERA',
        metricaKey: 'metricaToldo',
        calidadKey: 'calidadTornilloToldo',
      },
    ];

    const config = configs.find((item) => item.nombre === mod.nombre);
    if (!config) return;

    const metrica = mod[config.metricaKey];
    if (metrica === undefined || metrica === null || metrica === '') {
      if (mod[config.calidadKey] == null) {
        mod[config.calidadKey] = 8.8;
      }
      return;
    }

    const calidad = this.getCalidadTornilloByMetrica(metrica);
    mod[config.calidadKey] = calidad ?? 8.8;
  }

  private getCalidadTornilloByMetrica(metrica: any): number | null {
    const metricaNum = Number(metrica);
    if (Number.isNaN(metricaNum)) return null;

    const tornillo = this.getTornilloSeleccionado(metricaNum);
    if (tornillo?.calidad) {
      const parsed = Number.parseFloat(
        String(tornillo.calidad).replace(/[^0-9.]/g, ''),
      );

      if (Number.isFinite(parsed)) return parsed;
    }

    // Fallback por rango para métricas no incluidas en tornillosDB.
    // Así el campo "calidad" cambia al seleccionar otra métrica.

    return 8.8;
  }

  private toNumberOrNull(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  onMetricaParagolpesDelanteroChange(mod: any, value: unknown): void {
    if (!mod) return;
    mod.metricaParaDelantero = this.toNumberOrNull(value);
    this.onMetricaChange(mod);
  }

  onMetricaAntiempotramientoChange(mod: any, value: unknown): void {
    if (!mod) return;
    mod.metricaAntiempotramiento = this.toNumberOrNull(value);
    this.onMetricaChange(mod);
  }

  getTornilloSeleccionado(diametro: number | null) {
    if (!diametro) return null;
    return this.tornillosDB.find((t) => t.diametro === diametro) || null;
  }

  toggleAccion(mod: any, accion: string, checked: boolean) {
    if (!Array.isArray(mod.acciones)) {
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

  onDimensionesChange(
    mod: any,
    sourceKey: string,
    targetWidthKey: string,
    targetHeightKey: string,
  ) {
    const rawValue = mod[sourceKey];
    if (!rawValue || rawValue.trim() === '') {
      mod[targetWidthKey] = null;
      mod[targetHeightKey] = null;
      return;
    }
    const clean = rawValue.toLowerCase().replace('mm', '').trim();
    const parts = clean.split('x');
    const anchuraMm = parseFloat(parts[0]);
    mod[targetWidthKey] = !isNaN(anchuraMm) ? anchuraMm / 1000 : null;
    if (parts.length >= 2) {
      const alturaMm = parseFloat(parts[1]);
      mod[targetHeightKey] = !isNaN(alturaMm) ? alturaMm / 1000 : null;
    } else {
      mod[targetHeightKey] = null;
    }
  }

  onAerodynamicItemMetricaChange(item: any): void {
    if (!item) return;

    const area = this.getAreaResistenteByMetrica(item.metrica);
    item.seccionResistenteAs = area ?? item.seccionResistenteAs ?? 36.64;
    item.calidadTornillo = this.getCalidadTornilloByMetrica(item.metrica) ?? 8.8;
  }

  onPlacaAgrupacionChange(placa: any, checked: boolean): void {
    if (!placa) return;

    placa.agruparIguales = checked;
    if (!checked) {
      placa.cantidad = 1;
      return;
    }

    const cantidad = Math.trunc(Number(placa.cantidad));
    placa.cantidad = Number.isFinite(cantidad) && cantidad > 1 ? cantidad : 2;
  }

  private createMuebleItem(
    tipo: 'bajo' | 'alto' | 'aseo',
    initial: any = {},
  ): any {
    const incoming = { ...(this.unwrapSharedEntity(initial) || {}) };
    const item = this.unwrapSharedEntity(initial) || {};

    if (tipo === 'bajo') {
      const defaults = {
        cajones: 0,
        ubicacionMuebleBajo: '',
        configuracionMuebleBajo: '',
        pesoMuebleBajo: '',
        tornillosMuebleBajo: '',
        metricaTornillosMuebleBajo: null,
      };

      Object.assign(item, defaults, incoming);
      this.registrarCamposCompartidosPorDefecto(
        'muebleBajo',
        item,
        incoming,
        defaults,
      );
      this.aplicarValoresCompartidosEnEntidad('muebleBajo', item);
      return this.wrapEntidadCompartida('muebleBajo', item);
    }

    if (tipo === 'alto') {
      const defaults = {
        ubicacionMuebleAlto: '',
        configuracionMuebleAlto: '',
        pesoMuebleAlto: '',
        tornillosMuebleAlto: '',
        metricaTornillosMuebleAlto: null,
      };

      Object.assign(item, defaults, incoming);
      this.registrarCamposCompartidosPorDefecto(
        'muebleAlto',
        item,
        incoming,
        defaults,
      );
      this.aplicarValoresCompartidosEnEntidad('muebleAlto', item);
      return this.wrapEntidadCompartida('muebleAlto', item);
    }

    const defaults = {
      descripcion: '',
      configuracionMuebleAseo: '',
      pesoMuebleAseo: '',
      tornillosMuebleAseo: '',
      metricaTornillosMuebleAseo: null,
    };

    Object.assign(item, defaults, incoming);
    this.registrarCamposCompartidosPorDefecto(
      'muebleAseo',
      item,
      incoming,
      defaults,
    );
    this.aplicarValoresCompartidosEnEntidad('muebleAseo', item);
    return this.wrapEntidadCompartida('muebleAseo', item);
  }

  private createVentanaItem(initial: any = {}): any {
    const incoming = { ...(this.unwrapSharedEntity(initial) || {}) };
    const item = this.unwrapSharedEntity(initial) || {};
    const defaults = {
      homologacion: '',
      marca: '',
      modelo: '',
      dimensiones: '',
      descripcion: '',
    };

    Object.assign(item, defaults, incoming);
    this.registrarCamposCompartidosPorDefecto(
      'ventana',
      item,
      incoming,
      defaults,
    );
    this.aplicarValoresCompartidosEnEntidad('ventana', item);
    return this.wrapEntidadCompartida('ventana', item);
  }

  private createClaraboyaItem(initial: any = {}): any {
    const incoming = { ...(this.unwrapSharedEntity(initial) || {}) };
    const item = this.unwrapSharedEntity(initial) || {};
    const defaults = {
      marca: '',
      modelo: '',
      descripcion: '',
      homologacion: '',
      medidas: '',
      pesoPiezaKg: null,
      anchuraPiezaM: null,
      alturaPiezaM: null,
      metrica: null,
      nTornillos: null,
      calidadTornillo: 8.8,
      seccionResistenteAs: null,
      resTraccionMinTornillo88Kgmm2: 80,
      cwCoefAerodinamico: 0.82,
      densidadAireKgM3: 1.29,
      velocidadAireV2ms: 38.89,
      coefSeguridadK: 3,
      curvatura: 8,
    };
    Object.assign(item, defaults, incoming);

    this.registrarCamposCompartidosPorDefecto(
      'claraboya',
      item,
      incoming,
      defaults,
    );
    this.aplicarValoresCompartidosEnEntidad('claraboya', item);
    this.ensureAerodynamicItemDefaults(item, 'medidas');
    return this.wrapEntidadCompartida('claraboya', item);
  }

  private createPlacaSolarItem(initial: any = {}): any {
    const incoming = { ...(this.unwrapSharedEntity(initial) || {}) };
    const item = this.unwrapSharedEntity(initial) || {};
    const defaults = {
      marca: '',
      modelo: '',
      potencia: '',
      dimensiones: '',
      ubicacion: '',
      agruparIguales: false,
      cantidad: 1,
      pesoPiezaKg: null,
      anchuraPiezaM: null,
      alturaPiezaM: null,
      metrica: null,
      nTornillos: null,
      calidadTornillo: 8.8,
      seccionResistenteAs: null,
      resTraccionMinTornillo88Kgmm2: 80,
      cwCoefAerodinamico: 0.82,
      densidadAireKgM3: 1.29,
      velocidadAireV2ms: 38.89,
      coefSeguridadK: 3,
      curvatura: 8,
    };
    Object.assign(item, defaults, incoming);

    item.agruparIguales = !!item.agruparIguales;
    const cantidad = Math.trunc(Number(item.cantidad));
    item.cantidad =
      item.agruparIguales && Number.isFinite(cantidad) && cantidad > 1
        ? cantidad
        : 1;

    this.registrarCamposCompartidosPorDefecto(
      'placaSolar',
      item,
      incoming,
      defaults,
    );
    this.aplicarValoresCompartidosEnEntidad('placaSolar', item);
    this.ensureAerodynamicItemDefaults(item, 'dimensiones');
    return this.wrapEntidadCompartida('placaSolar', item);
  }

  private createReformaAdicionalItem(initial: any = {}): any {
    const incoming = { ...(this.unwrapSharedEntity(initial) || {}) };
    const item = this.unwrapSharedEntity(initial) || {};
    const defaults = {
      titulo: '',
      descripcion: '',
      curvatura: null,
    };
    Object.assign(item, defaults, incoming);

    this.registrarCamposCompartidosPorDefecto(
      'reformaAdicional',
      item,
      incoming,
      defaults,
    );
    this.aplicarValoresCompartidosEnEntidad('reformaAdicional', item);
    return this.wrapEntidadCompartida('reformaAdicional', item);
  }

  private ensureClaraboyaDefaults(mod: any): void {
    if (!Array.isArray(mod.claraboyas)) {
      mod.claraboyas = [];
    }

    if (mod.claraboyas.length === 0) {
      const hasLegacy =
        mod.marcaClaraboya ||
        mod.modeloClaraboya ||
        mod.descripcionClaraboya ||
        mod.homologacionClaraboya ||
        mod.cantidadClaraboya;

      if (hasLegacy) {
        mod.claraboyas.push(
          this.createClaraboyaItem({
            marca: mod.marcaClaraboya ?? '',
            modelo: mod.modeloClaraboya ?? '',
            descripcion: mod.descripcionClaraboya ?? '',
            homologacion: mod.homologacionClaraboya ?? '',
          }),
        );
      }
    }

    mod.claraboyas = mod.claraboyas.map((item: any) =>
      this.createClaraboyaItem(item),
    );
  }

  private ensureVentanaDefaults(mod: any): void {
    if (!Array.isArray(mod.ventanas)) {
      mod.ventanas = [];
    }

    if (mod.ventanas.length === 0) {
      const hasLegacy =
        mod.descripcionVentana ||
        mod.marcaVentana ||
        mod.modeloVentana ||
        mod.dimensionesVentana ||
        mod.homologacionVentana ||
        mod.cantidadVentanas;

      if (hasLegacy) {
        mod.ventanas.push(
          this.createVentanaItem({
            descripcion: mod.descripcionVentana ?? '',
            marca: mod.marcaVentana ?? '',
            modelo: mod.modeloVentana ?? '',
            dimensiones: mod.dimensionesVentana ?? '',
            homologacion: mod.homologacionVentana ?? '',
          }),
        );
      }
    }

    mod.ventanas = mod.ventanas.map((item: any) =>
      this.createVentanaItem(item),
    );
  }

  private ensureInstalacionElectricaDefaults(mod: any): void {
    if (!Array.isArray(mod.placasSolares)) {
      mod.placasSolares = [];
    }

    mod.placasSolares = mod.placasSolares.map((item: any) =>
      this.createPlacaSolarItem(item),
    );
  }

  private ensureIntermitentesDefaults(mod: any): void {
    if (!mod) return;

    if (!mod.detalle) {
      mod.detalle = {
        interDelantero: false,
        interTrasero: false,
        interLateral: false,
      };
    }

    const syncLegacyFields = (
      enabled: boolean,
      marcajeKey: string,
      homologacionKey: string,
    ) => {
      if (!enabled) return;

      if (!mod[marcajeKey] && mod.marcajeIntermitentes) {
        mod[marcajeKey] = mod.marcajeIntermitentes;
      }

      if (!mod[homologacionKey] && mod.homologacionIntermitentes) {
        mod[homologacionKey] = mod.homologacionIntermitentes;
      }
    };

    syncLegacyFields(
      !!mod.detalle?.interDelantero,
      'marcajesintermitenteDelantero',
      'homologacionintermitenteDelantero',
    );
    syncLegacyFields(
      !!mod.detalle?.interTrasero,
      'marcajesintermitenteTrasero',
      'homologacionintermitenteTrasero',
    );
    syncLegacyFields(
      !!mod.detalle?.interLateral,
      'marcajesintermitenteLateral',
      'homologacionintermitenteLateral',
    );
  }

  private ensureToldoDefaults(mod: any): void {
    if (mod.metricaToldo == null && mod.metrica != null) {
      mod.metricaToldo = this.toNumberOrNull(mod.metrica);
    }

    if (mod.nTornillosToldo == null && mod.nTornillos != null) {
      mod.nTornillosToldo = this.toNumberOrNull(mod.nTornillos);
    }

    if (mod.curvaturaToldo == null) mod.curvaturaToldo = 8;
    if (mod.cwCoefAerodinamicoToldo == null) mod.cwCoefAerodinamicoToldo = 0.82;
    if (mod.densidadAireKgM3Toldo == null) mod.densidadAireKgM3Toldo = 1.29;
    if (mod.velocidadAireV2msToldo == null) mod.velocidadAireV2msToldo = 38.89;
    if (mod.coefSeguridadKToldo == null) mod.coefSeguridadKToldo = 3;

    if (mod.resTraccionMinTornillo88Kgmm2Toldo == null) {
      mod.resTraccionMinTornillo88Kgmm2Toldo = 80;
    }

    if (mod.seccionResistenteAsToldo == null) {
      mod.seccionResistenteAsToldo =
        this.getAreaResistenteByMetrica(mod.metricaToldo) ?? 36.64;
    }

    if (
      mod.medidasToldo &&
      (mod.anchuraPiezaMToldo == null || mod.alturaPiezaMToldo == null)
    ) {
      this.onDimensionesChange(
        mod,
        'medidasToldo',
        'anchuraPiezaMToldo',
        'alturaPiezaMToldo',
      );
    }

    this.syncCalidadByMetrica(mod);
  }

  private ensurePeldanosDefaults(mod: any): void {
    if (!mod) return;

    if (!mod.metodoActuacionPeldanos) {
      mod.metodoActuacionPeldanos = 'manual';
    }
    if (mod.ubicacionAccionamientoPeldanos === undefined) {
      mod.ubicacionAccionamientoPeldanos = '';
    }
    if (mod.referenciaPeldanos === undefined) {
      mod.referenciaPeldanos = '';
    }
    if (mod.marcaPeldano === undefined) {
      mod.marcaPeldano = '';
    }
    if (mod.tipoFabricacionPeldanos == null) {
      mod.tipoFabricacionPeldanos =
        mod.marcaPeldano || mod.referenciaPeldanos ? 'marcaReferencia' : null;
    }
    if (mod.radioCurvaRPeldanos == null) {
      mod.radioCurvaRPeldanos = 8;
    }
    if (mod.coefAerodinamicoPeldanos == null) {
      mod.coefAerodinamicoPeldanos = 0.82;
    }
    if (mod.densidadAireKgM3Peldanos == null) {
      mod.densidadAireKgM3Peldanos = 1.29;
    }
    if (mod.velocidadAireV2msPeldanos == null) {
      mod.velocidadAireV2msPeldanos = 38.89;
    }
    if (mod.coefSeguridadKPeldanos == null) {
      mod.coefSeguridadKPeldanos = 3;
    }
    if (mod.resTraccionMinTornillo88Kgmm2Peldanos == null) {
      mod.resTraccionMinTornillo88Kgmm2Peldanos = 80;
    }
    if (mod.metricaPeldanos == null && mod.metricaTalonera != null) {
      mod.metricaPeldanos = this.toNumberOrNull(mod.metricaTalonera);
    }
    if (mod.seccionResistenteAsPeldanos == null) {
      mod.seccionResistenteAsPeldanos =
        this.getAreaResistenteByMetrica(mod.metricaPeldanos) ?? 36.64;
    }

    if (
      mod.medidasPeldano &&
      (mod.anchuraPiezaMPeldanos == null || mod.alturaPiezaMPeldanos == null)
    ) {
      this.onDimensionesChange(
        mod,
        'medidasPeldano',
        'anchuraPiezaMPeldanos',
        'alturaPiezaMPeldanos',
      );
    }

    this.syncCalidadByMetrica(mod);
  }

  private ensureDefensaDelanteraDefaults(mod: any): void {
    if (!mod) return;

    if (mod.metricaToldo == null && mod.metrica != null) {
      mod.metricaToldo = this.toNumberOrNull(mod.metrica);
    }

    if (mod.curvaturaDefensaDelantera == null) mod.curvaturaDefensaDelantera = 8;
    if (mod.cwCoefAerodinamicoToldo == null) mod.cwCoefAerodinamicoToldo = 0.82;
    if (mod.densidadAireKgM3Toldo == null) mod.densidadAireKgM3Toldo = 1.29;
    if (mod.velocidadAireV2msToldo == null) mod.velocidadAireV2msToldo = 38.89;
    if (mod.coefSeguridadKToldo == null) mod.coefSeguridadKToldo = 3;

    if (mod.resTraccionMinTornillo88Kgmm2Toldo == null) {
      mod.resTraccionMinTornillo88Kgmm2Toldo = 80;
    }

    if (mod.seccionResistenteAsToldo == null) {
      mod.seccionResistenteAsToldo =
        this.getAreaResistenteByMetrica(mod.metricaToldo) ?? 36.64;
    }

    if (
      mod.medidasDefensa &&
      (mod.anchuraPiezaM == null || mod.alturaPiezaM == null)
    ) {
      this.onDimensionesChange(
        mod,
        'medidasDefensa',
        'anchuraPiezaM',
        'alturaPiezaM',
      );
    }

    if (!Array.isArray(mod.acciones) || mod.acciones.length === 0) {
      mod.acciones = ['Instalación'];
    }

    this.syncCalidadByMetrica(mod);
  }

  private ensureAerodynamicItemDefaults(item: any, sourceKey: string): void {
    if (!item) return;

    if (item.curvatura == null) item.curvatura = 8;
    if (item.cwCoefAerodinamico == null) item.cwCoefAerodinamico = 0.82;
    if (item.densidadAireKgM3 == null) item.densidadAireKgM3 = 1.29;
    if (item.velocidadAireV2ms == null) item.velocidadAireV2ms = 38.89;
    if (item.coefSeguridadK == null) item.coefSeguridadK = 3;

    if (item.resTraccionMinTornillo88Kgmm2 == null) {
      item.resTraccionMinTornillo88Kgmm2 = 80;
    }

    if (item.seccionResistenteAs == null) {
      item.seccionResistenteAs =
        this.getAreaResistenteByMetrica(item.metrica) ?? 36.64;
    }

    if (
      sourceKey &&
      item[sourceKey] &&
      (item.anchuraPiezaM == null || item.alturaPiezaM == null)
    ) {
      this.onDimensionesChange(
        item,
        sourceKey,
        'anchuraPiezaM',
        'alturaPiezaM',
      );
    }

    this.onAerodynamicItemMetricaChange(item);
  }

  private parseRefuerzoUbicaciones(
    ubicacionRefuerzo: unknown,
  ): Set<'delantero' | 'trasero'> {
    const normalized =
      typeof ubicacionRefuerzo === 'string'
        ? ubicacionRefuerzo.toLowerCase()
        : '';

    const ubicaciones = new Set<'delantero' | 'trasero'>();

    if (normalized.includes('delanter')) {
      ubicaciones.add('delantero');
    }

    if (normalized.includes('traser') || normalized.includes('detr')) {
      ubicaciones.add('trasero');
    }

    return ubicaciones;
  }

  private syncRefuerzoLegacyData(mod: any): void {
    const hasDelantero = this.isRefuerzoUbicacionSelected(mod, 'delantero');
    const hasTrasero = this.isRefuerzoUbicacionSelected(mod, 'trasero');

    if (hasDelantero) {
      this.copyRefuerzoLegacyFields(mod, 'delantero');
    }

    if (hasTrasero) {
      this.copyRefuerzoLegacyFields(mod, 'trasero');
    }
  }

  private copyRefuerzoLegacyFields(
    mod: any,
    ubicacion: 'delantero' | 'trasero',
  ): void {
    const suffix = ubicacion === 'delantero' ? 'Delantero' : 'Trasero';
    const map = [
      ['marcaRefuerzo', `marcaRefuerzo${suffix}`],
      ['referenciaRefuerzo', `referenciaRefuerzo${suffix}`],
      ['materialRefuerzo', `materialRefuerzo${suffix}`],
      ['largoRefuerzo', `largoRefuerzo${suffix}`],
      ['altoRefuerzo', `altoRefuerzo${suffix}`],
      ['fondoRefuerzo', `fondoRefuerzo${suffix}`],
    ] as const;

    map.forEach(([legacyKey, targetKey]) => {
      const targetValue = mod?.[targetKey];
      const isTargetEmpty =
        targetValue === undefined || targetValue === null || targetValue === '';

      if (isTargetEmpty) {
        mod[targetKey] = mod?.[legacyKey];
      }
    });
  }

  isRefuerzoUbicacionSelected(
    mod: any,
    ubicacion: 'delantero' | 'trasero',
  ): boolean {
    return this.parseRefuerzoUbicaciones(mod?.ubicacionRefuerzo).has(ubicacion);
  }

  onRefuerzoUbicacionToggle(
    mod: any,
    ubicacion: 'delantero' | 'trasero',
    checked: boolean,
  ): void {
    const ubicaciones = this.parseRefuerzoUbicaciones(mod?.ubicacionRefuerzo);

    if (checked) {
      ubicaciones.add(ubicacion);
      this.copyRefuerzoLegacyFields(mod, ubicacion);
    } else {
      ubicaciones.delete(ubicacion);
    }

    if (ubicaciones.size === 2) {
      mod.ubicacionRefuerzo = 'delantero y trasero';
      return;
    }

    if (ubicaciones.has('delantero')) {
      mod.ubicacionRefuerzo = 'delantero';
      return;
    }

    if (ubicaciones.has('trasero')) {
      mod.ubicacionRefuerzo = 'trasero';
      return;
    }

    mod.ubicacionRefuerzo = undefined;
  }

  anadirMueble(mod: any, tipo: 'bajo' | 'alto' | 'aseo') {
    if (tipo === 'bajo') {
      mod.mueblesBajo = mod.mueblesBajo || [];
      mod.mueblesBajo.push(this.createMuebleItem('bajo'));
    }
    if (tipo === 'alto') {
      mod.mueblesAlto = mod.mueblesAlto || [];
      mod.mueblesAlto.push(this.createMuebleItem('alto'));
    }
    if (tipo === 'aseo') {
      mod.mueblesAseo = mod.mueblesAseo || [];
      mod.mueblesAseo.push(this.createMuebleItem('aseo'));
    }
    this.rebuildCamposCompartidos();
    this.formSubmitted = false;
  }

  anadirClaraboya(mod: any): void {
    if (!Array.isArray(mod.claraboyas)) {
      mod.claraboyas = [];
    }

    mod.claraboyas.push(this.createClaraboyaItem());
    this.rebuildCamposCompartidos();
    this.formSubmitted = false;
  }

  borrarClaraboya(mod: any, index: number): void {
    if (!Array.isArray(mod?.claraboyas)) return;
    if (index < 0 || index >= mod.claraboyas.length) return;
    mod.claraboyas.splice(index, 1);
    this.rebuildCamposCompartidos();
  }

  anadirVentana(mod: any): void {
    if (!Array.isArray(mod.ventanas)) {
      mod.ventanas = [];
    }

    mod.ventanas.push(this.createVentanaItem());
    this.rebuildCamposCompartidos();
    this.formSubmitted = false;
  }

  borrarVentana(mod: any, index: number): void {
    if (!Array.isArray(mod?.ventanas)) return;
    if (index < 0 || index >= mod.ventanas.length) return;
    mod.ventanas.splice(index, 1);
    this.rebuildCamposCompartidos();
  }

  anadirPlacaSolar(mod: any): void {
    if (!Array.isArray(mod.placasSolares)) {
      mod.placasSolares = [];
    }

    mod.placasSolares.push(this.createPlacaSolarItem());
    this.rebuildCamposCompartidos();
    this.formSubmitted = false;
  }

  borrarPlacaSolar(mod: any, index: number): void {
    if (!Array.isArray(mod?.placasSolares)) return;
    if (index < 0 || index >= mod.placasSolares.length) return;
    mod.placasSolares.splice(index, 1);
    this.rebuildCamposCompartidos();
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
    this.rebuildCamposCompartidos();
  }

  anadirReformaAdicional(mod: any): void {
    if (!Array.isArray(mod.reformasAdicionalesItems)) {
      mod.reformasAdicionalesItems = [];
    }
    mod.reformasAdicionalesItems.push(this.createReformaAdicionalItem());
    this.rebuildCamposCompartidos();
    this.formSubmitted = false;
  }

  borrarReformaAdicional(mod: any, index: number): void {
    if (!Array.isArray(mod?.reformasAdicionalesItems)) return;
    if (index < 0 || index >= mod.reformasAdicionalesItems.length) return;
    mod.reformasAdicionalesItems.splice(index, 1);
    this.rebuildCamposCompartidos();
  }

  private detachSharedProxies(): void {
    this.modificacionesSeleccionadas.forEach((mod) => {
      if (Array.isArray(mod.claraboyas)) {
        mod.claraboyas = mod.claraboyas.map((item: any) =>
          this.unwrapSharedEntity(item),
        );
      }

      if (Array.isArray(mod.ventanas)) {
        mod.ventanas = mod.ventanas.map((item: any) =>
          this.unwrapSharedEntity(item),
        );
      }

      if (Array.isArray(mod.placasSolares)) {
        mod.placasSolares = mod.placasSolares.map((item: any) =>
          this.unwrapSharedEntity(item),
        );
      }

      if (Array.isArray(mod.mueblesBajo)) {
        mod.mueblesBajo = mod.mueblesBajo.map((item: any) =>
          this.unwrapSharedEntity(item),
        );
      }

      if (Array.isArray(mod.mueblesAlto)) {
        mod.mueblesAlto = mod.mueblesAlto.map((item: any) =>
          this.unwrapSharedEntity(item),
        );
      }

      if (Array.isArray(mod.mueblesAseo)) {
        mod.mueblesAseo = mod.mueblesAseo.map((item: any) =>
          this.unwrapSharedEntity(item),
        );
      }

      if (Array.isArray(mod.reformasAdicionalesItems)) {
        mod.reformasAdicionalesItems = mod.reformasAdicionalesItems.map(
          (item: any) => this.unwrapSharedEntity(item),
        );
      }
    });
  }

  formularioInvalido(): boolean {
    return this.modificacionesSeleccionadas.some((mod) => {
      if (
        mod.nombre === 'DISCO DE FRENO Y PINZA DE FRENO' &&
        mod.seleccionado
      ) {
        return !mod.tieneDisco && !mod.tienePastilla;
      }

      if (mod.nombre === 'REFUERZO PARAGOLPES' && mod.seleccionado) {
        const hasDelantero = this.isRefuerzoUbicacionSelected(mod, 'delantero');
        const hasTrasero = this.isRefuerzoUbicacionSelected(mod, 'trasero');

        if (!hasDelantero && !hasTrasero) {
          return true;
        }

        if (
          hasDelantero &&
          (!mod.marcaRefuerzoDelantero ||
            !mod.referenciaRefuerzoDelantero ||
            !mod.materialRefuerzoDelantero ||
            mod.largoRefuerzoDelantero == null ||
            mod.altoRefuerzoDelantero == null ||
            mod.fondoRefuerzoDelantero == null)
        ) {
          return true;
        }

        if (
          hasTrasero &&
          (!mod.marcaRefuerzoTrasero ||
            !mod.referenciaRefuerzoTrasero ||
            !mod.materialRefuerzoTrasero ||
            mod.largoRefuerzoTrasero == null ||
            mod.altoRefuerzoTrasero == null ||
            mod.fondoRefuerzoTrasero == null)
        ) {
          return true;
        }
      }

      if (mod.nombre === 'CLARABOYA' && mod.seleccionado) {
        if (!Array.isArray(mod.claraboyas) || mod.claraboyas.length === 0) {
          return true;
        }
      }

      if (mod.nombre === 'VENTANA' && mod.seleccionado) {
        if (!Array.isArray(mod.ventanas) || mod.ventanas.length === 0) {
          return true;
        }
      }

      if (
        mod.nombre ===
          'TODA LA CASUÍSTICA DE MUELLES, BALLESTAS Y AMORTIGUADORES QUE SE PUEDEN DAR' &&
        mod.seleccionado
      ) {
        if (this.hasTacosDeGomaErrors(mod) || this.hasKitElevacionErrors(mod)) {
          return true;
        }
      }

      return false;
    });
  }

  onVolver(): void {
    this.detachSharedProxies();
    this.volver.emit(this.datosEntrada);
  }

  onContinuar(form: NgForm): void {
    this.formSubmitted = true;

    if (form.invalid || this.formularioInvalido()) {
      return;
    }

    // --- CORRECCIÓN: Mapeo de datos si es SOLO TRASEROS ---
    this.modificacionesSeleccionadas.forEach((mod) => {
      if (mod.nombre === 'CABRESTANTE') {
        mod.diametroPernoCmCabrestante =
          this.toNumberOrNull(mod.diametroPernoCmCabrestante) ?? 1;
      }

      if (
        mod.nombre === 'ANTIEMPOTRAMIENTO' &&
        mod.nTornillosAntiempotramiento != null
      ) {
        mod.nTornillos = mod.nTornillosAntiempotramiento;
      }

      if (
        mod.nombre === 'SUSTITUCIÓN DE DISCOS DE FRENO' &&
        mod.ubicacionDiscos === 'traseros'
      ) {
        // Pasamos los datos que el usuario escribió en los campos "generales"
        // a las variables "traseras" que espera el sistema.

        // 1. Datos Identificativos
        mod.marcaDiscoTrasero = mod.marcaDiscos;
        mod.modeloDiscoTrasero = mod.modeloDiscos;
        mod.referenciaDiscoTrasero = mod.referenciaDiscos;
        mod.diametroDiscoTrasero = mod.diametroDiscos;
        mod.espesorDiscoTrasero = mod.espesorDiscos;

        // 2. Datos Técnicos
        mod.numDiscosTrasero = mod.numDiscosDelantero;
        mod.numPinzasTraseras = mod.numPinzasDelanteras;
        mod.diametroExteriorDiscoTrasero = mod.diametroExteriorDiscos;
        mod.diametroInteriorDiscoTrasero = mod.diametroInteriorDiscos;
        mod.diametroBombaDiscoTrasero = mod.diametroBombaDiscos;
        mod.dimensionPistonDiscoTrasero = mod.dimensionPistonDiscos;
        mod.numPistonesDiscoTrasero = mod.numPistonesDiscos;
        mod.anguloContactoDiscoTrasero = mod.anguloContactoDiscos;

        // 3. Datos Neumáticos (Campos Extra)
        mod.radioNeumaticoDiscoTrasero = mod.radioNeumaticoDiscos;
        mod.anchoNeumaticoDiscoTrasero = mod.anchoNeumaticoDiscos;
        mod.perfilNeumaticoDiscoTrasero = mod.perfilNeumaticoDiscos;
      }

      if (mod.nombre === 'SUSTITUCIÃ“N DE DISCOS DE FRENO') {
        if (mod.ubicacionDiscos === 'traseros' && mod.modificaPinzasDiscos !== false) {
          mod.numPinzasTraseras = mod.numPinzasDelanteras;
        }
      }

      if (mod.nombre === 'CAMPO LIBRE SOBRE REFORMAS NO EXISTENTES') {
        const lines: string[] = [];
        if (Array.isArray(mod.reformasAdicionalesItems)) {
          mod.reformasAdicionalesItems = mod.reformasAdicionalesItems.map(
            (item: any) => {
              const normalizedItem = this.createReformaAdicionalItem(item);
              normalizedItem.curvatura = this.toNumberOrNull(
                normalizedItem.curvatura,
              );
              return normalizedItem;
            },
          );

          mod.reformasAdicionalesItems.forEach((item: any) => {
            const descripcion = (item?.descripcion ?? '').toString();
            descripcion
              .split(/\r?\n/)
              .map((line: string) => line.trim())
              .filter((line: string) => line.length > 0)
              .forEach((line: string) => lines.push(line));
          });
        }
        mod.reformasAdicionales = lines.join('\n');
      }

      if (mod.nombre === 'BARRAS ANTIVUELCO') {
        mod.metricaBarras = this.toNumberOrNull(mod.metricaBarras);
        mod.nTornillosBarras = this.toNumberOrNull(mod.nTornillosBarras);
        mod.pesoPiezaKgBarras = this.toNumberOrNull(mod.pesoPiezaKgBarras);
        mod.anchuraPiezaMBarras = this.toNumberOrNull(mod.anchuraPiezaMBarras);
        mod.alturaPiezaMBarras = this.toNumberOrNull(mod.alturaPiezaMBarras);
        mod.curvaturaBarras = this.toNumberOrNull(mod.curvaturaBarras) ?? 8;
        this.ensureBarrasAntivuelcoDefaults(mod);
      }

      if (mod.nombre === 'LIP DELANTERO') {
        mod.metricaLipDelantero = this.toNumberOrNull(mod.metricaLipDelantero);
        mod.nTornillosLipDelantero = this.toNumberOrNull(mod.nTornillosLipDelantero);
        mod.pesoPiezaKgLipDelantero = this.toNumberOrNull(mod.pesoPiezaKgLipDelantero);
        mod.anchuraPiezaMLipDelantero = this.toNumberOrNull(
          mod.anchuraPiezaMLipDelantero,
        );
        mod.alturaPiezaMLipDelantero = this.toNumberOrNull(
          mod.alturaPiezaMLipDelantero,
        );
        mod.radioCurvaRLipDelantero =
          this.toNumberOrNull(mod.radioCurvaRLipDelantero) ?? 8;
        this.ensureLipDelanteroDefaults(mod);
      }

      if (mod.nombre === 'DIFUSOR TRASERO') {
        mod.largoDifusor = this.toNumberOrNull(mod.largoDifusor);
        mod.altoDifusor = this.toNumberOrNull(mod.altoDifusor);
        mod.metricaDifusor = this.toNumberOrNull(mod.metricaDifusor);
        mod.nTornillosDifusor = this.toNumberOrNull(mod.nTornillosDifusor);
        mod.pesoPiezaKgDifusor = this.toNumberOrNull(mod.pesoPiezaKgDifusor);
        mod.anchuraPiezaMDifusor = this.toNumberOrNull(mod.anchuraPiezaMDifusor);
        mod.alturaPiezaMDifusor = this.toNumberOrNull(mod.alturaPiezaMDifusor);
        mod.radioCurvaRDifusor = this.toNumberOrNull(mod.radioCurvaRDifusor) ?? 8;
        this.ensureDifusorDefaults(mod);
      }

      if (mod.nombre === 'INSTALACIÓN ELÉCTRICA' && Array.isArray(mod.placasSolares)) {
        mod.placasSolares = mod.placasSolares.map((placa: any) =>
          this.createPlacaSolarItem(placa),
        );
      }

      if (mod.nombre === 'CLARABOYA' && Array.isArray(mod.claraboyas)) {
        mod.claraboyas = mod.claraboyas.map((item: any) =>
          this.createClaraboyaItem(item),
        );
      }

      if (mod.nombre === 'TOLDO') {
        mod.metricaToldo = this.toNumberOrNull(mod.metricaToldo ?? mod.metrica);
        mod.nTornillosToldo = this.toNumberOrNull(
          mod.nTornillosToldo ?? mod.nTornillos,
        );
      }

      if (mod.nombre === 'PELDAÑOS') {
        mod.metricaPeldanos = this.toNumberOrNull(mod.metricaPeldanos);
        mod.nTornillosPeldanos = this.toNumberOrNull(mod.nTornillosPeldanos);
        mod.pesoPiezaKgPeldanos = this.toNumberOrNull(mod.pesoPiezaKgPeldanos);
        mod.anchuraPiezaMPeldanos = this.toNumberOrNull(
          mod.anchuraPiezaMPeldanos,
        );
        mod.alturaPiezaMPeldanos = this.toNumberOrNull(mod.alturaPiezaMPeldanos);
        mod.radioCurvaRPeldanos = this.toNumberOrNull(mod.radioCurvaRPeldanos) ?? 8;
        this.ensurePeldanosDefaults(mod);
      }

      if (
        mod.nombre ===
        'TODA LA CASUÍSTICA DE MUELLES, BALLESTAS Y AMORTIGUADORES QUE SE PUEDEN DAR'
      ) {
        mod.diametroTacoDelantero = this.toNumberOrNull(mod.diametroTacoDelantero);
        mod.espesorTacoDelantero = this.toNumberOrNull(mod.espesorTacoDelantero);
        mod.diametroTacoTrasero = this.toNumberOrNull(mod.diametroTacoTrasero);
        mod.espesorTacoTrasero = this.toNumberOrNull(mod.espesorTacoTrasero);
        mod.diametroTacoKitElevacionDelantero = this.toNumberOrNull(
          mod.diametroTacoKitElevacionDelantero,
        );
        mod.espesorTacoKitElevacionDelantero = this.toNumberOrNull(
          mod.espesorTacoKitElevacionDelantero,
        );
        mod.diametroTacoKitElevacionTrasero = this.toNumberOrNull(
          mod.diametroTacoKitElevacionTrasero,
        );
        mod.espesorTacoKitElevacionTrasero = this.toNumberOrNull(
          mod.espesorTacoKitElevacionTrasero,
        );
      }

      if (mod.nombre === 'DEFENSA DELANTERA') {
        mod.metricaToldo = this.toNumberOrNull(mod.metricaToldo ?? mod.metrica);
        mod.nTornillos = this.toNumberOrNull(mod.nTornillos);
        mod.pesoPiezaKg = this.toNumberOrNull(mod.pesoPiezaKg);
        mod.anchuraPiezaM = this.toNumberOrNull(mod.anchuraPiezaM);
        mod.alturaPiezaM = this.toNumberOrNull(mod.alturaPiezaM);
      }

      if (
        mod.nombre === 'PELDAÑOS' &&
        mod.metodoActuacionPeldanos !== 'electrico'
      ) {
        mod.ubicacionAccionamientoPeldanos = '';
      }
    });
    // ------------------------------------------------------

    this.detachSharedProxies();
    this.continuar.emit(this.datosEntrada);
  }

  private ensureSuspensionCasuisticaDefaults(mod: any): void {
    if (!mod) return;

    mod.detallesMuelles = mod.detallesMuelles || {};

    if (
      mod.detallesMuelles.kitElevacionDelantero &&
      mod.diametroTacoKitElevacionDelantero == null &&
      mod.diametroTacoDelantero != null
    ) {
      mod.diametroTacoKitElevacionDelantero = mod.diametroTacoDelantero;
    }

    if (
      mod.detallesMuelles.kitElevacionDelantero &&
      mod.espesorTacoKitElevacionDelantero == null &&
      mod.espesorTacoDelantero != null
    ) {
      mod.espesorTacoKitElevacionDelantero = mod.espesorTacoDelantero;
    }

    if (
      mod.detallesMuelles.kitElevacionTrasero &&
      mod.diametroTacoKitElevacionTrasero == null &&
      mod.diametroTacoTrasero != null
    ) {
      mod.diametroTacoKitElevacionTrasero = mod.diametroTacoTrasero;
    }

    if (
      mod.detallesMuelles.kitElevacionTrasero &&
      mod.espesorTacoKitElevacionTrasero == null &&
      mod.espesorTacoTrasero != null
    ) {
      mod.espesorTacoKitElevacionTrasero = mod.espesorTacoTrasero;
    }
  }

  private isMissingValue(value: unknown): boolean {
    return value === null || value === undefined || value === '';
  }

  isConditionalFieldInvalid(isRequired: boolean, value: unknown): boolean {
    return this.formSubmitted && isRequired && this.isMissingValue(value);
  }

  isTacosSelectionInvalid(mod: any): boolean {
    return (
      this.formSubmitted &&
      !!mod?.detallesMuelles?.tacosDeGoma &&
      !mod?.tacosDelantero &&
      !mod?.tacosTrasero
    );
  }

  isKitSelectionInvalid(mod: any): boolean {
    return (
      this.formSubmitted &&
      !!mod?.detallesMuelles?.kitElevacion &&
      !mod?.detallesMuelles?.kitElevacionDelantero &&
      !mod?.detallesMuelles?.kitElevacionTrasero
    );
  }

  private hasTacosDeGomaErrors(mod: any): boolean {
    if (!mod?.detallesMuelles?.tacosDeGoma) {
      return false;
    }

    if (!mod.tacosDelantero && !mod.tacosTrasero) {
      return true;
    }

    if (
      mod.tacosDelantero &&
      (this.isMissingValue(mod.diametroTacoDelantero) ||
        this.isMissingValue(mod.espesorTacoDelantero))
    ) {
      return true;
    }

    if (
      mod.tacosTrasero &&
      (this.isMissingValue(mod.diametroTacoTrasero) ||
        this.isMissingValue(mod.espesorTacoTrasero))
    ) {
      return true;
    }

    return false;
  }

  private hasKitElevacionErrors(mod: any): boolean {
    if (!mod?.detallesMuelles?.kitElevacion) {
      return false;
    }

    if (
      !mod.detallesMuelles.kitElevacionDelantero &&
      !mod.detallesMuelles.kitElevacionTrasero
    ) {
      return true;
    }

    if (
      mod.detallesMuelles.kitElevacionDelantero &&
      (this.isMissingValue(mod.marcaKitElevacionDelantera) ||
        this.isMissingValue(mod.tipoSuspensionDelantera) ||
        this.isMissingValue(mod.tipoTacoDelantero) ||
        this.isMissingValue(mod.diametroTacoKitElevacionDelantero) ||
        this.isMissingValue(mod.espesorTacoKitElevacionDelantero))
    ) {
      return true;
    }

    if (
      mod.detallesMuelles.kitElevacionTrasero &&
      (this.isMissingValue(mod.marcaKitElevacionTrasera) ||
        this.isMissingValue(mod.tipoSuspensionTrasera) ||
        this.isMissingValue(mod.tipoTacoTrasero) ||
        this.isMissingValue(mod.diametroTacoKitElevacionTrasero) ||
        this.isMissingValue(mod.espesorTacoKitElevacionTrasero))
    ) {
      return true;
    }

    return false;
  }
}
