import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
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
  readonly BARRA_ALINEAMIENTO =
    'BARRA PARA REGULAR LA CONVERGENCIA DE LAS RUEDAS (alineamiento)';
  readonly BARRA_MOV_LATERAL =
    'BARRA PARA REGULAR LA CONVERGENCIA DE LAS RUEDAS (movimiento lateral)';
  readonly BANQUETA_INDIVIDUAL =
    'SUSTITUCIÓN DE BANQUETA DE ASIENTOS POR ASIENTO INDIVIDUAL';

  private readonly AUTO_SKIP_RULES: {
    nombre: string;
    detalles?: string[]; // opcional, si hay que mirar subcampos
    tipoVehiculo?: string;
  }[] = [
    { nombre: 'Luces' },
    { nombre: 'Portabicicletas' },
    { nombre: 'Freno', tipoVehiculo: 'coche' },
    { nombre: 'Freno', tipoVehiculo: 'industrial' },
    { nombre: 'Freno', tipoVehiculo: 'camper' },
    { nombre: 'Unidad motriz' },
    // ejemplo: si en Carrocería sólo se marca 'soporteRuedaRepuesto'
    { nombre: 'Carrocería', detalles: ['aleron'] },
    // otro ejemplo: permitir snorkel sin más
    { nombre: 'Carrocería', detalles: ['bodyLift'] },
    { nombre: 'Carrocería', detalles: ['peldaños'] },
    { nombre: 'Carrocería', detalles: ['matriculaDelanteraPequeña'] },
    { nombre: 'Dirección', detalles: ['volanteYPiña'] },

    { nombre: 'Enganche de remolque (quads)', tipoVehiculo: 'moto' },
    {
      nombre: 'Ruedas',
      detalles: ['separadoresDeRuedaMoto'],
      tipoVehiculo: 'moto',
    },
    {
      nombre: 'Chasis y Subchasis',
      tipoVehiculo: 'moto',
    },
    {
      nombre: 'Suspensión',
      tipoVehiculo: 'moto',
    },
    {
      nombre: 'Carrocería',
      detalles: ['estribosMoto'],
      tipoVehiculo: 'moto',
    },
    {
      nombre: 'Carrocería',
      detalles: ['cambioPlacaDeMatriculaMoto'],
      tipoVehiculo: 'moto',
    },
    {
      nombre: 'Carrocería',
      detalles: ['depositoDeCombustibleMoto'],
      tipoVehiculo: 'moto',
    },
    {
      nombre: 'Carrocería',
      detalles: ['cabrestanteMoto'],
      tipoVehiculo: 'moto',
    },
    {
      nombre: 'Carrocería',
      detalles: ['sillinMoto'],
      tipoVehiculo: 'moto',
    },
    {
      nombre: 'Carrocería',
      detalles: ['mandosAdelantadosMoto'],
      tipoVehiculo: 'moto',
    },
    {
      nombre: 'Carrocería',
      detalles: ['asiderosParaPasajeroMoto'],
      tipoVehiculo: 'moto',
    },

    {
      nombre: 'Freno',
      detalles: ['tamborPorDiscoMoto'],
      tipoVehiculo: 'moto',
    },
    {
      nombre: 'Freno',
      detalles: ['discosPerforadosRayadosMoto'],
      tipoVehiculo: 'moto',
    },
    {
      nombre: 'Freno',
      detalles: ['bombaMoto'],
      tipoVehiculo: 'moto',
    },

    {
      nombre: 'Suspensión',
      tipoVehiculo: 'camper',
    },
    {
      nombre: 'Carrocería',
      tipoVehiculo: 'camper',
    },
    {
      nombre: 'Luces',
      tipoVehiculo: 'camper',
    },
    {
      nombre: 'Dirección',
      tipoVehiculo: 'camper',
    },
    {
      nombre: 'Freno',
      tipoVehiculo: 'camper',
    },
    {
      nombre: 'Unidad motriz',
      tipoVehiculo: 'camper',
    },
    {
      nombre: 'Enganche de remolque',
      tipoVehiculo: 'camper',
    },
    {
      nombre: 'Portabicicletas',
      tipoVehiculo: 'camper',
    },
  ];

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

  // “Mini-DB” de tornillos
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

  ngOnChanges(_: SimpleChanges): void {
    this.rebuild(); // se recalcula cada vez que llega el input
  }

  getTornilloActivo(mod: any) {
    if (!mod?.diametroTornilloSeleccionado) return null;
    return this.tornillosDB.find(
      (t) => t.diametro === mod.diametroTornilloSeleccionado
    );
  }

  onMetricaChange(mod: any) {
    let as;
    as = this.metricasAs[mod.metricaTalonera];
    mod.seccionResistenteAsEstribos = as || null;

    as = this.metricasAs[mod.metricaParaTrasero];
    mod.seccionResistenteAsParagolpesTrasero = as || null;

    as = this.metricasAs[mod.metricaLucesEspecificas];
    mod.seccionResistenteAsLucesEspecificas = as || null;

    as = this.metricasAs[mod.metricaSnorkel];
    mod.seccionResistenteAsSnorkel = as || null;

    as = this.metricasAs[mod.metricaParaDelantero];
    mod.seccionResistenteAsParagolpesDelantero = as || null;

    as = this.metricasAs[mod.metricaAletines];
    mod.seccionResistenteAsAletines = as || null;
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

  ngOnInit(): void {
    this.modificacionesSeleccionadas = this.datosEntrada.modificaciones.filter(
      (mod: any) => mod.seleccionado
    );

    this.modificacionesSeleccionadas.forEach((m: any) => {
      if (
        m.densidadAireKgM3Estribos === undefined ||
        m.densidadAireKgM3Estribos === null
      ) {
        m.densidadAireKgM3Estribos = 1.29;
      }

      if (
        m.coefAerodinamicoEstribos === undefined ||
        m.coefAerodinamicoEstribos === null
      ) {
        m.coefAerodinamicoEstribos = 0.82;
      }

      if (
        m.velocidadAireV2msEstribos === undefined ||
        m.velocidadAireV2msEstribos === null
      ) {
        m.velocidadAireV2msEstribos = 38.89;
      }

      if (
        m.radioCurvaREstribos === undefined ||
        m.radioCurvaREstribos === null
      ) {
        m.radioCurvaREstribos = 800;
      }

      if (
        m.coefSeguridadKEstribos === undefined ||
        m.coefSeguridadKEstribos === null
      ) {
        m.coefSeguridadKEstribos = 3;
      }

      if (
        m.calidadTornilloEstribos === undefined ||
        m.calidadTornilloEstribos === null
      ) {
        m.calidadTornilloEstribos = 8.8;
      }

      if (
        m.calidadTornilloLucesEspecificas === undefined ||
        m.calidadTornilloLucesEspecificas === null
      ) {
        m.calidadTornilloLucesEspecificas = 8.8;
      }

      if (
        m.cwCoefAerodinamicoLucesEspecificas === undefined ||
        m.cwCoefAerodinamicoLucesEspecificas === null
      ) {
        m.cwCoefAerodinamicoLucesEspecificas = 0.82;
      }

      if (
        m.densidadAireKgM3LucesEspecificas === undefined ||
        m.densidadAireKgM3LucesEspecificas === null
      ) {
        m.densidadAireKgM3LucesEspecificas = 1.29;
      }

      if (
        m.velocidadAireV2msLucesEspecificas === undefined ||
        m.velocidadAireV2msLucesEspecificas === null
      ) {
        m.velocidadAireV2msLucesEspecificas = 38.89;
      }

      if (
        m.radioCurvaRLucesEspecificas === undefined ||
        m.radioCurvaRLucesEspecificas === null
      ) {
        m.radioCurvaRLucesEspecificas = 800;
      }

      if (
        m.coefSeguridadKLucesEspecificas === undefined ||
        m.coefSeguridadKLucesEspecificas === null
      ) {
        m.coefSeguridadKLucesEspecificas = 3;
      }

      if (
        m.calidadTornilloSnorkel === undefined ||
        m.calidadTornilloSnorkel === null
      ) {
        m.calidadTornilloSnorkel = 8.8;
      }

      if (
        m.cwCoefAerodinamicoSnorkel === undefined ||
        m.cwCoefAerodinamicoSnorkel === null
      ) {
        m.cwCoefAerodinamicoSnorkel = 0.82;
      }

      if (
        m.densidadAireKgM3Snorkel === undefined ||
        m.densidadAireKgM3Snorkel === null
      ) {
        m.densidadAireKgM3Snorkel = 1.29;
      }

      if (
        m.velocidadAireV2msSnorkel === undefined ||
        m.velocidadAireV2msSnorkel === null
      ) {
        m.velocidadAireV2msSnorkel = 38.89;
      }

      if (
        m.coefSeguridadKSnorkel === undefined ||
        m.coefSeguridadKSnorkel === null
      ) {
        m.coefSeguridadKSnorkel = 3;
      }

      if (
        m.coefAerodinamicoParagolpesTrasero === undefined ||
        m.coefAerodinamicoParagolpesTrasero === null
      ) {
        m.coefAerodinamicoParagolpesTrasero = 0.82;
      }

      if (
        m.calidadTornilloParagolpesTrasero === undefined ||
        m.calidadTornilloParagolpesTrasero === null
      ) {
        m.calidadTornilloParagolpesTrasero = 8.8;
      }

      if (
        m.densidadAireKgM3ParagolpesTrasero === undefined ||
        m.densidadAireKgM3ParagolpesTrasero === null
      ) {
        m.densidadAireKgM3ParagolpesTrasero = 1.29;
      }

      if (
        m.velocidadAireV2msParagolpesTrasero === undefined ||
        m.velocidadAireV2msParagolpesTrasero === null
      ) {
        m.velocidadAireV2msParagolpesTrasero = 38.89;
      }

      if (
        m.radioCurvaRParagolpesTrasero === undefined ||
        m.radioCurvaRParagolpesTrasero === null
      ) {
        m.radioCurvaRParagolpesTrasero = 800;
      }

      if (
        m.coefSeguridadKParagolpesTrasero === undefined ||
        m.coefSeguridadKParagolpesTrasero === null
      ) {
        m.coefSeguridadKParagolpesTrasero = 3;
      }

      if (
        m.cwCoefAerodinamicoParagolpesDelantero === undefined ||
        m.cwCoefAerodinamicoParagolpesDelantero === null
      ) {
        m.cwCoefAerodinamicoParagolpesDelantero = 0.82;
      }

      if (
        m.densidadAireKgM3ParagolpesDelantero === undefined ||
        m.densidadAireKgM3ParagolpesDelantero === null
      ) {
        m.densidadAireKgM3ParagolpesDelantero = 1.29;
      }

      if (
        m.velocidadAireV2msParagolpesDelantero === undefined ||
        m.velocidadAireV2msParagolpesDelantero === null
      ) {
        m.velocidadAireV2msParagolpesDelantero = 38.89;
      }

      if (
        m.radioCurvaRParagolpesDelantero === undefined ||
        m.radioCurvaRParagolpesDelantero === null
      ) {
        m.radioCurvaRParagolpesDelantero = 800;
      }

      if (
        m.coefSeguridadKParagolpesDelantero === undefined ||
        m.coefSeguridadKParagolpesDelantero === null
      ) {
        m.coefSeguridadKParagolpesDelantero = 3;
      }

      if (
        m.coefAerodinamicoCwAletines === undefined ||
        m.coefAerodinamicoCwAletines === null
      ) {
        m.coefAerodinamicoCwAletines = 0.82;
      }

      if (
        m.densidadAireKgM3Aletines === undefined ||
        m.densidadAireKgM3Aletines === null
      ) {
        m.densidadAireKgM3Aletines = 1.29;
      }

      if (
        m.velocidadAireV2msAletines === undefined ||
        m.velocidadAireV2msAletines === null
      ) {
        m.velocidadAireV2msAletines = 38.89;
      }

      if (
        m.radioCurvaRAletines === undefined ||
        m.radioCurvaRAletines === null
      ) {
        m.radioCurvaRAletines = 800;
      }

      if (
        m.coefSeguridadKAletines === undefined ||
        m.coefSeguridadKAletines === null
      ) {
        m.coefSeguridadKAletines = 3;
      }

      if (m.curvaturaSnorkel === undefined || m.curvaturaSnorkel === null) {
        m.curvaturaSnorkel = 800;
      }

      if (
        m.seccionResistenteAsSnorkel === undefined ||
        m.seccionResistenteAsSnorkel === null
      ) {
        m.seccionResistenteAsSnorkel = 36.64;
      }
    });
  }

  onDimensionesChange(
    mod: any,
    sourceKey: string, // Campo donde está la cadena (ej: "dimensionesTaloneras")
    targetWidthKey: string, // Campo donde guardar la anchura
    targetHeightKey: string // Campo donde guardar la altura
  ) {
    const rawValue = mod[sourceKey];
    if (!rawValue || rawValue.trim() === '') {
      mod[targetWidthKey] = null;
      mod[targetHeightKey] = null;
      return;
    }

    const clean = rawValue.toLowerCase().replace('mm', '').trim();
    const parts = clean.split('x');

    // Anchura (primer valor)
    const anchuraMm = parseFloat(parts[0]);
    mod[targetWidthKey] = !isNaN(anchuraMm) ? anchuraMm / 1000 : null;

    // Altura (segundo valor si existe)
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

  private rebuild() {
    const mods = Array.isArray(this.datosEntrada?.modificaciones)
      ? this.datosEntrada.modificaciones
      : [];

    this.modificacionesSeleccionadas = mods.filter(
      (m: { seleccionado: any }) => m?.seleccionado
    );

    if (this.debeAutoContinuar()) {
      // Lanzamos continuar automáticamente
      this.continuar.emit(this.datosEntrada);
      return; // ya no seguimos inicializando
    }

    this.modificacionesSeleccionadas.forEach((m) => {
      if (m.nombre === 'MOBILIARIO INTERIOR VEHÍCULO') {
        if (m.diametroTornilloSeleccionado === undefined) {
          m.diametroTornilloSeleccionado = null;
        }

        // inicializar área si no existe
        if (m.areaResistenteTornilloSeleccionado === undefined) {
          m.areaResistenteTornilloSeleccionado = null;
        }

        // si ya hay un diámetro, sincronizar el área
        if (m.diametroTornilloSeleccionado !== null) {
          const tornillo = this.tornillosDB.find(
            (t) => t.diametro === m.diametroTornilloSeleccionado
          );
          if (tornillo) {
            m.areaResistenteTornilloSeleccionado = tornillo.areaResistente;
          }
        }
      }
    });
  }

  private debeAutoContinuar(): boolean {
    if (this.modificacionesSeleccionadas.length === 0) return false;

    const tipo = this.datosEntrada.tipoVehiculo; // se asume que viene del input

    return this.modificacionesSeleccionadas.every((mod) => {
      // filtra solo las reglas que coinciden con el nombre
      let reglas = this.AUTO_SKIP_RULES.filter((r) => r.nombre === mod.nombre);

      // además filtra por tipoVehiculo (si la regla lo tiene definido)
      reglas = reglas.filter((r) => !r.tipoVehiculo || r.tipoVehiculo === tipo);

      if (reglas.length === 0) return false;

      // Si alguna regla no requiere detalles → es válido directamente
      if (reglas.some((r) => !r.detalles)) return true;

      // Si la regla requiere detalles → comprobamos subopciones
      if (mod.detalle) {
        return reglas.some(
          (r) =>
            r.detalles!.every((d) => mod.detalle[d]) &&
            Object.keys(mod.detalle).every(
              (key) => !mod.detalle[key] || r.detalles!.includes(key)
            )
        );
      }

      return false;
    });
  }
}
