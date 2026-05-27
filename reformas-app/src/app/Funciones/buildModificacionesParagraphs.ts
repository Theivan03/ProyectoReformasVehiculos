import {
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  AlignmentType,
  TableCell,
  TableRow,
  VerticalAlign,
  WidthType,
} from 'docx';
import { Modificacion } from '../interfaces/modificacion';

// Devuelve la lista de luces de trabajo específico. Usa el array nuevo
// (lucesEspecificasItems) o reconstruye uno desde los campos planos antiguos.
function resolveLucesEspecificasItems(mod: any): any[] {
  // Si el array nuevo existe (aunque esté vacío) es la fuente de verdad.
  if (Array.isArray(mod?.lucesEspecificasItems)) {
    return mod.lucesEspecificasItems;
  }

  const hasLegacy =
    mod?.ubicacionLucesEspecificas ||
    mod?.medidasLucesEspecificas ||
    mod?.pesoPiezaKgLucesEspecificas != null ||
    mod?.metricaLucesEspecificas != null;

  if (!hasLegacy) return [];

  return [
    {
      ubicacion: mod.ubicacionLucesEspecificas,
      medidas: mod.medidasLucesEspecificas,
      curvatura: mod.radioCurvaRLucesEspecificas,
    },
  ];
}

export function buildModificacionesParagraphs(
  modificaciones: Modificacion[],
  data: any,
  suspension: any,
): Paragraph[] {
  modificaciones = Array.isArray(modificaciones) ? modificaciones : [];
  const out: Paragraph[] = [];
  let mod: Modificacion;
  let raw;

  //
  // 1) REMOLQUE HOMOLOGADO EN EMPLAZAMIENTO NO HOMOLOGADO
  //
  const remolquenohomologado = modificaciones.find(
    (m) =>
      m.nombre === 'REMOLQUE HOMOLOGADO EN EMPLAZAMIENTO NO HOMOLOGADO' &&
      m.seleccionado,
  );
  if (remolquenohomologado) {
    (remolquenohomologado.acciones || []).forEach((accion: string) => {
      const raw = `- ${accion} de enganche de remolque homologado en emplazamiento no homologado, consistente en: soporte marca ${remolquenohomologado.marca}, tipo ${remolquenohomologado.tipo}, clase ${remolquenohomologado.clase}, contraseña de homologación ${remolquenohomologado.homologacion}, para una MMR en remolques de eje central ${remolquenohomologado.mmrEjeCentral} kg y de barra de tracción ${remolquenohomologado.mmrBarraTraccion} kg.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });

      // Guardar también el texto plano para futuras referencias
      (p as any)._rawText = raw;

      out.push(p);
    });
  }

  //
  // 2) REMOLQUE HOMOLOGADO EN EMPLAZAMIENTO TAMBIÉN HOMOLOGADO
  //
  const remolquehomologado = modificaciones.find(
    (m) =>
      m.nombre === 'REMOLQUE HOMOLOGADO EN EMPLAZAMIENTO TAMBIÉN HOMOLOGADO' &&
      m.seleccionado,
  );
  if (remolquehomologado) {
    (remolquehomologado.acciones || []).forEach((accion: string) => {
      const raw = `- ${accion} de enganche de remolque homologado en emplazamiento también homologado, consistente en: soporte marca ${remolquehomologado.marcaBarra}, tipo ${remolquehomologado.tipoBarra}, clase ${remolquehomologado.claseBarra}, contraseña de homologación ${remolquehomologado.homologacionBarra}, para una MMR en remolques de eje central ${remolquehomologado.mmrEjeCentral} kg y de barra de tracción ${remolquehomologado.mmrBarraTraccion} kg.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });

      (p as any)._rawText = raw;
      out.push(p);
    });
  }

  //
  // 3) REDUCCIÓN DE PLAZAS
  //
  const reduccionplazas = modificaciones.find(
    (m) => m.nombre === 'REDUCCIÓN DE PLAZAS' && m.seleccionado,
  );
  if (reduccionplazas) {
    const raw = `- Disminución de plazas de asiento pasando de ${reduccionplazas.plazasAntes} a ${reduccionplazas.plazasDespues} mediante la desinstalación del cinturón de seguridad y el anclaje de la plaza ${reduccionplazas.enclaje}.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);

    if (reduccionplazas.incluirNotaQuitadoCinturon) {
      out.push(
        new Paragraph({
          spacing: { line: 260, after: 120 },
          children: [
            new TextRun({ text: 'NOTA: ', bold: true }),
            new TextRun({
              text: 'En la plaza en la cual se ha desinstalado el cinturón de seguridad, se ha instalado un pictograma con texto el cual indica inequívocamente que dicha plaza no puede utilizarse con el vehículo en circulación.',
            }),
          ],
        }),
      );
    }
  }

  //
  // 4) NEUMÁTICOS
  //
  const neumaticos = modificaciones.find(
    (m) => m.nombre === 'NEUMÁTICOS' && m.seleccionado,
  );

  if (neumaticos) {
    // --- PÁRRAFO PRINCIPAL ---
    let raw: string;
    if (neumaticos.neumaticosDistintosEjes) {
      const neumDel = neumaticos.medidaNeumaticoDelantero || '---';
      const llantaDel = neumaticos.medidaLlantaDelantera || '---';
      const neumTras = neumaticos.medidaNeumaticoTrasero || '---';
      const llantaTras = neumaticos.medidaLlantaTrasera || '---';
      raw = `- Sustitución de neumáticos por otros homologados de medidas no equivalentes: en el eje delantero ${neumDel} montados sobre llantas de medidas ${llantaDel}, y en el eje trasero ${neumTras} montados sobre llantas de medidas ${llantaTras}, asegurando la compatibilidad llanta-neumático y la no interferencia entre los neumáticos y ningún punto de la carrocería.`;
    } else {
      const medidaNeumatico = neumaticos.medidaNeumaticos || '---';
      const medidaLlantas = neumaticos.medidaLlantas || '---';
      raw = `- Sustitución de neumáticos en ambos ejes por otros homologados de medidas no equivalentes ${medidaNeumatico}, montados sobre llantas de medidas ${medidaLlantas}, asegurando la compatibilidad llanta-neumático y la no interferencia entre los neumáticos y ningún punto de la carrocería.`;
    }

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);

    // --- LÓGICA DE CONTADOR DE NOTAS ---
    const totalNotas =
      (neumaticos.anotacion1 ? 1 : 0) + (neumaticos.anotacion2 ? 1 : 0);

    // Si hay 2 notas, empezamos a contar (Nota 1, Nota 2). Si solo hay 1, se queda vacío.
    let nota = totalNotas === 2 ? 1 : '';

    // --- ANOTACIÓN 1: VELOCÍMETRO ---
    if (neumaticos.anotacion1) {
      out.push(
        new Paragraph({
          spacing: { line: 260, after: 120 },
          children: [
            new TextRun({
              text: `NOTA ${nota}: `,
              bold: true,
            }),
            new TextRun({
              text: 'Debido a que la diferencia de diámetro entre el neumático original y el nuevo es superior al 8%, se ha procedido al tarado del velocímetro.',
            }),
          ],
        }),
      );
      // Incrementamos el contador para la siguiente nota si es necesario
      if (typeof nota === 'number') nota++;
    }

    // --- ANOTACIÓN 2: VELOCIDAD MÁXIMA ---
    if (neumaticos.anotacion2) {
      out.push(
        new Paragraph({
          spacing: { line: 260, after: 120 },
          children: [
            new TextRun({
              text: `NOTA ${nota}: `,
              bold: true,
            }),
            new TextRun({
              text: `Debido a que por su construcción, este vehículo es capaz de alcanzar una velocidad máxima de Vmáx = ${neumaticos.velocidadMaximaAntes} Km/h, superior al índice de velocidad de los neumáticos instalados, se deberá instalar una pegatina limitadora de velocidad de Vmáx = ${neumaticos.velocidadMaximaDespues} Km/h, visible desde el puesto de conducción.`,
            }),
          ],
        }),
      );
    }

    // --- ANOTACIÓN 3: VERIFICACIÓN DE CARGA (Sin etiqueta "NOTA") ---
    if (neumaticos.anotacion3) {
      // CASO A: MOTOS (Según tu HTML: datosEntrada.tipoVehiculo === "motos")
      if (data.tipoVehiculo === 'motos') {
        // Eje 1 (Delantero)
        if (neumaticos.checkEje1Neumaticos) {
          const indice = neumaticos.indiceCargaEje1Neumaticos || '---';
          const carga = neumaticos.cargaEquivalenteEje1Neumaticos || '---';
          const mma = neumaticos.mmaEje1Neumaticos || '---';

          const rawMoto1 = `Se comprueba que el nuevo índice de carga de los neumáticos (${indice}, que equivale a ${carga} Kg) es capaz de soportar la MMA del 1er eje (${mma} Kg).`;

          const pMoto1 = new Paragraph({
            spacing: { line: 260, after: 120 },
            children: [new TextRun({ text: rawMoto1 })],
          });
          (pMoto1 as any)._rawText = rawMoto1;
          out.push(pMoto1);
        }

        // Eje 2 (Trasero)
        if (neumaticos.checkEje2Neumaticos) {
          const indice = neumaticos.indiceCargaEje2Neumaticos || '---';
          const carga = neumaticos.cargaEquivalenteEje2Neumaticos || '---';
          const mma = neumaticos.mmaEje2Neumaticos || '---';

          const rawMoto2 = `Se comprueba que el nuevo índice de carga de los neumáticos (${indice}, que equivale a ${carga} Kg) es capaz de soportar la MMA del 2º eje (${mma} Kg).`;

          const pMoto2 = new Paragraph({
            spacing: { line: 260, after: 120 },
            children: [new TextRun({ text: rawMoto2 })],
          });
          (pMoto2 as any)._rawText = rawMoto2;
          out.push(pMoto2);
        }
      } else {
        // CASO B: COCHE / CAMPER (Caso General)
        const indice = neumaticos.indiceCargaGeneralNeumaticos || '---';
        const carga = neumaticos.cargaEquivalenteGeneralNeumaticos || '---';

        const rawCoche = `Se comprueba que el nuevo índice de carga de los neumáticos (${indice}, que equivale a ${carga} Kg) es capaz de soportar tanto las MMA/MMTA por ejes como la MMA/MMTA total del vehículo sin remolque y en caso de remolque.`;

        const pCoche = new Paragraph({
          spacing: { line: 260, after: 120 },
          children: [new TextRun({ text: rawCoche })],
        });

        (pCoche as any)._rawText = rawCoche;
        out.push(pCoche);
      }
    }
  }

  //
  // 5) SEPARADORES DE RUEDA
  //
  const separadoresruedas = modificaciones.find(
    (m) => m.nombre === 'SEPARADORES DE RUEDA' && m.seleccionado,
  );

  if (separadoresruedas) {
    let descripcion = '';

    if (separadoresruedas.ubicacionSeparadores === 'delanteros') {
      descripcion = `en eje delantero marca ${separadoresruedas.marcaSeparadores}, referencia ${separadoresruedas.referenciaSeparadores}, de ${separadoresruedas.grosorSeparadores}mm de espesor`;
    } else if (separadoresruedas.ubicacionSeparadores === 'traseros') {
      descripcion = `en eje trasero marca ${separadoresruedas.marcaSeparadores}, referencia ${separadoresruedas.referenciaSeparadores}, de ${separadoresruedas.grosorSeparadores}mm de espesor`;
    } else if (separadoresruedas.ubicacionSeparadores === 'ambos') {
      if (separadoresruedas.separadoresIguales) {
        descripcion = `en ambos ejes marca ${separadoresruedas.marcaSeparadores}, referencia ${separadoresruedas.referenciaSeparadores}, de ${separadoresruedas.grosorSeparadores}mm de espesor`;
      } else {
        descripcion = `en ambos ejes. En el eje delantero marca ${separadoresruedas.marcaSeparadores}, referencia ${separadoresruedas.referenciaSeparadores}, de ${separadoresruedas.grosorSeparadores}mm de espesor, y en el eje trasero marca ${separadoresruedas.marcaSeparadoresTraseros}, referencia ${separadoresruedas.referenciaSeparadoresTraseros}, de ${separadoresruedas.grosorSeparadoresTraseros}mm de espesor`;
      }
    }

    const raw = `- Instalación de separadores de rueda ${descripcion} fabricados en duraluminio, asegurando la no interferencia entre la rueda y ningún punto de la carrocería.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 6) ALETINES Y SOBREALETINES
  //
  const aletines = modificaciones.find(
    (m) =>
      m.nombre === 'ALETINES Y SOBREALETINES' &&
      m.seleccionado &&
      m.detalle?.aletines,
  );
  if (aletines) {
    const esArtesanalAletines =
      aletines.tipoFabricacionAletines === 'artesanal';
    const anchosDistintosAle =
      aletines.posicionAletines === 'delantero y trasero' &&
      aletines.anchosDistintosAletines;

    let descripcionPiezaAle: string;
    if (esArtesanalAletines) {
      descripcionPiezaAle = `artesanales, fabricados en ${aletines.materialAletines || '---'}, ${
        anchosDistintosAle
          ? `con ${aletines.anchoDelanteroAletines} mm de ancho en el eje delantero y ${aletines.anchoTraseroAletines} mm de ancho en el eje trasero, y una altura de ${aletines.altoAletines} mm`
          : `de medidas ${aletines.anchoAletines}x${aletines.altoAletines} mm`
      }`;
    } else if (anchosDistintosAle) {
      descripcionPiezaAle = `marca ${aletines.marcaDelanteroAletines || '---'}, referencia ${aletines.referenciaDelanteroAletines || '---'} y ${aletines.anchoDelanteroAletines} mm de ancho en el eje delantero, y marca ${aletines.marcaTraseroAletines || '---'}, referencia ${aletines.referenciaTraseroAletines || '---'} y ${aletines.anchoTraseroAletines} mm de ancho en el eje trasero, de material plástico ABS y una altura de ${aletines.altoAletines} mm`;
    } else {
      descripcionPiezaAle = `marca ${aletines.marcaAletines || '---'}, referencia ${aletines.referenciaAletines || '---'}, de material plástico ABS y medidas de ${aletines.anchoAletines}x${aletines.altoAletines} mm`;
    }

    (aletines.acciones || []).forEach((accion: string) => {
      const raw = `- ${accion} de los aletines originales por otros en eje ${aletines.posicionAletines}, ${descripcionPiezaAle}. Se asegura la no interferencia entre el neumático y ningún punto de la carrocería.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });

      (p as any)._rawText = raw;
      out.push(p);
    });
  }

  const sobrealetines = modificaciones.find(
    (m) =>
      m.nombre === 'ALETINES Y SOBREALETINES' &&
      m.seleccionado &&
      m.detalle?.sobrealetines,
  );
  if (sobrealetines) {
    const esArtesanalSob =
      !sobrealetines.tipoFabricacionSobrealetines ||
      sobrealetines.tipoFabricacionSobrealetines === 'artesanal';
    const descripcionOrigenSob = esArtesanalSob
      ? `fabricados en ${sobrealetines.materialSobrealetines || 'goma'} de forma artesanal`
      : `de la marca ${sobrealetines.marcaSobreletines || '---'}, referencia ${sobrealetines.referenciaSobreletines || '---'}`;

    const anchosDistintosSob =
      sobrealetines.posicionSobrealetines === 'delantero y trasero' &&
      sobrealetines.anchosDistintosSobrealetines;
    const descripcionMedidasSob = anchosDistintosSob
      ? `, con ${sobrealetines.anchoDelanteroSobrealetines} mm de ancho en el eje delantero y ${sobrealetines.anchoTraseroSobrealetines} mm de ancho en el eje trasero`
      : `, de ${sobrealetines.anchoSobrealetines} mm de ancho`;

    (sobrealetines.acciones || []).forEach((accion: string) => {
      const raw = `- ${accion} de sobrealetines en eje ${sobrealetines.posicionSobrealetines}, ${descripcionOrigenSob}${descripcionMedidasSob}, asegurando la no interferencia entre el neumático y ningún punto de la carrocería.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });

      (p as any)._rawText = raw;
      out.push(p);
    });
  }

  // Buscamos la modificación específica
  const campoLibre = modificaciones.find(
    (m) =>
      m.nombre === 'CAMPO LIBRE SOBRE REFORMAS NO EXISTENTES' && m.seleccionado,
  );

  if (campoLibre) {
    const lineas: string[] = [];

    if (
      Array.isArray(campoLibre.reformasAdicionalesItems) &&
      campoLibre.reformasAdicionalesItems.length > 0
    ) {
      campoLibre.reformasAdicionalesItems.forEach((item: any) => {
        const descripcion = (item?.descripcion ?? '').toString();
        descripcion
          .split(/\r?\n/)
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0)
          .forEach((line: string) => lineas.push(line));
      });
    } else if (campoLibre.reformasAdicionales) {
      campoLibre.reformasAdicionales
        .split(/\r?\n/)
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .forEach((line: string) => lineas.push(line));
    }

    lineas.forEach((lineaLimpia: string) => {
      const raw = `- ${lineaLimpia}`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [
          new TextRun({
            text: raw,
          }),
        ],
      });

      (p as any)._rawText = raw;
      out.push(p);
    });
  }

  //
  // 7) SNORKEL
  //
  const snorkel = modificaciones.find(
    (m) => m.nombre === 'SNORKEL' && m.seleccionado,
  );
  if (snorkel) {
    snorkel.acciones?.forEach((accion: string) => {
      const raw = `- ${accion} de Snorkel fabricado en material ${snorkel.materialSnorkel}, de marca ${snorkel.marcaSnorkel}, con medidas ${snorkel.medidasSnorkel}, garantizando que se respeta la admisión original del vehículo y que los nuevos conductos tienen una sección superior a la del filtro de admisión original.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });

      (p as any)._rawText = raw;
      out.push(p);
    });
  }

  //
  // 8) PARAGOLPES DELANTERO
  //
  const paradelante = modificaciones.find(
    (m) => m.nombre === 'PARAGOLPES DELANTERO' && m.seleccionado,
  );
  if (paradelante) {
    paradelante.acciones?.forEach((accion: string) => {
      const fraseParagolpesDelantero =
        paradelante.tipoFabricacionParagolpesDelantero === 'comercial'
          ? `${accion} de paragolpes delantero marca ${paradelante.marcaParagolpes}, referencia ${paradelante.referenciaParagolpes} de medidas ${paradelante.medidasParagolpesDelantero} mm.`
          : `${accion} de paragolpes delantero fabricado en acero de forma artesanal de medidas ${paradelante.medidasParagolpesDelantero} mm.`;

      const raw = `- ${fraseParagolpesDelantero}`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });

      (p as any)._rawText = raw;
      out.push(p);
    });
  }

  //
  // 9) PARAGOLPES TRASERO
  //
  const paratras = modificaciones.find(
    (m) => m.nombre === 'PARAGOLPES TRASERO' && m.seleccionado,
  );
  if (paratras) {
    paratras.acciones?.forEach((accion: string) => {
      const fraseParagolpesTrasero =
        paratras.tipoFabricacionParagolpesTrasero === 'comercial'
          ? `${accion} de paragolpes trasero marca ${paratras.marcaParagolpesTrasero}, referencia ${paratras.referenciaParagolpesTrasero} de medidas ${paratras.medidasParagolpesTrasero} mm.`
          : `${accion} de paragolpes trasero fabricado en acero de forma artesanal de medidas ${paratras.medidasParagolpesTrasero} mm.`;

      const raw = `- ${fraseParagolpesTrasero}`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });

      (p as any)._rawText = raw;
      out.push(p);
    });
  }

  const volante = modificaciones.find(
    (m) => m.nombre === 'SUSTITUCIÓN DE VOLANTE' && m.seleccionado,
  );
  if (volante) {
    let espaciador = '';
    let airbagoriginal = 'El volante original del vehículo no llevaba airbag';
    let airbagnuevo = 'el nuevo instalado no lleva airbag';
    if (volante.llevaEspaciador) {
      espaciador = `marca ${volante.marcaEspaciador} de espesor ${volante.espesorEspaciador}mm`;
    }
    if (volante.tieneAirbagOriginal) {
      airbagoriginal = `El volante
original del vehículo llevaba airbag`;
    }
    if (volante.tieneAirbagNuevo) {
      airbagnuevo = `el nuevo instalado lleva airbag`;
    }
    const fraseVolante = `Sustitución del volante original, por otro de la marca ${volante.marcaEspaciador} con un diámetro de ${volante.marcaEspaciador}
mm montado sobre un espaciador ${espaciador}. ${airbagoriginal}, ${airbagnuevo}. Se garantiza que
el antirrobo e inmovilizador siguen funcionando tras el cambio de volante.`;

    const raw = `- ${fraseVolante}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const escape = modificaciones.find(
    (m) => m.nombre === 'SUSTITUCIÓN DE SISTEMA DE ESCAPE' && m.seleccionado,
  );

  let fraseEscape = '';

  if (escape) {
    const baseEscape = `Sustitución del silencioso final de escape, por otro de la marca ${escape.marcaEscape} con referencia ${escape.referenciaEscape} y contraseña de homologación ${escape.contrasenaHomologacionEscape}`;

    if (escape.cambiaSoloSilencioso) {
      fraseEscape = `${baseEscape}, modificando el tramo de salida y cambiando su configuración de salida original compuesta por ${escape.tipoSalidaOriginalEscape} en ${escape.ubicacionOriginalEscape}, a ${escape.tipoSalidaNuevaEscape} ${escape.ubicacionNuevaEscape}. Esta reforma no supone modificación de potencia del vehículo.`;
    } else {
      let infoGeometria =
        ', sin variar el número de salidas ni la ubicación original del mismo';

      if (escape.cambiaNumeroSalidas && !escape.cambiaUbicacion) {
        infoGeometria = `, modificando el número de salidas a ${escape.numeroSalidasEscape} y manteniendo la ubicación original`;
      } else if (!escape.cambiaNumeroSalidas && escape.cambiaUbicacion) {
        infoGeometria = `, manteniendo el número de salidas original y modificando la ubicación a ${escape.descripcionUbicacionEscape}`;
      } else if (escape.cambiaNumeroSalidas && escape.cambiaUbicacion) {
        infoGeometria = `, modificando el número de salidas a ${escape.numeroSalidasEscape} y la ubicación a ${escape.descripcionUbicacionEscape}`;
      }

      fraseEscape = `${baseEscape}${infoGeometria}.`;
    }
    const raw = `- ${fraseEscape}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const discos = modificaciones.find(
    (m) => m.nombre === 'SUSTITUCIÓN DE DISCOS DE FRENO' && m.seleccionado,
  );

  if (discos) {
    // Función auxiliar para construir la frase patrón
    const generarFrase = (
      eje: string,
      marca: string,
      modelo: string,
      ref: string,
      diam: number,
      espesor: number,
    ) => {
      const txtModelo = modelo ? ` modelo ${modelo}` : '';
      const textoPinzas = discos.modificaPinzasDiscos
        ? `, incluyendo también la modificación de las pinzas de freno del ${eje}.`
        : ' y no modificando ningún otro componente del sistema de frenado.';
      return `Sustitución de discos de freno en el ${eje} marca ${marca}${txtModelo} con referencia ${ref} de ${diam} mm de diámetro y ${espesor} mm de espesor, igual que los que incorpora el vehículo de origen${textoPinzas}`;
    };

    const parrafosDiscos: string[] = [];

    // Lógica según ubicación
    if (discos.ubicacionDiscos === 'delanteros') {
      // Caso 1: Solo delanteros
      parrafosDiscos.push(
        generarFrase(
          'eje delantero',
          discos.marcaDiscos ?? '',
          discos.modeloDiscos ?? '',
          discos.referenciaDiscos ?? '',
          discos.diametroDiscos ?? 0,
          discos.espesorDiscos ?? 0,
        ),
      );
    } else if (discos.ubicacionDiscos === 'traseros') {
      // Caso 2: Solo traseros (usa los inputs generales)
      parrafosDiscos.push(
        generarFrase(
          'eje trasero',
          discos.marcaDiscos ?? '',
          discos.modeloDiscos ?? '',
          discos.referenciaDiscos ?? '',
          discos.diametroDiscos ?? 0,
          discos.espesorDiscos ?? 0,
        ),
      );
    } else if (discos.ubicacionDiscos === 'ambos') {
      if (discos.sonIguales) {
        // Caso 3: Ambos ejes idénticos
        parrafosDiscos.push(
          generarFrase(
            'eje delantero y trasero',
            discos.marcaDiscos ?? '',
            discos.modeloDiscos ?? '',
            discos.referenciaDiscos ?? '',
            discos.diametroDiscos ?? 0,
            discos.espesorDiscos ?? 0,
          ),
        );
      } else {
        // Caso 4: Ambos ejes diferentes (Generamos dos frases)
        // Frase Delantera
        parrafosDiscos.push(
          generarFrase(
            'eje delantero',
            discos.marcaDiscos ?? '',
            discos.modeloDiscos ?? '',
            discos.referenciaDiscos ?? '',
            discos.diametroDiscos ?? 0,
            discos.espesorDiscos ?? 0,
          ),
        );
        // Frase Trasera (Usa las variables específicas con sufijo 'Trasero')
        parrafosDiscos.push(
          generarFrase(
            'eje trasero',
            discos.marcaDiscoTrasero ?? '',
            discos.modeloDiscoTrasero ?? '',
            discos.referenciaDiscoTrasero ?? '',
            discos.diametroDiscoTrasero ?? 0,
            discos.espesorDiscoTrasero ?? 0,
          ),
        );
      }
    }

    // Generación de los párrafos en el documento
    parrafosDiscos.forEach((texto) => {
      const raw = `- ${texto}`;
      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
    });
  }

  //
  // 10) CABRESTANTE
  //
  const cabrestante = modificaciones.find(
    (m) => m.nombre === 'CABRESTANTE' && m.seleccionado,
  );
  if (cabrestante) {
    cabrestante.acciones?.forEach((accion: string) => {
      const raw = `- ${accion} de cabrestante en la parte delantera del vehículo con marca ${cabrestante.marcaCabrestante}, con carga vertical de ${cabrestante.capacidadCabrestanteLb} LB (${cabrestante.capacidadCabrestanteKg} Kg). Este dispositivo solamente puede funcionar en estacionario mediante relé.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });

      (p as any)._rawText = raw;
      out.push(p);
    });
  }

  //
  // 11) ANTIEMPOTRAMIENTO
  //
  const antiempotramiento = modificaciones.find(
    (m) => m.nombre === 'ANTIEMPOTRAMIENTO' && m.seleccionado,
  );
  if (antiempotramiento) {
    antiempotramiento.acciones?.forEach((accion: string) => {
      const raw = `- ${accion} de barra trasera de antiempotramiento, fabricada en acero de forma artesanal de medidas ${antiempotramiento.medidasAntiempotramiento} mm, ubicada bajo paragolpes posterior.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });

      (p as any)._rawText = raw;
      out.push(p);
    });
  }

  //
  // 12) SOPORTES PARA LUCES DE USO ESPECÍFICO
  //
  const soporteslucesespecificas = modificaciones.find(
    (m) =>
      m.nombre === 'SOPORTES PARA LUCES DE USO ESPECÍFICO' && m.seleccionado,
  );
  if (soporteslucesespecificas) {
    const lucesItems = resolveLucesEspecificasItems(soporteslucesespecificas);
    soporteslucesespecificas.acciones?.forEach((accion: string) => {
      lucesItems.forEach((item: any) => {
        const raw = `- ${accion} de soporte para luces de uso específico en condiciones reglamentarias ${item?.ubicacion ?? ''}, fabricado en acero de medidas ${item?.medidas ?? ''} mm.`;

        const p = new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        });

        (p as any)._rawText = raw;
        out.push(p);
      });
    });
  }

  //
  // 13) SOPORTE PARA RUEDA DE REPUESTO
  //
  const soportesruedarepuesto = modificaciones.find(
    (m) => m.nombre === 'SOPORTE PARA RUEDA DE REPUESTO' && m.seleccionado,
  );
  if (soportesruedarepuesto) {
    soportesruedarepuesto.acciones?.forEach((accion: string) => {
      const textoRueda =
        soportesruedarepuesto.tipoFabricacionRuedaRepuesto === 'comercial'
          ? `${accion} de soporte para rueda de repuesto marca ${soportesruedarepuesto.marcaRuedaRepuesto}, referencia ${soportesruedarepuesto.referenciaRuedaRepuesto} de medidas ${soportesruedarepuesto.medidasRuedaRepuesto} mm.`
          : `${accion} de soporte para rueda de repuesto fabricado en acero de forma artesanal de medidas ${soportesruedarepuesto.medidasRuedaRepuesto} mm.`;

      const raw = `- ${textoRueda}`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });

      (p as any)._rawText = raw;
      out.push(p);
    });
  }

  //
  // 15) TODA LA CASUÍSTICA DE MUELLES, BALLESTAS Y AMORTIGUADORES QUE SE PUEDEN DAR
  //
  mod = modificaciones.find(
    (m) =>
      m.nombre ===
        'TODA LA CASUÍSTICA DE MUELLES, BALLESTAS Y AMORTIGUADORES QUE SE PUEDEN DAR' &&
      m.seleccionado,
  )!;

  // 1) Muelles delanteros con referencia
  if (mod) {
    if (false && suspension) {
      const frasesBase = [
        `Instalación - Se instalan los elementos de la suspensión nombrados de características diferentes a los originales.`,
        `Desmontaje - Se desmontan los elementos de la suspensión que vienen de serie por otros de características diferentes a los originales.`,
        `Sustitución - Se sustituyen los elementos de la suspensión que vienen de serie por los siguientes:`,
      ];

      // Añadir las 3 frases previas siempre que exista cualquier casuística
      frasesBase.forEach((frase) => {
        const p = new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 250 },
          children: [new TextRun({ text: frase })],
        });
        (p as any)._rawText = frase;
        (p as any)._fromCasuistica = true;
        out.push(p);
      });
    }

    // Párrafo principal
    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 250 },
      children: [
        new TextRun({
          text: 'Sustituci\u00f3n - Se sustituyen los elementos de la suspensi\u00f3n que vienen de serie por los siguientes:',
        }),
      ],
    });
    (p as any)._rawText =
      'Sustituci\u00f3n - Se sustituyen los elementos de la suspensi\u00f3n que vienen de serie por los siguientes:';
    (p as any)._fromCasuistica = true; // 👈 marca
    (p as any)._omitFromProyectoApartados = true;
    out.push(p);

    const fraseFija = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 250 },
      children: [
        new TextRun({
          text: `Modificación del sistema de suspensión del vehículo instalando:`,
        }),
      ],
    });
    (p as any)._rawText = raw;
    (p as any)._fromCasuistica = true; // 👈 marca
    if (false) out.push(fraseFija);

    if (mod.detallesMuelles?.['muelleDelanteroConRef']) {
      raw = `- Muelles delanteros marca ${mod.marcaMuelleDelanteroConRef} referencia ${mod.referenciaMuelleDelanteroConRef}.`;

      // Párrafo principal
      const p = new Paragraph({
        spacing: { line: 260, before: 120, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      (p as any)._fromCasuistica = true; // 👈 marca
      out.push(p);

      const indentLeft = 620;
      const spacing = {};
    }

    // 2) Muelles delanteros sin referencia
    if (mod.detallesMuelles?.['muelleDelanteroSinRef']) {
      raw = `- Muelles delanteros marca ${mod.marcaMuelleDelanteroSinRef}, sin referencia de dimensiones:`;

      // Párrafo principal
      const p = new Paragraph({
        spacing: { line: 260, before: 120, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      (p as any)._fromCasuistica = true; // 👈 marca
      out.push(p);

      const indentLeft = 620;
      const spacing = {};

      // Subpárrafos (viñetas)
      const p1 = new Paragraph({
        indent: { left: indentLeft },
        spacing,
        children: [
          new TextRun(
            `• Diámetro exterior: ${mod.diametroExteriorDelanteroSinRef} mm`,
          ),
        ],
      });
      (p1 as any)._rawText =
        `• Diámetro exterior: ${mod.diametroExteriorDelanteroSinRef} mm`;
      (p1 as any)._fromCasuistica = true; // 👈 marca
      out.push(p1);

      const p2 = new Paragraph({
        indent: { left: indentLeft },
        spacing,
        children: [
          new TextRun(
            `• Longitud de muelle: ${mod.longitudLibreDelanteroSinRef} mm`,
          ),
        ],
      });
      (p2 as any)._rawText =
        `• Longitud de muelle: ${mod.longitudLibreDelanteroSinRef} mm`;
      (p2 as any)._fromCasuistica = true;
      out.push(p2);

      const p3 = new Paragraph({
        indent: { left: indentLeft },
        spacing,
        children: [
          new TextRun(
            `• Diámetro de la espira: ${mod.diametroEspiraDelanteroSinRef} mm`,
          ),
        ],
      });
      (p3 as any)._rawText =
        `• Diámetro de la espira: ${mod.diametroEspiraDelanteroSinRef} mm`;
      (p3 as any)._fromCasuistica = true;
      out.push(p3);

      const p4 = new Paragraph({
        indent: { left: indentLeft },
        spacing,
        children: [
          new TextRun(
            `• Número de espiras: ${mod.numeroEspirasDelanteroSinRef}.`,
          ),
        ],
      });
      (p4 as any)._rawText =
        `• Número de espiras: ${mod.numeroEspirasDelanteroSinRef}.`;
      (p4 as any)._fromCasuistica = true;
      out.push(p4);
    }

    // 2.1) Muelles traseros con referencia
    if (mod.detallesMuelles?.['muelleTraseroConRef']) {
      raw = `- Muelles traseros marca ${mod.marcaMuelleTraseroConRef} referencia ${mod.referenciaMuelleTraseroConRef}.`;

      // Párrafo principal
      const p = new Paragraph({
        spacing: { line: 260, before: 120, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      (p as any)._fromCasuistica = true; // 👈 marca
      out.push(p);

      const indentLeft = 620;
      const spacing = {};
    }

    // 3) Ballesta delantera
    if (mod.detallesMuelles?.['ballestaDelantera']) {
      raw = `- Ballesta delantera marca ${mod.marcaBallestaDelantera} referencia ${mod.referenciaBallestaDelantera}.`;

      pushCasuistica(
        out,
        new Paragraph({
          spacing: { line: 260, before: 120, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        }),
        raw,
      );
    }

    // 4) Amortiguador delantero
    if (mod.detallesMuelles?.['amortiguadorDelantero']) {
      raw = `- Amortiguadores delanteros marca ${mod.marcaAmortiguadorDelantero} referencia ${mod.referenciaAmortiguadorDelantero}.`;

      pushCasuistica(
        out,
        new Paragraph({
          spacing: { line: 260, before: 120, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        }),
        raw,
      );
    }

    // 5) Amortiguador trasero
    if (mod.detallesMuelles?.['amortiguadorTrasero']) {
      raw = `- Amortiguadores traseros marca ${mod.marcaAmortiguadorTrasero} referencia ${mod.referenciaAmortiguadorTrasero}.`;

      pushCasuistica(
        out,
        new Paragraph({
          spacing: { line: 260, before: 120, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        }),
        raw,
      );
    }

    // 6) Tacos de goma
    if (mod.detallesMuelles?.['tacosDeGoma']) {
      raw = `- Instalación de tacos de goma sobre amortiguadores delanteros de ${mod.diametroTacoDelantero} mm de diámetro y ${mod.espesorTacoDelantero} mm de espesor, y traseros de ${mod.diametroTacoTrasero} mm de diámetro y ${mod.espesorTacoTrasero} mm de espesor.`;

      pushCasuistica(
        out,
        new Paragraph({
          spacing: { line: 260, before: 120, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        }),
        raw,
      );
    }

    // 7) Kit de elevación (delantero, trasero o ambos)
    if (
      mod.detallesMuelles?.['kitElevacionDelantero'] ||
      mod.detallesMuelles?.['kitElevacionTrasero']
    ) {
      // 1) LÍNEA PRINCIPAL
      const diametroKitElevacionDelantero =
        mod.diametroTacoKitElevacionDelantero ?? mod.diametroTacoDelantero;
      const espesorKitElevacionDelantero =
        mod.espesorTacoKitElevacionDelantero ?? mod.espesorTacoDelantero;
      const diametroKitElevacionTrasero =
        mod.diametroTacoKitElevacionTrasero ?? mod.diametroTacoTrasero;
      const espesorKitElevacionTrasero =
        mod.espesorTacoKitElevacionTrasero ?? mod.espesorTacoTrasero;
      const partesEjes: string[] = [];
      const marcas: string[] = [];

      if (mod.detallesMuelles?.['kitElevacionDelantero']) {
        partesEjes.push('muelles delanteros');
        if (mod.marcaKitElevacionDelantera) {
          marcas.push(mod.marcaKitElevacionDelantera);
        }
      }
      if (mod.detallesMuelles?.['kitElevacionTrasero']) {
        partesEjes.push('ballestas traseras');
        if (mod.marcaKitElevacionTrasera) {
          marcas.push(mod.marcaKitElevacionTrasera);
        }
      }

      raw =
        `- Instalación de kit de elevación en ` +
        partesEjes.join(' y ') +
        `, fabricados en aluminio, compuestos por:`;

      pushCasuistica(
        out,
        new Paragraph({
          spacing: { line: 260, before: 120, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        }),
        raw,
      );

      // 2) DETALLE MUELLES DELANTEROS
      if (mod.detallesMuelles?.['kitElevacionDelantero']) {
        raw =
          `• Muelles delanteros: taco ${mod.tipoTacoDelantero} de aluminio de Ø ` +
          `${diametroKitElevacionDelantero} mm y ` +
          `${espesorKitElevacionDelantero} mm de espesor ` +
          `instalado en cada muelle delantero, marca ${mod.marcaKitElevacionDelantera}.`;

        pushCasuistica(
          out,
          new Paragraph({
            spacing: { line: 260, before: 120, after: 120 },
            indent: { left: 400 },
            children: [new TextRun({ text: raw })],
          }),
          raw,
        );
      }

      // 3) DETALLE BALLESTAS TRASERAS
      if (mod.detallesMuelles?.['kitElevacionTrasero']) {
        raw =
          `• Ballestas traseras: taco ${mod.tipoTacoTrasero} de aluminio ` +
          `${
            mod.tipoTacoTrasero === 'rectangular'
              ? 'de forma rectangular de medidas '
              : ''
          }` +
          `${diametroKitElevacionTrasero} x ${espesorKitElevacionTrasero} mm de espesor ` +
          `sobre ballesta trasera, marca ${mod.marcaKitElevacionTrasera}.`;

        pushCasuistica(
          out,
          new Paragraph({
            spacing: { line: 260, before: 120, after: 120 },
            indent: { left: 400 },
            children: [new TextRun({ text: raw })],
          }),
          raw,
        );
      }
    }

    // 8) Nota final
    if (mod.anotacion) {
      raw = `Estos dispositivos no modifican las condiciones técnicas de dirección. Se asegura la no interferencia entre los neumáticos y ningún punto de la carrocería.`;

      pushCasuistica(
        out,
        new Paragraph({
          spacing: { line: 260, before: 120, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        }),
        raw,
      );
    }
  }

  //
  // 16) MATRÍCULA Y PORTAMATRÍCULA
  //
  mod = modificaciones.find(
    (m) => m.nombre === 'MATRÍCULA Y PORTAMATRÍCULA' && m.seleccionado,
  )!;

  // 1) Instalación
  if (mod) {
    mod.acciones?.forEach((accion: string) => {
      let raw: string;

      if (mod.detalle?.instalacionPorta) {
        if (mod.fabricacionPorta1 === 'artesanal') {
          raw = `- ${accion} de portamatrículas ${mod.ubicacionPorta1} en el lado ${mod.ladoPorta1} fabricado en ${mod.materialPorta1} de forma artesanal.`;
        } else {
          raw = `- ${accion} de portamatrículas ${mod.ubicacionPorta1} en el lado ${mod.ladoPorta1} fabricado en ${mod.materialPorta1} de la marca ${mod.marcaPorta1} y referencia ${mod.referenciaPorta1}.`;
        }
        const p = new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        });

        (p as any)._rawText = raw;
        out.push(p);
      }
    });

    // 2) Reubicación
    if (mod.detalle?.reubicacionTrasera) {
      const nuevo = mod.paragolpesNuevo2 === true ? 'nuevo' : '';
      raw = `- Reubicación de la placa de matrícula ${mod.ubicacionPorta2} en el ${nuevo} portamatrículas ${mod.portamatr2}.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
    }

    // 3) Cambio de ubicación
    if (mod.detalle?.cambioUbicacionDelantera) {
      const nuevo = mod.paragolpesNuevo3 === true ? 'nuevo' : '';
      raw = `- Cambio de ubicación de placa de matrícula ${mod.ubicacionMat3} ${mod.materialMat3} de medidas ${mod.medidasMat3} mm en la parte ${mod.ubicacionBumper3} del ${nuevo} paragolpes.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
    }
  }

  //
  // 17) DEFENSA DELANTERA
  //
  const defensadelantera = modificaciones.find(
    (m) => m.nombre === 'DEFENSA DELANTERA' && m.seleccionado,
  );
  if (defensadelantera) {
    const accionesDefensa =
      Array.isArray(defensadelantera.acciones) &&
      defensadelantera.acciones.length > 0
        ? defensadelantera.acciones
        : ['Instalación'];

    accionesDefensa.forEach((accion: string) => {
      const raw =
        `- ${accion} de defensa integral delantera ${defensadelantera.marcaDefensa}` +
        (defensadelantera.modeloDefensa
          ? ` modelo ${defensadelantera.modeloDefensa}`
          : '') +
        `, fabricada con tubo de ${defensadelantera.grosorTuboDefensa} mm de acero inoxidable de dimensiones ${defensadelantera.medidasDefensa} mm.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });

      (p as any)._rawText = raw;
      out.push(p);
    });
  }

  //
  // 18) AMORTIGUADOR DE DIRECCIÓN
  //
  const amortiguadoresdireccion = modificaciones.find(
    (m) => m.nombre === 'AMORTIGUADOR DE DIRECCIÓN' && m.seleccionado,
  );
  if (amortiguadoresdireccion) {
    raw =
      `- Sustitución del amortiguador de dirección original por otro marca ${amortiguadoresdireccion.marcaAmortiguador}` +
      (amortiguadoresdireccion.referenciaAmortiguador
        ? ` referencia ${amortiguadoresdireccion.referenciaAmortiguador}`
        : '') +
      `, instalado en anclajes originales.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 19) BARRA DE DIRECCIÓN
  //
  const barradireeccion = modificaciones.find(
    (m) => m.nombre === 'BARRA DE DIRECCIÓN' && m.seleccionado,
  );
  if (barradireeccion) {
    if (Array.isArray(barradireeccion.acciones)) {
      barradireeccion.acciones.forEach((accion: string) => {
        const raw =
          `- ${accion} de barra de dirección reforzada, marca ${barradireeccion.marcaBarraDireccion}. ` +
          `Esta barra es una sustitución de la original, está anclada sobre anclajes originales, ` +
          `tiene un diámetro superior al de origen y es de material más resistente.`;

        const p = new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        });

        (p as any)._rawText = raw;
        out.push(p);
      });
    }
  }

  //
  // 20) BARRA PARA REGULAR LA CONVERGENCIA DE LAS RUEDAS (alineamiento)
  //
  const barraalineamiento = modificaciones.find(
    (m) =>
      m.nombre ===
        'BARRA PARA REGULAR LA CONVERGENCIA DE LAS RUEDAS (alineamiento)' &&
      m.seleccionado,
  );
  if (barraalineamiento) {
    if (Array.isArray(barraalineamiento.acciones)) {
      barraalineamiento.acciones.forEach((accion: string) => {
        const raw = `- ${accion} de barra para regular la convergencia de ambas ruedas delanteras al mismo valor regulable y reforzada, marca ${barraalineamiento.marcaConvergencia}. Esta barra es una sustitución de la original, está anclada sobre anclajes originales, tiene un diámetro superior a la de origen, es de material más resistente.`;

        const p = new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        });

        (p as any)._rawText = raw;
        out.push(p);
      });
    }
  }

  //
  // 21) BARRA PARA REGULAR LA CONVERGENCIA DE LAS RUEDAS (movimiento lateral)
  //
  const barramovimientolateral = modificaciones.find(
    (m) =>
      m.nombre ===
        'BARRA PARA REGULAR LA CONVERGENCIA DE LAS RUEDAS (alineamiento)' &&
      m.seleccionado,
  );
  if (barramovimientolateral) {
    if (Array.isArray(barramovimientolateral.acciones)) {
      const regulable =
        barramovimientolateral.regulable === true
          ? 'regulable'
          : 'no regulable';

      barramovimientolateral.acciones.forEach((accion: string) => {
        const raw = `- ${accion} de barra de Panhard ${regulable} marca ${barramovimientolateral.marcaConvergenciaReg} referencia ${barramovimientolateral.referenciaConvergenciaReg}. Esta barra es una sustitución de la original, está anclada sobre anclajes originales, tiene un diámetro superior a la de origen, es de material más resistente.`;

        const p = new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        });

        (p as any)._rawText = raw;
        out.push(p);
      });
    }
  }

  //
  // 22) FAROS DELANTEROS PRINCIPALES
  //
  const farosdelanterosprincipales = modificaciones.find(
    (m) => m.nombre === 'FAROS DELANTEROS PRINCIPALES' && m.seleccionado,
  );
  if (farosdelanterosprincipales) {
    const led =
      farosdelanterosprincipales.esLed === true ? 'LED' : 'tradicional';
    raw = `- Sustitución de los faros delanteros sin cambiar la posición original ni anclajes originales por otros con sistema ${led} de la marca ${farosdelanterosprincipales.marca}. Contraseña de homologación nº ${farosdelanterosprincipales.homologacion} y marcado ${farosdelanterosprincipales.marcadoCruce} (luz cruce/carretera) ${farosdelanterosprincipales.marcadoPosicion} (luz de posición) con ${farosdelanterosprincipales.pdlFaro}pdl/ud. Estos dispositivos se encienden desde los mandos originales. La luz de posición y cruce quedan desactivadas.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },

      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 23) LUZ DE CRUCE
  //
  const luzdecruce = modificaciones.find(
    (m) => m.nombre === 'LUZ DE CRUCE' && m.seleccionado,
  );
  if (luzdecruce) {
    const carretera =
      luzdecruce.carreteraDesactivada === true
        ? ' La función de luz de carretera queda desactivada. '
        : '';
    raw = `- Sustitución de luz de cruce por otra con marcaje ${luzdecruce.marcaje} y contraseña de homologación ${luzdecruce.homologacion} con ${luzdecruce.pdlFaroCruce}pdl/ud, accionada desde los mandos originales.${carretera}.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },

      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 24) LUCES DE LARGO ALCANCE
  //
  const luzdelargo = modificaciones.find(
    (m) => m.nombre === 'LUCES DE LARGO ALCANCE' && m.seleccionado,
  );
  if (luzdelargo) {
    if (Array.isArray(luzdelargo.acciones)) {
      luzdelargo.acciones.forEach((accion: string) => {
        const raw = `- ${accion} de luces de largo alcance marca ${luzdelargo.marca} ref. ${luzdelargo.referencia} con marcaje ${luzdelargo.marcaje} y contraseña de homologación ${luzdelargo.homologacion}, índice de referencia ${luzdelargo.indiceReferencia} pdl/ud sin superar los 100 puntos de luz ni 430000 candelas, conectados al mando original.`;

        const p = new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        });

        (p as any)._rawText = raw;
        out.push(p);
      });
    }
  }

  const aleron = modificaciones.find(
    (m) => m.nombre === 'ALERÓN' && m.seleccionado,
  );

  if (aleron) {
    const raw = `- Instalación de alerón ${aleron.ubicacionAleron}, fabricado en ${aleron.materialAleron}, de la marca ${aleron.marcaAleron}, con referencia ${aleron.referenciaAleron} y medidas ${aleron.medidasAleron}.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const lipDelantero = modificaciones.find(
    (m) => m.nombre === 'LIP DELANTERO' && m.seleccionado,
  );

  if (lipDelantero) {
    let raw = '';

    if (lipDelantero.tipoFabricacionLip === 'artesanal') {
      raw = `- Instalación de lip delantero fabricado en ${lipDelantero.materialLipDelantero} de forma artesanal, de medidas ${lipDelantero.medidasLipDelantero}.`;
    } else if (lipDelantero.tipoFabricacionLip === 'marca') {
      raw = `- Instalación de lip delantero de la marca ${lipDelantero.marcaLipDelantero}, con referencia ${lipDelantero.referenciaLipDelantero} y medidas ${lipDelantero.medidasLipDelantero}.`;
    }

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const asientos = modificaciones.find(
    (m) => m.nombre === 'CAMBIO DE ASIENTOS' && m.seleccionado,
  );

  if (asientos) {
    let ubicacionTexto = '';
    let referenciasTexto = '';

    // 1. Definir texto de ubicación y referencias según selección
    if (asientos.ubicacionAsientos === 'delanteros') {
      ubicacionTexto = 'delanteros';
      referenciasTexto = `La referencia de los asientos es ${asientos.refAsientoConductor} (piloto) y ${asientos.refAsientoCopiloto} (copiloto).`;
    } else if (asientos.ubicacionAsientos === 'traseros') {
      ubicacionTexto = 'traseros';
      referenciasTexto = `La referencia de los asientos es ${asientos.refAsientosTraseros}.`;
    } else if (asientos.ubicacionAsientos === 'ambos') {
      ubicacionTexto = 'delanteros y traseros';
      referenciasTexto = `La referencia de los asientos delanteros es ${asientos.refAsientoConductor} (piloto) y ${asientos.refAsientoCopiloto} (copiloto), y la de los traseros es ${asientos.refAsientosTraseros}.`;
    }

    const raw = `- Sustitución de los asientos ${ubicacionTexto} originales por otros procedentes del vehículo ${asientos.procedenciaAsientos}, del año ${asientos.anoProcedenciaAsientos} con el mismo chasis e instalados en anclajes originales, sin afectar al correcto funcionamiento de los airbags. Se mantienen los cinturones de seguridad originales. ${referenciasTexto}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const barras = modificaciones.find(
    (m) => m.nombre === 'BARRAS ANTIVUELCO' && m.seleccionado,
  );

  if (barras) {
    const raw = `- Instalación de barras antivuelco ${barras.ubicacionBarras} marca ${barras.marcaBarras} modelo ${barras.modeloBarras}, fabricadas en tubo de ${barras.materialBarras} de ${barras.diametroTuboBarras}mm y dimensiones ${barras.medidasBarras}.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const techoSolar = modificaciones.find(
    (m) => m.nombre === 'TECHO SOLAR' && m.seleccionado,
  );

  if (techoSolar) {
    const raw = `- Instalación de placa solar monocristalina sobre el techo del vehículo, de la marca ${techoSolar.marcaTecho} modelo ${techoSolar.modeloTecho}, de ${techoSolar.potenciaTecho} y dimensiones ${techoSolar.medidasTecho} mm, sin afectar a la estructura.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const peldanos = modificaciones.find(
    (m) => m.nombre === 'PELDAÑOS' && m.seleccionado,
  );

  if (peldanos) {
    const usaMarcaReferencia = peldanos.tipoFabricacionPeldanos !== 'artesanal';
    const referenciaTexto =
      usaMarcaReferencia && peldanos.referenciaPeldanos
        ? `, referencia ${peldanos.referenciaPeldanos}`
        : '';
    const descripcionFabricacion = usaMarcaReferencia
      ? `de la marca ${peldanos.marcaPeldano}${referenciaTexto}`
      : 'de fabricación artesanal';
    const metodoActuacion = (peldanos.metodoActuacionPeldanos || '')
      .toString()
      .trim()
      .toLowerCase();
    const metodoTexto =
      metodoActuacion === 'electrico'
        ? ' de actuación eléctrica'
        : metodoActuacion === 'manual'
          ? ' de actuación manual'
          : '';
    const ubicacionAccionamiento =
      typeof peldanos.ubicacionAccionamientoPeldanos === 'string' &&
      peldanos.ubicacionAccionamientoPeldanos.trim()
        ? peldanos.ubicacionAccionamientoPeldanos.trim()
        : 'junto a la puerta trasera';
    const notaMetodoElectrico =
      metodoActuacion === 'electrico'
        ? ` Este componente se acciona en parado mediante botón instalado en el interior del vehículo, ${ubicacionAccionamiento}.`
        : '';
    const raw = `- Instalación de peldaño en ${peldanos.zonaPeldano}, ${descripcionFabricacion}, fabricado en ${peldanos.materialPeldano}, de medidas ${peldanos.medidasPeldano}mm${metodoTexto}.${notaMetodoElectrico}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const ventanaAbatible = modificaciones.find(
    (m) => m.nombre === 'VENTANA ABATIBLE' && m.seleccionado,
  );

  if (ventanaAbatible) {
    let ubicacionTexto = '';

    // Ajustamos el texto gramaticalmente según la selección
    if (ventanaAbatible.ladoVentana === 'izquierdo') {
      ubicacionTexto = 'en el lateral izquierdo';
    } else if (ventanaAbatible.ladoVentana === 'derecho') {
      ubicacionTexto = 'en el lateral derecho';
    } else if (ventanaAbatible.ladoVentana === 'trasero') {
      ubicacionTexto = 'en el portón trasero';
    } else if (ventanaAbatible.ladoVentana === 'ambos') {
      ubicacionTexto = 'en ambos laterales';
    }

    let material = '';
    if (ventanaAbatible.material) {
      `, fabricada en ${ventanaAbatible.materialVentana}`;
    }

    const incluirHomologacion =
      !!ventanaAbatible.incluirHomologacionVentanaAbatible;
    const homologacionTexto =
      incluirHomologacion && ventanaAbatible.homologacionVentanaAbatible
        ? ` y contraseña de homologación ${ventanaAbatible.homologacionVentanaAbatible}`
        : '';
    const raw = `- Instalación de ventana trasera abatible ${ubicacionTexto}, de la marca ${ventanaAbatible.marcaVentana}${material}, de dimensiones ${ventanaAbatible.medidasVentana}mm${homologacionTexto}.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const bodyLift = modificaciones.find(
    (m) => m.nombre === 'BODY LIFT' && m.seleccionado,
  );

  if (bodyLift) {
    let origenTexto = '';

    if (bodyLift.tipoFabricacionBodyLift === 'artesanal') {
      origenTexto = 'fabricados de forma artesanal';
    } else if (bodyLift.tipoFabricacionBodyLift === 'marca') {
      origenTexto = `de la marca ${bodyLift.marcaBodyLift} con referencia ${bodyLift.referenciaBodyLift}`;
    }

    const raw = `- Instalación de ${bodyLift.cantidadTacosBodyLift} tacos de ${bodyLift.materialBodyLift} ${origenTexto} ubicados entre el chasis y la carrocería, de ${bodyLift.diametroBodyLift}mm de diámetro y ${bodyLift.alturaBodyLift}mm de espesor.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const motor = modificaciones.find(
    (m) => m.nombre === 'MOTOR' && m.seleccionado,
  );

  if (motor) {
    const introRaw = `- Sustitución del motor original por otro usado, procedente de vehículo marca ${motor.marcaVehiculoDonanteMotor}, modelo ${motor.modeloVehiculoDonanteMotor}, con las siguientes características:`;

    const pIntro = new Paragraph({
      spacing: { line: 260, after: 0 },
      indent: { left: 400 },
      children: [new TextRun({ text: introRaw })],
    });
    (pIntro as any)._rawText = introRaw;
    out.push(pIntro);

    const caracteristicas = [
      `Motor: Marca: ${motor.marcaMotor}`,
      `Tipo: ${motor.tipoMotor}`,
      `Nº Cilindros/Cilindrada: ${motor.numCilindrosMotor}/${motor.cilindradaMotor}`,
      `Potencia Fiscal/Real (C.V.F./kW): ${motor.potenciaFiscalMotor}/${motor.potenciaRealMotor}`,
    ];

    caracteristicas.forEach((item) => {
      const itemRaw = `o   ${item}`;
      const pItem = new Paragraph({
        spacing: { line: 260, after: 0 },
        indent: { left: 1200 },
        children: [new TextRun({ text: itemRaw })],
      });
      (pItem as any)._rawText = itemRaw;
      out.push(pItem);
    });

    const taraRaw = `Tara= ${motor.nuevaTaraMotor} kg.`;
    const pTara = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: taraRaw })],
    });
    (pTara as any)._rawText = taraRaw;
    out.push(pTara);
  }

  const chasis = modificaciones.find(
    (m) => m.nombre === 'MODIFICACION DE CHASIS' && m.seleccionado,
  );

  if (chasis) {
    const raw = `- Modificación de ${chasis.ubicacionChasis} ${chasis.descripcionOperacionChasis} con ${chasis.elementoUnionChasis} de ${chasis.medidasChasis}, fabricado en ${chasis.materialChasis}.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 25) LUZ DE POSICIÓN
  //
  const luzdeposicion = modificaciones.find(
    (m) => m.nombre === 'LUZ DE POSICIÓN' && m.seleccionado,
  );
  if (luzdeposicion) {
    if (Array.isArray(luzdeposicion?.acciones)) {
      const esLed = luzdeposicion?.esLedPosicion ? 'LED' : 'tradicional';

      luzdeposicion.acciones.forEach((accion: string) => {
        const raw = `- ${accion} de luz de posición con sistema ${esLed} marca ${luzdeposicion.marcaPosicion} con marcaje ${luzdeposicion.marcajePosicion} y contraseña de homologación ${luzdeposicion.homologacionPosicion}, accionada desde los mandos originales.`;

        const p = new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        });

        (p as any)._rawText = raw;
        out.push(p);
      });
    }
  }

  //
  // 26) 3ª LUZ DE FRENO
  //
  const luz3defreno = modificaciones.find(
    (m) => m.nombre === '3ª LUZ DE FRENO' && m.seleccionado,
  );
  if (luz3defreno) {
    raw = `- Sustitución de la tercera luz de freno por otra marca ${luz3defreno.marca3Freno} con marcaje ${luz3defreno.marcaje3Freno} y homologación ${luz3defreno.homologacion3Freno}, situado ${luz3defreno.situado3Freno} y accionada desde los mandos originales.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },

      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 27) DIURNAS
  //
  const luzdiurna = modificaciones.find(
    (m) => m.nombre === 'DIURNAS' && m.seleccionado,
  );
  if (luzdiurna) {
    let led = '';
    if (luzdiurna.esLed) {
      led = 'led';
    }
    if (Array.isArray(luzdiurna?.acciones)) {
      luzdiurna.acciones.forEach((accion: string) => {
        const raw = `- ${accion} de luces diurnas ${led} marca ${luzdiurna.marcaDiurnas} con contraseña de homologación ${luzdiurna.homologacionDiurnas}.`;

        const p = new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        });

        (p as any)._rawText = raw;
        out.push(p);
      });
    }
  }

  const protectores = modificaciones.find(
    (m) => m.nombre === 'PROTECTORES PARAGOLPES' && m.seleccionado,
  );

  if (protectores) {
    // Determinamos el texto de la ubicación
    const ubicacionTexto =
      protectores.ubicacionPROTECTORES === 'delantero'
        ? 'delantero'
        : 'trasero';

    // Construimos la frase
    const fraseProtectores = `Instalación de protectores sobre paragolpes ${ubicacionTexto}, fabricados en ${protectores.materialProtectorPROTECTORES}, de medidas ${protectores.medidaLargoPROTECTORES} x ${protectores.medidaAltoPROTECTORES} mm.`;

    const raw = `- ${fraseProtectores}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const plancha = modificaciones.find(
    (m) => m.nombre === 'PLANCHA CAPÓ' && m.seleccionado,
  );

  if (plancha) {
    const frasePlancha = `Instalación de plancha de ${plancha.materialPlancha} en ${plancha.ubicacionPlancha}, de medidas ${plancha.medidaLargoPLANCHA} x ${plancha.medidaAnchoPLANCHA} mm.`;

    const raw = `- ${frasePlancha}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const calandra = modificaciones.find(
    (m) => m.nombre === 'CALANDRA' && m.seleccionado,
  );

  if (calandra) {
    const fraseCalandra = `Sustitución de calandra por otra de la marca ${calandra.marcaCalandra}, referencia ${calandra.referenciaCalandra}, fabricada en ${calandra.materialCalandra} de medidas ${calandra.medidaLargoCALANDRA} x ${calandra.medidaAltoCALANDRA}mm.`;

    const raw = `- ${fraseCalandra}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const intercooler = modificaciones.find(
    (m) => m.nombre === 'INTERCOOLER' && m.seleccionado,
  );

  if (intercooler) {
    // Lógica para la sujeción
    const textoSujecion = intercooler.usAnclajesOriginalesINTERCOOLER
      ? 'sujeto sobre los anclajes originales'
      : `sujeto mediante ${intercooler.descSoportesINTERCOOLER}`;

    // Construimos la frase completa
    const fraseIntercooler = `Sustitución de intercooler original, por otro de la marca ${intercooler.marcaIntercooler}, con referencia ${intercooler.refIntercooler}, de dimensiones ${intercooler.medidaLargoINTERCOOLER} x ${intercooler.medidaAltoINTERCOOLER} x ${intercooler.medidaEspesorINTERCOOLER}mm y ${textoSujecion}. Se garantiza que el nuevo intercooler dispone de una sección de paso igual o superior al original.`;

    const raw = `- ${fraseIntercooler}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const relojes = modificaciones.find(
    (m) => m.nombre === 'PANEL RELOJES' && m.seleccionado,
  );

  if (relojes) {
    const fraseRelojes = `Instalación de panel de relojes de control en ${relojes.ubicacionPanelRelojes}, de medidas ${relojes.medidaAnchoRelojes} x ${relojes.medidaAltoRelojes} mm, con ${relojes.numeroRelojes} relojes instalados, ${relojes.descripcionRelojes}. Se garantiza que el mencionado panel no interfiere en la visión del conductor durante la conducción, además, se garantiza la no interferencia en el normal funcionamiento de los sistemas de airbag y pretensores del vehículo después de la transformación.`;

    const raw = `- ${fraseRelojes}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const refuerzo = modificaciones.find(
    (m) => m.nombre === 'REFUERZO PARAGOLPES' && m.seleccionado,
  );

  if (refuerzo) {
    const { hasDelantero, hasTrasero } = getRefuerzoUbicaciones(
      refuerzo.ubicacionRefuerzo,
    );

    const pickFirst = (...values: any[]) =>
      values.find((v) => v !== undefined && v !== null && v !== '');

    const pushRefuerzoParagraph = (ubicacion: 'delantero' | 'trasero') => {
      const isDelantero = ubicacion === 'delantero';

      const material = pickFirst(
        isDelantero
          ? refuerzo.materialRefuerzoDelantero
          : refuerzo.materialRefuerzoTrasero,
        refuerzo.materialRefuerzo,
      );
      const marca = pickFirst(
        isDelantero
          ? refuerzo.marcaRefuerzoDelantero
          : refuerzo.marcaRefuerzoTrasero,
        refuerzo.marcaRefuerzo,
      );
      const referencia = pickFirst(
        isDelantero
          ? refuerzo.referenciaRefuerzoDelantero
          : refuerzo.referenciaRefuerzoTrasero,
        refuerzo.referenciaRefuerzo,
      );
      const largo = pickFirst(
        isDelantero
          ? refuerzo.largoRefuerzoDelantero
          : refuerzo.largoRefuerzoTrasero,
        refuerzo.largoRefuerzo,
      );
      const alto = pickFirst(
        isDelantero
          ? refuerzo.altoRefuerzoDelantero
          : refuerzo.altoRefuerzoTrasero,
        refuerzo.altoRefuerzo,
      );
      const fondo = pickFirst(
        isDelantero
          ? refuerzo.fondoRefuerzoDelantero
          : refuerzo.fondoRefuerzoTrasero,
        refuerzo.fondoRefuerzo,
      );

      const fraseRefuerzo = `Instalación de refuerzo de paragolpes ${ubicacion} fabricado en ${material}, de la marca ${marca} con referencia ${referencia} y medidas ${largo}x${alto}x${fondo}mm.`;
      const raw = `- ${fraseRefuerzo}`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });

      (p as any)._rawText = raw;
      out.push(p);
    };

    if (hasDelantero) {
      pushRefuerzoParagraph('delantero');
    }

    if (hasTrasero) {
      pushRefuerzoParagraph('trasero');
    }

    if (!hasDelantero && !hasTrasero) {
      const ubicacionRefuerzoTexto = resolveUbicacionRefuerzoTexto(
        refuerzo.ubicacionRefuerzo,
      );
      const fraseRefuerzo = `Instalación de refuerzo de paragolpes ${ubicacionRefuerzoTexto} fabricado en ${refuerzo.materialRefuerzo}, de la marca ${refuerzo.marcaRefuerzo} con referencia ${refuerzo.referenciaRefuerzo} y medidas ${refuerzo.largoRefuerzo}x${refuerzo.altoRefuerzo}x${refuerzo.fondoRefuerzo}mm.`;
      const raw = `- ${fraseRefuerzo}`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });

      (p as any)._rawText = raw;
      out.push(p);
    }
  }

  const difusor = modificaciones.find(
    (m) => m.nombre === 'DIFUSOR TRASERO' && m.seleccionado,
  );

  if (difusor) {
    const fraseDifusor = `Instalación de difusor trasero bajo el paragolpes, fabricado en ${difusor.materialDifusor}, de la marca ${difusor.marcaDifusor}, modelo ${difusor.modeloDifusor} de medidas ${difusor.largoDifusor}x${difusor.altoDifusor}mm.`;

    const raw = `- ${fraseDifusor}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const ventanaCoche = modificaciones.find(
    (m) => m.nombre === 'VENTANA LATERAL' && m.seleccionado,
  );

  if (ventanaCoche) {
    // Convertimos el valor del radio button ('izquierdo'/'derecho') en texto legible
    const ubicacionTexto =
      ventanaCoche.ubicacionVentana === 'izquierdo'
        ? 'el lateral izquierdo'
        : 'el lateral derecho';

    const fraseVentana = `Instalación de ventana trasera abatible en ${ubicacionTexto}, de la marca ${ventanaCoche.marcaVentana}, fabricada en ${ventanaCoche.materialVentana}, de dimensiones ${ventanaCoche.largoVentana} x ${ventanaCoche.altoVentana}mm.`;

    const raw = `- ${fraseVentana}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const disminucionMMA = modificaciones.find(
    (m) => m.nombre === 'REDUCCIÓN DE MMA' && m.seleccionado,
  );

  if (disminucionMMA) {
    const frasedisminucionMMA = `Disminución de la Masa Máxima Admisible MMA total del vehículo a ${data.mmaDespues}Kg`;

    const raw = `- ${frasedisminucionMMA}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const disminucionMMTA = modificaciones.find(
    (m) => m.nombre === 'REDUCCIÓN DE MMTA' && m.seleccionado,
  );

  if (disminucionMMTA) {
    const frasedisminucionMMTA = `Disminución de la Masa Máxima Técnicamente Admisible MMTA total del vehículo a ${data.mmaDespues}Kg.`;

    const raw = `- ${frasedisminucionMMTA}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 28) ANTINIEBLA
  //
  const luzantiniebla = modificaciones.find(
    (m) => m.nombre === 'ANTINIEBLA' && m.seleccionado,
  );

  if (luzantiniebla) {
    if (Array.isArray(luzantiniebla?.acciones)) {
      luzantiniebla.acciones.forEach((accion: string) => {
        // Creamos un array para guardar las frases que generaremos en esta vuelta del bucle
        const descripcionesAntiniebla: string[] = [];

        // 1. CASO DELANTEROS (Si es 'delanteros' o 'ambos')
        if (
          luzantiniebla.ubicacionAntiniebla === 'delanteros' ||
          luzantiniebla.ubicacionAntiniebla === 'ambos'
        ) {
          descripcionesAntiniebla.push(
            `delanteras marca ${luzantiniebla.marcaAntinieblaDel} con contraseña de homologación ${luzantiniebla.homologacionAntinieblaDel}, accionada desde los mandos originales`,
          );
        }

        // 2. CASO TRASEROS (Si es 'traseros' o 'ambos')
        if (
          luzantiniebla.ubicacionAntiniebla === 'traseros' ||
          luzantiniebla.ubicacionAntiniebla === 'ambos'
        ) {
          descripcionesAntiniebla.push(
            `traseras marca ${luzantiniebla.marcaAntinieblaTras} con contraseña de homologación ${luzantiniebla.homologacionAntinieblaTras}, accionada desde los mandos originales`,
          );
        }

        // 3. Renderizamos los párrafos
        // Si seleccionó "Ambos", esto generará dos líneas separadas (una para delantera, una para trasera)
        if (descripcionesAntiniebla.length === 0) return;

        const fraseAntiniebla = `${accion} de luces antiniebla ${descripcionesAntiniebla.join(
          ' y ',
        )}.`;

        const raw = `- ${fraseAntiniebla}`;

        const p = new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        });

        (p as any)._rawText = raw;
        out.push(p);
      });
    }
  }

  //
  // 29) PILOTO TRASERO
  //
  const luztrasero = modificaciones.find(
    (m) => m.nombre === 'PILOTO TRASERO' && m.seleccionado,
  );
  if (luztrasero) {
    mod = modificaciones.find(
      (m) => m.nombre === 'PILOTO TRASERO' && m.seleccionado,
    )!;
    // Línea principal
    raw = `- Sustitución de los pilotos traseros por otros marca ${mod.marcaPilotoTrasero} con los siguientes marcajes:`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },

      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);

    // Sub‐bullets
    if (mod.detalle?.luzPosicionFreno) {
      raw = `• Luz de posición y freno ${mod.referenciaLuzPosicionFreno}`;

      const p = new Paragraph({
        spacing: { line: 260, after: 60 },
        indent: { left: 620 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
    }
    if (mod.detalle?.intermitente) {
      raw = `• Intermitente ${mod.referenciaIntermitente}`;

      const p = new Paragraph({
        spacing: { line: 260, after: 60 },
        indent: { left: 620 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
    }
    if (mod.detalle?.catadioptrico) {
      raw = `• Catadióptrico ${mod.referenciaCatadioptrico}`;

      const p = new Paragraph({
        spacing: { line: 260, after: 60 },
        indent: { left: 620 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
    }
    if (mod.detalle?.luzMatricula) {
      const marca = mod.marcaluzMatricula || '';
      const referencia = mod.referencialuzMatricula || '';
      const homologacion = mod.homologacionluzMatricula || '';

      // Construimos la frase.
      // Nota: He incluido marca y referencia porque las pides en el HTML,
      // aunque en tu frase de ejemplo no aparecían explícitamente, son necesarias para identificar la pieza.
      const fraseMatricula = `Sustitución de luz de matrícula marca ${marca} con referencia ${referencia}, con sistema LED con marcaje L y contraseña de homologación ${homologacion}, accionada desde los mandos originales.`;

      const raw = `- ${fraseMatricula}`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });

      (p as any)._rawText = raw;
      out.push(p);
    }
  }

  const luzAtras = modificaciones.find(
    (m) => m.nombre === 'LUZ MARCHA ATRÁS' && m.seleccionado,
  );

  if (luzAtras) {
    // Gestión del accionamiento
    let textoAccionamiento = '';
    if (luzAtras.mandosOriginalesLuzMarchaAtras) {
      textoAccionamiento = 'accionada desde los mandos originales';
    } else {
      // Si es manual, asumimos que el usuario escribe algo como "mediante interruptor adicional..."
      // Ajustamos la gramática para que fluya
      textoAccionamiento = `accionada ${luzAtras.descripcionAccionamientoLuzMarchaAtras}`;
    }

    // Gestión de la referencia (opcional)
    const textoReferencia = luzAtras.referenciaLuzMarchaAtras
      ? ` con referencia ${luzAtras.referenciaLuzMarchaAtras}`
      : '';

    const fraseLuzAtras = `Sustitución de luz de marcha atrás con sistema ${luzAtras.tecnologiaLuzMarchaAtras} marca ${luzAtras.marcaLuzMarchaAtras}${textoReferencia} con marcaje ${luzAtras.marcajeLuzMarchaAtras} y contraseña de homologación ${luzAtras.contrasenaLuzMarchaAtras}, ${textoAccionamiento}.`;

    const raw = `- ${fraseLuzAtras}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 30) LUCES MATRÍCULA
  //
  const luzMatricula = modificaciones.find(
    (m) => m.nombre === 'LUCES MATRÍCULA' && m.seleccionado,
  );

  if (luzMatricula) {
    const raw = `- Sustitución de luz de matrícula marca ${
      luzMatricula.marcaLuz || ''
    } con referencia ${luzMatricula.referenciaLuz || ''}, con sistema ${
      luzMatricula.tecnologiaLuz || ''
    } con marcaje ${luzMatricula.marcajeLuz || ''} y contraseña de homologación ${
      luzMatricula.contrasenaHomologacion || ''
    }.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 31) INTERMITENTES
  //
  const intermitentes = modificaciones.find(
    (m) => m.nombre === 'INTERMITENTES' && m.seleccionado,
  );
  if (intermitentes) {
    const elementos = [
      {
        enabled: !!intermitentes.detalle?.interDelantero,
        posicion: 'delanteros',
        marcaje:
          intermitentes.marcajesintermitenteDelantero ||
          intermitentes.marcajeIntermitentes,
        homologacion:
          intermitentes.homologacionintermitenteDelantero ||
          intermitentes.homologacionIntermitentes,
        notaFinal: ' ',
      },
      {
        enabled: !!intermitentes.detalle?.interTrasero,
        posicion: 'traseros',
        marcaje:
          intermitentes.marcajesintermitenteTrasero ||
          intermitentes.marcajeIntermitentes,
        homologacion:
          intermitentes.homologacionintermitenteTrasero ||
          intermitentes.homologacionIntermitentes,
        notaFinal: '',
      },
      {
        enabled: !!intermitentes.detalle?.interLateral,
        posicion: 'laterales',
        marcaje:
          intermitentes.marcajesintermitenteLateral ||
          intermitentes.marcajeIntermitentes,
        homologacion:
          intermitentes.homologacionintermitenteLateral ||
          intermitentes.homologacionIntermitentes,
        notaFinal: '',
      },
    ].filter((elemento) => elemento.enabled);

    if (elementos.length === 0) {
      elementos.push({
        enabled: true,
        posicion: '',
        marcaje: intermitentes.marcajeIntermitentes,
        homologacion: intermitentes.homologacionIntermitentes,
        notaFinal: '',
      });
    }

    const acciones =
      Array.isArray(intermitentes.acciones) && intermitentes.acciones.length > 0
        ? intermitentes.acciones
        : ['Sustitución'];

    acciones.forEach((accion: string) => {
      elementos.forEach((elemento) => {
        const posicionTexto = elemento.posicion ? ` ${elemento.posicion}` : '';
        let texto = '';

        if (accion === 'Instalación') {
          texto = `- Instalación de intermitentes${posicionTexto} con marcaje ${
            elemento.marcaje || ''
          } y contraseña de homologación ${elemento.homologacion || ''}.${
            elemento.notaFinal
          }`;
        } else if (accion === 'Desmontaje') {
          texto = `- Desmontaje de los intermitentes${posicionTexto}.`;
        } else {
          texto = `- Sustitución de los intermitentes${posicionTexto} por otros con marcaje ${
            elemento.marcaje || ''
          } y contraseña de homologación ${elemento.homologacion || ''}.${
            elemento.notaFinal
          }`;
        }

        const p = new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: texto })],
        });
        (p as any)._rawText = texto;
        out.push(p);
      });
    });
  }

  //
  // 32) SUSTITUCIÓN DE EJES
  //
  const sustiejes = modificaciones.find(
    (m) => m.nombre === 'SUSTITUCIÓN DE EJES' && m.seleccionado,
  );
  if (sustiejes) {
    let raw = ' ';
    if (
      sustiejes.detalle?.sustitucionEjeDelantero &&
      sustiejes.detalle?.sustitucionEjeTrasero
    ) {
      raw = `- Sustitución de ambos ejes por otros procedentes de un vehículo marca ${sustiejes.marcaEje} denominación comercial ${sustiejes.denominacionEje}, con contraseña de homologación de tipo ${sustiejes.contrasenaHomologacionEje}.`;
    } else if (sustiejes.detalle?.sustitucionEjeTrasero) {
      raw = `- Sustitución del eje trasero por otro procedente de un vehículo marca ${sustiejes.marcaEje} denominación comercial ${sustiejes.denominacionEje}, con contraseña de homologación de tipo ${sustiejes.contrasenaHomologacionEje}.`;
    } else if (sustiejes.detalle?.sustitucionEjeDelantero) {
      raw = `- Sustitución del eje delantero por otro procedente de un vehículo marca ${sustiejes.marcaEje} denominación comercial ${sustiejes.denominacionEje}, con contraseña de homologación de tipo ${sustiejes.contrasenaHomologacionEje}.`;
    }

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 32) ESTRIBOS LATERALES O TALONERAS
  //
  const estribostaloneras = modificaciones.find(
    (m) => m.nombre === 'ESTRIBOS LATERALES O TALONERAS' && m.seleccionado,
  );
  if (estribostaloneras) {
    if (Array.isArray(estribostaloneras?.acciones)) {
      estribostaloneras.acciones.forEach((accion: string) => {
        const raw = `- ${accion} de ${estribostaloneras.detalle?.estribosotaloneras} laterales marca ${estribostaloneras.marcataloneras} fabricados en ${estribostaloneras.materialEstribos}, de dimensiones ${estribostaloneras.dimensionesTaloneras} mm.`;

        const p = new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        });

        (p as any)._rawText = raw;
        out.push(p);
      });
    }
    if (estribostaloneras.detalle?.anotacionAntideslizante === '1') {
      out.push(
        new Paragraph({
          spacing: { line: 260, after: 120 },
          children: [
            new TextRun({ text: 'NOTA: ', bold: true }),
            new TextRun({
              text: 'Se garantiza que las taloneras o estribos instalados disponen de una superficie antideslizante para evitar resbalones al subir o bajar del vehículo.',
            }),
          ],
        }) as any,
      );
    }
  }

  //
  // Apartado de Motos
  //

  //
  // 1) REDUCCIÓN MMA Y MMTA
  //
  const reduccion = modificaciones.find(
    (m) =>
      m.nombre === 'REDUCCIÓN MMA Y MMTA' &&
      m.seleccionado &&
      data.tipoVehiculo === 'moto',
  );
  if (reduccion) {
    raw = `- Reducción de MMTA en el eje delantero a ${reduccion.kgReduccionEjeDelantero}Kg, correspondiente a la MMTA del donante de la horquilla.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);

    raw = `- Reducción de la MMTA total a ${reduccion.kgReduccionTotal}Kg para no sobrecargar el eje delentero.`;

    const pp = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (pp as any)._rawText = raw;
    out.push(pp);
  }

  const soporte = modificaciones.find(
    (m) => m.nombre === 'SOPORTE MATRÍCULA' && m.seleccionado,
  );

  if (soporte) {
    const fraseSoporte = `Sustitución del soporte para matrícula por otro fabricado en ${soporte.materialSoporteMatricula}, de  forma artesanal de medidas ${soporte.medidaAnchoSoporteMatricula} x ${soporte.medidaAltoSoporteMatricula} mm.`;

    const raw = `- ${fraseSoporte}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const estriberas = modificaciones.find(
    (m) => m.nombre === 'ESTRIBERAS' && m.seleccionado,
  );

  if (estriberas) {
    let cumpleSalientesEstriberas = '';

    if (estriberas.cumpleSalientesEstriberas) {
      cumpleSalientesEstriberas =
        'Se garantiza que se cumple en todo caso con normativa de salientes exteriores.';
    }

    const fraseEstriberas = `Instalación de estriberas de la marca ${estriberas.marcaEstriberas}, con referencia ${estriberas.refSoporteEstriberas} para el soporte y con referencia ${estriberas.refPisanteEstriberas} para las estriberas. ${cumpleSalientesEstriberas}`;

    const raw = `- ${fraseEstriberas}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const deposito = modificaciones.find(
    (m) => m.nombre === 'SUSTITUCIÓN DE DEPÓSITO' && m.seleccionado,
  );

  if (deposito) {
    // Lógica de ubicación
    const ubicacionTexto = deposito.anclajesOriginalesDeposito
      ? 'ubicado sobre anclajes originales'
      : `ubicado ${deposito.descripcionUbicacionDeposito}`;

    const fraseDeposito = `Sustitución del depósito de combustible original por otro proveniente de la moto marca ${deposito.marcaDeposito} modelo ${deposito.modeloDeposito} con contraseña de homologación ${deposito.contrasenaDeposito}, con ${deposito.capacidadDeposito} litros de capacidad, ${ubicacionTexto}.`;

    const raw = `- ${fraseDeposito}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const bombaFreno = modificaciones.find(
    (m) => m.nombre === 'SUSTITUCIÓN DE BOMBA DE FRENO' && m.seleccionado,
  );

  if (bombaFreno) {
    // Función auxiliar para construir la frase patrón
    const generarFraseBomba = (
      ubicacion: string,
      marca: string,
      referencia: string,
    ) => {
      return `Sustitución de la bomba de freno ${ubicacion} original por otra de la marca ${marca}, con referencia ${referencia} con un diámetro y longitud del pistón igual al de la bomba de freno original. La luz de frenado sigue operativa para el freno ${ubicacion}.`;
    };

    const parrafosBomba: string[] = [];

    // Caso 1: Solo Delantera
    if (bombaFreno.ubicacionBombaFreno === 'delantera') {
      parrafosBomba.push(
        generarFraseBomba(
          'delantera',
          bombaFreno.marcaBombaFrenoDel ?? '',
          bombaFreno.referenciaBombaFrenoDel ?? '',
        ),
      );
    }
    // Caso 2: Solo Trasera
    else if (bombaFreno.ubicacionBombaFreno === 'trasera') {
      parrafosBomba.push(
        generarFraseBomba(
          'trasera',
          bombaFreno.marcaBombaFrenoTras ?? '',
          bombaFreno.referenciaBombaFrenoTras ?? '',
        ),
      );
    }
    // Caso 3: Ambas
    else if (bombaFreno.ubicacionBombaFreno === 'ambas') {
      // Generamos primero la delantera
      parrafosBomba.push(
        generarFraseBomba(
          'delantera',
          bombaFreno.marcaBombaFrenoDel ?? '',
          bombaFreno.referenciaBombaFrenoDel ?? '',
        ),
      );
      // Luego generamos la trasera
      parrafosBomba.push(
        generarFraseBomba(
          'trasera',
          bombaFreno.marcaBombaFrenoTras ?? '',
          bombaFreno.referenciaBombaFrenoTras ?? '',
        ),
      );
    }

    // Renderizado de los párrafos generados
    parrafosBomba.forEach((texto) => {
      const raw = `- ${texto}`;
      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
    });
  }

  const soportes = modificaciones.find(
    (m) => m.nombre === 'SOPORTES DESPLAZADOS' && m.seleccionado,
  );

  if (soportes) {
    let descripcionReubicacion = '';

    // Construimos la parte de reubicación dinámicamente
    if (
      soportes.reubicaFrenoSoportesDesplazados &&
      !soportes.reubicaCambioSoportesDesplazados
    ) {
      descripcionReubicacion =
        ', reubicando sobre el soporte del lateral derecho el pedal y la bomba de freno posterior';
    } else if (
      !soportes.reubicaFrenoSoportesDesplazados &&
      soportes.reubicaCambioSoportesDesplazados
    ) {
      descripcionReubicacion =
        ', reubicando sobre el soporte del lateral izquierdo la palanca de cambios';
    } else if (
      soportes.reubicaFrenoSoportesDesplazados &&
      soportes.reubicaCambioSoportesDesplazados
    ) {
      descripcionReubicacion =
        ', reubicando sobre el soporte del lateral derecho el pedal y la bomba de freno posterior y reubicando sobre el soporte del lateral izquierdo la palanca de cambios';
    }

    // Construimos la frase completa
    const fraseSoportes = `Instalación en ambos laterales de la motocicleta de soportes desplazados de la marca ${soportes.marcaSoportesDesplazados} referencia ${soportes.referenciaSoportesDesplazados}${descripcionReubicacion}. Estos soportes desplazados están equipados con un muelle que garantiza el retorno de los mismos a la posición original y la modificación no afecta a las características de frenado originales del vehículo.`;

    const raw = `- ${fraseSoportes}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const velocimetroMoto = modificaciones.find(
    (m) => m.nombre === 'VELOCÍMETRO' && m.seleccionado,
  );

  if (velocimetroMoto) {
    // Definimos si es solo sustitución o también reubicación
    const accion = velocimetroMoto.esReubicadoVelocimetro
      ? 'Sustitución y reubicación'
      : 'Sustitución';

    // Gestionamos las observaciones de los testigos (opcional)
    const textoObservaciones = velocimetroMoto.observacionesTestigosVelocimetro
      ? ` ${velocimetroMoto.observacionesTestigosVelocimetro}.`
      : '';

    // Gestionamos el texto del calibrado
    const textoCalibrado = velocimetroMoto.estaCalibradoVelocimetro
      ? ' Se ha procedido al calibrado del velocímetro para la motocicleta.'
      : '';

    // Gestionamos la velocidad máxima (si el usuario la ha introducido, aunque no estaba en el último HTML, es necesaria para la frase ejemplo)
    // Si no existe la variable en el modelo, puedes eliminar esta línea o añadir el campo al HTML.
    const textoVelocidad = data.velocidadMaxima
      ? ` La velocidad máxima de la motocicleta es de ${data.velocidadMaxima} Km/h.`
      : '';

    const fraseVelocimetro = `${accion} del velocímetro por otro ${velocimetroMoto.tipoVelocimetro} proveniente de una moto marca ${velocimetroMoto.marcaVelocimetro}, modelo ${velocimetroMoto.modeloVelocimetro}. Incorpora los testigos de ${velocimetroMoto.listaTestigosVelocimetro}.${textoObservaciones}${textoCalibrado}${textoVelocidad}`;

    const raw = `- ${fraseVelocimetro}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const subchasis = modificaciones.find(
    (m) => m.nombre === 'RECORTE SUBCHASIS' && m.seleccionado,
  );

  if (subchasis) {
    const fraseSubchasis = `Modificación del subchasis original ${subchasis.tipoModificacionSubchasis}, ${subchasis.descripcionCorteSubchasis}.`;

    const raw = `- ${fraseSubchasis}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const torretas = modificaciones.find(
    (m) => m.nombre === 'TORRETAS' && m.seleccionado,
  );

  if (torretas) {
    const fraseTorretas = `Sustitución de las torretas de manillar por otras de la marca ${torretas.marcaTorretas} de dimensiones ${torretas.medidaLargoTorretas}x${torretas.medidaAnchoTorretas}x${torretas.medidaAltoTorretas}mm.`;

    const raw = `- ${fraseTorretas}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const acelerador = modificaciones.find(
    (m) => m.nombre === 'MANDO ACELERADOR' && m.seleccionado,
  );

  if (acelerador) {
    // Texto de seguridad condicionado al check (aunque es obligatorio en el form)
    const textoRetorno = acelerador.retornoAutomaticoAcelerador
      ? ' Se comprobará que dispone de un retorno automático a la posición de reposo.'
      : '';

    const fraseAcelerador = `Sustitución del mando de acelerador por otro marca ${acelerador.marcaAcelerador} modelo ${acelerador.modeloAcelerador}.${textoRetorno}`;

    const raw = `- ${fraseAcelerador}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const mandos = modificaciones.find(
    (m) => m.nombre === 'MANDOS LUCES' && m.seleccionado,
  );

  if (mandos) {
    const fraseMandos = `Sustitución de el mando izquierdo y derecho (botoneras) por otros marca ${mandos.marcaMandoLuces}, modelo ${mandos.modeloMandoLuces}, incorporando ${mandos.funcionesIzquierdoMandoLuces} mando IZQUIERDO // ${mandos.funcionesDerechoMandoLuces}, mando DERECHO.`;

    const raw = `- ${fraseMandos}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const reduccionMoto = modificaciones.find(
    (m) => m.nombre === 'REDUCCIÓN DE PLAZAS MOTO' && m.seleccionado,
  );

  if (reduccionMoto) {
    // Frase base
    let fraseReduccion = `Reducción de plazas de asiento pasando de tener ${reduccionMoto.plazasAntesReduccion} a ${reduccionMoto.plazasDespuesReduccion}`;

    // Si el resultado es 1 plaza, añadimos las acciones mecánicas realizadas
    if (Number(reduccionMoto.plazasDespuesReduccion) === 1) {
      const acciones: string[] = [];

      if (reduccionMoto.desinstalacionAsideroReduccion) {
        acciones.push('del asidero');
      }

      if (reduccionMoto.desinstalacionEstriberasReduccion) {
        acciones.push('de las estriberas del pasajero');
      }

      if (acciones.length > 0) {
        // Unimos las acciones con " y " (ej: "del asidero y de las estriberas...")
        fraseReduccion += ` mediante la desinstalación ${acciones.join(' y ')}`;
      }
    }

    fraseReduccion += '.';

    const raw = `- ${fraseReduccion}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const asiento = modificaciones.find(
    (m) => m.nombre === 'ASIENTO' && m.seleccionado,
  );

  if (asiento) {
    let descripcionAsiento = '';

    if (asiento.tipoOrigenAsiento === 'artesanal') {
      descripcionAsiento = 'hecho de forma artesanal';
    } else {
      // Si es comercial, usamos la marca y referencia
      descripcionAsiento = `de la marca ${asiento.marcaAsiento} con referencia ${asiento.referenciaAsiento}`;
    }

    const fraseAsiento = `Sustitución del sillín original por otro ${descripcionAsiento}.`;

    const raw = `- ${fraseAsiento}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const basculante = modificaciones.find(
    (m) => m.nombre === 'SUSTITUCIÓN DE BASCULANTE' && m.seleccionado,
  );

  if (basculante) {
    // Texto base de la modificación
    let fraseBasculante = `Modificación del sistema de suspensión mediante la sustitución del basculante por otro procedente de una motocicleta marca ${basculante.marcaBasculante}, denominación comercial ${basculante.modeloBasculante}, con contraseña de homologación de tipo ${basculante.contrasenaBasculante}.`;

    // Lógica para añadir la nota opcional
    if (basculante.incluirNotaIntegridadBasculante) {
      fraseBasculante +=
        ' Nota: El chasis y subchasis son los mismos que montaba el vehículo de serie. Se asegura la integridad estructural del bastidor tras la reforma, debido a que la modificación del subchasis no disminuye su resistencia y el basculante instalado pertenece a una motocicleta de la misma marca que el vehículo objeto de la reforma y misma contraseña de homologación.';
    }

    const raw = `- ${fraseBasculante}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 2) LLANTAS Y NEUMÁTICOS
  //
  const llantas = modificaciones.find(
    (m) =>
      m.nombre === 'LLANTAS Y NEUMÁTICOS' &&
      m.seleccionado &&
      data.tipoVehiculo === 'moto',
  );

  if (llantas) {
    // 1. GENERACIÓN DEL TEXTO PRINCIPAL
    if (llantas.neumaticosMoto === 'delantero') {
      const raw = `- Instalación de neumático delantero por otro de medidas no equivalentes ${llantas.neumaticoDelantero} sobre llanta de medidas ${llantas.medidasLlantaDelantero}. Asegurando la compatibilidad entre llanta y neumático y la no interferencia entre el neumático y cualquier punto de la carrocería.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
    }

    if (llantas.neumaticosMoto === 'trasero') {
      const raw = `- Instalación de neumático trasero por otro de medidas no equivalentes ${llantas.neumaticoTrasero} sobre llanta de medidas ${llantas.medidasLlantaTrasero}. Asegurando la compatibilidad entre llanta y neumático y la no interferencia entre el neumático y cualquier punto de la carrocería.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
    }

    if (llantas.neumaticosMoto === 'delantero y trasero') {
      const raw = `- Instalación de neumáticos por otros de medidas no equivalentes: delantero ${llantas.neumaticoDelantero} sobre llanta de medidas ${llantas.medidasLlantaDelantero} y trasero ${llantas.neumaticoTrasero} sobre llanta de medidas ${llantas.medidasLlantaTrasero}. Asegurando la compatibilidad entre llanta y neumático y la no interferencia entre el neumático y cualquier punto de la carrocería.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
    }

    // 2. LÓGICA DE NOTAS (1 y 2)
    const totalNotas =
      (llantas.anotacion1 ? 1 : 0) + (llantas.anotacion2 ? 1 : 0);

    let notaCounter = 1;
    const getNotaLabel = () =>
      totalNotas > 1 ? `NOTA ${notaCounter++}: ` : `NOTA: `;

    if (llantas.anotacion1) {
      const label = getNotaLabel();
      out.push(
        new Paragraph({
          spacing: { line: 260, after: 120 },
          children: [
            new TextRun({
              text: label,
              bold: true,
            }),
            new TextRun({
              text: 'Debido a que la diferencia de diámetro entre el neumático original y el nuevo es superior al 8%, se ha procedido al tarado del velocímetro.',
            }),
          ],
        }),
      );
    }

    if (llantas.anotacion2) {
      const label = getNotaLabel();
      const vAntes = llantas.velocidadMaximaAntes || '---';
      const vDespues = llantas.velocidadMaximaDespues || '---';

      out.push(
        new Paragraph({
          spacing: { line: 260, after: 120 },
          children: [
            new TextRun({
              text: label,
              bold: true,
            }),
            new TextRun({
              text: `Debido a que por su construcción, este vehículo es capaz de alcanzar una velocidad máxima de Vmáx = ${vAntes} Km/h, superior al índice de velocidad de los neumáticos instalados, se deberá instalar una pegatina limitadora de velocidad de Vmáx = ${vDespues} Km/h, visible desde el puesto de conducción.`,
            }),
          ],
        }),
      );
    }

    // 3. ANOTACIÓN 3: JUSTIFICACIÓN DE CARGA (Sin etiqueta 'NOTA')
    if (llantas.anotacion3) {
      // Eje 1 (Delantero)
      if (
        llantas.neumaticosMoto === 'delantero' ||
        llantas.neumaticosMoto === 'delantero y trasero'
      ) {
        const indice = llantas.indiceCargaEje1Neumaticos || '---';
        const carga = llantas.cargaEquivalenteEje1Neumaticos || '---';
        const mma = llantas.mmaEje1Neumaticos || '---';

        const raw = `Se comprueba que el nuevo índice de carga del neumático delantero (${indice}, que equivale a ${carga} Kg) es capaz de soportar la MMA del 1er eje (${mma} Kg).`;

        const p = new Paragraph({
          spacing: { line: 260, after: 120 },
          children: [new TextRun({ text: raw })],
        });
        (p as any)._rawText = raw;
        out.push(p);
      }

      // Eje 2 (Trasero)
      if (
        llantas.neumaticosMoto === 'trasero' ||
        llantas.neumaticosMoto === 'delantero y trasero'
      ) {
        const indice = llantas.indiceCargaEje2Neumaticos || '---';
        const carga = llantas.cargaEquivalenteEje2Neumaticos || '---';
        const mma = llantas.mmaEje2Neumaticos || '---';

        const raw = `Se comprueba que el nuevo índice de carga del neumático trasero (${indice}, que equivale a ${carga} Kg) es capaz de soportar la MMA del 2º eje (${mma} Kg).`;

        const p = new Paragraph({
          spacing: { line: 260, after: 120 },
          children: [new TextRun({ text: raw })],
        });
        (p as any)._rawText = raw;
        out.push(p);
      }
    }
  }

  //
  // 3) SUSPENSIÓN
  //
  const suspensionmoto = modificaciones.find(
    (m) =>
      m.nombre === 'SUSPENSIÓN' &&
      m.seleccionado &&
      data.tipoVehiculo === 'moto',
  );
  if (suspensionmoto) {
    raw = `- Sustitución del sistema de suspensión instalando amortiguador trasero con botella regulable marca ${suspensionmoto.marca} referencia ${suspensionmoto.referencia}.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 4) SUSTITUCIÓN GUARDABARROS
  //
  const guarda = modificaciones.find(
    (m) =>
      m.nombre === 'SUSTITUCIÓN GUARDABARROS' &&
      m.seleccionado &&
      data.tipoVehiculo === 'moto',
  );
  if (guarda?.guardabarrosDelantero) {
    if (guarda.tipoFabricacionGuardabarrosDelantero === 'artesanal') {
      raw = `- Sustitución de guardabarros delantero por otro artesanal fabricado en acero de dimensiones ${guarda.dimensionesDelantero}mm.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
    }
    if (guarda.tipoFabricacionGuardabarrosDelantero === 'comercial') {
      raw = `- Sustitución del guardabarros delantero por otro fabricado en plástico marca ${guarda.marca}, referencia ${guarda.referenciaDelantero} de dimensiones a ${guarda.dimensionesDelantero}mm.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
    }

    if (guarda?.guardabarrosTrasero) {
      if (guarda.tipoFabricacionGuardabarrosTrasero === 'artesanal') {
        raw = `- Sustitución de guardabarros trasero por otro artesanal fabricado en acero de dimensiones ${guarda.dimensionesTrasero}mm.`;

        const p = new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        });
        (p as any)._rawText = raw;
        out.push(p);
      }
      if (guarda.tipoFabricacionGuardabarrosTrasero === 'comercial') {
        raw = `- Sustitución del guardabarros trasero por otro fabricado en plástico marca ${guarda.marca}, referencia ${guarda.referenciaTrasero} de dimensiones a ${guarda.dimensionesTrasero}mm.`;

        const p = new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        });
        (p as any)._rawText = raw;
        out.push(p);
      }
    }
  }

  //
  // 5) MANILLAR
  //
  const manillar = modificaciones.find(
    (m) => m.nombre === 'MANILLAR' && m.seleccionado,
  );
  if (manillar) {
    raw = `- Sustitución de manillar por otro marca ${manillar.marca} modelo ${manillar.modelo} y de medidas ${manillar.medidasManillar}.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);

    out.push(
      new Paragraph({
        spacing: { line: 260, after: 120 },
        children: [
          new TextRun({ text: 'NOTA: ', bold: true }),
          new TextRun({
            text: 'Se han reubicado los mandos sobre el nuevo manillar en posiciones equivalentes a las originales.',
          }),
        ],
      }),
    );
  }

  //
  // 6) VELOCÍMETRO
  //
  const velocimetro = modificaciones.find(
    (m) => m.nombre === 'VELOCÍMETRO' && m.seleccionado,
  );
  if (velocimetro) {
    raw = `- Sustitución del velocímetro, por otro de la marca ${velocimetro.marca} referencia ${velocimetro.referencia} y contraseña de homologación ${velocimetro.homologacion}. Incorpora los testigos de intermitente derecho e izquierdo, luz larga y neutro.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 7) LATIGUILLOS
  //
  const latiguillos = modificaciones.find(
    (m) => m.nombre === 'LATIGUILLOS' && m.seleccionado,
  );

  if (latiguillos) {
    let detalleUbicacion = '';

    if (latiguillos.ubicacionLatiguillos === 'delanteros') {
      detalleUbicacion = `en el eje delantero. Se han instalado unos latiguillos metálicos marca ${latiguillos.marcaDelanteros} ref. ${latiguillos.referenciaDelanteros}`;
    } else if (latiguillos.ubicacionLatiguillos === 'traseros') {
      detalleUbicacion = `en el eje trasero. Se han instalado unos latiguillos metálicos marca ${latiguillos.marcaTraseros} ref. ${latiguillos.referenciaTraseros}`;
    } else {
      detalleUbicacion = `en los dos ejes. En el eje delantero se han instalado unos latiguillos metálicos marca ${latiguillos.marcaDelanteros} ref. ${latiguillos.referenciaDelanteros} y en el eje trasero unos latiguillos metálicos marca ${latiguillos.marcaTraseros} ref. ${latiguillos.referenciaTraseros}`;
    }

    const raw = `- Sustitución de los latiguillos de freno por unos metálicos ${detalleUbicacion}. Estos son de la misma longitud y sección que los originales y van instalados en la misma ubicación y utilizan los anclajes originales.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 8) RETROVISORES
  //
  const retrovisores = modificaciones.find(
    (m) => m.nombre === 'RETROVISORES' && m.seleccionado,
  );
  if (retrovisores) {
    raw = `- Sustitución y reubicación de espejos retrovisores por otros, marca ${retrovisores.marca}, modelo ${retrovisores.modelo}, con marcaje ${retrovisores.marcaje} y contraseña de homologación ${retrovisores.homologacion}.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 9) HORQUILLA DELANTERA
  //
  const horquilladelantera = modificaciones.find(
    (m) => m.nombre === 'HORQUILLA DELANTERA' && m.seleccionado,
  );
  if (horquilladelantera) {
    raw = `- Sustitución de horquilla delantera por otra procedente de una moto marca ${horquilladelantera.marca}, tipo ${horquilladelantera.tipo}, variante ${horquilladelantera.variante} y denominación comercial ${horquilladelantera.denominacion}.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 10) DISCO DE FRENO Y PINZA DE FRENO
  //
  const frenos = modificaciones.find(
    (m) => m.nombre === 'DISCO DE FRENO Y PINZA DE FRENO' && m.seleccionado,
  );
  if (frenos) {
    if (frenos?.tieneDisco) {
      if (frenos?.discoDelantero) {
        raw = `- Sustitución de disco de freno delantero por otro marca ${frenos.marcaDiscoDelantero} referencia ${frenos.referenciaDiscoDelantero}.`;

        const p = new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        });
        (p as any)._rawText = raw;
        out.push(p);
      }
      if (frenos?.discoTrasero) {
        raw = `- Sustitución de disco de freno trasero por otro marca ${frenos.marcaDiscoDelantero} referencia ${frenos.referenciaDiscoTrasero}.`;

        const p = new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        });
        (p as any)._rawText = raw;
        out.push(p);
      }
    }

    if (frenos?.tienePastilla) {
      if (frenos?.pastillaDelantera) {
        raw = `- Sustitución de disco de freno delantero por otro marca ${frenos.marcaPastillaDelantera} referencia ${frenos.referenciaPastillaDelantera}.`;

        const p = new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        });
        (p as any)._rawText = raw;
        out.push(p);
      }

      if (frenos?.pastillaTrasera) {
        if (frenos?.discoTrasero) {
          raw = `- Sustitución de pinza de freno trasero por otro marca ${frenos.marcaPastillaTrasera} referencia ${frenos.referenciaPastillaTrasera}.`;

          const p = new Paragraph({
            spacing: { line: 260, after: 120 },
            indent: { left: 400 },
            children: [new TextRun({ text: raw })],
          });
          (p as any)._rawText = raw;
          out.push(p);
        }
      }
    }
  }

  //
  // 11) LUCES
  //
  const luces = modificaciones.find(
    (m) =>
      m.nombre === 'LUCES' && m.seleccionado && data.tipoVehiculo === 'moto',
  );
  if (luces) {
    console.log('LUCES:', luces);
    if (luces.descripcionLuces?.['luzGrupoOptico']) {
      raw = `- Sustitución y reubicación de grupo óptico delantero por otro marca ${luces.marcaluzGrupoOptico} modelo ${luces.modeloluzGrupoOptico} con luz de posición, cruce y carretera con los marcajes ${luces.marcajesluzGrupoOptico} y contraseña de homologación ${luces.homologacionluzGrupoOptico}.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
    }

    if (luces.descripcionLuces?.['intermitenteDelantero']) {
      raw = `- Sustitución y reubicación de intermitentes anteriores en laterales de la horquilla, por otros marca ${luces.marcaintermitenteDelantero}, referencia ${luces.referenciaintermitenteDelantero} con marcaje ${luces.marcajesintermitenteDelantero} y con contraseña de homologación ${luces.homologacionintermitenteDelantero}.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
    }

    if (luces.descripcionLuces?.['intermitenteTrasero']) {
      raw = `- Sustitución y reubicación de intermitentes posteriores en laterales del portamatrícula, por otros marca ${luces.marcaintermitenteTrasero}, referencia ${luces.referenciaintermitenteTrasero} con marcaje ${luces.marcajesintermitenteTrasero} y con contraseña de homologación ${luces.homologacionintermitenteTrasero}.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
    }

    if (luces.descripcionLuces?.['catadioptrico']) {
      raw = `- Sustitución y reubicación de catadióptrico posterior en parte inferior de emplazamiento de placa de matrícula posterior, por otro marca ${luces.marcacatadioptrico} con marcaje ${luces.referenciacatadioptrico} y con contraseña de homologación ${luces.homologacioncatadioptrico}.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
    }

    if (luces.descripcionLuces?.['luzMatricula']) {
      raw = `- Sustitución y reubicación de luz de matrícula en parte superior de emplazamiento de placa matrícula, por otra marca ${luces.marcaluzMatricula} referencia ${luces.referencialuzMatricula} con contraseña de homologación ${luces.homologacionluzMatricula}.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
    }

    if (luces.descripcionLuces?.['luzAntinieblas']) {
      raw = `- Instalación de faros antiniebla en los laterales del piloto delantero, de la marca ${luces.marcaluzAntinieblas}, con marcado ${luces.marcajesluzAntinieblas} y contraseña ${luces.homologacionluzAntinieblas}, con encendido desde nuevo mando normalizado e independiente ubicado en la parte derecha del carenado. Estos dispositivos funcionan independientemente del encendido de las luces de carretera o cruce.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
    }

    if (luces.descripcionLuces?.['luzFreno']) {
      let led = '';
      if (luces.luzMatriculaIntegradaLuzFreno === true) {
        led = 'con luz de matrícula integrada';
      }
      raw = `- Sustitución del piloto trasero original por otro con sistema led de la marca ${luces.marcaluzAntinieblas} con referencia ${luces.marcaluzAntinieblas} ${led} y con contraseña de homologación ${luces.marcaluzAntinieblas}.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
    }
  }

  //
  // CAMPERS
  //

  //
  // 1) CAMBIO DE CLASIFICACIÓN
  //
  const cambioclasi = modificaciones.find(
    (m) => m.nombre === 'CAMBIO DE CLASIFICACIÓN' && m.seleccionado,
  );
  if (cambioclasi) {
    raw = `- Cambio de clasificación del vehículo de ${data.clasificacionAntes} a ${data.clasificacionDespues}.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  const techo = modificaciones.find(
    (m) => m.nombre === 'TECHO ELEVABLE' && m.seleccionado,
  );

  if (techo) {
    // Construcción de la frase
    const fraseTecho = `Instalación de techo elevable de la marca ${techo.marcaTecho} referencia ${techo.referenciaTecho}, de dimensiones ${techo.anchoTecho} x ${techo.largoTecho} x ${techo.altoTecho} mm. ${techo.materialEstructuraTecho}. Abatible de forma ${techo.tipoAccionamientoTecho}. Se comprueba que la distancia desde la base de los asientos a la carretera es de ${techo.distanciaAsientosSueloTecho}mm.`;

    const raw = `- ${fraseTecho}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const revestimiento = modificaciones.find(
    (m) => m.nombre === 'REVESTIMIENTO INTERIOR' && m.seleccionado,
  );

  if (revestimiento) {
    // 1. Construimos el array de zonas seleccionadas
    const zonas: string[] = [];
    if (revestimiento.zonaLateralesRevestimiento) zonas.push('laterales');
    if (revestimiento.zonaSueloRevestimiento) zonas.push('suelo');
    if (revestimiento.zonaTechoRevestimiento) zonas.push('techo');

    // 2. Formateamos las zonas gramaticalmente (A, B y C)
    let textoZonas = '';
    if (zonas.length === 1) {
      textoZonas = zonas[0];
    } else if (zonas.length > 1) {
      const ultimo = zonas.pop(); // Sacamos el último para ponerle 'y'
      textoZonas = `${zonas.join(', ')} y ${ultimo}`;
    }

    // 3. Construimos la frase principal
    let fraseRevestimiento = `Revestimiento interior de aislamiento y panelado, realizado en ${revestimiento.materialPaneladoRevestimiento}, ubicado en ${textoZonas}.`;

    // 4. Añadimos la tarima si está seleccionada
    if (revestimiento.instalaTarimaRevestimiento) {
      // Añadimos el material de la tarima para ser precisos, aunque la frase ejemplo sea genérica
      fraseRevestimiento += ` Instalación de tarima de ${revestimiento.materialTarimaRevestimiento} sobre el suelo.`;
    }

    const raw = `- ${fraseRevestimiento}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const termo = modificaciones.find(
    (m) => m.nombre === 'INSTALACIÓN DE TERMO' && m.seleccionado,
  );

  if (termo) {
    const fraseTermo = `Instalación de termo de la marca ${termo.marcaTermo} modelo ${termo.modeloTermo} con una capacidad de ${termo.capacidadTermo}L situado en ${termo.ubicacionTermo}.`;

    const raw = `- ${fraseTermo}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const banqueta2 = modificaciones.find(
    (m) => m.nombre === 'BANQUETA' && m.seleccionado,
  );

  if (banqueta2) {
    // Lógica para convertir el número de plazas en texto (ej. 2 -> biplaza)
    let textoPlazas = `de ${banqueta2.numeroPlazasBanqueta} plazas`;
    if (Number(banqueta2.numeroPlazasBanqueta) === 1) {
      textoPlazas = 'monoplaza';
    } else if (Number(banqueta2.numeroPlazasBanqueta) === 2) {
      textoPlazas = 'biplaza';
    }

    // Lógica para el sufijo de seguridad/uso
    let textoSeguridad = '';
    if (banqueta2.esUsoEstacionarioBanqueta) {
      textoSeguridad =
        ', sin cinturones instalados, únicamente habilitada para uso en estacionario';
    } else {
      // En caso de que NO sea estacionario (opcional, por si acaso)
      textoSeguridad =
        ', dotada de los correspondientes cinturones de seguridad';
    }

    const fraseBanqueta = `Instalación de banqueta de asiento ${textoPlazas} fabricada en ${banqueta2.materialBanqueta}, ubicada en ${banqueta2.ubicacionBanqueta}, de la marca ${banqueta2.marcaBanqueta}, modelo ${banqueta2.modeloBanqueta}${textoSeguridad}.`;

    const raw = `- ${fraseBanqueta}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const enganche = modificaciones.find(
    (m) => m.nombre === 'ENGANCHE REMOLQUE' && m.seleccionado,
  );

  if (enganche) {
    // Definimos el texto de ubicación según el checkbox
    const ubicacionTexto = enganche.enEmplazamientoOriginalEnganche
      ? 'en emplazamiento de homologación'
      : 'en la parte trasera'; // Texto por defecto si no se marca el check

    const fraseEnganche = `Instalación de enganche de remolque ${ubicacionTexto}, consistente en: barra y bola marca ${enganche.marcaEnganche}, clase ${enganche.claseEnganche}, contraseña de homologación ${enganche.contrasenaEnganche}, para una MMR en remolques de eje central ${enganche.mmrEnganche}Kg.`;

    const raw = `- ${fraseEnganche}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  const antena = modificaciones.find(
    (m) => m.nombre === 'ANTENA' && m.seleccionado,
  );

  if (antena) {
    // Lógica para la afectación estructural
    const textoEstructura = antena.sinAfectacionEstructuralAntena
      ? ', no afectando a la estructura del vehículo'
      : '';

    const fraseAntena = `Instalación de ${antena.tipoAntena} en ${antena.ubicacionAntena}, de la marca ${antena.marcaAntena}, modelo ${antena.modeloAntena}${textoEstructura}.`;

    const raw = `- ${fraseAntena}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 2) AUMENTO O DISMINUCIÓN DE PLAZAS
  //
  const aumentodisminucion = modificaciones.find(
    (m) =>
      m.nombre === 'AUMENTO O DISMINUCIÓN DE PLAZAS' &&
      m.seleccionado &&
      data.tipoVehiculo === 'camper',
  );
  if (aumentodisminucion) {
    if (aumentodisminucion.tipoCambio === 'aumento') {
      raw = `- Aumento de plazas de asiento pasando de ${aumentodisminucion.plazasAntes} plazas a ${aumentodisminucion.plazasDespues} plazas.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
    }

    if (aumentodisminucion.tipoCambio === 'disminucion') {
      raw = `- Disminución de plazas de asiento pasando de ${aumentodisminucion.plazasAntes} a ${aumentodisminucion.plazasDespues} mediante la desinstalación de la fila de asientos y sus correspondientes cinturones de seguridad.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
    }
  }

  //
  // 3) SUSTITUCIÓN DE BANQUETA DE ASIENTOS POR ASIENTO INDIVIDUAL
  //
  const banqueta = modificaciones.find(
    (m) =>
      m.nombre ===
        'SUSTITUCIÓN DE BANQUETA DE ASIENTOS POR ASIENTO INDIVIDUAL' &&
      m.seleccionado,
  );
  if (banqueta) {
    raw = `- Sustitución de asiento delantero biplaza por uno individual procedente de ${banqueta.marcaAsiento}, contraseña de homologación ${banqueta.contrasenaAsiento}, de la variante de ${banqueta.plazasAsiento} plazas ${banqueta.posicionAsiento}, manteniéndose el cinturón de la plaza lateral derecha en anclaje original.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 4) INSTALACIÓN DE BASES GIRATORIAS
  //
  const giratiorias = modificaciones.find(
    (m) => m.nombre === 'INSTALACIÓN DE BASES GIRATORIAS' && m.seleccionado,
  );
  if (giratiorias) {
    raw = `- Instalación de bases giratorias en los asientos delanteros, marca ${giratiorias.marcaBaseGiratoria}, referencia ${giratiorias.referenciaConductor} (conductor) y ${giratiorias.referenciaAcompanante} (acompañante), sobre anclajes originales, con contraseña de homologación ${giratiorias.homologacionBase}. Las bases giratorias se instalan según instrucciones del fabricante y en anclajes originales.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 5) CALEFACCIÓN ESTACIONARIA
  //
  const calefac = modificaciones.find(
    (m) => m.nombre === 'CALEFACCIÓN ESTACIONARIA' && m.seleccionado,
  );
  if (calefac) {
    raw = `- Instalación de sistema de calefacción marca ${calefac.marcaCalefaccion} modelo ${calefac.modeloCalefaccion} contraseña de homologación ${calefac.homologacionCalefaccion}, con salidas al espacio de carga del vehículo. El combustible utilizado es Diésel que se toma del depósito mediante espadín. ${calefac.descripcionCalefaccion}. Se realiza instalación del sistema de alimentación según indicaciones de fabricante y se garantiza la estanqueidad del sistema.`;
    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 6) MOBILIARIO INTERIOR VEHÍCULO
  //
  const mobil = modificaciones.find(
    (m) => m.nombre === 'MOBILIARIO INTERIOR VEHÍCULO' && m.seleccionado,
  );
  if (mobil) {
    raw = `- Instalación de mobiliario para convertir el vehículo en furgón vivienda en la zona de carga del vehículo, compuesto por:`;

    let p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
    // Muebles Altos
    if (
      mobil.opcionesMueble?.muebleAlto &&
      Array.isArray((mobil as any).mueblesAlto)
    ) {
      (mobil as any).mueblesAlto.forEach((mueble: any) => {
        const ubicacionMuebleAlto =
          typeof mueble.ubicacionMuebleAlto === 'string' &&
          mueble.ubicacionMuebleAlto.trim()
            ? mueble.ubicacionMuebleAlto.trim()
            : 'el lateral derecho';

        const configuracionMuebleAlto =
          typeof mueble.configuracionMuebleAlto === 'string'
            ? mueble.configuracionMuebleAlto.trim()
            : '';
        const detalleConfiguracionAlto = configuracionMuebleAlto
          ? ` con ${configuracionMuebleAlto}`
          : ' con puerta abatible';
        const raw = `o Instalación de un mueble alto situado en ${ubicacionMuebleAlto}${detalleConfiguracionAlto}.`;

        const p = new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        });
        (p as any)._rawText = raw;
        out.push(p);
      });
    }

    // Muebles Bajos
    if (
      mobil.opcionesMueble?.muebleBajo &&
      Array.isArray((mobil as any).mueblesBajo)
    ) {
      (mobil as any).mueblesBajo.forEach((mueble: any) => {
        const ubicacionMuebleBajo =
          typeof mueble.ubicacionMuebleBajo === 'string' &&
          mueble.ubicacionMuebleBajo.trim()
            ? mueble.ubicacionMuebleBajo.trim()
            : 'la parte media del lateral izquierdo';

        const configuracionMuebleBajo =
          typeof mueble.configuracionMuebleBajo === 'string'
            ? mueble.configuracionMuebleBajo.trim()
            : '';
        const detalleConfiguracionBajo = configuracionMuebleBajo
          ? ` con ${configuracionMuebleBajo}`
          : '';
        const raw = `o Instalación de mueble bajo situado en ${ubicacionMuebleBajo}${detalleConfiguracionBajo}.`;

        const p = new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        });
        (p as any)._rawText = raw;
        out.push(p);
      });
    }

    // Aseos
    if (
      mobil.opcionesMueble?.aseo &&
      Array.isArray((mobil as any).mueblesAseo)
    ) {
      (mobil as any).mueblesAseo.forEach((aseo: any) => {
        const configuracionMuebleAseo =
          typeof aseo.configuracionMuebleAseo === 'string'
            ? aseo.configuracionMuebleAseo.trim()
            : '';
        const detalleConfiguracionAseo = configuracionMuebleAseo
          ? ` con ${configuracionMuebleAseo}`
          : '';
        const descripcion = aseo.descripcion
          ? ` en su interior se ubica ${aseo.descripcion}`
          : '';
        const raw = `o Instalación de aseo${detalleConfiguracionAseo}${descripcion}.`;

        const p = new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        });
        (p as any)._rawText = raw;
        out.push(p);
      });
    }
  }

  //
  // 7) CLARABOYA
  //
  const claraboya = modificaciones.find(
    (m) => m.nombre === 'CLARABOYA' && m.seleccionado,
  );
  if (claraboya) {
    const claraboyasArray = Array.isArray(claraboya.claraboyas)
      ? claraboya.claraboyas
      : [];
    const hasArray = claraboyasArray.length > 0;
    const claraboyas = hasArray
      ? claraboyasArray
      : [
          {
            marca: claraboya.marcaClaraboya,
            modelo: claraboya.modeloClaraboya,
            descripcion: claraboya.descripcionClaraboya,
            homologacion: claraboya.homologacionClaraboya,
          },
        ].filter(
          (item) =>
            item.marca ||
            item.modelo ||
            item.descripcion ||
            item.homologacion ||
            claraboya.cantidadClaraboya,
        );

    if (!hasArray && claraboyas.length > 0 && claraboya.cantidadClaraboya) {
      const item = claraboyas[0];
      const marca = item.marca || '---';
      const modelo = item.modelo || '---';
      const descripcion = item.descripcion || '---';
      const homologacion = item.homologacion || '---';

      raw = `- Instalación en el techo del vehículo ${claraboya.cantidadClaraboya} claraboyas, marca ${marca} modelo ${modelo} ${descripcion}, con contraseña de homologación ${homologacion}, sin afectar a la estructura principal del vehículo.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
    } else {
      claraboyas.forEach((item) => {
        const marca = item.marca || '---';
        const modelo = item.modelo || '---';
        const descripcion = item.descripcion || '---';
        const homologacion = item.homologacion || '---';

        raw = `- Instalación en el techo del vehículo de claraboya, marca ${marca} modelo ${modelo} ${descripcion}, con contraseña de homologación ${homologacion}, sin afectar a la estructura principal del vehículo.`;

        const p = new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        });
        (p as any)._rawText = raw;
        out.push(p);
      });
    }
  }

  //
  // 8) VENTANA
  //
  const ventana = modificaciones.find(
    (m) => m.nombre === 'VENTANA' && m.seleccionado,
  );
  if (ventana) {
    const ventanasArray = Array.isArray(ventana.ventanas)
      ? ventana.ventanas
      : [];
    const hasArray = ventanasArray.length > 0;
    const ventanas = hasArray
      ? ventanasArray
      : [
          {
            descripcion: ventana.descripcionVentana,
            marca: ventana.marcaVentana,
            modelo: ventana.modeloVentana,
            dimensiones: ventana.dimensionesVentana,
            homologacion: ventana.homologacionVentana,
          },
        ].filter(
          (item) =>
            item.descripcion ||
            item.marca ||
            item.modelo ||
            item.dimensiones ||
            item.homologacion ||
            ventana.cantidadVentanas,
        );

    if (!hasArray && ventanas.length > 0 && ventana.cantidadVentanas) {
      const item = ventanas[0];
      const descripcion = item.descripcion || '---';
      const marca = item.marca || '---';
      const modelo = item.modelo || '---';
      const dimensiones = item.dimensiones || '---';
      const homologacion = item.homologacion || '---';

      raw = `- Instalación de ${ventana.cantidadVentanas} ventanas abatibles/correderas ${descripcion} marca ${marca} modelo ${modelo} de dimensiones ${dimensiones}mm y contraseña de homologación ${homologacion}, sin afectar a la estructura principal del vehículo.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
    } else {
      ventanas.forEach((item) => {
        const descripcion = item.descripcion || '---';
        const marca = item.marca || '---';
        const modelo = item.modelo || '---';
        const dimensiones = item.dimensiones || '---';
        const homologacion = item.homologacion || '---';

        raw = `- Instalación de ventana abatible/corredera ${descripcion} marca ${marca} modelo ${modelo} de dimensiones ${dimensiones}mm y contraseña de homologación ${homologacion}, sin afectar a la estructura principal del vehículo.`;

        const p = new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        });
        (p as any)._rawText = raw;
        out.push(p);
      });
    }
  }

  //
  // 9) DEPÓSITO DE AGUA SUCIA
  //
  const aguasucia = modificaciones.find(
    (m) => m.nombre === 'DEPÓSITO DE AGUA SUCIA' && m.seleccionado,
  );
  if (aguasucia) {
    raw = `- Instalación de depósito para agua sucia de ${aguasucia.litrosAguaSucia} litros en la parte trasera en los bajos del vehículo. Este depósito se vacía mediante un grifo.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 10) DEPÓSITO DE AGUA LIMPIA
  //
  const agualimpia = modificaciones.find(
    (m) => m.nombre === 'DEPÓSITO DE AGUA LIMPIA' && m.seleccionado,
  );
  if (agualimpia) {
    raw = `- Instalación de depósito para agua limpia de ${agualimpia.litrosAguaLimpia} litros y medidas ${agualimpia.medidasAguaLimpia}mm.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 12) BOMBA DE AGUA
  //
  const bombaagua = modificaciones.find(
    (m) => m.nombre === 'BOMBA DE AGUA' && m.seleccionado,
  );
  if (bombaagua) {
    raw = `- Instalación de bomba de agua de 12V marca ${bombaagua.marcaBombaAgua} modelo ${bombaagua.modeloBombaAgua} ubicada en ${bombaagua.ubicacionBombaAgua}.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 13) REGISTRO DE LLENADO DE AGUA
  //
  const llenadoagua = modificaciones.find(
    (m) => m.nombre === 'REGISTRO DE LLENADO DE AGUA' && m.seleccionado,
  );
  if (llenadoagua) {
    raw = `- Instalación de registro ${llenadoagua.ubicacionRegistroAgua} para llenado de agua, fabricado en plástico de Ø ${llenadoagua.tamanoRegistroAgua}mm, sin afectar a la estructura del vehículo.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 14) TOMA EXTERIOR 230V
  //
  const toma230v = modificaciones.find(
    (m) => m.nombre === 'TOMA EXTERIOR 230V' && m.seleccionado,
  );
  if (toma230v) {
    raw = `- Instalación de una toma de corriente exterior de ${toma230v.voltajeTomaExterior}V en la ${toma230v.ubicacionTomaExterior} fabricado en plástico de medidas ${toma230v.medidasTomaExterior}mm, sin afectar a la estructura del vehículo.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 15) DUCHA EXTERIOR
  //
  const duchaexterior = modificaciones.find(
    (m) => m.nombre === 'DUCHA EXTERIOR' && m.seleccionado,
  );
  if (duchaexterior) {
    raw = `- Instalación de registro con ducha exterior en la ${duchaexterior.ubicacionDuchaExterior} para llenado de agua, fabricado en plástico, sin afectar a la estructura del vehículo.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 16) INSTALACIÓN ELÉCTRICA
  //
  const instalacionelectrica = modificaciones.find(
    (m) => m.nombre === 'INSTALACIÓN ELÉCTRICA' && m.seleccionado,
  );
  if (instalacionelectrica) {
    const hasValue = (value: unknown): boolean => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (typeof value === 'number') return Number.isFinite(value);
      if (typeof value === 'boolean') return value;
      if (Array.isArray(value)) return value.some((item) => hasValue(item));
      if (typeof value === 'object') {
        return Object.values(value as Record<string, unknown>).some((item) =>
          hasValue(item),
        );
      }
      return true;
    };
    const hasAny = (values: unknown[]): boolean =>
      values.some((value) => hasValue(value));
    const hasPlacaData = Array.isArray(instalacionelectrica.placasSolares)
      ? instalacionelectrica.placasSolares.some((placa: any) => hasValue(placa))
      : false;
    const hasBateriaData = hasAny([
      instalacionelectrica.cantidadBaterias,
      instalacionelectrica.potenciaBaterias,
      instalacionelectrica.ubicacionBaterias,
    ]);
    const hasInversorData = hasAny([
      instalacionelectrica.potenciaInversor,
      instalacionelectrica.marcaInversor,
      instalacionelectrica.homologacionInversor,
      instalacionelectrica.ubicacionInversor,
    ]);
    const hasControladorData = hasAny([
      instalacionelectrica.modeloControlador,
      instalacionelectrica.marcaControlador,
      instalacionelectrica.homologacionControlador,
      instalacionelectrica.ubicacionControlador,
    ]);
    const hasSecundariasData = hasValue(
      instalacionelectrica.instalacionesSecundarias,
    );
    const hasNotaData = instalacionelectrica.anotacion === true;

    if (
      !hasPlacaData &&
      !hasBateriaData &&
      !hasInversorData &&
      !hasControladorData &&
      !hasSecundariasData &&
      !hasNotaData
    ) {
      // Sin datos útiles, no se genera el bloque eléctrico.
    } else {
      raw = `- Instalación eléctrica compuesta por:`;

      let p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);

      if (Array.isArray(instalacionelectrica.placasSolares)) {
        instalacionelectrica.placasSolares
          .filter((placa: any) =>
            hasAny([
              placa?.marca,
              placa?.modelo,
              placa?.potencia,
              placa?.dimensiones,
              placa?.ubicacion,
            ]),
          )
          .forEach((placa: any) => {
            const cantidad =
              placa?.agruparIguales && Number(placa?.cantidad) > 1
                ? Math.trunc(Number(placa.cantidad))
                : 1;
            const sujeto =
              cantidad > 1
                ? `${cantidad} placas solares monocristalinas`
                : 'Placa solar monocristalina';
            const situacion = cantidad > 1 ? 'situadas' : 'situada';

            raw = `o ${sujeto} marca ${placa.marca || ''} modelo ${
              placa.modelo || ''
            } de ${placa.potencia || ''}W de dimensiones ${
              placa.dimensiones || ''
            }mm ${situacion} en ${placa.ubicacion || ''} del vehículo.`;

            const pPlaca = new Paragraph({
              spacing: { line: 260, after: 120 },
              indent: { left: 600 },
              children: [new TextRun({ text: raw })],
            });
            (pPlaca as any)._rawText = raw;
            out.push(pPlaca);
          });
      }

      if (hasBateriaData) {
        raw = `o ${instalacionelectrica.cantidadBaterias} batería auxiliar de ${instalacionelectrica.potenciaBaterias}V situada en ${instalacionelectrica.ubicacionBaterias}.`;

        p = new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 600 },
          children: [new TextRun({ text: raw })],
        });
        (p as any)._rawText = raw;
        out.push(p);
      }

      if (hasInversorData) {
        const homologacionInversorTexto =
          instalacionelectrica.homologacionInversor
            ? ` con contraseña de homologación ${instalacionelectrica.homologacionInversor}`
            : '';
        raw = `o Inversor ${instalacionelectrica.potenciaInversor} marca ${instalacionelectrica.marcaInversor}${homologacionInversorTexto} situado en ${instalacionelectrica.ubicacionInversor}.`;

        p = new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 600 },
          children: [new TextRun({ text: raw })],
        });
        (p as any)._rawText = raw;
        out.push(p);
      }

      if (hasControladorData) {
        const homologacionControladorTexto =
          instalacionelectrica.homologacionControlador
            ? ` con contraseña de homologación ${instalacionelectrica.homologacionControlador}`
            : '';
        raw = `o Controlador de carga solar ${instalacionelectrica.modeloControlador} marca ${instalacionelectrica.marcaControlador}${homologacionControladorTexto} situado en ${instalacionelectrica.ubicacionControlador}.`;

        p = new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 600 },
          children: [new TextRun({ text: raw })],
        });
        (p as any)._rawText = raw;
        out.push(p);
      }

      if (instalacionelectrica.anotacion === true) {
        out.push(
          new Paragraph({
            spacing: { line: 260, after: 120 },
            children: [
              new TextRun({ text: 'NOTA: ', bold: true }),
              new TextRun({
                text: 'Estos componentes únicamente podrán funcionar en estacionario, con el vehículo parado, mediante relé. Esta instalación es independiente de la principal y se desconecta automáticamente al arrancar el vehículo mediante relé.',
              }),
            ],
          }),
        );
      }

      if (hasSecundariasData) {
        const lines = (instalacionelectrica.instalacionesSecundarias ?? '')
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l.length);
        lines.forEach((line) => {
          raw = `- ${line}`;
          const sec = new Paragraph({
            spacing: { line: 260, after: 60 },
            indent: { left: 400 },
            children: [new TextRun({ text: raw })],
          });
          (sec as any)._rawText = raw;
          out.push(sec);
        });
      }
    }
  }

  //
  // 17) TOLDO
  //
  const toldo = modificaciones.find(
    (m) => m.nombre === 'TOLDO' && m.seleccionado,
  );
  if (toldo) {
    raw = `- Instalación de toldo marca ${toldo.marcaToldo} de medidas ${toldo.medidasToldo}mm en ${toldo.ubicacionToldo} del vehículo sin afectar a la estructura.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  return out;
}

export function getFirstWord(p: Paragraph): string {
  const raw: string = (p as any)._rawText ?? '';

  // 1) Quitar guión inicial si existe
  const clean = raw.trim().replace(/^-+\s*/, '');

  // 2) Primera palabra
  return clean.split(/\s+/)[0] || '';
}

export function generarDocumentoProyectoParagraphs(
  modificaciones: { modificaciones: Modificacion[] },
  data: any,
): Paragraph[] {
  const all = buildModificacionesParagraphs(
    modificaciones.modificaciones,
    data,
    true,
  );

  const first = (p: Paragraph) => getFirstWord(p); // tu helper existente

  // Clasificación base
  const casuisticaParas = all.filter(
    (p: any) =>
      (p as any)._fromCasuistica === true &&
      (p as any)._omitFromProyectoApartados !== true,
  );

  const nonCasuisticaParas = all.filter(
    (p: any) => (p as any)._fromCasuistica !== true,
  );

  let montajesBase = nonCasuisticaParas.filter(
    (p) =>
      ![
        'Variación',
        'Sustitución',
        'Desmontaje',
        'Disminución',
        '',
        ' ',
      ].includes(first(p)),
  );
  let desmontajesBase = nonCasuisticaParas.filter(
    (p) => first(p) === 'Desmontaje' || first(p) === 'Disminución',
  );
  let variacionesBase = nonCasuisticaParas.filter((p) =>
    ['Variación', 'Sustitución'].includes(first(p)),
  );

  const casuisticaInstHeader = casuisticaParas.filter(
    (p) => first(p) === 'Instalación',
  );
  const casuisticaSustHeader = casuisticaParas.filter(
    (p) => first(p) === 'Sustitución',
  );
  const casuisticaDesmHeader = casuisticaParas.filter(
    (p) => first(p) === 'Desmontaje',
  );

  const casuisticaDetails = casuisticaParas.filter(
    (p) =>
      first(p) !== 'Instalación' &&
      first(p) !== 'Sustitución' &&
      first(p) !== 'Desmontaje',
  );

  const keyOf = (p: any) =>
    (p?._rawText as string) ??
    JSON.stringify(
      (p?.options?.children ?? []).map((tr: any) => tr?.options?.text ?? ''),
    );

  const uniqueMerge = (base: Paragraph[], extra: Paragraph[]) => {
    const seen = new Set<string>(base.map((p: any) => keyOf(p)));
    const out = [...base];
    for (const p of extra) {
      const k = keyOf(p as any);
      if (!seen.has(k)) {
        seen.add(k);
        out.push(p);
      }
    }
    return out;
  };

  const montajes = uniqueMerge(montajesBase, casuisticaInstHeader);

  const desmontajes = uniqueMerge(desmontajesBase, casuisticaDesmHeader);

  const variacionesYSus = uniqueMerge(
    variacionesBase,
    uniqueMerge(casuisticaSustHeader, casuisticaDetails),
  );

  // Pintado
  const out: Paragraph[] = [];
  const appendSection = (title: string, paras: Paragraph[]) => {
    out.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_4,
        spacing: { before: 260, after: 120 },
        children: [new TextRun({ text: title, bold: true, color: '000000' })],
      }),
    );
    if (paras.length) {
      out.push(...paras);
    } else {
      out.push(
        new Paragraph({
          indent: { left: 400 },
          children: [new TextRun({ text: '- No procede.', italics: true })],
        }),
      );
    }
  };

  appendSection('1.6.1- Desmontajes realizados', desmontajes);
  appendSection('1.6.2- Variaciones y sustituciones', variacionesYSus);
  appendSection('1.6.3- Montajes realizados', montajes);

  return out;
}

// helper local dentro de buildModificacionesParagraphs
function pushCasuistica(out: Paragraph[], p: Paragraph, raw?: string) {
  (p as any)._fromCasuistica = true; // ← marca inequívoca
  if (raw) (p as any)._rawText = raw; // si ya usas _rawText, lo mantenemos
  out.push(p);
}

function getRefuerzoUbicaciones(ubicacionRefuerzo?: string): {
  hasDelantero: boolean;
  hasTrasero: boolean;
} {
  const normalized = (ubicacionRefuerzo || '').toLowerCase();
  return {
    hasDelantero: normalized.includes('delanter'),
    hasTrasero: normalized.includes('traser') || normalized.includes('detr'),
  };
}

function resolveUbicacionRefuerzoTexto(ubicacionRefuerzo?: string): string {
  const { hasDelantero, hasTrasero } =
    getRefuerzoUbicaciones(ubicacionRefuerzo);

  if (hasDelantero && hasTrasero) return 'delantero y trasero';
  if (hasDelantero) return 'delantero';
  if (hasTrasero) return 'trasero';

  return ubicacionRefuerzo || '';
}

type DetallesMuelles = {
  muelleDelanteroConRef?: boolean;
  muelleDelanteroSinRef?: boolean;
  ballestaDelantera?: boolean;
  amortiguadorDelantero?: boolean;
  muelleTraseroConRef?: boolean;
  muelleTraseroSinRef?: boolean;
  ballestaTrasera?: boolean;
  amortiguadorTrasero?: boolean;
  tacosDeGoma?: boolean;
  kitElevacion?: boolean;
};

const SUSP_LABELS: Record<keyof DetallesMuelles, string> = {
  muelleDelanteroConRef: 'Muelle delantero (con referencia)',
  muelleDelanteroSinRef: 'Muelle delantero (sin referencia)',
  ballestaDelantera: 'Ballesta delantera',
  amortiguadorDelantero: 'Amortiguador delantero',
  muelleTraseroConRef: 'Muelle trasero (con referencia)',
  muelleTraseroSinRef: 'Muelle trasero (sin referencia)',
  ballestaTrasera: 'Ballesta trasera',
  amortiguadorTrasero: 'Amortiguador trasero',
  tacosDeGoma: 'Tacos de goma / suplementos',
  kitElevacion: 'Kit de elevación',
};

function isCasuisticaSuspension(nombre?: string): boolean {
  return (
    (nombre || '').trim().toUpperCase() ===
    'TODA LA CASUÍSTICA DE MUELLES, BALLESTAS Y AMORTIGUADORES QUE SE PUEDEN DAR'
  );
}

function expandSuspensionToLabels(det?: DetallesMuelles): string[] {
  if (!det) return [];
  const out: string[] = [];
  (Object.keys(SUSP_LABELS) as Array<keyof DetallesMuelles>).forEach((k) => {
    if (det[k]) out.push(SUSP_LABELS[k]); // mismo formato que en la UI
  });
  return out;
}

const CANVAS_HIDDEN_MOD_NAMES = [
  'AUMENTO DE PLAZAS',
  'REDUCCION DE PLAZAS',
  'REDUCCION DE MMA',
  'REDUCCION DE MMTA',
];

function normalizeText(value: unknown): string {
  return (value ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

const CANVAS_HIDDEN_MOD_NAMES_NORMALIZED = new Set<string>(
  CANVAS_HIDDEN_MOD_NAMES.map((name) => normalizeText(name)),
);

const CANVAS_HIDDEN_MOD_RULES: Array<(mod: any) => boolean> = [
  (mod) => CANVAS_HIDDEN_MOD_NAMES_NORMALIZED.has(normalizeText(mod?.nombre)),
  (mod) =>
    normalizeText(mod?.nombre) === 'AUMENTO O DISMINUCION DE PLAZAS' &&
    (mod?.tipoCambio || '').toString().trim().toLowerCase() === 'aumento',
];

function shouldHideModInCanvas(mod: any): boolean {
  return CANVAS_HIDDEN_MOD_RULES.some((rule) => rule(mod));
}

function hasValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

function isMobiliarioInteriorMod(mod: any, normalizedName: string): boolean {
  return (
    normalizedName.includes('MOBILIARIO INTERIOR') ||
    mod?.opcionesMueble != null ||
    Array.isArray(mod?.mueblesBajo) ||
    Array.isArray(mod?.mueblesAlto) ||
    Array.isArray(mod?.mueblesAseo)
  );
}

function isInstalacionElectricaMod(mod: any, normalizedName: string): boolean {
  return (
    (normalizedName.includes('INSTALACI') &&
      normalizedName.includes('CTRICA')) ||
    Array.isArray(mod?.placasSolares) ||
    hasValue(mod?.cantidadBaterias) ||
    hasValue(mod?.potenciaBaterias) ||
    hasValue(mod?.ubicacionBaterias) ||
    hasValue(mod?.potenciaInversor) ||
    hasValue(mod?.marcaInversor) ||
    hasValue(mod?.homologacionInversor) ||
    hasValue(mod?.ubicacionInversor) ||
    hasValue(mod?.modeloControlador) ||
    hasValue(mod?.marcaControlador) ||
    hasValue(mod?.homologacionControlador) ||
    hasValue(mod?.ubicacionControlador)
  );
}

const LUCES_LABELS: Record<string, string> = {
  luzGrupoOptico: 'Grupo óptico delantero',
  intermitenteDelantero: 'Intermitente delantero',
  intermitenteTrasero: 'Intermitente trasero',
  catadioptrico: 'Catadióptrico',
  luzMatricula: 'Luz de matrícula',
  luzAntinieblas: 'Luz antinieblas',
  luzFreno: 'Luz de freno',
};

function expandLuces(mod: any): string[] {
  const det = mod?.descripcionLuces;
  if (!det) return [];

  const out: string[] = [];
  (Object.keys(LUCES_LABELS) as Array<keyof typeof LUCES_LABELS>).forEach(
    (k) => {
      if (det[k]) {
        out.push(LUCES_LABELS[k]);
      }
    },
  );
  return out;
}

function expandInstalacionElectrica(mod: any): string[] {
  const out: string[] = [];

  if (Array.isArray(mod.placasSolares)) {
    mod.placasSolares.forEach((placa: any, i: number) => {
      const marca = (placa?.marcaPlacaSolar ?? placa?.marca ?? '')
        .toString()
        .trim();
      const modelo = (placa?.modeloPlacaSolar ?? placa?.modelo ?? '')
        .toString()
        .trim();
      const detalle = [marca, modelo].filter(Boolean).join(' ');
      const cantidad =
        placa?.agruparIguales && Number(placa?.cantidad) > 1
          ? Math.trunc(Number(placa.cantidad))
          : 1;
      const label =
        cantidad > 1
          ? detalle
            ? `${cantidad} placas solares (${detalle})`
            : `${cantidad} placas solares`
          : detalle
            ? `Placa solar ${i + 1} (${detalle})`
            : `Placa solar ${i + 1}`;
      out.push(label);
    });
  }

  // La leyenda siempre separa batería/inversor/controlador en instalación eléctrica.
  out.push('Batería');
  out.push('Inversor');
  out.push('Controlador');

  if (hasValue(mod.instalacionesSecundarias)) {
    out.push(`Instalaciones secundarias`);
  }

  return out;
}

function buildLabelWithModel(
  prefix: 'Ventana' | 'Claraboya',
  model: any,
): string {
  const modelText = (model ?? '').toString().trim();
  return modelText ? `${prefix} ${modelText}` : prefix;
}

function toPositiveInt(value: any): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.floor(parsed);
}

function expandClaraboyas(mod: any): string[] {
  const out: string[] = [];

  if (Array.isArray(mod?.claraboyas) && mod.claraboyas.length > 0) {
    mod.claraboyas.forEach((item: any) => {
      out.push(buildLabelWithModel('Claraboya', item?.modelo));
    });
    return out;
  }

  const legacyExists =
    mod?.modeloClaraboya ||
    mod?.marcaClaraboya ||
    mod?.homologacionClaraboya ||
    mod?.descripcionClaraboya ||
    mod?.cantidadClaraboya;

  if (!legacyExists) return out;

  const qty = toPositiveInt(mod?.cantidadClaraboya);
  const count = qty > 0 ? qty : 1;
  for (let i = 0; i < count; i++) {
    out.push(buildLabelWithModel('Claraboya', mod?.modeloClaraboya));
  }

  return out;
}

function expandVentanas(mod: any): string[] {
  const out: string[] = [];

  if (Array.isArray(mod?.ventanas) && mod.ventanas.length > 0) {
    mod.ventanas.forEach((item: any) => {
      out.push(buildLabelWithModel('Ventana', item?.modelo));
    });
    return out;
  }

  const legacyExists =
    mod?.modeloVentana ||
    mod?.marcaVentana ||
    mod?.homologacionVentana ||
    mod?.descripcionVentana ||
    mod?.dimensionesVentana ||
    mod?.cantidadVentanas;

  if (!legacyExists) return out;

  const qty = toPositiveInt(mod?.cantidadVentanas);
  const count = qty > 0 ? qty : 1;
  for (let i = 0; i < count; i++) {
    out.push(buildLabelWithModel('Ventana', mod?.modeloVentana));
  }

  return out;
}

function expandReformasAdicionalesLabels(mod: any): string[] {
  const out: string[] = [];
  const items = Array.isArray(mod?.reformasAdicionalesItems)
    ? mod.reformasAdicionalesItems
    : [];

  items.forEach((item: any, index: number) => {
    const titulo = (item?.titulo ?? '').toString().trim();
    if (titulo) {
      out.push(titulo);
      return;
    }

    const descripcion = (item?.descripcion ?? '').toString().trim();
    if (descripcion) {
      out.push(`Reforma adicional ${index + 1}`);
    }
  });

  return out;
}

function buildLabelsFromMods(data: any): string[] {
  const labels: string[] = [];
  const mods = Array.isArray(data?.modificaciones) ? data.modificaciones : [];

  for (const mod of mods) {
    const normalizedName = normalizeText(mod?.nombre);

    if (mod?.seleccionado && shouldHideModInCanvas(mod)) {
      continue;
    }

    if (mod?.seleccionado && isMobiliarioInteriorMod(mod, normalizedName)) {
      mod.mueblesBajo?.forEach((_: any, idx: number) =>
        labels.push(`Mueble bajo ${idx + 1}`),
      );
      mod.mueblesAlto?.forEach((_: any, idx: number) =>
        labels.push(`Mueble alto ${idx + 1}`),
      );
      mod.mueblesAseo?.forEach((_: any, idx: number) =>
        labels.push(`Aseo ${idx + 1}`),
      );
      continue;
    }

    if (isCasuisticaSuspension(mod?.nombre)) {
      const sublabels = expandSuspensionToLabels(mod?.detallesMuelles);
      if (sublabels.length > 0) labels.push(...sublabels);
      continue;
    }

    if (mod?.seleccionado && isInstalacionElectricaMod(mod, normalizedName)) {
      const hasValueDeep = (value: unknown): boolean => {
        if (value === undefined || value === null) return false;
        if (typeof value === 'string') return value.trim().length > 0;
        if (typeof value === 'number') return Number.isFinite(value);
        if (typeof value === 'boolean') return value;
        if (Array.isArray(value)) {
          return value.some((item) => hasValueDeep(item));
        }
        if (typeof value === 'object') {
          return Object.values(value as Record<string, unknown>).some((item) =>
            hasValueDeep(item),
          );
        }
        return true;
      };

      const sublabels: string[] = [];

      if (Array.isArray(mod.placasSolares)) {
        mod.placasSolares
          .filter((placa: any) =>
            hasValueDeep({
              marca: placa?.marcaPlacaSolar ?? placa?.marca,
              modelo: placa?.modeloPlacaSolar ?? placa?.modelo,
              potencia: placa?.potencia,
              dimensiones: placa?.dimensiones,
              ubicacion: placa?.ubicacion,
            }),
          )
          .forEach((placa: any, i: number) => {
            const marca = (placa?.marcaPlacaSolar ?? placa?.marca ?? '')
              .toString()
              .trim();
            const modelo = (placa?.modeloPlacaSolar ?? placa?.modelo ?? '')
              .toString()
              .trim();
            const detalle = [marca, modelo].filter(Boolean).join(' ');
            const cantidad =
              placa?.agruparIguales && Number(placa?.cantidad) > 1
                ? Math.trunc(Number(placa.cantidad))
                : 1;
            sublabels.push(
              cantidad > 1
                ? detalle
                  ? `${cantidad} placas solares (${detalle})`
                  : `${cantidad} placas solares`
                : detalle
                  ? `Placa solar ${i + 1} (${detalle})`
                  : `Placa solar ${i + 1}`,
            );
          });
      }

      const hasBateriaData =
        hasValueDeep(mod.cantidadBaterias) ||
        hasValueDeep(mod.potenciaBaterias) ||
        hasValueDeep(mod.ubicacionBaterias);
      const hasInversorData =
        hasValueDeep(mod.potenciaInversor) ||
        hasValueDeep(mod.marcaInversor) ||
        hasValueDeep(mod.homologacionInversor) ||
        hasValueDeep(mod.ubicacionInversor);
      const hasControladorData =
        hasValueDeep(mod.modeloControlador) ||
        hasValueDeep(mod.marcaControlador) ||
        hasValueDeep(mod.homologacionControlador) ||
        hasValueDeep(mod.ubicacionControlador);

      if (hasBateriaData) sublabels.push('Batería');
      if (hasInversorData) sublabels.push('Inversor');
      if (hasControladorData) sublabels.push('Controlador');
      if (hasValueDeep(mod.instalacionesSecundarias)) {
        sublabels.push('Instalaciones secundarias');
      }

      if (sublabels.length > 0) labels.push(...sublabels);
      continue;
    }

    if (mod?.seleccionado && mod?.nombre === 'LUCES') {
      const sublabels = expandLuces(mod);
      if (sublabels.length > 0) labels.push(...sublabels);
      continue;
    }

    if (mod?.seleccionado && normalizedName === 'CLARABOYA') {
      const sublabels = expandClaraboyas(mod);
      if (sublabels.length > 0) labels.push(...sublabels);
      continue;
    }

    if (mod?.seleccionado && normalizedName === 'VENTANA') {
      const sublabels = expandVentanas(mod);
      if (sublabels.length > 0) labels.push(...sublabels);
      continue;
    }

    if (
      mod?.seleccionado &&
      normalizedName === 'CAMPO LIBRE SOBRE REFORMAS NO EXISTENTES'
    ) {
      const sublabels = expandReformasAdicionalesLabels(mod);
      if (sublabels.length > 0) {
        labels.push(...sublabels);
      } else {
        labels.push(mod.nombre);
      }
      continue;
    }

    if (mod?.seleccionado) {
      labels.push(mod.nombre);
    }
  }

  return labels;
}

export function generarTablaLeyenda(data: any): (Table | Paragraph)[] {
  const labels = buildLabelsFromMods(data);

  const seleccionadas = labels.map((nombre: string, i: number) => ({
    numero: i + 1,
    nombre,
  }));

  const mitad = Math.ceil(seleccionadas.length / 2);
  const col1 = seleccionadas.slice(0, mitad);
  const col2 = seleccionadas.slice(mitad);

  while (col2.length < col1.length) {
    col2.push({ numero: 0, nombre: '' });
  }

  const filas = [
    new TableRow({
      cantSplit: true,
      children: [
        new TableCell({
          margins: { top: 100, bottom: 100 },
          columnSpan: 2,
          width: { size: 100, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'LEYENDA', bold: true })],
            }),
          ],
        }),
      ],
    }),

    ...col1.map(
      (item, index) =>
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              margins: { top: 100, bottom: 100, left: 200, right: 200 },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: item.numero
                        ? `${item.numero}- ${item.nombre.toUpperCase()}`
                        : '',
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              margins: { top: 100, bottom: 100, left: 200, right: 200 },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: col2[index].numero
                        ? `${col2[index].numero}- ${col2[
                            index
                          ].nombre.toUpperCase()}`
                        : '',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
    ),
  ];

  const tabla = new Table({
    alignment: AlignmentType.CENTER,
    width: { size: 85, type: WidthType.PERCENTAGE },
    rows: filas,
  });

  return [
    new Paragraph({
      children: [],
      spacing: { after: 25 },
    }),
    tabla,
    new Paragraph({
      children: [],
      spacing: { before: 25 },
    }),
  ];
}

