import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Modificacion } from '../../interfaces/modificacion';

@Component({
  selector: 'app-tipo-vehiculo',
  imports: [FormsModule],
  standalone: true,
  templateUrl: './tipo-vehiculo.component.html',
  styleUrl: './tipo-vehiculo.component.css',
})
export class TipoVehiculoComponent implements OnInit {
  @Input() datosPrevios: any;
  @Output() continuar = new EventEmitter<any>();
  @Output() volver = new EventEmitter<any>();
  @Output() autosave = new EventEmitter<{
    tipoVehiculo: string;
    modificaciones: Modificacion[];
  }>();

  tipoVehiculo: string = '';
  modificaciones: Modificacion[] = [];
  tipoVehiculoInvalido: boolean = false;
  erroresSubopciones: boolean[] = [];

  detallesMuellesOpciones = [
    { key: 'muelleDelanteroConRef', label: 'Muelle delantero con referencia' },
    { key: 'muelleDelanteroSinRef', label: 'Muelle delantero sin referencia' },
    { key: 'muelleTraseroConRef', label: 'Muelle trasero con referencia' },
    { key: 'muelleTraseroSinRef', label: 'Muelle trasero sin referencia' },
    { key: 'ballestaDelantera', label: 'Ballesta delantera' },
    { key: 'ballestaTrasera', label: 'Ballesta trasera' },
    { key: 'amortiguadorDelantero', label: 'Amortiguador delantero' },
    { key: 'amortiguadorTrasero', label: 'Amortiguador trasero' },
    { key: 'tacosDeGoma', label: 'Instalación de tacos de goma' },
    { key: 'kitElevacion', label: 'Instalación de kit de elevación' },
  ];

  opcionesDescripcionLuces = [
    { key: 'luzGrupoOptico', label: 'Grupo óptico delantero' },
    {
      key: 'intermitenteDelantero',
      label: 'Intermitentes delanteros en horquilla',
    },
    {
      key: 'intermitenteTrasero',
      label: 'Intermitentes traseros en portamatrícula',
    },
    { key: 'catadioptrico', label: 'Catadióptrico posterior' },
    { key: 'luzMatricula', label: 'Luz de matrícula' },
  ];

  ngOnInit(): void {
    if (this.datosPrevios) {
      this.tipoVehiculo = this.datosPrevios.tipoVehiculo;
      this.modificaciones = this.datosPrevios.modificaciones.map(
        (mod: Modificacion) => {
          if (mod.nombre === 'LUCES' && !mod.descripcionLuces) {
            mod.descripcionLuces = {
              luzGrupoOptico: false,
              intermitenteDelantero: false,
              intermitenteTrasero: false,
              catadioptrico: false,
              luzMatricula: false,
            };
          }
          return mod;
        }
      );
    }
    this.modificaciones = (this.modificaciones || []).map((mod: any) => {
      if (mod.detalle) return mod;
      if (mod.nombre === 'ALETINES Y SOBREALETINES') {
        return { ...mod, detalle: { aletines: false, sobrealetines: false } };
      }
      return {
        ...mod,
        detalle: {
          interDelantero: false,
          interTrasero: false,
          interLateral: false,
          sustitucionEjeDelantero: false,
          sustitucionEjeTrasero: false,
        },
      };
    });

    // Primer autosave al cargar con datos previos
    this.emitAutosave();
  }

  private emitAutosave() {
    this.autosave.emit({
      tipoVehiculo: this.tipoVehiculo,
      modificaciones: this.modificaciones,
    });
  }

  onTipoCambio(): void {
    this.modificaciones = this.obtenerModificacionesPorTipo(this.tipoVehiculo);
    this.erroresSubopciones = new Array(this.modificaciones.length).fill(false);
    this.emitAutosave();
  }

  onCambioSubopcion(): void {
    this.emitAutosave(); // guarda cada interacción relevante
  }

