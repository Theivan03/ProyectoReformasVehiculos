import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  QueryList,
  ViewChildren,
} from '@angular/core';
import loadImage from 'blueimp-load-image';
import { CommonModule } from '@angular/common';
import { Modal } from 'bootstrap';

type SlotKey = string; // `${mod.nombre}::${subKey}`
type ExampleMeta = { src: string; id: string; label?: string };

@Component({
  selector: 'app-imagenes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './imagenes.component.html',
  styleUrls: ['./imagenes.component.css'],
})
export class ImagenesComponent implements OnInit {
  @Input() datosEntrada: any;
  docError: { [tipo: string]: string } = {};

  @Output() volver = new EventEmitter<any>();
  @Output() continuar = new EventEmitter<any>();
  @Output() autosave = new EventEmitter<any>();

  @ViewChildren('galleryInputs') galleryInputs!: QueryList<
    ElementRef<HTMLInputElement>
  >;
  @ViewChildren('cameraInputs') cameraInputs!: QueryList<
    ElementRef<HTMLInputElement>
  >;
  @ViewChildren('galleryInputsMods') galleryInputsMods!: QueryList<
    ElementRef<HTMLInputElement>
  >;
  @ViewChildren('cameraInputsMods') cameraInputsMods!: QueryList<
    ElementRef<HTMLInputElement>
  >;
  @ViewChildren('galleryInputsDocs') galleryInputsDocs!: QueryList<
    ElementRef<HTMLInputElement>
  >;
  @ViewChildren('cameraInputsDocs') cameraInputsDocs!: QueryList<
    ElementRef<HTMLInputElement>
  >;

  step = 1;

  prevImages: Blob[] = [];
  prevPreviews: string[] = [];
  postImages: Blob[] = [];
  postPreviews: string[] = [];
  prevImagesB64: string[] = [];
  postImagesB64: string[] = [];

  errorPrevImagesCount = false;
  errorPostImagesCount = false;

  // ---- Paso 2: mods y slots (solo subopciones) ----
  modsSeleccionadas: any[] = [];
  selectedSubopts: { [modNombre: string]: Set<string> } = {};
  perSlotPreviews: { [slot: SlotKey]: string[] } = {};
  perSlotBlobs: { [slot: SlotKey]: Blob[] } = {};

  // ---- Paso 3: docs ----
  docsPreviews: { [tipo: string]: string[] } = {};
  docsBlobs: { [tipo: string]: Blob[] } = {};
  docsImagesB64: { [tipo: string]: string[] } = {};

  // ---- Modal quitar ----
  private modalInstance?: Modal;
  modParaQuitar: any | null = null;
  modalAction: 'mod' | 'sub' = 'mod';
  subParaQuitarKey: string | null = null;

  // ---- Títulos ----
  titulos: {
    mod?: { [modNombre: string]: string };
    sub?: { [modNombre: string]: { [subKey: string]: string } };
  } = {
    mod: {
      Ruedas: 'Ruedas',
      Suspensión: 'Suspensión',
      Carrocería: 'Carrocería',
      Luces: 'Luces',
      Dirección: 'Dirección',
      Freno: 'Frenos',
      'Unidad motriz': 'Unidad motriz',
      'Enganche de remolque': 'Enganche de remolque',
      'Enganche de remolque (quads)': 'Enganche de remolque (quads)',
      Portabicicletas: 'Portabicicletas',
      'Reducción de plazas de asiento': 'Reducción de plazas de asiento',
      'Modificaciones en el interior del vehículo': 'Interior del vehículo',
      'Instalación eléctrica': 'Instalación eléctrica',
      Toldo: 'Toldo',
      'Chasis y Subchasis': 'Chasis y Subchasis',
    },
    sub: {
      Ruedas: {
        neumaticos: 'Neumáticos y llantas',
        llantasCamper: 'Llantas',
        separadoresDeRueda: 'Separadores de rueda',
        separadoresDeRuedaCamper: 'Separadores de rueda',
        neumaticosMoto: 'Neumáticos',
        separadoresDeRuedaMoto: 'Separadores (quads)',
        neumaticosCamper: 'Neumáticos (camper)',
      },
      Suspensión: {
        muelleDelantero: 'Muelle delantero',
        muelleTrasero: 'Muelle trasero',
        ballestaDelantera: 'Ballesta delantera',
        ballestaTrasera: 'Ballesta trasera',
        amortiguadorDelantero: 'Amortiguador delantero',
        amortiguadorTrasero: 'Amortiguador trasero',
        suplementoSusDelantero: 'Suplemento suspensión delantero',
        suplementoSusTrasero: 'Suplemento suspensión trasero',
        horquillaDelanteraMoto: 'Horquilla delantera',
        muelleDelanteroMoto: 'Muelle delantero',
        muelleTraseroMoto: 'Muelle trasero',
        amortiguadorDelanteroMoto: 'Amortiguador delantero',
        amortiguadorTraseroMoto: 'Amortiguador trasero',
      },
      Carrocería: {
        paragolpesDelantero: 'Paragolpes delantero',
        paragolpesTrasero: 'Paragolpes trasero',
        aleron: 'Alerón',
        aletinesYSobrealetines: 'Aletines / Sobrealetines',
        snorkel: 'Snorkel',
        peldaños: 'Peldaños',
        talonerasEstribos: 'Taloneras / Estribos',
        matriculaDelanteraPequeña: 'Matrícula delantera pequeña',
        cabrestante: 'Cabrestante',
        barraAntiempotramiento: 'Barra antiempotramiento',
        defensaDelantera: 'Defensa delantera',
        soporteRuedaRepuesto: 'Soporte de rueda de repuesto',
        bodyLift: 'Body Lift',
        paragolpesDelanteroCamper: 'Paragolpes delantero (camper)',
        paragolpesTraseroCamper: 'Paragolpes trasero (camper)',
        aleronCamper: 'Alerón (camper)',
        aletinesYSobrealetinesCamper: 'Aletines / Sobrealetines (camper)',
        snorkelCamper: 'Snorkel (camper)',
        peldañosCamper: 'Peldaños (camper)',
        talonerasEstribosCamper: 'Taloneras / Estribos (camper)',
        cabrestanteCamper: 'Cabrestante (camper)',
        defensaDelanteraCamper: 'Defensa delantera (camper)',
        soporteRuedaRepuestoCamper: 'Soporte rueda repuesto (camper)',
        guardabarrosDelanteroMoto: 'Guardabarros delantero',
        guardabarrosTraseroMoto: 'Guardabarros trasero',
        estribosMoto: 'Estribos',
        cabrestanteMoto: 'Cabrestante (quads)',
        cambioPlacaDeMatriculaMoto: 'Cambio placa matrícula',
        retrovisoresMoto: 'Retrovisores',
        carenadoMoto: 'Carenado',
        depositoDeCombustibleMoto: 'Depósito de combustible',
        velocimetroMoto: 'Velocímetro',
        manillarMoto: 'Manillar',
        sillinMoto: 'Sillín',
        mandosAdelantadosMoto: 'Mandos adelantados',
        asiderosParaPasajeroMoto: 'Asideros pasajero',
      },
      Luces: {
        faroDelantero: 'Faro delantero',
        PilotoTrasero: 'Piloto trasero',
        intermitentesLaterales: 'Intermitentes laterales',
        focosDeTrabajo: 'Focos de trabajo',
        faroDelanteroMoto: 'Faro delantero',
        PilotoTraseroMoto: 'Piloto trasero',
        luzDeMatriculaMoto: 'Luz de matrícula',
        catadriopticoTraseroMoto: 'Catadióptrico',
        intermitentesMoto: 'Intermitentes',
      },
      Dirección: {
        volanteYPiña: 'Volante y piña',
        barraDeDireccion: 'Barra de dirección',
        amortiguadorDeDireccion: 'Amortiguador de dirección',
        sustitucionDeEjes: 'Sustitución de ejes',
      },
      Freno: {
        tamborPorDisco: 'Tambor por disco',
        discosPerforadosRayados: 'Discos perforados/rayados',
        latiguillos: 'Latiguillos',
        bomba: 'Bomba',
        tamborPorDiscoMoto: 'Tambor por disco',
        discosPerforadosRayadosMoto: 'Discos perforados/rayados',
        latiguillosMoto: 'Latiguillos',
        bombaMoto: 'Bomba',
      },
      'Unidad motriz': {
        cambioDeMotor: 'Cambio de motor',
        CambioCajaCambios: 'Cambio caja de cambios',
        cambioEscape: 'Cambio de escape',
        colaEscape: 'Cola de escape',
        ampliacionNDepositosCombustible: 'Ampliación depósitos combustible',
        cambioDeMotorMoto: 'Cambio de motor',
        CambioCajaCambiosMoto: 'Caja de cambios',
        cambioEscapeMoto: 'Cambio de escape',
        ampliacionNDepositosCombustibleMoto: 'Ampliación depósitos',
      },
      'Chasis y Subchasis': {
        recorteSubchasisMoto: 'Recorte de subchasis',
        modificacionDeChasisMoto: 'Modificación de chasis',
      },
      'Modificaciones en el interior del vehículo': {
        mobiliarioInterior: 'Mobiliario interior',
        fontaneria: 'Fontanería',
        muebleBajo: 'Mueble bajo',
        muebleAlto: 'Mueble alto',
        aseo: 'Aseo',
        cama: 'Cama',
        estanteria: 'Estantería',
        baseGiratoria: 'Bases giratorias',
        banquetaParaAumentarPlazas: 'Banqueta (plazas)',
        ventanas: 'Ventanas',
        claraboyas: 'Claraboyas',
        termo: 'Termo',
        bombaDeAgua: 'Bomba de agua',
        vasoDeExpansion: 'Vaso de expansión',
        depositoAguaLimpia: 'Depósito agua limpia',
        depositoAguaSucia: 'Depósito agua sucia',
        duchaInterior: 'Ducha interior',
        duchaExterior: 'Ducha exterior',
        tomaDeAguaExterior: 'Toma de agua exterior',
        calefaccionDiesel: 'Calefacción diésel',
      },
      'Instalación eléctrica': {
        placaSolar: 'Placa solar',
        inversor: 'Inversor',
        reguladorSolar: 'Regulador solar',
        cargadorDeBateria: 'Cargador de batería',
        bateriaAuxiliar: 'Batería auxiliar',
        iluminacionExterior: 'Iluminación exterior',
        tomaCorrienteexterior: 'Toma de corriente exterior',
        tomaCorrienteInterior: 'Toma de corriente interior',
      },
    },
  };

