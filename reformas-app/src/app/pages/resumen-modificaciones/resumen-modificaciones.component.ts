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
    8: 36.63,
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
      // 1. Lógica existente de Mobiliario
      if (m.nombre === 'MOBILIARIO INTERIOR VEHÍCULO') {
        if (m.diametroTornilloSeleccionado === undefined) {
          m.diametroTornilloSeleccionado = null;
        }
        if (m.areaResistenteTornilloSeleccionado === undefined) {
          m.areaResistenteTornilloSeleccionado = null;
        }
        if (m.diametroTornilloSeleccionado !== null) {
          const t = this.tornillosDB.find(
            (x) => x.diametro === m.diametroTornilloSeleccionado,
          );
          if (t) m.areaResistenteTornilloSeleccionado = t.areaResistente;
        }
      }

      // 2. Lógica existente de Instalación Eléctrica
      if (m.nombre === 'INSTALACIÓN ELÉCTRICA') {
        if (!Array.isArray(m.placasSolares)) {
          m.placasSolares = [];
        }
      }

      if (m.nombre === 'ALETINES Y SOBREALETINES') {
        if (m.velocidadAireV2msAletines == null) {
          m.velocidadAireV2msAletines = 38.89;
        }
        if (m.densidadAireKgM3Aletines == null) {
          m.densidadAireKgM3Aletines = 1.29;
        }
        if (m.radioCurvaRAletines == null) {
          m.radioCurvaRAletines = 800;
        }
        if (m.coefSeguridadKAletines == null) {
          m.coefSeguridadKAletines = 3;
        }
        if (m.resTraccionMinTornillo88Kgmm2Aletines == null) {
          m.resTraccionMinTornillo88Kgmm2Aletines = 80;
        }
        if (m.seccionResistenteAsAletines == null) {
          m.seccionResistenteAsAletines = 36.64;
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
        if (!m.detalle) {
          m.detalle = { aletines: false, sobrealetines: false };
        }
      }
      if (m.nombre === 'SOPORTES PARA LUCES DE USO ESPECÍFICO') {
        if (m.calidadTornilloLucesEspecificas == null) {
          m.calidadTornilloLucesEspecificas = 8.8;
        }
        if (m.seccionResistenteAsLucesEspecificas == null) {
          m.seccionResistenteAsLucesEspecificas = 36.64;
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
          m.radioCurvaRLucesEspecificas = 800;
        }
        if (m.coefSeguridadKLucesEspecificas == null) {
          m.coefSeguridadKLucesEspecificas = 3;
        }
        if (!m.detalle) {
          m.detalle = { aletines: false, sobrealetines: false };
        }
      }

      if (m.nombre === 'PARAGOLPES DELANTERO') {
        m.seccionResistenteAsParagolpesDelantero = 36.64;

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
          m.radioCurvaRParagolpesDelantero = 800;
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
          m.seccionResistenteAsParagolpesTrasero = 36.64;
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
          m.radioCurvaRParagolpesTrasero = 800;
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
          m.seccionResistenteAsEstribos = 36.64;
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
          m.radioCurvaREstribos = 800;
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
          m.curvaturaAleron = 800;
        }
        if (!m.calidadTornilloAleron) m.calidadTornilloAleron = 8.8;
        if (!m.resTraccionMinTornillo88Kgmm2Aleron)
          m.resTraccionMinTornillo88Kgmm2Aleron = 80;
        if (!m.seccionResistenteAsAleron) m.seccionResistenteAsAleron = 11.33;
        if (!m.metricaAleron) m.metricaAleron = 4;
      }
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

  onMetricaChange(mod: any) {
    // let as;
    // as = this.metricasAs[mod.metricaTalonera];
    // mod.seccionResistenteAsEstribos = as || null;
    // as = this.metricasAs[mod.metricaParaTrasero];
    // mod.seccionResistenteAsParagolpesTrasero = as || null;
    // as = this.metricasAs[mod.metricaLucesEspecificas];
    // mod.seccionResistenteAsLucesEspecificas = as || null;
    // as = this.metricasAs[mod.metricaSnorkel];
    // mod.seccionResistenteAsSnorkel = as || null;
    // as = this.metricasAs[mod.metricaParaDelantero];
    // mod.seccionResistenteAsParagolpesDelantero = as || null;
    // as = this.metricasAs[mod.metricaAletines];
    // mod.seccionResistenteAsAletines = as || null;
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