  obtenerModificacionesPorTipo(tipo: string): Modificacion[] {
    switch (tipo) {
      case 'coche':
        return [
          {
            nombre: 'REMOLQUE HOMOLOGADO EN EMPLAZAMIENTO NO HOMOLOGADO',
            seleccionado: false,
          },
          {
            nombre: 'REMOLQUE HOMOLOGADO EN EMPLAZAMIENTO TAMBIÉN HOMOLOGADO',
            seleccionado: false,
          },
          { nombre: 'REDUCCIÓN DE PLAZAS', seleccionado: false },
          {
            nombre: 'NEUMÁTICOS',
            seleccionado: false,
            anotacion1: '',
            anotacion2: '',
          },
          { nombre: 'SEPARADORES DE RUEDA', seleccionado: false },
          {
            nombre: 'ALETINES Y SOBREALETINES',
            seleccionado: false,
            detalle: {
              aletines: false,
              sobrealetines: false,
            },
          },
          { nombre: 'SNORKEL', seleccionado: false },
          { nombre: 'PARAGOLPES DELANTERO', seleccionado: false },
          { nombre: 'PARAGOLPES TRASERO', seleccionado: false },
          { nombre: 'CABRESTANTE', seleccionado: false },
          { nombre: 'ANTIEMPOTRAMIENTO', seleccionado: false },
          {
            nombre: 'SOPORTES PARA LUCES DE USO ESPECÍFICO',
            seleccionado: false,
          },
          { nombre: 'SOPORTE PARA RUEDA DE REPUESTO', seleccionado: false },
          {
            nombre:
              'TODA LA CASUÍSTICA DE MUELLES, BALLESTAS Y AMORTIGUADORES QUE SE PUEDEN DAR',
            seleccionado: false,
            anotacion: '',
            detallesMuelles: {
              muelleDelanteroConRef: false,
              muelleDelanteroSinRef: false,
              ballestaDelantera: false,
              ballestaTrasera: false,
              amortiguadorDelantero: false,
              muelleTraseroConRef: false,
              muelleTraseroSinRef: false,
              amortiguadorTrasero: false,
              tacosDeGoma: false,
              kitElevacion: false,
            },
          },
          {
            nombre: 'MATRÍCULA Y PORTAMATRÍCULA',
            seleccionado: false,
            detalle: {
              instalacionPorta: false,
              reubicacionTrasera: false,
              cambioUbicacionDelantera: false,
            },
          },
          { nombre: 'DEFENSA DELANTERA', seleccionado: false },
          { nombre: 'AMORTIGUADOR DE DIRECCIÓN', seleccionado: false },
          { nombre: 'BARRA DE DIRECCIÓN', seleccionado: false },
          {
            nombre:
              'BARRA PARA REGULAR LA CONVERGENCIA DE LAS RUEDAS (alineamiento)',
            seleccionado: false,
          },
          {
            nombre:
              'BARRA PARA REGULAR LA CONVERGENCIA DE LAS RUEDAS (movimiento lateral)',
            seleccionado: false,
          },
          { nombre: 'FAROS DELANTEROS PRINCIPALES', seleccionado: false },
          { nombre: 'LUZ DE CRUCE', seleccionado: false },
          { nombre: 'LUCES DE LARGO ALCANCE', seleccionado: false },
          { nombre: 'LUZ DE POSICIÓN', seleccionado: false },
          { nombre: '3ª LUZ DE FRENO', seleccionado: false },
          { nombre: 'DIURNAS', seleccionado: false },
          { nombre: 'ANTINIEBLA', seleccionado: false },
          {
            nombre: 'PILOTO TRASERO',
            seleccionado: false,
            detalle: {
              luzPosicionFreno: false,
              intermitente: false,
              marchaAtras: false,
              catadioptrico: false,
            },
          },
          {
            nombre: 'INTERMITENTES',
            seleccionado: false,
            detalle: {
              interDelantero: false,
              interTrasero: false,
              interLateral: false,
            },
          },
          {
            nombre: 'SUSTITUCIÓN DE EJES',
            seleccionado: false,
            detalle: {
              sustitucionEjeTrasero: false,
              sustitucionEjeDelantero: false,
            },
          },
          {
            nombre: 'ESTRIBOS LATERALES O TALONERAS',
            seleccionado: false,
            detalle: {
              estribosotaloneras: false,
              anotacionAntideslizante: false,
            },
          },
        ];
      case 'moto':
        return [
          {
            nombre: 'REDUCCIÓN MMA Y MMTA',
            seleccionado: false,
            ejeDelantero: false,
            ejeTotal: false,
          },
          { nombre: 'LLANTAS Y NEUMÁTICOS', seleccionado: false },
          { nombre: 'SUSPENSIÓN', seleccionado: false },
          {
            nombre: 'SUSTITUCIÓN GUARDABARROS',
            seleccionado: false,
            guardabarrosDelantero: false,
            guardabarrosTrasero: false,
          },
          { nombre: 'MANILLAR', seleccionado: false },
          { nombre: 'VELOCÍMETRO', seleccionado: false },
          { nombre: 'LATIGUILLOS', seleccionado: false },
          { nombre: 'RETROVISORES', seleccionado: false },
          { nombre: 'HORQUILLA DELANTERA', seleccionado: false },
          {
            nombre: 'DISCO DE FRENO Y PINZA DE FRENO',
            seleccionado: false,
            discoFreno: false,
            pastillaFreno: false,
          },
          {
            nombre: 'LUCES',
            seleccionado: false,
            descripcionLuces: {
              luzGrupoOptico: false,
              intermitenteDelantero: false,
              intermitenteTrasero: false,
              catadioptrico: false,
              luzMatricula: false,
            },
          },
        ];
      case 'camper':
        return [
          { nombre: 'CAMBIO DE CLASIFICACIÓN', seleccionado: false },
          {
            nombre: 'AUMENTO O DISMINUCIÓN DE PLAZAS',
            seleccionado: false,
            tipoCambio: null,
          },
          {
            nombre:
              'SUSTITUCIÓN DE BANQUETA DE ASIENTOS POR ASIENTO INDIVIDUAL',
            seleccionado: false,
          },
          { nombre: 'INSTALACIÓN DE BASES GIRATORIAS', seleccionado: false },
          { nombre: 'CALEFACCIÓN ESTACIONARIA', seleccionado: false },
          {
            nombre: 'MOBILIARIO INTERIOR VEHÍCULO',
            seleccionado: false,
            opcionesMueble: {
              muebleBajo: false,
              muebleAlto: false,
              aseo: false,
            },
          },
          { nombre: 'CLARABOYA', seleccionado: false },
          { nombre: 'VENTANA', seleccionado: false },
          { nombre: 'DEPÓSITO DE AGUA SUCIA', seleccionado: false },
          { nombre: 'DEPÓSITO DE AGUA LIMPIA', seleccionado: false },
          { nombre: 'BOMBA DE AGUA', seleccionado: false },
          { nombre: 'REGISTRO DE LLENADO DE AGUA', seleccionado: false },
          { nombre: 'TOMA EXTERIOR 230V', seleccionado: false },
          { nombre: 'DUCHA EXTERIOR', seleccionado: false, anotacion: false },
          {
            nombre: 'INSTALACIÓN ELÉCTRICA',
            seleccionado: false,
            anotacion: false,
          },
          { nombre: 'TOLDO', seleccionado: false },
        ];
      case 'industrial':
      default:
        return [];
    }
  }