  // ===========================
  //   MÚLTIPLES EJEMPLOS (TS)
  // ===========================

  private readonly GENERIC_EXAMPLE = 'assets/ejemplos/generico.jpg';

  private ejemploPorModList: Record<string, ExampleMeta[]> = {
    Ruedas: [
      {
        src: 'assets/llanta.png',
        id: 'ruedas-default',
        label: '',
      },
    ],
    Suspensión: [
      {
        src: 'assets/suspdelantera1.png',
        id: 'suspension-default',
        label: '',
      },
    ],
    Carrocería: [
      {
        src: 'assets/ejemplos/mods/carroceria/default.jpg',
        id: 'carroceria-default',
        label: '',
      },
    ],
    Luces: [
      {
        src: 'assets/farodelantero.png',
        id: 'luces-default',
        label: '',
      },
    ],
    Dirección: [
      {
        src: 'assets/volante1.png',
        id: 'direccion-default',
        label: '',
      },
    ],
    Freno: [
      {
        src: 'assets/frenos.png',
        id: 'freno-default',
        label: '',
      },
    ],
    'Unidad motriz': [
      {
        src: 'assets/ejemplos/mods/unidad-motriz/default.jpg',
        id: 'unidad-motriz-default',
        label: '',
      },
    ],
    'Enganche de remolque': [
      {
        src: 'assets/remolque1.png',
        id: 'enganche-default-1',
        label: 'Fotografía de la/s placas/s del gancho de remolque',
      },
      {
        src: 'assets/remolque2.jpg',
        id: 'enganche-default-2',
        label: 'Fotografía de la/s placas/s del gancho de remolque',
      },
      {
        src: 'assets/remolque3.jpg',
        id: 'enganche-default-3',
        label: 'Fotografía de la/s placas/s del gancho de remolque',
      },
    ],

    'Enganche de remolque (quads)': [
      {
        src: 'assets/remolque1.png',
        id: 'enganche-quads-default-1',
        label: 'Fotografía de la/s placas/s del gancho de remolque',
      },
      {
        src: 'assets/remolque2.jpg',
        id: 'enganche-quads-default-2',
        label: 'Fotografía de la/s placas/s del gancho de remolque',
      },
      {
        src: 'assets/remolque3.jpg',
        id: 'enganche-quads-default-3',
        label: 'Fotografía de la/s placas/s del gancho de remolque',
      },
    ],
    Portabicicletas: [
      {
        src: 'assets/ejemplos/mods/portabicis/default.jpg',
        id: 'portabicis-default',
        label: '',
      },
    ],
    'Reducción de plazas de asiento': [
      {
        src: 'assets/ejemplos/mods/reduccion-plazas/default.jpg',
        id: 'reduccion-plazas-default',
        label: '',
      },
    ],
    'Modificaciones en el interior del vehículo': [
      {
        src: 'assets/ejemplos/mods/interior/default.jpg',
        id: 'interior-default',
        label: '',
      },
    ],
    'Instalación eléctrica': [
      {
        src: 'assets/ejemplos/mods/inst-elec/default.jpg',
        id: 'ie-default',
        label: '',
      },
    ],
    Toldo: [
      {
        src: 'assets/ejemplos/mods/toldo/default.jpg',
        id: 'toldo-default',
        label: '',
      },
    ],
    'Chasis y Subchasis': [
      {
        src: 'assets/ejemplos/mods/chasis/default.jpg',
        id: 'chasis-default',
        label: '',
      },
    ],
  };

