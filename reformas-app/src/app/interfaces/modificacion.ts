export interface Mueble {
  tipo: 'bajo' | 'alto' | 'aseo';
  medidas?: string;
  descripcion?: string;
  configuracion?: string;
  peso?: number;
}

export interface ClaraboyaItem {
  marca?: string;
  modelo?: string;
  descripcion?: string;
  homologacion?: string;
  medidas?: string;
  pesoPiezaKg?: number;
  anchuraPiezaM?: number;
  alturaPiezaM?: number;
  metrica?: number;
  nTornillos?: number;
  calidadTornillo?: number;
  seccionResistenteAs?: number;
  resTraccionMinTornillo88Kgmm2?: number;
  cwCoefAerodinamico?: number;
  densidadAireKgM3?: number;
  velocidadAireV2ms?: number;
  coefSeguridadK?: number;
  curvatura?: number;
}

export interface PlacaSolarItem {
  marca?: string;
  modelo?: string;
  potencia?: string;
  dimensiones?: string;
  ubicacion?: string;
  agruparIguales?: boolean;
  cantidad?: number;
  pesoPiezaKg?: number;
  anchuraPiezaM?: number;
  alturaPiezaM?: number;
  metrica?: number;
  nTornillos?: number;
  calidadTornillo?: number;
  seccionResistenteAs?: number;
  resTraccionMinTornillo88Kgmm2?: number;
  cwCoefAerodinamico?: number;
  densidadAireKgM3?: number;
  velocidadAireV2ms?: number;
  coefSeguridadK?: number;
  curvatura?: number;
}

export interface VentanaItem {
  marca?: string;
  modelo?: string;
  dimensiones?: string;
  descripcion?: string;
  homologacion?: string;
}

export interface ReformaAdicionalItem {
  titulo?: string;
  descripcion?: string;
  curvatura?: number;
}

export interface MuebleBajoItem {
  cajones?: number;
  ubicacionMuebleBajo?: string;
  configuracionMuebleBajo?: string;
  pesoMuebleBajo?: number | string;
  tornillosMuebleBajo?: number | string;
  metricaTornillosMuebleBajo?: number | null;
}

export interface MuebleAltoItem {
  ubicacionMuebleAlto?: string;
  configuracionMuebleAlto?: string;
  pesoMuebleAlto?: number | string;
  tornillosMuebleAlto?: number | string;
  metricaTornillosMuebleAlto?: number | null;
}

export interface MuebleAseoItem {
  descripcion?: string;
  configuracionMuebleAseo?: string;
  pesoMuebleAseo?: number | string;
  tornillosMuebleAseo?: number | string;
  metricaTornillosMuebleAseo?: number | null;
}

export type ReformaCampoCompartidoGrupo =
  | 'claraboya'
  | 'ventana'
  | 'placaSolar'
  | 'reformaAdicional'
  | 'muebleBajo'
  | 'muebleAlto'
  | 'muebleAseo';

export interface ReformaCampoCompartidoDefinicion {
  grupo: ReformaCampoCompartidoGrupo;
  campos: readonly string[];
}

export const REFORMA_CAMPOS_COMPARTIDOS: readonly ReformaCampoCompartidoDefinicion[] =
  [
    {
      grupo: 'claraboya',
      campos: [
        'marca',
        'modelo',
        'descripcion',
        'homologacion',
        'medidas',
        'pesoPiezaKg',
        'metrica',
        'nTornillos',
        'resTraccionMinTornillo88Kgmm2',
        'cwCoefAerodinamico',
        'densidadAireKgM3',
        'velocidadAireV2ms',
        'coefSeguridadK',
        'curvatura',
      ],
    },
    {
      grupo: 'ventana',
      campos: ['homologacion', 'marca', 'modelo', 'dimensiones', 'descripcion'],
    },
    {
      grupo: 'placaSolar',
      campos: [
        'marca',
        'modelo',
        'potencia',
        'dimensiones',
        'ubicacion',
        'pesoPiezaKg',
        'metrica',
        'nTornillos',
        'resTraccionMinTornillo88Kgmm2',
        'cwCoefAerodinamico',
        'densidadAireKgM3',
        'velocidadAireV2ms',
        'coefSeguridadK',
        'curvatura',
      ],
    },
    {
      grupo: 'reformaAdicional',
      campos: [],
    },
    {
      grupo: 'muebleBajo',
      campos: [
        'ubicacionMuebleBajo',
        'configuracionMuebleBajo',
        'pesoMuebleBajo',
        'tornillosMuebleBajo',
        'metricaTornillosMuebleBajo',
      ],
    },
    {
      grupo: 'muebleAlto',
      campos: [
        'ubicacionMuebleAlto',
        'configuracionMuebleAlto',
        'pesoMuebleAlto',
        'tornillosMuebleAlto',
        'metricaTornillosMuebleAlto',
      ],
    },
    {
      grupo: 'muebleAseo',
      campos: [
        'descripcion',
        'configuracionMuebleAseo',
        'pesoMuebleAseo',
        'tornillosMuebleAseo',
        'metricaTornillosMuebleAseo',
      ],
    },
  ] as const;

