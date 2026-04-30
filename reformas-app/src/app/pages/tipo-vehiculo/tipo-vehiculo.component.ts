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
import { CommonModule } from '@angular/common';

interface GrupoModificacion {
  nombre: string;
  seleccionado: boolean; // El checkbox "padre"
  items: string[]; // Los nombres exactos de tus mods
}

@Component({
  selector: 'app-tipo-vehiculo',
  imports: [FormsModule, CommonModule],
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
  private readonly comparadorAlfabetico = new Intl.Collator('es', {
    sensitivity: 'base',
    numeric: true,
  });

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
      label: 'Intermitentes delanteros',
    },
    {
      key: 'intermitenteTrasero',
      label: 'Intermitentes traseros',
    },
    { key: 'catadioptrico', label: 'Catadióptrico posterior' },
    { key: 'luzMatricula', label: 'Luz de matrícula' },
    { key: 'luzAntinieblas', label: 'Luz antiniebla delantera' },
    { key: 'luzFreno', label: 'Luz de freno trasero' },
  ];

  // === Detecta "cliente" tanto por datosPrevios como por el @Input dedicado ===
  private get esCliente(): boolean {
    return !!this.enviadoPorCliente || !!this.datosPrevios?.enviadoPorCliente;
  }

  private resetPorCliente(): void {
    // Si el cliente ya eligió un tipo, usamos ese tipo pero con VUESTRA lista (como admin)
    if (this.datosPrevios?.tipoVehiculo) {
      this.tipoVehiculo = this.datosPrevios.tipoVehiculo;
      this.modificaciones = this.ordenarModificacionesAlfabeticamente(
        this.obtenerModificacionesPorTipo(this.tipoVehiculo).map((m) =>
          this.normalizarModificacion(m),
        ),
      );
    } else {
      // Si no hay tipo, empezamos vacío
      this.tipoVehiculo = '';
      this.modificaciones = [];
    }

    this.erroresSubopciones = new Array(this.modificaciones.length).fill(false);
    this.haAplicadoResetPorCliente = true; // <- ya no volveremos a pisar la selección del usuario
    this.refreshSnapshot();
    this.actualizarEstadoGrupos();
  }

  // Carga todas las opciones disponibles para el tipo y marca las que venían guardadas
  private cargarYFusionarModificaciones(
    tipo: string,
    guardadas: any[],
  ): Modificacion[] {
    // 1. Obtenemos la plantilla completa (todas las opciones posibles para este vehículo)
    const plantillaCompleta = this.obtenerModificacionesPorTipo(tipo);

    // 2. Recorremos la plantilla y buscamos si hay datos guardados para cada ítem
    const modificaciones = plantillaCompleta.map((modBase) => {
      const encontrada = guardadas.find((g) => g.nombre === modBase.nombre);

      if (encontrada) {
        // Si existe en lo guardado, usamos los datos guardados (normalizados)
        return this.normalizarModificacion(encontrada);
      } else {
        // Si no existe, usamos la opción base (desmarcada)
        return this.normalizarModificacion(modBase);
      }
    });

    return this.ordenarModificacionesAlfabeticamente(modificaciones);
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
      this.modificaciones = this.cargarYFusionarModificaciones(
        this.tipoVehiculo,
        this.datosPrevios.modificaciones || [],
      );
    } else if (!this.esCliente) {
      // Proyecto nuevo del admin
      this.tipoVehiculo = '';
      this.modificaciones = [];
    }

    this.refreshSnapshot();
    this.actualizarEstadoGrupos();
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
      if (this.tipoVehiculo && Array.isArray(nuevos.modificaciones)) {
        this.modificaciones = this.cargarYFusionarModificaciones(
          this.tipoVehiculo,
          nuevos.modificaciones,
        );
      } else if (Array.isArray(nuevos.modificaciones)) {
        // Fallback por si no hay tipo definido aún (raro, pero posible)
        this.modificaciones = this.ordenarModificacionesAlfabeticamente(
          nuevos.modificaciones.map((mod: any) =>
            this.normalizarModificacion(mod),
          ),
        );
      }
      this.refreshSnapshot();
      this.actualizarEstadoGrupos();
      this.emitAutosave();
    }
  }

  onCambioGrupo(grupo: GrupoModificacion): void {
    // Si el usuario ha desmarcado el grupo, desmarcamos todos sus hijos
    if (!grupo.seleccionado) {
      grupo.items.forEach((nombreItem) => {
        const mod = this.modificaciones.find((m) => m.nombre === nombreItem);
        if (mod) {
          mod.seleccionado = false;
          // Opcional: Si quieres limpiar detalles al cerrar sección, hazlo aquí.
          // Por ejemplo:
          // if (mod.detalle) { ...resetear detalle... }
        }
      });
    }

    // Si el usuario lo ha marcado (grupo.seleccionado = true), no hacemos nada especial con los hijos,
    // simplemente dejamos que el grupo se quede en 'true' para que el *ngIf del HTML muestre el contenido.

    this.refreshSnapshot();
    this.emitAutosave();
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
        luzFreno: false,
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
    if (mod.nombre === 'MATRÍCULA Y PORTAMATRÍCULA' && !mod.detalle) {
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
      if (typeof mod.ejeDelantero !== 'boolean')
        mod.ejeDelantero = !!mod.ejeDelantero;
      if (typeof mod.ejeTotal !== 'boolean') mod.ejeTotal = !!mod.ejeTotal;
    }

    // Mobiliario
    if (mod.nombre === 'MOBILIARIO INTERIOR VEHÍCULO' && !mod.opcionesMueble) {
      mod.opcionesMueble = {
        muebleBajo: false,
        muebleAlto: false,
        aseo: false,
      };
    }

    if (
      mod.nombre === 'INSTALACIÓN ELÉCTRICA' &&
      !Array.isArray(mod.placasSolares)
    ) {
      mod.placasSolares = [];
    }

    if (mod.nombre === 'INSTALACIÓN ELÉCTRICA') {
      mod.anotacion = mod.anotacion === true;
    }

    if (mod.nombre === 'CAMPO LIBRE SOBRE REFORMAS NO EXISTENTES') {
      if (!Array.isArray(mod.reformasAdicionalesItems)) {
        mod.reformasAdicionalesItems = [];
      }

      if (
        mod.reformasAdicionalesItems.length === 0 &&
        typeof mod.reformasAdicionales === 'string' &&
        mod.reformasAdicionales.trim()
      ) {
        mod.reformasAdicionalesItems = mod.reformasAdicionales
          .split(/\r?\n/)
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0)
          .map((line: string) => ({
            titulo: '',
            descripcion: line,
          }));
      }
    }

    return mod;
  }

  private emitAutosave() {
    this.autosave.emit({
      tipoVehiculo: this.tipoVehiculo,
      modificaciones: this.modificaciones,
    });
  }

  private ordenarModificacionesAlfabeticamente(
    modificaciones: Modificacion[],
  ): Modificacion[] {
    return [...modificaciones].sort((a, b) =>
      this.comparadorAlfabetico.compare(a?.nombre ?? '', b?.nombre ?? ''),
    );
  }

  onTipoCambio(): void {
    this.modificaciones = this.ordenarModificacionesAlfabeticamente(
      this.obtenerModificacionesPorTipo(this.tipoVehiculo).map((mod) =>
        this.normalizarModificacion(mod),
      ),
    );

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
      case 'industrial':
        return [
          {
            nombre: '3ª LUZ DE FRENO',
            seleccionado: false,
          },
          {
            nombre: 'ALERÓN',
            seleccionado: false,
          },
          {
            nombre: 'LIP DELANTERO',
            seleccionado: false,
          },
          {
            nombre: 'CANARD',
            seleccionado: false,
          },
          {
            nombre: 'CAMBIO DE ASIENTOS',
            seleccionado: false,
          },
          {
            nombre: 'BARRAS ANTIVUELCO',
            seleccionado: false,
          },
          {
            nombre: 'TECHO SOLAR',
            seleccionado: false,
          },
          {
            nombre: 'PELDAÑOS',
            seleccionado: false,
          },
          {
            nombre: 'VENTANA ABATIBLE',
            seleccionado: false,
          },
          {
            nombre: 'BODY LIFT',
            seleccionado: false,
          },
          {
            nombre: 'LATIGUILLOS',
            seleccionado: false,
          },
          {
            nombre: 'MOTOR',
            seleccionado: false,
          },
          {
            nombre: 'ALETINES Y SOBREALETINES',
            seleccionado: false,
            detalle: { aletines: false, sobrealetines: false },
          },
          {
            nombre: 'AMORTIGUADOR DE DIRECCIÓN',
            seleccionado: false,
          },
          {
            nombre: 'ANTIEMPOTRAMIENTO',
            seleccionado: false,
          },
          {
            nombre: 'ANTINIEBLA',
            seleccionado: false,
          },
          {
            nombre: 'AUMENTO DE PLAZAS',
            seleccionado: false,
          },
          {
            nombre: 'BARRA DE DIRECCIÓN',
            seleccionado: false,
          },
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
          {
            nombre: 'CABRESTANTE',
            seleccionado: false,
          },
          {
            nombre: 'CALANDRA',
            seleccionado: false,
          },
          {
            nombre: 'DEFENSA DELANTERA',
            seleccionado: false,
          },
          {
            nombre: 'DIFUSOR TRASERO',
            seleccionado: false,
          },
          {
            nombre: 'DIURNAS',
            seleccionado: false,
          },
          {
            nombre: 'ESTRIBOS LATERALES O TALONERAS',
            seleccionado: false,
            detalle: {
              estribosotaloneras: false,
              anotacionAntideslizante: '2',
            },
          },
          {
            nombre: 'FAROS DELANTEROS PRINCIPALES',
            seleccionado: false,
          },
          {
            nombre: 'INTERCOOLER',
            seleccionado: false,
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
            nombre: 'LUCES DE LARGO ALCANCE',
            seleccionado: false,
          },
          {
            nombre: 'LUCES MATRÍCULA',
            seleccionado: false,
          },
          {
            nombre: 'LUZ DE CRUCE',
            seleccionado: false,
          },
          {
            nombre: 'LUZ DE POSICIÓN',
            seleccionado: false,
          },
          {
            nombre: 'LUZ MARCHA ATRÁS',
            seleccionado: false,
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
          {
            nombre: 'NEUMÁTICOS',
            seleccionado: false,
            anotacion1: false,
            anotacion2: false,
          },
          {
            nombre: 'PANEL RELOJES',
            seleccionado: false,
          },
          {
            nombre: 'PARAGOLPES DELANTERO',
            seleccionado: false,
          },
          {
            nombre: 'PARAGOLPES TRASERO',
            seleccionado: false,
          },
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
            nombre: 'PLANCHA CAPÓ',
            seleccionado: false,
          },
          {
            nombre: 'PROTECTORES PARAGOLPES',
            seleccionado: false,
          },
          {
            nombre: 'REDUCCIÓN DE MMA',
            seleccionado: false,
          },
          {
            nombre: 'REDUCCIÓN DE MMTA',
            seleccionado: false,
          },
          {
            nombre: 'REDUCCIÓN DE PLAZAS',
            seleccionado: false,
          },
          {
            nombre: 'REFUERZO PARAGOLPES',
            seleccionado: false,
          },
          {
            nombre: 'REMOLQUE HOMOLOGADO EN EMPLAZAMIENTO NO HOMOLOGADO',
            seleccionado: false,
          },
          {
            nombre: 'REMOLQUE HOMOLOGADO EN EMPLAZAMIENTO TAMBIÉN HOMOLOGADO',
            seleccionado: false,
          },
          {
            nombre: 'SEPARADORES DE RUEDA',
            seleccionado: false,
          },
          {
            nombre: 'SNORKEL',
            seleccionado: false,
          },
          {
            nombre: 'SOPORTE PARA RUEDA DE REPUESTO',
            seleccionado: false,
          },
          {
            nombre: 'SOPORTES PARA LUCES DE USO ESPECÍFICO',
            seleccionado: false,
          },
          {
            nombre: 'SUSTITUCIÓN DE DISCOS DE FRENO',
            seleccionado: false,
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
            nombre: 'SUSTITUCIÓN DE SISTEMA DE ESCAPE',
            seleccionado: false,
          },
          {
            nombre: 'SUSTITUCIÓN DE VOLANTE',
            seleccionado: false,
          },
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
            nombre: 'CAMPO LIBRE SOBRE REFORMAS NO EXISTENTES',
            seleccionado: false,
          },
          {
            nombre: 'VENTANA LATERAL',
            seleccionado: false,
          },
        ];
      case 'moto':
        return [
          {
            nombre: 'PROTECTORES PARAGOLPES',
            seleccionado: false,
          },
          { nombre: 'ASIENTO', seleccionado: false },
          {
            nombre: 'CABRESTANTE',
            seleccionado: false,
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
          {
            nombre: 'CAMPO LIBRE SOBRE REFORMAS NO EXISTENTES',
            seleccionado: false,
          },
          {
            nombre: 'REMOLQUE HOMOLOGADO EN EMPLAZAMIENTO NO HOMOLOGADO',
            seleccionado: false,
          },
          {
            nombre: 'REMOLQUE HOMOLOGADO EN EMPLAZAMIENTO TAMBIÉN HOMOLOGADO',
            seleccionado: false,
          },
          {
            nombre: 'DISCO DE FRENO Y PINZA DE FRENO',
            seleccionado: false,
            // usamos claves que el HTML espera
            tieneDisco: false,
            tienePastilla: false,
          },
          { nombre: 'ESTRIBERAS', seleccionado: false },
          { nombre: 'HORQUILLA DELANTERA', seleccionado: false },
          { nombre: 'LATIGUILLOS', seleccionado: false },
          { nombre: 'LLANTAS Y NEUMÁTICOS', seleccionado: false },
          { nombre: 'MODIFICACION DE CHASIS', seleccionado: false },
          {
            nombre: 'MOTOR',
            seleccionado: false,
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
              luzFreno: false,
            },
          },
          { nombre: 'MANDO ACELERADOR', seleccionado: false },
          { nombre: 'MANDOS LUCES', seleccionado: false },
          { nombre: 'MANILLAR', seleccionado: false },
          { nombre: 'RECORTE SUBCHASIS', seleccionado: false },
          { nombre: 'AUMENTO DE PLAZAS', seleccionado: false },
          { nombre: 'REDUCCIÓN DE PLAZAS MOTO', seleccionado: false },
          {
            nombre: 'REDUCCIÓN MMA Y MMTA',
            seleccionado: false,

            ejeDelantero: false,
            ejeTotal: false,
          },
          { nombre: 'RETROVISORES', seleccionado: false },
          { nombre: 'SOPORTE MATRÍCULA', seleccionado: false },
          { nombre: 'SOPORTES DESPLAZADOS', seleccionado: false },
          //{ nombre: 'SUSPENSIÓN', seleccionado: false },
          { nombre: 'SUSTITUCIÓN DE BASCULANTE', seleccionado: false },
          { nombre: 'SUSTITUCIÓN DE BOMBA DE FRENO', seleccionado: false },
          { nombre: 'SUSTITUCIÓN DE DEPÓSITO', seleccionado: false },
          {
            nombre: 'SUSTITUCIÓN GUARDABARROS',
            seleccionado: false,
            guardabarrosDelantero: false,
            guardabarrosTrasero: false,
          },
          { nombre: 'TORRETAS', seleccionado: false },
          { nombre: 'VELOCÍMETRO', seleccionado: false },
        ];
      case 'camper':
        return [
          {
            nombre: 'SUSTITUCIÓN DE DISCOS DE FRENO',
            seleccionado: false,
          },
          {
            nombre: 'PLANCHA CAPÓ',
            seleccionado: false,
          },
          {
            nombre: 'CAMPO LIBRE SOBRE REFORMAS NO EXISTENTES',
            seleccionado: false,
          },
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
            nombre: 'SEPARADORES DE RUEDA',
            seleccionado: false,
          },
          {
            nombre: 'SOPORTES PARA LUCES DE USO ESPECÍFICO',
            seleccionado: false,
          },
          {
            nombre: 'ANTIEMPOTRAMIENTO',
            seleccionado: false,
          },
          {
            nombre: 'NEUMÁTICOS',
            seleccionado: false,
            anotacion1: false,
            anotacion2: false,
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
          {
            nombre: 'BARRA DE DIRECCIÓN',
            seleccionado: false,
          },
          {
            nombre: 'ALERÓN',
            seleccionado: false,
          },
          {
            nombre: 'LIP DELANTERO',
            seleccionado: false,
          },
          {
            nombre: 'CANARD',
            seleccionado: false,
          },
          {
            nombre: 'CAMBIO DE ASIENTOS',
            seleccionado: false,
          },
          {
            nombre: 'BARRAS ANTIVUELCO',
            seleccionado: false,
          },
          {
            nombre: 'TECHO SOLAR',
            seleccionado: false,
          },
          {
            nombre: 'PELDAÑOS',
            seleccionado: false,
          },
          {
            nombre: 'VENTANA ABATIBLE',
            seleccionado: false,
          },
          {
            nombre: 'BODY LIFT',
            seleccionado: false,
          },
          {
            nombre: 'LATIGUILLOS',
            seleccionado: false,
          },
          {
            nombre: 'MOTOR',
            seleccionado: false,
          },
          {
            nombre: 'AMORTIGUADOR DE DIRECCIÓN',
            seleccionado: false,
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
            nombre:
              'BARRA PARA REGULAR LA CONVERGENCIA DE LAS RUEDAS (alineamiento)',
            seleccionado: false,
          },
          {
            nombre:
              'BARRA PARA REGULAR LA CONVERGENCIA DE LAS RUEDAS (movimiento lateral)',
            seleccionado: false,
          },
          {
            nombre: 'CABRESTANTE',
            seleccionado: false,
          },
          {
            nombre: 'CALANDRA',
            seleccionado: false,
          },
          {
            nombre: 'SOPORTE PARA RUEDA DE REPUESTO',
            seleccionado: false,
          },
          {
            nombre: 'ESTRIBOS LATERALES O TALONERAS',
            seleccionado: false,
            detalle: {
              estribosotaloneras: false,
              anotacionAntideslizante: '2',
            },
          },
          {
            nombre: 'ALETINES Y SOBREALETINES',
            seleccionado: false,
            detalle: { aletines: false, sobrealetines: false },
          },
          {
            nombre: 'PARAGOLPES DELANTERO',
            seleccionado: false,
          },
          {
            nombre: 'PARAGOLPES TRASERO',
            seleccionado: false,
          },
          {
            nombre: 'DIFUSOR TRASERO',
            seleccionado: false,
          },
          {
            nombre: 'SUSTITUCIÓN DE VOLANTE',
            seleccionado: false,
          },
          {
            nombre: 'REDUCCIÓN DE MMA',
            seleccionado: false,
          },
          {
            nombre: 'REDUCCIÓN DE MMTA',
            seleccionado: false,
          },
          {
            nombre: 'PANEL RELOJES',
            seleccionado: false,
          },
          { nombre: 'ANTENA', seleccionado: false },
          {
            nombre: 'AUMENTO O DISMINUCIÓN DE PLAZAS',
            seleccionado: false,
            tipoCambio: null,
          },
          { nombre: 'BANQUETA', seleccionado: false },
          { nombre: 'BOMBA DE AGUA', seleccionado: false },
          { nombre: 'CALEFACCIÓN ESTACIONARIA', seleccionado: false },
          { nombre: 'CAMBIO DE CLASIFICACIÓN', seleccionado: false },
          { nombre: 'CLARABOYA', seleccionado: false },
          { nombre: 'DEFENSA DELANTERA', seleccionado: false },
          { nombre: 'DEPÓSITO DE AGUA LIMPIA', seleccionado: false },
          { nombre: 'DEPÓSITO DE AGUA SUCIA', seleccionado: false },
          { nombre: 'DUCHA EXTERIOR', seleccionado: false, anotacion: false },
          { nombre: 'ENGANCHE REMOLQUE', seleccionado: false },
          { nombre: 'INSTALACIÓN DE BASES GIRATORIAS', seleccionado: false },
          {
            nombre: 'INSTALACIÓN DE TERMO',
            seleccionado: false,
            anotacion: false,
          },
          {
            nombre: 'INTERCOOLER',
            seleccionado: false,
          },
          {
            nombre: 'INSTALACIÓN ELÉCTRICA',
            seleccionado: false,
            anotacion: false,
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
            nombre: 'LUCES DE LARGO ALCANCE',
            seleccionado: false,
          },
          {
            nombre: 'LUCES MATRÍCULA',
            seleccionado: false,
          },
          {
            nombre: 'LUZ DE CRUCE',
            seleccionado: false,
          },
          {
            nombre: 'LUZ DE POSICIÓN',
            seleccionado: false,
          },
          {
            nombre: 'LUZ MARCHA ATRÁS',
            seleccionado: false,
          },
          {
            nombre: 'MOBILIARIO INTERIOR VEHÍCULO',
            seleccionado: false,
            opcionesMueble: {
              muebleBajo: false,
              muebleAlto: false,
              aseo: false,
            },
          },
          { nombre: 'REGISTRO DE LLENADO DE AGUA', seleccionado: false },
          { nombre: 'REVESTIMIENTO INTERIOR', seleccionado: false },
          { nombre: 'SNORKEL', seleccionado: false },
          {
            nombre: 'SUSTITUCIÓN DE SISTEMA DE ESCAPE',
            seleccionado: false,
          },
          {
            nombre:
              'SUSTITUCIÓN DE BANQUETA DE ASIENTOS POR ASIENTO INDIVIDUAL',
            seleccionado: false,
          },
          { nombre: 'TECHO ELEVABLE', seleccionado: false },
          { nombre: 'TOLDO', seleccionado: false },
          { nombre: 'TOMA EXTERIOR 230V', seleccionado: false },
          { nombre: 'VENTANA', seleccionado: false },
        ];
      default:
        return [];
    }
  }

  grupos: GrupoModificacion[] = [
    {
      nombre: 'ILUMINACIÓN Y SEÑALIZACIÓN',
      seleccionado: false,
      items: [
        'LUCES',
        'ANTINIEBLA',
        '3ª LUZ DE FRENO',
        'DIURNAS',
        'INTERMITENTES',
        'LUCES DE LARGO ALCANCE',
        'LUCES MATRÍCULA',
        'LUZ DE CRUCE',
        'LUZ DE POSICIÓN',
        'LUZ MARCHA ATRÁS',
        'PILOTO TRASERO',
        'SOPORTES PARA LUCES DE USO ESPECÍFICO',
        'FAROS DELANTEROS PRINCIPALES',
      ],
    },
    {
      nombre: 'CARROCERÍA EXTERIOR',
      seleccionado: false,
      items: [
        'ALETINES Y SOBREALETINES',
        'CALANDRA',
        'ALERÓN',
        'LIP DELANTERO',
        'CANARD',
        'TECHO SOLAR',
        'VENTANA ABATIBLE',
        'PELDAÑOS',
        'DEFENSA DELANTERA',
        'DIFUSOR TRASERO',
        'ESTRIBOS LATERALES O TALONERAS',
        'PARAGOLPES DELANTERO',
        'PARAGOLPES TRASERO',
        'PROTECTORES PARAGOLPES',
        'REFUERZO PARAGOLPES',
        'SNORKEL',
        'SOPORTE PARA RUEDA DE REPUESTO',
        'PLANCHA CAPÓ',
        'MATRÍCULA Y PORTAMATRÍCULA',
        'SOPORTE MATRÍCULA',
        'CABRESTANTE',
        'ANTIEMPOTRAMIENTO',
        'ANTENA',
        'TOLDO',
        'TECHO ELEVABLE',
      ],
    },
    {
      nombre: 'SUSPENSIÓN, EJES Y RUEDAS',
      seleccionado: false,
      items: [
        'BODY LIFT',
        'NEUMÁTICOS',
        'LLANTAS Y NEUMÁTICOS',
        'SEPARADORES DE RUEDA',
        'SUSTITUCIÓN DE EJES',
        'AMORTIGUADOR DE DIRECCIÓN',
        'BARRA DE DIRECCIÓN',
        'BARRA PARA REGULAR LA CONVERGENCIA DE LAS RUEDAS (alineamiento)',
        'BARRA PARA REGULAR LA CONVERGENCIA DE LAS RUEDAS (movimiento lateral)',
        'TODA LA CASUÍSTICA DE MUELLES, BALLESTAS Y AMORTIGUADORES QUE SE PUEDEN DAR',
        'SUSTITUCIÓN DE BASCULANTE',
        'HORQUILLA DELANTERA',
        'TORRETAS',
      ],
    },
    {
      nombre: 'FRENOS',
      seleccionado: false,
      items: [
        'DISCO DE FRENO Y PINZA DE FRENO',
        'SUSTITUCIÓN DE DISCOS DE FRENO',
        'SUSTITUCIÓN DE BOMBA DE FRENO',
        'LATIGUILLOS',
      ],
    },
    {
      nombre: 'INTERIOR Y CONFORT',
      seleccionado: false,
      items: [
        'MOBILIARIO INTERIOR VEHÍCULO',
        'CAMBIO DE ASIENTOS',
        'SUSTITUCIÓN DE VOLANTE',
        'PANEL RELOJES',
        'ASIENTO',
        'BANQUETA',
        'SUSTITUCIÓN DE BANQUETA DE ASIENTOS POR ASIENTO INDIVIDUAL',
        'REVESTIMIENTO INTERIOR',
        'CALEFACCIÓN ESTACIONARIA',
        'INSTALACIÓN DE BASES GIRATORIAS',
      ],
    },
    {
      nombre: 'INSTALACIONES Y AGUA',
      seleccionado: false,
      items: [
        'INSTALACIÓN ELÉCTRICA',
        'BOMBA DE AGUA',
        'DEPÓSITO DE AGUA LIMPIA',
        'DEPÓSITO DE AGUA SUCIA',
        'DUCHA EXTERIOR',
        'INSTALACIÓN DE TERMO',
        'REGISTRO DE LLENADO DE AGUA',
        'TOMA EXTERIOR 230V',
      ],
    },
    {
      nombre: 'CARROCERÍA Y CHASIS (ESTRUCTURAL)',
      seleccionado: false,
      items: [
        'VENTANA',
        'CLARABOYA',
        'MODIFICACION DE CHASIS',
        'AUMENTO DE PLAZAS',
        'REDUCCIÓN DE PLAZAS',
        'BARRAS ANTIVUELCO',
        'CAMBIO DE ASIENTOS',
        'AUMENTO O DISMINUCIÓN DE PLAZAS',
        'RECORTE SUBCHASIS',
        'SUSTITUCIÓN GUARDABARROS',
        'SOPORTES DESPLAZADOS',
        'ENGANCHE REMOLQUE',
        'REMOLQUE HOMOLOGADO EN EMPLAZAMIENTO NO HOMOLOGADO',
        'REMOLQUE HOMOLOGADO EN EMPLAZAMIENTO TAMBIÉN HOMOLOGADO',
        'MANDO ACELERADOR',
        'MANDOS LUCES',
        'MANILLAR',
        'VELOCÍMETRO',
      ],
    },
    {
      nombre: 'MOTOR Y TÉCNICO',
      seleccionado: false,
      items: [
        'INTERCOOLER',
        'MOTOR',
        'SUSTITUCIÓN DE SISTEMA DE ESCAPE',
        'SUSTITUCIÓN DE DEPÓSITO',
      ],
    },
  ];

  getModsDeGrupo(itemsGrupo: string[]) {
    return this.modificaciones.filter((m) => itemsGrupo.includes(m.nombre));
  }

  getModsSinGrupo() {
    const todosLosItemsAgrupados = this.grupos.flatMap((g) => g.items);
    return this.modificaciones.filter(
      (m) => !todosLosItemsAgrupados.includes(m.nombre),
    );
  }

  gestionarIntermitenteDesdeFaro(
    valorSeleccionado: string | null | undefined,
  ): void {
    if (valorSeleccionado === '1') {
      const intermitentesMod = this.modificaciones.find(
        (m) => m.nombre === 'INTERMITENTES',
      );

      if (intermitentesMod) {
        intermitentesMod.seleccionado = true;

        if (!intermitentesMod.detalle) {
          intermitentesMod.detalle = {
            interDelantero: false,
            interTrasero: false,
            interLateral: false,
          };
        }

        intermitentesMod.detalle.interDelantero = true;

        this.emitAutosave();
      }
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
        (mod.nombre === 'MATRÍCULA Y PORTAMATRÍCULA' ||
          mod.nombre.includes('ALETINES')) &&
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
        invalido = false;
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

  private actualizarEstadoGrupos(): void {
    if (!this.grupos || !this.modificaciones) return;

    this.grupos.forEach((grupo) => {
      const hayHijaSeleccionada = this.modificaciones.some(
        (mod) => mod.seleccionado && grupo.items.includes(mod.nombre),
      );

      if (hayHijaSeleccionada) {
        grupo.seleccionado = true;
      }
    });
  }

  actualizarError(index: number, mod: Modificacion): void {
    let invalido = false;

    if (mod.nombre.includes('MUELLES') && mod.detallesMuelles) {
      invalido = !Object.values(mod.detallesMuelles).some((v) => v);
    }

    if (
      (mod.nombre === 'MATRÍCULA Y PORTAMATRÍCULA' ||
        mod.nombre.includes('ALETINES')) &&
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
      invalido = false;
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