  private ejemploPorSubList: Record<string, Record<string, ExampleMeta[]>> = {
    // ------------------- RUEDAS -------------------
    Ruedas: {
      neumaticos: [
        { src: 'assets/llanta.png', id: 'neum-02', label: 'Rueda completa' },
        {
          src: 'assets/neumatico1.png',
          id: 'neum-01',
          label: 'Indice de carga y velocidad',
        },
        { src: 'assets/neumatico2.png', id: 'neum-03', label: 'Homologación' },
        {
          src: 'assets/neumatico3.png',
          id: 'neum-04',
          label: 'Grandaria de llanta',
        },
        {
          src: 'assets/neumatico4.png',
          id: 'neumaticos-a',
          label: 'Lateral delantero derecho',
        },
        {
          src: 'assets/neumatico5.png',
          id: 'neumaticos-b',
          label: 'Lateral delantero izquierdo',
        },
        {
          src: 'assets/neumatico6.png',
          id: 'neumaticos-c',
          label: 'Lateral trasero derecho',
        },
        {
          src: 'assets/neumatico7.png',
          id: 'neumaticos-d',
          label: 'Lateral trasero izquierdo',
        },
      ],
      llantasCamper: [{ src: 'assets/llanta.png', id: 'll-01', label: '' }],
      separadoresDeRueda: [
        {
          src: 'assets/separadores1.jpg',
          id: 'sep-01',
          label: 'Anchura del separador',
        },
        {
          src: 'assets/separadores2.jpg',
          id: 'sep-02',
          label: 'Frontal del separador',
        },
      ],
      separadoresDeRuedaCamper: [
        {
          src: 'assets/separadores1.png',
          id: 'sep-01',
          label: 'Anchura del separador',
        },
        {
          src: 'assets/separadores2.jpg',
          id: 'sep-02',
          label: 'Frontal del separador',
        },
      ],
      neumaticosMoto: [
        {
          src: 'assets/neumaticoMoto1.jpg',
          id: 'neum-01',
          label:
            'Foto del marcaje de la llanta donde se pueda ver el ancho de la misma',
        },
        {
          src: 'assets/neumaticoMoto2.jpg',
          id: 'neum-03',
          label: 'Foto de la medida completa del neumático',
        },
      ],
      separadoresDeRuedaMoto: [
        {
          src: 'assets/ejemplos/mods/chasis/default.jpg',
          id: 'sep-01',
          label: '',
        },
      ],
      neumaticosCamper: [
        { src: 'assets/neumatico1.png', id: 'neum-01', label: '' },
        { src: 'assets/neumatico2.png', id: 'neum-03', label: '' },
        { src: 'assets/neumatico3.png', id: 'neum-04', label: '' },
      ],
    },

    // ------------------- SUSPENSIÓN -------------------
    Suspensión: {
      muelleDelantero: [
        {
          src: 'assets/suspdelantera1.png',
          id: 'muelle-del-01',
          label: 'Eje delantero general',
        },
        {
          src: 'assets/suspdelantera2.png',
          id: 'muelle-del-02',
          label: 'Referencia Amortiguador eje delantero',
        },
        {
          src: 'assets/suspdelantera3.png',
          id: 'muelle-del-03',
          label: 'Referencia muelle pretensión eje delantero',
        },
        {
          src: 'assets/alturadelante.png',
          id: 'muelle-del-03',
          label: 'Altura parte delantera',
        },
        {
          src: 'assets/alturadetras.png',
          id: 'muelle-del-03',
          label: 'Altura parte trasera',
        },
        {
          src: 'assets/alturalateral.png',
          id: 'muelle-del-03',
          label: 'Altura parte lateral',
        },
      ],
      muelleTrasero: [
        {
          src: 'assets/susptrasera1.png',
          id: 'muelle-tras-01',
          label: 'Eje trasero general',
        },
        {
          src: 'assets/susptrasera3.png',
          id: 'muelle-tras-03',
          label: 'Referencia Amortiguador eje trasero',
        },
        {
          src: 'assets/susptrasera2.png',
          id: 'muelle-tras-02',
          label: 'Referencia muelle pretensión eje trasero',
        },
        {
          src: 'assets/alturadelante.png',
          id: 'muelle-del-03',
          label: 'Altura parte delantera',
        },
        {
          src: 'assets/alturadetras.png',
          id: 'muelle-del-03',
          label: 'Altura parte trasera',
        },
        {
          src: 'assets/alturalateral.png',
          id: 'muelle-del-03',
          label: 'Altura parte lateral',
        },
      ],
      ballestaDelantera: [
        {
          src: 'assets/ballesta1.png',
          id: 'ballesta-del-01',
          label: 'Ballesta delantera general',
        },
        {
          src: 'assets/ballesta2.png',
          id: 'ballesta-del-02',
          label: 'Referencia ballesta delantera y laminas',
        },
        {
          src: 'assets/ballesta3.png',
          id: 'ballesta-del-03',
          label: 'Anclaje al eje y al chasis',
        },
        {
          src: 'assets/alturadelante.png',
          id: 'muelle-del-03',
          label: 'Altura parte delantera',
        },
        {
          src: 'assets/alturadetras.png',
          id: 'muelle-del-03',
          label: 'Altura parte trasera',
        },
        {
          src: 'assets/alturalateral.png',
          id: 'muelle-del-03',
          label: 'Altura parte lateral',
        },
      ],

      ballestaTrasera: [
        {
          src: 'assets/ballesta1.png',
          id: 'ballesta-tras-01',
          label: 'Ballesta delantera general',
        },
        {
          src: 'assets/ballesta2.png',
          id: 'ballesta-tras-02',
          label: 'Referencia ballesta delantera y laminas',
        },
        {
          src: 'assets/ballesta3.png',
          id: 'ballesta-tras-03',
          label: 'Anclaje al eje y al chasis',
        },
        {
          src: 'assets/alturadelante.png',
          id: 'muelle-del-03',
          label: 'Altura parte delantera',
        },
        {
          src: 'assets/alturadetras.png',
          id: 'muelle-del-03',
          label: 'Altura parte trasera',
        },
        {
          src: 'assets/alturalateral.png',
          id: 'muelle-del-03',
          label: 'Altura parte lateral',
        },
      ],
      amortiguadorDelantero: [
        {
          src: 'assets/ejemplos/mods/suspension/amort-del-01.jpg',
          id: 'amort-del-01',
          label: 'Fotogeneral del amortiguador',
        },
      ],
      amortiguadorTrasero: [
        {
          src: 'assets/ejemplos/mods/suspension/amort-tras-01.jpg',
          id: 'amort-tras-01',
          label: 'Fotogeneral del amortiguador',
        },
      ],
      suplementoSusDelantero: [
        {
          src: 'assets/ejemplos/mods/suspension/sup-del-01.jpg',
          id: 'sup-del-01',
          label: 'Fotogeneral del suplemento',
        },
      ],
      suplementoSusTrasero: [
        {
          src: 'assets/ejemplos/mods/suspension/sup-tras-01.jpg',
          id: 'sup-tras-01',
          label: 'Fotogeneral del suplemento',
        },
      ],
      horquillaDelanteraMoto: [
        {
          src: 'assets/suspensionMoto1.jpg',
          id: 'horq-moto-del-01',
          label: 'Foto detalle de la horquilla instalada',
        },
        {
          src: 'assets/suspensionMoto2.png',
          id: 'horq-moto-del-01',
          label: 'Foto de la adaptación de la horquilla a los frenos',
        },
      ],
      muelleDelanteroMoto: [
        {
          src: 'assets/ejemplos/mods/suspension/muelle-moto-del-01.jpg',
          id: 'muelle-moto-del-01',
          label: 'Muelle delantero general',
        },
      ],
      muelleTraseroMoto: [
        {
          src: 'assets/ejemplos/mods/suspension/muelle-moto-tras-01.jpg',
          id: 'muelle-moto-tras-01',
          label: 'Muelle trasero general',
        },
      ],
      amortiguadorDelanteroMoto: [
        {
          src: 'assets/amortiguadorMoto.jpg',
          id: 'amort-moto-del-01',
          label: 'Foto detalle del amortiguador instalado',
        },
      ],
      amortiguadorTraseroMoto: [
        {
          src: 'assets/suspensionMoto3.jpg',
          id: 'amort-moto-del-01',
          label: 'Foto detalle del amortiguador instalado',
        },
        {
          src: 'assets/suspensionMoto4.jpg',
          id: 'amort-moto-tras-01',
          label: 'Foto detalle de sus referencias (si tiene)',
        },
      ],
    },

    // ------------------- CARROCERÍA -------------------
    Carrocería: {
      paragolpesDelantero: [
        { src: 'assets/paradelantero1.png', id: 'p-del-01', label: '' },
        { src: 'assets/paradelantero2.png', id: 'p-del-02', label: '' },
        { src: 'assets/paradelantero3.png', id: 'p-del-03', label: '' },
      ],
      paragolpesTrasero: [
        {
          src: 'assets/paratrasero1.png',
          id: 'p-tras-01',
          label: '',
        },
        {
          src: 'assets/paratrasero2.png',
          id: 'p-tras-02',
          label: '',
        },
        {
          src: 'assets/paratrasero3.png',
          id: 'p-tras-03',
          label: '',
        },
      ],
      aleron: [
        {
          src: 'assets/ejemplos/mods/carroceria/aleron-01.jpg',
          id: 'aleron-01',
          label: 'Foto por la parte lateral del alerón',
        },
        {
          src: 'assets/ejemplos/mods/carroceria/aleron-01.jpg',
          id: 'aleron-01',
          label: 'Foto por la parte trasera del alerón',
        },
      ],
      lip: [
        {
          src: 'assets/lip1.jpg',
          id: 'lip-01',
          label: 'Lip delantero',
        },
      ],
      taloneras: [
        {
          src: 'assets/taloneras1.jpg',
          id: 'taloneras-01',
          label: 'Lateral del vehículo',
        },
      ],
      techoSolar: [
        {
          src: 'assets/techoS1.jpg',
          id: 'techoSolar-01',
          label: 'Techo solar general',
        },
        {
          src: 'assets/techoS2.jpg',
          id: 'techoSolar-02',
          label: 'Contraseña de homologación',
        },
      ],
      difusor: [
        {
          src: 'assets/difusor1.jpg',
          id: 'difusor-01',
          label: 'Foto general del difusor',
        },
      ],
      capo: [
        {
          src: 'assets/capo1.jpg',
          id: 'capo-01',
          label: 'Capó parte frontal',
        },
        {
          src: 'assets/capo2.png',
          id: 'capo-02',
          label: 'Capó parte interior',
        },
      ],
      canard: [
        {
          src: 'assets/canard1.jpg',
          id: 'canard-01',
          label: 'Canards generales',
        },
      ],
      asientos: [
        {
          src: 'assets/asientos1.jpg',
          id: 'canard-01',
          label: 'Foto de la pegatina del asiento',
        },
        {
          src: 'assets/asientos2.jpg',
          id: 'asientos-02',
          label: 'Foto de las referencias de las bases instaladas',
        },
        {
          src: 'assets/asientos3.jpg',
          id: 'asientos-03',
          label: 'Foto de los asientos instalados',
        },
        {
          src: 'assets/asientos4.jpg',
          id: 'asientos-04',
          label: 'Foto detalle de las bases instaladas',
        },
        {
          src: 'assets/asientos5.jpg',
          id: 'asientos-05',
          label: 'Foto detalle de donde enganche el cinturón (suelo o bases)',
        },
      ],
      aletinesYSobrealetines: [
        {
          src: 'assets/aletines1.png',
          id: 'aletines-a',
          label: '',
        },
        {
          src: 'assets/aletinesdelantero.png',
          id: 'aletines-b',
          label: '',
        },
        {
          src: 'assets/neumatico4.png',
          id: 'neumaticos-a',
          label: '',
        },
        {
          src: 'assets/neumatico5.png',
          id: 'neumaticos-b',
          label: '',
        },
        {
          src: 'assets/neumatico6.png',
          id: 'neumaticos-c',
        },
        {
          src: 'assets/neumatico7.png',
          id: 'neumaticos-d',
          label: '',
        },
      ],
      snorkel: [
        {
          src: 'assets/snorkel1.jpg',
          id: 'snorkel-01',
          label: 'Imagen general del snorkel',
        },
        {
          src: 'assets/snorkel2.jpg',
          id: 'snorkel-02',
          label: 'imagen parte interior del capó',
        },
        {
          src: 'assets/snorkel3.jpg',
          id: 'snorkel-03',
          label: 'Imagen lateral delantera',
        },
        {
          src: 'assets/snorkel4.jpg',
          id: 'snorkel-04',
          label: 'imagen lateral trasera',
        },
      ],
      peldaños: [
        {
          src: 'assets/ejemplos/mods/carroceria/peldanos-01.jpg',
          id: 'peldanos-01',
          label: '',
        },
      ],
      talonerasEstribos: [
        {
          src: 'assets/taloneras1.jpg',
          id: 'taloneras-01',
          label: 'Lateral del vehículo',
        },
      ],
      matriculaDelanteraPequeña: [
        {
          src: 'assets/ejemplos/mods/carroceria/mat-del-peq-01.jpg',
          id: 'mat-del-peq-01',
          label: '',
        },
      ],
      cabrestante: [
        {
          src: 'assets/cabrestante1.png',
          id: 'cabrestante-01',
          label: '',
        },
        {
          src: 'assets/cabrestante2.png',
          id: 'cabrestante-02',
          label: '',
        },
      ],
      barraAntiempotramiento: [
        {
          src: 'assets/ejemplos/mods/carroceria/barra-anti-01.jpg',
          id: 'barra-anti-01',
          label: '',
        },
      ],
      defensaDelantera: [
        {
          src: 'assets/ejemplos/mods/carroceria/defensa-del-01.jpg',
          id: 'defensa-del-01',
          label: '',
        },
      ],
      soporteRuedaRepuesto: [
        {
          src: 'assets/ejemplos/mods/carroceria/soporte-repuesto-01.jpg',
          id: 'soporte-repuesto-01',
          label: '',
        },
      ],
      bodyLift: [
        {
          src: 'assets/ejemplos/mods/carroceria/body-lift-01.jpg',
          id: 'body-lift-01',
          label: '',
        },
      ],

      paragolpesDelanteroCamper: [
        {
          src: 'assets/ejemplos/mods/carroceria/p-del-camper-01.jpg',
          id: 'p-del-camper-01',
          label: '',
        },
      ],
      paragolpesTraseroCamper: [
        {
          src: 'assets/ejemplos/mods/carroceria/p-tras-camper-01.jpg',
          id: 'p-tras-camper-01',
          label: '',
        },
      ],
      aleronCamper: [
        {
          src: 'assets/ejemplos/mods/carroceria/aleron-01.jpg',
          id: 'aleron-01',
          label: 'Foto por la parte lateral del alerón',
        },
        {
          src: 'assets/ejemplos/mods/carroceria/aleron-01.jpg',
          id: 'aleron-01',
          label: 'Foto por la parte trasera del alerón',
        },
      ],
      aletinesYSobrealetinesCamper: [
        {
          src: 'assets/aletines1.png',
          id: 'aletines-a',
          label: '',
        },
        {
          src: 'assets/aletinesdelantero.png',
          id: 'aletines-b',
          label: '',
        },
        {
          src: 'assets/neumaticos4.png',
          id: 'neumaticos-a',
          label: '',
        },
        {
          src: 'assets/neumaticos5.png',
          id: 'neumaticos-b',
          label: '',
        },
        {
          src: 'assets/neumaticos6.png',
          id: 'neumaticos-c',
        },
        {
          src: 'assets/neumaticos7.png',
          id: 'neumaticos-d',
          label: '',
        },
      ],
      snorkelCamper: [
        {
          src: 'assets/ejemplos/mods/carroceria/snorkel-camper-01.jpg',
          id: 'snorkel-camper-01',
          label: '',
        },
      ],
      barrasAntivuelco: [
        {
          src: 'assets/barras1.jpg',
          id: 'barras-antivuelco-01',
          label: '',
        },
        {
          src: 'assets/barras2.jpg',
          id: 'barras-antivuelco-02',
          label: '',
        },
        {
          src: 'assets/barras3.jpg',
          id: 'barras-antivuelco-03',
          label: '',
        },
        {
          src: 'assets/barras4.jpg',
          id: 'barras-antivuelco-04',
          label: '',
        },
      ],
      peldañosCamper: [
        {
          src: 'assets/ejemplos/mods/carroceria/peldanos-camper-01.jpg',
          id: 'peldanos-camper-01',
          label: '',
        },
      ],
      talonerasEstribosCamper: [
        {
          src: 'assets/taloneras1.jpg',
          id: 'taloneras-camper-01',
          label: 'Lateral del vehículo',
        },
      ],
      cabrestanteCamper: [
        {
          src: 'assets/ejemplos/mods/carroceria/cabrestante-camper-01.jpg',
          id: 'cabrestante-camper-01',
          label: '',
        },
      ],
      defensaDelanteraCamper: [
        {
          src: 'assets/ejemplos/mods/carroceria/defensa-del-camper-01.jpg',
          id: 'defensa-del-camper-01',
          label: '',
        },
      ],
      soporteRuedaRepuestoCamper: [
        {
          src: 'assets/ejemplos/mods/carroceria/soporte-repuesto-camper-01.jpg',
          id: 'soporte-repuesto-camper-01',
          label: '',
        },
      ],

      guardabarrosDelanteroMoto: [
        {
          src: 'assets/guardabarrosMoto.jpg',
          id: 'guard-moto-del-01',
          label: 'Foto frontal del guardabarros',
        },
      ],
      guardabarrosTraseroMoto: [
        {
          src: 'assets/ejemplos/mods/carroceria/guardabarros-moto-tras-01.jpg',
          id: 'guard-moto-tras-01',
          label: '',
        },
      ],
      estribosMoto: [
        {
          src: 'assets/ejemplos/mods/carroceria/estribos-moto-01.jpg',
          id: 'estribos-moto-01',
          label: '',
        },
      ],
      cabrestanteMoto: [
        {
          src: 'assets/ejemplos/mods/carroceria/cabrestante-quads-01.jpg',
          id: 'cabrestante-quads-01',
          label: '',
        },
      ],
      cambioPlacaDeMatriculaMoto: [
        {
          src: 'assets/ejemplos/mods/carroceria/cambio-placa-moto-01.jpg',
          id: 'cambio-placa-moto-01',
          label: '',
        },
      ],
      retrovisoresMoto: [
        {
          src: 'assets/retrovisoresMoto.jpg',
          id: 'retrovisores-moto-01',
          label: 'Distancia entre retrovisores',
        },
        {
          src: 'assets/retrovisoresMoto2.jpg',
          id: 'retrovisores-moto-02',
          label: 'Contraseña de homologación de los retrovisores',
        },
      ],
      carenadoMoto: [
        {
          src: 'assets/ejemplos/mods/carroceria/carenado-moto-01.jpg',
          id: 'carenado-moto-01',
          label: '',
        },
      ],
      depositoDeCombustibleMoto: [
        {
          src: 'assets/depositoMoto.jpg',
          id: 'deposito-moto-01',
          label: '',
        },
      ],
      velocimetroMoto: [
        {
          src: 'assets/velocimetroMoto.jpg',
          id: 'velocimetro-moto-01',
          label: 'Velocimetro general',
        },
        {
          src: 'assets/velocimetroMoto2.jpg',
          id: 'velocimetro-moto-02',
          label: 'Contraseña de homologación',
        },
      ],
      manillarMoto: [
        {
          src: 'assets/manillarMoto.jpg',
          id: 'manillar-moto-01',
          label: 'Foto general del manillar',
        },
      ],
      sillinMoto: [
        {
          src: 'assets/ejemplos/mods/carroceria/sillin-moto-01.jpg',
          id: 'sillin-moto-01',
          label: '',
        },
      ],
      mandosAdelantadosMoto: [
        {
          src: 'assets/ejemplos/mods/carroceria/mandos-adelantados-moto-01.jpg',
          id: 'mandos-adelantados-moto-01',
          label: '',
        },
      ],
      asiderosParaPasajeroMoto: [
        {
          src: 'assets/ejemplos/mods/carroceria/asideros-moto-01.jpg',
          id: 'asideros-moto-01',
          label: '',
        },
      ],
    },

    // ------------------- LUCES -------------------
    Luces: {
      faroDelantero: [
        {
          src: 'assets/farodelantero.png',
          id: 'faro-del-01',
          label: 'Marcaje',
        },
      ],
      PilotoTrasero: [
        {
          src: 'assets/pilototrasero.png',
          id: 'piloto-tras-01',
          label: 'Marcaje',
        },
      ],
      intermitentesLaterales: [
        {
          src: 'assets/intermitentelateral.png',
          id: 'inter-lat-01',
          label: 'Marcaje',
        },
      ],
      focosDeTrabajo: [
        {
          src: 'assets/ejemplo.png',
          id: 'inter-lat-01',
          label: 'Foco en paragolpes delantero (opcional)',
        },
        {
          src: 'assets/ejemplo.png',
          id: 'inter-lat-01',
          label: 'Foco en paragolpes trasero (opcional)',
        },
        {
          src: 'assets/ejemplo.png',
          id: 'inter-lat-01',
          label: 'Foco en la parte trasera (opcional)',
        },
        {
          src: 'assets/ejemplo.png',
          id: 'inter-lat-01',
          label: 'Foco en el techo (opcional)',
        },
      ],
      antiniebla: [
        {
          src: 'assets/antiniebla.jpg',
          id: 'antiniebla-01',
          label: 'Marcaje',
        },
      ],
      largoAlcance: [
        {
          src: 'assets/largoAlcance.jpg',
          id: 'largo-alcance-01',
          label: 'Marcaje',
        },
      ],
      faroDelanteroMoto: [
        {
          src: 'assets/farodelantero.png',
          id: 'faro-moto-del-01',
          label: 'Marcaje',
        },
      ],
      PilotoTraseroMoto: [
        {
          src: 'assets/pilototraseromoto.png',
          id: 'piloto-moto-tras-01',
          label: 'Marcaje',
        },
      ],
      luzDeMatriculaMoto: [
        {
          src: 'assets/luzmatricula.jpg',
          id: 'luz-matricula-moto-01',
          label: 'Marcaje',
        },
      ],
      catadriopticoTraseroMoto: [
        {
          src: 'assets/pilototraseromoto.png',
          id: 'catadioptrico-moto-01',
          label: '',
        },
      ],
      intermitentesMoto: [
        {
          src: 'assets/ejemplos/mods/luces/intermitentes-moto-01.jpg',
          id: 'intermitentes-moto-01',
          label: '',
        },
      ],
    },

    // ------------------- DIRECCIÓN -------------------
    Dirección: {
      volanteYPiña: [
        {
          src: 'assets/volante1.png',
          id: 'volante-pina-01',
          label: 'Foto general',
        },
        {
          src: 'assets/volante2.png',
          id: 'volante-pina-02',
          label: 'Diámetro volante',
        },
        {
          src: 'assets/volante3.png',
          id: 'volante-pina-03',
          label: 'Longitud piña',
        },
      ],
      barraDeDireccion: [
        {
          src: 'assets/ejemplos/mods/direccion/barra-01.jpg',
          id: 'barra-dir-01',
          label: '',
        },
      ],
      amortiguadorDeDireccion: [
        {
          src: 'assets/ejemplos/mods/direccion/amortiguador-dir-01.jpg',
          id: 'amort-dir-01',
          label: '',
        },
      ],
      sustitucionDeEjes: [
        {
          src: 'assets/ejemplos/mods/direccion/sustitucion-ejes-01.jpg',
          id: 'sust-ejes-01',
          label: '',
        },
      ],
    },

    // ------------------- FRENO -------------------
    Freno: {
      tamborPorDisco: [
        {
          src: 'assets/ejemplos/mods/freno/tambor-por-disco-01.jpg',
          id: 'tpd-01',
          label: '',
        },
      ],
      discosPerforadosRayados: [
        {
          src: 'assets/freno1.jpg',
          id: 'discos-perf-01',
          label: 'Discos y pinzas eje delantero',
        },
        {
          src: 'assets/freno3.jpg',
          id: 'discos-perf-02',
          label: 'Discos y pinzas eje trasero',
        },
      ],
      latiguillos: [
        {
          src: 'assets/freno2.jpg',
          id: 'latigui-perf-01',
          label: 'Latiguillos eje delantero',
        },
        {
          src: 'assets/freno4.jpg',
          id: 'latigui-perf-02',
          label: 'Latiguillos eje trasero',
        },
      ],
      bomba: [
        {
          src: 'assets/ejemplos/mods/freno/bomba-01.jpg',
          id: 'bomba-01',
          label: '',
        },
      ],
      tamborPorDiscoMoto: [
        {
          src: 'assets/ejemplos/mods/freno/tambor-por-disco-moto-01.jpg',
          id: 'tpd-moto-01',
          label: '',
        },
      ],
      discosPerforadosRayadosMoto: [
        {
          src: 'assets/frenoMoto.jpg',
          id: 'discos-perf-moto-01',
          label: '',
        },
      ],
      latiguillosMoto: [
        {
          src: 'assets/frenoMoto.jpg',
          id: 'lat-moto-01',
          label: '',
        },
      ],
      bombaMoto: [
        {
          src: 'assets/ejemplos/mods/freno/bomba-moto-01.jpg',
          id: 'bomba-moto-01',
          label: '',
        },
      ],
    },

    // ------------------- UNIDAD MOTRIZ -------------------
    'Unidad motriz': {
      cambioDeMotor: [
        {
          src: 'assets/motor1.jpg',
          id: 'cambio-motor-01',
          label: 'Foto desde la parte superior del motor',
        },
        {
          src: 'assets/motor2.jpg',
          id: 'cambio-motor-02',
          label: 'Foto desde la parte inferior del motor',
        },
        {
          src: 'assets/motor3.jpg',
          id: 'cambio-motor-03',
          label: 'Foto de los soportes el motor',
        },
        {
          src: 'assets/motor4.jpg',
          id: 'cambio-motor-04',
          label: 'Foto del código del motor retroquelado en el bloque',
        },
      ],
      CambioCajaCambios: [
        {
          src: 'assets/motor5.jpg',
          id: 'caja-cambios-01',
          label: 'Foto de los soportes y su instalación',
        },
        {
          src: 'assets/motor6.jpg',
          id: 'caja-cambios-02',
          label:
            'Foto de la referencia de la caja retroquelada en la carcasa o pegatina',
        },
      ],
      cambioEscape: [
        {
          src: 'assets/docuescape.jpg',
          id: 'escape-01',
          label: 'Documentación del escape',
        },
        {
          src: 'assets/escape3.jpg',
          id: 'escape-02',
          label: 'Contraseña de homologación',
        },
        {
          src: 'assets/escape1.jpg',
          id: 'escape-03',
          label: 'Tramo intermedio del escape',
        },
        {
          src: 'assets/escape2.jpg',
          id: 'escape-04',
          label: 'Tramo final del escape',
        },
      ],
      colaEscape: [
        {
          src: 'assets/colaEscape1.jpg',
          id: 'Colaescape-01',
          label: 'Cola de escape general',
        },
        {
          src: 'assets/colaEscape2.jpg',
          id: 'Colaescape-02',
          label: 'Silencioso y anclajes',
        },
      ],
      ampliacionNDepositosCombustible: [
        {
          src: 'assets/ejemplos/mods/unidad-motriz/depositos-extra-01.jpg',
          id: 'dep-extra-01',
          label: '',
        },
      ],
      cambioDeMotorMoto: [
        {
          src: 'assets/ejemplos/mods/unidad-motriz/cambio-motor-moto-01.jpg',
          id: 'cambio-motor-moto-01',
          label: '',
        },
      ],
      CambioCajaCambiosMoto: [
        {
          src: 'assets/ejemplos/mods/unidad-motriz/caja-cambios-moto-01.jpg',
          id: 'caja-cambios-moto-01',
          label: '',
        },
      ],
      cambioEscapeMoto: [
        {
          src: 'assets/escapeMoto.jpg',
          id: 'escape-moto-01',
          label: '',
        },
      ],
      ampliacionNDepositosCombustibleMoto: [
        {
          src: 'assets/ejemplos/mods/unidad-motriz/depositos-moto-01.jpg',
          id: 'dep-moto-01',
          label: '',
        },
      ],
    },

    // ------------------- CHASIS Y SUBCHASIS -------------------
    'Chasis y Subchasis': {
      recorteSubchasisMoto: [
        {
          src: 'assets/ejemplos/mods/chasis/recorte-subchasis-moto-01.jpg',
          id: 'recorte-subchasis-moto-01',
          label: '',
        },
      ],
      modificacionDeChasisMoto: [
        {
          src: 'assets/ejemplos/mods/chasis/mod-chasis-moto-01.jpg',
          id: 'mod-chasis-moto-01',
          label: '',
        },
      ],
    },

    // ------------------- INTERIOR (CAMPER) -------------------
    'Modificaciones en el interior del vehículo': {
      mobiliarioInterior: [
        {
          src: 'assets/ejemplos/mods/interior/mobiliario-01.jpg',
          id: 'mobiliario-01',
          label: '',
        },
      ],
      fontaneria: [
        {
          src: 'assets/ejemplos/mods/interior/fontaneria-01.jpg',
          id: 'fontaneria-01',
          label: '',
        },
      ],
      muebleBajo: [
        {
          src: 'assets/ejemplos/mods/interior/mueble-bajo-01.jpg',
          id: 'mueble-bajo-01',
          label: '',
        },
      ],
      muebleAlto: [
        {
          src: 'assets/ejemplos/mods/interior/mueble-alto-01.jpg',
          id: 'mueble-alto-01',
          label: '',
        },
      ],
      aseo: [
        {
          src: 'assets/ejemplos/mods/interior/aseo-01.jpg',
          id: 'aseo-01',
          label: '',
        },
      ],
      cama: [
        {
          src: 'assets/ejemplos/mods/interior/cama-01.jpg',
          id: 'cama-01',
          label: '',
        },
      ],
      estanteria: [
        {
          src: 'assets/ejemplos/mods/interior/estanteria-01.jpg',
          id: 'estanteria-01',
          label: '',
        },
      ],
      baseGiratoria: [
        {
          src: 'assets/ejemplos/mods/interior/base-giratoria-01.jpg',
          id: 'base-giratoria-01',
          label: '',
        },
      ],
      banquetaParaAumentarPlazas: [
        {
          src: 'assets/ejemplos/mods/interior/banqueta-01.jpg',
          id: 'banqueta-01',
          label: '',
        },
      ],
      ventanas: [
        {
          src: 'assets/ventana1.jpg',
          id: 'ventanas-01',
          label: 'Foto detalle de la ventana',
        },
        {
          src: 'assets/ventana2.jpg',
          id: 'ventanas-02',
          label: 'Foto de la homologación de la ventana',
        },
      ],
      claraboyas: [
        {
          src: 'assets/claraboya1.jpg',
          id: 'claraboya-01',
          label: 'Foto detalle que la veamos por fuera',
        },
        {
          src: 'assets/claraboya2.jpg',
          id: 'claraboya-02',
          label: 'Foto detalle que la veamos por dentro',
        },
        {
          src: 'assets/claraboya3.jpg',
          id: 'claraboya-03',
          label: 'Foto de su marcaje de homologación',
        },
        {
          src: 'assets/claraboya4.jpg',
          id: 'claraboya-04',
          label: 'Foto de la homologación R10 o marcado CE del ventilador',
        },
        {
          src: 'assets/claraboya5.jpg',
          id: 'claraboya-05',
          label: 'Altura a la que está instalada la claraboya',
        },
      ],
      termo: [
        {
          src: 'assets/ejemplos/mods/interior/termo-01.jpg',
          id: 'termo-01',
          label: '',
        },
      ],
      bombaDeAgua: [
        {
          src: 'assets/bombaagua1.jpg',
          id: 'bomba-agua-01',
          label: 'Bomba de agua general',
        },
        {
          src: 'assets/bombaagua2.jpg',
          id: 'bomba-agua-02',
          label: 'Bomba',
        },
        {
          src: 'assets/bombaagua3.jpg',
          id: 'bomba-agua-03',
          label: '',
        },
      ],
      vasoDeExpansion: [
        {
          src: 'assets/vasoExpansion.jpg',
          id: 'vaso-exp-01',
          label: 'Vaso de expansión general',
        },
      ],
      depositoAguaLimpia: [
        {
          src: 'assets/depositos.jpg',
          id: 'dep-limpia-01',
          label: 'Foto general del deposito',
        },
      ],
      depositoAguaSucia: [
        {
          src: 'assets/depositos.jpg',
          id: 'dep-sucia-01',
          label: 'Foto general del deposito',
        },
      ],
      duchaInterior: [
        {
          src: 'assets/ejemplos/mods/interior/ducha-int-01.jpg',
          id: 'ducha-int-01',
          label: '',
        },
      ],
      duchaExterior: [
        {
          src: 'assets/ejemplos/mods/interior/ducha-ext-01.jpg',
          id: 'ducha-ext-01',
          label: '',
        },
      ],
      tomaDeAguaExterior: [
        {
          src: 'assets/aguaExterior.jpg',
          id: 'toma-agua-ext-01',
          label: 'Toma de agua exterior',
        },
      ],
      calefaccionDiesel: [
        {
          src: 'assets/ejemplos/mods/interior/calefaccion-diesel-01.jpg',
          id: 'calef-diesel-01',
          label: '',
        },
      ],
    },

    // ------------------- INSTALACIÓN ELÉCTRICA -------------------
    'Instalación eléctrica': {
      placaSolar: [
        {
          src: 'assets/placaSolar.jpg',
          id: 'placa-solar-01',
          label:
            'Foto del techo por fuera que se vea todo el panel en una foto',
        },
        {
          src: 'assets/placaSolar2.jpg',
          id: 'placa-solar-02',
          label:
            'Foto de la pegatina del panel solar que se vean sus características y el marcado CE',
        },
      ],
      inversor: [
        {
          src: 'assets/inversor1.jpg',
          id: 'inversor-01',
          label: 'Foto detalle que lo podamos ver instalado',
        },
        {
          src: 'assets/inversor2.jpg',
          id: 'inversor-02',
          label:
            'Foto de la cara frontal o pegatina que podamos leer sus características y marcado CE',
        },
        {
          src: 'assets/inversor3.jpg',
          id: 'inversor-03',
          label:
            'Si por el lateral tiene una contraseña de homologación enviar también',
        },
      ],
      reguladorSolar: [
        {
          src: 'assets/reguladorSolar.jpg',
          id: 'regulador-01',
          label: 'Foto que se vea el regulador solar instalado con perspectiva',
        },
        {
          src: 'assets/placaSolar3.jpg',
          id: 'placa-solar-03',
          label:
            'Foto de la cara frontal o pegatina del lateral que se puedan ver sus características',
        },
      ],
      cargadorDeBateria: [
        {
          src: 'assets/ejemplos/mods/inst-elec/cargador-01.jpg',
          id: 'cargador-01',
          label: '',
        },
      ],
      bateriaAuxiliar: [
        {
          src: 'assets/bateriaAuxiliar1.jpg',
          id: 'bat-aux-01',
          label: 'Foto que se vea la batería auxiliar instalada',
        },
        {
          src: 'assets/bateriaAuxiliar2.jpg',
          id: 'bat-aux-02',
          label:
            'Foto del lateral o pegatina que podamos leer bien sus características',
        },
      ],
      iluminacionExterior: [
        {
          src: 'assets/ejemplos/mods/inst-elec/ilum-ext-01.jpg',
          id: 'ilum-ext-01',
          label: '',
        },
      ],
      tomaCorrienteexterior: [
        {
          src: 'assets/ejemplos/mods/inst-elec/toma-corr-ext-01.jpg',
          id: 'toma-corr-ext-01',
          label: '',
        },
      ],
      tomaCorrienteInterior: [
        {
          src: 'assets/ejemplos/mods/inst-elec/toma-corr-int-01.jpg',
          id: 'toma-corr-int-01',
          label: '',
        },
      ],
    },
  };

