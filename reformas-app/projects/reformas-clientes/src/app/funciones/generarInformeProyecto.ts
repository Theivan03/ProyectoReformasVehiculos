import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  ImageRun,
  WidthType,
  AlignmentType,
  TextRun,
} from 'docx';

export async function generarInformeProyecto(data: any): Promise<Blob> {
  const contenido: (Paragraph | Table)[] = [];

  const valido = (v: any) =>
    v !== null &&
    v !== undefined &&
    v !== '' &&
    v !== '---' &&
    !(typeof v === 'number' && v === 0);

  // ======= Helpers de estilo (todo negro, sin HeadingLevel) =======
  const titulo = (t: string) =>
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 300 },
      children: [
        new TextRun({ text: t, bold: true, color: '000000', size: 28 }),
      ], // 14pt
    });

  const subtitulo = (t: string) =>
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 400, after: 200 },
      children: [
        new TextRun({ text: t, bold: true, color: '000000', size: 24 }),
      ], // 12pt
    });

  const texto = (t: string) =>
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 150 },
      children: [new TextRun({ text: t, color: '000000', size: 22 })], // 11pt
    });

  // ======= CABECERA =======
  contenido.push(titulo(`Proyecto Nº ${data.numeroProyecto ?? ''}`));
  if (valido(data.propietario))
    contenido.push(texto(`Propietario: ${data.propietario}`));

  // ======= DATOS BÁSICOS =======
  const lista: [string, string][] = [
    ['Longitud después de la reforma', String(data.longitudDespues)],
    ['Anchura después de la reforma', String(data.anchuraDespues)],
    ['Altura después de la reforma', String(data.alturaDespues)],
    ['Voladizo después de la reforma', String(data.voladizoDespues)],
    ['Vía delantera después de la reforma', String(data.viaDelanteraDespues)],
    ['Vía trasera después de la reforma', String(data.viaTraseraDespues)],
  ];

  const datosBasicos = lista.filter(([_, val]) => valido(val));

  if (Array.isArray(data.opcionesCoche) && data.opcionesCoche[0] === true) {
    datosBasicos.push([
      'Equipamiento adicional',
      'Dispone de sistema de frenos ABS',
    ]);
  }

  if (datosBasicos.length > 0) {
    contenido.push(subtitulo('Datos básicos'));
    contenido.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: datosBasicos.map(
          ([campo, valor]) =>
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.LEFT,
                      children: [
                        new TextRun({
                          text: campo,
                          bold: true,
                          size: 22,
                          color: '000000',
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.LEFT,
                      children: [
                        new TextRun({ text: valor, size: 22, color: '000000' }),
                      ],
                    }),
                  ],
                }),
              ],
            })
        ),
      })
    );
  }

  function generarBloqueReforma(
    mod: any,
    tipoVehiculo: string
  ): (Paragraph | Table)[] {
    const seccion: (Paragraph | Table)[] = [];
    const filas: TableCell[][] = [];

    const addCampo = (campo: string, valor: any) => {
      if (!valido(valor)) return;
      filas.push([
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: campo, bold: true, size: 22 })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: String(valor), size: 22 })],
            }),
          ],
        }),
      ]);
    };

    // Cada bloque empieza con un subtítulo
    seccion.push(subtitulo(mod.nombre));

    if (
      tipoVehiculo.toLowerCase() == 'coche' ||
      tipoVehiculo.toLowerCase() == 'industrial'
    ) {
      switch (mod.nombre) {
        case 'Enganche de remolque':
          addCampo('ENGANCHE DE REMOLQUE', ' ');
          addCampo('Tipo de acción', (mod.acciones || []).join(', '));
          addCampo('Marca', mod.marca);
          addCampo('Diámetro de tornillos (métrica)', mod.metrica);
          addCampo('Número de tornillos', mod.nTornillos);
          break;

        case 'Reducción de plazas de asiento':
          addCampo('REDUCCION DE PLAZAS DE ASIENTO', ' ');
          addCampo('Plaza eliminada', mod.enclaje);
          addCampo('Número de plazas antes', mod.plazasAntes);
          addCampo('Plazas después de la reforma', mod.plazasDespues);
          break;

        case 'Ruedas':
          if (mod.detalle?.neumaticos) addCampo('NEUMATICOS Y LLANTAS', ' ');
          addCampo('Cuales neumáticos se han modificado', mod.neumaticosCoche);
          if (
            mod.neumaticosCoche === 'delantero' ||
            mod.neumaticosCoche === 'delantero y trasero'
          ) {
            addCampo('Neumático delantero', mod.neumaticoDelantero);
            addCampo(
              'Medidas de llanta neumático delantero',
              mod.medidasLlantaDelantero
            );
          }
          if (
            mod.neumaticosCoche === 'trasero' ||
            mod.neumaticosCoche === 'delantero y trasero'
          ) {
            addCampo('Neumático trasero', mod.neumaticoTrasero);
            addCampo(
              'Medidas de llanta neumático trasero',
              mod.medidasLlantaTrasero
            );
          }
          if (mod.detalle?.separadoresDeRueda) {
            addCampo('SEPARADORES DE RUEDA', ' ');
            addCampo('Tipo de acción', (mod.acciones || []).join(', '));
            addCampo('Marca separadores', mod.marcaSeparadores);
            addCampo('Referencia', mod.referenciaSeparadores);
            addCampo('Grosor', mod.grosorSeparadores);
          }
          break;

        case 'Carrocería':
          if (mod.detalle?.aletines) {
            addCampo('ALETINES', ' ');
            addCampo('Tipo de acción', (mod.acciones || []).join(', '));
            addCampo('Aletines - Marca', mod.marcaAletines);
            addCampo('Referencia', mod.referenciaAletines);
            addCampo('Ancho (mm)', mod.anchoAletines);
            addCampo('Metrica', mod.metricaAletines);
            addCampo('Peso pieza (Kg)', mod.pesoPiezaKgAletines);
            addCampo('Nº de tornillos', mod.numTornillosAletines);
          }
          if (mod.detalle?.talonerasEstribos) {
            addCampo('TALONERAS Y/O ESTRIBOS', ' ');
            addCampo('Tipo de acción', (mod.acciones || []).join(', '));
            addCampo('Estribos/Taloneras - Marca', mod.marcataloneras);
            addCampo('Material', mod.materialEstribos);
            addCampo('Anchura (m)', mod.anchuraMEstribos);
            addCampo('Altura (m)', mod.alturaMEstribos);
            addCampo('Metrica', mod.metricaTalonera);
            addCampo('Nº de tornillos', mod.nTornillosEstribos);
          }
          if (mod.detalle?.snorkel) {
            addCampo('SNORKEL', ' ');
            addCampo('Tipo de acción', (mod.acciones || []).join(', '));
            addCampo('Snorkel - Marca', mod.marcaSnorkel);
            addCampo('Material', mod.materialSnorkel);
            addCampo('Ratio curvatura mín.', mod.curvaturaSnorkel);
            addCampo('Peso pieza (Kg)', mod.pesoPiezaKgSnorkel);
            addCampo('Anchura', mod.anchuraPiezaMSnorkel);
            addCampo('PALtura', mod.alturaPiezaMSnorkel);
            addCampo('Nº de tornillos', mod.nTornillosSnorkel);
          }
          if (mod.detalle?.defensaDelantera) {
            addCampo('DEFENSA DELANTERA', ' ');
            addCampo('Defensa Delantera - Marca', mod.marcaDefensa);
            addCampo('Modelo', mod.modeloDefensa);
            addCampo('Medidas', mod.medidasDefensa);
            addCampo('Grosor tubo (mm)', mod.grosorTuboDefensa);
            addCampo('Metrica', mod.metrica);
            addCampo('Metrica', mod.nTornillos);
          }
          if (mod.detalle?.paragolpesDelantero) {
            addCampo('PARAGOLPES DELANTERO', ' ');
            addCampo('Tipo de acción', (mod.acciones || []).join(', '));
            addCampo(
              'Tipo de fabricación',
              mod.tipoFabricacionParagolpesDelantero
            );
            addCampo('Marca', mod.marcaParagolpes || 'N/A');
            addCampo('Referencia', mod.referenciaParagolpes || 'N/A');
            addCampo('Medidas', mod.medidasParagolpesDelantero);
            addCampo('Metrica', mod.metricaParaDelantero);
            addCampo('Nº de tornillos', mod.ntornillosParaDelantero);
            addCampo('Peso', mod.pesoPiezaKgParagolpesDelantero);
          }
          if (mod.detalle?.paragolpesTrasero) {
            addCampo('PARAGOLPES TRASERO', ' ');
            addCampo('Tipo de acción', (mod.acciones || []).join(', '));
            addCampo(
              'Tipo de fabricación',
              mod.tipoFabricacionParagolpesTrasero
            );
            addCampo('Marca', mod.marcaParagolpesTrasero || 'N/A');
            addCampo('Referencia', mod.referenciaParagolpesTrasero || 'N/A');
            addCampo('Anchura', mod.anchuraMParagolpesTrasero);
            addCampo('Altura', mod.alturaMParagolpesTrasero);
            addCampo('Metrica', mod.metricaParaTrasero);
            addCampo('Nº de tornillos', mod.nTornillosParagolpesTrasero);
            addCampo('Peso', mod.pesoPiezaKgParagolpesTrasero);
          }
          if (mod.detalle?.barraAntiempotramiento) {
            addCampo('BARRA ANTIEMPOTRAMIENTO', ' ');
            addCampo('Tipo de acción', (mod.acciones || []).join(', '));
            addCampo('Medidas', mod.medidasAntiempotramiento);
            addCampo('Nº de tornillos', mod.nTornillos);
          }
          if (mod.detalle?.cabrestante) {
            addCampo('CABRESTANTE', ' ');
            addCampo('Tipo de acción', (mod.acciones || []).join(', '));
            addCampo('Marca', mod.marcaCabrestante);
            addCampo('Metrica', mod.metricaCabrestante);
            addCampo(
              'Capacidad del cabrestante en Kg',
              mod.capacidadCabrestanteKg
            );
            addCampo('Nº de tornillos', mod.nTornillos);
            addCampo(
              'Tiro máximo del cabrestante en Kg',
              mod.tiroMaxCabrestanteKg
            );
            addCampo(
              'Diámetro del perno en cm',
              mod.diametroPernoCmCabrestante
            );
            addCampo('Material del perno', mod.materialPernoCabrestante);
            addCampo(
              'Tensión mínima cortante en Kg/cm²',
              mod.tensionMinCortanteKgCm2Cabrestante
            );
            addCampo('Nº de pernos del chasis', mod.nPernosChasisCabrestante);
            addCampo(
              'Diámetro del perno del chasis en mm',
              mod.diametroPernoChasisMmCabrestante
            );
            addCampo(
              'Material del perno del chasis',
              mod.materialPernoChasisCabrestante
            );
            addCampo(
              'Tensión mínima cortante del chasis en Kg/cm²',
              mod.tensionMinCortanteChasisKgCm2Cabrestante
            );
          }
          if (mod.detalle?.sobrealetines) {
            addCampo('SOBREALETINES', ' ');
            addCampo('Tipo de acción', (mod.acciones || []).join(', '));
            addCampo('Marca', mod.marcaSobreletines);
            addCampo('Referencia', mod.referenciaSobreletines);
            addCampo('Ancho', mod.anchoSobrealetines);
            addCampo('Metrica', mod.metricaSobrealetines);
            addCampo('Nº de tornillos', mod.nTornillos);
          }
          break;

        case 'Suspensión':
          if (mod.detalle?.muelleDelantero) {
            addCampo('MUELLE DELANTERO', ' ');
            addCampo('Marca', mod.marcaMuelleDelanteroConRef);
            addCampo('Referencia', mod.referenciaMuelleDelanteroConRef);
            addCampo('Diametro', mod.diametroExteriorDelanteroRef);
            addCampo('Longitud libre', mod.longitudLibreDelanteroRef);
            addCampo('Diametro', mod.diametroEspiraDelanteroRef);
            addCampo('Nº de tornillos', mod.numeroEspirasDelanteroRef);
          }
          if (mod.detalle?.muelleTrasero) {
            addCampo('MUELLE TRASERO', ' ');
            addCampo('Marca', mod.marcaMuelleTraseroConRef);
            addCampo('Referencia', mod.referenciaMuelleTraseroConRef);
            addCampo('Diametro', mod.diametroExteriorTraseroRef);
            addCampo('Longitud libre', mod.longitudLibreTraseroRef);
            addCampo('Diametro', mod.diametroEspiraTraseroRef);
            addCampo('Nº de tornillos', mod.numeroEspirasTraseroRef);
          }
          if (mod.detalle?.ballestaDelantera) {
            addCampo('BALLESTA DELANTERA', ' ');
            addCampo('Marca', mod.marcaBallestaDelantera);
            addCampo('Referencia', mod.referenciaBallestaDelantera);
            addCampo('Nº de hojas', mod.numHojasBallestaDelantera);
            addCampo('Ancho de las hojas', mod.anchoHojaBallestaDelantera);
            addCampo('Espesor de las hojas', mod.espesorHojaBallestaDelantera);
            addCampo('Longitud de la ballesta', mod.longitudBallestaDelantera);
          }
          if (mod.detalle?.ballestaTrasera) {
            addCampo('BALLESTA TRASERA', ' ');
            addCampo('Marca', mod.marcaBallestaTrasera);
            addCampo('Referencia', mod.referenciaBallestaTrasera);
            addCampo('Nº de hojas', mod.numHojasBallestaTrasera);
            addCampo('Ancho de las hojas', mod.anchoHojaBallestaTrasera);
            addCampo('Espesor de las hojas', mod.espesorHojaBallestaTrasera);
            addCampo('Longitud de la ballesta', mod.longitudBallestaTrasera);
          }
          if (mod.detalle?.amortiguadorDelantero) {
            addCampo('AMORTIGUADOR DELANTERO', ' ');
            addCampo('Marca', mod.marcaAmortiguadorDelantero);
            addCampo('Referencia', mod.referenciaAmortiguadorDelantero);
          }
          if (mod.detalle?.amortiguadorTrasero) {
            addCampo('AMORTIGUADOR TRASERO', ' ');
            addCampo('Marca', mod.marcaAmortiguadorTrasero);
            addCampo('Referencia', mod.referenciaAmortiguadorTrasero);
          }
          if (mod.detalle?.suplementoSusDelantero) {
            addCampo('SUPLEMENTO DE SUSPENSIONES DELANTERA', ' ');
            addCampo('Marca', mod.diametroTacoDelantero);
            addCampo('Referencia', mod.espesorTacoDelantero);
          }
          if (mod.detalle?.suplementoSusTrasero) {
            addCampo('SUPLEMENTO DE SUSPENSIONES TRASERA', ' ');
            addCampo('Marca', mod.diametroTacoTrasero);
            addCampo('Referencia', mod.espesorTacoTrasero);
          }
          break;

        case 'Dirección':
          if (mod.detalle?.amortiguadorDeDireccion) {
            addCampo('AMORTIGUADOR DE DIRECCIÓN', ' ');
            addCampo('Marca', mod.marcaAmortiguador);
            addCampo('Referencia', mod.referenciaAmortiguador);
          }
          if (mod.detalle?.barraDeDireccion) {
            addCampo('BARRA DE DIRECCIÓN', ' ');
            addCampo('Tipo de acción', (mod.acciones || []).join(', '));
            addCampo('Marca', mod.marcaBarraDireccion);
          }
          if (mod.detalle?.sustitucionDeEjes) {
            addCampo('SUSTITUCION DE EJES', ' ');
            addCampo('Marca', mod.marcaEje);
            addCampo('Denominación comercial', mod.denominacionEje);
            addCampo(
              'Contraseña de homologación',
              mod.contrasenaHomologacionEje
            );
          }
          break;
      }
    }

    if (tipoVehiculo.toLowerCase() == 'moto') {
      switch (mod.nombre) {
        case 'Ruedas':
          addCampo('RUEDAS', ' ');
          addCampo('Cuales de los dos neumaticos', mod.neumaticosMoto);
          addCampo('Neumatico delantero', mod.neumaticoDelantero);
          addCampo('Llanta delantera', mod.medidasLlantaDelantero);
          addCampo('Neumatico trasero', mod.neumaticoTrasero);
          addCampo('Llanta trasera', mod.medidasLlantaTrasero);
          break;

        case 'Suspensión':
          addCampo('SUSPENSION', ' ');
          if (mod.detalle?.horquillaDelanteraMoto) {
            addCampo('HORQUILLA DELANTERA DE MOTO', ' ');
            addCampo('Marca', mod.marca);
            addCampo('Referencia', mod.referencia);
          }
          if (mod.detalle?.muelleDelanteroMoto) {
            addCampo('MUELLE DELANTERO DE MOTO', ' ');
            addCampo('Marca', mod.marca);
            addCampo('Referencia', mod.referencia);
          }
          if (mod.detalle?.muelleTraseroMoto) {
            addCampo('MUELLE TRASERO DE MOTO', ' ');
            addCampo('Marca', mod.marca);
            addCampo('Referencia', mod.referencia);
          }
          if (mod.detalle?.amortiguadorDelanteroMoto) {
            addCampo('AMORTIGUADOR DELANTERO DE MOTO', ' ');
            addCampo('Marca', mod.marca);
            addCampo('Referencia', mod.referencia);
          }
          if (mod.detalle?.amortiguadorTraseroMoto) {
            addCampo('AMORTIGUADOR TRASERO DE MOTO', ' ');
            addCampo('Marca', mod.marca);
            addCampo('Referencia', mod.referencia);
          }
          break;

        case 'Carrocería':
          if (mod.detalle?.guardabarrosDelanteroMoto) {
            addCampo('GUARDABARROS DELANTERO DE MOTO', ' ');
            addCampo(
              'Tipo de fabricación',
              mod.tipoFabricacionGuardabarrosDelantero
            );
            addCampo('Marca', mod.marcaDelantero || 'N/A');
            addCampo('Referencia', mod.referenciaDelantero || 'N/A');
            addCampo('Dimensiones', mod.dimensionesDelantero);
            addCampo('Metrica', mod.metrica);
          }
          if (mod.detalle?.guardabarrosTraseroMoto) {
            addCampo('GUARDABARROS TRASERO DE MOTO', ' ');
            addCampo(
              'Tipo de fabricación',
              mod.tipoFabricacionGuardabarrosTrasero
            );
            addCampo('Marca', mod.marcatRasero || 'N/A');
            addCampo('Referencia', mod.referenciaTrasero || 'N/A');
            addCampo('Dimensiones', mod.dimensionesTrasero);
            addCampo('Metrica', mod.metrica);
          }
          if (mod.detalle?.velocimetroMoto) {
            addCampo('VELOCIMETRO DE MOTO', ' ');
            addCampo('Marca', mod.marca);
            addCampo('Referencia', mod.referencia || 'N/A');
            addCampo('Contraseña de homologación', mod.homologacion || 'N/A');
            addCampo('Metrica', mod.metrica);
            addCampo('Nº de tornillos', mod.nTornillos);
          }
          if (mod.detalle?.retrovisoresMoto) {
            addCampo('RETROVISORES DE MOTO', ' ');
            addCampo('Marca', mod.marca);
            addCampo('Modelo', mod.modelo || 'N/A');
            addCampo('Marcaje', mod.marcaje || 'N/A');
            addCampo('Contraseña de homologación', mod.homologacion);
            addCampo('Nº de tornillos', mod.nTornillos);
          }
          break;

        case 'Freno':
          if (mod.detalle?.latiguillosMoto) {
            addCampo('LATIGUILLOS DE MOTO', ' ');
            addCampo('Marca latiguillos delanteros', mod.marcaDelanteros);
            addCampo(
              'Referencia latiguillos delanteros',
              mod.referenciaDelanteros
            );
            addCampo('Marca latiguillos traseros', mod.marcaTraseros);
            addCampo('Referencia latiguillos traseros', mod.referenciaTraseros);
          }
          if (mod.detalle?.discosPerforadosRayadosMoto) {
            addCampo('DISCOS PERFORADOS/RALLADOS DE MOTO', ' ');
            if (mod.discoDelantero) {
              addCampo('Marca disco delantero', mod.marcaDiscoDelantero);
              addCampo(
                'Referencia disco delantero',
                mod.referenciaDiscoDelantero
              );
              addCampo('Metrica disco delantero', mod.metrica);
            }
            if (mod.discoTrasero) {
              addCampo('DISCO TRASERO DE MOTO', ' ');
              addCampo('Marca disco trasero', mod.marcaDiscoTrasero);
              addCampo('Referencia disco trasero', mod.referenciaDiscoTrasero);
              addCampo('Metrica disco trasero', mod.metrica);
            }
            if (mod.pastillaDelantera) {
              addCampo('PASTILLA DELANTERA DE MOTO', ' ');
              addCampo('Marca pastilla delantero', mod.marcaPastillaDelantera);
              addCampo(
                'Referencia pastilla delantero',
                mod.referenciaPastillaDelantera
              );
              addCampo('Metrica pastilla delantero', mod.metrica);
            }
            if (mod.pastillaTrasera) {
              addCampo('PASTILLA TRASERA DE MOTO', ' ');
              addCampo('Marca pastilla trasera', mod.marcaPastillaTrasera);
              addCampo(
                'Referencia pastilla trasera',
                mod.referenciaPastillaTrasera
              );
              addCampo('Metrica pastilla trasera', mod.metrica);
            }
          }
          break;

        case 'Luces':
          if (mod.detalle?.faroDelanteroMoto) {
            addCampo('FARO DELANTERO DE MOTO', ' ');
            addCampo('Marca', mod.marca);
            addCampo('Modelo', mod.modelo);
            addCampo('Referencia', mod.referencia);
            addCampo('Marcajes', mod.marcajes);
            addCampo('Homologación', mod.homologacion);
          }
          if (mod.detalle?.PilotoTraseroMoto) {
            addCampo('PILOTO TRASERO DE MOTO', ' ');
            addCampo('Marca', mod.marca);
            addCampo('Modelo', mod.modelo);
            addCampo('Referencia', mod.referencia);
            addCampo('Marcajes', mod.marcajes);
            addCampo('Homologación', mod.homologacion);
          }
          if (mod.detalle?.luzDeMatriculaMoto) {
            addCampo('LUZ DE MATRICULA DE MOTO', ' ');
            addCampo('Marca', mod.marca);
            addCampo('Modelo', mod.modelo);
            addCampo('Referencia', mod.referencia);
            addCampo('Marcajes', mod.marcajes);
            addCampo('Homologación', mod.homologacion);
          }
          if (mod.detalle?.catadriopticoTraseroMoto) {
            addCampo('CATADIOPTRICO TRASERO DE MOTO', ' ');
            addCampo('Marca', mod.marca);
            addCampo('Modelo', mod.modelo);
            addCampo('Referencia', mod.referencia);
            addCampo('Marcajes', mod.marcajes);
            addCampo('Homologación', mod.homologacion);
          }
          if (mod.detalle?.intermitentesMoto) {
            addCampo('INTERMITENTES DE MOTO', ' ');
            addCampo('Marca', mod.marca);
            addCampo('Modelo', mod.modelo);
            addCampo('Referencia', mod.referencia);
            addCampo('Marcajes', mod.marcajes);
            addCampo('Homologación', mod.homologacion);
          }
          break;
      }
    }

    if (tipoVehiculo.toLowerCase() == 'camper') {
      switch (mod.nombre) {
        case 'Modificaciones en el interior del vehículo':
          if (mod.detalle?.mobiliarioInterior) {
            addCampo('MOBILIARIO INTERIOR', ' ');
            addCampo(
              'Diametro de tornillos del mobiliario',
              mod.diametroTornilloSeleccionado
            );
            if (mod.detalle?.mobiliarioInterior?.muebleBajo) {
              addCampo('MUEBLES BAJOS', ' ');
              for (let mueble of mod.detalle?.mobiliarioInterior.muebleBajo) {
                addCampo(`Medidas mueble bajo`, mueble.medidas);
                addCampo(`Peso mueble bajo`, mueble.pesoMuebleBajo);
                addCampo(
                  `Nº de tornillos mueble bajo`,
                  mueble.tornillosMuebleBajo
                );
                addCampo(
                  `Tipo de fabricación mueble bajo`,
                  mueble.tipoFabricacionMuebleBajo
                );
                addCampo(`Marca mueble bajo`, mueble.marcaMuebleBajo || 'N/A');
                addCampo(
                  `Referencia mueble bajo`,
                  mueble.referenciaMuebleBajo || 'N/A'
                );
              }
            }
            if (mod.detalle?.mobiliarioInterior?.muebleAlto) {
              addCampo('MUEBLES ALTOS', ' ');
              for (let mueble of mod.detalle?.mobiliarioInterior.muebleBajo) {
                addCampo(`Medidas mueble alto`, mueble.medidas);
                addCampo(`Peso mueble alto`, mueble.pesoMuebleAlto);
                addCampo(
                  `Nº de tornillos mueble alto`,
                  mueble.tornillosMuebleAlto
                );
                addCampo(
                  `Tipo de fabricación mueble alto`,
                  mueble.tipoFabricacionMuebleAlto
                );
                addCampo(`Marca mueble alto`, mueble.marcaMuebleAlto || 'N/A');
                addCampo(
                  `Referencia mueble alto`,
                  mueble.referenciaMuebleAlto || 'N/A'
                );
              }
            }
            if (mod.detalle?.mobiliarioInterior?.aseo) {
              addCampo('ASEOS', ' ');
              for (let mueble of mod.detalle.mobiliarioInterior.aseo) {
                addCampo(`Medidas del aseo`, mueble.medidas);
                addCampo(`Peso del aseo`, mueble.pesoMuebleAseo);
                addCampo(
                  `Nº de tornillos del aseo`,
                  mueble.tornillosMuebleAseo
                );
                addCampo(`Descripción del aseo`, mueble.descripcion);
              }
            }
            if (mod.detalle?.mobiliarioInterior?.claraboyas) {
              addCampo('CLARABOYAS', ' ');
              addCampo(
                `Cantidad de claraboyas instaladas`,
                mod.cantidadClaraboya
              );
              addCampo(`Marca de la claraboya`, mod.marcaClaraboya);
              addCampo(`Modelo de la claraboya`, mod.modeloClaraboya);
              addCampo(`Descripción de la claraboya`, mod.descripcionClaraboya);
              addCampo(
                `Contraseña de homologación de la claraboya`,
                mod.homologacionClaraboya
              );
            }
            if (mod.detalle?.mobiliarioInterior?.ventanas) {
              addCampo('VENTANAS', ' ');
              addCampo(`Cantidad de ventanas instaladas`, mod.cantidadVentanas);
              addCampo(`Marca de la ventana`, mod.marcaVentana);
              addCampo(`Modelo de la ventana`, mod.modeloVentana);
              addCampo(`Descripción de la ventana`, mod.descripcionVentana);
              addCampo(`Descripción de la ventana`, mod.dimensionesVentana);
              addCampo(
                `Contraseña de homologación de la ventana`,
                mod.homologacionVentana
              );
            }
          }
          if (mod.detalle?.fontaneria) {
            if (mod.detalle?.fontaneria?.depositoAguaSucia) {
              addCampo('DEPOSITO DE AGUA SUCIA', ' ');
              addCampo(
                `Cantidad de litros de agua sucia instaladas`,
                mod.litrosAguaSucia
              );
              addCampo(`Metrica del deposito de agua sucia`, mod.metrica);
              addCampo(
                `Nº de tornillos del deposito de agua sucia`,
                mod.nTornillos
              );
            }
            if (mod.detalle?.fontaneria?.depositoAguaLimpia) {
              addCampo('DEPOSITO DE AGUA LIMPIA', ' ');
              addCampo(
                `Cantidad de litros de agua limpia instaladas`,
                mod.litrosAguaLimpia
              );
              addCampo(
                `Medidas del deposito de agua limpia`,
                mod.medidasAguaLimpia
              );
              addCampo(`Metrica del deposito de agua limpia`, mod.metrica);
              addCampo(
                `Nº de tornillos del deposito de agua limpia`,
                mod.nTornillos
              );
            }
            if (mod.detalle?.fontaneria?.bombaDeAgua) {
              addCampo('BOMBA DE AGUA', ' ');
              addCampo(`Marca de la bomba de agua`, mod.marcaBombaAgua);
              addCampo(`Modelo de la bomba de agua`, mod.modeloBombaAgua);
              addCampo(`Ubicación de la bomba de agua`, mod.ubicacionBombaAgua);
              addCampo(
                `Metrica de los tornillos de la bomba de agua`,
                mod.metrica
              );
            }
            if (mod.detalle?.fontaneria?.duchaExterior) {
              addCampo('DUCHA EXTERIOR', ' ');
              addCampo(
                `Ubicación de la bomba de agua`,
                mod.ubicacionDuchaExterior
              );
              addCampo(
                `Metrica de los tornillos de la bomba de agua`,
                mod.metrica
              );
            }
          }

          //CONTINUAR

          if (mod.detalle?.instalacionElectrica) {
            if (mod.detalle?.instalacionElectrica?.tomaCorrienteInterior) {
              addCampo('TOMA DE CORRIENTE INTERIOR CAMPER', ' ');
              addCampo(`Voltaje de la toma exterior`, mod.voltajeTomaExterior);
              addCampo(
                `Ubicación de la toma exterior`,
                mod.ubicacionTomaExterior
              );
              addCampo(`Medidas de la toma exterior`, mod.medidasTomaExterior);
            }
            if (mod.detalle?.instalacionElectrica?.bateriaAuxiliar) {
              addCampo('INSTALACION ELECTRICA AUXILIAR CAMPER', ' ');
              addCampo(`Cantidad de baterías instaladas`, mod.cantidadBaterias);
              addCampo(
                `Potencia de las baterías instaladas`,
                mod.potenciaBaterias
              );
              addCampo(
                `Ubicación de las baterías instaladas`,
                mod.ubicacionBaterias
              );
            }
            if (mod.detalle?.instalacionElectrica?.cargadorDeBateria) {
              addCampo('CARGADOR DE BATERIA CAMPER', ' ');
              addCampo(
                `Marca del cargador de batería`,
                mod.marcaCargadorDeBateria
              );
              addCampo(
                `Modelo del cargador de batería`,
                mod.modeloCarcadorDeBaretia
              );
              addCampo(
                `Potencia del cargador de batería`,
                mod.potenciaCargadorDeBateria
              );
              addCampo(
                `Dimensiones del cargador de la batería`,
                mod.dimensionesCargadorDeBateria
              );
              addCampo(
                `Ubicación del cargador de la batería`,
                mod.ubicacionCargadorDeBateria
              );
            }
            if (mod.detalle?.instalacionElectrica?.iluminacionExterior) {
              addCampo('ILUMINACION EXTERIOR CAMPER', ' ');
              addCampo(
                `Marca de la iluminación exterior`,
                mod.marcaIlumincionExterior
              );
              addCampo(
                `Modelo de la iluminación exterior`,
                mod.modeloIlumincionExterior
              );
              addCampo(
                `Potencia de la iluminación exterior`,
                mod.potenciaIlumincionExterior
              );
              addCampo(
                `Dimensiones de la ilumucación exterior`,
                mod.dimensionesIlumincionExterior
              );
              addCampo(
                `Ubicación de la ilumucación exterior`,
                mod.ubicacionIlumincionExterior
              );
            }
            if (mod.detalle?.instalacionElectrica?.inversor) {
              addCampo('INVERSOR CAMPER', ' ');
              addCampo(`Potencia del inversor`, mod.potenciaInversor);
              addCampo(`Marca del inversor`, mod.marcaInversor);
              addCampo(`Ubicación del inversor`, mod.ubicacionInversor);
            }
            if (mod.detalle?.instalacionElectrica?.placaSolar) {
              addCampo('PLACA SOLAR CAMPER', ' ');
              addCampo(`Marca de la placa solar`, mod.marcaPlacaSolar);
              addCampo(`Modelo de la placa solar`, mod.modeloPlacaSolar);
              addCampo(`Potencia de la placa solar`, mod.potenciaPlacaSolar);
              addCampo(
                `Dimensiones de la placa solar`,
                mod.dimensionesPlacaSolar
              );
              addCampo(`Ubicación de la placa solar`, mod.ubicacionPlacaSolar);
            }
            if (mod.detalle?.instalacionElectrica?.reguladorSolar) {
              addCampo('REGULADOR SOLAR CAMPER', ' ');
              addCampo(`Modelo del controlador`, mod.modeloControlador);
              addCampo(`Marca del controlador`, mod.marcaControlador);
              addCampo(`Ubicación del controlador`, mod.ubicacionControlador);
            }
          }

          break;

        case 'Toldo':
          addCampo('TOLDO CAMPER', ' ');
          addCampo('Marca del toldo', mod.marcaToldo);
          addCampo('Medidas del toldo', mod.medidasToldo);
          addCampo('Ubicación del toldo', mod.ubicacionToldo);
          addCampo('Metrica del toldo', mod.metrica);
          addCampo('Número de tornillos del toldo', mod.nTornillos);
          break;
      }
    }

    if (filas.length > 0) {
      seccion.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: filas.map(
            (celdas) =>
              new TableRow({
                children: celdas,
              })
          ),
        })
      );
    }

    return seccion;
  }

  // ======= MODIFICACIONES =======
  let modsSel = (data.modificaciones || []).filter((m: any) => m.seleccionado);
  console.log('Modificaciones recibidas:', data.modificaciones);
  if (!modsSel.length) {
    console.warn(
      '⚠️ No se encontraron modificaciones seleccionadas. Mostrando todas.'
    );
    modsSel = data.modificaciones || [];
  }

  if (modsSel.length) {
    contenido.push(subtitulo('Modificaciones seleccionadas'));
    for (const mod of modsSel) {
      const bloque = generarBloqueReforma(mod, data.tipoVehiculo);
      contenido.push(...bloque);
    }
  }

  // ======= SECCIÓN DE IMÁGENES =======

  // Convierte base64 → ImageRun manteniendo proporciones
  const convertirBase64AImagenRun = async (
    b64: string,
    maxWidth = 320
  ): Promise<ImageRun | null> => {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = b64;
      });

      const base64Data = b64.replace(/^data:image\/\w+;base64,/, '');
      const byteChars = atob(base64Data);
      const byteNumbers = new Array(byteChars.length)
        .fill(0)
        .map((_, i) => byteChars.charCodeAt(i));
      const byteArray = new Uint8Array(byteNumbers);

      const ratio = img.width > maxWidth ? maxWidth / img.width : 1;
      const width = img.width * ratio;
      const height = img.height * ratio;

      const match = b64.match(/^data:image\/(\w+);base64,/);
      let ext = match ? match[1].toLowerCase() : 'jpeg';
      if (ext === 'jpeg') ext = 'jpg';
      if (!['png', 'jpg', 'gif', 'bmp'].includes(ext)) ext = 'jpg';

      return new ImageRun({
        data: byteArray,
        type: ext as 'png' | 'jpg' | 'gif' | 'bmp',
        transformation: { width, height },
      });
    } catch (err) {
      console.error('Error convirtiendo imagen base64:', err);
      return null;
    }
  };

  // Crea una tabla 2xN con las imágenes centradas
  const agregarBloqueImagenes = async (
    tituloSeccion: string,
    imagenes: string[]
  ) => {
    contenido.push(new Paragraph({ pageBreakBefore: true }));
    contenido.push(subtitulo(tituloSeccion));

    const filas: TableRow[] = [];
    for (let i = 0; i < imagenes.length; i += 2) {
      const img1 = await convertirBase64AImagenRun(imagenes[i]);
      const img2 = imagenes[i + 1]
        ? await convertirBase64AImagenRun(imagenes[i + 1])
        : null;

      filas.push(
        new TableRow({
          children: [
            new TableCell({
              children: img1
                ? [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [img1],
                    }),
                  ]
                : [],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: img2
                ? [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [img2],
                    }),
                  ]
                : [],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
          ],
        })
      );
    }

    contenido.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: filas,
      })
    );
  };

  // Llamadas principales
  if (Array.isArray(data.prevImagesB64) && data.prevImagesB64.length > 0) {
    await agregarBloqueImagenes(
      'Imágenes antes de la reforma',
      data.prevImagesB64
    );
  }

  if (Array.isArray(data.postImagesB64) && data.postImagesB64.length > 0) {
    await agregarBloqueImagenes(
      'Imágenes después de la reforma',
      data.postImagesB64
    );
  }

  if (
    Array.isArray(data.docsImagesB64?.FichaTecnica) &&
    data.docsImagesB64.FichaTecnica.length > 0
  ) {
    await agregarBloqueImagenes(
      'Imágenes de la ficha técnica',
      data.docsImagesB64.FichaTecnica
    );
  }

  if (
    Array.isArray(data.docsImagesB64?.TicketDePeso) &&
    data.docsImagesB64.TicketDePeso.length > 0
  ) {
    await agregarBloqueImagenes(
      'Imágenes del ticket de peso',
      data.docsImagesB64.TicketDePeso
    );
  }

  if (
    Array.isArray(data.docsImagesB64?.PermisoDeCirculacion) &&
    data.docsImagesB64.PermisoDeCirculacion.length > 0
  ) {
    await agregarBloqueImagenes(
      'Imágenes del permiso de circulación',
      data.docsImagesB64.PermisoDeCirculacion
    );
  }

  if (
    Array.isArray(data.docsImagesB64?.DocumentacionAdicional) &&
    data.docsImagesB64.DocumentacionAdicional.length > 0
  ) {
    await agregarBloqueImagenes(
      'Imágenes de la documentación adicional',
      data.docsImagesB64.DocumentacionAdicional
    );
  }

  // ======= CREACIÓN DEL DOCUMENTO =======
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 }, // ≈2 cm
          },
        },
        children: contenido,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return blob; // listo para enviar al servidor
}