export interface Modificacion {
  acciones?: string[];
  anotacion?: string | boolean;
  nTornillos?: number;
  anotacion1?: boolean | string;
  anotacion2?: boolean | string;
  anotacion3?: boolean | string;
  materialEstribos?: string;
  anchoAletines?: number;
  anchoSobrealetines?: number;
  cargaVertical?: number;
  capacidadKg?: number;
  capacidadLb?: number;
  carreteraDesactivada?: boolean;
  clase?: string;
  superficieFrontalM2Aleron?: number;
  claseBarra?: string;
  cdgconductor?: number;
  cdgocu2?: number;
  cdgocu3?: number;
  cdgcargautil?: number;
  cdgcargavert?: number;
  incluirNotaQuitadoCinturon?: boolean;
  altoAletines?: number;
  posicionAletines?: string;
  posicionSobrealetines?: string;
  potenciaTecho?: number;
  radioCurvaRDifusor?: number;
  radioCurvaRLipDelantero?: number;
  radioCurvaRCalandra?: number;
  radioCurvaRPlanchaCapo?: number;
  radioCurvaRRefuerzo?: number;
  radioCurvaRPeldanos?: number;
  numTornillosAleron?: number;
  modeloTecho?: string;
  marcaSobreletines?: string;
  claseBola?: string;
  dKn?: number;
  descripcion?: string;
  tacosDelantero?: boolean;
  tacosTrasero?: boolean;
  descripcionLuces?: Record<string, boolean>;
  detallesMuelles?: Record<string, boolean>;
  detalle?: {
    aletines?: boolean;
    sobrealetines?: boolean;
    instalacionPorta?: boolean;
    reubicacionTrasera?: boolean;
    cambioUbicacionDelantera?: boolean;
    luzPosicionFreno?: boolean;
    intermitente?: boolean;
    marchaAtras?: boolean;
    catadioptrico?: boolean;
    sustitucionEjeDelantero?: boolean;
    sustitucionEjeTrasero?: boolean;
    interDelantero?: boolean;
    interTrasero?: boolean;
    interLateral?: boolean;
    luzMatricula?: boolean;
    luzAntinieblas?: boolean;
    estribosotaloneras?: boolean;
    anotacionAntideslizante?: string;
  };
  contrasenaHomologacionEje?: string;
  incluyeIntermitenteFaro?: string;
  diametroEspiraDelantero?: number;
  metrica?: number;
  medidasManillar?: number;
  marcaluzGrupoOptico?: string;
  modeloluzGrupoOptico?: string;
  referencialuzGrupoOptico?: string;
  curvaturaGuardaDelantMoto?: number;
  curvaturaluzGrupoOptico?: number;
  homologacionluzGrupoOptico?: string;

  marcaintermitenteDelantero?: string;
  referenciaintermitenteDelantero?: string;
  marcajesintermitenteDelantero?: string;
  homologacionintermitenteDelantero?: string;
  curvaturaintermitenteDelantero?: number;

  marcaintermitenteTrasero?: string;
  referenciaintermitenteTrasero?: string;
  marcajesintermitenteTrasero?: string;
  homologacionintermitenteTrasero?: string;
  curvaturaintermitenteTrasero?: number;

  marcajesintermitenteLateral?: string;
  homologacionintermitenteLateral?: string;

  mmtaTotalSuspension?: number;
  mmta1EjeSuspension?: number;
  mmta2EjeSuspension?: number;

  checkEje1Neumaticos?: boolean;
  indiceCargaEje1Neumaticos?: number;
  cargaEquivalenteEje1Neumaticos?: number;
  mmaEje1Neumaticos?: number;
  checkEje2Neumaticos?: boolean;
  indiceCargaEje2Neumaticos?: number;
  cargaEquivalenteEje2Neumaticos?: number;
  mmaEje2Neumaticos?: number;
  indiceCargaGeneralNeumaticos?: number;
  cargaEquivalenteGeneralNeumaticos?: number;

  ubicacionDiscos?: 'delanteros' | 'traseros' | 'ambos';
  modificaPinzasDiscos?: boolean;
  sonIguales?: boolean;
  marcaDiscos?: string;
  modeloDiscos?: string;
  referenciaDiscos?: string;
  diametroDiscos?: number;
  espesorDiscos?: number;
  modeloDiscoTrasero?: string;
  diametroDiscoTrasero?: number;
  espesorDiscoTrasero?: number;

  marcaVolante?: string;
  diametroVolante?: number;
  llevaEspaciador?: boolean;
  espesorEspaciador?: number;
  tieneAirbagOriginal?: boolean;
  tieneAirbagNuevo?: boolean;
  marcaEspaciador?: string;

  mandosOriginalesLuzMarchaAtras?: boolean;
  descripcionAccionamientoLuzMarchaAtras?: string;
  referenciaLuzMarchaAtras?: string;
  tecnologiaLuzMarchaAtras?: string;
  marcaLuzMarchaAtras?: string;
  marcajeLuzMarchaAtras?: string;
  contrasenaLuzMarchaAtras?: string;
  marcaLuz?: string;
  referenciaLuz?: string;
  tecnologiaLuz?: string;
  marcajeLuz?: string;
  contrasenaHomologacion?: string;

  ubicacionAntiniebla?: 'delanteros' | 'traseros' | 'ambos';
  marcaAntinieblaDel?: string;
  homologacionAntinieblaDel?: string;
  marcaAntinieblaTras?: string;
  homologacionAntinieblaTras?: string;

  ubicacionPROTECTORES?: 'delantero' | 'trasero';
  materialProtectorPROTECTORES?: string;
  medidaLargoPROTECTORES?: number;
  medidaAltoPROTECTORES?: number;

  materialPlancha?: string;
  ubicacionPlancha?: string;
  medidaLargoPLANCHA?: number;
  medidaAnchoPLANCHA?: number;

  marcaTecho?: string;
  referenciaTecho?: string;
  anchoTecho?: number;
  largoTecho?: number;
  altoTecho?: number;
  materialEstructuraTecho?: string;
  tipoAccionamientoTecho?: string;
  distanciaAsientosSueloTecho?: number;

  tipoOrigenAsiento?: string;
  referenciaAsiento?: string;

  esReubicadoVelocimetro?: boolean;
  observacionesTestigosVelocimetro?: string;
  estaCalibradoVelocimetro?: boolean;
  tipoVelocimetro?: string;
  modeloVelocimetro?: string;
  listaTestigosVelocimetro?: string;