  // ====== NUEVO: máx. imágenes por subselección según nº de ejemplos ======
  get totalSlots(): number {
    let total = 0;
    for (const mod of this.modsSeleccionadas) {
      for (const so of this.subopcionesActivas(mod)) {
        total += this.maxImagesForSlot(mod, so);
      }
    }
    return total;
  }

  /** Nº de ejemplos DEFINIDOS para esa subselección (sin deduplicación visual). */
  private examplesCount(mod: any, subKey: string): number {
    const list = this.getExampleList(mod?.nombre ?? '', subKey);
    return Math.max(1, list?.length || 1);
  }

  /** Límite de imágenes que puede subir el usuario en esa subselección. */
  public maxImagesForSlot(mod: any, subKey: string): number {
    return this.visibleExamplesFor(mod, subKey).length;
  }

  /** Para el HTML: true si queremos poner la tarjeta a ancho completo (más de 3 ejemplos). */
  public shouldFullWidth(mod: any, subKey: string): boolean {
    return this.examplesCount(mod, subKey) > 3;
  }

  // Carga una imagen en una posición específica (índice i)
  async onSelectedForIndex(ev: Event, mod: any, subKey: string, index: number) {
    const input = ev.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const blob = await this.normalizeOrientation(file);
    const preview = await this.blobToDataUrl(blob);

    const k = this.slotKey(mod, subKey);

    // Inicializamos el array si no existe
    if (!this.perSlotPreviews[k]) this.perSlotPreviews[k] = [];
    if (!this.perSlotBlobs[k]) this.perSlotBlobs[k] = [];

    // Asignamos en la posición exacta
    this.perSlotPreviews[k][index] = preview;
    this.perSlotBlobs[k][index] = blob;

    this.toggleSubopcion(mod, subKey, true);
    this.recomputeFlatFromSlots();
    this.emitAutosave();

    input.value = '';
  }