  continuarFormulario(): void {
    if (!this.tipoVehiculo?.trim()) {
      this.tipoVehiculoInvalido = true;
      return;
    }

    if (!this.validarSubopciones()) {
      return;
    }

    this.tipoVehiculoInvalido = false;
    this.emitAutosave();

    this.continuar.emit({
      tipoVehiculo: this.tipoVehiculo,
      modificaciones: this.modificaciones,
    });
  }

  volverFormulario(): void {
    this.emitAutosave();
    this.volver.emit({
      tipoVehiculo: this.tipoVehiculo,
      modificaciones: this.modificaciones,
    });
  }

  validarSubopciones(): boolean {
    this.erroresSubopciones = []; // Resetear errores

    let esValido = true;

    this.modificaciones.forEach((mod, index) => {
      if (!mod.seleccionado) return;

      let invalido = false;

      if (mod.nombre.includes('MUELLES') && mod.detallesMuelles) {
        invalido = !Object.values(mod.detallesMuelles).some((v) => v);
      }

      if (
        (mod.nombre.includes('MATRÍCULA') || mod.nombre.includes('ALETINES')) &&
        mod.detalle
      ) {
        invalido = !Object.values(mod.detalle).some((v) => v);
      }

      if (mod.nombre === 'LUCES' && mod.descripcionLuces) {
        invalido = !Object.values(mod.descripcionLuces).some((v) => v);
      }

      if (mod.nombre === 'PILOTO TRASERO' && mod.detalle) {
        const opts = [
          mod.detalle.luzPosicionFreno,
          mod.detalle.intermitente,
          mod.detalle.marchaAtras,
          mod.detalle.catadioptrico,
        ];
        invalido = !opts.some((v) => v);
      }

      if (mod.nombre === 'DISCO DE FRENO Y PINZA DE FRENO') {
        invalido = !(mod.tieneDisco || mod.tienePastilla);
      }

      if (mod.nombre === 'SUSTITUCIÓN GUARDABARROS') {
        invalido = !(mod.guardabarrosDelantero || mod.guardabarrosTrasero);
      }

      if (mod.nombre === 'REDUCCIÓN MMA Y MMTA') {
        invalido = !(mod.ejeDelantero || mod.ejeTotal);
      }

      if (mod.nombre === 'AUMENTO O DISMINUCIÓN DE PLAZAS') {
        invalido = mod.tipoCambio == null;
      }

      if (mod.nombre === 'INSTALACIÓN ELÉCTRICA') {
        invalido = mod.anotacion === undefined;
      }

      if (invalido) {
        this.erroresSubopciones[index] = true;
        esValido = false;
      }

      if (mod.nombre === 'ESTRIBOS LATERALES O TALONERAS') {
        // invalido = true si no tiene ambas selecciones
        invalido =
          mod.detalle?.estribosotaloneras == null ||
          mod.detalle?.anotacionAntideslizante == null;
      }

      if (mod.nombre === 'INTERMITENTES') {
        const valido =
          mod.detalle?.interDelantero ||
          mod.detalle?.interTrasero ||
          mod.detalle?.interLateral;
        invalido = !valido;
        if (!valido) esValido = false;
      }

      if (mod.nombre === 'SUSTITUCIÓN DE EJES') {
        const valido =
          mod.detalle?.sustitucionEjeDelantero ||
          mod.detalle?.sustitucionEjeTrasero;
        invalido = !valido;
        if (!valido) esValido = false;
      }

      if (mod.nombre === 'ESTRIBOS LATERALES O TALONERAS') {
        const valido =
          mod.detalle?.estribosotaloneras ||
          mod.detalle?.anotacionAntideslizante;
        invalido = !valido;
        if (!valido) esValido = false;
      }

      if (mod.nombre === 'MOBILIARIO INTERIOR VEHÍCULO') {
        const valido =
          mod.opcionesMueble?.muebleBajo ||
          mod.opcionesMueble?.muebleAlto ||
          mod.opcionesMueble?.aseo;
        invalido = !valido;
        if (!valido) esValido = false;
      }

      this.erroresSubopciones[index] = invalido;

      if (invalido) {
        esValido = false;
      }
    });

    return esValido;
  }

