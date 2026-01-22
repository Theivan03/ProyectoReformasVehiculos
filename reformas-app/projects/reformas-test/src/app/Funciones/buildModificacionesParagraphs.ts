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

export function buildModificacionesParagraphs(
  modificaciones: Modificacion[],
  data: any,
): Paragraph[] {
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
      const raw = `- ${accion} de enganche de remolque homologado en emplazamiento también homologado, consistente en: soporte marca ${remolquehomologado.marcaBarra}, tipo ${remolquehomologado.tipoBarra}, clase ${remolquehomologado.tipoBarra}, contraseña de homologación ${remolquehomologado.tipoBarra}, para una MMR en remolques de eje central ${remolquehomologado.mmrEjeCentral} kg y de barra de tracción ${remolquehomologado.mmrBarraTraccion} kg.`;

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
    const raw = `- Desmontaje de plazas de asiento pasando de ${reduccionplazas.plazasAntes} a ${reduccionplazas.plazasDespues} mediante la desinstalación del cinturón de seguridad y el anclaje de la plaza ${reduccionplazas.enclaje}.`;

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
      }),
    );
  }

  //
  // 4) NEUMÁTICOS
  //
  const neumaticos = modificaciones.find(
    (m) => m.nombre === 'NEUMÁTICOS' && m.seleccionado,
  );
  if (neumaticos) {
    const medidaNeumatico = data.neumaticoDespues || '---';
    const medidaLlantas = neumaticos.medidas || '---';
    const raw = `- Sustitución de neumáticos en ambos ejes por otros homologados de medidas no equivalentes ${medidaNeumatico}, montados sobre llantas de medidas ${medidaLlantas}, asegurando la compatibilidad llanta-neumático y la no interferencia entre los neumáticos y ningún punto de la carrocería.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });

    (p as any)._rawText = raw;
    out.push(p);

    if (neumaticos.anotacion1) {
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
        }),
      );
    }

    if (neumaticos.anotacion2) {
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
        }),
      );
    }
  }

  //
  // 5) SEPARADORES DE RUEDA
  //
  const separadoresruedas = modificaciones.find(
    (m) => m.nombre === 'SEPARADORES DE RUEDA' && m.seleccionado,
  );
  if (separadoresruedas) {
    separadoresruedas.acciones?.forEach((accion: string) => {
      const raw = `- ${accion} de separadores de rueda en eje trasero marca ${separadoresruedas.marcaSeparadores}, referencia ${separadoresruedas.referenciaSeparadores}, de ${separadoresruedas.grosorSeparadores} de espesor fabricados en duraluminio, asegurando la no interferencia entre la rueda y ningún punto de la carrocería.`;

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
  // 6) ALETINES Y SOBREALETINES
  //
  const aletines = modificaciones.find(
    (m) =>
      m.nombre === 'ALETINES Y SOBREALETINES' &&
      m.seleccionado &&
      m.detalle?.aletines,
  );
  if (aletines) {
    (aletines.acciones || []).forEach((accion: string) => {
      const raw = `- ${accion} de los aletines originales por otros, marca ${
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
    });
  }

  const sobrealetines = modificaciones.find(
    (m) =>
      m.nombre === 'ALETINES Y SOBREALETINES' &&
      m.seleccionado &&
      m.detalle?.sobrealetines,
  );
  if (sobrealetines) {
    (sobrealetines.acciones || []).forEach((accion: string) => {
      const raw = `- ${accion} de sobrealetines en los cuatro pasos de rueda fabricados en goma de forma artesanal de ${
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
    soporteslucesespecificas.acciones?.forEach((accion: string) => {
      const raw = `- ${accion} de soporte para luces de uso específico en condiciones reglamentarias ${soporteslucesespecificas.ubicacionLucesEspecificas}, fabricado en acero de medidas ${soporteslucesespecificas.medidasLucesEspecificas} mm.`;

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
  // 14) SUSPENSIÓN
  //
  const suspension = modificaciones.find(
    (m) => m.nombre === 'SUSPENSIÓN' && m.seleccionado,
  );
  if (suspension) {
    suspension.acciones?.forEach((accion: string) => {
      const raw = `- ${accion} del sistema de suspensión del vehículo instalando: ${suspension.descripcionSuspensionDelantera}.`;

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
    if (mod.detallesMuelles?.['muelleDelanteroConRef']) {
      raw = `- Muelles delanteros marca ${mod.marcaMuelleDelanteroConRef} referencia ${mod.referenciaMuelleDelanteroConRef}.`;

      // Párrafo principal
      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      (p as any)._fromCasuistica = true; // 👈 marca
      out.push(p);

      const indentLeft = 620;
      const spacing = { line: 260, after: 120 };

      // Subpárrafos (viñetas)
      const p1 = new Paragraph({
        indent: { left: indentLeft },
        spacing,
        children: [
          new TextRun(
            `• Diámetro exterior ${mod.diametroExteriorDelanteroRef} mm`,
          ),
        ],
      });
      (p1 as any)._rawText =
        `• Diámetro exterior ${mod.diametroExteriorDelanteroRef} mm`;
      (p1 as any)._fromCasuistica = true; // 👈 marca
      out.push(p1);

      const p2 = new Paragraph({
        indent: { left: indentLeft },
        spacing,
        children: [
          new TextRun(
            `• Longitud de muelle ${mod.longitudLibreDelanteroRef} mm`,
          ),
        ],
      });
      (p2 as any)._rawText =
        `• Longitud de muelle ${mod.longitudLibreDelanteroRef} mm`;
      (p2 as any)._fromCasuistica = true;
      out.push(p2);

      const p3 = new Paragraph({
        indent: { left: indentLeft },
        spacing,
        children: [
          new TextRun(
            `• Diámetro de la espira ${mod.diametroEspiraDelanteroRef} mm`,
          ),
        ],
      });
      (p3 as any)._rawText =
        `• Diámetro de la espira ${mod.diametroEspiraDelanteroRef} mm`;
      (p3 as any)._fromCasuistica = true;
      out.push(p3);

      const p4 = new Paragraph({
        indent: { left: indentLeft },
        spacing,
        children: [
          new TextRun(`• Número de espiras ${mod.numeroEspirasDelanteroRef}.`),
        ],
      });
      (p4 as any)._rawText =
        `• Número de espiras ${mod.numeroEspirasDelanteroRef}.`;
      (p4 as any)._fromCasuistica = true;
      out.push(p4);
    }

    // 2) Muelles delanteros sin referencia
    if (mod.detallesMuelles?.['muelleDelanteroSinRef']) {
      raw = `- Muelles delanteros marca ${mod.marcaMuelleDelanteroSinRef}, sin referencia de dimensiones:`;

      // Párrafo principal
      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      (p as any)._fromCasuistica = true; // 👈 marca
      out.push(p);

      const indentLeft = 620;
      const spacing = { line: 260, after: 120 };

      // Subpárrafos (viñetas)
      const p1 = new Paragraph({
        indent: { left: indentLeft },
        spacing,
        children: [
          new TextRun(
            `• Diámetro exterior ${mod.diametroExteriorDelanteroSinRef} mm`,
          ),
        ],
      });
      (p1 as any)._rawText =
        `• Diámetro exterior ${mod.diametroExteriorDelanteroSinRef} mm`;
      (p1 as any)._fromCasuistica = true; // 👈 marca
      out.push(p1);

      const p2 = new Paragraph({
        indent: { left: indentLeft },
        spacing,
        children: [
          new TextRun(
            `• Longitud de muelle ${mod.longitudLibreDelanteroSinRef} mm`,
          ),
        ],
      });
      (p2 as any)._rawText =
        `• Longitud de muelle ${mod.longitudLibreDelanteroSinRef} mm`;
      (p2 as any)._fromCasuistica = true;
      out.push(p2);

      const p3 = new Paragraph({
        indent: { left: indentLeft },
        spacing,
        children: [
          new TextRun(
            `• Diámetro de la espira ${mod.diametroEspiraDelanteroSinRef} mm`,
          ),
        ],
      });
      (p3 as any)._rawText =
        `• Diámetro de la espira ${mod.diametroEspiraDelanteroSinRef} mm`;
      (p3 as any)._fromCasuistica = true;
      out.push(p3);

      const p4 = new Paragraph({
        indent: { left: indentLeft },
        spacing,
        children: [
          new TextRun(
            `• Número de espiras ${mod.numeroEspirasDelanteroSinRef}.`,
          ),
        ],
      });
      (p4 as any)._rawText =
        `• Número de espiras ${mod.numeroEspirasDelanteroSinRef}.`;
      (p4 as any)._fromCasuistica = true;
      out.push(p4);
    }

    // 2.1) Muelles traseros con referencia
    if (mod.detallesMuelles?.['muelleTraseroConRef']) {
      raw = `- Muelles traseros marca ${mod.marcaMuelleTraseroConRef} referencia ${mod.referenciaMuelleTraseroConRef}.`;

      // Párrafo principal
      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      (p as any)._fromCasuistica = true; // 👈 marca
      out.push(p);

      const indentLeft = 620;
      const spacing = { line: 260, after: 120 };

      // Subpárrafos (viñetas)
      const p1 = new Paragraph({
        indent: { left: indentLeft },
        spacing,
        children: [
          new TextRun(
            `• Diámetro exterior ${mod.diametroExteriorTraseroRef} mm`,
          ),
        ],
      });
      (p1 as any)._rawText =
        `• Diámetro exterior ${mod.diametroExteriorTraseroRef} mm`;
      (p1 as any)._fromCasuistica = true; // 👈 marca
      out.push(p1);

      const p2 = new Paragraph({
        indent: { left: indentLeft },
        spacing,
        children: [
          new TextRun(`• Longitud de muelle ${mod.longitudLibreTraseroRef} mm`),
        ],
      });
      (p2 as any)._rawText =
        `• Longitud de muelle ${mod.longitudLibreTraseroRef} mm`;
      (p2 as any)._fromCasuistica = true;
      out.push(p2);

      const p3 = new Paragraph({
        indent: { left: indentLeft },
        spacing,
        children: [
          new TextRun(
            `• Diámetro de la espira ${mod.diametroEspiraTraseroRef} mm`,
          ),
        ],
      });
      (p3 as any)._rawText =
        `• Diámetro de la espira ${mod.diametroEspiraTraseroRef} mm`;
      (p3 as any)._fromCasuistica = true;
      out.push(p3);

      const p4 = new Paragraph({
        indent: { left: indentLeft },
        spacing,
        children: [
          new TextRun(`• Número de espiras ${mod.numeroEspirasTraseroRef}.`),
        ],
      });
      (p4 as any)._rawText =
        `• Número de espiras ${mod.numeroEspirasTraseroRef}.`;
      (p4 as any)._fromCasuistica = true;
      out.push(p4);
    }

    // 2.2) Muelles traseros sin referencia
    if (mod.detallesMuelles?.['muelleTraseroSinRef']) {
      raw = `- Muelles traseros marca ${mod.marcaMuelleTraseroSinRef}, sin referencia de dimensiones:`;

      // Párrafo principal
      const p = new Paragraph({
        spacing: { line: 260, after: 120 },
        indent: { left: 400 },
        children: [new TextRun({ text: raw })],
      });
      (p as any)._rawText = raw;
      (p as any)._fromCasuistica = true; // 👈 marca
      out.push(p);

      const indentLeft = 620;
      const spacing = { line: 260, after: 120 };

      // Subpárrafos (viñetas)
      const p1 = new Paragraph({
        indent: { left: indentLeft },
        spacing,
        children: [
          new TextRun(`• Diámetro exterior ${mod.diametroExteriorTrasero} mm`),
        ],
      });
      (p1 as any)._rawText =
        `• Diámetro exterior ${mod.diametroExteriorTrasero} mm`;
      (p1 as any)._fromCasuistica = true; // 👈 marca
      out.push(p1);

      const p2 = new Paragraph({
        indent: { left: indentLeft },
        spacing,
        children: [
          new TextRun(`• Longitud de muelle ${mod.longitudTrasero} mm`),
        ],
      });
      (p2 as any)._rawText = `• Longitud de muelle ${mod.longitudTrasero} mm`;
      (p2 as any)._fromCasuistica = true;
      out.push(p2);

      const p3 = new Paragraph({
        indent: { left: indentLeft },
        spacing,
        children: [
          new TextRun(
            `• Diámetro de la espira ${mod.diametroEspiraTrasero} mm`,
          ),
        ],
      });
      (p3 as any)._rawText =
        `• Diámetro de la espira ${mod.diametroEspiraTrasero} mm`;
      (p3 as any)._fromCasuistica = true;
      out.push(p3);

      const p4 = new Paragraph({
        indent: { left: indentLeft },
        spacing,
        children: [
          new TextRun(`• Número de espiras ${mod.numeroEspirasTrasero}.`),
        ],
      });
      (p4 as any)._rawText = `• Número de espiras ${mod.numeroEspirasTrasero}.`;
      (p4 as any)._fromCasuistica = true;
      out.push(p4);
    }

    // 3) Ballesta delantera
    if (mod.detallesMuelles?.['ballestaDelantera']) {
      raw = `- Ballesta delantera marca ${mod.marcaBallestaDelantera} referencia ${mod.referenciaBallestaDelantera}.`;

      pushCasuistica(
        out,
        new Paragraph({
          spacing: { line: 260, after: 120 },
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
          spacing: { line: 260, after: 120 },
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
          spacing: { line: 260, after: 120 },
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
          spacing: { line: 260, after: 120 },
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

      pushCasuistica(
        out,
        new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        }),
        raw,
      );

      // 2) DETALLE MUELLES DELANTEROS
      if (mod.detallesMuelles?.['kitElevacionDelantero']) {
        raw =
          `• Muelles delanteros: taco ${mod.tipoTacoDelantero} de aluminio de ` +
          `${mod.diametroTacoDelantero} mm Ø y ` +
          `${mod.espesorTacoDelantero} mm de espesor ` +
          `instalado en cada muelle delantero, marca ${mod.marcaKitElevacionDelantera}.`;

        pushCasuistica(
          out,
          new Paragraph({
            spacing: { line: 260, after: 120 },
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
          `${mod.diametroTacoTrasero} x ${mod.espesorTacoTrasero} mm de espesor ` +
          `sobre ballesta trasera, marca ${mod.marcaKitElevacionTrasera}.`;

        pushCasuistica(
          out,
          new Paragraph({
            spacing: { line: 260, after: 120 },
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
          spacing: { line: 260, after: 120 },
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

      if (
        mod.detalle?.instalacionPorta &&
        mod.fabricacionPorta1 === 'artesanal'
      ) {
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
    if (Array.isArray(defensadelantera.acciones)) {
      defensadelantera.acciones.forEach((accion: string) => {
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

  //
  // 28) ANTINIEBLA
  //
  const luzantiniebla = modificaciones.find(
    (m) => m.nombre === 'ANTINIEBLA' && m.seleccionado,
  );
  if (luzantiniebla) {
    if (Array.isArray(luzantiniebla?.acciones)) {
      luzantiniebla.acciones.forEach((accion: string) => {
        const raw = `- ${accion} de luces antiniebla marca ${luzantiniebla.marcaAntiniebla} con contraseña de homologación ${luzantiniebla.homologacionAntiniebla}.`;

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
    (m) => m.nombre === 'INTERMITENTES' && m.seleccionado,
  );
  if (intermitentes) {
    let posicion = ' ';

    if (intermitentes.detalle?.interDelantero) {
      posicion = `delanteros`;
    } else if (intermitentes.detalle?.interTrasero) {
      posicion = `traseros`;
    } else if (intermitentes.detalle?.interLateral) {
      posicion = `laterales`;
    } else if (
      intermitentes.detalle?.interLateral &&
      intermitentes.detalle?.interTrasero
    ) {
      posicion = `laterales y traseros`;
    } else if (
      intermitentes.detalle?.interDelantero &&
      intermitentes.detalle?.interTrasero
    ) {
      posicion = `delanteros y traseros`;
    } else if (
      intermitentes.detalle?.interLateral &&
      intermitentes.detalle?.interDelantero
    ) {
      posicion = `laterales y delanteros`;
    }

    let raw = `- Sustitución de los intermitentes ${posicion} por otros con marcaje ${intermitentes.marcajeIntermitentes} y contraseña de homologación ${intermitentes.homologacionIntermitentes}, Los intermitentes delanteros originales quedan inhabilitados.`;

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
    if (llantas.neumaticosMoto === 'delantero') {
      if (Array.isArray(llantas?.acciones)) {
        llantas.acciones.forEach((accion: string) => {
          const raw = `- ${accion} de neumático ${llantas.neumaticosMoto} por otro de medidas no equivalentes ${llantas.neumaticoDelantero} sobre llanta de medidas ${llantas.medidasLlantaDelantero}. Asegurando la compatibilidad entre llanta y neumático y la no interferencia entre el neumático y cualquier punto de la carrocería.`;

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
    if (llantas.neumaticosMoto === 'trasero') {
      if (Array.isArray(llantas?.acciones)) {
        llantas.acciones.forEach((accion: string) => {
          const raw = `- ${accion} de neumático ${llantas.neumaticosMoto} por otro de medidas no equivalentes ${llantas.neumaticoTrasero} sobre llanta de medidas ${llantas.medidasLlantaTrasero}. Asegurando la compatibilidad entre llanta y neumático y la no interferencia entre el neumático y cualquier punto de la carrocería.`;

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
    if (llantas.neumaticosMoto === 'delantero y trasero') {
      if (Array.isArray(llantas?.acciones)) {
        llantas.acciones.forEach((accion: string) => {
          const raw = `- ${accion} de neumáticos ${llantas.neumaticosMoto} por otro de medidas no equivalentes ${llantas.neumaticoDelantero} sobre llanta de medidas ${llantas.medidasLlantas} en la parte delantera y en la parte trasera ${llantas.neumaticoTrasero} sobre llanta de medidas ${llantas.medidasLlantaTrasero}. Asegurando la compatibilidad entre llanta y neumático y la no interferencia entre el neumático y cualquier punto de la carrocería.`;

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
    (m) =>
      m.nombre === 'MANILLAR' && m.seleccionado && data.tipoVehiculo === 'moto',
  );
  if (manillar) {
    raw = `- Sustitución de manillar por otro marca ${manillar.marca} modelo ${manillar.modelo}.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 6) VELOCÍMETRO
  //
  const velocimetro = modificaciones.find(
    (m) =>
      m.nombre === 'VELOCÍMETRO' &&
      m.seleccionado &&
      data.tipoVehiculo === 'moto',
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
    (m) =>
      m.nombre === 'LATIGUILLOS' &&
      m.seleccionado &&
      data.tipoVehiculo === 'moto',
  );
  if (latiguillos) {
    raw = `- Sustitución de los latiguillos de freno por unos metálicos en los dos ejes. En el eje delantero se han instalado unos latiguillos metálicos marca ${latiguillos.marcaDelanteros} ref. ${latiguillos.referenciaDelanteros} y en el eje trasero unos latiguillos metálicos marca ${latiguillos.marcaTraseros} ref. ${latiguillos.referenciaTraseros}. Ambos son de la misma longitud y sección que los originales y van instalados en la misma ubicación y utilizan los anclajes originales.`;

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
    (m) =>
      m.nombre === 'RETROVISORES' &&
      m.seleccionado &&
      data.tipoVehiculo === 'moto',
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
    (m) =>
      m.nombre === 'HORQUILLA DELANTERA' &&
      m.seleccionado &&
      data.tipoVehiculo === 'moto',
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
    (m) =>
      m.nombre === 'DISCO DE FRENO Y PINZA DE FRENO' &&
      m.seleccionado &&
      data.tipoVehiculo === 'moto',
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

    //
    // 11) LUCES
    //
    const luces = modificaciones.find(
      (m) =>
        m.nombre === 'LUCES' && m.seleccionado && data.tipoVehiculo === 'moto',
    );
    if (luces) {
      if (data.luzGrupoOptico) {
        raw = `- Sustitución y reubicación de grupo óptico delantero por otro marca ${frenos.marca} modelo ${frenos.modelo} con luz de posición, cruce y carretera con los marcajes ${frenos.marcajes} y contraseña de homologación ${frenos.homologacion}.`;

        const p = new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        });
        (p as any)._rawText = raw;
        out.push(p);
      }

      if (data.intermitenteDelantero) {
        raw = `- Sustitución y reubicación de intermitentes anteriores en laterales de la horquilla, por otros marca ${frenos.marca}, referencia ${frenos.referencia} con marcaje ${frenos.marcajes} y con contraseña de homologación ${frenos.homologacion}.`;

        const p = new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        });
        (p as any)._rawText = raw;
        out.push(p);
      }

      if (data.intermitenteTrasero) {
        raw = `- Sustitución y reubicación de intermitentes posteriores en laterales del portamatrícula, por otros marca ${frenos.marca}, referencia ${frenos.referencia} con marcaje ${frenos.marcajes} y con contraseña de homologación ${frenos.homologacion}.`;

        const p = new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        });
        (p as any)._rawText = raw;
        out.push(p);
      }

      if (data.catadioptrico) {
        raw = `- Sustitución y reubicación de catadióptrico posterior en parte inferior de emplazamiento de placa de matrícula posterior, por otro marca ${frenos.marca} con marcaje ${frenos.marcajes} y con contraseña de homologación ${frenos.homologacion}.`;

        const p = new Paragraph({
          spacing: { line: 260, after: 120 },
          indent: { left: 400 },
          children: [new TextRun({ text: raw })],
        });
        (p as any)._rawText = raw;
        out.push(p);
      }

      if (data.luzMatricula) {
        raw = `- Sustitución y reubicación de luz de matrícula en parte superior de emplazamiento de placa matrícula, por otra marca ${frenos.marca} referencia ${frenos.marcaPastillaTrasera} con contraseña de homologación ${frenos.homologacion}.`;

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
  // CAMPERS
  //

  //
  // 1) CAMBIO DE CLASIFICACIÓN
  //
  const cambioclasi = modificaciones.find(
    (m) =>
      m.nombre === 'CAMBIO DE CLASIFICACIÓN' &&
      m.seleccionado &&
      data.tipoVehiculo === 'camper',
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
      m.seleccionado &&
      data.tipoVehiculo === 'camper',
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
    (m) =>
      m.nombre === 'INSTALACIÓN DE BASES GIRATORIAS' &&
      m.seleccionado &&
      data.tipoVehiculo === 'camper',
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
    (m) =>
      m.nombre === 'CALEFACCIÓN ESTACIONARIA' &&
      m.seleccionado &&
      data.tipoVehiculo === 'camper',
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
    (m) =>
      m.nombre === 'MOBILIARIO INTERIOR VEHÍCULO' &&
      m.seleccionado &&
      data.tipoVehiculo === 'camper',
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
        const raw = `o Instalación de un mueble alto situado en el lateral derecho fabricado en madera de forma artesanal de medidas ${mueble.medidas} con puerta abatible.`;

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
        const raw = `o Instalación de mueble bajo situado en la parte media del lateral izquierdo, fabricado en madera de forma artesanal, de medidas ${mueble.medidas} con ${mueble.cajones} cajones. En la parte superior se ubica una pila de acero de medidas 320x260mm y un grifo.`;

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
    if (mobil.opcionesMueble?.aseo && Array.isArray((mobil as any).aseo)) {
      (mobil as any).aseo.forEach((aseo: any) => {
        const raw = `o Instalación de aseo con persiana de medidas ${aseo.medidas} en su interior se ubica un ${aseo.descripcion}.`;

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
    (m) =>
      m.nombre === 'CLARABOYA' &&
      m.seleccionado &&
      data.tipoVehiculo === 'camper',
  );
  if (claraboya) {
    raw = `- Instalación en el techo del vehículo ${claraboya.cantidadClaraboya} claraboyas, marca ${claraboya.marcaClaraboya} modelo ${claraboya.modeloClaraboya} ${claraboya.descripcionClaraboya}, con contraseña de homologación ${claraboya.homologacionClaraboya}, sin afectar a la estructura principal del vehículo.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 8) VENTANA
  //
  const ventana = modificaciones.find(
    (m) =>
      m.nombre === 'VENTANA' &&
      m.seleccionado &&
      data.tipoVehiculo === 'camper',
  );
  if (ventana) {
    raw = `- Instalación de ${ventana.cantidadVentanas} ventanas abatibles/correderas ${ventana.descripcionVentana} marca ${ventana.marcaVentana} modelo ${ventana.modeloVentana} de dimensiones ${ventana.dimensionesVentana}mm y contraseña de homologación ${ventana.homologacionVentana}, sin afectar a la estructura principal del vehículo.`;

    const p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);
  }

  //
  // 9) DEPÓSITO DE AGUA SUCIA
  //
  const aguasucia = modificaciones.find(
    (m) =>
      m.nombre === 'DEPÓSITO DE AGUA SUCIA' &&
      m.seleccionado &&
      data.tipoVehiculo === 'camper',
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
    (m) =>
      m.nombre === 'DEPÓSITO DE AGUA LIMPIA' &&
      m.seleccionado &&
      data.tipoVehiculo === 'camper',
  );
  if (agualimpia) {
    raw = `- Instalación de depósito para agua limpia de ${agualimpia.litrosAguaLimpia} litros y medidas ${agualimpia.medidasAguaLimpia}mm en la parte trasera del lateral izquierdo.`;

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
    (m) =>
      m.nombre === 'BOMBA DE AGUA' &&
      m.seleccionado &&
      data.tipoVehiculo === 'camper',
  );
  if (bombaagua) {
    raw = `- Instalación de bomba de agua de 12V marca ${bombaagua.marcaBombaAgua} modelo ${bombaagua.modeloBombaAgua} ubicada en la parte trasera izquierda del vehículo.`;

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
    (m) =>
      m.nombre === 'REGISTRO DE LLENADO DE AGUA' &&
      m.seleccionado &&
      data.tipoVehiculo === 'camper',
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
    (m) =>
      m.nombre === 'TOMA EXTERIOR 230V' &&
      m.seleccionado &&
      data.tipoVehiculo === 'camper',
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
    (m) =>
      m.nombre === 'DUCHA EXTERIOR' &&
      m.seleccionado &&
      data.tipoVehiculo === 'camper',
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
    (m) =>
      m.nombre === 'INSTALACIÓN ELÉCTRICA' &&
      m.seleccionado &&
      data.tipoVehiculo === 'camper',
  );
  if (instalacionelectrica) {
    raw = `- Instalación de sistema solar fotovoltaico compuesto por:`;

    let p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);

    if (Array.isArray(instalacionelectrica.placasSolares)) {
      instalacionelectrica.placasSolares.forEach(
        (placa: any, index: number) => {
          raw = `o Placa solar monocristalina marca ${
            placa.marca || ''
          } modelo ${placa.modelo || ''} de ${
            placa.potencia || ''
          }W de dimensiones ${placa.dimensiones || ''}mm situada en ${
            placa.ubicacion || ''
          } del vehículo.`;

          const pPlaca = new Paragraph({
            spacing: { line: 260, after: 120 },
            indent: { left: 600 },
            children: [new TextRun({ text: raw })],
          });
          (pPlaca as any)._rawText = raw;
          out.push(pPlaca);
        },
      );
    }

    raw = `o ${instalacionelectrica.cantidadBaterias} batería auxiliar de ${instalacionelectrica.potenciaBaterias}V situada en ${instalacionelectrica.ubicacionBaterias}.`;

    p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 600 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);

    raw = `o Inversor ${instalacionelectrica.potenciaInversor} marca ${instalacionelectrica.marcaInversor} situado en ${instalacionelectrica.ubicacionInversor}. `;

    p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 600 },
      children: [new TextRun({ text: raw })],
    });
    (p as any)._rawText = raw;
    out.push(p);

    raw = `o Controlador de carga solar ${instalacionelectrica.modeloControlador} marca ${instalacionelectrica.marcaControlador} situado en ${instalacionelectrica.ubicacionControlador}.`;

    p = new Paragraph({
      spacing: { line: 260, after: 120 },
      indent: { left: 600 },
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
            text: 'Estos componentes únicamente podrán funcionar en estacionario, con el vehículo parado, mediante relé. Esta instalación es independiente de la principal y se desconecta automáticamente al arrancar el vehículo mediante relé.',
          }),
        ],
      }),
    );

    if (instalacionelectrica.instalacionesSecundarias) {
      const lines = instalacionelectrica.instalacionesSecundarias
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

  //
  // 17) TOLDO
  //
  const toldo = modificaciones.find(
    (m) =>
      m.nombre === 'TOLDO' && m.seleccionado && data.tipoVehiculo === 'camper',
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
  const sliced = raw.length > 2 ? raw.slice(2).trim() : raw.trim();
  return sliced.split(/\s+/)[0] || '';
}

export function generarDocumentoProyectoParagraphs(
  modificaciones: { modificaciones: Modificacion[] },
  data: any,
): Paragraph[] {
  const all = buildModificacionesParagraphs(
    modificaciones.modificaciones,
    data,
  );

  const first = (p: Paragraph) => getFirstWord(p); // tu helper existente

  // Clasificación base
  let montajesBase = all.filter(
    (p) =>
      !['Variación', 'Sustitucion', 'Desmontaje', '', ' '].includes(first(p)),
  );
  let desmontajesBase = all.filter((p) => first(p) === 'Desmontaje');
  let variacionesBase = all.filter((p) =>
    ['Variación', 'Sustitucion'].includes(first(p)),
  );

  // Párrafos de casuística (solo existen cuando la principal y la subopción están seleccionadas)
  const casuisticaParas = all.filter(
    (p: any) => (p as any)._fromCasuistica === true,
  );

  // Deduplicación por _rawText (si no existe, usa una firma rápida del contenido)
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

  // Añade casuística a los tres grupos
  const montajes = uniqueMerge(montajesBase, casuisticaParas);
  const desmontajes = uniqueMerge(desmontajesBase, casuisticaParas);
  const variacionesYSus = uniqueMerge(variacionesBase, casuisticaParas);

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

/** Reconstruye la lista "labels" como en la UI, en el mismo orden */
function buildLabelsFromMods(data: any): string[] {
  const labels: string[] = [];
  const mods = Array.isArray(data?.modificaciones) ? data.modificaciones : [];

  for (const mod of mods) {
    // 1) MOBILIARIO (igual que en la UI)
    if (mod?.seleccionado && mod?.nombre === 'MOBILIARIO INTERIOR VEHÍCULO') {
      mod.mueblesBajo?.forEach((m: any) =>
        labels.push(`Mueble bajo (${m?.medidas || 'sin medidas'})`),
      );
      mod.mueblesAlto?.forEach((m: any) =>
        labels.push(`Mueble alto (${m?.medidas || 'sin medidas'})`),
      );
      mod.mueblesAseo?.forEach((m: any) =>
        labels.push(`Aseo (${m?.medidas || 'sin medidas'})`),
      );
      continue;
    }

    // 2) CASUÍSTICA SUSPENSIÓN → sustituir por subapartados (solo true)
    if (isCasuisticaSuspension(mod?.nombre)) {
      const sublabels = expandSuspensionToLabels(mod?.detallesMuelles);
      if (sublabels.length > 0) labels.push(...sublabels);
      continue; // No añadimos el nombre genérico
    }

    // 3) Resto (solo seleccionadas)
    if (mod?.seleccionado) {
      labels.push(mod.nombre);
    }
  }

  return labels;
}

export function generarTablaLeyenda(data: any): Table {
  // 1) Reconstruir la lista igual que en la UI
  const labels = buildLabelsFromMods(data); // ← aquí está la clave

  // 2) Crear pares { numero, nombre } ya numerados
  const seleccionadas = labels.map((nombre: string, i: number) => ({
    numero: i + 1,
    nombre, // en minúsculas/mixto aquí; lo convertimos a MAYÚSCULAS al pintar
  }));

  // 3) Dividir en dos columnas equilibradas
  const mitad = Math.ceil(seleccionadas.length / 2);
  const col1 = seleccionadas.slice(0, mitad);
  const col2 = seleccionadas.slice(mitad);

  while (col2.length < col1.length) {
    col2.push({ numero: 0, nombre: '' });
  }

  // 4) Construir filas (con cabecera “LEYENDA”)
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

  return new Table({
    alignment: AlignmentType.CENTER,
    width: { size: 85, type: WidthType.PERCENTAGE },
    rows: filas,
  });
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