  // Elimina la imagen de una posición específica (la deja vacía, no desplaza las demás)
  removeImageAtIndex(mod: any, subKey: string, index: number) {
    const k = this.slotKey(mod, subKey);
    if (!this.perSlotPreviews[k]) return;

    // Usamos delete o asignamos undefined para mantener el "hueco" y que no se muevan las fotos
    delete this.perSlotPreviews[k][index];
    delete this.perSlotBlobs[k][index];

    this.recomputeFlatFromSlots();
    this.emitAutosave();
  }

  // Helper para obtener la imagen segura en una posición
  getPreviewAt(mod: any, subKey: string, index: number): string | null {
    const k = this.slotKey(mod, subKey);
    return this.perSlotPreviews[k]?.[index] || null;
  }

  /** Garantiza que el array por-slot no excede el máximo permitido. */
  private clipSlotToMax(mod: any, subKey: string) {
    const k = this.slotKey(mod, subKey);
    const max = this.maxImagesForSlot(mod, subKey);
    const prev = this.perSlotPreviews[k] || [];
    const blobs = this.perSlotBlobs[k] || [];
    if (prev.length > max) {
      prev.length = max;
      blobs.length = max;
    }
    this.perSlotPreviews[k] = prev;
    this.perSlotBlobs[k] = blobs;
  }