  incluirNotaIntegridadBasculante?: boolean;
  marcaBasculante?: string;
  modeloBasculante?: string;
  contrasenaBasculante?: string;

  plazasAntesReduccion?: number;
  plazasDespuesReduccion?: number;
  desinstalacionAsideroReduccion?: boolean;
  desinstalacionEstriberasReduccion?: boolean;

  marcaMandoLuces?: string;
  modeloMandoLuces?: string;
  funcionesIzquierdoMandoLuces?: string;
  funcionesDerechoMandoLuces?: string;

  retornoAutomaticoAcelerador?: boolean;
  marcaAcelerador?: string;
  modeloAcelerador?: string;

  marcaTorretas?: string;
  medidaLargoTorretas?: number;
  medidaAnchoTorretas?: number;
  medidaAltoTorretas?: number;

  radioCurvaturaEscape?: number;

  pesoAleron?: number;
  coefAerodinamicoCwAleron?: number;
  velocidadAireV2msAleron?: number;
  densidadAireKgM3Aleron?: number;
  coefSeguridadKAleron?: number;
  curvaturaAleron?: number;
  calidadTornilloAleron?: number;
  resTraccionMinTornillo88Kgmm2Aleron?: number;
  seccionResistenteAsAleron?: number;
  metricaAleron?: number;
  anchuraAleron?: number;
  alturaAleron?: number;

  tipoModificacionSubchasis?: string;
  descripcionCorteSubchasis?: string;

  cambiaSoloSilencioso?: boolean;
  tipoSalidaOriginalEscape?: string;
  ubicacionOriginalEscape?: string;
  tipoSalidaNuevaEscape?: string;
  ubicacionNuevaEscape?: string;
  sobresaleEscape?: boolean;

  medidaLlantas?: string;
  medidaNeumaticos?: string;

  reformasAdicionales?: string;
  reformasAdicionalesItems?: ReformaAdicionalItem[];

  cumpleSalientesEstriberas?: boolean;
  marcaEstriberas?: string;
  refPisanteEstriberas?: string;
  refSoporteEstriberas?: string;

  reubicaFrenoSoportesDesplazados?: boolean;
  reubicaCambioSoportesDesplazados?: boolean;
  marcaSoportesDesplazados?: string;
  referenciaSoportesDesplazados?: string;

  ubicacionBombaFreno?: string;
  marcaBombaFrenoDel?: string;
  referenciaBombaFrenoDel?: string;
  marcaBombaFrenoTras?: string;
  referenciaBombaFrenoTras?: string;

  anclajesOriginalesDeposito?: boolean;
  descripcionUbicacionDeposito?: string;
  marcaDeposito?: string;
  modeloDeposito?: string;
  contrasenaDeposito?: string;
  capacidadDeposito?: number;

  ubicacionSoporteMatricula?: string;
  materialSoporteMatricula?: string;
  marcaSoporteMatricula?: string;
  medidaAnchoSoporteMatricula?: number;
  medidaAltoSoporteMatricula?: number;

  sinAfectacionEstructuralAntena?: boolean;
  tipoAntena?: string;
  ubicacionAntena?: string;
  marcaAntena?: string;
  modeloAntena?: string;

  enEmplazamientoOriginalEnganche?: boolean;
  marcaEnganche?: string;
  claseEnganche?: string;
  contrasenaEnganche?: string;
  mmrEnganche?: number;

  numeroPlazasBanqueta?: number;
  esUsoEstacionarioBanqueta?: boolean;
  materialBanqueta?: string;
  ubicacionBanqueta?: string;
  marcaBanqueta?: string;
  modeloBanqueta?: string;

  marcaTermo?: string;
  modeloTermo?: string;
  capacidadTermo?: number;
  ubicacionTermo?: string;

  zonaLateralesRevestimiento?: string;
  zonaSueloRevestimiento?: string;
  zonaTechoRevestimiento?: string;
  instalaTarimaRevestimiento?: boolean;
  materialTarimaRevestimiento?: string;
  materialPaneladoRevestimiento?: string;

  marcaCalandra?: string;
  referenciaCalandra?: string;
  materialCalandra?: string;
  medidaLargoCALANDRA?: number;
  medidaAltoCALANDRA?: number;

  usAnclajesOriginalesINTERCOOLER?: boolean;
  descSoportesINTERCOOLER?: string;
  marcaIntercooler?: string;
  refIntercooler?: string;
  medidaLargoINTERCOOLER?: number;
  medidaAltoINTERCOOLER?: number;
  medidaEspesorINTERCOOLER?: number;

  marcaEscape?: string;
  referenciaEscape?: string;
  contrasenaHomologacionEscape?: string;
  cambiaNumeroSalidas?: boolean;
  numeroSalidasEscape?: number;
  cambiaUbicacion?: boolean;
  descripcionUbicacionEscape?: string;

  ubicacionPanelRelojes?: string;
  medidaAnchoRelojes?: number;
  medidaAltoRelojes?: number;
  numeroRelojes?: number;
  descripcionRelojes?: string;

  materialDifusor?: string;
  marcaDifusor?: string;
  modeloDifusor?: string;
  largoDifusor?: number;
  altoDifusor?: number;

  ubicacionVentana?: string;
  materialVentana?: string;
  largoVentana?: number;
  altoVentana?: number;

