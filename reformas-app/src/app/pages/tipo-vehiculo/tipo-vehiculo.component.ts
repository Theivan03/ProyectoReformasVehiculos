import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  DoCheck,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Modificacion } from '../../interfaces/modificacion';

@Component({
  selector: 'app-tipo-vehiculo',
  imports: [FormsModule],
  standalone: true,
  templateUrl: './tipo-vehiculo.component.html',
  styleUrl: './tipo-vehiculo.component.css',
})
export class TipoVehiculoComponent implements OnInit, OnChanges, DoCheck {
  @Input() datosPrevios: any;
  @Input() enviadoPorCliente: boolean | null = null;
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

  // Evita reseteos repetidos cuando los @Input cambian varias veces
  private haAplicadoResetPorCliente = false;

  // Snapshot para detectar cambios sin tocar el HTML
  private snapshotMods = '';

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
    { key: 'luzAntinieblas', label: 'Luz antiniebla delantera' },
  ];

  // === Detecta "cliente" tanto por datosPrevios como por el @Input dedicado ===
  private get esCliente(): boolean {
    return !!this.enviadoPorCliente || !!this.datosPrevios?.enviadoPorCliente;
  }

  private resetPorCliente(): void {
    // Si el cliente ya eligió un tipo, usamos ese tipo pero con VUESTRA lista (como admin)
    if (this.datosPrevios?.tipoVehiculo) {
      this.tipoVehiculo = this.datosPrevios.tipoVehiculo;
      this.modificaciones = this.obtenerModificacionesPorTipo(
        this.tipoVehiculo
      ).map((m) => this.normalizarModificacion(m));
    } else {
      // Si no hay tipo, empezamos vacío
      this.tipoVehiculo = '';
      this.modificaciones = [];
    }

    this.erroresSubopciones = new Array(this.modificaciones.length).fill(false);
    this.haAplicadoResetPorCliente = true; // <- ya no volveremos a pisar la selección del usuario
    this.refreshSnapshot();
  }

  ngOnInit(): void {
    if (this.esCliente && !this.haAplicadoResetPorCliente) {
      this.resetPorCliente();
      return;
    }

    if (
      this.datosPrevios &&
      this.datosPrevios.tipoVehiculo &&
      !this.esCliente
    ) {
      // Edición creada por admin → restaurar normalmente
      this.tipoVehiculo = this.datosPrevios.tipoVehiculo;
      this.modificaciones = (this.datosPrevios.modificaciones || []).map(
        (mod: any) => this.normalizarModificacion(mod)
      );
    } else if (!this.esCliente) {
      // Proyecto nuevo del admin
      this.tipoVehiculo = '';
      this.modificaciones = [];
    }

    this.refreshSnapshot();

    // 🔥 YA NO EMITE AUTOSAVE AQUÍ (evita enviar datos vacíos al padre)
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Si detectamos que viene del cliente y AÚN no reseteamos → reseteamos UNA sola vez
    if (
      (changes['enviadoPorCliente'] || changes['datosPrevios']) &&
      this.esCliente &&
      !this.haAplicadoResetPorCliente
    ) {
      this.resetPorCliente();
      return;
    }

    // Si NO es de cliente, aplicamos datos que lleguen
    if (!this.esCliente && changes['datosPrevios']?.currentValue) {
      const nuevos = changes['datosPrevios'].currentValue;

      if (nuevos.tipoVehiculo) {
        this.tipoVehiculo = nuevos.tipoVehiculo;
      }
      if (Array.isArray(nuevos.modificaciones)) {
        this.modificaciones = nuevos.modificaciones.map((mod: any) =>
          this.normalizarModificacion(mod)
        );
      }
      this.refreshSnapshot();
      this.emitAutosave();
    }
  }

  // Detecta cualquier cambio en 'modificaciones' (marca, subopción, etc.) y emite autosave sin tocar el HTML
  ngDoCheck(): void {
    const s = JSON.stringify(this.modificaciones);

    const hayActivas =
      Array.isArray(this.modificaciones) &&
      this.modificaciones.some((m) => m?.seleccionado);

    if (
      this.tipoVehiculo &&
      this.tipoVehiculo.trim() !== '' &&
      hayActivas &&
      s !== this.snapshotMods
    ) {
      this.snapshotMods = s;
      this.emitAutosave();
    }
  }

  private refreshSnapshot(): void {
    this.snapshotMods = JSON.stringify(this.modificaciones);
  }

  private normalizarModificacion(mod: any): any {
    mod.seleccionado = !!mod.seleccionado;

    // Luces
    if (mod.nombre === 'LUCES' && !mod.descripcionLuces) {
      mod.descripcionLuces = {
        luzGrupoOptico: false,
        intermitenteDelantero: false,
        intermitenteTrasero: false,
        catadioptrico: false,
        luzMatricula: false,
        luzAntinieblas: false,
      };
    }

    // Aletines
    if (mod.nombre === 'ALETINES Y SOBREALETINES' && !mod.detalle) {
      mod.detalle = { aletines: false, sobrealetines: false };
    }

    // Intermitentes
    if (mod.nombre === 'INTERMITENTES' && !mod.detalle) {
      mod.detalle = {
        interDelantero: false,
        interTrasero: false,
        interLateral: false,
      };
    }

    // Sustitución de ejes
    if (mod.nombre === 'SUSTITUCIÓN DE EJES' && !mod.detalle) {
      mod.detalle = {
        sustitucionEjeDelantero: false,
        sustitucionEjeTrasero: false,
      };
    }

    // Estribos
    if (mod.nombre === 'ESTRIBOS LATERALES O TALONERAS' && !mod.detalle) {
      mod.detalle = {
        estribosotaloneras: null,
        anotacionAntideslizante: null,
      };
    }

    // Muelles
    if (mod.nombre.includes('MUELLES') && !mod.detallesMuelles) {
      mod.detallesMuelles = {
        muelleDelanteroConRef: false,
        muelleDelanteroSinRef: false,
        muelleTraseroConRef: false,
        muelleTraseroSinRef: false,
        ballestaDelantera: false,
        ballestaTrasera: false,
        amortiguadorDelantero: false,
        amortiguadorTrasero: false,
        tacosDeGoma: false,
        kitElevacion: false,
      };
    }

    // Piloto trasero
    if (mod.nombre === 'PILOTO TRASERO' && !mod.detalle) {
      mod.detalle = {
        luzPosicionFreno: false,
        intermitente: false,
        marchaAtras: false,
        catadioptrico: false,
      };
    }

    // Matrícula
    if (mod.nombre.includes('MATRÍCULA') && !mod.detalle) {
      mod.detalle = {
        instalacionPorta: false,
        reubicacionTrasera: false,
        cambioUbicacionDelantera: false,
      };
    }

    // Neumáticos (asegurar booleanos)
    if (mod.nombre === 'NEUMÁTICOS') {
      if (typeof mod.anotacion1 !== 'boolean') mod.anotacion1 = false;
      if (typeof mod.anotacion2 !== 'boolean') mod.anotacion2 = false;
    }

    // Disco y pastilla (unificar nombres con el HTML)
    if (mod.nombre === 'DISCO DE FRENO Y PINZA DE FRENO') {
      // Si vienen como discoFreno/pastillaFreno (del server), mapea
      if (typeof mod.tieneDisco !== 'boolean') {
        mod.tieneDisco = !!mod.discoFreno;
      }
      if (typeof mod.tienePastilla !== 'boolean') {
        mod.tienePastilla = !!mod.pastillaFreno;
      }
      // Y deja también las claves del server sincronizadas por si el padre guarda tal cual
      mod.discoFreno = !!mod.tieneDisco;
      mod.pastillaFreno = !!mod.tienePastilla;
    }

    // Guardabarros moto
    if (mod.nombre === 'SUSTITUCIÓN GUARDABARROS') {
      if (typeof mod.guardabarrosDelantero !== 'boolean')
        mod.guardabarrosDelantero = false;
      if (typeof mod.guardabarrosTrasero !== 'boolean')
        mod.guardabarrosTrasero = false;
    }

    // MMA/MMTA moto
    if (mod.nombre === 'REDUCCIÓN MMA Y MMTA') {
      if (typeof mod.ejeDelantero !== 'boolean') mod.ejeDelantero = false;
      if (typeof mod.ejeTotal !== 'boolean') mod.ejeTotal = false;
    }

    // Mobiliario
    if (mod.nombre === 'MOBILIARIO INTERIOR VEHÍCULO' && !mod.opcionesMueble) {
      mod.opcionesMueble = {
        muebleBajo: false,
        muebleAlto: false,
        aseo: false,
      };
    }

    return mod;
  }

  private emitAutosave() {
    this.autosave.emit({
      tipoVehiculo: this.tipoVehiculo,
      modificaciones: this.modificaciones,
    });
  }

  onTipoCambio(): void {
    this.modificaciones = this.obtenerModificacionesPorTipo(
      this.tipoVehiculo
    ).map((mod) => this.normalizarModificacion(mod));

    this.erroresSubopciones = new Array(this.modificaciones.length).fill(false);
    this.refreshSnapshot();

    if (
      this.tipoVehiculo &&
      this.tipoVehiculo.trim() !== '' &&
      this.modificaciones.length > 0
    ) {
      this.emitAutosave();
    }
  }

  onCambioSubopcion(mod: any): void {
    if (!mod?.seleccionado) return;
    this.emitAutosave();
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
            anotacion1: false,
            anotacion2: false,
          },
          { nombre: 'SEPARADORES DE RUEDA', seleccionado: false },
          {
            nombre: 'ALETINES Y SOBREALETINES',
            seleccionado: false,
            detalle: { aletines: false, sobrealetines: false },
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
            // usamos claves que el HTML espera
            tieneDisco: false,
            tienePastilla: false,
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
              luzAntinieblas: false,
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

    // 🔑 Normalizar el proyecto si venía de cliente
    if (this.enviadoPorCliente || this.datosPrevios?.enviadoPorCliente) {
      if (this.datosPrevios) {
        this.datosPrevios.tipoVehiculo = this.tipoVehiculo;
        this.datosPrevios.modificaciones = this.modificaciones;
        this.datosPrevios.enviadoPorCliente = false; // ya no lo tratamos como cliente
      }
      this.enviadoPorCliente = false; // desactivamos también el flag del @Input
    }

    this.emitAutosave();

    this.continuar.emit({
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

      // ✅ Unificado con lo que usa el HTML
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

      if (mod.nombre === 'ESTRIBOS LATERALES O TALONERAS') {
        // invalido = true si faltan selecciones
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
      }

      if (mod.nombre === 'SUSTITUCIÓN DE EJES') {
        const valido =
          mod.detalle?.sustitucionEjeDelantero ||
          mod.detalle?.sustitucionEjeTrasero;
        invalido = !valido;
      }

      if (mod.nombre === 'MOBILIARIO INTERIOR VEHÍCULO') {
        const valido =
          mod.opcionesMueble?.muebleBajo ||
          mod.opcionesMueble?.muebleAlto ||
          mod.opcionesMueble?.aseo;
        invalido = !valido;
      }

      this.erroresSubopciones[index] = invalido;
      if (invalido) esValido = false;
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

    // ✅ Unificado con el HTML
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
