import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-resumen-modificaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resumen-modificaciones.component.html',
  styleUrls: ['./resumen-modificaciones.component.css'],
})
export class ResumenModificacionesComponent implements OnInit, OnChanges {
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

  ngOnChanges(changes: SimpleChanges): void {
    console.log('--- DEBUG: ngOnChanges disparado ---', changes);
    if (changes['datosEntrada']) {
      console.log('--- DEBUG: Detectado cambio en datosEntrada ---');
      this.rebuild();
    }
  }

  ngOnInit(): void {
    console.log(
      '--- DEBUG: ngOnInit disparado ---  datosEntrada en resumen modificaciones:',
      this.datosEntrada,
    );
    this.rebuild();
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
        if (!m.metodoActuacionPeldanos) {
          m.metodoActuacionPeldanos = 'manual';
        }
        if (m.ubicacionAccionamientoPeldanos === undefined) {
          m.ubicacionAccionamientoPeldanos = '';
        }
        if (m.referenciaPeldanos === undefined) {
          m.referenciaPeldanos = '';
        }
      }

      if (m.nombre === 'CLARABOYA') {
        this.ensureClaraboyaDefaults(m);
      }

      if (m.nombre === 'VENTANA') {
        if (!Array.isArray(m.ventanas)) {
          m.ventanas = [];
        }

        if (m.ventanas.length === 0) {
          const hasLegacy =
            m.descripcionVentana ||
            m.marcaVentana ||
            m.modeloVentana ||
            m.dimensionesVentana ||
            m.homologacionVentana ||
            m.cantidadVentanas;

          if (hasLegacy) {
            m.ventanas.push({
              descripcion: m.descripcionVentana ?? '',
              marca: m.marcaVentana ?? '',
              modelo: m.modeloVentana ?? '',
              dimensiones: m.dimensionesVentana ?? '',
              homologacion: m.homologacionVentana ?? '',
            });
          }
        }
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
            .map((line: string, index: number) => ({
              titulo: `Reforma adicional ${index + 1}`,
              descripcion: line,
            }));
        }
      }

      if (m.nombre === 'REFUERZO PARAGOLPES') {
        this.syncRefuerzoLegacyData(m);
      }

      if (m.nombre === 'DIFUSOR TRASERO') {
        // if (m.velocidadAireV2msAletines == null) {
        //   m.velocidadAireV2msAletines = 38.89;
        // }
        // if (m.densidadAireKgM3Aletines == null) {
        //   m.densidadAireKgM3Aletines = 1.29;
        // }
        // if (m.radioCurvaRAletines == null) {
        //   m.radioCurvaRAletines = 8;
        // }
        if (m.radioCurvaRDifusor == null) {
          m.radioCurvaRDifusor = 8;
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
      if (m.nombre === 'LIP DELANTERO') {
        // if (m.velocidadAireV2msAletines == null) {
        //   m.velocidadAireV2msAletines = 38.89;
        // }
        // if (m.densidadAireKgM3Aletines == null) {
        //   m.densidadAireKgM3Aletines = 1.29;
        // }
        // if (m.radioCurvaRAletines == null) {
        //   m.radioCurvaRAletines = 8;
        // }
        if (m.radioCurvaRDifusor == null) {
          m.radioCurvaRLipDelantero = 8;
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
        // if (m.velocidadAireV2msAletines == null) {
        //   m.velocidadAireV2msAletines = 38.89;
        // }
        // if (m.densidadAireKgM3Aletines == null) {
        //   m.densidadAireKgM3Aletines = 1.29;
        // }
        // if (m.radioCurvaRAletines == null) {
        //   m.radioCurvaRAletines = 8;
        // }
        if (m.radioCurvaRPeldanos == null) {
          m.radioCurvaRPeldanos = 8;
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
          m.metricaCabrestante = 80;
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

      if (m.nombre === 'TOLDO') {
        this.ensureToldoDefaults(m);
      }

      if (m.nombre === 'SUSTITUCIÓN DE DISCOS DE FRENO') {
        this.ensureAngulosContactoSustitucionDiscos(m);
      }

      this.syncAreaResistenteByMetrica(m);
      this.syncCalidadByMetrica(m);
    });

    console.groupEnd();
  }

  getTornilloActivo(mod: any) {
    if (!mod?.diametroTornilloSeleccionado) return null;
    return this.tornillosDB.find(
      (t) => t.diametro === mod.diametroTornilloSeleccionado,
    );
  }

  onFrenosChange(mod: any) {
    this.ensureAngulosContactoSustitucionDiscos(mod);

    if (mod.sonIguales) {
      // Datos básicos
      mod.marcaDiscoTrasero = mod.marcaDiscos;
      mod.modeloDiscoTrasero = mod.modeloDiscos;
      mod.referenciaDiscoTrasero = mod.referenciaDiscos;
      mod.diametroDiscoTrasero = mod.diametroDiscos;
      mod.espesorDiscoTrasero = mod.espesorDiscos;

      // Datos de cálculo (Técnicos)
      mod.numDiscosTrasero = mod.numDiscosDelantero; // NUEVO
      mod.numPinzasTraseras = mod.numPinzasDelanteras; // NUEVO
      mod.diametroExteriorDiscoTrasero = mod.diametroExteriorDiscos;
      mod.diametroInteriorDiscoTrasero = mod.diametroInteriorDiscos;
      mod.diametroBombaDiscoTrasero = mod.diametroBombaDiscos;
      mod.dimensionPistonDiscoTrasero = mod.dimensionPistonDiscos;
      mod.numPistonesDiscoTrasero = mod.numPistonesDiscos;
      mod.anguloContactoDiscoTrasero = mod.anguloContactoDiscos;
      mod.perfilNeumaticoDiscoTrasero = mod.perfilNeumaticoDiscos;
      mod.anchoNeumaticoDiscoTrasero = mod.anchoNeumaticoDiscos;
      mod.radioEfectivoDiscoTrasero = mod.radioEfectivoDiscos;
    }
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
      { metricaKey: 'metricaToldo', areaKey: 'seccionResistenteAsToldo' },
      {
        metricaKey: 'metricaParaTrasero',
        areaKey: 'seccionResistenteAsParagolpesTrasero',
      },
      {
        metricaKey: 'metricaLucesEspecificas',
        areaKey: 'seccionResistenteAsLucesEspecificas',
      },
      { metricaKey: 'metricaSnorkel', areaKey: 'seccionResistenteAsSnorkel' },
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

  private createClaraboyaItem(initial: any = {}): any {
    const item = {
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
      ...initial,
    };

    this.ensureAerodynamicItemDefaults(item, 'medidas');
    return item;
  }

  private createPlacaSolarItem(initial: any = {}): any {
    const item = {
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
      ...initial,
    };

    item.agruparIguales = !!item.agruparIguales;
    const cantidad = Math.trunc(Number(item.cantidad));
    item.cantidad =
      item.agruparIguales && Number.isFinite(cantidad) && cantidad > 1
        ? cantidad
        : 1;

    this.ensureAerodynamicItemDefaults(item, 'dimensiones');
    return item;
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
      mod.mueblesBajo.push({
        cajones: 0,
        ubicacionMuebleBajo: '',
        configuracionMuebleBajo: '',
        metricaTornillosMuebleBajo: null,
      });
    }
    if (tipo === 'alto') {
      mod.mueblesAlto = mod.mueblesAlto || [];
      mod.mueblesAlto.push({
        ubicacionMuebleAlto: '',
        configuracionMuebleAlto: '',
        metricaTornillosMuebleAlto: null,
      });
    }
    if (tipo === 'aseo') {
      mod.mueblesAseo = mod.mueblesAseo || [];
      mod.mueblesAseo.push({
        descripcion: '',
        configuracionMuebleAseo: '',
        metricaTornillosMuebleAseo: null,
      });
    }
    this.formSubmitted = false;
  }

  anadirClaraboya(mod: any): void {
    if (!Array.isArray(mod.claraboyas)) {
      mod.claraboyas = [];
    }

    mod.claraboyas.push(this.createClaraboyaItem());
    this.formSubmitted = false;
  }

  borrarClaraboya(mod: any, index: number): void {
    if (!Array.isArray(mod?.claraboyas)) return;
    if (index < 0 || index >= mod.claraboyas.length) return;
    mod.claraboyas.splice(index, 1);
  }

  anadirPlacaSolar(mod: any): void {
    if (!Array.isArray(mod.placasSolares)) {
      mod.placasSolares = [];
    }

    mod.placasSolares.push(this.createPlacaSolarItem());
    this.formSubmitted = false;
  }

  borrarPlacaSolar(mod: any, index: number): void {
    if (!Array.isArray(mod?.placasSolares)) return;
    if (index < 0 || index >= mod.placasSolares.length) return;
    mod.placasSolares.splice(index, 1);
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

  anadirReformaAdicional(mod: any): void {
    if (!Array.isArray(mod.reformasAdicionalesItems)) {
      mod.reformasAdicionalesItems = [];
    }
    mod.reformasAdicionalesItems.push({ titulo: '', descripcion: '' });
    this.formSubmitted = false;
  }

  borrarReformaAdicional(mod: any, index: number): void {
    if (!Array.isArray(mod?.reformasAdicionalesItems)) return;
    if (index < 0 || index >= mod.reformasAdicionalesItems.length) return;
    mod.reformasAdicionalesItems.splice(index, 1);
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

    // --- CORRECCIÓN: Mapeo de datos si es SOLO TRASEROS ---
    this.modificacionesSeleccionadas.forEach((mod) => {
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

      if (mod.nombre === 'CAMPO LIBRE SOBRE REFORMAS NO EXISTENTES') {
        const lines: string[] = [];
        if (Array.isArray(mod.reformasAdicionalesItems)) {
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

      if (
        mod.nombre === 'PELDAÑOS' &&
        mod.metodoActuacionPeldanos !== 'electrico'
      ) {
        mod.ubicacionAccionamientoPeldanos = '';
      }
    });
    // ------------------------------------------------------

    this.continuar.emit(this.datosEntrada);
  }
}