  ubicacionRefuerzo?: 'delantero' | 'trasero' | 'delantero y trasero';
  materialRefuerzo?: string;
  marcaRefuerzo?: string;
  referenciaRefuerzo?: string;
  largoRefuerzo?: number;
  altoRefuerzo?: number;
  fondoRefuerzo?: number;
  materialRefuerzoDelantero?: string;
  marcaRefuerzoDelantero?: string;
  referenciaRefuerzoDelantero?: string;
  largoRefuerzoDelantero?: number;
  altoRefuerzoDelantero?: number;
  fondoRefuerzoDelantero?: number;
  materialRefuerzoTrasero?: string;
  marcaRefuerzoTrasero?: string;
  referenciaRefuerzoTrasero?: string;
  largoRefuerzoTrasero?: number;
  altoRefuerzoTrasero?: number;
  fondoRefuerzoTrasero?: number;

  marcacatadioptrico?: string;
  referenciacatadioptrico?: string;
  homologacioncatadioptrico?: string;
  curvaturacatadioptrico?: number;

  marcaluzMatricula?: string;
  referencialuzMatricula?: string;
  homologacionluzMatricula?: string;

  marcaluzAntinieblas?: string;
  marcajesluzAntinieblas?: string;
  homologacionluzAntinieblas?: string;
  curvaturaluzAntinieblas?: number;

  marcaluzFreno?: string;
  referencialuzFreno?: string;
  homologacionluzFreno?: string;
  luzMatriculaIntegradaLuzFreno?: boolean;

  marcajesluzGrupoOptico?: string;
  curvaturaGuardaTrasMoto?: number;
  curvaturaManillar?: number;
  diametroExteriorDelantero?: number;
  diametroTacoDelantero?: number;
  diametroTacoTrasero?: number;
  diametroTacoKitElevacionDelantero?: number;
  diametroTacoKitElevacionTrasero?: number;
  discoDelantero?: boolean;
  discoFreno?: boolean;
  discoTrasero?: boolean;
  dimensionesDelantero?: string;
  dimensionesGuardabarrosDelantero?: string;
  dimensionesGuardabarrosTrasero?: string;
  dimensionesTrasero?: string;
  ejeDelantero?: boolean;
  ejeTotal?: boolean;
  enclaje?: string;
  espesorTacoDelantero?: number;
  espesorTacoTrasero?: number;
  espesorTacoKitElevacionDelantero?: number;
  espesorTacoKitElevacionTrasero?: number;
  esLed?: boolean;
  esLedPosicion?: boolean;

  ubicacionAleron?: string;
  materialAleron?: string;
  marcaAleron?: string;
  referenciaAleron?: string;
  medidasAleron?: string;

  tipoFabricacionLip?: string;
  materialLipDelantero?: string;
  marcaLipDelantero?: string;
  referenciaLipDelantero?: string;
  medidasLipDelantero?: string;

  ubicacionAsientos?: string;
  refAsientoConductor?: string;
  refAsientosTraseros?: string;
  refAsientoCopiloto?: string;
  procedenciaAsientos?: string;
  anoProcedenciaAsientos?: number;

  ubicacionBarras?: string;
  marcaBarras?: string;
  modeloBarras?: string;
  materialBarras?: string;
  diametroTuboBarras?: number;
  medidasBarras?: string;
  curvaturaBarras?: number;

  ubicacionTecho?: string;
  medidasTecho?: string;
  homologacionTecho?: string;

  zonaPeldano?: string;
  tipoFabricacionPeldanos?: 'marcaReferencia' | 'artesanal';
  marcaPeldano?: string;
  referenciaPeldanos?: string;
  materialPeldano?: string;
  medidasPeldano?: string;
  metodoActuacionPeldanos?: 'manual' | 'electrico';
  ubicacionAccionamientoPeldanos?: string;
  pesoPiezaKgPeldanos?: number;
  anchuraPiezaMPeldanos?: number;
  alturaPiezaMPeldanos?: number;
  metricaPeldanos?: number;
  nTornillosPeldanos?: number;
  calidadTornilloPeldanos?: number;
  seccionResistenteAsPeldanos?: number;
  resTraccionMinTornillo88Kgmm2Peldanos?: number;
  coefAerodinamicoPeldanos?: number;
  densidadAireKgM3Peldanos?: number;
  velocidadAireV2msPeldanos?: number;
  coefSeguridadKPeldanos?: number;

  ladoVentana?: 'izquierdo' | 'derecho' | 'ambos' | 'trasero';
  medidasVentana?: string;

  tipoFabricacionBodyLift?: string;
  marcaBodyLift?: string;
  cantidadTacosBodyLift?: number;
  referenciaBodyLift?: string;
  materialBodyLift?: string;
  diametroBodyLift?: number;
  alturaBodyLift?: number;

  ubicacionLatiguillos?: string;
  ubicacionSeparadores?: string;
  separadoresIguales?: boolean;
  marcaSeparadoresTraseros?: string;
  referenciaSeparadoresTraseros?: string;
  grosorSeparadoresTraseros?: string;

  marcaVehiculoDonanteMotor?: string;
  modeloVehiculoDonanteMotor?: string;
  marcaMotor?: string;
  tipoMotor?: string;
  numCilindrosMotor?: number;
  cilindradaMotor?: number;
  potenciaFiscalMotor?: number;
  potenciaRealMotor?: number;
  nuevaTaraMotor?: number;

  ubicacionChasis?: string;
  descripcionOperacionChasis?: string;
  elementoUnionChasis?: string;
  medidasChasis?: string;
  materialChasis?: string;

