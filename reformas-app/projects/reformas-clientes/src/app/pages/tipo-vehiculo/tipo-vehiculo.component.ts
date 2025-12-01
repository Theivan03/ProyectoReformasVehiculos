import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Modificacion } from '../../interfaces/modificacion';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tipo-vehiculo',
  imports: [FormsModule, CommonModule],
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

  // Añade estas propiedades
  mostrarPreseleccion: boolean = true; // Pantalla previa visible al inicio
  opcionesVehiculo = [
    { value: 'coche', label: 'Coche', img: 'assets/cocheportada.jpg' },
    { value: 'moto', label: 'Moto', img: 'assets/moto.jpg' },
    { value: 'camper', label: 'Camper', img: 'assets/camper.jpg' },
    {
      value: 'industrial',
      label: 'Industrial',
      img: 'assets/industrial.jpg',
    },
  ];

  detalleRuedas = [
    { key: 'neumaticos', label: 'Neumaticos y llantas' },
    { key: 'separadoresDeRueda', label: 'Separadores de rueda' },
  ];

  detallesMuellesOpciones = [
    { key: 'muelleDelantero', label: 'Muelle delantero' },
    { key: 'muelleTrasero', label: 'Muelle trasero' },
    { key: 'ballestaDelantera', label: 'Ballesta delantera' },
    { key: 'ballestaTrasera', label: 'Ballesta trasera' },
    { key: 'amortiguadorDelantero', label: 'Amortiguador delantero' },
    { key: 'amortiguadorTrasero', label: 'Amortiguador trasero' },
    { key: 'suplementoSusDelantero', label: 'Suplemento suspensión delantero' },
    { key: 'suplementoSusTrasero', label: 'Suplemento suspensión trasero' },
  ];

  detalleCarroceria = [
    { key: 'paragolpesDelantero', label: 'Paragolpes delantero' },
    { key: 'paragolpesTrasero', label: 'Paragolpes trasero' },
    { key: 'aleron', label: 'Alerón' },
    { key: 'lip', label: 'Lip delantero' },
    { key: 'canard', label: 'Canards' },
    { key: 'capo', label: 'Capó' },
    { key: 'difusor', label: 'Difusor' },
    { key: 'asientos', label: 'Asientos' },
    { key: 'barrasAntivuelco', label: 'Barras antivuelco' },
    { key: 'techoSolar', label: 'Techo solar' },
    { key: 'aletinesYSobrealetines', label: 'Aletines y sobrealetines' },
    { key: 'snorkel', label: 'Snorkel' },
    { key: 'peldaños', label: 'Peldaños' },
    { key: 'talonerasEstribos', label: 'Taloneras / Estribos' },
    { key: 'matriculaDelanteraPequeña', label: 'Matrícula delantera pequeña' },
    { key: 'cabrestante', label: 'Cabrestante' },
    { key: 'barraAntiempotramiento', label: 'Barra Antiempotramiento' },
    { key: 'defensaDelantera', label: 'Defensa delantera' },
    { key: 'soporteRuedaRepuesto', label: 'Soporte de rueda de repuesto' },
    { key: 'bodyLift', label: 'Body lift' },
  ];

  opcionesDescripcionLuces = [
    { key: 'faroDelantero', label: 'Faro delantero' },
    { key: 'largoAlcance', label: 'Largo alcance' },
    { key: 'antiniebla', label: 'Antiniebla' },
    {
      key: 'PilotoTrasero',
      label: 'Piloto trasero',
    },
    {
      key: 'intermitentesLaterales',
      label: 'Intermitentes laterales',
    },
    { key: 'focosDeTrabajo', label: 'Focos de trabajo' },
  ];

  detalleDireccion = [
    { key: 'volanteYPiña', label: 'Volante y piña' },
    {
      key: 'barraDeDireccion',
      label: 'Barra de dirección',
    },
    {
      key: 'amortiguadorDeDireccion',
      label: 'Amortiguación de dirección',
    },
    { key: 'sustitucionDeEjes', label: 'Sustitución de ejes' },
  ];

  detalleFrenos = [
    { key: 'tamborPorDisco', label: 'Tambor por disco' },
    {
      key: 'discosPerforadosRayados',
      label: 'Discos perforados/rayados',
    },
    {
      key: 'latiguillos',
      label: 'Latiguillos',
    },
    { key: 'bomba', label: 'Bomba' },
  ];

  detalleUnidadMotriz = [
    { key: 'cambioDeMotor', label: 'Motor' },
    {
      key: 'CambioCajaCambios',
      label: 'Caja de cambios',
    },
    {
      key: 'cambioEscape',
      label: 'Sistema de escape',
    },
    {
      key: 'colaEscape',
      label: 'Ssolamente cola de escape',
    },
    {
      key: 'ampliacionNDepositosCombustible',
      label: 'Ampliación número de depósitos de combustible',
    },
  ];

  detalleRuedasMotos = [
    { key: 'neumaticosMoto', label: 'Neumaticos y llantas' },
    { key: 'separadoresDeRuedaMoto', label: 'Separadores de rueda(Quads)' },
  ];

  detallesSuspensionesMotos = [
    { key: 'horquillaDelanteraMoto', label: 'Horquilla delanteracarro' },
    { key: 'muelleDelanteroMoto', label: 'Muelle delantero' },
    { key: 'muelleTraseroMoto', label: 'Muelle trasero' },
    { key: 'amortiguadorDelanteroMoto', label: 'Amortiguador delantero' },
    { key: 'amortiguadorTraseroMoto', label: 'Amortiguador trasero' },
  ];

  detallesCarroceriaMoto = [
    { key: 'guardabarrosDelanteroMoto', label: 'Guardabarros delantero' },
    { key: 'guardabarrosTraseroMoto', label: 'Guardabarros trasero' },
    { key: 'estribosMoto', label: 'Estribos' },
    { key: 'cabrestanteMoto', label: 'Cabrestante (quads)' },
    {
      key: 'cambioPlacaDeMatriculaMoto',
      label: 'Cambio de placa de matricula',
    },
    { key: 'retrovisoresMoto', label: 'Retrovisores' },
    { key: 'carenadoMoto', label: 'Carenado' },
    { key: 'depositoDeCombustibleMoto', label: 'Depósito de combustible' },
    { key: 'velocimetroMoto', label: 'Velocimetro' },
    { key: 'manillarMoto', label: 'Manillar' },
    { key: 'sillinMoto', label: 'Sillin' },
    { key: 'mandosAdelantadosMoto', label: 'Mandos adelantados' },
    { key: 'asiderosParaPasajeroMoto', label: 'Asideros para el pasajero' },
  ];

  detalleChasisSubchasisMotos = [
    { key: 'recorteSubchasisMoto', label: 'Recorte de subchasis' },
    { key: 'modificacionDeChasisMoto', label: 'Modificación del chasis' },
  ];

  opcionesDescripcionLucesMoto = [
    { key: 'faroDelanteroMoto', label: 'Faro delantero' },
    {
      key: 'PilotoTraseroMoto',
      label: 'Piloto trasero',
    },
    {
      key: 'luzDeMatriculaMoto',
      label: 'Luz de matrícula',
    },
    { key: 'catadriopticoTraseroMoto', label: 'Catadióptrico trasero' },
    {
      key: 'intermitentesMoto',
      label: 'Intermitentes',
    },
  ];

  detalleFrenosMoto = [
    { key: 'tamborPorDiscoMoto', label: 'Tambor por disco' },
    {
      key: 'discosPerforadosRayadosMoto',
      label: 'Discos perforados/rayados',
    },
    {
      key: 'latiguillosMoto',
      label: 'Latiguillos',
    },
    { key: 'bombaMoto', label: 'Bomba' },
  ];

  detalleUnidadMotrizMoto = [
    { key: 'cambioDeMotorMoto', label: 'Motor' },
    {
      key: 'CambioCajaCambiosMoto',
      label: 'Caja de cambios',
    },
    {
      key: 'cambioEscapeMoto',
      label: 'Sistema de escape',
    },
    {
      key: 'ampliacionNDepositosCombustibleMoto',
      label: 'Número de depósitos de combustible',
    },
  ];

  detalleRuedasCamper = [
    { key: 'neumaticos', label: 'Neumaticos y llantas' },
    { key: 'separadoresDeRueda', label: 'Separadores de rueda' },
  ];

  detallesSuspensionesCamper = [
    { key: 'muelleDelantero', label: 'Muelle delantero' },
    { key: 'muelleTrasero', label: 'Muelle trasero' },
    { key: 'ballestaDelantera', label: 'Ballesta delantera' },
    { key: 'ballestaTrasera', label: 'Ballesta trasera' },
    { key: 'amortiguadorDelantero', label: 'Amortiguador delantero' },
    { key: 'amortiguadorTrasero', label: 'Amortiguador trasero' },
    { key: 'suplementoSusDelantero', label: 'Suplemento suspensión delantero' },
    { key: 'suplementoSusTrasero', label: 'Suplemento suspensión trasero' },
  ];

  opcionesDescripcionMobiliarioInterior = [
    { key: 'muebleBajo', label: 'Mueble bajo' },
    {
      key: 'muebleAlto',
      label: ' Mueble alto',
    },
    {
      key: 'aseo',
      label: 'Aseo',
    },
    { key: 'estanteria', label: 'Estantería' },
    {
      key: 'cama',
      label: 'Cama',
    },
    { key: 'baseGiratoria', label: 'Bases giratorias' },
    {
      key: 'banquetaParaAumentarPlazas',
      label: 'Banqueta para aumentar plazas',
    },
    {
      key: 'ventanas',
      label: 'Ventanas',
    },
    { key: 'claraboyas', label: 'Claraboyas' },
  ];

  opcionesDescripcionFontaneria = [
    { key: 'termo', label: 'Termo' },
    {
      key: 'bombaDeAgua',
      label: 'Bomba de agua',
    },
    {
      key: 'vasoDeExpansion',
      label: 'Vaso de expansión',
    },
    { key: 'depositoAguaLimpia', label: 'Deposito de agua limpia' },
    { key: 'depositoAguaSucia', label: 'Deposito de agua sucia' },
    {
      key: 'duchaInterior',
      label: 'Ducha interior',
    },
    {
      key: 'duchaExterior',
      label: 'Ducha exterior',
    },
    { key: 'tomaDeAguaExterior', label: 'Toma de agua exterior' },
    { key: 'calefaccionDiesel', label: 'Calefacción diesel' },
  ];

  detallesInteriorVehiculo = [
    { key: 'mobiliarioInterior', label: 'Mobiliario interior' },
    { key: 'fontaneria', label: 'Fontanería' },
  ];

  detallesInstalacionElectricaCamper = [
    { key: 'placaSolar', label: 'Placa solar' },
    { key: 'inversor', label: 'Inversor' },
    { key: 'reguladorSolar', label: 'Regulador solar' },
    { key: 'cargadorDeBateria', label: 'Cargador de batería' },
    { key: 'bateriaAuxiliar', label: 'Bataría auxiliar' },
    { key: 'iluminacionExterior', label: 'Iluminación exterior' },
    { key: 'tomaCorrienteexterior', label: 'Toma de corriente exterior' },
    { key: 'tomaCorrienteInterior', label: 'Toma de corriente interior' },
  ];

  detalleCarroceriaCamper = [
    { key: 'paragolpesDelantero', label: 'Paragolpes delantero' },
    { key: 'paragolpesTrasero', label: 'Paragolpes trasero' },
    { key: 'aleron', label: 'Alerón' },
    { key: 'lip', label: 'Lip delantero' },
    { key: 'canard', label: 'Canards' },
    { key: 'capo', label: 'Capó' },
    { key: 'difusor', label: 'Difusor' },
    { key: 'asientos', label: 'Asientos' },
    { key: 'techoSolar', label: 'Techo solar' },
    { key: 'aletinesYSobrealetinesCamper', label: 'Aletines y sobrealetines' },
    { key: 'snorkel', label: 'Snorkel' },
    { key: 'peldaños', label: 'Peldaños' },
    { key: 'talonerasEstribos', label: 'Taloneras / Estribos' },
    { key: 'matriculaDelanteraPequeña', label: 'Matrícula delantera pequeña' },
    { key: 'cabrestante', label: 'Cabrestante' },
    { key: 'barraAntiempotramiento', label: 'Barra Antiempotramiento' },
    { key: 'defensaDelantera', label: 'Defensa delantera' },
    { key: 'soporteRuedaRepuesto', label: 'Soporte de rueda de repuesto' },
    { key: 'bodyLift', label: 'Body lift' },
  ];

  ngOnInit(): void {
    if (this.datosPrevios) {
      this.tipoVehiculo = this.datosPrevios.tipoVehiculo ?? '';

      // Restaurar modificaciones previas asegurando la estructura
      if (this.datosPrevios.modificaciones) {
        this.modificaciones = this.datosPrevios.modificaciones.map(
          (mod: any) => ({
            ...mod,
            detalle: mod.detalle || {}, // Asegura que detalle nunca sea null/undefined
            // Inicializar objetos específicos si no existen
            descripcionLuces:
              mod.nombre === 'Luces' ? mod.descripcionLuces || {} : undefined,
            focosTrabajo:
              mod.nombre === 'Luces' ? mod.focosTrabajo || {} : undefined,
            mobiliarioInterior: mod.nombre.includes('Interior')
              ? mod.mobiliarioInterior || {}
              : undefined,
            fontaneria: mod.nombre.includes('Interior')
              ? mod.fontaneria || {}
              : undefined,
          })
        );
      }
    }

    // Si ya venía un tipo de vehículo guardado, saltamos la preselección
    if (this.datosPrevios?.tipoVehiculo) {
      this.mostrarPreseleccion = false;
    }

    this.emitAutosave();
  }

  private emitAutosave() {
    this.autosave.emit({
      tipoVehiculo: this.tipoVehiculo,
      modificaciones: this.modificaciones,
    });
  }

  resetComponent(): void {
    this.tipoVehiculo = '';
    this.modificaciones = [];
    this.tipoVehiculoInvalido = false;
    this.erroresSubopciones = [];
    this.mostrarPreseleccion = true; // vuelve a mostrar la pantalla con 4 fotos

    this.emitAutosave(); // opcional: emite estado vacío al padre
  }

  onTipoCambio(): void {
    this.modificaciones = this.obtenerModificacionesPorTipo(this.tipoVehiculo);
    this.erroresSubopciones = new Array(this.modificaciones.length).fill(false);
    this.emitAutosave();
  }

  seleccionarTipoPrevia(tipo: string): void {
    this.tipoVehiculo = tipo; // Pre-rellena el select de la pantalla principal
    this.onTipoCambio(); // Pre-carga las modificaciones para ese tipo
    this.tipoVehiculoInvalido = false;
    this.emitAutosave(); // Mantén tu autosave
  }

  // Pasa de la pantalla previa a tu pantalla actual
  irASiguientePaso(): void {
    if (!this.tipoVehiculo?.trim()) {
      this.tipoVehiculoInvalido = true;
      return;
    }
    this.mostrarPreseleccion = false;
  }

  seleccionarTipo(tipo: string): void {
    this.tipoVehiculo = tipo;
    this.onTipoCambio(); // carga las modificaciones
    this.tipoVehiculoInvalido = false;
  }

  onCambioSubopcion(): void {
    this.emitAutosave(); // guarda cada interacción relevante
  }

  obtenerModificacionesPorTipo(tipo: string): Modificacion[] {
    switch (tipo) {
      case 'coche':
      case 'industrial':
        return [
          {
            nombre: 'Ruedas',
            seleccionado: false,
            detalle: {
              neumaticos: false,
              separadoresDeRueda: false,
            },
          },
          {
            nombre: 'Suspensión',
            seleccionado: false,
            detalle: {
              muelleDelantero: false,
              muelleTrasero: false,
              ballestaDelantera: false,
              ballestaTrasera: false,
              amortiguadorDelantero: false,
              amortiguadorTrasero: false,
              suplementoSusDelantero: false,
              suplementoSusTrasero: false,
            },
          },
          {
            nombre: 'Carrocería',
            seleccionado: false,
            detalle: {
              paragolpesDelantero: false,
              paragolpesTrasero: false,
              aleron: false,
              aletinesYSobrealetines: false,
              snorkel: false,
              peldaños: false,
              talonerasEstribos: false,
              matriculaDelanteraPequeña: false,
              cabrestante: false,
              barraAntiempotramiento: false,
              defensaDelantera: false,
              soporteRuedaRepuesto: false,
              bodyLift: false,
            },
          },
          {
            nombre: 'Luces',
            seleccionado: false,
            detalle: {
              faroDelantero: false,
              PilotoTrasero: false,
              intermitentesLaterales: false,
              focosDeTrabajo: false,
            },
            focosTrabajo: {
              paragolpesDelantero: false,
              paragolpesTrasero: false,
              parteTrasera: false,
              techo: false,
            },
          },
          {
            nombre: 'Dirección',
            seleccionado: false,
            detalle: {
              volanteYPiña: false,
              barraDeDireccion: false,
              amortiguadorDeDireccion: false,
              sustitucionDeEjes: false,
            },
          },
          {
            nombre: 'Freno',
            seleccionado: false,
            detalle: {
              tamborPorDisco: false,
              discosPerforadosRayados: false,
              latiguillos: false,
              bomba: false,
            },
          },
          {
            nombre: 'Unidad motriz',
            seleccionado: false,
            detalle: {
              cambioDeMotor: false,
              CambioCajaCambios: false,
              cambioEscape: false,
              ampliacionNDepositosCombustible: false,
            },
          },
          { nombre: 'Enganche de remolque', seleccionado: false },
          { nombre: 'Portabicicletas', seleccionado: false },
          { nombre: 'Reducción de plazas de asiento', seleccionado: false },
        ];
      case 'moto':
        return [
          {
            nombre: 'Ruedas',
            seleccionado: false,
            detalle: {
              neumaticosMoto: false,
              separadoresDeRuedaMoto: false,
            },
          },
          {
            nombre: 'Suspensión',
            seleccionado: false,
            detalle: {
              horquillaDelanteraMoto: false,
              muelleDelanteroMoto: false,
              muelleTraseroMoto: false,
              amortiguadorDelanteroMoto: false,
              amortiguadorTraseroMoto: false,
            },
          },
          {
            nombre: 'Carrocería',
            seleccionado: false,
            detalle: {
              guardabarrosDelanteroMoto: false,
              guardabarrosTraseroMoto: false,
              estribosMoto: false,
              cabrestanteMoto: false,
              cambioPlacaDeMatriculaMoto: false,
              retrovisoresMoto: false,
              carenadoMoto: false,
              depositoDeCombustibleMoto: false,
              velocimetroMoto: false,
              manillarMoto: false,
              sillinMoto: false,
              mandosAdelantadosMoto: false,
              asiderosParaPasajeroMoto: false,
            },
          },
          {
            nombre: 'Chasis y Subchasis',
            seleccionado: false,
            detalle: {
              recorteSubchasisMoto: false,
              modificacionDeChasisMoto: false,
            },
          },
          {
            nombre: 'Luces',
            seleccionado: false,
            detalle: {
              faroDelanteroMoto: false,
              PilotoTraseroMoto: false,
              luzDeMatriculaMoto: false,
              catadriopticoTraseroMoto: false,
              intermitentesMoto: false,
            },
          },

          {
            nombre: 'Freno',
            seleccionado: false,
            detalle: {
              tamborPorDiscoMoto: false,
              discosPerforadosRayadosMoto: false,
              latiguillosMoto: false,
              bombaMoto: false,
            },
          },
          {
            nombre: 'Unidad motriz',
            seleccionado: false,
            detalle: {
              cambioDeMotorMoto: false,
              CambioCajaCambiosMoto: false,
              cambioEscapeMoto: false,
              ampliacionNDepositosCombustibleMoto: false,
            },
          },
          { nombre: 'Enganche de remolque (quads)', seleccionado: false },
          { nombre: 'Reducción de plazas de asiento', seleccionado: false },
        ];
      case 'camper':
        return [
          {
            nombre: 'Ruedas',
            seleccionado: false,
            detalle: {
              neumaticosCamper: false,
              llantasCamper: false,
              separadoresDeRuedaCamper: false,
            },
          },
          {
            nombre: 'Suspensión',
            seleccionado: false,
            detalle: {
              muelleDelanteroCamper: false,
              muelleTraseroCamper: false,
              ballestasDelanterasCamper: false,
              ballestasTraserasCamper: false,
              amortiguadorDelanteroCamper: false,
              amortiguadorTraseroCamper: false,
              suplementoSuspensionDelanteroCamper: false,
              suplementoSuspensionTraseroCamper: false,
            },
          },
          {
            nombre: 'Modificaciones en el interior del vehículo',
            seleccionado: false,
            detalle: {
              mobiliarioInterior: false,
              fontaneria: false,
            },
            mobiliarioInterior: {
              muebleBajo: false,
              muebleAlto: false,
              aseo: false,
              cama: false,
              estanteria: false,
              baseGiratoria: false,
              banquetaParaAumentarPlazas: false,
              ventanas: false,
              claraboyas: false,
            },
            fontaneria: {
              termo: false,
              bombaDeAgua: false,
              vasoDeExpansion: false,
              depositoAguaLimpia: false,
              depositoAguaSucia: false,
              duchaInterior: false,
              duchaExterior: false,
              tomaDeAguaExterior: false,
              calefaccionDiesel: false,
            },
          },
          {
            nombre: 'Instalación eléctrica',
            seleccionado: false,
            detalle: {
              placaSolar: false,
              inversor: false,
              reguladorSolar: false,
              cargadorDeBateria: false,
              bateriaAuxiliar: false,
              iluminacionExterior: false,
              tomaCorrienteexterior: false,
              tomaCorrienteInterior: false,
            },
          },
          {
            nombre: 'Carrocería',
            seleccionado: false,
            detalle: {
              paragolpesDelanteroCamper: false,
              paragolpesTraseroCamper: false,
              aleronCamper: false,
              aletinesYSobrealetinesCamper: false,
              snorkelCamper: false,
              peldañosCamper: false,
              talonerasEstribosCamper: false,
              cabrestanteCamper: false,
              defensaDelanteraCamper: false,
              soporteRuedaRepuestoCamper: false,
            },
          },
          {
            nombre: 'Luces',
            seleccionado: false,
            detalle: {
              faroDelantero: false,
              PilotoTrasero: false,
              intermitentesLaterales: false,
              focosDeTrabajo: false,
            },
            focosTrabajo: {
              paragolpesDelantero: false,
              paragolpesTrasero: false,
              parteTrasera: false,
              techo: false,
            },
          },
          {
            nombre: 'Dirección',
            seleccionado: false,
            detalle: {
              volanteYPiña: false,
              barraDeDireccion: false,
              amortiguadorDeDireccion: false,
            },
          },
          {
            nombre: 'Freno',
            seleccionado: false,
            detalle: {
              tamborPorDisco: false,
              discosPerforadosRayados: false,
              latiguillos: false,
              bomba: false,
            },
          },
          {
            nombre: 'Unidad motriz',
            seleccionado: false,
            detalle: {
              cambioDeMotor: false,
              CambioCajaCambios: false,
              cambioEscape: false,
              ampliacionNDepositosCombustible: false,
            },
          },
          { nombre: 'Enganche de remolque', seleccionado: false },
          { nombre: 'Portabicicletas', seleccionado: false },

          { nombre: 'Toldo', seleccionado: false },
        ];

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

    // Notifico al padre si quieres mantenerlo
    this.volver.emit({
      tipoVehiculo: this.tipoVehiculo,
      modificaciones: this.modificaciones,
    });

    // Y vuelvo a la preselección
    this.mostrarPreseleccion = true;
  }

  borrarTodo(): void {
    this.emitAutosave(); // opcional si quieres guardar antes de borrar

    // borro todo lo interno
    this.tipoVehiculo = '';
    this.modificaciones = [];
    this.erroresSubopciones = [];
    this.tipoVehiculoInvalido = false;

    // muestro otra vez la pantalla inicial con fotos
    this.mostrarPreseleccion = true;
  }

  validarSubopciones(): boolean {
    this.erroresSubopciones = []; // Resetear errores

    let esValido = true;

    this.modificaciones.forEach((mod, index) => {
      if (!mod.seleccionado) return;

      let invalido = false;

      if (mod.tipo === 'Coche') {
        if (mod.nombre === 'Ruedas' && mod.detalle) {
          const opts = [mod.detalle.neumaticos, mod.detalle.separadoresDeRueda];
          invalido = !opts.some((v) => v);
        }

        if (mod.nombre === 'Suspensión' && mod.detalle) {
          const opts = [
            mod.detalle.muelleDelantero,
            mod.detalle.muelleTrasero,
            mod.detalle.ballestaDelantera,
            mod.detalle.ballestaTrasera,
            mod.detalle.amortiguadorDelantero,
            mod.detalle.amortiguadorTrasero,
            mod.detalle.suplementoSusDelantero,
            mod.detalle.suplementoSusTrasero,
          ];
          invalido = !opts.some((v) => v);
        }

        if (mod.nombre === 'Carrocería' && mod.detalle) {
          const opts = [
            mod.detalle.paragolpesDelantero,
            mod.detalle.paragolpesTrasero,
            mod.detalle.aleron,
            mod.detalle.aletinesYSobrealetines,
            mod.detalle.snorkel,
            mod.detalle.peldaños,
            mod.detalle.talonerasEstribos,
            mod.detalle.matriculaDelanteraPequeña,
            mod.detalle.cabrestante,
            mod.detalle.barraAntiempotramiento,
            mod.detalle.defensaDelantera,
            mod.detalle.soporteRuedaRepuesto,
            mod.detalle.bodyLift,
          ];
          invalido = !opts.some((v) => v);
        }

        if (mod.nombre === 'Luces' && mod.detalle) {
          const opts = [
            mod.detalle.faroDelantero,
            mod.detalle.PilotoTrasero,
            mod.detalle.intermitentesLaterales,
            mod.detalle.focosDeTrabajo,
          ];
          invalido = !opts.some((v) => v);
        }

        if (mod.nombre === 'Dirección' && mod.detalle) {
          const opts = [
            mod.detalle.volanteYPiña,
            mod.detalle.barraDeDireccion,
            mod.detalle.amortiguadorDeDireccion,
            mod.detalle.sustitucionDeEjes,
          ];
          invalido = !opts.some((v) => v);
        }

        if (mod.nombre === 'Freno' && mod.detalle) {
          const opts = [
            mod.detalle.tamborPorDisco,
            mod.detalle.discosPerforadosRayados,
            mod.detalle.latiguillos,
            mod.detalle.bomba,
          ];
          invalido = !opts.some((v) => v);
        }

        if (mod.nombre === 'Unidad motriz' && mod.detalle) {
          const opts = [
            mod.detalle.cambioDeMotor,
            mod.detalle.CambioCajaCambios,
            mod.detalle.cambioEscape,
            mod.detalle.ampliacionNDepositosCombustible,
          ];
          invalido = !opts.some((v) => v);
        }

        this.erroresSubopciones[index] = invalido;

        if (invalido) {
          esValido = false;
        }
      }

      if (mod.tipo === 'Moto') {
        let invalido = false;

        if (mod.nombre === 'Ruedas' && mod.detalle) {
          const opts = [
            mod.detalle.neumaticosMoto,
            mod.detalle.separadoresDeRuedaMoto,
          ];
          invalido = !opts.some((v) => v);
        }

        if (mod.nombre === 'Suspensión' && mod.detalle) {
          const opts = [
            mod.detalle.horquillaDelanteraMoto,
            mod.detalle.muelleDelanteroMoto,
            mod.detalle.muelleTraseroMoto,
            mod.detalle.amortiguadorDelanteroMoto,
            mod.detalle.amortiguadorTraseroMoto,
          ];
          invalido = !opts.some((v) => v);
        }

        if (mod.nombre === 'Carrocería' && mod.detalle) {
          const opts = [
            mod.detalle.guardabarrosDelanteroMoto,
            mod.detalle.guardabarrosTraseroMoto,
            mod.detalle.estribosMoto,
            mod.detalle.cabrestanteMoto,
            mod.detalle.cambioPlacaDeMatriculaMoto,
            mod.detalle.retrovisoresMoto,
            mod.detalle.carenadoMoto,
            mod.detalle.depositoDeCombustibleMoto,
            mod.detalle.velocimetroMoto,
            mod.detalle.manillarMoto,
            mod.detalle.sillinMoto,
            mod.detalle.mandosAdelantadosMoto,
            mod.detalle.asiderosParaPasajeroMoto,
          ];
          invalido = !opts.some((v) => v);
        }

        if (mod.nombre === 'Chasis y Subchasis' && mod.detalle) {
          const opts = [
            mod.detalle.recorteSubchasisMoto,
            mod.detalle.modificacionDeChasisMoto,
          ];
          invalido = !opts.some((v) => v);
        }

        if (mod.nombre === 'Luces' && mod.detalle) {
          const opts = [
            mod.detalle.faroDelanteroMoto,
            mod.detalle.PilotoTraseroMoto,
            mod.detalle.luzDeMatriculaMoto,
            mod.detalle.catadriopticoTraseroMoto,
            mod.detalle.intermitentesMoto,
          ];
          invalido = !opts.some((v) => v);
        }

        if (mod.nombre === 'Freno' && mod.detalle) {
          const opts = [
            mod.detalle.tamborPorDiscoMoto,
            mod.detalle.discosPerforadosRayadosMoto,
            mod.detalle.latiguillosMoto,
            mod.detalle.bombaMoto,
          ];
          invalido = !opts.some((v) => v);
        }

        if (mod.nombre === 'Unidad motriz' && mod.detalle) {
          const opts = [
            mod.detalle.cambioDeMotorMoto,
            mod.detalle.CambioCajaCambiosMoto,
            mod.detalle.cambioEscapeMoto,
            mod.detalle.ampliacionNDepositosCombustibleMoto,
          ];
          invalido = !opts.some((v) => v);
        }

        this.erroresSubopciones[index] = invalido;

        if (invalido) {
          esValido = false;
        }
      }

      if (mod.tipo === 'camper') {
        if (mod.nombre === 'Ruedas' && mod.detalle) {
          const opts = [
            mod.detalle.neumaticosCamper,
            mod.detalle.llantasCamper,
            mod.detalle.separadoresDeRuedaCamper,
          ];
          invalido = !opts.some((v) => v);
        }

        if (mod.nombre === 'Suspensión' && mod.detalle) {
          const opts = [
            mod.detalle.muelleDelanteroCamper,
            mod.detalle.muelleTraseroCamper,
            mod.detalle.ballestasDelanterasCamper,
            mod.detalle.ballestasTraserasCamper,
            mod.detalle.amortiguadorDelanteroCamper,
            mod.detalle.amortiguadorTraseroCamper,
            mod.detalle.suplementoSuspensionDelanteroCamper,
            mod.detalle.suplementoSuspensionTraseroCamper,
          ];
          invalido = !opts.some((v) => v);
        }

        if (
          mod.nombre === 'Modificaciones en el interior del vehículo' &&
          mod.detalle
        ) {
          const opts = [mod.detalle.mobiliarioInterior, mod.detalle.fontaneria];
          invalido = !opts.some((v) => v);
        }

        if (mod.nombre === 'Instalación eléctrica' && mod.detalle) {
          const opts = [
            mod.detalle.placaSolar,
            mod.detalle.inversor,
            mod.detalle.reguladorSolar,
            mod.detalle.cargadorDeBateria,
            mod.detalle.bateriaAuxiliar,
            mod.detalle.iluminacionExterior,
            mod.detalle.tomaCorrienteexterior,
            mod.detalle.tomaCorrienteInterior,
          ];
          invalido = !opts.some((v) => v);
        }

        if (mod.nombre === 'Carrocería' && mod.detalle) {
          const opts = [
            mod.detalle.paragolpesDelanteroCamper,
            mod.detalle.paragolpesTraseroCamper,
            mod.detalle.aleronCamper,
            mod.detalle.aletinesYSobrealetinesCamper,
            mod.detalle.snorkelCamper,
            mod.detalle.peldañosCamper,
            mod.detalle.talonerasEstribosCamper,
            mod.detalle.cabrestanteCamper,
            mod.detalle.defensaDelanteraCamper,
            mod.detalle.soporteRuedaRepuestoCamper,
          ];
          invalido = !opts.some((v) => v);
        }

        if (mod.nombre === 'Luces' && mod.detalle) {
          const opts = [
            mod.detalle.faroDelantero,
            mod.detalle.PilotoTrasero,
            mod.detalle.intermitentesLaterales,
            mod.detalle.focosDeTrabajo,
          ];
          invalido = !opts.some((v) => v);
        }

        if (mod.nombre === 'Dirección' && mod.detalle) {
          const opts = [
            mod.detalle.volanteYPiña,
            mod.detalle.barraDeDireccion,
            mod.detalle.amortiguadorDeDireccion,
          ];
          invalido = !opts.some((v) => v);
        }

        if (mod.nombre === 'Freno' && mod.detalle) {
          const opts = [
            mod.detalle.tamborPorDisco,
            mod.detalle.discosPerforadosRayados,
            mod.detalle.latiguillos,
            mod.detalle.bomba,
          ];
          invalido = !opts.some((v) => v);
        }

        if (mod.nombre === 'Unidad motriz' && mod.detalle) {
          const opts = [
            mod.detalle.cambioDeMotor,
            mod.detalle.CambioCajaCambios,
            mod.detalle.cambioEscape,
            mod.detalle.ampliacionNDepositosCombustible,
          ];
          invalido = !opts.some((v) => v);
        }

        this.erroresSubopciones[index] = invalido;

        if (invalido) {
          esValido = false;
        }
      }
    });

    return esValido;
  }

  actualizarError(index: number, mod: Modificacion): void {
    let invalido = false;

    if (mod.tipo == 'coche') {
      if (mod.nombre === 'Ruedas' && mod.detalle) {
        const opts = [mod.detalle.neumaticos, mod.detalle.separadoresDeRueda];
        invalido = !opts.some((v) => v);
      }

      if (mod.nombre === 'Suspensión' && mod.detalle) {
        const opts = [
          mod.detalle.muelleDelantero,
          mod.detalle.muelleTrasero,
          mod.detalle.ballestaDelantera,
          mod.detalle.ballestaTrasera,
          mod.detalle.amortiguadorDelantero,
          mod.detalle.amortiguadorTrasero,
          mod.detalle.suplementoSusDelantero,
          mod.detalle.suplementoSusTrasero,
        ];
        invalido = !opts.some((v) => v);
      }

      if (mod.nombre === 'Carrocería' && mod.detalle) {
        const opts = [
          mod.detalle.paragolpesDelantero,
          mod.detalle.paragolpesTrasero,
          mod.detalle.aleron,
          mod.detalle.aletinesYSobrealetines,
          mod.detalle.snorkel,
          mod.detalle.peldaños,
          mod.detalle.talonerasEstribos,
          mod.detalle.matriculaDelanteraPequeña,
          mod.detalle.cabrestante,
          mod.detalle.barraAntiempotramiento,
          mod.detalle.defensaDelantera,
          mod.detalle.soporteRuedaRepuesto,
          mod.detalle.bodyLift,
        ];
        invalido = !opts.some((v) => v);
      }

      if (mod.nombre === 'Luces' && mod.detalle) {
        const opts = [
          mod.detalle.faroDelantero,
          mod.detalle.PilotoTrasero,
          mod.detalle.intermitentesLaterales,
          mod.detalle.focosDeTrabajo,
        ];
        invalido = !opts.some((v) => v);
      }

      if (mod.nombre === 'Dirección' && mod.detalle) {
        const opts = [
          mod.detalle.volanteYPiña,
          mod.detalle.barraDeDireccion,
          mod.detalle.amortiguadorDeDireccion,
          mod.detalle.sustitucionDeEjes,
        ];
        invalido = !opts.some((v) => v);
      }

      if (mod.nombre === 'Freno' && mod.detalle) {
        const opts = [
          mod.detalle.tamborPorDisco,
          mod.detalle.discosPerforadosRayados,
          mod.detalle.latiguillos,
          mod.detalle.bomba,
        ];
        invalido = !opts.some((v) => v);
      }

      if (mod.nombre === 'Unidad motriz' && mod.detalle) {
        const opts = [
          mod.detalle.cambioDeMotor,
          mod.detalle.CambioCajaCambios,
          mod.detalle.cambioEscape,
          mod.detalle.ampliacionNDepositosCombustible,
        ];
        invalido = !opts.some((v) => v);
      }
    }

    if (mod.tipo == 'moto') {
      if (mod.nombre === 'Ruedas' && mod.detalle) {
        const opts = [
          mod.detalle.neumaticosMoto,
          mod.detalle.separadoresDeRuedaMoto,
        ];
        invalido = !opts.some((v) => v);
      }

      if (mod.nombre === 'Suspensión' && mod.detalle) {
        const opts = [
          mod.detalle.horquillaDelanteraMoto,
          mod.detalle.muelleDelanteroMoto,
          mod.detalle.muelleTraseroMoto,
          mod.detalle.amortiguadorDelanteroMoto,
          mod.detalle.amortiguadorTraseroMoto,
        ];
        invalido = !opts.some((v) => v);
      }

      if (mod.nombre === 'Carrocería' && mod.detalle) {
        const opts = [
          mod.detalle.guardabarrosDelanteroMoto,
          mod.detalle.guardabarrosTraseroMoto,
          mod.detalle.estribosMoto,
          mod.detalle.cabrestanteMoto,
          mod.detalle.cambioPlacaDeMatriculaMoto,
          mod.detalle.retrovisoresMoto,
          mod.detalle.carenadoMoto,
          mod.detalle.depositoDeCombustibleMoto,
          mod.detalle.velocimetroMoto,
          mod.detalle.manillarMoto,
          mod.detalle.sillinMoto,
          mod.detalle.mandosAdelantadosMoto,
          mod.detalle.asiderosParaPasajeroMoto,
        ];
        invalido = !opts.some((v) => v);
      }

      if (mod.nombre === 'Chasis y Subchasis' && mod.detalle) {
        const opts = [
          mod.detalle.recorteSubchasisMoto,
          mod.detalle.modificacionDeChasisMoto,
        ];
        invalido = !opts.some((v) => v);
      }

      if (mod.nombre === 'Luces' && mod.detalle) {
        const opts = [
          mod.detalle.faroDelanteroMoto,
          mod.detalle.PilotoTraseroMoto,
          mod.detalle.luzDeMatriculaMoto,
          mod.detalle.catadriopticoTraseroMoto,
          mod.detalle.intermitentesMoto,
        ];
        invalido = !opts.some((v) => v);
      }

      if (mod.nombre === 'Freno' && mod.detalle) {
        const opts = [
          mod.detalle.tamborPorDiscoMoto,
          mod.detalle.discosPerforadosRayadosMoto,
          mod.detalle.latiguillosMoto,
          mod.detalle.bombaMoto,
        ];
        invalido = !opts.some((v) => v);
      }

      if (mod.nombre === 'Unidad motriz' && mod.detalle) {
        const opts = [
          mod.detalle.cambioDeMotorMoto,
          mod.detalle.CambioCajaCambiosMoto,
          mod.detalle.cambioEscapeMoto,
          mod.detalle.ampliacionNDepositosCombustibleMoto,
        ];
        invalido = !opts.some((v) => v);
      }
    }
    if (mod.tipo == 'camper') {
      if (mod.nombre === 'Ruedas' && mod.detalle) {
        const opts = [
          mod.detalle.neumaticosCamper,
          mod.detalle.llantasCamper,
          mod.detalle.separadoresDeRuedaCamper,
        ];
        invalido = !opts.some((v) => v);
      }

      if (mod.nombre === 'Suspensión' && mod.detalle) {
        const opts = [
          mod.detalle.muelleDelanteroCamper,
          mod.detalle.muelleTraseroCamper,
          mod.detalle.ballestasDelanterasCamper,
          mod.detalle.ballestasTraserasCamper,
          mod.detalle.amortiguadorDelanteroCamper,
          mod.detalle.amortiguadorTraseroCamper,
          mod.detalle.suplementoSuspensionDelanteroCamper,
          mod.detalle.suplementoSuspensionTraseroCamper,
        ];
        invalido = !opts.some((v) => v);
      }

      if (
        mod.nombre === 'Modificaciones en el interior del vehículo' &&
        mod.detalle
      ) {
        const opts = [
          mod.detalle.mobiliarioInterior,
          mod.detalle.mobiliarioInterior,
        ];
        invalido = !opts.some((v) => v);
      }

      if (mod.nombre === 'Instalación eléctrica' && mod.detalle) {
        const opts = [
          mod.detalle.placaSolar,
          mod.detalle.inversor,
          mod.detalle.reguladorSolar,
          mod.detalle.cargadorDeBateria,
          mod.detalle.bateriaAuxiliar,
          mod.detalle.iluminacionExterior,
          mod.detalle.tomaCorrienteexterior,
          mod.detalle.tomaCorrienteInterior,
        ];
        invalido = !opts.some((v) => v);
      }

      if (mod.nombre === 'Carrocería' && mod.detalle) {
        const opts = [
          mod.detalle.paragolpesDelanteroCamper,
          mod.detalle.paragolpesTraseroCamper,
          mod.detalle.aleronCamper,
          mod.detalle.aletinesYSobrealetinesCamper,
          mod.detalle.snorkelCamper,
          mod.detalle.peldañosCamper,
          mod.detalle.talonerasEstribosCamper,
          mod.detalle.cabrestanteCamper,
          mod.detalle.defensaDelanteraCamper,
          mod.detalle.soporteRuedaRepuestoCamper,
        ];
        invalido = !opts.some((v) => v);
      }

      if (mod.nombre === 'Luces' && mod.detalle) {
        const opts = [
          mod.detalle.faroDelantero,
          mod.detalle.PilotoTrasero,
          mod.detalle.intermitentesLaterales,
          mod.detalle.focosDeTrabajo,
        ];
        invalido = !opts.some((v) => v);
      }

      if (mod.nombre === 'Dirección' && mod.detalle) {
        const opts = [
          mod.detalle.volanteYPiña,
          mod.detalle.barraDeDireccion,
          mod.detalle.amortiguadorDeDireccion,
        ];
        invalido = !opts.some((v) => v);
      }

      if (mod.nombre === 'Freno' && mod.detalle) {
        const opts = [
          mod.detalle.tamborPorDisco,
          mod.detalle.discosPerforadosRayados,
          mod.detalle.latiguillos,
          mod.detalle.bomba,
        ];
        invalido = !opts.some((v) => v);
      }

      if (mod.nombre === 'Unidad motriz' && mod.detalle) {
        const opts = [
          mod.detalle.cambioDeMotor,
          mod.detalle.CambioCajaCambios,
          mod.detalle.cambioEscape,
          mod.detalle.ampliacionNDepositosCombustible,
        ];
        invalido = !opts.some((v) => v);
      }
    }

    this.erroresSubopciones[index] = invalido;
  }
}
