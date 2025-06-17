import { Paragraph, TextRun, HeadingLevel } from 'docx';
import { Modificacion } from '../interfaces/modificacion';

export function buildModificacionesParagraphs(
  modificaciones: Modificacion[],
  data: any
): Paragraph[] {
  console.log(data.marca, ' ', data.denominacion, ' ', data.homologacion);
  const out: Paragraph[] = [];
  let mod;
  let raw;

  //
  // 1) REMOLQUE HOMOLOGADO EN EMPLAZAMIENTO NO HOMOLOGADO
  //
  const remolquenohomologado = modificaciones.find(
    (m) =>
      m.nombre === 'REMOLQUE HOMOLOGADO EN EMPLAZAMIENTO NO HOMOLOGADO' &&
      m.seleccionado
  );
  if (remolquenohomologado) {
    raw = `- ${remolquenohomologado.accion} de enganche de remolque homologado en emplazamiento no homologado, consistente en: soporte marca ${remolquenohomologado.marca}, tipo ${remolquenohomologado.tipo}, clase ${remolquenohomologado.clase}, contraseña de homologación ${remolquenohomologado.homologacion}, para una MMR en remolques de eje central ${remolquenohomologado.mmrEjeCentral} kg y de barra de tracción ${remolquenohomologado.mmrBarraTraccion} kg.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 2) REMOLQUE HOMOLOGADO EN EMPLAZAMIENTO TAMBIÉN HOMOLOGADO
  //REMOLQUE HOMOLOGADO EN EMPLAZAMIENTO TAMBIÉN HOMOLOGADO
  //
  const remolquehomologado = modificaciones.find(
    (m) =>
      m.nombre === 'REMOLQUE HOMOLOGADO EN EMPLAZAMIENTO TAMBIÉN HOMOLOGADO' &&
      m.seleccionado
  );
  if (remolquehomologado) {
    raw = `- ${remolquehomologado.accion} de enganche de remolque homologado en emplazamiento no homologado, consistente en: soporte marca ${remolquehomologado.marcaBarra}, tipo ${remolquehomologado.tipoBarra}, clase ${remolquehomologado.tipoBarra}, contraseña de homologación ${remolquehomologado.tipoBarra}, para una MMR en remolques de eje central ${remolquehomologado.mmrEjeCentral}kg y de barra de tracción ${remolquehomologado.mmrBarraTraccion}kg.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 3) REDUCCIÓN DE PLAZAS
  //
  const reduccionplazas = modificaciones.find(
    (m) => m.nombre === 'REDUCCIÓN DE PLAZAS' && m.seleccionado
  );
  if (reduccionplazas) {
    raw = `- Reducción de plazas de asiento pasando de ${reduccionplazas.plazasAntes} a ${reduccionplazas.plazasDespues} mediante la desinstalación del cinturón de seguridad y el anclaje de la plaza ${reduccionplazas.enclaje}.`;

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
            text: 'En la plaza en la cual se ha desinstalado el cinturón de seguridad, se ha instalado un pictograma con texto el cual indica inequívocamente que dicha plaza no puede utilizarse con el vehículo en circulación.',
          }),
        ],
      })
    );
  }

  //
  // 4) NEUMÁTICOS
  //
  const neumaticos = modificaciones.find(
    (m) => m.nombre === 'NEUMÁTICOS' && m.seleccionado
  );
  if (neumaticos) {
    raw = `- Sustitución de neumáticos en ambos ejes por otros homologados de medidas no equivalentes ${neumaticos.neumaticos}, montados sobre llantas de medidas ${neumaticos.medidas}”, asegurando la compatibilidad llanta-neumático y la no interferencia entre los neumáticos y ningún punto de la carrocería.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);

    if (neumaticos.anotacion === '1') {
      out.push(
        new Paragraph({
          spacing: { line: 260, after: 120 },
          children: [
            new TextRun({
              text: 'NOTA 1: ',
              bold: true,
            }),
            new TextRun({
              text: 'Debido a que la diferencia de diámetro entre el neumático original y el nuevo es superior al 8%, se ha procedido al tarado del velocímetro.',
            }),
          ],
        })
      );
    }

    if (neumaticos.anotacion === '2') {
      out.push(
        new Paragraph({
          spacing: { line: 260, after: 120 },
          children: [
            new TextRun({
              text: 'NOTA 2: ',
              bold: true,
            }),
            new TextRun({
              text: `Debido a que por su construcción, este vehículo es capaz de alcanzar una velocidad máxima de Vmáx = ${neumaticos.velocidadMaximaAntes} Km/h, superior al índice de velocidad de los neumáticos instalados, se deberá instalar una pegatina limitadora de velocidad de Vmáx = ${neumaticos.velocidadMaximaDespues} Km/h, visible desde el puesto de conducción.`,
            }),
          ],
        })
      );
    }
  }

  //
  // 5) SEPARADORES DE RUEDA
  //
  const separadoresruedas = modificaciones.find(
    (m) => m.nombre === 'SEPARADORES DE RUEDA' && m.seleccionado
  );
  if (separadoresruedas) {
    raw = `- ${separadoresruedas.accion} de separadores de rueda en eje trasero marca ${separadoresruedas.marcaSeparadores}, referencia ${separadoresruedas.referenciaSeparadores}, de ${separadoresruedas.grosorSeparadores} de espesor fabricados en duraluminio, asegurando la no interferencia entre la rueda y ningún punto de la carrocería.`;

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
      m.detalle?.aletines
  );
  if (aletines) {
    raw = `- ${aletines.accion} de los aletines originales por otros, marca ${
      modificaciones.find((m) => m.nombre === 'ALETINES Y SOBREALETINES')!
        .marcaAletines
    }, referencia ${
      modificaciones.find((m) => m.nombre === 'ALETINES Y SOBREALETINES')!
        .referenciaAletines
    }, de material plástico ABS y ancho de ${
      modificaciones.find((m) => m.nombre === 'ALETINES Y SOBREALETINES')!
        .anchoAletines
    } mm. Se asegura la no interferencia entre el neumático y ningún punto de la carrocería.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  const sobrealetines = modificaciones.find(
    (m) =>
      m.nombre === 'ALETINES Y SOBREALETINES' &&
      m.seleccionado &&
      m.detalle?.aletines
  );
  if (sobrealetines) {
    raw = `- ${
      sobrealetines.accion
    } de sobrealetines en los cuatro pasos de rueda fabricados en goma de forma artesanal de ${
      modificaciones.find((m) => m.nombre === 'ALETINES Y SOBREALETINES')!
        .anchoSobrealetines
    } mm de ancho, asegurando la no interferencia entre el neumático y cualquier punto de la carrocería.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 7) SNORKEL
  //
  const snorkel = modificaciones.find(
    (m) => m.nombre === 'SNORKEL' && m.seleccionado && m.detalle?.aletines
  );
  if (snorkel) {
    raw = `- ${snorkel.accion} de Snorkel fabricado en material ${snorkel.materialSnorkel}, de marca ${snorkel.marcaSnorkel}, con medidas ${snorkel.medidasSnorkel}, garantizando que se respeta la admisión original del vehículo y que los nuevos conductos tienen una sección superior a la del filtro de admisión original.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 8) PARAGOLPES DELANTERO
  //
  const paradelante = modificaciones.find(
    (m) =>
      m.nombre === 'PARAGOLPES DELANTERO' &&
      m.seleccionado &&
      m.detalle?.aletines
  );
  if (paradelante) {
    const fraseParagolpesDelantero =
      paradelante.tipoFabricacionParagolpesDelantero === 'comercial'
        ? `${paradelante.accion} de paragolpes delantero marca ${paradelante.marcaParagolpes}, referencia ${paradelante.referenciaParagolpes} de medidas ${paradelante.medidasParagolpesDelantero} mm.`
        : `${paradelante.accion} de paragolpes delantero fabricado en acero de forma artesanal de medidas ${paradelante.medidasParagolpesDelantero} mm.`;

    raw = `- ${fraseParagolpesDelantero}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 9) PARAGOLPES TRASERO
  //
  const paratras = modificaciones.find(
    (m) =>
      m.nombre === 'PARAGOLPES TRASERO' && m.seleccionado && m.detalle?.aletines
  );
  if (paratras) {
    const fraseParagolpesTrasero =
      paratras.tipoFabricacionParagolpesTrasero === 'comercial'
        ? `${paratras.accion} de paragolpes trasero marca ${paratras.marcaParagolpesTrasero}, referencia ${paratras.referenciaParagolpesTrasero} de medidas ${paratras.medidasParagolpesTrasero} mm.`
        : `${paratras.accion} de paragolpes trasero fabricado en acero de forma artesanal de medidas ${paratras.medidasParagolpesTrasero} mm.`;

    raw = `- ${fraseParagolpesTrasero}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 10) CABRESTANTE
  //
  const cabrestante = modificaciones.find(
    (m) => m.nombre === 'CABRESTANTE' && m.seleccionado && m.detalle?.aletines
  );
  if (cabrestante) {
    raw = `- ${cabrestante.accion} de cabrestante en la parte delantera del vehículo con marca ${cabrestante.marcaCabrestante}, con carga vertical de ${cabrestante.capacidadCabrestanteLb} LB (${cabrestante.capacidadCabrestanteKg} Kg). Este dispositivo solamente puede funcionar en estacionario mediante relé.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 11) ANTIEMPOTRAMIENTO
  //
  const antiempotramiento = modificaciones.find(
    (m) =>
      m.nombre === 'ANTIEMPOTRAMIENTO' && m.seleccionado && m.detalle?.aletines
  );
  if (antiempotramiento) {
    raw = `- ${antiempotramiento.accion} de barra trasera de antiempotramiento, fabricada en acero de forma artesanal de medidas ${antiempotramiento.medidasAntiempotramiento} mm, ubicada bajo paragolpes posterior.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 12) SOPORTES PARA LUCES DE USO ESPECÍFICO
  //
  const soporteslucesespecificas = modificaciones.find(
    (m) =>
      m.nombre === 'ANTIEMPOTRAMIENTO' && m.seleccionado && m.detalle?.aletines
  );
  if (soporteslucesespecificas) {
    raw = `- ${soporteslucesespecificas.accion} de soporte para luces de uso específico en condiciones reglamentarias ${soporteslucesespecificas.ubicacionLucesEspecificas}, fabricado en acero de medidas ${soporteslucesespecificas.medidasLucesEspecificas} mm.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 13) SOPORTE PARA RUEDA DE REPUESTO
  //
  const soportesruedarepuesto = modificaciones.find(
    (m) =>
      m.nombre === 'SOPORTE PARA RUEDA DE REPUESTO' &&
      m.seleccionado &&
      m.detalle?.aletines
  );
  if (soportesruedarepuesto) {
    const textoRueda =
      soportesruedarepuesto.tipoFabricacionRuedaRepuesto === 'comercial'
        ? `${soportesruedarepuesto.accion} de soporte para rueda de repuesto marca ${soportesruedarepuesto.marcaRuedaRepuesto}, referencia ${soportesruedarepuesto.referenciaRuedaRepuesto} de medidas ${soportesruedarepuesto.medidasRuedaRepuesto} mm.`
        : `${soportesruedarepuesto.accion} de soporte para rueda de repuesto fabricado en acero de forma artesanal de medidas ${soportesruedarepuesto.medidasRuedaRepuesto} mm.`;

    raw = `- ${textoRueda}`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 14) SUSPENSIÓN
  //
  const suspension = modificaciones.find(
    (m) => m.nombre === 'SUSPENSIÓN' && m.seleccionado && m.detalle?.aletines
  );
  if (suspension) {
    raw = `- Modificación del sistema de suspensión del vehículo instalando: ${suspension.descripcionSuspensionDelantera}.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 15) TODA LA CASUÍSTICA DE MUELLES, BALLESTAS Y AMORTIGUADORES QUE SE PUEDEN DAR
  //
  mod = modificaciones.find(
    (m) =>
      m.nombre ===
        'TODA LA CASUÍSTICA DE MUELLES, BALLESTAS Y AMORTIGUADORES QUE SE PUEDEN DAR' &&
      m.seleccionado
  )!;

  // 1) Muelles delanteros con referencia
  if (mod) {
    if (mod.detallesMuelles?.['muelleDelanteroConRef']) {
      raw = `- Muelles delanteros marca ${mod.marcaMuelleDelanteroConRef} referencia ${mod.referenciaMuelleDelanteroConRef}.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
    }

    // 2) Muelles delanteros sin referencia
    if (mod.detallesMuelles?.['muelleDelanteroSinRef']) {
      raw = `- Muelles delanteros marca ${mod.marcaMuelleDelanteroSinRef}, sin referencia de dimensiones:`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
      const indentLeft = 620;
      const spacing = { line: 260, after: 120 };
      out.push(
        new Paragraph({
          indent: { left: indentLeft },
          spacing,
          children: [
            new TextRun(
              `• Diámetro exterior ${mod.diametroExteriorDelantero} mm`
            ),
          ],
        }),
        new Paragraph({
          indent: { left: indentLeft },
          spacing,
          children: [
            new TextRun(`• Longitud de muelle ${mod.longitudDelantero} mm`),
          ],
        }),
        new Paragraph({
          indent: { left: indentLeft },
          spacing,
          children: [
            new TextRun(
              `• Diámetro de la espira ${mod.diametroEspiraDelantero} mm`
            ),
          ],
        }),
        new Paragraph({
          indent: { left: indentLeft },
          spacing,
          children: [
            new TextRun(`• Número de espiras ${mod.numeroEspirasDelantero}.`),
          ],
        })
      );
    }

    // 3) Ballesta delantera
    if (mod.detallesMuelles?.['ballestaDelantera']) {
      raw = `- Ballesta delantera marca ${mod.marcaBallestaDelantera} referencia ${mod.referenciaBallestaDelantera}.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
    }

    // 4) Amortiguador delantero
    if (mod.detallesMuelles?.['amortiguadorDelantero']) {
      raw = `- Amortiguadores delanteros marca ${mod.marcaAmortiguadorDelantero} referencia ${mod.referenciaAmortiguadorDelantero}.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
    }

    // 5) Amortiguador trasero
    if (mod.detallesMuelles?.['amortiguadorTrasero']) {
      raw = `- Amortiguadores traseros marca ${mod.marcaAmortiguadorTrasero} referencia ${mod.referenciaAmortiguadorTrasero}.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
    }

    // 6) Tacos de goma
    if (mod.detallesMuelles?.['tacosDeGoma']) {
      raw = `- Instalación de tacos de goma sobre amortiguadores delanteros de ${mod.diametroTacoDelantero} mm de diámetro y ${mod.espesorTacoDelantero} mm de espesor, y traseros de ${mod.diametroTacoTrasero} mm de diámetro y ${mod.espesorTacoTrasero} mm de espesor.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
    }

    // 7) Kit de elevación (delantero, trasero o ambos)
    if (
      mod.detallesMuelles?.['kitElevacionDelantero'] ||
      mod.detallesMuelles?.['kitElevacionTrasero']
    ) {
      // 1) LÍNEA PRINCIPAL
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
        `, fabricados en aluminio marca ` +
        marcas.join(' y ') +
        `, compuestos por:`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);

      // 2) DETALLE MUELLES DELANTEROS
      if (mod.detallesMuelles?.['kitElevacionDelantero']) {
        raw =
          `• Muelles delanteros: taco ${mod.tipoTacoDelantero} de aluminio de ` +
          `${mod.diametroTacoDelantero} mm Ø y ` +
          `${mod.espesorTacoDelantero} mm de espesor ` +
          `instalado en cada muelle delantero, marca ${mod.marcaKitElevacionDelantera}.`;

        const p = new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        });
        (p as any)._rawText = raw;
        out.push(p);
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
          `${mod.diametroTacoTrasero} x ${mod.espesorTacoTrasero} mm de espesor ` +
          `sobre ballesta trasera, marca ${mod.marcaKitElevacionTrasera}.`;

        const p = new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        });
        (p as any)._rawText = raw;
        out.push(p);
      }
    }

    // 8) Nota final
    if (mod.anotacion) {
      raw = `Estos dispositivos no modifican las condiciones técnicas de dirección. Se asegura la no interferencia entre los neumáticos y ningún punto de la carrocería.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
    }
  }

  //
  // 16) MATRÍCULA Y PORTAMATRÍCULA
  //
  mod = modificaciones.find(
    (m) => m.nombre === 'MATRÍCULA Y PORTAMATRÍCULA' && m.seleccionado
  )!;

  // 1) Instalación
  if (mod) {
    if (
      mod.detalle?.instalacionPorta &&
      mod.fabricacionPorta1 === 'artesanal'
    ) {
      raw = `- ${mod.accion} de portamatrículas ${mod.ubicacionPorta1} en el lado ${mod.ladoPorta1} fabricado en ${mod.materialPorta1} de forma artesanal.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
    } else {
      raw = `- ${mod.accion} de portamatrículas ${mod.ubicacionPorta1} en el lado ${mod.ladoPorta1} fabricado en ${mod.materialPorta1} de la marca ${mod.marcaPorta1} y referencia ${mod.referenciaPorta1}.`;

      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      out.push(p);
    }

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
    (m) => m.nombre === 'DEFENSA DELANTERA' && m.seleccionado
  );
  if (defensadelantera) {
    raw =
      `- ${defensadelantera.accion} de defensa integral delantera ${defensadelantera.marcaDefensa}` +
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
  }

  //
  // 18) AMORTIGUADOR DE DIRECCIÓN
  //
  const amortiguadoresdireccion = modificaciones.find(
    (m) => m.nombre === 'AMORTIGUADOR DE DIRECCIÓN' && m.seleccionado
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
    (m) => m.nombre === 'BARRA DE DIRECCIÓN' && m.seleccionado
  );
  if (barradireeccion) {
    raw =
      `- ${barradireeccion.accion} de barra de dirección reforzada, marca ${barradireeccion.marcaBarraDireccion}. ` +
      `Esta barra es una sustitución de la original, está anclada sobre anclajes originales, ` +
      `tiene un diámetro superior al de origen y es de material más resistente.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 20) BARRA PARA REGULAR LA CONVERGENCIA DE LAS RUEDAS (alineamiento)
  //
  const barraalineamiento = modificaciones.find(
    (m) =>
      m.nombre ===
        'BARRA PARA REGULAR LA CONVERGENCIA DE LAS RUEDAS (alineamiento)' &&
      m.seleccionado
  );
  if (barraalineamiento) {
    raw = `- ${barraalineamiento.accion} de barra para regular la convergencia de ambas ruedas delanteras al mismo valor regulable y reforzada, marca ${barraalineamiento.marcaConvergencia}. Esta barra es una sustitución de la original, está anclada sobre anclajes originales, tiene un diámetro superior a la de origen, es de material más resistente.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 21) BARRA PARA REGULAR LA CONVERGENCIA DE LAS RUEDAS (movimiento lateral)
  //
  const barramovimientolateral = modificaciones.find(
    (m) =>
      m.nombre ===
        'BARRA PARA REGULAR LA CONVERGENCIA DE LAS RUEDAS (alineamiento)' &&
      m.seleccionado
  );
  if (barramovimientolateral) {
    const regulable = mod.regulable === true ? 'regulable' : 'no regulable';
    raw = `- ${barramovimientolateral.accion} de barra de Panhard ${regulable} marca ${barramovimientolateral.marcaConvergenciaReg} referencia ${barramovimientolateral.referenciaConvergenciaReg}. Esta barra es una sustitución de la original, está anclada sobre anclajes originales, tiene un diámetro superior a la de origen, es de material más resistente.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 22) FAROS DELANTEROS PRINCIPALES
  //
  const farosdelanterosprincipales = modificaciones.find(
    (m) => m.nombre === 'FAROS DELANTEROS PRINCIPALES' && m.seleccionado
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
    (m) => m.nombre === 'LUZ DE CRUCE' && m.seleccionado
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
    (m) => m.nombre === 'LUCES DE LARGO ALCANCE' && m.seleccionado
  );
  if (luzdelargo) {
    raw = `- ${luzdelargo.accion} de luces de largo alcance marca ${luzdelargo.marca} ref. ${luzdelargo.referencia} con marcaje ${luzdelargo.marcaje} y contraseña de homologación ${luzdelargo.homologacion}, índice de referencia ${luzdelargo.indiceReferencia} pdl/ud sin superar los 100 puntos de luz ni 430000 candelas, conectados al mando original.`;

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
    (m) => m.nombre === 'LUZ DE POSICIÓN' && m.seleccionado
  );
  if (luzdeposicion) {
    const esLed = mod.esLed === true ? 'LED' : 'tradicional';
    raw = `- ${luzdeposicion.accion} de luz de posición con sistema ${esLed} marca ${luzdeposicion.marcaPosicion} con marcaje ${luzdeposicion.marcajePosicion} y contraseña de homologación ${luzdeposicion.homologacionPosicion}, accionada desde los mandos originales.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },

      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 26) 3ª LUZ DE FRENO
  //
  const luz3defreno = modificaciones.find(
    (m) => m.nombre === '3ª LUZ DE FRENO' && m.seleccionado
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
    (m) => m.nombre === 'DIURNAS' && m.seleccionado
  );
  if (luzdiurna) {
    raw = `- ${luzdiurna.accion} de luces diurnas marca ${luzdiurna.marcaDiurnas} con contraseña de homologación ${luzdiurna.homologacionDiurnas}.`;

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
    (m) => m.nombre === 'ANTINIEBLA' && m.seleccionado
  );
  if (luzantiniebla) {
    raw = `- ${luzantiniebla.accion} de luces antiniebla marca ${luzantiniebla.marcaAntiniebla} con contraseña de homologación ${luzantiniebla.homologacionAntiniebla}.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },

      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 29) PILOTO TRASERO
  //
  const luztrasero = modificaciones.find(
    (m) => m.nombre === 'PILOTO TRASERO' && m.seleccionado
  );
  if (luztrasero) {
    mod = modificaciones.find(
      (m) => m.nombre === 'PILOTO TRASERO' && m.seleccionado
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
    if (mod.detalle?.marchaAtras) {
      raw = `• Marcha atrás ${mod.referenciaMarchaAtras}`;

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
  }

  //
  // 30) INTERMITENTES
  //
  const intermitentes = modificaciones.find(
    (m) => m.nombre === 'INTERMITENTES' && m.seleccionado
  );
  if (intermitentes) {
    raw = `Sustitución de los intermitentes delanteros por otros con marcaje ${intermitentes.marcajeIntermitentes} y contraseña de homologación ${intermitentes.homologacionIntermitentes}, Los intermitentes delanteros originales quedan inhabilitados.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 31) SUSTITUCIÓN DE EJES
  //
  const sustiejes = modificaciones.find(
    (m) => m.nombre === 'SUSTITUCIÓN DE EJES' && m.seleccionado
  );
  if (sustiejes) {
    raw = `- Sustitución del eje delantero por otro procedente de un vehículo marca ${data.marca} denominación comercial ${data.denominacion}, con contraseña de homologación de tipo ${data.homologacion}.`;

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
    (m) => m.nombre === 'ESTRIBOS LATERALES O TALONERAS' && m.seleccionado
  );
  if (estribostaloneras) {
    raw = `- ${estribostaloneras.accion} de ${estribostaloneras.estribosotaloneras} laterales marca ${estribostaloneras.marcataloneras} fabricados en ${estribostaloneras.materialEstribos}, de dimensiones ${estribostaloneras.dimensionesTaloneras}mm.`;

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
  const sliced = raw.length > 2 ? raw.slice(2).trim() : raw.trim();
  return sliced.split(/\s+/)[0] || '';
}

export function generarDocumentoProyectoParagraphs(
  modificaciones: {
    modificaciones: Modificacion[];
  },
  data: any
): Paragraph[] {
  const all = buildModificacionesParagraphs(
    modificaciones.modificaciones,
    data
  );

  all.forEach((p, i) => console.log(i, getFirstWord(p)));

  // 2) Filtra cada grupo según la primera palabra
  const montajes = all.filter(
    (p) => !['Variación', 'Sustitución', 'Desmontaje'].includes(getFirstWord(p))
  );
  const variacionesYSus = all.filter((p) =>
    ['Variación', 'Sustitución'].includes(getFirstWord(p))
  );
  const desmontajes = all.filter((p) =>
    ['Desmontaje'].includes(getFirstWord(p))
  );

  // 3) Función helper para encabezado + contenido
  const out: Paragraph[] = [];
  const appendSection = (title: string, paras: Paragraph[]) => {
    out.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 260, after: 120 },
        children: [new TextRun({ text: title, bold: true, color: '000000' })],
      })
    );
    if (paras.length) {
      out.push(...paras);
    } else {
      out.push(
        new Paragraph({
          indent: { left: 400 },
          children: [new TextRun({ text: '- No procede.', italics: true })],
        })
      );
    }
  };

  appendSection('1.6.1- Desmontajes realizados', desmontajes);
  appendSection('1.6.2- Variaciones y sustituciones', variacionesYSus);
  appendSection('1.6.3- Montajes realizados', montajes);

  return out;
}