  guardabarrosDelantero?: boolean;
  guardabarrosTrasero?: boolean;
  grosor?: number;
  grosorTuboDefensa?: number;
  homologacion?: string;
  homologacionBarra?: string;
  homologacionBola?: string;
  marcaEje?: string;
  denominacionEje?: string;
  homologacionVelocimetro?: string;
  indiceReferencia?: string;
  kgEjeDelantero?: number;
  kgReduccionEjeDelantero?: number;
  kgReduccionTotal?: number;
  kgTotalReduccion?: number;
  material?: string;
  marca?: string;
  marcaAmortiguador?: string;
  marcaAmortiguadorDelantero?: string;
  marcaMuelleTraseroSinRef?: string;
  referenciaMuelleTraseroConRef?: string;
  marcaMuelleTraseroConRef?: string;
  numeroEspirasSinTrasero?: number;
  longitudSinTrasero?: number;
  diametroExteriorSinTrasero?: number;
  diametroEspiraSinTrasero?: number;
  diametroExteriorTrasero?: number;
  longitudTrasero?: number;
  numeroEspirasTrasero?: number;
  diametroEspiraTrasero?: number;
  marcaAmortiguadorTrasero?: string;
  marcaAletines?: string;
  marcaBallestaDelantera?: string;
  marcaBallestaTrasera?: string;
  marcaBarra?: string;
  marcaBarraDireccion?: string;
  marcaBola?: string;
  marcaConvergencia?: string;
  marcaConvergenciaReg?: string;
  marcaDelantero?: string;
  marcaDefensa?: string;
  marcaDiscoDelantero?: string;
  marcaDiscoTrasero?: string;
  marcaGuardabarrosDelantero?: string;
  marcaKitElevacion?: string;
  marcaKitElevacionDelantera?: string;
  marcaKitElevacionTrasera?: string;
  marcaManillar?: string;
  marcaMuelleDelanteroConRef?: string;
  marcaMuelleDelanteroSinRef?: string;
  marcaPastillaDelantera?: string;
  marcaPastillaTrasera?: string;
  marcaVelocimetro?: string;
  marcaje?: string;
  marcado?: string;
  marcadoCruce?: string;
  marcadoPosicion?: string;
  medidas?: string;
  medidasCambioUbicacionDelantera?: string;
  medidasDefensa?: string;
  medidasLlantas?: string;
  medidasLlantaMoto?: string;
  modelo?: string;
  modeloDefensa?: string;
  modeloManillar?: string;
  mmrBarraTraccion?: number;
  mmrCf?: number;
  mmrEjeCentral?: number;
  neumaticos?: string;
  neumaticosMoto?: string;
  neumaticoDelantero?: string;
  medidasLlantaDelantero?: string;
  neumaticoTrasero?: string;
  medidasLlantaTrasero?: string;
  nombre: string;
  numeroEspirasDelantero?: number;
  muebles?: Mueble[];
  opcionesMueble?: {
    muebleBajo: boolean;
    muebleAlto: boolean;
    aseo: boolean;
  };
  pastillaDelantera?: boolean;
  pastillaFreno?: boolean;
  pastillaTrasera?: boolean;
  pdlFaro?: string;
  pdlFaroCruce?: string;
  plazaAntes?: number;
  placasAntes?: number;
  referencia?: string;
  referenciaAmortiguador?: string;
  referenciaAletines?: string;
  referenciaSobreletines?: string;
  referenciaBallestaDelantera?: string;
  referenciaBallestaTrasera?: string;
  referenciaConvergenciaReg?: string;
  referenciaDelantero?: string;
  referenciaTrasero?: string;
  referenciaDiscoDelantero?: string;
  referenciaDiscoTrasero?: string;
  referenciaGuardabarrosDelantero?: string;
  referenciaMuelleDelanteroConRef?: string;
  contrasenaAsiento?: string;
  marcaAsiento?: string;
  plazasAsiento?: number;
  referenciaPastillaDelantera?: string;
  referenciaPastillaTrasera?: string;
  numCajones?: number;
  cantidadClaraboya?: number;
  cantidadVentanas?: number;
  instalacionesSecundarias?: string;
  regulable?: boolean;
  seleccionado: boolean;
  sKg?: number;
  tacoDelantero?: string;
  tacoTrasero?: string;
  tieneDisco?: boolean;
  tienePastilla?: boolean;
  tipo?: string;
  tipoBarra?: string;
  tipoCambio?: 'aumento' | 'disminucion' | null;
  posicionAsiento?: 'delanteras' | 'traseras';
  tipoFabricacion?: string;
  homologacionBase?: string;
  tipoSuspensionDelantera?: string;
  tipoSuspensionTrasera?: string;
  tipoTacoDelantero?: string;
  tipoTacoElevacion?: string;
  tipoTacoTrasero?: string;
  ubicacion?: string;
  velocidadMaximaAntes?: string;
  velocidadMaximaDespues?: string;
  velocidadMaxima?: string;
  plazasAntes?: number;
  materialesUsados?: number;
  manoDeObra?: number;
  totalPresupuesto?: number;
  plazasDespues?: number;
  marcaAsientoIndividual?: string;
  marcajes?: string;
  denominacion?: string;
  variante?: string;
  referenciaTraseros?: string;
  marcaTraseros?: string;
  referenciaDelanteros?: string;
  marcaDelanteros?: string;
  marcaBasesGiratorias?: string;
  referenciaConductor?: string;
  referenciaAcompanante?: string;
  referenciaAmortiguadorDelantero?: string;
  referenciaAmortiguadorTrasero?: string;
  homologacionBasesGiratorias?: string;
  marcaBaseGiratoria?: string;
  marcaCalefaccion?: string;
  modeloCalefaccion?: string;
  homologacionCalefaccion?: string;
  descripcionCalefaccion?: string;
  medidasMuebleBajo?: string;
  numCajonesMuebleBajo?: number;
  medidasMuebleAlto?: string;
  medidasAseo?: string;
  descripcionAseo?: string;
  configuracionMuebleBajo?: string;
  configuracionMuebleAlto?: string;
  configuracionMuebleAseo?: string;
  claraboyas?: ClaraboyaItem[];
  ventanas?: VentanaItem[];
  marcaClaraboya?: string;
  modeloClaraboya?: string;
  descripcionClaraboya?: string;
  homologacionClaraboya?: string;
  descripcionVentana?: string;
  marcaVentana?: string;
  modeloVentana?: string;
  dimensionesVentana?: string;
  homologacionVentana?: string;
  incluirHomologacionVentanaAbatible?: boolean;
  homologacionVentanaAbatible?: string;
  litrosAguaSucia?: number;
  litrosAguaLimpia?: number;
  longitudDelantero?: number;
  medidasAguaLimpia?: string;
  marcaBombaAgua?: string;
  modeloBombaAgua?: string;
  ubicacionBombaAgua?: string;
  ubicacionRegistroAgua?: string;
  tamanoRegistroAgua?: string;
  voltajeTomaExterior?: string;
  ubicacionTomaExterior?: string;
  medidasTomaExterior?: string;
  ubicacionDuchaExterior?: string;
  placasSolares?: PlacaSolarItem[];
  cantidadBaterias?: number;
  potenciaBaterias?: string;
  ubicacionBaterias?: string;
  potenciaInversor?: string;
  marcaInversor?: string;
  homologacionInversor?: string;
  ubicacionInversor?: string;
  modeloControlador?: string;
  marcaControlador?: string;
  homologacionControlador?: string;
  ubicacionControlador?: string;
  marcaToldo?: string;
  medidasToldo?: string;
  ubicacionToldo?: string;
  pesoPiezaKgToldo?: number;
  anchuraPiezaMToldo?: number;
  alturaPiezaMToldo?: number;
  metricaToldo?: number;
  nTornillosToldo?: number;
  calidadTornilloToldo?: number;
  seccionResistenteAsToldo?: number;
  resTraccionMinTornillo88Kgmm2Toldo?: number;
  cwCoefAerodinamicoToldo?: number;
  densidadAireKgM3Toldo?: number;
  velocidadAireV2msToldo?: number;
  coefSeguridadKToldo?: number;
  curvaturaToldo?: number;