  // =======================================================================
  //   CICLO VIDA
  // =======================================================================
  async ngOnInit(): Promise<void> {
    console.log('EditorModificacionesComponent ngOnInit', this.datosEntrada);
    if (this.datosEntrada?.step) this.step = this.datosEntrada.step;

    // Restaurar previas
    if (Array.isArray(this.datosEntrada?.prevImagesB64)) {
      this.prevImagesB64 = [...this.datosEntrada.prevImagesB64];
      this.prevPreviews = [...this.prevImagesB64];
      this.prevImages = await Promise.all(
        this.prevImagesB64.map((b64) => this.dataUrlToBlob(b64))
      );
    }

    // Restaurar post (se rehidrata a slots más abajo)
    if (Array.isArray(this.datosEntrada?.postImagesB64)) {
      this.postImagesB64 = [...this.datosEntrada.postImagesB64];
      this.postPreviews = [...this.postImagesB64];
      this.postImages = await Promise.all(
        this.postImagesB64.map((b64) => this.dataUrlToBlob(b64))
      );
    }

    // Mods seleccionadas
    const allMods = Array.isArray(this.datosEntrada?.modificaciones)
      ? this.datosEntrada.modificaciones
      : [];
    this.modsSeleccionadas = allMods.filter((m: any) => m?.seleccionado);

    // Subopciones activas desde el detalle
    this.initSelectedSuboptsFromDetalle();

    // Hidratar estructura por-slot desde el flat (ahora soporta múltiple)
    await this.hydratePerSlotsFromFlat();

    // Docs
    if (this.datosEntrada?.docsImagesB64) {
      this.docsImagesB64 = { ...this.datosEntrada.docsImagesB64 };
      for (const [tipo, arrB64] of Object.entries(this.docsImagesB64)) {
        this.docsPreviews[tipo] = [...(arrB64 || [])];
        this.docsBlobs[tipo] = await Promise.all(
          (arrB64 as string[]).map((b64) => this.dataUrlToBlob(b64))
        );
      }
    }

    this.emitAutosave();
  }