  actualizarError(index: number, mod: Modificacion): void {
    let invalido = false;

    if (mod.nombre.includes('MUELLES') && mod.detallesMuelles) {
      invalido = !Object.values(mod.detallesMuelles).some((v) => v);
    }

    if (
      (mod.nombre.includes('MATRÍCULA') || mod.nombre.includes('ALETINES')) &&
      mod.detalle
    ) {
      invalido = !Object.values(mod.detalle).some((v) => v);
    }

    if (mod.nombre === 'LUCES' && mod.descripcionLuces) {
      invalido = !Object.values(mod.descripcionLuces).some((v) => v);
    }

    if (mod.nombre === 'PILOTO TRASERO' && mod.detalle) {
      const opts = [
        mod.detalle.luzPosicionFreno,
        mod.detalle.intermitente,
        mod.detalle.marchaAtras,
        mod.detalle.catadioptrico,
      ];
      invalido = !opts.some((v) => v);
    }

    if (mod.nombre === 'DISCO DE FRENO Y PINZA DE FRENO') {
      invalido = !(mod.discoFreno || mod.pastillaFreno);
    }

    if (mod.nombre === 'SUSTITUCIÓN GUARDABARROS') {
      invalido = !(mod.guardabarrosDelantero || mod.guardabarrosTrasero);
    }

    if (mod.nombre === 'REDUCCIÓN MMA Y MMTA') {
      invalido = !(mod.ejeDelantero || mod.ejeTotal);
    }

    if (mod.nombre === 'AUMENTO O DISMINUCIÓN DE PLAZAS') {
      invalido = mod.tipoCambio == null;
    }

    if (mod.nombre === 'INSTALACIÓN ELÉCTRICA') {
      invalido = mod.anotacion === undefined;
    }

    if (mod.nombre === 'ESTRIBOS LATERALES O TALONERAS') {
      invalido = !(
        mod.detalle?.estribosotaloneras || mod.detalle?.anotacionAntideslizante
      );
    }

    if (mod.nombre === 'INTERMITENTES') {
      invalido = !(
        mod.detalle?.interDelantero ||
        mod.detalle?.interTrasero ||
        mod.detalle?.interLateral
      );
    }

    if (mod.nombre === 'SUSTITUCIÓN DE EJES') {
      invalido = !(
        mod.detalle?.sustitucionEjeTrasero ||
        mod.detalle?.sustitucionEjeDelantero
      );
    }

    if (mod.nombre === 'MOBILIARIO INTERIOR VEHÍCULO') {
      invalido = !(
        mod.opcionesMueble?.muebleAlto ||
        mod.opcionesMueble?.muebleBajo ||
        mod.opcionesMueble?.aseo
      );
    }

    this.erroresSubopciones[index] = invalido;
  }
}