  ubicacionPorta1?: 'trasero' | 'delantero';
  ladoPorta1?: 'izquierdo' | 'derecho' | 'centro';
  materialPorta1?: 'acero' | 'plástico';
  fabricacionPorta1?: 'artesanal' | 'comprado';
  marcaPorta1?: string;
  referenciaPorta1?: string;

  ubicacionPorta2?: 'trasera' | 'delantera';
  portamatr2?: 'delantero' | 'trasero';
  paragolpesNuevo2?: boolean;

  ubicacionMat3?: 'delantera' | 'trasera';
  materialMat3?: 'Acrílica' | 'Metálica';
  medidasMat3?: string;
  ubicacionBumper3?: string;
  paragolpesNuevo3?: boolean;
  marcaPosicion?: string;
  marcajePosicion?: string;
  homologacionPosicion?: string;
  marca3Freno?: string;
  marcaje3Freno?: string;
  homologacion3Freno?: string;
  marcaAntiniebla?: string;
  homologacionAntiniebla?: string;
  marcaPilotoTrasero?: string;
  marcajePilotoTrasero?: string;
  marcajeIntermitentes?: string;
  homologacionIntermitentes?: string;
  situado3Freno?: string;
  marcaDiurnas?: string;
  homologacionDiurnas?: string;
  referenciaLuzPosicionFreno?: string;
  referenciaIntermitente?: string;
  referenciaMarchaAtras?: string;
  referenciaCatadioptrico?: string;
  curvaturaSnorkel?: number;
  curvaturaParagolpesDelantero?: string;
  curvaturaParagolpesTrasero?: string;
  curvaturaAletines?: string;
  curvaturaProtectoresLaterales?: string;
  curvaturaDefensaDelantera?: string;
  curvaturaSoporteRuedaRepuesto?: string;
  curvaturaSobrealetines?: string;
  marcaSeparadores?: string;
  referenciaSeparadores?: string;
  grosorSeparadores?: string;
  materialSnorkel?: string;
  marcaSnorkel?: string;
  medidasSnorkel?: string;
  tipoFabricacionParagolpesDelantero?: string;
  tipoFabricacionMuebleBajo?: string;
  tipoFabricacionMuebleAlto?: string;
  tipoFabricacionMuebleAseo?: string;
  tornillosMuebleAseo?: number;
  tornillosMuebleAlto?: number;
  tornillosMuebleBajo?: number;
  marcaMuebleAlto?: string;
  referenciaMuebleAlto?: string;
  referenciaMuebleBajo?: string;
  marcaMuebleBajo?: string;
  tipoFabricacionGuardabarrosDelantero?: string;
  tipoFabricacionGuardabarrosTrasero?: string;
  marcaParagolpes?: string;
  referenciaParagolpes?: string;
  medidasParagolpesDelantero?: string;
  tipoFabricacionParagolpesTrasero?: string;
  marcaParagolpesTrasero?: string;
  referenciaParagolpesTrasero?: string;
  medidasParagolpesTrasero?: string;
  marcaCabrestante?: string;
  capacidadCabrestanteLb?: number;
  capacidadCabrestanteKg?: number;
  medidasAntiempotramiento?: string;
  ubicacionLucesEspecificas?: string;
  medidasLucesEspecificas?: string;
  tipoFabricacionRuedaRepuesto?: string;
  marcaRuedaRepuesto?: string;
  referenciaRuedaRepuesto?: string;
  medidasRuedaRepuesto?: string;
  descripcionSuspensionDelantera?: string;
  marcataloneras?: string;
  dimensionesTaloneras?: string;
  accion?: 'instalacion' | 'sustitucion' | 'desmontaje';
  posicionNeumaticoMoto?: 'delantero' | 'trasero' | 'delantero y trasero';
  taraTotal?: number;
  taraDelante?: number;
  taraDetras?: number;
  asientosDelanteros?: number;
  asientos2Fila?: number;
  asientos3Fila?: number;
  cargaUtilTotal?: number;
  distanciaEntreEjes?: number;
  ocupantesAdicionales?: number;
  metricaSobrealetines?: number;
  metricaAletines?: number;
  numTornillosAletines?: number;
  pesoPiezaKgAletines?: number;
  superficieFrontalM2Aletines?: number;
  coefAerodinamicoCwAletines?: number;
  velocidadAireV2msAletines?: number;
  densidadAireKgM3Aletines?: number;
  radioCurvaRAletines?: number;
  coefSeguridadKAletines?: number;
  resTraccionMinTornillo88Kgmm2Aletines?: number;
  seccionResistenteAsAletines?: number;