  // ---- Helpers Blob <-> DataURL ----
  public blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  }

  public async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const res = await fetch(dataUrl);
    return await res.blob();
  }

  public snapshot() {
    return {
      ...(this.datosEntrada || {}),
      step: this.step,
      ...(this.prevImagesB64.length
        ? { prevImagesB64: this.prevImagesB64 }
        : {}),
      ...(this.postImagesB64.length
        ? { postImagesB64: this.postImagesB64 }
        : {}),
      ...(Object.keys(this.docsImagesB64).length
        ? { docsImagesB64: this.docsImagesB64 }
        : {}),
      prevImages: this.prevImages,
      postImages: this.postImages,
    };
  }

  public emitAutosave() {
    this.autosave.emit(this.snapshot());
  }

  // ---- Normalizar orientación ----
  public normalizeOrientation(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      loadImage(
        file,
        (canvasElement) => {
          if (!(canvasElement instanceof HTMLCanvasElement))
            return reject('No se pudo procesar la imagen');
          canvasElement.toBlob(
            (blob) =>
              blob ? resolve(blob) : reject('Error creando Blob desde canvas'),
            file.type
          );
        },
        { canvas: true, orientation: true }
      );
    });
  }

  // ---- Inputs genéricos (pasos 1 y 3) ----
  openInput(type: 'gallery' | 'camera', step: number, i: number) {
    let input: ElementRef<HTMLInputElement> | undefined;

    if (step === 1) {
      input =
        type === 'gallery'
          ? this.galleryInputs.get(i)
          : this.cameraInputs.get(i);
    } else if (step === 3) {
      input =
        type === 'gallery'
          ? this.galleryInputsDocs.get(i)
          : this.cameraInputsDocs.get(i);
    }

    input?.nativeElement.click();
  }

  // ---- Paso 1 ----
  async onPrevSelected(ev: Event, index: number) {
    const input = ev.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const blob = await this.normalizeOrientation(file);
    const preview = await this.blobToDataUrl(blob);

    this.prevImages[index] = blob;
    this.prevPreviews[index] = preview;
    this.prevImagesB64[index] = preview;

    this.emitAutosave();
  }

  isValidPreview(previews: string[]): number {
    return previews.filter((p) => !!p).length;
  }

  // ---- Paso 2: subopciones/slots ----
  public slotKey(mod: any, subKey: string): SlotKey {
    return `${mod.nombre}::${subKey}`;
  }

  tituloMod(modNombre: string): string {
    return this.titulos.mod?.[modNombre] ?? modNombre;
  }
  tituloSub(modNombre: string, subKey: string): string {
    if (subKey === 'default') {
      return 'Imágenes Generales';
    }
    return this.titulos.sub?.[modNombre]?.[subKey] ?? this.pretty(subKey);
  }

  public pretty(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^./, (s) => s.toUpperCase());
  }

  subopcionesPosibles(mod: any): { key: string; label: string }[] {
    const keys: string[] = [];

    if (mod?.detalle && typeof mod.detalle === 'object') {
      for (const k of Object.keys(mod.detalle)) keys.push(k);
    }
    for (const sub of ['mobiliarioInterior', 'fontaneria', 'focosTrabajo']) {
      if (mod?.[sub] && typeof mod[sub] === 'object') {
        for (const k of Object.keys(mod[sub])) keys.push(k);
      }
    }

    const set = new Set(keys.filter((k) => k));
    return Array.from(set).map((k) => ({
      key: k,
      label: this.tituloSub(mod.nombre, k),
    }));
  }

  public initSelectedSuboptsFromDetalle() {
    this.selectedSubopts = {};

    const clavesContenedores = [
      'mobiliarioInterior',
      'fontaneria',
      'focosTrabajo',
    ];

    for (const mod of this.modsSeleccionadas) {
      const set = new Set<string>();

      if (mod?.detalle && typeof mod.detalle === 'object') {
        for (const [k, v] of Object.entries(mod.detalle)) {
          if (v && !clavesContenedores.includes(k)) {
            set.add(k);
          }
        }
      }

      for (const sub of clavesContenedores) {
        if (mod?.[sub] && typeof mod[sub] === 'object') {
          for (const [k, v] of Object.entries(mod[sub]))
            if (v) set.add(k as string);
        }
      }

      if (set.size === 0) {
        set.add('default');
      }

      this.selectedSubopts[mod.nombre] = set;
    }
  }

  subopcionesActivas(mod: any): string[] {
    return Array.from(this.selectedSubopts[mod.nombre] || []);
  }
  isSubopcionActiva(mod: any, subKey: string): boolean {
    return this.selectedSubopts[mod.nombre]?.has(subKey) ?? false;
  }

  toggleSubopcion(mod: any, subKey: string, checked?: boolean) {
    const set = this.selectedSubopts[mod.nombre] || new Set<string>();
    const willBeActive = checked ?? !set.has(subKey);

    if (willBeActive) {
      set.add(subKey);
    } else {
      set.delete(subKey);
      const sk = this.slotKey(mod, subKey);
      delete this.perSlotPreviews[sk];
      delete this.perSlotBlobs[sk];
      this.recomputeFlatFromSlots();
      this.emitAutosave();
    }
    this.selectedSubopts[mod.nombre] = set;
  }

  openInputForSlot(type: 'gallery' | 'camera', mod: any, subKey: string) {
    const input =
      type === 'gallery'
        ? this.galleryInputsMods.get(0)
        : this.cameraInputsMods.get(0);
    input?.nativeElement.setAttribute('data-mod', mod.nombre);
    input?.nativeElement.setAttribute('data-sub', subKey);
    input?.nativeElement.click();
  }

  // Ahora soporta múltiples imágenes por subselección (hasta el nº de ejemplos)
  async onSelectedForSlot(ev: Event, mod: any, subKey: string) {
    const input = ev.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const k = this.slotKey(mod, subKey);
    const currentPrev = this.perSlotPreviews[k] || [];
    const currentBlob = this.perSlotBlobs[k] || [];
    const max = this.maxImagesForSlot(mod, subKey);
    const remaining = Math.max(0, max - currentPrev.length);

    const files = Array.from(input.files).slice(0, remaining);
    if (files.length === 0) {
      input.value = '';
      return;
    }

    const blobs = await Promise.all(
      files.map((f) => this.normalizeOrientation(f))
    );
    const previews = await Promise.all(blobs.map((b) => this.blobToDataUrl(b)));

    this.perSlotPreviews[k] = [...currentPrev, ...previews];
    this.perSlotBlobs[k] = [...currentBlob, ...blobs];

    // Asegura que la subopción está marcada
    this.toggleSubopcion(mod, subKey, true);

    // Recorta por si acaso y reflatea
    this.clipSlotToMax(mod, subKey);
    this.recomputeFlatFromSlots();
    this.emitAutosave();

    input.value = '';
  }

  removeSlotImage(mod: any, subKey: string, index: number) {
    const key = this.slotKey(mod, subKey);
    const arrPrev = this.perSlotPreviews[key] || [];
    const arrBlob = this.perSlotBlobs[key] || [];
    if (index < 0 || index >= arrPrev.length) return;

    arrPrev.splice(index, 1);
    arrBlob.splice(index, 1);

    if (arrPrev.length === 0) {
      delete this.perSlotPreviews[key];
      delete this.perSlotBlobs[key];
    } else {
      this.perSlotPreviews[key] = arrPrev;
      this.perSlotBlobs[key] = arrBlob;
      this.clipSlotToMax(mod, subKey);
    }

    this.recomputeFlatFromSlots();
    this.emitAutosave();
  }

  // Rehidratación desde el array plano postImagesB64 al nuevo modelo multi-slot
  public async hydratePerSlotsFromFlat(): Promise<void> {
    this.perSlotPreviews = {};
    this.perSlotBlobs = {};
    if (!this.postImagesB64?.length) return;

    const images = [...this.postImagesB64];
    let idx = 0;

    for (const mod of this.modsSeleccionadas) {
      for (const so of this.subopcionesActivas(mod)) {
        const k = this.slotKey(mod, so);
        const max = this.maxImagesForSlot(mod, so);
        const previews: string[] = [];
        const blobs: Blob[] = [];

        for (let j = 0; j < max && idx < images.length; j++, idx++) {
          const b64 = images[idx];
          previews.push(b64);
          blobs.push(await this.dataUrlToBlob(b64));
        }

        if (previews.length) {
          this.perSlotPreviews[k] = previews;
          this.perSlotBlobs[k] = blobs;
        }
      }
    }

    this.recomputeFlatFromSlots();
  }

  public recomputeFlatFromSlots() {
    const newB64: string[] = [];
    const newPrev: string[] = [];
    const newBlobs: Blob[] = [];

    for (const mod of this.modsSeleccionadas) {
      for (const so of this.subopcionesActivas(mod)) {
        const k = this.slotKey(mod, so);

        // Obtenemos los arrays (pueden ser 'sparse', es decir, tener huecos vacíos)
        const arrPrev = this.perSlotPreviews[k] || [];
        const arrBlob = this.perSlotBlobs[k] || [];

        // Obtenemos cuántos huecos reales existen para esta opción
        const max = this.maxImagesForSlot(mod, so);

        // Iteramos hasta el máximo de huecos posibles (0, 1, 2...)
        for (let i = 0; i < max; i++) {
          const p = arrPrev[i];
          const b = arrBlob[i];

          // CAMBIO CLAVE: Solo añadimos si existen (filtramos los huecos vacíos)
          if (p && b) {
            newB64.push(p);
            newPrev.push(p);
            newBlobs.push(b);
          }
        }
      }
    }

    // Límite duro global (seguridad final)
    const maxGlobal = this.totalSlots;
    if (newB64.length > maxGlobal) {
      this.errorPostImagesCount = true;
      // Recortamos el exceso si ocurriera
      newB64.length = maxGlobal;
      newPrev.length = maxGlobal;
      newBlobs.length = maxGlobal;
    } else {
      this.errorPostImagesCount = false;
    }

    this.postImagesB64 = newB64;
    this.postPreviews = newPrev;
    this.postImages = newBlobs;
  }

  // ---- Docs (paso 3) ----
  async onDocSelected(
    ev: Event,
    tipo: string,
    source: 'camera' | 'gallery' = 'camera'
  ) {
    const input = ev.target as HTMLInputElement;
    if (!input.files) return;

    const currentCount = this.docsPreviews[tipo]?.length || 0;
    const files = Array.from(input.files);

    if (currentCount >= 4) {
      this.docError[tipo] = 'Solo puedes subir un máximo de 4 imágenes.';
      input.value = '';
      return;
    }

    if (source === 'gallery' && currentCount + files.length > 4) {
      this.docError[tipo] = 'No puedes seleccionar más de 4 imágenes.';
      input.value = '';
      return;
    }

    const allowed = files.slice(0, 4 - currentCount);
    const blobs = await Promise.all(
      allowed.map((f) => this.normalizeOrientation(f))
    );
    const previews = await Promise.all(blobs.map((b) => this.blobToDataUrl(b)));

    this.docsBlobs[tipo] = [...(this.docsBlobs[tipo] || []), ...blobs];
    this.docsPreviews[tipo] = [...(this.docsPreviews[tipo] || []), ...previews];
    this.docsImagesB64[tipo] = [
      ...(this.docsImagesB64[tipo] || []),
      ...previews,
    ];

    this.docError[tipo] = '';
    this.emitAutosave();
    input.value = '';
  }

  removeDocImage(tipo: string, index: number) {
    const arrPrev = this.docsPreviews[tipo] || [];
    const arrBlob = this.docsBlobs[tipo] || [];
    const arrB64 = this.docsImagesB64[tipo] || [];

    if (index < 0 || index >= arrPrev.length) return;

    arrPrev.splice(index, 1);
    arrBlob.splice(index, 1);
    arrB64.splice(index, 1);

    this.docsPreviews[tipo] = arrPrev;
    this.docsBlobs[tipo] = arrBlob;
    this.docsImagesB64[tipo] = arrB64;

    this.emitAutosave();
  }

  // ---- Navegación ----
  next() {
    if (this.step < 3) {
      this.step++;
      this.emitAutosave();
    }
  }

  back() {
    if (this.step > 1) {
      this.step--;
      this.emitAutosave();
    } else {
      this.volver.emit(this.snapshot());
    }
  }

  onSave() {
    this.emitAutosave();
    this.continuar.emit(this.snapshot());
  }

  // ===========================
  //   Helpers de ejemplos
  // ===========================
  private slugify(s: string): string {
    return (s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private getExampleList(modNombre: string, subKey?: string): ExampleMeta[] {
    if (subKey && this.ejemploPorSubList[modNombre]?.[subKey]) {
      return this.ejemploPorSubList[modNombre][subKey];
    }
    if (this.ejemploPorModList[modNombre]?.length) {
      return this.ejemploPorModList[modNombre];
    }
    const modSlug = this.slugify(modNombre);
    const subSlug = subKey ? this.slugify(subKey) : 'default';
    return [
      {
        src: `assets/ejemplos/mods/${modSlug}/${subSlug}.jpg`,
        id: `${modSlug}-${subSlug}`,
      },
    ];
  }

  private seenExampleIdsBefore(mod: any, subKey: string): Set<string> {
    const seen = new Set<string>();
    const modIndex = this.modsSeleccionadas.findIndex((m) => m === mod);
    if (modIndex === -1) return seen;

    // Mods anteriores
    for (let i = 0; i < modIndex; i++) {
      const mPrev = this.modsSeleccionadas[i];
      const prevSubs = this.subopcionesActivas(mPrev);
      for (const sk of prevSubs) {
        const list = this.getExampleList(mPrev.nombre, sk);
        list.forEach((e) => seen.add(e.id));
      }
    }

    // Misma mod, subopciones anteriores
    const subs = this.subopcionesActivas(mod);
    for (const sk of subs) {
      if (sk === subKey) break;
      const list = this.getExampleList(mod.nombre, sk);
      list.forEach((e) => seen.add(e.id));
    }

    return seen;
  }

  // Úsalo en el HTML: *ngFor="let ej of visibleExamplesFor(mod, soKey)"
  public visibleExamplesFor(mod: any, subKey: string): ExampleMeta[] {
    const all = this.getExampleList(mod?.nombre ?? '', subKey);
    const seen = this.seenExampleIdsBefore(mod, subKey);
    const filtered = all.filter((e) => !seen.has(e.id));

    if (
      filtered.length === 0 &&
      this.ejemploPorSubList[mod?.nombre ?? '']?.[subKey] == null
    ) {
      const fallback = this.getExampleList(mod?.nombre ?? '');
      return fallback.filter((e) => !seen.has(e.id));
    }
    return filtered.length
      ? filtered
      : [{ src: this.GENERIC_EXAMPLE, id: 'generic' }];
  }

  // Compat con HTML antiguo que sólo pide una imagen por módulo
  getImagenEjemplo(modNombre: string): string {
    const lista = this.ejemploPorModList[modNombre];
    if (lista && lista.length) return lista[0].src;
    return 'assets/cochee.png';
  }

  // ---- Modal: quitar reforma / quitar subselección ----
  openConfirmRemove(mod: any) {
    this.modParaQuitar = mod;
    this.modalAction = 'mod';
    this.subParaQuitarKey = null;

    const el = document.getElementById('modalQuitarReforma');
    if (el) {
      this.modalInstance = new Modal(el);
      this.modalInstance.show();
    }
  }

  openConfirmRemoveSub(mod: any, subKey: string) {
    this.modParaQuitar = mod;
    this.modalAction = 'sub';
    this.subParaQuitarKey = subKey;

    const el = document.getElementById('modalQuitarReforma');
    if (el) {
      this.modalInstance = new Modal(el);
      this.modalInstance.show();
    }
  }

  confirmRemove() {
    if (!this.modParaQuitar) return;

    if (this.modalAction === 'mod') {
      const nombre = this.modParaQuitar.nombre;

      // Limpia imágenes de todas las subopciones y desmarca
      const posibles = this.subopcionesPosibles(this.modParaQuitar).map(
        (s) => s.key
      );
      for (const key of posibles) {
        const k = this.slotKey(this.modParaQuitar, key);
        delete this.perSlotPreviews[k];
        delete this.perSlotBlobs[k];
      }

      this.selectedSubopts[nombre] = new Set<string>();
      this.modParaQuitar.seleccionado = false;
      this.modsSeleccionadas = this.modsSeleccionadas.filter(
        (m) => m.nombre !== nombre
      );
    } else {
      if (!this.subParaQuitarKey) return;
      const k = this.slotKey(this.modParaQuitar, this.subParaQuitarKey);
      delete this.perSlotPreviews[k];
      delete this.perSlotBlobs[k];

      const set =
        this.selectedSubopts[this.modParaQuitar.nombre] || new Set<string>();
      set.delete(this.subParaQuitarKey);
      this.selectedSubopts[this.modParaQuitar.nombre] = set;
    }

    this.recomputeFlatFromSlots();
    this.emitAutosave();

    // Reset estado modal
    this.modParaQuitar = null;
    this.subParaQuitarKey = null;
    this.modalAction = 'mod';
  }
}