function renderWordArtBrowser(text: string): Promise<Uint8Array> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // 1) Ajustes de fuente
    const fontSize = 64; // equivale a ~32 pt
    const fontSpec = `italic bold ${fontSize}px "Arial Black"`;
    ctx.font = fontSpec;

    // 2) Medir texto y dar padding
    const metrics = ctx.measureText(text);
    const textWidth = Math.ceil(metrics.width);
    const textHeight = fontSize;
    const padding = 20;
    canvas.width = textWidth + padding * 2;
    canvas.height = textHeight + padding * 2;

    // 3) Resetear estilo tras resize
    ctx.font = fontSpec;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.lineJoin = 'round';

    const x = padding;
    const y = padding;

    // 4) Sombra blanca intensa (glow)
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 5) Relleno de texto azul
    ctx.fillStyle = '#0000FF';
    ctx.fillText(text, x, y);

    // 6) Desactivar sombra para el trazo
    ctx.shadowBlur = 0;

    // 7) Contorno blanco grueso
    ctx.lineWidth = fontSize * 0.1;
    ctx.strokeStyle = '#FFFFFF';
    ctx.strokeText(text, x, y);

    // 8) Convertir a Uint8Array
    canvas.toBlob((blob) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(new Uint8Array(reader.result as ArrayBuffer));
      };
      reader.readAsArrayBuffer(blob!);
    }, 'image/png');
  });
}

// 3) Uso en tu función de generación de documento
export async function generarDocumentoConWordArt(ingeniero: {
  web: string;
  url: string;
}) {
  // 3.1) Genera el buffer de la imagen
  const imgData = await renderWordArtBrowser(ingeniero.web.toUpperCase());
  return imgData;
}