  pesoPiezaKgSnorkel?: number;
  anchuraPiezaMSnorkel?: number;
  metricaSnorkel?: number;
  alturaPiezaMSnorkel?: number;
  coefAerodinamicoSnorkel?: number;
  nTornillosSnorkel?: number;
  calidadTornilloSnorkel?: number;
  seccionResistenteAsSnorkel?: number;
  resTraccionMinTornillo88Kgmm2Snorkel?: number;
  cwCoefAerodinamicoSnorkel?: number;
  densidadAireKgM3Snorkel?: number;
  velocidadAireV2msSnorkel?: number;
  coefSeguridadKSnorkel?: number;
  pesoPiezaKgLipDelantero?: number;
  anchuraPiezaMLipDelantero?: number;
  metricaLipDelantero?: number;
  alturaPiezaMLipDelantero?: number;
  nTornillosLipDelantero?: number;
  calidadTornilloLipDelantero?: number;
  seccionResistenteAsLipDelantero?: number;
  resTraccionMinTornillo88Kgmm2LipDelantero?: number;
  cwCoefAerodinamicoLipDelantero?: number;
  densidadAireKgM3LipDelantero?: number;
  velocidadAireV2msLipDelantero?: number;
  coefSeguridadKLipDelantero?: number;
  pesoPiezaKgDifusor?: number;
  anchuraPiezaMDifusor?: number;
  metricaDifusor?: number;
  alturaPiezaMDifusor?: number;
  nTornillosDifusor?: number;
  calidadTornilloDifusor?: number;
  seccionResistenteAsDifusor?: number;
  resTraccionMinTornillo88Kgmm2Difusor?: number;
  cwCoefAerodinamicoDifusor?: number;
  densidadAireKgM3Difusor?: number;
  velocidadAireV2msDifusor?: number;
  coefSeguridadKDifusor?: number;
  pesoPiezaKgBarras?: number;
  anchuraPiezaMBarras?: number;
  metricaBarras?: number;
  alturaPiezaMBarras?: number;
  nTornillosBarras?: number;
  calidadTornilloBarras?: number;
  seccionResistenteAsBarras?: number;
  resTraccionMinTornillo88Kgmm2Barras?: number;
  cwCoefAerodinamicoBarras?: number;
  densidadAireKgM3Barras?: number;
  velocidadAireV2msBarras?: number;
  coefSeguridadKBarras?: number;
  medidasLargoAlcance?: string;
  pesoPiezaKgLargoAlcance?: number;
  anchuraPiezaMLargoAlcance?: number;
  metricaLargoAlcance?: number;
  alturaPiezaMLargoAlcance?: number;
  nTornillosLargoAlcance?: number;
  calidadTornilloLargoAlcance?: number;
  seccionResistenteAsLargoAlcance?: number;
  resTraccionMinTornillo88Kgmm2LargoAlcance?: number;
  cwCoefAerodinamicoLargoAlcance?: number;
  densidadAireKgM3LargoAlcance?: number;
  velocidadAireV2msLargoAlcance?: number;
  coefSeguridadKLargoAlcance?: number;
  curvaturaLargoAlcance?: number;

  diametroPernoCmCabrestante?: number;
  materialPernoCabrestante?: string;
  tensionMinCortanteKgCm2Cabrestante?: number;
  nTornillosCabrestante?: number;
  diametroPernoChasisMmCabrestante?: number;
  materialPernoChasisCabrestante?: string;
  tensionMinCortanteChasisKgCm2Cabrestante?: number;
  metricaCabrestante?: number;
  nPernosChasisCabrestante?: number;

  metricaLuces?: number;
  metricaLucesEspecificas?: number;
  pesoPiezaKgLucesEspecificas?: number;
  anchuraPiezaMLucesEspecificas?: number;
  alturaPiezaMLucesEspecificas?: number;
  coefAerodinamicoLucesEspecificas?: number;
  nTornillosLucesEspecificas?: number;
  calidadTornilloLucesEspecificas?: number;
  seccionResistenteAsLucesEspecificas?: number;
  resTraccionMinTornillo88Kgmm2LucesEspecificas?: number;
  cwCoefAerodinamicoLucesEspecificas?: number;
  densidadAireKgM3LucesEspecificas?: number;
  velocidadAireV2msLucesEspecificas?: number;
  radioCurvaRLucesEspecificas?: number;
  coefSeguridadKLucesEspecificas?: number;

  pesoPiezaKgAntiempotramiento?: number;
  superficieFrontalM2Antiempotramiento?: number;
  seccionResistenteAsAntiempotramiento?: number;
  resTraccionMinTornillo88Kgmm2Antiempotramiento?: number;
  metricaAntiempotramiento?: number;
  calidadTornilloAntiempotramiento?: number;
  nTornillosAntiempotramiento?: number;
  cwCoefAerodinamicoAntiempotramiento?: number;
  densidadAireKgM3Antiempotramiento?: number;
  velocidadAireV2msAntiempotramiento?: number;
  radioCurvaRAntiempotramiento?: number;
  coefSeguridadKAntiempotramiento?: number;

  pesoPiezaKgParagolpesDelantero?: number;
  superficieFrontalM2ParagolpesDelantero?: number;
  seccionResistenteAsParagolpesDelantero?: number;
  resTraccionMinTornillo88Kgmm2ParagolpesDelantero?: number;
  metricaParaDelantero?: number;
  calidadTornilloParagolpesDelantero?: number;
  ntornillosParaDelantero?: number;
  cwCoefAerodinamicoParagolpesDelantero?: number;
  densidadAireKgM3ParagolpesDelantero?: number;
  velocidadAireV2msParagolpesDelantero?: number;
  radioCurvaRParagolpesDelantero?: number;
  coefSeguridadKParagolpesDelantero?: number;

  pesoPiezaKgParagolpesTrasero?: number;
  anchuraMParagolpesTrasero?: number;
  alturaMParagolpesTrasero?: number;
  coefAerodinamicoParagolpesTrasero?: number;
  nTornillosParagolpesTrasero?: number;
  calidadTornilloParagolpesTrasero?: number;
  densidadAireKgM3ParagolpesTrasero?: number;
  radioCurvaRParagolpesTrasero?: number;
  coefSeguridadKParagolpesTrasero?: number;
  velocidadAireV2msParagolpesTrasero?: number;
  resTraccionMinTornillo88Kgmm2ParagolpesTrasero?: number;
  seccionResistenteAsParagolpesTrasero?: number;
  metricaParaTrasero?: number;

  curvaturaEstribosLaterales?: number;
  pesoPiezaKgEstribos?: number;
  anchuraMEstribos?: number;
  alturaMEstribos?: number;
  coefAerodinamicoEstribos?: number;
  metricaTalonera?: number;
  nTornillosEstribos?: number;
  calidadTornilloEstribos?: number;
  seccionResistenteAsEstribos?: number;
  resTraccionMinTornillo88Kgmm2Estribos?: number;
  densidadAireKgM3Estribos?: number;
  velocidadAireV2msEstribos?: number;
  radioCurvaREstribos?: number;
  coefSeguridadKEstribos?: number;

  diametroExteriorDelanteroRef?: number;
  longitudLibreDelanteroRef?: number;
  diametroEspiraDelanteroRef?: number;
  numeroEspirasDelanteroRef?: number;

  diametroExteriorDelanteroSinRef?: number;
  longitudLibreDelanteroSinRef?: number;
  diametroEspiraDelanteroSinRef?: number;
  numeroEspirasDelanteroSinRef?: number;

  diametroExteriorTraseroRef?: number;
  longitudLibreTraseroRef?: number;
  diametroEspiraTraseroRef?: number;
  numeroEspirasTraseroRef?: number;

  diametroExteriorTraseroSinRef?: number;
  longitudLibreTraseroSinRef?: number;
  diametroEspiraTraseroSinRef?: number;
  numeroEspirasTraseroSinRef?: number;

  numHojasBallestaDelantera?: number;
  anchoHojaBallestaDelantera?: number;
  espesorHojaBallestaDelantera?: number;
  longitudBallestaDelantera?: number;

  numHojasBallestaTrasera?: number;
  anchoHojaBallestaTrasera?: number;
  espesorHojaBallestaTrasera?: number;
  longitudBallestaTrasera?: number;

  ant_diametroBombaTrasera?: number;
  ant_dimensionPistonTrasera?: number;
  ant_numPistonesTrasero?: number;
  ant_numPinzasTraseras?: number;
  ant_numDiscosTrasero?: number;

  ant_diametroBombaDelantera?: number;
  ant_dimensionPistonDelantera?: number;
  ant_numPistonesDelantero?: number;
  ant_numPinzasDelanteras?: number;
  ant_numDiscosDelantero?: number;

  diametroBombaDiscos?: number;
  dimensionPistonDiscos?: number;
  numPistonesDiscos?: number;
  numPinzasDelanteras?: number;
  numDiscosDelantero?: number;

  ant_diametroExteriorDiscoDelantero?: number;
  diametroExteriorDiscos?: number;

  ant_diametroInteriorDiscoDelantero?: number;
  diametroInteriorDiscos?: number;

  diametroBombaDiscoTrasero?: number;
  dimensionPistonDiscoTrasero?: number;
  numPistonesDiscoTrasero?: number;
  numPinzasTraseras?: number;
  numDiscosTrasero?: number;

  ant_diametroExteriorDiscoTrasero?: number;
  diametroExteriorDiscoTrasero?: number;
  ant_diametroInteriorDiscoTrasero?: number;
  diametroInteriorDiscoTrasero?: number;

  anguloContactoDiscos?: number;
  anguloContactoDiscoTrasero?: number;

  ant_radioNeumaticoTrasero?: number;
  ant_anchoNeumaticoTrasero?: number;
  ant_perfilNeumaticoTrasero?: number;
  ant_perfilNeumaticoDelantero?: number;
  ant_anchoNeumaticoDelantero?: number;
  ant_radioNeumaticoDelantero?: number;
  perfilNeumaticoDiscoTrasero?: number;
  anchoNeumaticoDiscoTrasero?: number;
  radioNeumaticoDiscoTrasero?: number;
  perfilNeumaticoDiscos?: number;
  anchoNeumaticoDiscos?: number;
  radioNeumaticoDiscos?: number;
  diametroExteriorDiscoDelantero?: number;
  diametroInteriorDiscoDelantero?: number;
  diametroBombaDelantera?: number;
  dimensionPistonDelantera?: number;
  numPistonesDelantero?: number;
}
