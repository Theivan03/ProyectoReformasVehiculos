import {
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  ShadingType,
  HeadingLevel,
  AlignmentType,
  VerticalAlign,
  ImageRun,
  Alignment,
  BorderStyle,
  UnderlineType,
} from 'docx';
import { Modificacion } from '../interfaces/modificacion';

const CELL_MARGINS = {
  top: 40,
  bottom: 40,
  left: 100,
  right: 100,
};

function formatMedidasMueble(medidas: unknown): string {
  if (medidas === null || medidas === undefined) {
    return 'sin medidas';
  }

  if (typeof medidas === 'number') {
    return Number.isFinite(medidas) ? medidas.toString() : 'sin medidas';
  }

  const raw = String(medidas).trim();
  if (!raw) {
    return 'sin medidas';
  }

  const normalized = raw.toLowerCase().replace(/mm/g, '').replace(/\s+/g, '');
  const parts = normalized.split('x').map((part) => part.replace(',', '.'));
  const esFormatoDimensiones =
    parts.length >= 2 &&
    parts.every((part) => part !== '' && !Number.isNaN(Number(part)));

  return esFormatoDimensiones ? parts.join('x') : raw;
}

export async function buildCalculos(
  modificaciones: Modificacion[],
  data: any,
  memoria?: boolean,
): Promise<(Paragraph | Table)[]> {
  const out: (Paragraph | Table)[] = [];

  let url = `http://192.168.1.41:3000/imgs/firma-generada.png`;
  const response5 = await fetch(url);
  const imageBuffer5 = await response5.arrayBuffer();

  if (memoria) {
    out.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: '2.3 CÁLCULO DE ESFUERZOS Y RESISTENCIA DE LAS FIJACIONES',
            color: '000000',
            bold: true,
          }),
        ],
      }),
    );

    let contador = 1;
    let contador2 = 0;

    const aletines = modificaciones.find(
      (m) =>
        m.nombre === 'ALETINES Y SOBREALETINES' &&
        m.seleccionado &&
        m.detalle?.aletines,
    );
    if (aletines) {
      out.push(new Paragraph({ text: '' }));
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '2.3.' + contador + ' Aletines',
              bold: true,
            }),
          ],
        }),
      );

      contador++;

      aletines.radioCurvaRAletines = (aletines.radioCurvaRAletines ?? 0) * 100;

      const peso = 9.81 * (aletines.pesoPiezaKgAletines ?? 0);
      const fuerzafrenado = (aletines.pesoPiezaKgAletines ?? 0) * 10;
      const resistenciaaerodinamica =
        0.5 *
        (aletines.coefAerodinamicoCwAletines ?? 0) *
        (aletines.superficieFrontalM2Aletines ?? 0) *
        (aletines.densidadAireKgM3Aletines ?? 0) *
        (aletines.velocidadAireV2msAletines ?? 0) *
        (aletines.velocidadAireV2msAletines ?? 0);
      const fuerzacentrifuga =
        (aletines.pesoPiezaKgAletines ?? 0) *
        (((aletines.velocidadAireV2msAletines ?? 0) *
          (aletines.velocidadAireV2msAletines ?? 0)) /
          (aletines.radioCurvaRAletines ?? 0));
      const sumadelasfuerzas =
        peso + fuerzafrenado + resistenciaaerodinamica + fuerzacentrifuga;

      const tablaCaracteristicas = new Table({
        width: { size: 70, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: CELL_MARGINS,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'CARACTERÍSTICAS PARA FUERZA PRODUCIDA POR PRESIÓN DEL AIRE',
                      }),
                    ],
                  }),
                ],
                columnSpan: 2,
              }),
            ],
          }),
          ...[
            [
              'Cw=Coef. Aerodinámico',
              aletines.coefAerodinamicoCwAletines?.toFixed(2).toString() ??
                '---',
            ],
            [
              'A =área de la pieza (m²)',
              aletines.superficieFrontalM2Aletines?.toFixed(2).toString() ??
                '---',
            ],
            [
              'ρ (densidad del aire (Kg/m³)',
              aletines.densidadAireKgM3Aletines?.toFixed(2).toString() ?? '---',
            ],
            [
              'V² = velocidad del aire 140Km/h (m/s)',
              aletines.velocidadAireV2msAletines?.toFixed(2).toString() ??
                '---',
            ],
            [
              'R (radio de curva) m',
              aletines.radioCurvaRAletines?.toFixed(2).toString() ?? '---',
            ],
            [
              'K (coeficiente de seguridad)',
              aletines.coefSeguridadKAletines?.toFixed(2).toString() ?? '---',
            ],
          ].map(
            ([desc, val]) =>
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    verticalAlign: AlignmentType.CENTER,
                    children: [
                      new Paragraph({
                        text: desc,
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                  }),
                  new TableCell({
                    verticalAlign: AlignmentType.CENTER,
                    children: [new Paragraph(val)],
                  }),
                ],
              }),
          ),
        ],
      });

      const tablaFuerzas = new Table({
        width: { size: 80, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: ['FUERZAS QUE ACTÚAN SOBRE LA PIEZA (N)'].map(
              (heading) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  verticalAlign: VerticalAlign.CENTER,
                  columnSpan: 5,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: heading })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              'Peso',
              'Fuerza de frenado',
              'Resistencia aerodinámica',
              'Fuerza centrífuga',
              'Suma de fuerzas',
            ].map(
              (t) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: t })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              peso.toFixed(2).toString() ?? '---',
              fuerzafrenado.toFixed(2).toString() ?? '---',
              resistenciaaerodinamica.toFixed(2).toString() ?? '---',
              fuerzacentrifuga.toFixed(2).toString() ?? '---',
              sumadelasfuerzas.toFixed(2).toString() ?? '---',
            ].map(
              (v) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: v })],
                    }),
                  ],
                }),
            ),
          }),
        ],
      });

      const fuerzadediseno =
        sumadelasfuerzas * (aletines.coefSeguridadKAletines ?? 0);
      const fuerzamaximatornillostraccion =
        ((0.9 *
          (aletines.resTraccionMinTornillo88Kgmm2Aletines ?? 0) *
          (aletines.seccionResistenteAsAletines ?? 0)) /
          1.25) *
        (aletines.numTornillosAletines ?? 0);
      const fuerzamaximatornilloscortante =
        ((0.5 *
          (aletines.resTraccionMinTornillo88Kgmm2Aletines ?? 0) *
          (aletines.seccionResistenteAsAletines ?? 0)) /
          1.25) *
        (aletines.numTornillosAletines ?? 0);
      const comprobacion =
        fuerzadediseno / fuerzamaximatornilloscortante +
        fuerzadediseno / (1.4 * fuerzamaximatornillostraccion);

      const tablaComprobacion = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              'La fuerza de diseño soportada por los anclajes (N)',
              'Fuerza máxima que soportan los tornillos a tracción (N)',
              'Fuerza máxima que soportan los tornillos a cortante (N)',
              'Comprobación <= 1',
            ].map(
              (t) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: t, bold: true })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              fuerzadediseno.toFixed(2).toString() ?? '---',
              fuerzamaximatornillostraccion.toFixed(2).toString() ?? '---',
              fuerzamaximatornilloscortante.toFixed(2).toString() ?? '---',
              comprobacion.toFixed(2).toString() ?? '---',
            ].map(
              (v, i) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  shading:
                    i === 0
                      ? undefined
                      : i === 3 && comprobacion > 1
                        ? { type: ShadingType.CLEAR, fill: 'FF0000' }
                        : { type: ShadingType.CLEAR, fill: '00B050' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: v })],
                    }),
                  ],
                }),
            ),
          }),
        ],
      });

      out.push(tablaCaracteristicas);
      out.push(new Paragraph({ text: '' }));
      out.push(tablaFuerzas);
      out.push(new Paragraph({ text: '' }));
      out.push(tablaComprobacion);
    }

    const sobrealetines = modificaciones.find(
      (m) =>
        m.nombre === 'ALETINES Y SOBREALETINES' &&
        m.seleccionado &&
        m.detalle?.sobrealetines,
    );
    if (aletines) {
      out.push(new Paragraph({ text: '' }));
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '2.3.' + contador + ' Sobrealetines',
              bold: true,
            }),
          ],
        }),
      );

      contador++;

      aletines.radioCurvaRSobrealetines =
        (aletines.radioCurvaRSobrealetines ?? 0) * 100;

      const peso = 9.81 * (aletines.pesoPiezaKgSobrealetines ?? 0);
      const fuerzafrenado = (aletines.pesoPiezaKgSobrealetines ?? 0) * 10;
      const resistenciaaerodinamica =
        0.5 *
        (aletines.coefAerodinamicoCwSobrealetines ?? 0) *
        (aletines.superficieFrontalM2Sobrealetines ?? 0) *
        (aletines.densidadAireKgM3Sobrealetines ?? 0) *
        (aletines.velocidadAireV2msSobrealetines ?? 0) *
        (aletines.velocidadAireV2msSobrealetines ?? 0);
      const fuerzacentrifuga =
        (aletines.pesoPiezaKgSobrealetines ?? 0) *
        (((aletines.velocidadAireV2msSobrealetines ?? 0) *
          (aletines.velocidadAireV2msSobrealetines ?? 0)) /
          (aletines.radioCurvaRSobrealetines ?? 0));
      const sumadelasfuerzas =
        peso + fuerzafrenado + resistenciaaerodinamica + fuerzacentrifuga;

      const tablaCaracteristicas = new Table({
        width: { size: 70, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: CELL_MARGINS,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'CARACTERÍSTICAS PARA FUERZA PRODUCIDA POR PRESIÓN DEL AIRE',
                      }),
                    ],
                  }),
                ],
                columnSpan: 2,
              }),
            ],
          }),
          ...[
            [
              'Cw=Coef. Aerodinámico',
              aletines.coefAerodinamicoCwSobrealetines?.toFixed(2).toString() ??
                '---',
            ],
            [
              'A =área de la pieza (m²)',
              aletines.superficieFrontalM2Sobrealetines
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'ρ (densidad del aire (Kg/m³)',
              aletines.densidadAireKgM3Sobrealetines?.toFixed(2).toString() ??
                '---',
            ],
            [
              'V² = velocidad del aire 140Km/h (m/s)',
              aletines.velocidadAireV2msSobrealetines?.toFixed(2).toString() ??
                '---',
            ],
            [
              'R (radio de curva) m',
              aletines.radioCurvaRSobrealetines?.toFixed(2).toString() ?? '---',
            ],
            [
              'K (coeficiente de seguridad)',
              aletines.coefSeguridadKSobrealetines?.toFixed(2).toString() ??
                '---',
            ],
          ].map(
            ([desc, val]) =>
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    verticalAlign: AlignmentType.CENTER,
                    children: [
                      new Paragraph({
                        text: desc,
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                  }),
                  new TableCell({
                    verticalAlign: AlignmentType.CENTER,
                    children: [new Paragraph(val)],
                  }),
                ],
              }),
          ),
        ],
      });

      const tablaFuerzas = new Table({
        width: { size: 80, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: ['FUERZAS QUE ACTÚAN SOBRE LA PIEZA (N)'].map(
              (heading) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  verticalAlign: VerticalAlign.CENTER,
                  columnSpan: 5,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: heading })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              'Peso',
              'Fuerza de frenado',
              'Resistencia aerodinámica',
              'Fuerza centrífuga',
              'Suma de fuerzas',
            ].map(
              (t) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: t })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              peso.toFixed(2).toString() ?? '---',
              fuerzafrenado.toFixed(2).toString() ?? '---',
              resistenciaaerodinamica.toFixed(2).toString() ?? '---',
              fuerzacentrifuga.toFixed(2).toString() ?? '---',
              sumadelasfuerzas.toFixed(2).toString() ?? '---',
            ].map(
              (v) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: v })],
                    }),
                  ],
                }),
            ),
          }),
        ],
      });

      const fuerzadediseno =
        sumadelasfuerzas * (aletines.coefSeguridadKSobrealetines ?? 0);
      const fuerzamaximatornillostraccion =
        ((0.9 *
          (aletines.resTraccionMinTornillo88Kgmm2Sobrealetines ?? 0) *
          (aletines.seccionResistenteAsSobrealetines ?? 0)) /
          1.25) *
        (aletines.numTornillosSobrealetines ?? 0);
      const fuerzamaximatornilloscortante =
        ((0.5 *
          (aletines.resTraccionMinTornillo88Kgmm2Sobrealetines ?? 0) *
          (aletines.seccionResistenteAsSobrealetines ?? 0)) /
          1.25) *
        (aletines.numTornillosSobrealetines ?? 0);
      const comprobacion =
        fuerzadediseno / fuerzamaximatornilloscortante +
        fuerzadediseno / (1.4 * fuerzamaximatornillostraccion);

      const tablaComprobacion = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              'La fuerza de diseño soportada por los anclajes (N)',
              'Fuerza máxima que soportan los tornillos a tracción (N)',
              'Fuerza máxima que soportan los tornillos a cortante (N)',
              'Comprobación <= 1',
            ].map(
              (t) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: t, bold: true })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              fuerzadediseno.toFixed(2).toString() ?? '---',
              fuerzamaximatornillostraccion.toFixed(2).toString() ?? '---',
              fuerzamaximatornilloscortante.toFixed(2).toString() ?? '---',
              comprobacion.toFixed(2).toString() ?? '---',
            ].map(
              (v, i) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  shading:
                    i === 0
                      ? undefined
                      : i === 3 && comprobacion > 1
                        ? { type: ShadingType.CLEAR, fill: 'FF0000' }
                        : { type: ShadingType.CLEAR, fill: '00B050' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: v })],
                    }),
                  ],
                }),
            ),
          }),
        ],
      });

      out.push(tablaCaracteristicas);
      out.push(new Paragraph({ text: '' }));
      out.push(tablaFuerzas);
      out.push(new Paragraph({ text: '' }));
      out.push(tablaComprobacion);
    }

    const frenos = modificaciones.find(
      (m) => m.nombre === 'SUSTITUCIÓN DE DISCOS DE FRENO' && m.seleccionado,
    );

    if (
      frenos &&
      (frenos.ubicacionDiscos === 'delanteros' ||
        frenos.ubicacionDiscos === 'ambos')
    ) {
      out.push(new Paragraph({ text: '' }));
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '2.3.' + contador + ' Frenos Delanteros',
              bold: true,
              size: 24,
            }),
          ],
        }),
      );
      contador++;

      out.push(new Paragraph({ text: '' }));
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Sistema original (FRENOS DE DISCO)',
              bold: true,
            }),
          ],
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const diametroExt = frenos.ant_diametroExteriorDiscoDelantero ?? 0;
      const diametroInt = frenos.ant_diametroInteriorDiscoDelantero ?? 0;
      const radioExt = diametroExt / 2;
      const radioInt = diametroInt / 2;
      const diametroBomba = frenos.ant_diametroBombaDelantera ?? 0;
      const diametroPiston = frenos.ant_dimensionPistonDelantera ?? 0;
      const numPistones = frenos.ant_numPistonesDelantero ?? 0;
      const numPinzas = frenos.ant_numPinzasDelanteras ?? 0;
      const numDiscos = frenos.ant_numDiscosDelantero ?? 0;

      const tablaDimensiones = new Table({
        width: { size: 60, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER,
        rows: [
          ['Diámetro exterior (m) ØDET', diametroExt + ' m'],
          ['Diámetro interior (m) ØDIT', diametroInt + ' m'],
          ['Radio exterior (m) RDET', radioExt + ' m'],
          ['Radio interior (m) RDIT', radioInt + ' m'],
          ['Diámetro bomba', diametroBomba + 'm'],
          ['Diámetro pistón', diametroPiston + 'm'],
          ['Número de pistones por pinza', numPistones.toString()],
          ['Nº de pinzas por rueda', numPinzas.toString()],
          ['Nº de discos por rueda', numDiscos.toString()],
        ].map(
          ([label, val]) =>
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: label })],
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      text: val,
                      alignment: AlignmentType.RIGHT,
                    }),
                  ],
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
              ],
            }),
        ),
      });

      out.push(tablaDimensiones);
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Para la realización del cálculo, aplicamos una fuerza de 50 kg en el pedal de freno. Del manual del vehículo obtenemos los siguientes datos:',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const fuerzaPedalKg = 50;
      const fuerzaPedalN = 490.5;
      const relacionPedal = 5;
      const coefFriccion = 0.4;
      const radioNeumatico =
        ((frenos.ant_radioNeumaticoDelantero ?? 0) * 25.4 +
          2 *
            (((frenos.ant_perfilNeumaticoDelantero ?? 0) *
              (frenos.ant_anchoNeumaticoDelantero ?? 0)) /
              100)) /
        2 /
        1000;
      console.log('radioNeumatico', radioNeumatico);

      const tablaDatosManual = new Table({
        width: { size: 70, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'Fuerza ejercida en el pedal (Fep)',
                        italics: true,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: `${fuerzaPedalKg} Kg -> ${fuerzaPedalN.toFixed(1).replace('.', ',')} N`,
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'Relación de desmultiplicación (Rp)',
                        italics: true,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: `1:${relacionPedal}`,
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'coeficiente de fricción (µF)' }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: coefFriccion.toString().replace('.', ','),
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    text: 'Radio del neumático',
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text:
                      radioNeumatico.toFixed(5).toString().replace('.', ',') +
                      ' m',
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      out.push(tablaDatosManual);
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Se ha mantenido original todo el circuito del líquido de frenos',
        }),
      );
      out.push(new Paragraph({ text: '' }));
      out.push(
        new Paragraph({
          text: 'Una vez conocidos todos los datos, empezamos a realizar los cálculos.',
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Para conocer la influencia del pedal de freno sobre el sistema, cabe resaltar que el pedal es un elemento amplificador de la fuerza que ejerce el conductor. Las ecuaciones que se muestran a continuación son para un sistema de frenado sin servofreno. Por lo tanto, para conocer el valor de la fuerza que se ejerce sobre el sistema se emplea la siguiente expresión, donde se puede apreciar como la fuerza aplicada por el conductor (',
            }),
            new TextRun({ text: 'Fep', italics: true }),
            new TextRun({
              text: ') se multiplica por la relación del pedal (',
            }),
            new TextRun({ text: 'Rp', italics: true }),
            new TextRun({ text: ').' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'SP', subScript: true, bold: true }),
            new TextRun({ text: ' = F', italics: true, bold: true }),
            new TextRun({ text: 'ep', subScript: true, bold: true }),
            new TextRun({ text: ' * R', italics: true, bold: true }),
            new TextRun({ text: 'p', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Lo primero que calculamos, es la fuerza de salida del pedal (',
            }),
            new TextRun({ text: 'FSP', italics: true }),
            new TextRun({ text: ') con la aplicación de la fuerza de ' }),
            new TextRun({
              text: fuerzaPedalN.toFixed(1).replace('.', ',') + ' N.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const fuerzaSalidaFsp = fuerzaPedalN * relacionPedal;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'sp', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + fuerzaSalidaFsp.toFixed(1).replace('.', ',') + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Una vez conocida la fuerza, calculamos la presión teórica de la bomba (',
            }),
            new TextRun({ text: 'PB', italics: true }),
            new TextRun({
              text: '). Suponemos que el líquido que se utiliza en el sistema de frenado es totalmente incompresible, y que los conductos del circuito hidráulico son totalmente rígidos.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      const radioBombaFrenos = diametroBomba / 2;
      const areaBombaFrenos = Math.PI * Math.pow(radioBombaFrenos, 2);

      const presionBombaFrenos =
        areaBombaFrenos > 0 ? fuerzaSalidaFsp / areaBombaFrenos : 0;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'P', italics: true, bold: true }),
            new TextRun({ text: 'B', subScript: true, bold: true }),
            new TextRun({ text: ' = ' }),
            new TextRun({ text: 'F', italics: true }),
            new TextRun({ text: 'SP', subScript: true }),
            new TextRun({ text: ' / A', italics: true }),
            new TextRun({ text: 'b', subScript: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'P', bold: true }),
            new TextRun({ text: 'B', subScript: true, bold: true }),
            new TextRun({
              text:
                ' = ' +
                presionBombaFrenos.toFixed(2).replace('.', ',') +
                ' N/m²',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Siendo ' }),
            new TextRun({ text: 'Ab', italics: true }),
            new TextRun({ text: ' el área del cilindro hidráulico.' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Suponiendo que durante todo el recorrido del circuito hidráulico no existen perdidas, se extrae que la presión será igual en todos los puntos de este. Por ello, podemos afirmar que la presión de la salida del bombín de frenado es la misma que llega al pistón de pinza de frenos (PPF).',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'P', italics: true }),
            new TextRun({ text: 'B', subScript: true, italics: true }),
            new TextRun({ text: ' = P', italics: true }),
            new TextRun({ text: 'PF', subScript: true, italics: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'En el final del recorrido del circuito hidráulico, el líquido de frenos ejerce una presión sobre los pistones de la pinza de freno. Este último elemento es el encargado de generar y transformar esa presión hidráulica en fuerza mecánica lineal, que posteriormente se aplicará sobre las pastillas de freno.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Una vez conocemos la presión que ejerce la pinza de frenos, podemos calcular la fuerza que se ejerce sobre la pastilla de frenos (',
            }),
            new TextRun({ text: 'FP', italics: true }),
            new TextRun({ text: ').' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'P', subScript: true, bold: true }),
            new TextRun({ text: ' = Nº', bold: true }),
            new TextRun({ text: 'PISTONES', subScript: true, bold: true }),
            new TextRun({ text: ' * P', italics: true, bold: true }),
            new TextRun({ text: 'PF', subScript: true, bold: true }),
            new TextRun({ text: ' * A', italics: true, bold: true }),
            new TextRun({ text: 'PP', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Siendo ' }),
            new TextRun({ text: 'APP', italics: true }),
            new TextRun({ text: ' el área del pistón de la pinza.' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const radioPistonFrenos = diametroPiston / 2;
      const areaPistonFrenos = Math.PI * Math.pow(radioPistonFrenos, 2);
      const fuerzaPistonFrenos =
        numPistones * presionBombaFrenos * areaPistonFrenos;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'P', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + fuerzaPistonFrenos.toFixed(2) + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Una vez conocida la fuerza generada por la presión hidráulica, la multiplicamos por el coeficiente de fricción que hay entre el disco y la pastilla (',
            }),
            new TextRun({ text: 'μF', italics: true }),
            new TextRun({
              text: '), y así conoceremos cual es la fuerza de fricción (',
            }),
            new TextRun({ text: 'FFF', italics: true }),
            new TextRun({
              text: ') que tenemos entre el disco y la pastilla.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Las condiciones que tomamos para la realización de estos cálculos para un ',
            }),
            new TextRun({ text: 'μF=0,4', italics: true }),
            new TextRun({
              text: ' que pertenece al coeficiente de fricción entre un disco de acero y un juego de pastillas de compuesto orgánico.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
            new TextRun({ text: ' = F', italics: true, bold: true }),
            new TextRun({ text: 'P', subScript: true, bold: true }),
            new TextRun({ text: ' * μ', italics: true, bold: true }),
            new TextRun({ text: 'F', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const fuerzaFriccionFrenos = fuerzaPistonFrenos * coefFriccion;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + fuerzaFriccionFrenos.toFixed(0) + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Calculamos la fuerza total que generemos con la fuerza de fricción.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'TFF', subScript: true, bold: true }),
            new TextRun({ text: ' = 2 * F', italics: true, bold: true }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const fuerzaTotalFriccionFrenos = 2 * fuerzaFriccionFrenos;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'TFF', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + fuerzaTotalFriccionFrenos.toFixed(0) + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Una vez conocida la fuerza de rozamiento, el siguiente paso es conocer los pares de frenado producidos por el contacto entre el disco y las pastillas.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'N', italics: true, bold: true }),
            new TextRun({ text: 'F', subScript: true, bold: true }),
            new TextRun({ text: ' = M * F', italics: true, bold: true }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
            new TextRun({ text: ' * R', italics: true, bold: true }),
            new TextRun({ text: 'E', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Siendo ' }),
            new TextRun({ text: 'M', italics: true }),
            new TextRun({ text: ' el número de pastillas en cada disco y ' }),
            new TextRun({ text: 'RE', italics: true }),
            new TextRun({ text: ' el radio efectivo del disco.' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      out.push(
        new Paragraph({
          text: 'Par de frenado en una rueda delantera:',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const radioEfectivo = radioInt + (radioExt - radioInt) / 2;
      console.log('radioEfectivo revisar', radioEfectivo);
      // Nota: En la imagen anterior Ftff = 2 * Fff. Y Nf se calcula usando esa fuerza total por el radio.
      // Basado en los números: 29317 * 0.11425 = ~3349
      const parFrenado = 2 * fuerzaFriccionFrenos * radioEfectivo;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'N', bold: true }),
            new TextRun({ text: 'F', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + parFrenado.toFixed(4).replace('.', ',') + ' Nm',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Al considerar que tanto el neumático como el disco de frenos están anclados al buje, que es el elemento del eje que permite el giro; el par en ambos será constante en todo momento. Por lo tanto, suponiendo que el par producido en el disco es el mismo que en los neumáticos, se crea una fuerza de reacción (fuerza de frenado (FFR)) que se genera en la calzada, producida por el contacto entre el neumático y el asfalto.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true }),
            new TextRun({ text: 'FR', subScript: true, italics: true }),
            new TextRun({ text: ' = ' }),
            new TextRun({ text: 'N', italics: true }),
            new TextRun({ text: 'F', subScript: true, italics: true }),
            new TextRun({ text: ' / R', italics: true }),
            new TextRun({ text: 'N', subScript: true, italics: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Donde ' }),
            new TextRun({ text: 'R', italics: true }),
            new TextRun({ text: 'N', subScript: true, italics: true }),
            new TextRun({ text: ' es el radio del neumático' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      const fuerzaReaccionFfr = parFrenado / radioNeumatico;

      out.push(
        new Paragraph({
          text: 'Fuerza de frenado en una pinza:',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'FR', subScript: true, bold: true }),
            new TextRun({
              text:
                ' = ' + fuerzaReaccionFfr.toFixed(4).replace('.', ',') + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: `Fuerza total de frenado en las ruedas delanteras (${(frenos.ant_numPinzasDelanteras ?? 0) * 2} pinzas):`,
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const fuerzaTotalFrenadoFtf =
        (frenos.ant_numPinzasDelanteras ?? 0) * 2 * fuerzaReaccionFfr;

      out.push(
        new Paragraph({
          text: `Fuerza total de frenado (FTF) = ${(frenos.ant_numPinzasDelanteras ?? 0) * 2}*FFR`,
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text:
                'FTF = ' +
                fuerzaTotalFrenadoFtf.toFixed(2).replace('.', ',') +
                ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Sistema reformado (FRENOS DE DISCO)',
              bold: true,
            }),
          ],
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const newDiametroExt = frenos.diametroExteriorDiscos ?? 0;
      const newDiametroInt = frenos.diametroInteriorDiscos ?? 0;
      const newRadioExt = newDiametroExt / 2;
      const newRadioInt = newDiametroInt / 2;
      const newDiametroBomba = frenos.diametroBombaDiscos ?? 0;
      const newDimensionPiston = frenos.dimensionPistonDiscos ?? 0;
      const newNumPistones = frenos.numPistonesDiscos ?? 0;
      const newNumPinzas = frenos.numPinzasDelanteras ?? 0;
      const newNumDiscos = frenos.numDiscosDelantero ?? 0;

      const radioneumaticoDiscos =
        String(frenos.radioNeumaticoDiscos || '0')
          .replace(',', '.')
          .trim() ?? 0;

      const newradioNeumatico =
        (Number(radioneumaticoDiscos) * 25.4 +
          2 *
            (((frenos.anchoNeumaticoDiscos ?? 0) *
              (frenos.perfilNeumaticoDiscos ?? 0)) /
              100)) /
        2 /
        1000;
      console.log('newradioNeumatico', newradioNeumatico);

      const tablaReformado = new Table({
        width: { size: 60, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER,
        rows: [
          ['Diámetro exterior (m) ØDET', newDiametroExt + ' m'],
          ['Diámetro interior (m) ØDIT', newDiametroInt + ' m'],
          ['Radio exterior (m) RDET', newRadioExt + ' m'],
          ['Radio interior (m) RDIT', newRadioInt + ' m'],
          ['Diámetro bomba', newDiametroBomba + 'm'],
          ['Diámetro pistón', newDimensionPiston + 'm'],
          ['Número de pistones por pinza', newNumPistones.toString()],
          ['Nº de pinzas por rueda', newNumPinzas.toString()],
          ['Nº de discos por rueda', newNumDiscos.toString()],
        ].map(
          ([label, val]) =>
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: label })],
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      text: val,
                      alignment: AlignmentType.RIGHT,
                    }),
                  ],
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
              ],
            }),
        ),
      });

      out.push(tablaReformado);
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Para la realización del cálculo, aplicamos una fuerza de 50 kg en el pedal de freno. Del manual del vehículo obtenemos los siguientes datos:',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const tablaDatosManualReformado = new Table({
        width: { size: 70, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'Fuerza ejercida en el pedal (Fep)',
                        italics: true,
                      }),
                    ],
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: `${fuerzaPedalKg} Kg -> ${fuerzaPedalN.toFixed(1).replace('.', ',')} N`,
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'Relación de desmultiplicación (Rp)',
                        italics: true,
                      }),
                    ],
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: `1:${relacionPedal}`,
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'coeficiente de fricción (µF)' }),
                    ],
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: coefFriccion.toString().replace('.', ','),
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    text: 'Radio del neumático',
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text:
                      newradioNeumatico
                        .toFixed(5)
                        .toString()
                        .replace('.', ',') + ' m',
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
            ],
          }),
        ],
      });

      out.push(tablaDatosManualReformado);
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Se ha mantenido original todo el circuito del líquido de frenos',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      out.push(
        new Paragraph({
          text: 'Una vez conocidos todos los datos, empezamos a realizar los cálculos.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Para conocer la influencia del pedal de freno sobre el sistema, cabe resaltar que el pedal es un elemento amplificador de la fuerza que ejerce el conductor. Las ecuaciones que se muestran a continuación son para un sistema de frenado sin servofreno. Por lo tanto, para conocer el valor de la fuerza que se ejerce sobre el sistema se emplea la siguiente expresión, donde se puede apreciar como la fuerza aplicada por el conductor (',
            }),
            new TextRun({ text: 'Fep', italics: true }),
            new TextRun({
              text: ') se multiplica por la relación del pedal (',
            }),
            new TextRun({ text: 'Rp', italics: true }),
            new TextRun({ text: ').' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'SP', subScript: true, bold: true }),
            new TextRun({ text: ' = F', italics: true, bold: true }),
            new TextRun({ text: 'ep', subScript: true, bold: true }),
            new TextRun({ text: ' * R', italics: true, bold: true }),
            new TextRun({ text: 'p', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Lo primero que calculamos, es la fuerza de salida del pedal (',
            }),
            new TextRun({ text: 'FSP', italics: true }),
            new TextRun({ text: ') con la aplicación de la fuerza de ' }),
            new TextRun({
              text: fuerzaPedalN.toFixed(1).replace('.', ',') + ' N.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      // Nota: fuerzaSalidaFsp ya se calculó arriba (490.5 * 5 = 2452.5), se reutiliza
      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'sp', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + fuerzaSalidaFsp.toFixed(1).replace('.', ',') + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Una vez conocida la fuerza, calculamos la presión teórica de la bomba (',
            }),
            new TextRun({ text: 'PB', italics: true }),
            new TextRun({
              text: '). Suponemos que el líquido que se utiliza en el sistema de frenado es totalmente incompresible, y que los conductos del circuito hidráulico son totalmente rígidos.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      // Cálculos específicos para el SISTEMA REFORMADO
      const newRadioBombaFrenos = newDiametroBomba / 2;
      const newAreaBombaFrenos = Math.PI * Math.pow(newRadioBombaFrenos, 2);
      const newPresionBombaFrenos = fuerzaSalidaFsp / newAreaBombaFrenos;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'P', italics: true, bold: true }),
            new TextRun({ text: 'B', subScript: true, bold: true }),
            new TextRun({ text: ' = ' }),
            new TextRun({ text: 'F', italics: true }),
            new TextRun({ text: 'SP', subScript: true }),
            new TextRun({ text: ' / A', italics: true }),
            new TextRun({ text: 'b', subScript: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'P', bold: true }),
            new TextRun({ text: 'B', subScript: true, bold: true }),
            new TextRun({
              text:
                ' = ' +
                newPresionBombaFrenos.toFixed(2).replace('.', ',') +
                ' N/m²',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Siendo ' }),
            new TextRun({ text: 'Ab', italics: true }),
            new TextRun({ text: ' el área del cilindro hidráulico.' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Suponiendo que durante todo el recorrido del circuito hidráulico no existen perdidas, se extrae que la presión será igual en todos los puntos de este. Por ello, podemos afirmar que la presión de la salida del bombín de frenado es la misma que llega al pistón de pinza de frenos (PPF).',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'P', italics: true }),
            new TextRun({ text: 'B', subScript: true, italics: true }),
            new TextRun({ text: ' = P', italics: true }),
            new TextRun({ text: 'PF', subScript: true, italics: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'En el final del recorrido del circuito hidráulico, el líquido de frenos ejerce una presión sobre los pistones de la pinza de freno. Este último elemento es el encargado de generar y transformar esa presión hidráulica en fuerza mecánica lineal, que posteriormente se aplicará sobre las pastillas de freno.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Una vez conocemos la presión que ejerce la pinza de frenos, podemos calcular la fuerza que se ejerce sobre la pastilla de frenos (',
            }),
            new TextRun({ text: 'FP', italics: true }),
            new TextRun({ text: ').' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'P', subScript: true, bold: true }),
            new TextRun({ text: ' = Nº', bold: true }),
            new TextRun({ text: 'PISTONES', subScript: true, bold: true }),
            new TextRun({ text: ' * P', italics: true, bold: true }),
            new TextRun({ text: 'PF', subScript: true, bold: true }),
            new TextRun({ text: ' * A', italics: true, bold: true }),
            new TextRun({ text: 'PP', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Siendo ' }),
            new TextRun({ text: 'APP', italics: true }),
            new TextRun({ text: ' el área del pistón de la pinza.' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      // Cálculos fuerza pistón REFORMADO
      const newRadioPistonFrenos = newDimensionPiston / 2;
      const newAreaPistonFrenos = Math.PI * Math.pow(newRadioPistonFrenos, 2);
      const newFuerzaPistonFrenos =
        newNumPistones * newPresionBombaFrenos * newAreaPistonFrenos;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'P', subScript: true, bold: true }),
            new TextRun({
              text:
                ' = ' +
                newFuerzaPistonFrenos.toFixed(2).replace('.', ',') +
                ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Una vez conocida la fuerza generada por la presión hidráulica, la multiplicamos por el coeficiente de fricción que hay entre el disco y la pastilla (',
            }),
            new TextRun({ text: 'μF', italics: true }),
            new TextRun({
              text: '), y así conoceremos cual es la fuerza de fricción (',
            }),
            new TextRun({ text: 'FFF', italics: true }),
            new TextRun({
              text: ') que tenemos entre el disco y la pastilla.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Las condiciones que tomamos para la realización de estos cálculos para un ',
            }),
            new TextRun({ text: 'μF=0,4', italics: true }),
            new TextRun({
              text: ' que pertenece al coeficiente de fricción entre un disco de acero y un juego de pastillas de compuesto orgánico.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
            new TextRun({ text: ' = F', italics: true, bold: true }),
            new TextRun({ text: 'P', subScript: true, bold: true }),
            new TextRun({ text: ' * μ', italics: true, bold: true }),
            new TextRun({ text: 'F', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const newFuerzaFriccionFrenos = newFuerzaPistonFrenos * coefFriccion;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + newFuerzaFriccionFrenos.toFixed(0) + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Calculamos la fuerza total que generemos con la fuerza de fricción.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'TFF', subScript: true, bold: true }),
            new TextRun({
              text: ` = ${(newNumDiscos ?? 0) * 2} * F`,
              italics: true,
              bold: true,
            }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const newFuerzaTotalFriccionFrenos =
        (newNumDiscos ?? 0) * 2 * newFuerzaFriccionFrenos;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'TFF', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + newFuerzaTotalFriccionFrenos.toFixed(0) + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Una vez conocida la fuerza de rozamiento, el siguiente paso es conocer los pares de frenado producidos por el contacto entre el disco y las pastillas.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'N', italics: true, bold: true }),
            new TextRun({ text: 'F', subScript: true, bold: true }),
            new TextRun({ text: ' = M * F', italics: true, bold: true }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
            new TextRun({ text: ' * R', italics: true, bold: true }),
            new TextRun({ text: 'E', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Siendo ' }),
            new TextRun({ text: 'M', italics: true }),
            new TextRun({ text: ' el número de pastillas en cada disco y ' }),
            new TextRun({ text: 'RE', italics: true }),
            new TextRun({ text: ' el radio efectivo del disco.' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      out.push(
        new Paragraph({
          text: 'Par de frenado en una rueda delantera:',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const newRadioEfectivo = newRadioExt + (newRadioInt - newRadioExt) / 2;
      console.log('newRadioEfectivo', newRadioEfectivo);
      const newParFrenado = 2 * newFuerzaFriccionFrenos * newRadioEfectivo;
      console.log('newParFrenado', newParFrenado);

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'N', bold: true }),
            new TextRun({ text: 'F', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + newParFrenado.toFixed(4).replace('.', ',') + ' Nm',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Al considerar que tanto el neumático como el disco de frenos están anclados al buje, que es el elemento del eje que permite el giro; el par en ambos será constante en todo momento. Por lo tanto, suponiendo que el par producido en el disco es el mismo que en los neumáticos, se crea una fuerza de reacción (fuerza de frenado (FFR)) que se genera en la calzada, producida por el contacto entre el neumático y el asfalto.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true }),
            new TextRun({ text: 'FR', subScript: true, italics: true }),
            new TextRun({ text: ' = ' }),
            new TextRun({ text: 'N', italics: true }),
            new TextRun({ text: 'F', subScript: true, italics: true }),
            new TextRun({ text: ' / R', italics: true }),
            new TextRun({ text: 'N', subScript: true, italics: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Donde ' }),
            new TextRun({ text: 'R', italics: true }),
            new TextRun({ text: 'N', subScript: true, italics: true }),
            new TextRun({ text: ' es el radio del neumático' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      const newFuerzaReaccionFfr = newParFrenado / newradioNeumatico;

      out.push(
        new Paragraph({
          text: 'Fuerza de frenado en una pinza:',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'FR', subScript: true, bold: true }),
            new TextRun({
              text:
                ' = ' +
                newFuerzaReaccionFfr.toFixed(3).replace('.', ',') +
                ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: `Fuerza total de frenado en las ruedas delanteras (${frenos.numPinzasDelanteras ?? 0 * 2} pinzas):`,
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const newFuerzaTotalFrenadoFtf =
        (frenos.numPinzasDelanteras ?? 0) * 2 * newFuerzaReaccionFfr;

      out.push(
        new Paragraph({
          text: `Fuerza total de frenado (FTF) = ${(frenos.numPinzasDelanteras ?? 0) * 2}*FFR`,
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text:
                'FTF = ' +
                newFuerzaTotalFrenadoFtf.toFixed(2).replace('.', ',') +
                ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Podemos concluir que el sistema de frenado instalado es más eficaz que el que montaba el vehículo en origen ya que la Fuerza total de frenado es superior, por lo tanto ',
            }),
            new TextRun({
              text: 'ES VÁLIDO.',
              bold: true,
              italics: true,
              underline: {
                type: UnderlineType.SINGLE,
              },
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
    }

    //Coche trasero
    if (
      frenos &&
      (frenos.ubicacionDiscos === 'traseros' ||
        frenos.ubicacionDiscos === 'ambos')
    ) {
      out.push(new Paragraph({ text: '' }));
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '2.3.' + contador + ' Frenos Traseros',
              bold: true,
              size: 24,
            }),
          ],
        }),
      );
      contador++;

      out.push(new Paragraph({ text: '' }));
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Sistema original (FRENOS DE DISCO)',
              bold: true,
            }),
          ],
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const diametroExt = frenos.ant_diametroExteriorDiscoTrasero ?? 0;
      const diametroInt = frenos.ant_diametroInteriorDiscoTrasero ?? 0;
      const radioExt = diametroExt / 2;
      const radioInt = diametroInt / 2;
      const diametroBomba = frenos.ant_diametroBombaTrasera ?? 0;
      const diametroPiston = frenos.ant_dimensionPistonTrasera ?? 0;
      const numPistones = frenos.ant_numPistonesTrasero ?? 0;
      const numPinzas = frenos.ant_numPinzasTraseras ?? 0;
      const numDiscos = frenos.ant_numDiscosTrasero ?? 0;

      const tablaDimensiones = new Table({
        width: { size: 60, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER,
        rows: [
          ['Diámetro exterior (m) ØDET', diametroExt + ' m'],
          ['Diámetro interior (m) ØDIT', diametroInt + ' m'],
          ['Radio exterior (m) RDET', radioExt + ' m'],
          ['Radio interior (m) RDIT', radioInt + ' m'],
          ['Diámetro bomba', diametroBomba + 'm'],
          ['Diámetro pistón', diametroPiston + 'm'],
          ['Número de pistones por pinza', numPistones.toString()],
          ['Nº de pinzas por rueda', numPinzas.toString()],
          ['Nº de discos por rueda', numDiscos.toString()],
        ].map(
          ([label, val]) =>
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: label })],
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      text: val,
                      alignment: AlignmentType.RIGHT,
                    }),
                  ],
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
              ],
            }),
        ),
      });

      out.push(tablaDimensiones);
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Para la realización del cálculo, aplicamos una fuerza de 50 kg en el pedal de freno. Del manual del vehículo obtenemos los siguientes datos:',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const fuerzaPedalKg = 50;
      const fuerzaPedalN = 490.5;
      const relacionPedal = 5;
      const coefFriccion = 0.4;
      const radioNeumatico =
        ((frenos.ant_radioNeumaticoTrasero ?? 0) * 25.4 +
          2 *
            (((frenos.ant_perfilNeumaticoTrasero ?? 0) *
              (frenos.ant_anchoNeumaticoTrasero ?? 0)) /
              100)) /
        2 /
        1000;
      console.log('radioNeumatico', radioNeumatico);

      const tablaDatosManual = new Table({
        width: { size: 70, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'Fuerza ejercida en el pedal (Fep)',
                        italics: true,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: `${fuerzaPedalKg} Kg -> ${fuerzaPedalN.toFixed(1).replace('.', ',')} N`,
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'Relación de desmultiplicación (Rp)',
                        italics: true,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: `1:${relacionPedal}`,
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'coeficiente de fricción (µF)' }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: coefFriccion.toString().replace('.', ','),
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    text: 'Radio del neumático',
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text:
                      radioNeumatico.toFixed(5).toString().replace('.', ',') +
                      ' m',
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      out.push(tablaDatosManual);
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Se ha mantenido original todo el circuito del líquido de frenos',
        }),
      );
      out.push(new Paragraph({ text: '' }));
      out.push(
        new Paragraph({
          text: 'Una vez conocidos todos los datos, empezamos a realizar los cálculos.',
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Para conocer la influencia del pedal de freno sobre el sistema, cabe resaltar que el pedal es un elemento amplificador de la fuerza que ejerce el conductor. Las ecuaciones que se muestran a continuación son para un sistema de frenado sin servofreno. Por lo tanto, para conocer el valor de la fuerza que se ejerce sobre el sistema se emplea la siguiente expresión, donde se puede apreciar como la fuerza aplicada por el conductor (',
            }),
            new TextRun({ text: 'Fep', italics: true }),
            new TextRun({
              text: ') se multiplica por la relación del pedal (',
            }),
            new TextRun({ text: 'Rp', italics: true }),
            new TextRun({ text: ').' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'SP', subScript: true, bold: true }),
            new TextRun({ text: ' = F', italics: true, bold: true }),
            new TextRun({ text: 'ep', subScript: true, bold: true }),
            new TextRun({ text: ' * R', italics: true, bold: true }),
            new TextRun({ text: 'p', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Lo primero que calculamos, es la fuerza de salida del pedal (',
            }),
            new TextRun({ text: 'FSP', italics: true }),
            new TextRun({ text: ') con la aplicación de la fuerza de ' }),
            new TextRun({
              text: fuerzaPedalN.toFixed(1).replace('.', ',') + ' N.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const fuerzaSalidaFsp = fuerzaPedalN * relacionPedal;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'sp', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + fuerzaSalidaFsp.toFixed(1).replace('.', ',') + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Una vez conocida la fuerza, calculamos la presión teórica de la bomba (',
            }),
            new TextRun({ text: 'PB', italics: true }),
            new TextRun({
              text: '). Suponemos que el líquido que se utiliza en el sistema de frenado es totalmente incompresible, y que los conductos del circuito hidráulico son totalmente rígidos.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      const radioBombaFrenos = diametroBomba / 2;
      const areaBombaFrenos = Math.PI * Math.pow(radioBombaFrenos, 2);

      const presionBombaFrenos =
        areaBombaFrenos > 0 ? fuerzaSalidaFsp / areaBombaFrenos : 0;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'P', italics: true, bold: true }),
            new TextRun({ text: 'B', subScript: true, bold: true }),
            new TextRun({ text: ' = ' }),
            new TextRun({ text: 'F', italics: true }),
            new TextRun({ text: 'SP', subScript: true }),
            new TextRun({ text: ' / A', italics: true }),
            new TextRun({ text: 'b', subScript: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'P', bold: true }),
            new TextRun({ text: 'B', subScript: true, bold: true }),
            new TextRun({
              text:
                ' = ' +
                presionBombaFrenos.toFixed(2).replace('.', ',') +
                ' N/m²',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Siendo ' }),
            new TextRun({ text: 'Ab', italics: true }),
            new TextRun({ text: ' el área del cilindro hidráulico.' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Suponiendo que durante todo el recorrido del circuito hidráulico no existen perdidas, se extrae que la presión será igual en todos los puntos de este. Por ello, podemos afirmar que la presión de la salida del bombín de frenado es la misma que llega al pistón de pinza de frenos (PPF).',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'P', italics: true }),
            new TextRun({ text: 'B', subScript: true, italics: true }),
            new TextRun({ text: ' = P', italics: true }),
            new TextRun({ text: 'PF', subScript: true, italics: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'En el final del recorrido del circuito hidráulico, el líquido de frenos ejerce una presión sobre los pistones de la pinza de freno. Este último elemento es el encargado de generar y transformar esa presión hidráulica en fuerza mecánica lineal, que posteriormente se aplicará sobre las pastillas de freno.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Una vez conocemos la presión que ejerce la pinza de frenos, podemos calcular la fuerza que se ejerce sobre la pastilla de frenos (',
            }),
            new TextRun({ text: 'FP', italics: true }),
            new TextRun({ text: ').' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'P', subScript: true, bold: true }),
            new TextRun({ text: ' = Nº', bold: true }),
            new TextRun({ text: 'PISTONES', subScript: true, bold: true }),
            new TextRun({ text: ' * P', italics: true, bold: true }),
            new TextRun({ text: 'PF', subScript: true, bold: true }),
            new TextRun({ text: ' * A', italics: true, bold: true }),
            new TextRun({ text: 'PP', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Siendo ' }),
            new TextRun({ text: 'APP', italics: true }),
            new TextRun({ text: ' el área del pistón de la pinza.' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const radioPistonFrenos = diametroPiston / 2;
      const areaPistonFrenos = Math.PI * Math.pow(radioPistonFrenos, 2);
      const fuerzaPistonFrenos =
        numPistones * presionBombaFrenos * areaPistonFrenos;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'P', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + fuerzaPistonFrenos.toFixed(2) + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Una vez conocida la fuerza generada por la presión hidráulica, la multiplicamos por el coeficiente de fricción que hay entre el disco y la pastilla (',
            }),
            new TextRun({ text: 'μF', italics: true }),
            new TextRun({
              text: '), y así conoceremos cual es la fuerza de fricción (',
            }),
            new TextRun({ text: 'FFF', italics: true }),
            new TextRun({
              text: ') que tenemos entre el disco y la pastilla.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Las condiciones que tomamos para la realización de estos cálculos para un ',
            }),
            new TextRun({ text: 'μF=0,4', italics: true }),
            new TextRun({
              text: ' que pertenece al coeficiente de fricción entre un disco de acero y un juego de pastillas de compuesto orgánico.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
            new TextRun({ text: ' = F', italics: true, bold: true }),
            new TextRun({ text: 'P', subScript: true, bold: true }),
            new TextRun({ text: ' * μ', italics: true, bold: true }),
            new TextRun({ text: 'F', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const fuerzaFriccionFrenos = fuerzaPistonFrenos * coefFriccion;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + fuerzaFriccionFrenos.toFixed(0) + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Calculamos la fuerza total que generemos con la fuerza de fricción.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'TFF', subScript: true, bold: true }),
            new TextRun({ text: ' = 2 * F', italics: true, bold: true }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const fuerzaTotalFriccionFrenos = 2 * fuerzaFriccionFrenos;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'TFF', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + fuerzaTotalFriccionFrenos.toFixed(0) + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Una vez conocida la fuerza de rozamiento, el siguiente paso es conocer los pares de frenado producidos por el contacto entre el disco y las pastillas.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'N', italics: true, bold: true }),
            new TextRun({ text: 'F', subScript: true, bold: true }),
            new TextRun({ text: ' = M * F', italics: true, bold: true }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
            new TextRun({ text: ' * R', italics: true, bold: true }),
            new TextRun({ text: 'E', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Siendo ' }),
            new TextRun({ text: 'M', italics: true }),
            new TextRun({ text: ' el número de pastillas en cada disco y ' }),
            new TextRun({ text: 'RE', italics: true }),
            new TextRun({ text: ' el radio efectivo del disco.' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      out.push(
        new Paragraph({
          text: 'Par de frenado en una rueda delantera:',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const radioEfectivo = radioInt + (radioExt - radioInt) / 2;
      console.log('radioEfectivo revisar', radioEfectivo);
      // Nota: En la imagen anterior Ftff = 2 * Fff. Y Nf se calcula usando esa fuerza total por el radio.
      // Basado en los números: 29317 * 0.11425 = ~3349
      const parFrenado = 2 * fuerzaFriccionFrenos * radioEfectivo;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'N', bold: true }),
            new TextRun({ text: 'F', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + parFrenado.toFixed(4).replace('.', ',') + ' Nm',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Al considerar que tanto el neumático como el disco de frenos están anclados al buje, que es el elemento del eje que permite el giro; el par en ambos será constante en todo momento. Por lo tanto, suponiendo que el par producido en el disco es el mismo que en los neumáticos, se crea una fuerza de reacción (fuerza de frenado (FFR)) que se genera en la calzada, producida por el contacto entre el neumático y el asfalto.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true }),
            new TextRun({ text: 'FR', subScript: true, italics: true }),
            new TextRun({ text: ' = ' }),
            new TextRun({ text: 'N', italics: true }),
            new TextRun({ text: 'F', subScript: true, italics: true }),
            new TextRun({ text: ' / R', italics: true }),
            new TextRun({ text: 'N', subScript: true, italics: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Donde ' }),
            new TextRun({ text: 'R', italics: true }),
            new TextRun({ text: 'N', subScript: true, italics: true }),
            new TextRun({ text: ' es el radio del neumático' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      const fuerzaReaccionFfr = parFrenado / radioNeumatico;

      out.push(
        new Paragraph({
          text: 'Fuerza de frenado en una pinza:',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'FR', subScript: true, bold: true }),
            new TextRun({
              text:
                ' = ' + fuerzaReaccionFfr.toFixed(4).replace('.', ',') + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: `Fuerza total de frenado en las ruedas delanteras (${(frenos.ant_numPinzasTraseras ?? 0) * 2} pinzas):`,
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const fuerzaTotalFrenadoFtf =
        (frenos.ant_numPinzasTraseras ?? 0) * 2 * fuerzaReaccionFfr;

      out.push(
        new Paragraph({
          text: `Fuerza total de frenado (FTF) = ${(frenos.ant_numPinzasTraseras ?? 0) * 2}*FFR`,
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text:
                'FTF = ' +
                fuerzaTotalFrenadoFtf.toFixed(2).replace('.', ',') +
                ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Sistema reformado (FRENOS DE DISCO)',
              bold: true,
            }),
          ],
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const newDiametroExt = frenos.diametroExteriorDiscoTrasero ?? 0;
      const newDiametroInt = frenos.diametroInteriorDiscoTrasero ?? 0;
      const newRadioExt = newDiametroExt / 2;
      const newRadioInt = newDiametroInt / 2;
      const newDiametroBomba = frenos.diametroBombaDiscoTrasero ?? 0;
      const newDimensionPiston = frenos.dimensionPistonDiscoTrasero ?? 0;
      const newNumPistones = frenos.numPistonesDiscos ?? 0;
      const newNumPinzas = frenos.numPinzasTraseras ?? 0;
      const newNumDiscos = frenos.numDiscosTrasero ?? 0;

      // Freno trasero bueno

      const newradioNeumatico =
        (Number(frenos.radioNeumaticoDiscoTrasero) * 25.4 +
          2 *
            (((frenos.perfilNeumaticoDiscoTrasero ?? 0) *
              (frenos.anchoNeumaticoDiscoTrasero ?? 0)) /
              100)) /
        2 /
        1000;
      console.log('newradioNeumatico', newradioNeumatico);

      const tablaReformado = new Table({
        width: { size: 60, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER,
        rows: [
          ['Diámetro exterior (m) ØDET', newDiametroExt + ' m'],
          ['Diámetro interior (m) ØDIT', newDiametroInt + ' m'],
          ['Radio exterior (m) RDET', newRadioExt + ' m'],
          ['Radio interior (m) RDIT', newRadioInt + ' m'],
          ['Diámetro bomba', newDiametroBomba + 'm'],
          ['Diámetro pistón', newDimensionPiston + 'm'],
          ['Número de pistones por pinza', newNumPistones.toString()],
          ['Nº de pinzas por rueda', newNumPinzas.toString()],
          ['Nº de discos por rueda', newNumDiscos.toString()],
        ].map(
          ([label, val]) =>
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: label })],
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      text: val,
                      alignment: AlignmentType.RIGHT,
                    }),
                  ],
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
              ],
            }),
        ),
      });

      out.push(tablaReformado);
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Para la realización del cálculo, aplicamos una fuerza de 50 kg en el pedal de freno. Del manual del vehículo obtenemos los siguientes datos:',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const tablaDatosManualReformado = new Table({
        width: { size: 70, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'Fuerza ejercida en el pedal (Fep)',
                        italics: true,
                      }),
                    ],
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: `${fuerzaPedalKg} Kg -> ${fuerzaPedalN.toFixed(1).replace('.', ',')} N`,
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'Relación de desmultiplicación (Rp)',
                        italics: true,
                      }),
                    ],
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: `1:${relacionPedal}`,
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'coeficiente de fricción (µF)' }),
                    ],
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: coefFriccion.toString().replace('.', ','),
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    text: 'Radio del neumático',
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text:
                      newradioNeumatico
                        .toFixed(5)
                        .toString()
                        .replace('.', ',') + ' m',
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
            ],
          }),
        ],
      });

      out.push(tablaDatosManualReformado);
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Se ha mantenido original todo el circuito del líquido de frenos',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      out.push(
        new Paragraph({
          text: 'Una vez conocidos todos los datos, empezamos a realizar los cálculos.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Para conocer la influencia del pedal de freno sobre el sistema, cabe resaltar que el pedal es un elemento amplificador de la fuerza que ejerce el conductor. Las ecuaciones que se muestran a continuación son para un sistema de frenado sin servofreno. Por lo tanto, para conocer el valor de la fuerza que se ejerce sobre el sistema se emplea la siguiente expresión, donde se puede apreciar como la fuerza aplicada por el conductor (',
            }),
            new TextRun({ text: 'Fep', italics: true }),
            new TextRun({
              text: ') se multiplica por la relación del pedal (',
            }),
            new TextRun({ text: 'Rp', italics: true }),
            new TextRun({ text: ').' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'SP', subScript: true, bold: true }),
            new TextRun({ text: ' = F', italics: true, bold: true }),
            new TextRun({ text: 'ep', subScript: true, bold: true }),
            new TextRun({ text: ' * R', italics: true, bold: true }),
            new TextRun({ text: 'p', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Lo primero que calculamos, es la fuerza de salida del pedal (',
            }),
            new TextRun({ text: 'FSP', italics: true }),
            new TextRun({ text: ') con la aplicación de la fuerza de ' }),
            new TextRun({
              text: fuerzaPedalN.toFixed(1).replace('.', ',') + ' N.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      // Nota: fuerzaSalidaFsp ya se calculó arriba (490.5 * 5 = 2452.5), se reutiliza
      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'sp', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + fuerzaSalidaFsp.toFixed(1).replace('.', ',') + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Una vez conocida la fuerza, calculamos la presión teórica de la bomba (',
            }),
            new TextRun({ text: 'PB', italics: true }),
            new TextRun({
              text: '). Suponemos que el líquido que se utiliza en el sistema de frenado es totalmente incompresible, y que los conductos del circuito hidráulico son totalmente rígidos.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      // Cálculos específicos para el SISTEMA REFORMADO
      const newRadioBombaFrenos = newDiametroBomba / 2;
      const newAreaBombaFrenos = Math.PI * Math.pow(newRadioBombaFrenos, 2);
      const newPresionBombaFrenos = fuerzaSalidaFsp / newAreaBombaFrenos;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'P', italics: true, bold: true }),
            new TextRun({ text: 'B', subScript: true, bold: true }),
            new TextRun({ text: ' = ' }),
            new TextRun({ text: 'F', italics: true }),
            new TextRun({ text: 'SP', subScript: true }),
            new TextRun({ text: ' / A', italics: true }),
            new TextRun({ text: 'b', subScript: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'P', bold: true }),
            new TextRun({ text: 'B', subScript: true, bold: true }),
            new TextRun({
              text:
                ' = ' +
                newPresionBombaFrenos.toFixed(2).replace('.', ',') +
                ' N/m²',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Siendo ' }),
            new TextRun({ text: 'Ab', italics: true }),
            new TextRun({ text: ' el área del cilindro hidráulico.' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Suponiendo que durante todo el recorrido del circuito hidráulico no existen perdidas, se extrae que la presión será igual en todos los puntos de este. Por ello, podemos afirmar que la presión de la salida del bombín de frenado es la misma que llega al pistón de pinza de frenos (PPF).',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'P', italics: true }),
            new TextRun({ text: 'B', subScript: true, italics: true }),
            new TextRun({ text: ' = P', italics: true }),
            new TextRun({ text: 'PF', subScript: true, italics: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'En el final del recorrido del circuito hidráulico, el líquido de frenos ejerce una presión sobre los pistones de la pinza de freno. Este último elemento es el encargado de generar y transformar esa presión hidráulica en fuerza mecánica lineal, que posteriormente se aplicará sobre las pastillas de freno.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Una vez conocemos la presión que ejerce la pinza de frenos, podemos calcular la fuerza que se ejerce sobre la pastilla de frenos (',
            }),
            new TextRun({ text: 'FP', italics: true }),
            new TextRun({ text: ').' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'P', subScript: true, bold: true }),
            new TextRun({ text: ' = Nº', bold: true }),
            new TextRun({ text: 'PISTONES', subScript: true, bold: true }),
            new TextRun({ text: ' * P', italics: true, bold: true }),
            new TextRun({ text: 'PF', subScript: true, bold: true }),
            new TextRun({ text: ' * A', italics: true, bold: true }),
            new TextRun({ text: 'PP', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Siendo ' }),
            new TextRun({ text: 'APP', italics: true }),
            new TextRun({ text: ' el área del pistón de la pinza.' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      // Cálculos fuerza pistón REFORMADO
      const newRadioPistonFrenos = newDimensionPiston / 2;
      const newAreaPistonFrenos = Math.PI * Math.pow(newRadioPistonFrenos, 2);
      const newFuerzaPistonFrenos =
        newNumPistones * newPresionBombaFrenos * newAreaPistonFrenos;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'P', subScript: true, bold: true }),
            new TextRun({
              text:
                ' = ' +
                newFuerzaPistonFrenos.toFixed(2).replace('.', ',') +
                ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Una vez conocida la fuerza generada por la presión hidráulica, la multiplicamos por el coeficiente de fricción que hay entre el disco y la pastilla (',
            }),
            new TextRun({ text: 'μF', italics: true }),
            new TextRun({
              text: '), y así conoceremos cual es la fuerza de fricción (',
            }),
            new TextRun({ text: 'FFF', italics: true }),
            new TextRun({
              text: ') que tenemos entre el disco y la pastilla.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Las condiciones que tomamos para la realización de estos cálculos para un ',
            }),
            new TextRun({ text: 'μF=0,4', italics: true }),
            new TextRun({
              text: ' que pertenece al coeficiente de fricción entre un disco de acero y un juego de pastillas de compuesto orgánico.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
            new TextRun({ text: ' = F', italics: true, bold: true }),
            new TextRun({ text: 'P', subScript: true, bold: true }),
            new TextRun({ text: ' * μ', italics: true, bold: true }),
            new TextRun({ text: 'F', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const newFuerzaFriccionFrenos = newFuerzaPistonFrenos * coefFriccion;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + newFuerzaFriccionFrenos.toFixed(0) + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Calculamos la fuerza total que generemos con la fuerza de fricción.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'TFF', subScript: true, bold: true }),
            new TextRun({
              text: ` = ${(newNumDiscos ?? 0) * 2} * F`,
              italics: true,
              bold: true,
            }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const newFuerzaTotalFriccionFrenos =
        (newNumDiscos ?? 0) * 2 * newFuerzaFriccionFrenos;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'TFF', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + newFuerzaTotalFriccionFrenos.toFixed(0) + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Una vez conocida la fuerza de rozamiento, el siguiente paso es conocer los pares de frenado producidos por el contacto entre el disco y las pastillas.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'N', italics: true, bold: true }),
            new TextRun({ text: 'F', subScript: true, bold: true }),
            new TextRun({ text: ' = M * F', italics: true, bold: true }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
            new TextRun({ text: ' * R', italics: true, bold: true }),
            new TextRun({ text: 'E', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Siendo ' }),
            new TextRun({ text: 'M', italics: true }),
            new TextRun({ text: ' el número de pastillas en cada disco y ' }),
            new TextRun({ text: 'RE', italics: true }),
            new TextRun({ text: ' el radio efectivo del disco.' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      out.push(
        new Paragraph({
          text: 'Par de frenado en una rueda trasera:',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const newRadioEfectivo = newRadioExt + (newRadioInt - newRadioExt) / 2;
      console.log('newRadioEfectivo', newRadioEfectivo);
      const newParFrenado = 2 * newFuerzaFriccionFrenos * newRadioEfectivo;
      console.log('newParFrenado', newParFrenado);

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'N', bold: true }),
            new TextRun({ text: 'F', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + newParFrenado.toFixed(4).replace('.', ',') + ' Nm',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Al considerar que tanto el neumático como el disco de frenos están anclados al buje, que es el elemento del eje que permite el giro; el par en ambos será constante en todo momento. Por lo tanto, suponiendo que el par producido en el disco es el mismo que en los neumáticos, se crea una fuerza de reacción (fuerza de frenado (FFR)) que se genera en la calzada, producida por el contacto entre el neumático y el asfalto.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true }),
            new TextRun({ text: 'FR', subScript: true, italics: true }),
            new TextRun({ text: ' = ' }),
            new TextRun({ text: 'N', italics: true }),
            new TextRun({ text: 'F', subScript: true, italics: true }),
            new TextRun({ text: ' / R', italics: true }),
            new TextRun({ text: 'N', subScript: true, italics: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Donde ' }),
            new TextRun({ text: 'R', italics: true }),
            new TextRun({ text: 'N', subScript: true, italics: true }),
            new TextRun({ text: ' es el radio del neumático' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      const newFuerzaReaccionFfr = newParFrenado / newradioNeumatico;

      out.push(
        new Paragraph({
          text: 'Fuerza de frenado en una pinza:',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'FR', subScript: true, bold: true }),
            new TextRun({
              text:
                ' = ' +
                newFuerzaReaccionFfr.toFixed(3).replace('.', ',') +
                ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: `Fuerza total de frenado en las ruedas traseras (${frenos.numPinzasTraseras ?? 0 * 2} pinzas):`,
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const newFuerzaTotalFrenadoFtf =
        (frenos.numPinzasTraseras ?? 0) * 2 * newFuerzaReaccionFfr;

      out.push(
        new Paragraph({
          text: `Fuerza total de frenado (FTF) = ${(frenos.numPinzasTraseras ?? 0) * 2}*FFR`,
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text:
                'FTF = ' +
                newFuerzaTotalFrenadoFtf.toFixed(2).replace('.', ',') +
                ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Podemos concluir que el sistema de frenado instalado es más eficaz que el que montaba el vehículo en origen ya que la Fuerza total de frenado es superior, por lo tanto ',
            }),
            new TextRun({
              text: 'ES VÁLIDO.',
              bold: true,
              italics: true,
              underline: {
                type: UnderlineType.SINGLE,
              },
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
    }

    //Inicio pinza moto

    const pinzaMoto = modificaciones.find(
      (m) => m.nombre === 'DISCO DE FRENO Y PINZA DE FRENO' && m.seleccionado,
    );
    if (pinzaMoto && pinzaMoto.pastillaDelantera) {
      out.push(new Paragraph({ text: '' }));
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '2.3.' + contador + ' Frenos Delanteros',
              bold: true,
              size: 24,
            }),
          ],
        }),
      );
      contador++;

      out.push(new Paragraph({ text: '' }));
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Sistema original (FRENOS DE DISCO)',
              bold: true,
            }),
          ],
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const diametroExt = pinzaMoto.ant_diametroExteriorDiscoDelantero ?? 0;
      const diametroInt = pinzaMoto.ant_diametroInteriorDiscoDelantero ?? 0;
      const radioExt = diametroExt / 2;
      const radioInt = diametroInt / 2;
      const diametroBomba = pinzaMoto.ant_diametroBombaDelantera ?? 0;
      const diametroPiston = pinzaMoto.ant_dimensionPistonDelantera ?? 0;
      const numPistones = pinzaMoto.ant_numPistonesDelantero ?? 0;
      const numPinzas = pinzaMoto.ant_numPinzasDelanteras ?? 0;
      const numDiscos = pinzaMoto.ant_numDiscosDelantero ?? 0;

      const tablaDimensiones = new Table({
        width: { size: 60, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER,
        rows: [
          ['Diámetro exterior (m) ØDET', diametroExt + ' m'],
          ['Diámetro interior (m) ØDIT', diametroInt + ' m'],
          ['Radio exterior (m) RDET', radioExt + ' m'],
          ['Radio interior (m) RDIT', radioInt + ' m'],
          ['Diámetro bomba', diametroBomba + 'm'],
          ['Diámetro pistón', diametroPiston + 'm'],
          ['Número de pistones por pinza', numPistones.toString()],
          ['Nº de pinzas por rueda', numPinzas.toString()],
          ['Nº de discos por rueda', numDiscos.toString()],
        ].map(
          ([label, val]) =>
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: label })],
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      text: val,
                      alignment: AlignmentType.RIGHT,
                    }),
                  ],
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
              ],
            }),
        ),
      });

      out.push(tablaDimensiones);
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Para la realización del cálculo, aplicamos una fuerza de 50 kg en la maneta de freno. Del manual del vehículo obtenemos los siguientes datos:',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const fuerzaPedalKg = 50;
      const fuerzaPedalN = 490.5;
      const relacionPedal = 5;
      const coefFriccion = 0.4;
      const radioNeumatico =
        ((pinzaMoto.ant_radioNeumaticoDelantero ?? 0) * 25.4 +
          2 *
            (((pinzaMoto.ant_anchoNeumaticoDelantero ?? 0) *
              (pinzaMoto.ant_perfilNeumaticoDelantero ?? 0)) /
              100)) /
        2 /
        1000;
      console.log('radioNeumatico', radioNeumatico);

      const tablaDatosManual = new Table({
        width: { size: 70, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'Fuerza ejercida en la maneta (Fep)',
                        italics: true,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: `${fuerzaPedalKg} Kg -> ${fuerzaPedalN.toFixed(1).replace('.', ',')} N`,
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'Relación de desmultiplicación (Rp)',
                        italics: true,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: `1:${relacionPedal}`,
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'coeficiente de fricción (µF)' }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: coefFriccion.toString().replace('.', ','),
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    text: 'Radio del neumático',
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text:
                      radioNeumatico.toFixed(5).toString().replace('.', ',') +
                      ' m',
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      out.push(tablaDatosManual);
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Se ha mantenido original todo el circuito del líquido de frenos',
        }),
      );
      out.push(new Paragraph({ text: '' }));
      out.push(
        new Paragraph({
          text: 'Una vez conocidos todos los datos, empezamos a realizar los cálculos.',
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Para conocer la influencia de la maneta de freno sobre el sistema, cabe resaltar que la maneta es un elemento amplificador de la fuerza que ejerce el conductor. Las ecuaciones que se muestran a continuación son para un sistema de frenado sin servofreno. Por lo tanto, para conocer el valor de la fuerza que se ejerce sobre el sistema se emplea la siguiente expresión, donde se puede apreciar como la fuerza aplicada por el conductor (',
            }),
            new TextRun({ text: 'Fep', italics: true }),
            new TextRun({
              text: ') se multiplica por la relación de la maneta (',
            }),
            new TextRun({ text: 'Rp', italics: true }),
            new TextRun({ text: ').' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'SP', subScript: true, bold: true }),
            new TextRun({ text: ' = F', italics: true, bold: true }),
            new TextRun({ text: 'ep', subScript: true, bold: true }),
            new TextRun({ text: ' * R', italics: true, bold: true }),
            new TextRun({ text: 'p', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Lo primero que calculamos, es la fuerza de salida de la maneta (',
            }),
            new TextRun({ text: 'FSP', italics: true }),
            new TextRun({ text: ') con la aplicación de la fuerza de ' }),
            new TextRun({
              text: fuerzaPedalN.toFixed(1).replace('.', ',') + ' N.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const fuerzaSalidaFsp = fuerzaPedalN * relacionPedal;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'sp', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + fuerzaSalidaFsp.toFixed(1).replace('.', ',') + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Una vez conocida la fuerza, calculamos la presión teórica de la bomba (',
            }),
            new TextRun({ text: 'PB', italics: true }),
            new TextRun({
              text: '). Suponemos que el líquido que se utiliza en el sistema de frenado es totalmente incompresible, y que los conductos del circuito hidráulico son totalmente rígidos.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      const radioBombaFrenos = diametroBomba / 2;
      const areaBombaFrenos = Math.PI * Math.pow(radioBombaFrenos, 2);

      const presionBombaFrenos =
        areaBombaFrenos > 0 ? fuerzaSalidaFsp / areaBombaFrenos : 0;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'P', italics: true, bold: true }),
            new TextRun({ text: 'B', subScript: true, bold: true }),
            new TextRun({ text: ' = ' }),
            new TextRun({ text: 'F', italics: true }),
            new TextRun({ text: 'SP', subScript: true }),
            new TextRun({ text: ' / A', italics: true }),
            new TextRun({ text: 'b', subScript: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'P', bold: true }),
            new TextRun({ text: 'B', subScript: true, bold: true }),
            new TextRun({
              text:
                ' = ' +
                presionBombaFrenos.toFixed(2).replace('.', ',') +
                ' N/m²',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Siendo ' }),
            new TextRun({ text: 'Ab', italics: true }),
            new TextRun({ text: ' el área del cilindro hidráulico.' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Suponiendo que durante todo el recorrido del circuito hidráulico no existen perdidas, se extrae que la presión será igual en todos los puntos de este. Por ello, podemos afirmar que la presión de la salida del bombín de frenado es la misma que llega al pistón de pinza de frenos (PPF).',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'P', italics: true }),
            new TextRun({ text: 'B', subScript: true, italics: true }),
            new TextRun({ text: ' = P', italics: true }),
            new TextRun({ text: 'PF', subScript: true, italics: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'En el final del recorrido del circuito hidráulico, el líquido de frenos ejerce una presión sobre los pistones de la pinza de freno. Este último elemento es el encargado de generar y transformar esa presión hidráulica en fuerza mecánica lineal, que posteriormente se aplicará sobre las pastillas de freno.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Una vez conocemos la presión que ejerce la pinza de frenos, podemos calcular la fuerza que se ejerce sobre la pastilla de frenos (',
            }),
            new TextRun({ text: 'FP', italics: true }),
            new TextRun({ text: ').' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'P', subScript: true, bold: true }),
            new TextRun({ text: ' = Nº', bold: true }),
            new TextRun({ text: 'PISTONES', subScript: true, bold: true }),
            new TextRun({ text: ' * P', italics: true, bold: true }),
            new TextRun({ text: 'PF', subScript: true, bold: true }),
            new TextRun({ text: ' * A', italics: true, bold: true }),
            new TextRun({ text: 'PP', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Siendo ' }),
            new TextRun({ text: 'APP', italics: true }),
            new TextRun({ text: ' el área del pistón de la pinza.' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const radioPistonFrenos = diametroPiston / 2;
      const areaPistonFrenos = Math.PI * Math.pow(radioPistonFrenos, 2);
      const fuerzaPistonFrenos =
        numPistones * presionBombaFrenos * areaPistonFrenos;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'P', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + fuerzaPistonFrenos.toFixed(2) + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Una vez conocida la fuerza generada por la presión hidráulica, la multiplicamos por el coeficiente de fricción que hay entre el disco y la pastilla (',
            }),
            new TextRun({ text: 'μF', italics: true }),
            new TextRun({
              text: '), y así conoceremos cual es la fuerza de fricción (',
            }),
            new TextRun({ text: 'FFF', italics: true }),
            new TextRun({
              text: ') que tenemos entre el disco y la pastilla.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Las condiciones que tomamos para la realización de estos cálculos para un ',
            }),
            new TextRun({ text: 'μF=0,4', italics: true }),
            new TextRun({
              text: ' que pertenece al coeficiente de fricción entre un disco de acero y un juego de pastillas de compuesto orgánico.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
            new TextRun({ text: ' = F', italics: true, bold: true }),
            new TextRun({ text: 'P', subScript: true, bold: true }),
            new TextRun({ text: ' * μ', italics: true, bold: true }),
            new TextRun({ text: 'F', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const fuerzaFriccionFrenos = fuerzaPistonFrenos * coefFriccion;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + fuerzaFriccionFrenos.toFixed(0) + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Calculamos la fuerza total que generemos con la fuerza de fricción.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'TFF', subScript: true, bold: true }),
            new TextRun({ text: ' = 2 * F', italics: true, bold: true }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const fuerzaTotalFriccionFrenos = 1 * fuerzaFriccionFrenos;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'TFF', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + fuerzaTotalFriccionFrenos.toFixed(0) + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Una vez conocida la fuerza de rozamiento, el siguiente paso es conocer los pares de frenado producidos por el contacto entre el disco y las pastillas.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'N', italics: true, bold: true }),
            new TextRun({ text: 'F', subScript: true, bold: true }),
            new TextRun({ text: ' = M * F', italics: true, bold: true }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
            new TextRun({ text: ' * R', italics: true, bold: true }),
            new TextRun({ text: 'E', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Siendo ' }),
            new TextRun({ text: 'M', italics: true }),
            new TextRun({ text: ' el número de pastillas en cada disco y ' }),
            new TextRun({ text: 'RE', italics: true }),
            new TextRun({ text: ' el radio efectivo del disco.' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      out.push(
        new Paragraph({
          text: 'Par de frenado en una rueda delantera:',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const radioEfectivo = radioInt + (radioExt - radioInt) / 2;
      console.log('radioEfectivo revisar', radioEfectivo);
      // Nota: En la imagen anterior Ftff = 2 * Fff. Y Nf se calcula usando esa fuerza total por el radio.
      // Basado en los números: 29317 * 0.11425 = ~3349
      const parFrenado = 2 * fuerzaFriccionFrenos * radioEfectivo;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'N', bold: true }),
            new TextRun({ text: 'F', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + parFrenado.toFixed(4).replace('.', ',') + ' Nm',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Al considerar que tanto el neumático como el disco de frenos están anclados al buje, que es el elemento del eje que permite el giro; el par en ambos será constante en todo momento. Por lo tanto, suponiendo que el par producido en el disco es el mismo que en los neumáticos, se crea una fuerza de reacción (fuerza de frenado (FFR)) que se genera en la calzada, producida por el contacto entre el neumático y el asfalto.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true }),
            new TextRun({ text: 'FR', subScript: true, italics: true }),
            new TextRun({ text: ' = ' }),
            new TextRun({ text: 'N', italics: true }),
            new TextRun({ text: 'F', subScript: true, italics: true }),
            new TextRun({ text: ' / R', italics: true }),
            new TextRun({ text: 'N', subScript: true, italics: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Donde ' }),
            new TextRun({ text: 'R', italics: true }),
            new TextRun({ text: 'N', subScript: true, italics: true }),
            new TextRun({ text: ' es el radio del neumático' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      const fuerzaReaccionFfr = parFrenado / radioNeumatico;

      out.push(
        new Paragraph({
          text: 'Fuerza de frenado en una pinza:',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'FR', subScript: true, bold: true }),
            new TextRun({
              text:
                ' = ' + fuerzaReaccionFfr.toFixed(4).replace('.', ',') + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: `Fuerza total de frenado en las rueda delantera (${(pinzaMoto.ant_numPinzasDelanteras ?? 0) * 1} pinzas):`,
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const fuerzaTotalFrenadoFtf =
        (pinzaMoto.ant_numPinzasDelanteras ?? 0) * 1 * fuerzaReaccionFfr;

      out.push(
        new Paragraph({
          text: `Fuerza total de frenado (FTF) = ${(pinzaMoto.ant_numPinzasDelanteras ?? 0) * 1}*FFR`,
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text:
                'FTF = ' +
                fuerzaTotalFrenadoFtf.toFixed(2).replace('.', ',') +
                ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Sistema reformado (FRENOS DE DISCO)',
              bold: true,
            }),
          ],
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const newDiametroExt = pinzaMoto.diametroExteriorDiscoDelantero ?? 0;
      const newDiametroInt = pinzaMoto.diametroInteriorDiscoDelantero ?? 0;
      const newRadioExt = newDiametroExt / 2;
      const newRadioInt = newDiametroInt / 2;
      const newDiametroBomba = pinzaMoto.diametroBombaDelantera ?? 0;
      const newDimensionPiston = pinzaMoto.dimensionPistonDelantera ?? 0;
      const newNumPistones = pinzaMoto.numPistonesDelantero ?? 0;
      const newNumPinzas = pinzaMoto.numPinzasDelanteras ?? 0;
      const newNumDiscos = pinzaMoto.numDiscosDelantero ?? 0;

      const radioneumaticoDiscos = Number(pinzaMoto.radioNeumaticoDiscos) ?? 0;

      const newradioNeumatico =
        (radioneumaticoDiscos * 25.4 +
          2 *
            (((pinzaMoto.perfilNeumaticoDiscos ?? 0) *
              (pinzaMoto.anchoNeumaticoDiscos ?? 0)) /
              100)) /
        2 /
        1000;
      console.log('newradioNeumatico', newradioNeumatico);

      const tablaReformado = new Table({
        width: { size: 60, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER,
        rows: [
          ['Diámetro exterior (m) ØDET', newDiametroExt + ' m'],
          ['Diámetro interior (m) ØDIT', newDiametroInt + ' m'],
          ['Radio exterior (m) RDET', newRadioExt + ' m'],
          ['Radio interior (m) RDIT', newRadioInt + ' m'],
          ['Diámetro bomba', newDiametroBomba + 'm'],
          ['Diámetro pistón', newDimensionPiston + 'm'],
          ['Número de pistones por pinza', newNumPistones.toString()],
          ['Nº de pinzas por rueda', newNumPinzas.toString()],
          ['Nº de discos por rueda', newNumDiscos.toString()],
        ].map(
          ([label, val]) =>
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: label })],
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      text: val,
                      alignment: AlignmentType.RIGHT,
                    }),
                  ],
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
              ],
            }),
        ),
      });

      out.push(tablaReformado);
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Para la realización del cálculo, aplicamos una fuerza de 50 kg en la maneta de freno. Del manual del vehículo obtenemos los siguientes datos:',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const tablaDatosManualReformado = new Table({
        width: { size: 70, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'Fuerza ejercida en la maneta (Fep)',
                        italics: true,
                      }),
                    ],
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: `${fuerzaPedalKg} Kg -> ${fuerzaPedalN.toFixed(1).replace('.', ',')} N`,
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'Relación de desmultiplicación (Rp)',
                        italics: true,
                      }),
                    ],
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: `1:${relacionPedal}`,
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'coeficiente de fricción (µF)' }),
                    ],
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: coefFriccion.toString().replace('.', ','),
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    text: 'Radio del neumático',
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text:
                      newradioNeumatico
                        .toFixed(5)
                        .toString()
                        .replace('.', ',') + ' m',
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
            ],
          }),
        ],
      });

      out.push(tablaDatosManualReformado);
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Se ha mantenido original todo el circuito del líquido de frenos',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      out.push(
        new Paragraph({
          text: 'Una vez conocidos todos los datos, empezamos a realizar los cálculos.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Para conocer la influencia de la maneta de freno sobre el sistema, cabe resaltar que la maneta es un elemento amplificador de la fuerza que ejerce el conductor. Las ecuaciones que se muestran a continuación son para un sistema de frenado sin servofreno. Por lo tanto, para conocer el valor de la fuerza que se ejerce sobre el sistema se emplea la siguiente expresión, donde se puede apreciar como la fuerza aplicada por el conductor (',
            }),
            new TextRun({ text: 'Fep', italics: true }),
            new TextRun({
              text: ') se multiplica por la relación de la maneta (',
            }),
            new TextRun({ text: 'Rp', italics: true }),
            new TextRun({ text: ').' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'SP', subScript: true, bold: true }),
            new TextRun({ text: ' = F', italics: true, bold: true }),
            new TextRun({ text: 'ep', subScript: true, bold: true }),
            new TextRun({ text: ' * R', italics: true, bold: true }),
            new TextRun({ text: 'p', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Lo primero que calculamos, es la fuerza de salida de la maneta (',
            }),
            new TextRun({ text: 'FSP', italics: true }),
            new TextRun({ text: ') con la aplicación de la fuerza de ' }),
            new TextRun({
              text: fuerzaPedalN.toFixed(1).replace('.', ',') + ' N.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      // Nota: fuerzaSalidaFsp ya se calculó arriba (490.5 * 5 = 2452.5), se reutiliza
      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'sp', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + fuerzaSalidaFsp.toFixed(1).replace('.', ',') + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Una vez conocida la fuerza, calculamos la presión teórica de la bomba (',
            }),
            new TextRun({ text: 'PB', italics: true }),
            new TextRun({
              text: '). Suponemos que el líquido que se utiliza en el sistema de frenado es totalmente incompresible, y que los conductos del circuito hidráulico son totalmente rígidos.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      // Cálculos específicos para el SISTEMA REFORMADO
      const newRadioBombaFrenos = newDiametroBomba / 2;
      const newAreaBombaFrenos = Math.PI * Math.pow(newRadioBombaFrenos, 2);
      const newPresionBombaFrenos = fuerzaSalidaFsp / newAreaBombaFrenos;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'P', italics: true, bold: true }),
            new TextRun({ text: 'B', subScript: true, bold: true }),
            new TextRun({ text: ' = ' }),
            new TextRun({ text: 'F', italics: true }),
            new TextRun({ text: 'SP', subScript: true }),
            new TextRun({ text: ' / A', italics: true }),
            new TextRun({ text: 'b', subScript: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'P', bold: true }),
            new TextRun({ text: 'B', subScript: true, bold: true }),
            new TextRun({
              text:
                ' = ' +
                newPresionBombaFrenos.toFixed(2).replace('.', ',') +
                ' N/m²',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Siendo ' }),
            new TextRun({ text: 'Ab', italics: true }),
            new TextRun({ text: ' el área del cilindro hidráulico.' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Suponiendo que durante todo el recorrido del circuito hidráulico no existen perdidas, se extrae que la presión será igual en todos los puntos de este. Por ello, podemos afirmar que la presión de la salida del bombín de frenado es la misma que llega al pistón de pinza de frenos (PPF).',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'P', italics: true }),
            new TextRun({ text: 'B', subScript: true, italics: true }),
            new TextRun({ text: ' = P', italics: true }),
            new TextRun({ text: 'PF', subScript: true, italics: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'En el final del recorrido del circuito hidráulico, el líquido de frenos ejerce una presión sobre los pistones de la pinza de freno. Este último elemento es el encargado de generar y transformar esa presión hidráulica en fuerza mecánica lineal, que posteriormente se aplicará sobre las pastillas de freno.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Una vez conocemos la presión que ejerce la pinza de frenos, podemos calcular la fuerza que se ejerce sobre la pastilla de frenos (',
            }),
            new TextRun({ text: 'FP', italics: true }),
            new TextRun({ text: ').' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'P', subScript: true, bold: true }),
            new TextRun({ text: ' = Nº', bold: true }),
            new TextRun({ text: 'PISTONES', subScript: true, bold: true }),
            new TextRun({ text: ' * P', italics: true, bold: true }),
            new TextRun({ text: 'PF', subScript: true, bold: true }),
            new TextRun({ text: ' * A', italics: true, bold: true }),
            new TextRun({ text: 'PP', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Siendo ' }),
            new TextRun({ text: 'APP', italics: true }),
            new TextRun({ text: ' el área del pistón de la pinza.' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      // Cálculos fuerza pistón REFORMADO
      const newRadioPistonFrenos = newDimensionPiston / 2;
      const newAreaPistonFrenos = Math.PI * Math.pow(newRadioPistonFrenos, 2);
      const newFuerzaPistonFrenos =
        newNumPistones * newPresionBombaFrenos * newAreaPistonFrenos;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'P', subScript: true, bold: true }),
            new TextRun({
              text:
                ' = ' +
                newFuerzaPistonFrenos.toFixed(2).replace('.', ',') +
                ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Una vez conocida la fuerza generada por la presión hidráulica, la multiplicamos por el coeficiente de fricción que hay entre el disco y la pastilla (',
            }),
            new TextRun({ text: 'μF', italics: true }),
            new TextRun({
              text: '), y así conoceremos cual es la fuerza de fricción (',
            }),
            new TextRun({ text: 'FFF', italics: true }),
            new TextRun({
              text: ') que tenemos entre el disco y la pastilla.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Las condiciones que tomamos para la realización de estos cálculos para un ',
            }),
            new TextRun({ text: 'μF=0,4', italics: true }),
            new TextRun({
              text: ' que pertenece al coeficiente de fricción entre un disco de acero y un juego de pastillas de compuesto orgánico.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
            new TextRun({ text: ' = F', italics: true, bold: true }),
            new TextRun({ text: 'P', subScript: true, bold: true }),
            new TextRun({ text: ' * μ', italics: true, bold: true }),
            new TextRun({ text: 'F', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const newFuerzaFriccionFrenos = newFuerzaPistonFrenos * coefFriccion;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + newFuerzaFriccionFrenos.toFixed(0) + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Calculamos la fuerza total que generemos con la fuerza de fricción.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'TFF', subScript: true, bold: true }),
            new TextRun({
              text: ` = ${(newNumDiscos ?? 0) * 1} * F`,
              italics: true,
              bold: true,
            }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const newFuerzaTotalFriccionFrenos =
        (newNumDiscos ?? 0) * 1 * newFuerzaFriccionFrenos;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'TFF', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + newFuerzaTotalFriccionFrenos.toFixed(0) + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Una vez conocida la fuerza de rozamiento, el siguiente paso es conocer los pares de frenado producidos por el contacto entre el disco y las pastillas.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'N', italics: true, bold: true }),
            new TextRun({ text: 'F', subScript: true, bold: true }),
            new TextRun({ text: ' = M * F', italics: true, bold: true }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
            new TextRun({ text: ' * R', italics: true, bold: true }),
            new TextRun({ text: 'E', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Siendo ' }),
            new TextRun({ text: 'M', italics: true }),
            new TextRun({ text: ' el número de pastillas en cada disco y ' }),
            new TextRun({ text: 'RE', italics: true }),
            new TextRun({ text: ' el radio efectivo del disco.' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      out.push(
        new Paragraph({
          text: 'Par de frenado en una rueda trasera:',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const newRadioEfectivo = newRadioExt + (newRadioInt - newRadioExt) / 2;
      console.log('newRadioEfectivo', newRadioEfectivo);
      const newParFrenado = 1 * newFuerzaFriccionFrenos * newRadioEfectivo;
      console.log('newParFrenado', newParFrenado);

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'N', bold: true }),
            new TextRun({ text: 'F', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + newParFrenado.toFixed(4).replace('.', ',') + ' Nm',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Al considerar que tanto el neumático como el disco de frenos están anclados al buje, que es el elemento del eje que permite el giro; el par en ambos será constante en todo momento. Por lo tanto, suponiendo que el par producido en el disco es el mismo que en los neumáticos, se crea una fuerza de reacción (fuerza de frenado (FFR)) que se genera en la calzada, producida por el contacto entre el neumático y el asfalto.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true }),
            new TextRun({ text: 'FR', subScript: true, italics: true }),
            new TextRun({ text: ' = ' }),
            new TextRun({ text: 'N', italics: true }),
            new TextRun({ text: 'F', subScript: true, italics: true }),
            new TextRun({ text: ' / R', italics: true }),
            new TextRun({ text: 'N', subScript: true, italics: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Donde ' }),
            new TextRun({ text: 'R', italics: true }),
            new TextRun({ text: 'N', subScript: true, italics: true }),
            new TextRun({ text: ' es el radio del neumático' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      const newFuerzaReaccionFfr = newParFrenado / newradioNeumatico;

      out.push(
        new Paragraph({
          text: 'Fuerza de frenado en una pinza:',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'FR', subScript: true, bold: true }),
            new TextRun({
              text:
                ' = ' +
                newFuerzaReaccionFfr.toFixed(3).replace('.', ',') +
                ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: `Fuerza total de frenado en las ruedas traseras (${pinzaMoto.numPinzasTraseras ?? 0 * 1} pinzas):`,
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const newFuerzaTotalFrenadoFtf =
        (pinzaMoto.numPinzasTraseras ?? 0) * 1 * newFuerzaReaccionFfr;

      out.push(
        new Paragraph({
          text: `Fuerza total de frenado (FTF) = ${(pinzaMoto.numPinzasTraseras ?? 0) * 1}*FFR`,
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text:
                'FTF = ' +
                newFuerzaTotalFrenadoFtf.toFixed(2).replace('.', ',') +
                ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Podemos concluir que el sistema de frenado instalado es más eficaz que el que montaba el vehículo en origen ya que la Fuerza total de frenado es superior, por lo tanto ',
            }),
            new TextRun({
              text: 'ES VÁLIDO.',
              bold: true,
              italics: true,
              underline: {
                type: UnderlineType.SINGLE,
              },
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
    }

    //Moto trasero
    if (pinzaMoto && pinzaMoto.pastillaTrasera) {
      out.push(new Paragraph({ text: '' }));
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '2.3.' + contador + ' Freno Trasero',
              bold: true,
              size: 24,
            }),
          ],
        }),
      );
      contador++;

      out.push(new Paragraph({ text: '' }));
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Sistema original (FRENOS DE DISCO)',
              bold: true,
            }),
          ],
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const diametroExt = pinzaMoto.ant_diametroExteriorDiscoTrasero ?? 0;
      const diametroInt = pinzaMoto.ant_diametroInteriorDiscoTrasero ?? 0;
      const radioExt = diametroExt / 2;
      const radioInt = diametroInt / 2;
      const diametroBomba = pinzaMoto.ant_diametroBombaTrasera ?? 0;
      const diametroPiston = pinzaMoto.ant_dimensionPistonTrasera ?? 0;
      const numPistones = pinzaMoto.ant_numPistonesTrasero ?? 0;
      const numPinzas = pinzaMoto.ant_numPinzasTraseras ?? 0;
      const numDiscos = pinzaMoto.ant_numDiscosTrasero ?? 0;

      const tablaDimensiones = new Table({
        width: { size: 60, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER,
        rows: [
          ['Diámetro exterior (m) ØDET', diametroExt + ' m'],
          ['Diámetro interior (m) ØDIT', diametroInt + ' m'],
          ['Radio exterior (m) RDET', radioExt + ' m'],
          ['Radio interior (m) RDIT', radioInt + ' m'],
          ['Diámetro bomba', diametroBomba + 'm'],
          ['Diámetro pistón', diametroPiston + 'm'],
          ['Número de pistones por pinza', numPistones.toString()],
          ['Nº de pinzas por rueda', numPinzas.toString()],
          ['Nº de discos por rueda', numDiscos.toString()],
        ].map(
          ([label, val]) =>
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: label })],
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      text: val,
                      alignment: AlignmentType.RIGHT,
                    }),
                  ],
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
              ],
            }),
        ),
      });

      out.push(tablaDimensiones);
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Para la realización del cálculo, aplicamos una fuerza de 50 kg en el pedal de freno. Del manual del vehículo obtenemos los siguientes datos:',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const fuerzaPedalKg = 50;
      const fuerzaPedalN = 490.5;
      const relacionPedal = 5;
      const coefFriccion = 0.4;
      const radioNeumatico =
        ((pinzaMoto.ant_radioNeumaticoDelantero ?? 0) * 25.4 +
          2 *
            (((pinzaMoto.ant_anchoNeumaticoDelantero ?? 0) *
              (pinzaMoto.ant_perfilNeumaticoDelantero ?? 0)) /
              100)) /
        2 /
        1000;
      console.log('radioNeumatico', radioNeumatico);

      const tablaDatosManual = new Table({
        width: { size: 70, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'Fuerza ejercida en la maneta (Fep)',
                        italics: true,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: `${fuerzaPedalKg} Kg -> ${fuerzaPedalN.toFixed(1).replace('.', ',')} N`,
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'Relación de desmultiplicación (Rp)',
                        italics: true,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: `1:${relacionPedal}`,
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'coeficiente de fricción (µF)' }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: coefFriccion.toString().replace('.', ','),
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    text: 'Radio del neumático',
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text:
                      radioNeumatico.toFixed(5).toString().replace('.', ',') +
                      ' m',
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      out.push(tablaDatosManual);
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Se ha mantenido original todo el circuito del líquido de frenos',
        }),
      );
      out.push(new Paragraph({ text: '' }));
      out.push(
        new Paragraph({
          text: 'Una vez conocidos todos los datos, empezamos a realizar los cálculos.',
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Para conocer la influencia de el pedal de freno sobre el sistema, cabe resaltar que el pedal es un elemento amplificador de la fuerza que ejerce el conductor. Las ecuaciones que se muestran a continuación son para un sistema de frenado sin servofreno. Por lo tanto, para conocer el valor de la fuerza que se ejerce sobre el sistema se emplea la siguiente expresión, donde se puede apreciar como la fuerza aplicada por el conductor (',
            }),
            new TextRun({ text: 'Fep', italics: true }),
            new TextRun({
              text: ') se multiplica por la relación de el pedal (',
            }),
            new TextRun({ text: 'Rp', italics: true }),
            new TextRun({ text: ').' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'SP', subScript: true, bold: true }),
            new TextRun({ text: ' = F', italics: true, bold: true }),
            new TextRun({ text: 'ep', subScript: true, bold: true }),
            new TextRun({ text: ' * R', italics: true, bold: true }),
            new TextRun({ text: 'p', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Lo primero que calculamos, es la fuerza de salida del pedal (',
            }),
            new TextRun({ text: 'FSP', italics: true }),
            new TextRun({ text: ') con la aplicación de la fuerza de ' }),
            new TextRun({
              text: fuerzaPedalN.toFixed(1).replace('.', ',') + ' N.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const fuerzaSalidaFsp = fuerzaPedalN * relacionPedal;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'sp', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + fuerzaSalidaFsp.toFixed(1).replace('.', ',') + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Una vez conocida la fuerza, calculamos la presión teórica de la bomba (',
            }),
            new TextRun({ text: 'PB', italics: true }),
            new TextRun({
              text: '). Suponemos que el líquido que se utiliza en el sistema de frenado es totalmente incompresible, y que los conductos del circuito hidráulico son totalmente rígidos.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      const radioBombaFrenos = diametroBomba / 2;
      const areaBombaFrenos = Math.PI * Math.pow(radioBombaFrenos, 2);

      const presionBombaFrenos =
        areaBombaFrenos > 0 ? fuerzaSalidaFsp / areaBombaFrenos : 0;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'P', italics: true, bold: true }),
            new TextRun({ text: 'B', subScript: true, bold: true }),
            new TextRun({ text: ' = ' }),
            new TextRun({ text: 'F', italics: true }),
            new TextRun({ text: 'SP', subScript: true }),
            new TextRun({ text: ' / A', italics: true }),
            new TextRun({ text: 'b', subScript: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'P', bold: true }),
            new TextRun({ text: 'B', subScript: true, bold: true }),
            new TextRun({
              text:
                ' = ' +
                presionBombaFrenos.toFixed(2).replace('.', ',') +
                ' N/m²',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Siendo ' }),
            new TextRun({ text: 'Ab', italics: true }),
            new TextRun({ text: ' el área del cilindro hidráulico.' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Suponiendo que durante todo el recorrido del circuito hidráulico no existen perdidas, se extrae que la presión será igual en todos los puntos de este. Por ello, podemos afirmar que la presión de la salida del bombín de frenado es la misma que llega al pistón de pinza de frenos (PPF).',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'P', italics: true }),
            new TextRun({ text: 'B', subScript: true, italics: true }),
            new TextRun({ text: ' = P', italics: true }),
            new TextRun({ text: 'PF', subScript: true, italics: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'En el final del recorrido del circuito hidráulico, el líquido de frenos ejerce una presión sobre los pistones de la pinza de freno. Este último elemento es el encargado de generar y transformar esa presión hidráulica en fuerza mecánica lineal, que posteriormente se aplicará sobre las pastillas de freno.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Una vez conocemos la presión que ejerce la pinza de frenos, podemos calcular la fuerza que se ejerce sobre la pastilla de frenos (',
            }),
            new TextRun({ text: 'FP', italics: true }),
            new TextRun({ text: ').' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'P', subScript: true, bold: true }),
            new TextRun({ text: ' = Nº', bold: true }),
            new TextRun({ text: 'PISTONES', subScript: true, bold: true }),
            new TextRun({ text: ' * P', italics: true, bold: true }),
            new TextRun({ text: 'PF', subScript: true, bold: true }),
            new TextRun({ text: ' * A', italics: true, bold: true }),
            new TextRun({ text: 'PP', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Siendo ' }),
            new TextRun({ text: 'APP', italics: true }),
            new TextRun({ text: ' el área del pistón de la pinza.' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const radioPistonFrenos = diametroPiston / 2;
      const areaPistonFrenos = Math.PI * Math.pow(radioPistonFrenos, 2);
      const fuerzaPistonFrenos =
        numPistones * presionBombaFrenos * areaPistonFrenos;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'P', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + fuerzaPistonFrenos.toFixed(2) + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Una vez conocida la fuerza generada por la presión hidráulica, la multiplicamos por el coeficiente de fricción que hay entre el disco y la pastilla (',
            }),
            new TextRun({ text: 'μF', italics: true }),
            new TextRun({
              text: '), y así conoceremos cual es la fuerza de fricción (',
            }),
            new TextRun({ text: 'FFF', italics: true }),
            new TextRun({
              text: ') que tenemos entre el disco y la pastilla.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Las condiciones que tomamos para la realización de estos cálculos para un ',
            }),
            new TextRun({ text: 'μF=0,4', italics: true }),
            new TextRun({
              text: ' que pertenece al coeficiente de fricción entre un disco de acero y un juego de pastillas de compuesto orgánico.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
            new TextRun({ text: ' = F', italics: true, bold: true }),
            new TextRun({ text: 'P', subScript: true, bold: true }),
            new TextRun({ text: ' * μ', italics: true, bold: true }),
            new TextRun({ text: 'F', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const fuerzaFriccionFrenos = fuerzaPistonFrenos * coefFriccion;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + fuerzaFriccionFrenos.toFixed(0) + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Calculamos la fuerza total que generemos con la fuerza de fricción.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'TFF', subScript: true, bold: true }),
            new TextRun({ text: ' = 2 * F', italics: true, bold: true }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const fuerzaTotalFriccionFrenos = 1 * fuerzaFriccionFrenos;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'TFF', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + fuerzaTotalFriccionFrenos.toFixed(0) + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Una vez conocida la fuerza de rozamiento, el siguiente paso es conocer los pares de frenado producidos por el contacto entre el disco y las pastillas.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'N', italics: true, bold: true }),
            new TextRun({ text: 'F', subScript: true, bold: true }),
            new TextRun({ text: ' = M * F', italics: true, bold: true }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
            new TextRun({ text: ' * R', italics: true, bold: true }),
            new TextRun({ text: 'E', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Siendo ' }),
            new TextRun({ text: 'M', italics: true }),
            new TextRun({ text: ' el número de pastillas en cada disco y ' }),
            new TextRun({ text: 'RE', italics: true }),
            new TextRun({ text: ' el radio efectivo del disco.' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      out.push(
        new Paragraph({
          text: 'Par de frenado en una rueda delantera:',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const radioEfectivo = radioInt + (radioExt - radioInt) / 2;
      console.log('radioEfectivo revisar', radioEfectivo);
      // Nota: En la imagen anterior Ftff = 2 * Fff. Y Nf se calcula usando esa fuerza total por el radio.
      // Basado en los números: 29317 * 0.11425 = ~3349
      const parFrenado = 2 * fuerzaFriccionFrenos * radioEfectivo;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'N', bold: true }),
            new TextRun({ text: 'F', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + parFrenado.toFixed(4).replace('.', ',') + ' Nm',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Al considerar que tanto el neumático como el disco de frenos están anclados al buje, que es el elemento del eje que permite el giro; el par en ambos será constante en todo momento. Por lo tanto, suponiendo que el par producido en el disco es el mismo que en los neumáticos, se crea una fuerza de reacción (fuerza de frenado (FFR)) que se genera en la calzada, producida por el contacto entre el neumático y el asfalto.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true }),
            new TextRun({ text: 'FR', subScript: true, italics: true }),
            new TextRun({ text: ' = ' }),
            new TextRun({ text: 'N', italics: true }),
            new TextRun({ text: 'F', subScript: true, italics: true }),
            new TextRun({ text: ' / R', italics: true }),
            new TextRun({ text: 'N', subScript: true, italics: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Donde ' }),
            new TextRun({ text: 'R', italics: true }),
            new TextRun({ text: 'N', subScript: true, italics: true }),
            new TextRun({ text: ' es el radio del neumático' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      const fuerzaReaccionFfr = parFrenado / radioNeumatico;

      out.push(
        new Paragraph({
          text: 'Fuerza de frenado en una pinza:',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'FR', subScript: true, bold: true }),
            new TextRun({
              text:
                ' = ' + fuerzaReaccionFfr.toFixed(4).replace('.', ',') + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: `Fuerza total de frenado en las rueda trasera (${(pinzaMoto.ant_numPinzasTraseras ?? 0) * 1} pinzas):`,
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const fuerzaTotalFrenadoFtf =
        (pinzaMoto.ant_numPinzasTraseras ?? 0) * 1 * fuerzaReaccionFfr;

      out.push(
        new Paragraph({
          text: `Fuerza total de frenado (FTF) = ${(pinzaMoto.ant_numPinzasTraseras ?? 0) * 1}*FFR`,
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text:
                'FTF = ' +
                fuerzaTotalFrenadoFtf.toFixed(2).replace('.', ',') +
                ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Sistema reformado (FRENOS DE DISCO)',
              bold: true,
            }),
          ],
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const newDiametroExt = pinzaMoto.diametroExteriorDiscoTrasero ?? 0;
      const newDiametroInt = pinzaMoto.diametroInteriorDiscoTrasero ?? 0;
      const newRadioExt = newDiametroExt / 2;
      const newRadioInt = newDiametroInt / 2;
      const newDiametroBomba = pinzaMoto.diametroBombaDiscoTrasero ?? 0;
      const newDimensionPiston = pinzaMoto.dimensionPistonDiscoTrasero ?? 0;
      const newNumPistones = pinzaMoto.numPistonesDiscoTrasero ?? 0;
      const newNumPinzas = pinzaMoto.numPinzasTraseras ?? 0;
      const newNumDiscos = pinzaMoto.numDiscosTrasero ?? 0;

      const newradioNeumatico =
        ((pinzaMoto.radioNeumaticoDiscoTrasero ?? 0) * 25.4 +
          2 *
            (((pinzaMoto.perfilNeumaticoDiscoTrasero ?? 0) *
              (pinzaMoto.anchoNeumaticoDiscoTrasero ?? 0)) /
              100)) /
        2 /
        1000;
      console.log('newradioNeumatico', newradioNeumatico);

      const tablaReformado = new Table({
        width: { size: 60, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER,
        rows: [
          ['Diámetro exterior (m) ØDET', newDiametroExt + ' m'],
          ['Diámetro interior (m) ØDIT', newDiametroInt + ' m'],
          ['Radio exterior (m) RDET', newRadioExt + ' m'],
          ['Radio interior (m) RDIT', newRadioInt + ' m'],
          ['Diámetro bomba', newDiametroBomba + 'm'],
          ['Diámetro pistón', newDimensionPiston + 'm'],
          ['Número de pistones por pinza', newNumPistones.toString()],
          ['Nº de pinzas por rueda', newNumPinzas.toString()],
          ['Nº de discos por rueda', newNumDiscos.toString()],
        ].map(
          ([label, val]) =>
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: label })],
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      text: val,
                      alignment: AlignmentType.RIGHT,
                    }),
                  ],
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
              ],
            }),
        ),
      });

      out.push(tablaReformado);
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Para la realización del cálculo, aplicamos una fuerza de 50 kg en el pedal de freno. Del manual del vehículo obtenemos los siguientes datos:',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const tablaDatosManualReformado = new Table({
        width: { size: 70, type: WidthType.PERCENTAGE },
        alignment: AlignmentType.CENTER,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'Fuerza ejercida en el pedal (Fep)',
                        italics: true,
                      }),
                    ],
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: `${fuerzaPedalKg} Kg -> ${fuerzaPedalN.toFixed(1).replace('.', ',')} N`,
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'Relación de desmultiplicación (Rp)',
                        italics: true,
                      }),
                    ],
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: `1:${relacionPedal}`,
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'coeficiente de fricción (µF)' }),
                    ],
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text: coefFriccion.toString().replace('.', ','),
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    text: 'Radio del neumático',
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    text:
                      newradioNeumatico
                        .toFixed(5)
                        .toString()
                        .replace('.', ',') + ' m',
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1 },
                  bottom: { style: BorderStyle.SINGLE, size: 1 },
                  left: { style: BorderStyle.SINGLE, size: 1 },
                  right: { style: BorderStyle.SINGLE, size: 1 },
                },
              }),
            ],
          }),
        ],
      });

      out.push(tablaDatosManualReformado);
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Se ha mantenido original todo el circuito del líquido de frenos',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      out.push(
        new Paragraph({
          text: 'Una vez conocidos todos los datos, empezamos a realizar los cálculos.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Para conocer la influencia del pedal de freno sobre el sistema, cabe resaltar que el pedal es un elemento amplificador de la fuerza que ejerce el conductor. Las ecuaciones que se muestran a continuación son para un sistema de frenado sin servofreno. Por lo tanto, para conocer el valor de la fuerza que se ejerce sobre el sistema se emplea la siguiente expresión, donde se puede apreciar como la fuerza aplicada por el conductor (',
            }),
            new TextRun({ text: 'Fep', italics: true }),
            new TextRun({
              text: ') se multiplica por la relación del pedal (',
            }),
            new TextRun({ text: 'Rp', italics: true }),
            new TextRun({ text: ').' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'SP', subScript: true, bold: true }),
            new TextRun({ text: ' = F', italics: true, bold: true }),
            new TextRun({ text: 'ep', subScript: true, bold: true }),
            new TextRun({ text: ' * R', italics: true, bold: true }),
            new TextRun({ text: 'p', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Lo primero que calculamos, es la fuerza de salida del pedal (',
            }),
            new TextRun({ text: 'FSP', italics: true }),
            new TextRun({ text: ') con la aplicación de la fuerza de ' }),
            new TextRun({
              text: fuerzaPedalN.toFixed(1).replace('.', ',') + ' N.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      // Nota: fuerzaSalidaFsp ya se calculó arriba (490.5 * 5 = 2452.5), se reutiliza
      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'sp', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + fuerzaSalidaFsp.toFixed(1).replace('.', ',') + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Una vez conocida la fuerza, calculamos la presión teórica de la bomba (',
            }),
            new TextRun({ text: 'PB', italics: true }),
            new TextRun({
              text: '). Suponemos que el líquido que se utiliza en el sistema de frenado es totalmente incompresible, y que los conductos del circuito hidráulico son totalmente rígidos.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      // Cálculos específicos para el SISTEMA REFORMADO
      const newRadioBombaFrenos = newDiametroBomba / 2;
      const newAreaBombaFrenos = Math.PI * Math.pow(newRadioBombaFrenos, 2);
      const newPresionBombaFrenos = fuerzaSalidaFsp / newAreaBombaFrenos;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'P', italics: true, bold: true }),
            new TextRun({ text: 'B', subScript: true, bold: true }),
            new TextRun({ text: ' = ' }),
            new TextRun({ text: 'F', italics: true }),
            new TextRun({ text: 'SP', subScript: true }),
            new TextRun({ text: ' / A', italics: true }),
            new TextRun({ text: 'b', subScript: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'P', bold: true }),
            new TextRun({ text: 'B', subScript: true, bold: true }),
            new TextRun({
              text:
                ' = ' +
                newPresionBombaFrenos.toFixed(2).replace('.', ',') +
                ' N/m²',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Siendo ' }),
            new TextRun({ text: 'Ab', italics: true }),
            new TextRun({ text: ' el área del cilindro hidráulico.' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Suponiendo que durante todo el recorrido del circuito hidráulico no existen perdidas, se extrae que la presión será igual en todos los puntos de este. Por ello, podemos afirmar que la presión de la salida del bombín de frenado es la misma que llega al pistón de pinza de frenos (PPF).',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'P', italics: true }),
            new TextRun({ text: 'B', subScript: true, italics: true }),
            new TextRun({ text: ' = P', italics: true }),
            new TextRun({ text: 'PF', subScript: true, italics: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'En el final del recorrido del circuito hidráulico, el líquido de frenos ejerce una presión sobre los pistones de la pinza de freno. Este último elemento es el encargado de generar y transformar esa presión hidráulica en fuerza mecánica lineal, que posteriormente se aplicará sobre las pastillas de freno.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Una vez conocemos la presión que ejerce la pinza de frenos, podemos calcular la fuerza que se ejerce sobre la pastilla de frenos (',
            }),
            new TextRun({ text: 'FP', italics: true }),
            new TextRun({ text: ').' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'P', subScript: true, bold: true }),
            new TextRun({ text: ' = Nº', bold: true }),
            new TextRun({ text: 'PISTONES', subScript: true, bold: true }),
            new TextRun({ text: ' * P', italics: true, bold: true }),
            new TextRun({ text: 'PF', subScript: true, bold: true }),
            new TextRun({ text: ' * A', italics: true, bold: true }),
            new TextRun({ text: 'PP', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Siendo ' }),
            new TextRun({ text: 'APP', italics: true }),
            new TextRun({ text: ' el área del pistón de la pinza.' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      // Cálculos fuerza pistón REFORMADO
      const newRadioPistonFrenos = newDimensionPiston / 2;
      const newAreaPistonFrenos = Math.PI * Math.pow(newRadioPistonFrenos, 2);
      const newFuerzaPistonFrenos =
        newNumPistones * newPresionBombaFrenos * newAreaPistonFrenos;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'P', subScript: true, bold: true }),
            new TextRun({
              text:
                ' = ' +
                newFuerzaPistonFrenos.toFixed(2).replace('.', ',') +
                ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Una vez conocida la fuerza generada por la presión hidráulica, la multiplicamos por el coeficiente de fricción que hay entre el disco y la pastilla (',
            }),
            new TextRun({ text: 'μF', italics: true }),
            new TextRun({
              text: '), y así conoceremos cual es la fuerza de fricción (',
            }),
            new TextRun({ text: 'FFF', italics: true }),
            new TextRun({
              text: ') que tenemos entre el disco y la pastilla.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Las condiciones que tomamos para la realización de estos cálculos para un ',
            }),
            new TextRun({ text: 'μF=0,4', italics: true }),
            new TextRun({
              text: ' que pertenece al coeficiente de fricción entre un disco de acero y un juego de pastillas de compuesto orgánico.',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
            new TextRun({ text: ' = F', italics: true, bold: true }),
            new TextRun({ text: 'P', subScript: true, bold: true }),
            new TextRun({ text: ' * μ', italics: true, bold: true }),
            new TextRun({ text: 'F', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const newFuerzaFriccionFrenos = newFuerzaPistonFrenos * coefFriccion;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + newFuerzaFriccionFrenos.toFixed(0) + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Calculamos la fuerza total que generemos con la fuerza de fricción.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true, bold: true }),
            new TextRun({ text: 'TFF', subScript: true, bold: true }),
            new TextRun({
              text: ` = ${(newNumDiscos ?? 0) * 1} * F`,
              italics: true,
              bold: true,
            }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const newFuerzaTotalFriccionFrenos =
        (newNumDiscos ?? 0) * 1 * newFuerzaFriccionFrenos;

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'TFF', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + newFuerzaTotalFriccionFrenos.toFixed(0) + ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Una vez conocida la fuerza de rozamiento, el siguiente paso es conocer los pares de frenado producidos por el contacto entre el disco y las pastillas.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'N', italics: true, bold: true }),
            new TextRun({ text: 'F', subScript: true, bold: true }),
            new TextRun({ text: ' = M * F', italics: true, bold: true }),
            new TextRun({ text: 'FF', subScript: true, bold: true }),
            new TextRun({ text: ' * R', italics: true, bold: true }),
            new TextRun({ text: 'E', subScript: true, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Siendo ' }),
            new TextRun({ text: 'M', italics: true }),
            new TextRun({ text: ' el número de pastillas en cada disco y ' }),
            new TextRun({ text: 'RE', italics: true }),
            new TextRun({ text: ' el radio efectivo del disco.' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      out.push(
        new Paragraph({
          text: 'Par de frenado en una rueda trasera:',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const newRadioEfectivo = newRadioExt + (newRadioInt - newRadioExt) / 2;
      console.log('newRadioEfectivo', newRadioEfectivo);
      const newParFrenado = 1 * newFuerzaFriccionFrenos * newRadioEfectivo;
      console.log('newParFrenado', newParFrenado);

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'N', bold: true }),
            new TextRun({ text: 'F', subScript: true, bold: true }),
            new TextRun({
              text: ' = ' + newParFrenado.toFixed(4).replace('.', ',') + ' Nm',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Al considerar que tanto el neumático como el disco de frenos están anclados al buje, que es el elemento del eje que permite el giro; el par en ambos será constante en todo momento. Por lo tanto, suponiendo que el par producido en el disco es el mismo que en los neumáticos, se crea una fuerza de reacción (fuerza de frenado (FFR)) que se genera en la calzada, producida por el contacto entre el neumático y el asfalto.',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', italics: true }),
            new TextRun({ text: 'FR', subScript: true, italics: true }),
            new TextRun({ text: ' = ' }),
            new TextRun({ text: 'N', italics: true }),
            new TextRun({ text: 'F', subScript: true, italics: true }),
            new TextRun({ text: ' / R', italics: true }),
            new TextRun({ text: 'N', subScript: true, italics: true }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Donde ' }),
            new TextRun({ text: 'R', italics: true }),
            new TextRun({ text: 'N', subScript: true, italics: true }),
            new TextRun({ text: ' es el radio del neumático' }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );

      const newFuerzaReaccionFfr = newParFrenado / newradioNeumatico;

      out.push(
        new Paragraph({
          text: 'Fuerza de frenado en una pinza:',
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'F', bold: true }),
            new TextRun({ text: 'FR', subScript: true, bold: true }),
            new TextRun({
              text:
                ' = ' +
                newFuerzaReaccionFfr.toFixed(3).replace('.', ',') +
                ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: `Fuerza total de frenado en las ruedas traseras (${pinzaMoto.numPinzasTraseras ?? 0 * 1} pinzas):`,
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      const newFuerzaTotalFrenadoFtf =
        (pinzaMoto.numPinzasTraseras ?? 0) * 1 * newFuerzaReaccionFfr;

      out.push(
        new Paragraph({
          text: `Fuerza total de frenado (FTF) = ${(pinzaMoto.numPinzasTraseras ?? 0) * 1}*FFR`,
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text:
                'FTF = ' +
                newFuerzaTotalFrenadoFtf.toFixed(2).replace('.', ',') +
                ' N',
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      );
      out.push(new Paragraph({ text: '' }));

      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Podemos concluir que el sistema de frenado instalado es más eficaz que el que montaba el vehículo en origen ya que la Fuerza total de frenado es superior, por lo tanto ',
            }),
            new TextRun({
              text: 'ES VÁLIDO.',
              bold: true,
              italics: true,
              underline: {
                type: UnderlineType.SINGLE,
              },
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
        }),
      );
    }

    const aleron = modificaciones.find(
      (m) => m.nombre === 'ALERÓN' && m.seleccionado,
    );
    if (aleron) {
      out.push(new Paragraph({ text: '' }));
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '2.3.' + contador + ' Alerón',
              bold: true,
            }),
          ],
        }),
      );

      contador++;

      const superficiefrontal = aleron.superficieFrontalM2Aleron;

      const peso = 9.81 * (aleron.pesoAleron ?? 0);
      const fuerzafrenado = (aleron.pesoAleron ?? 0) * 10;
      const resistenciaaerodinamica =
        0.5 *
        (aleron.coefAerodinamicoCwAleron ?? 0) *
        (superficiefrontal ?? 0) *
        (aleron.densidadAireKgM3Aleron ?? 0) *
        (aleron.velocidadAireV2msAleron ?? 0) *
        (aleron.velocidadAireV2msAleron ?? 0);
      const fuerzacentrifuga =
        (aleron.pesoAleron ?? 0) *
        (((aleron.velocidadAireV2msAleron ?? 0) *
          (aleron.velocidadAireV2msAleron ?? 0)) /
          ((aleron.curvaturaAleron ?? 0) * 100));
      const sumadelasfuerzas =
        peso + fuerzafrenado + resistenciaaerodinamica + fuerzacentrifuga;

      const tablaCaracteristicas = new Table({
        width: { size: 70, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: CELL_MARGINS,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'CARACTERÍSTICAS PARA FUERZA PRODUCIDA POR PRESIÓN DEL AIRE',
                      }),
                    ],
                  }),
                ],
                columnSpan: 2,
              }),
            ],
          }),
          ...[
            [
              'Cw=Coef. Aerodinámico',
              aleron.coefAerodinamicoCwAleron?.toFixed(2).toString() ?? '---',
            ],
            [
              'A =área de la pieza (m²)',
              superficiefrontal?.toFixed(2).toString() ?? '---',
            ],
            [
              'ρ (densidad del aire (Kg/m³)',
              aleron.densidadAireKgM3Aleron?.toFixed(2).toString() ?? '---',
            ],
            [
              'V² = velocidad del aire 140Km/h (m/s)',
              aleron.velocidadAireV2msAleron?.toFixed(2).toString() ?? '---',
            ],
            [
              'R (radio de curva) m',
              aleron.curvaturaAleron?.toFixed(2).toString() ?? '---',
            ],
            [
              'K (coeficiente de seguridad)',
              aleron.coefSeguridadKAleron?.toFixed(2).toString() ?? '---',
            ],
          ].map(
            ([desc, val]) =>
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    verticalAlign: AlignmentType.CENTER,
                    children: [
                      new Paragraph({
                        text: desc,
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                  }),
                  new TableCell({
                    verticalAlign: AlignmentType.CENTER,
                    children: [new Paragraph(val)],
                  }),
                ],
              }),
          ),
        ],
      });

      const tablaFuerzas = new Table({
        width: { size: 80, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: ['FUERZAS QUE ACTÚAN SOBRE LA PIEZA (N)'].map(
              (heading) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  verticalAlign: VerticalAlign.CENTER,
                  columnSpan: 5,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: heading })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              'Peso',
              'Fuerza de frenado',
              'Resistencia aerodinámica',
              'Fuerza centrífuga',
              'Suma de fuerzas',
            ].map(
              (t) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: t })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              peso.toFixed(2).toString() ?? '---',
              fuerzafrenado.toFixed(2).toString() ?? '---',
              resistenciaaerodinamica.toFixed(2).toString() ?? '---',
              fuerzacentrifuga.toFixed(2).toString() ?? '---',
              sumadelasfuerzas.toFixed(2).toString() ?? '---',
            ].map(
              (v) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: v })],
                    }),
                  ],
                }),
            ),
          }),
        ],
      });

      const fuerzadediseno =
        sumadelasfuerzas * (aleron.coefSeguridadKAleron ?? 0);
      const fuerzamaximatornillostraccion =
        ((0.9 *
          (aleron.resTraccionMinTornillo88Kgmm2Aleron ?? 0) *
          (aleron.seccionResistenteAsAleron ?? 0)) /
          1.25) *
        (aleron.numTornillosAleron ?? 0);
      const fuerzamaximatornilloscortante =
        ((0.5 *
          (aleron.resTraccionMinTornillo88Kgmm2Aleron ?? 0) *
          (aleron.seccionResistenteAsAleron ?? 0)) /
          1.25) *
        (aleron.numTornillosAleron ?? 0);
      const comprobacion =
        fuerzadediseno / fuerzamaximatornilloscortante +
        fuerzadediseno / (1.4 * fuerzamaximatornillostraccion);

      const tablaComprobacion = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              'La fuerza de diseño soportada por los anclajes (N)',
              'Fuerza máxima que soportan los tornillos a tracción (N)',
              'Fuerza máxima que soportan los tornillos a cortante (N)',
              'Comprobación <= 1',
            ].map(
              (t) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: t, bold: true })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              fuerzadediseno.toFixed(2).toString() ?? '---',
              fuerzamaximatornillostraccion.toFixed(2).toString() ?? '---',
              fuerzamaximatornilloscortante.toFixed(2).toString() ?? '---',
              comprobacion.toFixed(2).toString() ?? '---',
            ].map(
              (v, i) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  shading:
                    i === 0
                      ? undefined
                      : i === 3 && comprobacion > 1
                        ? { type: ShadingType.CLEAR, fill: 'FF0000' }
                        : { type: ShadingType.CLEAR, fill: '00B050' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: v })],
                    }),
                  ],
                }),
            ),
          }),
        ],
      });

      out.push(tablaCaracteristicas);
      out.push(new Paragraph({ text: '' }));
      out.push(tablaFuerzas);
      out.push(new Paragraph({ text: '' }));
      out.push(tablaComprobacion);
    }

    const peldaños = modificaciones.find(
      (m) => m.nombre === 'PELDAÑOS' && m.seleccionado,
    );
    if (peldaños) {
      out.push(new Paragraph({ text: '' }));
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '2.3.' + contador + ' Peldaños',
              bold: true,
            }),
          ],
        }),
      );

      contador++;

      const superficiefrontal = peldaños.superficieFrontalM2Peldanos;

      const peso = 9.81 * (peldaños.pesoPeldanos ?? 0);
      const fuerzafrenado = (peldaños.pesoPeldanos ?? 0) * 10;
      const resistenciaaerodinamica =
        0.5 *
        (peldaños.coefAerodinamicoCwPeldanos ?? 0) *
        (superficiefrontal ?? 0) *
        (peldaños.densidadAireKgM3Peldanos ?? 0) *
        (peldaños.velocidadAireV2msPeldanos ?? 0) *
        (peldaños.velocidadAireV2msPeldanos ?? 0);
      const fuerzacentrifuga =
        (peldaños.pesoPeldanos ?? 0) *
        (((peldaños.velocidadAireV2msPeldanos ?? 0) *
          (peldaños.velocidadAireV2msPeldanos ?? 0)) /
          ((peldaños.radioCurvaRPeldanos ?? 0) * 100));
      const sumadelasfuerzas =
        peso + fuerzafrenado + resistenciaaerodinamica + fuerzacentrifuga;

      const tablaCaracteristicas = new Table({
        width: { size: 70, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: CELL_MARGINS,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'CARACTERÍSTICAS PARA FUERZA PRODUCIDA POR PRESIÓN DEL AIRE',
                      }),
                    ],
                  }),
                ],
                columnSpan: 2,
              }),
            ],
          }),
          ...[
            [
              'Cw=Coef. Aerodinámico',
              peldaños.coefAerodinamicoCwPeldanos?.toFixed(2).toString() ??
                '---',
            ],
            [
              'A =área de la pieza (m²)',
              superficiefrontal?.toFixed(2).toString() ?? '---',
            ],
            [
              'ρ (densidad del aire (Kg/m³)',
              peldaños.densidadAireKgM3Peldanos?.toFixed(2).toString() ?? '---',
            ],
            [
              'V² = velocidad del aire 140Km/h (m/s)',
              peldaños.velocidadAireV2msPeldanos?.toFixed(2).toString() ??
                '---',
            ],
            [
              'R (radio de curva) m',
              peldaños.radioCurvaRPeldanos?.toFixed(2).toString() ?? '---',
            ],
            [
              'K (coeficiente de seguridad)',
              peldaños.coefSeguridadKPeldanos?.toFixed(2).toString() ?? '---',
            ],
          ].map(
            ([desc, val]) =>
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    verticalAlign: AlignmentType.CENTER,
                    children: [
                      new Paragraph({
                        text: desc,
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                  }),
                  new TableCell({
                    verticalAlign: AlignmentType.CENTER,
                    children: [new Paragraph(val)],
                  }),
                ],
              }),
          ),
        ],
      });

      const tablaFuerzas = new Table({
        width: { size: 80, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: ['FUERZAS QUE ACTÚAN SOBRE LA PIEZA (N)'].map(
              (heading) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  verticalAlign: VerticalAlign.CENTER,
                  columnSpan: 5,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: heading })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              'Peso',
              'Fuerza de frenado',
              'Resistencia aerodinámica',
              'Fuerza centrífuga',
              'Suma de fuerzas',
            ].map(
              (t) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: t })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              peso.toFixed(2).toString() ?? '---',
              fuerzafrenado.toFixed(2).toString() ?? '---',
              resistenciaaerodinamica.toFixed(2).toString() ?? '---',
              fuerzacentrifuga.toFixed(2).toString() ?? '---',
              sumadelasfuerzas.toFixed(2).toString() ?? '---',
            ].map(
              (v) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: v })],
                    }),
                  ],
                }),
            ),
          }),
        ],
      });

      const fuerzadediseno =
        sumadelasfuerzas * (peldaños.coefSeguridadKPeldanos ?? 0);
      const fuerzamaximatornillostraccion =
        ((0.9 *
          (peldaños.resTraccionMinTornillo88Kgmm2Peldanos ?? 0) *
          (peldaños.seccionResistenteAsPeldanos ?? 0)) /
          1.25) *
        (peldaños.numTornillosPeldanos ?? 0);
      const fuerzamaximatornilloscortante =
        ((0.5 *
          (peldaños.resTraccionMinTornillo88Kgmm2Peldanos ?? 0) *
          (peldaños.seccionResistenteAsPeldanos ?? 0)) /
          1.25) *
        (peldaños.numTornillosPeldanos ?? 0);
      const comprobacion =
        fuerzadediseno / fuerzamaximatornilloscortante +
        fuerzadediseno / (1.4 * fuerzamaximatornillostraccion);

      const tablaComprobacion = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              'La fuerza de diseño soportada por los anclajes (N)',
              'Fuerza máxima que soportan los tornillos a tracción (N)',
              'Fuerza máxima que soportan los tornillos a cortante (N)',
              'Comprobación <= 1',
            ].map(
              (t) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: t, bold: true })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              fuerzadediseno.toFixed(2).toString() ?? '---',
              fuerzamaximatornillostraccion.toFixed(2).toString() ?? '---',
              fuerzamaximatornilloscortante.toFixed(2).toString() ?? '---',
              comprobacion.toFixed(2).toString() ?? '---',
            ].map(
              (v, i) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  shading:
                    i === 0
                      ? undefined
                      : i === 3 && comprobacion > 1
                        ? { type: ShadingType.CLEAR, fill: 'FF0000' }
                        : { type: ShadingType.CLEAR, fill: '00B050' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: v })],
                    }),
                  ],
                }),
            ),
          }),
        ],
      });

      out.push(tablaCaracteristicas);
      out.push(new Paragraph({ text: '' }));
      out.push(tablaFuerzas);
      out.push(new Paragraph({ text: '' }));
      out.push(tablaComprobacion);
    }

    const difusor = modificaciones.find(
      (m) => m.nombre === 'DIFUSOR TRASERO' && m.seleccionado,
    );
    if (difusor) {
      out.push(new Paragraph({ text: '' }));
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '2.3.' + contador + ' Difusor trasero',
              bold: true,
            }),
          ],
        }),
      );

      contador++;

      const superficiefrontal = difusor.superficieFrontalM2Difusor;

      const peso = 9.81 * (difusor.pesoDifusor ?? 0);
      const fuerzafrenado = (difusor.pesoDifusor ?? 0) * 10;
      const resistenciaaerodinamica =
        0.5 *
        (difusor.coefAerodinamicoCwDifusor ?? 0) *
        (superficiefrontal ?? 0) *
        (difusor.densidadAireKgM3Difusor ?? 0) *
        (difusor.velocidadAireV2msDifusor ?? 0) *
        (difusor.velocidadAireV2msDifusor ?? 0);
      const fuerzacentrifuga =
        (difusor.pesoDifusor ?? 0) *
        (((difusor.velocidadAireV2msDifusor ?? 0) *
          (difusor.velocidadAireV2msDifusor ?? 0)) /
          ((difusor.radioCurvaRDifusor ?? 0) * 100));
      const sumadelasfuerzas =
        peso + fuerzafrenado + resistenciaaerodinamica + fuerzacentrifuga;

      const tablaCaracteristicas = new Table({
        width: { size: 70, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: CELL_MARGINS,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'CARACTERÍSTICAS PARA FUERZA PRODUCIDA POR PRESIÓN DEL AIRE',
                      }),
                    ],
                  }),
                ],
                columnSpan: 2,
              }),
            ],
          }),
          ...[
            [
              'Cw=Coef. Aerodinámico',
              difusor.coefAerodinamicoCwDifusor?.toFixed(2).toString() ?? '---',
            ],
            [
              'A =área de la pieza (m²)',
              superficiefrontal?.toFixed(2).toString() ?? '---',
            ],
            [
              'ρ (densidad del aire (Kg/m³)',
              difusor.densidadAireKgM3Difusor?.toFixed(2).toString() ?? '---',
            ],
            [
              'V² = velocidad del aire 140Km/h (m/s)',
              difusor.velocidadAireV2msDifusor?.toFixed(2).toString() ?? '---',
            ],
            [
              'R (radio de curva) m',
              difusor.radioCurvaRDifusor?.toFixed(2).toString() ?? '---',
            ],
            [
              'K (coeficiente de seguridad)',
              difusor.coefSeguridadKDifusor?.toFixed(2).toString() ?? '---',
            ],
          ].map(
            ([desc, val]) =>
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    verticalAlign: AlignmentType.CENTER,
                    children: [
                      new Paragraph({
                        text: desc,
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                  }),
                  new TableCell({
                    verticalAlign: AlignmentType.CENTER,
                    children: [new Paragraph(val)],
                  }),
                ],
              }),
          ),
        ],
      });

      const tablaFuerzas = new Table({
        width: { size: 80, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: ['FUERZAS QUE ACTÚAN SOBRE LA PIEZA (N)'].map(
              (heading) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  verticalAlign: VerticalAlign.CENTER,
                  columnSpan: 5,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: heading })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              'Peso',
              'Fuerza de frenado',
              'Resistencia aerodinámica',
              'Fuerza centrífuga',
              'Suma de fuerzas',
            ].map(
              (t) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: t })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              peso.toFixed(2).toString() ?? '---',
              fuerzafrenado.toFixed(2).toString() ?? '---',
              resistenciaaerodinamica.toFixed(2).toString() ?? '---',
              fuerzacentrifuga.toFixed(2).toString() ?? '---',
              sumadelasfuerzas.toFixed(2).toString() ?? '---',
            ].map(
              (v) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: v })],
                    }),
                  ],
                }),
            ),
          }),
        ],
      });

      const fuerzadediseno =
        sumadelasfuerzas * (difusor.coefSeguridadKDifusor ?? 0);
      const fuerzamaximatornillostraccion =
        ((0.9 *
          (difusor.resTraccionMinTornillo88Kgmm2Difusor ?? 0) *
          (difusor.seccionResistenteAsDifusor ?? 0)) /
          1.25) *
        (difusor.numTornillosDifusor ?? 0);
      const fuerzamaximatornilloscortante =
        ((0.5 *
          (difusor.resTraccionMinTornillo88Kgmm2Difusor ?? 0) *
          (difusor.seccionResistenteAsDifusor ?? 0)) /
          1.25) *
        (difusor.numTornillosDifusor ?? 0);
      const comprobacion =
        fuerzadediseno / fuerzamaximatornilloscortante +
        fuerzadediseno / (1.4 * fuerzamaximatornillostraccion);

      const tablaComprobacion = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              'La fuerza de diseño soportada por los anclajes (N)',
              'Fuerza máxima que soportan los tornillos a tracción (N)',
              'Fuerza máxima que soportan los tornillos a cortante (N)',
              'Comprobación <= 1',
            ].map(
              (t) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: t, bold: true })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              fuerzadediseno.toFixed(2).toString() ?? '---',
              fuerzamaximatornillostraccion.toFixed(2).toString() ?? '---',
              fuerzamaximatornilloscortante.toFixed(2).toString() ?? '---',
              comprobacion.toFixed(2).toString() ?? '---',
            ].map(
              (v, i) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  shading:
                    i === 0
                      ? undefined
                      : i === 3 && comprobacion > 1
                        ? { type: ShadingType.CLEAR, fill: 'FF0000' }
                        : { type: ShadingType.CLEAR, fill: '00B050' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: v })],
                    }),
                  ],
                }),
            ),
          }),
        ],
      });

      out.push(tablaCaracteristicas);
      out.push(new Paragraph({ text: '' }));
      out.push(tablaFuerzas);
      out.push(new Paragraph({ text: '' }));
      out.push(tablaComprobacion);
    }

    const lipDelantero = modificaciones.find(
      (m) => m.nombre === 'LIP DELANTERO' && m.seleccionado,
    );
    if (lipDelantero) {
      out.push(new Paragraph({ text: '' }));
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '2.3.' + contador + ' Lip delantero',
              bold: true,
            }),
          ],
        }),
      );

      contador++;

      const superficiefrontal = lipDelantero.superficieFrontalM2LipDelantero;

      const peso = 9.81 * (lipDelantero.pesoLipDelantero ?? 0);
      const fuerzafrenado = (lipDelantero.pesoLipDelantero ?? 0) * 10;
      const resistenciaaerodinamica =
        0.5 *
        (lipDelantero.coefAerodinamicoCwLipDelantero ?? 0) *
        (superficiefrontal ?? 0) *
        (lipDelantero.densidadAireKgM3LipDelantero ?? 0) *
        (lipDelantero.velocidadAireV2msLipDelantero ?? 0) *
        (lipDelantero.velocidadAireV2msLipDelantero ?? 0);
      const fuerzacentrifuga =
        (lipDelantero.pesoLipDelantero ?? 0) *
        (((lipDelantero.velocidadAireV2msLipDelantero ?? 0) *
          (lipDelantero.velocidadAireV2msLipDelantero ?? 0)) /
          ((lipDelantero.radioCurvaRLipDelantero ?? 0) * 100));
      const sumadelasfuerzas =
        peso + fuerzafrenado + resistenciaaerodinamica + fuerzacentrifuga;

      const tablaCaracteristicas = new Table({
        width: { size: 70, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: CELL_MARGINS,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'CARACTERÍSTICAS PARA FUERZA PRODUCIDA POR PRESIÓN DEL AIRE',
                      }),
                    ],
                  }),
                ],
                columnSpan: 2,
              }),
            ],
          }),
          ...[
            [
              'Cw=Coef. Aerodinámico',
              lipDelantero.coefAerodinamicoCwLipDelantero
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'A =área de la pieza (m²)',
              superficiefrontal?.toFixed(2).toString() ?? '---',
            ],
            [
              'ρ (densidad del aire (Kg/m³)',
              lipDelantero.densidadAireKgM3LipDelantero
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'V² = velocidad del aire 140Km/h (m/s)',
              lipDelantero.velocidadAireV2msLipDelantero
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'R (radio de curva) m',
              lipDelantero.radioCurvaRLipDelantero?.toFixed(2).toString() ??
                '---',
            ],
            [
              'K (coeficiente de seguridad)',
              lipDelantero.coefSeguridadKLipDelantero?.toFixed(2).toString() ??
                '---',
            ],
          ].map(
            ([desc, val]) =>
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    verticalAlign: AlignmentType.CENTER,
                    children: [
                      new Paragraph({
                        text: desc,
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                  }),
                  new TableCell({
                    verticalAlign: AlignmentType.CENTER,
                    children: [new Paragraph(val)],
                  }),
                ],
              }),
          ),
        ],
      });

      const tablaFuerzas = new Table({
        width: { size: 80, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: ['FUERZAS QUE ACTÚAN SOBRE LA PIEZA (N)'].map(
              (heading) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  verticalAlign: VerticalAlign.CENTER,
                  columnSpan: 5,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: heading })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              'Peso',
              'Fuerza de frenado',
              'Resistencia aerodinámica',
              'Fuerza centrífuga',
              'Suma de fuerzas',
            ].map(
              (t) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: t })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              peso.toFixed(2).toString() ?? '---',
              fuerzafrenado.toFixed(2).toString() ?? '---',
              resistenciaaerodinamica.toFixed(2).toString() ?? '---',
              fuerzacentrifuga.toFixed(2).toString() ?? '---',
              sumadelasfuerzas.toFixed(2).toString() ?? '---',
            ].map(
              (v) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: v })],
                    }),
                  ],
                }),
            ),
          }),
        ],
      });

      const fuerzadediseno =
        sumadelasfuerzas * (lipDelantero.coefSeguridadKLipDelantero ?? 0);
      const fuerzamaximatornillostraccion =
        ((0.9 *
          (lipDelantero.resTraccionMinTornillo88Kgmm2LipDelantero ?? 0) *
          (lipDelantero.seccionResistenteAsLipDelantero ?? 0)) /
          1.25) *
        (lipDelantero.numTornillosLipDelantero ?? 0);
      const fuerzamaximatornilloscortante =
        ((0.5 *
          (lipDelantero.resTraccionMinTornillo88Kgmm2LipDelantero ?? 0) *
          (lipDelantero.seccionResistenteAsLipDelantero ?? 0)) /
          1.25) *
        (lipDelantero.numTornillosLipDelantero ?? 0);
      const comprobacion =
        fuerzadediseno / fuerzamaximatornilloscortante +
        fuerzadediseno / (1.4 * fuerzamaximatornillostraccion);

      const tablaComprobacion = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              'La fuerza de diseño soportada por los anclajes (N)',
              'Fuerza máxima que soportan los tornillos a tracción (N)',
              'Fuerza máxima que soportan los tornillos a cortante (N)',
              'Comprobación <= 1',
            ].map(
              (t) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: t, bold: true })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              fuerzadediseno.toFixed(2).toString() ?? '---',
              fuerzamaximatornillostraccion.toFixed(2).toString() ?? '---',
              fuerzamaximatornilloscortante.toFixed(2).toString() ?? '---',
              comprobacion.toFixed(2).toString() ?? '---',
            ].map(
              (v, i) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  shading:
                    i === 0
                      ? undefined
                      : i === 3 && comprobacion > 1
                        ? { type: ShadingType.CLEAR, fill: 'FF0000' }
                        : { type: ShadingType.CLEAR, fill: '00B050' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: v })],
                    }),
                  ],
                }),
            ),
          }),
        ],
      });

      out.push(tablaCaracteristicas);
      out.push(new Paragraph({ text: '' }));
      out.push(tablaFuerzas);
      out.push(new Paragraph({ text: '' }));
      out.push(tablaComprobacion);
    }

    const protParaDelantero = modificaciones.find(
      (m) => m.nombre === 'PROTECTORES PARAGOLPES' && m.seleccionado,
    );
    if (protParaDelantero?.selProtectorDelantero) {
      out.push(new Paragraph({ text: '' }));
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '2.3.' + contador + ' Protectores de paragolpes delanteros',
              bold: true,
            }),
          ],
        }),
      );

      contador++;

      const superficiefrontal = protParaDelantero.superficieProtectorDelantero;

      const peso = 9.81 * (protParaDelantero.pesoProtectorDelantero ?? 0);
      const fuerzafrenado =
        (protParaDelantero.pesoProtectorDelantero ?? 0) * 10;
      const resistenciaaerodinamica =
        0.5 *
        (protParaDelantero.cwProtectorDelantero ?? 0) *
        (superficiefrontal ?? 0) *
        (protParaDelantero.densidadAireKgM3ProtectorDelantero ?? 0) *
        (protParaDelantero.velocidadAireV2msProtectorDelantero ?? 0) *
        (protParaDelantero.velocidadAireV2msProtectorDelantero ?? 0);
      const fuerzacentrifuga =
        (protParaDelantero.pesoProtectorDelantero ?? 0) *
        (((protParaDelantero.velocidadAireV2msProtectorDelantero ?? 0) *
          (protParaDelantero.velocidadAireV2msProtectorDelantero ?? 0)) /
          ((protParaDelantero.curvaturaProtectorDelantero ?? 0) * 100));
      const sumadelasfuerzas =
        peso + fuerzafrenado + resistenciaaerodinamica + fuerzacentrifuga;

      const tablaCaracteristicas = new Table({
        width: { size: 70, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: CELL_MARGINS,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'CARACTERÍSTICAS PARA FUERZA PRODUCIDA POR PRESIÓN DEL AIRE',
                      }),
                    ],
                  }),
                ],
                columnSpan: 2,
              }),
            ],
          }),
          ...[
            [
              'Cw=Coef. Aerodinámico',
              protParaDelantero.cwProtectorDelantero?.toFixed(2).toString() ??
                '---',
            ],
            [
              'A =área de la pieza (m²)',
              superficiefrontal?.toFixed(2).toString() ?? '---',
            ],
            [
              'ρ (densidad del aire (Kg/m³)',
              protParaDelantero.densidadAireKgM3ProtectorDelantero
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'V² = velocidad del aire 140Km/h (m/s)',
              protParaDelantero.velocidadAireV2msProtectorDelantero
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'R (radio de curva) m',
              protParaDelantero.curvaturaProtectorDelantero
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'K (coeficiente de seguridad)',
              protParaDelantero.kProtectorDelantero?.toFixed(2).toString() ??
                '---',
            ],
          ].map(
            ([desc, val]) =>
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    verticalAlign: AlignmentType.CENTER,
                    children: [
                      new Paragraph({
                        text: desc,
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                  }),
                  new TableCell({
                    verticalAlign: AlignmentType.CENTER,
                    children: [new Paragraph(val)],
                  }),
                ],
              }),
          ),
        ],
      });

      const tablaFuerzas = new Table({
        width: { size: 80, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: ['FUERZAS QUE ACTÚAN SOBRE LA PIEZA (N)'].map(
              (heading) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  verticalAlign: VerticalAlign.CENTER,
                  columnSpan: 5,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: heading })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              'Peso',
              'Fuerza de frenado',
              'Resistencia aerodinámica',
              'Fuerza centrífuga',
              'Suma de fuerzas',
            ].map(
              (t) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: t })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              peso.toFixed(2).toString() ?? '---',
              fuerzafrenado.toFixed(2).toString() ?? '---',
              resistenciaaerodinamica.toFixed(2).toString() ?? '---',
              fuerzacentrifuga.toFixed(2).toString() ?? '---',
              sumadelasfuerzas.toFixed(2).toString() ?? '---',
            ].map(
              (v) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: v })],
                    }),
                  ],
                }),
            ),
          }),
        ],
      });

      const fuerzadediseno =
        sumadelasfuerzas * (protParaDelantero.kProtectorDelantero ?? 0);
      const fuerzamaximatornillostraccion =
        ((0.9 *
          (protParaDelantero.resTraccionMinTornillo88Kgmm2ProtectorDelantero ??
            0) *
          (protParaDelantero.seccionResistenteAsProtectorDelantero ?? 0)) /
          1.25) *
        (protParaDelantero.numTornillosProtectorDelantero ?? 0);
      const fuerzamaximatornilloscortante =
        ((0.5 *
          (protParaDelantero.resTraccionMinTornillo88Kgmm2ProtectorDelantero ??
            0) *
          (protParaDelantero.seccionResistenteAsProtectorDelantero ?? 0)) /
          1.25) *
        (protParaDelantero.numTornillosProtectorDelantero ?? 0);
      const comprobacion =
        fuerzadediseno / fuerzamaximatornilloscortante +
        fuerzadediseno / (1.4 * fuerzamaximatornillostraccion);

      const tablaComprobacion = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              'La fuerza de diseño soportada por los anclajes (N)',
              'Fuerza máxima que soportan los tornillos a tracción (N)',
              'Fuerza máxima que soportan los tornillos a cortante (N)',
              'Comprobación <= 1',
            ].map(
              (t) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: t, bold: true })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              fuerzadediseno.toFixed(2).toString() ?? '---',
              fuerzamaximatornillostraccion.toFixed(2).toString() ?? '---',
              fuerzamaximatornilloscortante.toFixed(2).toString() ?? '---',
              comprobacion.toFixed(2).toString() ?? '---',
            ].map(
              (v, i) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  shading:
                    i === 0
                      ? undefined
                      : i === 3 && comprobacion > 1
                        ? { type: ShadingType.CLEAR, fill: 'FF0000' }
                        : { type: ShadingType.CLEAR, fill: '00B050' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: v })],
                    }),
                  ],
                }),
            ),
          }),
        ],
      });

      out.push(tablaCaracteristicas);
      out.push(new Paragraph({ text: '' }));
      out.push(tablaFuerzas);
      out.push(new Paragraph({ text: '' }));
      out.push(tablaComprobacion);
    }

    if (protParaDelantero?.selProtectorTrasero) {
      out.push(new Paragraph({ text: '' }));
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '2.3.' + contador + ' Protectores de paragolpes traseros',
              bold: true,
            }),
          ],
        }),
      );

      contador++;

      const superficiefrontal = protParaDelantero.superficieProtectorTrasero;

      const peso = 9.81 * (protParaDelantero.pesoProtectorTrasero ?? 0);
      const fuerzafrenado = (protParaDelantero.pesoProtectorTrasero ?? 0) * 10;
      const resistenciaaerodinamica =
        0.5 *
        (protParaDelantero.cwProtectorTrasero ?? 0) *
        (superficiefrontal ?? 0) *
        (protParaDelantero.densidadAireKgM3ProtectorTrasero ?? 0) *
        (protParaDelantero.velocidadAireV2msProtectorTrasero ?? 0) *
        (protParaDelantero.velocidadAireV2msProtectorTrasero ?? 0);
      const fuerzacentrifuga =
        (protParaDelantero.pesoProtectorTrasero ?? 0) *
        (((protParaDelantero.velocidadAireV2msProtectorTrasero ?? 0) *
          (protParaDelantero.velocidadAireV2msProtectorTrasero ?? 0)) /
          ((protParaDelantero.curvaturaProtectorTrasero ?? 0) * 100));
      const sumadelasfuerzas =
        peso + fuerzafrenado + resistenciaaerodinamica + fuerzacentrifuga;

      const tablaCaracteristicas = new Table({
        width: { size: 70, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: CELL_MARGINS,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'CARACTERÍSTICAS PARA FUERZA PRODUCIDA POR PRESIÓN DEL AIRE',
                      }),
                    ],
                  }),
                ],
                columnSpan: 2,
              }),
            ],
          }),
          ...[
            [
              'Cw=Coef. Aerodinámico',
              protParaDelantero.cwProtectorTrasero?.toFixed(2).toString() ??
                '---',
            ],
            [
              'A =área de la pieza (m²)',
              superficiefrontal?.toFixed(2).toString() ?? '---',
            ],
            [
              'ρ (densidad del aire (Kg/m³)',
              protParaDelantero.densidadAireKgM3ProtectorTrasero
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'V² = velocidad del aire 140Km/h (m/s)',
              protParaDelantero.velocidadAireV2msProtectorTrasero
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'R (radio de curva) m',
              protParaDelantero.curvaturaProtectorTrasero
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'K (coeficiente de seguridad)',
              protParaDelantero.kProtectorTrasero?.toFixed(2).toString() ??
                '---',
            ],
          ].map(
            ([desc, val]) =>
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    verticalAlign: AlignmentType.CENTER,
                    children: [
                      new Paragraph({
                        text: desc,
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                  }),
                  new TableCell({
                    verticalAlign: AlignmentType.CENTER,
                    children: [new Paragraph(val)],
                  }),
                ],
              }),
          ),
        ],
      });

      const tablaFuerzas = new Table({
        width: { size: 80, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: ['FUERZAS QUE ACTÚAN SOBRE LA PIEZA (N)'].map(
              (heading) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  verticalAlign: VerticalAlign.CENTER,
                  columnSpan: 5,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: heading })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              'Peso',
              'Fuerza de frenado',
              'Resistencia aerodinámica',
              'Fuerza centrífuga',
              'Suma de fuerzas',
            ].map(
              (t) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: t })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              peso.toFixed(2).toString() ?? '---',
              fuerzafrenado.toFixed(2).toString() ?? '---',
              resistenciaaerodinamica.toFixed(2).toString() ?? '---',
              fuerzacentrifuga.toFixed(2).toString() ?? '---',
              sumadelasfuerzas.toFixed(2).toString() ?? '---',
            ].map(
              (v) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: v })],
                    }),
                  ],
                }),
            ),
          }),
        ],
      });

      const fuerzadediseno =
        sumadelasfuerzas * (protParaDelantero.kProtectorTrasero ?? 0);
      const fuerzamaximatornillostraccion =
        ((0.9 *
          (protParaDelantero.resTraccionMinTornillo88Kgmm2ProtectorTrasero ??
            0) *
          (protParaDelantero.seccionResistenteAsProtectorTrasero ?? 0)) /
          1.25) *
        (protParaDelantero.numTornillosProtectorTrasero ?? 0);
      const fuerzamaximatornilloscortante =
        ((0.5 *
          (protParaDelantero.resTraccionMinTornillo88Kgmm2ProtectorTrasero ??
            0) *
          (protParaDelantero.seccionResistenteAsProtectorTrasero ?? 0)) /
          1.25) *
        (protParaDelantero.numTornillosProtectorTrasero ?? 0);
      const comprobacion =
        fuerzadediseno / fuerzamaximatornilloscortante +
        fuerzadediseno / (1.4 * fuerzamaximatornillostraccion);

      const tablaComprobacion = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              'La fuerza de diseño soportada por los anclajes (N)',
              'Fuerza máxima que soportan los tornillos a tracción (N)',
              'Fuerza máxima que soportan los tornillos a cortante (N)',
              'Comprobación <= 1',
            ].map(
              (t) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: t, bold: true })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              fuerzadediseno.toFixed(2).toString() ?? '---',
              fuerzamaximatornillostraccion.toFixed(2).toString() ?? '---',
              fuerzamaximatornilloscortante.toFixed(2).toString() ?? '---',
              comprobacion.toFixed(2).toString() ?? '---',
            ].map(
              (v, i) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  shading:
                    i === 0
                      ? undefined
                      : i === 3 && comprobacion > 1
                        ? { type: ShadingType.CLEAR, fill: 'FF0000' }
                        : { type: ShadingType.CLEAR, fill: '00B050' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: v })],
                    }),
                  ],
                }),
            ),
          }),
        ],
      });

      out.push(tablaCaracteristicas);
      out.push(new Paragraph({ text: '' }));
      out.push(tablaFuerzas);
      out.push(new Paragraph({ text: '' }));
      out.push(tablaComprobacion);
    }

    const defensa = modificaciones.find(
      (m) => m.nombre === 'DEFENSA DELANTERA' && m.seleccionado,
    );
    if (defensa) {
      out.push(new Paragraph({ text: '' }));
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '2.3.' + contador + ' Defensa delantera',
              bold: true,
            }),
          ],
        }),
      );

      contador++;

      const superficiefrontal = defensa.superficieFrontalM2Defensa;

      const peso = 9.81 * (defensa.pesoDefensa ?? 0);
      const fuerzafrenado = (defensa.pesoDefensa ?? 0) * 10;
      const resistenciaaerodinamica =
        0.5 *
        (defensa.coefAerodinamicoCwDefensa ?? 0) *
        (superficiefrontal ?? 0) *
        (defensa.densidadAireKgM3Defensa ?? 0) *
        (defensa.velocidadAireV2msDefensa ?? 0) *
        (defensa.velocidadAireV2msDefensa ?? 0);
      const fuerzacentrifuga =
        (defensa.pesoDefensa ?? 0) *
        (((defensa.velocidadAireV2msDefensa ?? 0) *
          (defensa.velocidadAireV2msDefensa ?? 0)) /
          ((defensa.curvaturaDefensaDelantera ?? 0) * 100));
      const sumadelasfuerzas =
        peso + fuerzafrenado + resistenciaaerodinamica + fuerzacentrifuga;

      const tablaCaracteristicas = new Table({
        width: { size: 70, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: CELL_MARGINS,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'CARACTERÍSTICAS PARA FUERZA PRODUCIDA POR PRESIÓN DEL AIRE',
                      }),
                    ],
                  }),
                ],
                columnSpan: 2,
              }),
            ],
          }),
          ...[
            [
              'Cw=Coef. Aerodinámico',
              defensa.coefAerodinamicoCwDefensa?.toFixed(2).toString() ?? '---',
            ],
            [
              'A =área de la pieza (m²)',
              superficiefrontal?.toFixed(2).toString() ?? '---',
            ],
            [
              'ρ (densidad del aire (Kg/m³)',
              defensa.densidadAireKgM3Defensa?.toFixed(2).toString() ?? '---',
            ],
            [
              'V² = velocidad del aire 140Km/h (m/s)',
              defensa.velocidadAireV2msDefensa?.toFixed(2).toString() ?? '---',
            ],
            [
              'R (radio de curva) m',
              defensa.curvaturaDefensaDelantera?.toFixed(2).toString() ?? '---',
            ],
            [
              'K (coeficiente de seguridad)',
              defensa.coefSeguridadKDefensa?.toFixed(2).toString() ?? '---',
            ],
          ].map(
            ([desc, val]) =>
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    verticalAlign: AlignmentType.CENTER,
                    children: [
                      new Paragraph({
                        text: desc,
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                  }),
                  new TableCell({
                    verticalAlign: AlignmentType.CENTER,
                    children: [new Paragraph(val)],
                  }),
                ],
              }),
          ),
        ],
      });

      const tablaFuerzas = new Table({
        width: { size: 80, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: ['FUERZAS QUE ACTÚAN SOBRE LA PIEZA (N)'].map(
              (heading) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  verticalAlign: VerticalAlign.CENTER,
                  columnSpan: 5,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: heading })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              'Peso',
              'Fuerza de frenado',
              'Resistencia aerodinámica',
              'Fuerza centrífuga',
              'Suma de fuerzas',
            ].map(
              (t) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: t })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              peso.toFixed(2).toString() ?? '---',
              fuerzafrenado.toFixed(2).toString() ?? '---',
              resistenciaaerodinamica.toFixed(2).toString() ?? '---',
              fuerzacentrifuga.toFixed(2).toString() ?? '---',
              sumadelasfuerzas.toFixed(2).toString() ?? '---',
            ].map(
              (v) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: v })],
                    }),
                  ],
                }),
            ),
          }),
        ],
      });

      const fuerzadediseno =
        sumadelasfuerzas * (defensa.coefSeguridadKDefensa ?? 0);
      const fuerzamaximatornillostraccion =
        ((0.9 *
          (defensa.resTraccionMinTornillo88Kgmm2Defensa ?? 0) *
          (defensa.seccionResistenteAsDefensa ?? 0)) /
          1.25) *
        (defensa.numTornillosDefensa ?? 0);
      const fuerzamaximatornilloscortante =
        ((0.5 *
          (defensa.resTraccionMinTornillo88Kgmm2Defensa ?? 0) *
          (defensa.seccionResistenteAsDefensa ?? 0)) /
          1.25) *
        (defensa.numTornillosDefensa ?? 0);
      const comprobacion =
        fuerzadediseno / fuerzamaximatornilloscortante +
        fuerzadediseno / (1.4 * fuerzamaximatornillostraccion);

      const tablaComprobacion = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              'La fuerza de diseño soportada por los anclajes (N)',
              'Fuerza máxima que soportan los tornillos a tracción (N)',
              'Fuerza máxima que soportan los tornillos a cortante (N)',
              'Comprobación <= 1',
            ].map(
              (t) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: t, bold: true })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              fuerzadediseno.toFixed(2).toString() ?? '---',
              fuerzamaximatornillostraccion.toFixed(2).toString() ?? '---',
              fuerzamaximatornilloscortante.toFixed(2).toString() ?? '---',
              comprobacion.toFixed(2).toString() ?? '---',
            ].map(
              (v, i) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  shading:
                    i === 0
                      ? undefined
                      : i === 3 && comprobacion > 1
                        ? { type: ShadingType.CLEAR, fill: 'FF0000' }
                        : { type: ShadingType.CLEAR, fill: '00B050' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: v })],
                    }),
                  ],
                }),
            ),
          }),
        ],
      });

      out.push(tablaCaracteristicas);
      out.push(new Paragraph({ text: '' }));
      out.push(tablaFuerzas);
      out.push(new Paragraph({ text: '' }));
      out.push(tablaComprobacion);
    }

    const soporteRueda = modificaciones.find(
      (m) => m.nombre === 'SOPORTE PARA RUEDA DE REPUESTO' && m.seleccionado,
    );
    if (soporteRueda) {
      out.push(new Paragraph({ text: '' }));
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '2.3.' + contador + ' Soporte para rueda de repuesto',
              bold: true,
            }),
          ],
        }),
      );

      contador++;

      const superficiefrontal = soporteRueda.superficieFrontalM2SoporteRueda;

      const peso = 9.81 * (soporteRueda.pesoSoporteRueda ?? 0);
      const fuerzafrenado = (soporteRueda.pesoSoporteRueda ?? 0) * 10;
      const resistenciaaerodinamica =
        0.5 *
        (soporteRueda.coefAerodinamicoCwSoporteRueda ?? 0) *
        (superficiefrontal ?? 0) *
        (soporteRueda.densidadAireKgM3SoporteRueda ?? 0) *
        (soporteRueda.velocidadAireV2msSoporteRueda ?? 0) *
        (soporteRueda.velocidadAireV2msSoporteRueda ?? 0);
      const fuerzacentrifuga =
        (soporteRueda.pesoSoporteRueda ?? 0) *
        (((soporteRueda.velocidadAireV2msSoporteRueda ?? 0) *
          (soporteRueda.velocidadAireV2msSoporteRueda ?? 0)) /
          ((soporteRueda.curvaturaSoporteRueda ?? 0) * 100));
      const sumadelasfuerzas =
        peso + fuerzafrenado + resistenciaaerodinamica + fuerzacentrifuga;

      const tablaCaracteristicas = new Table({
        width: { size: 70, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: CELL_MARGINS,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'CARACTERÍSTICAS PARA FUERZA PRODUCIDA POR PRESIÓN DEL AIRE',
                      }),
                    ],
                  }),
                ],
                columnSpan: 2,
              }),
            ],
          }),
          ...[
            [
              'Cw=Coef. Aerodinámico',
              soporteRueda.coefSeguridadKSoporteRueda?.toFixed(2).toString() ??
                '---',
            ],
            [
              'A =área de la pieza (m²)',
              superficiefrontal?.toFixed(2).toString() ?? '---',
            ],
            [
              'ρ (densidad del aire (Kg/m³)',
              soporteRueda.densidadAireKgM3SoporteRueda
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'V² = velocidad del aire 140Km/h (m/s)',
              soporteRueda.velocidadAireV2msSoporteRueda
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'R (radio de curva) m',
              soporteRueda.curvaturaSoporteRueda?.toFixed(2).toString() ??
                '---',
            ],
            [
              'K (coeficiente de seguridad)',
              soporteRueda.coefSeguridadKSoporteRueda?.toFixed(2).toString() ??
                '---',
            ],
          ].map(
            ([desc, val]) =>
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    verticalAlign: AlignmentType.CENTER,
                    children: [
                      new Paragraph({
                        text: desc,
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                  }),
                  new TableCell({
                    verticalAlign: AlignmentType.CENTER,
                    children: [new Paragraph(val)],
                  }),
                ],
              }),
          ),
        ],
      });

      const tablaFuerzas = new Table({
        width: { size: 80, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: ['FUERZAS QUE ACTÚAN SOBRE LA PIEZA (N)'].map(
              (heading) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  verticalAlign: VerticalAlign.CENTER,
                  columnSpan: 5,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: heading })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              'Peso',
              'Fuerza de frenado',
              'Resistencia aerodinámica',
              'Fuerza centrífuga',
              'Suma de fuerzas',
            ].map(
              (t) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: t })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              peso.toFixed(2).toString() ?? '---',
              fuerzafrenado.toFixed(2).toString() ?? '---',
              resistenciaaerodinamica.toFixed(2).toString() ?? '---',
              fuerzacentrifuga.toFixed(2).toString() ?? '---',
              sumadelasfuerzas.toFixed(2).toString() ?? '---',
            ].map(
              (v) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: v })],
                    }),
                  ],
                }),
            ),
          }),
        ],
      });

      const fuerzadediseno =
        sumadelasfuerzas * (soporteRueda.coefSeguridadKSoporteRueda ?? 0);
      const fuerzamaximatornillostraccion =
        ((0.9 *
          (soporteRueda.resTraccionMinTornillo88Kgmm2SoporteRueda ?? 0) *
          (soporteRueda.seccionResistenteAsSoporteRueda ?? 0)) /
          1.25) *
        (soporteRueda.numTornillosSoporteRueda ?? 0);
      const fuerzamaximatornilloscortante =
        ((0.5 *
          (soporteRueda.resTraccionMinTornillo88Kgmm2SoporteRueda ?? 0) *
          (soporteRueda.seccionResistenteAsSoporteRueda ?? 0)) /
          1.25) *
        (soporteRueda.numTornillosSoporteRueda ?? 0);
      const comprobacion =
        fuerzadediseno / fuerzamaximatornilloscortante +
        fuerzadediseno / (1.4 * fuerzamaximatornillostraccion);

      const tablaComprobacion = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              'La fuerza de diseño soportada por los anclajes (N)',
              'Fuerza máxima que soportan los tornillos a tracción (N)',
              'Fuerza máxima que soportan los tornillos a cortante (N)',
              'Comprobación <= 1',
            ].map(
              (t) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: t, bold: true })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              fuerzadediseno.toFixed(2).toString() ?? '---',
              fuerzamaximatornillostraccion.toFixed(2).toString() ?? '---',
              fuerzamaximatornilloscortante.toFixed(2).toString() ?? '---',
              comprobacion.toFixed(2).toString() ?? '---',
            ].map(
              (v, i) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  shading:
                    i === 0
                      ? undefined
                      : i === 3 && comprobacion > 1
                        ? { type: ShadingType.CLEAR, fill: 'FF0000' }
                        : { type: ShadingType.CLEAR, fill: '00B050' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: v })],
                    }),
                  ],
                }),
            ),
          }),
        ],
      });

      out.push(tablaCaracteristicas);
      out.push(new Paragraph({ text: '' }));
      out.push(tablaFuerzas);
      out.push(new Paragraph({ text: '' }));
      out.push(tablaComprobacion);
    }

    const snorkel = modificaciones.find(
      (m) => m.nombre === 'SNORKEL' && m.seleccionado,
    );
    if (snorkel) {
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      // 1) Encabezado de sección
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '2.3.' + contador + ' Snorkel',
              bold: true,
            }),
          ],
        }),
      );

      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      contador++;

      const superficiefrontal =
        (snorkel.anchuraPiezaMSnorkel ?? 0) *
        (snorkel.alturaPiezaMSnorkel ?? 0);

      // 2) Tabla de propiedades de la pieza y de sujeción
      const tablaSnorkel = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          // Fila de encabezados con merge de columnas
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: CELL_MARGINS,
                columnSpan: 2,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'CARACTERÍSTICAS DE LA PIEZA',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: CELL_MARGINS,
                columnSpan: 2,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'SUJECIÓN',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          // Filas de datos
          ...[
            [
              'Peso de la pieza en Kg',
              snorkel.pesoPiezaKgSnorkel?.toFixed(2).toString() ?? '---',
              'nº tornillos',
              snorkel.nTornillosSnorkel?.toFixed(2).toString() ?? '---',
            ],
            [
              'Anchura de la pieza en m',
              snorkel.anchuraPiezaMSnorkel?.toFixed(2).toString() ?? '---',
              'Métrica',
              Number(snorkel.metricaSnorkel)?.toFixed(2).toString() ?? '---',
            ],
            [
              'Altura de la pieza en m',
              snorkel.alturaPiezaMSnorkel?.toFixed(2).toString() ?? '---',
              'Calidad',
              Number(snorkel.calidadTornilloSnorkel).toFixed(2).toString() ??
                '---',
            ],
            [
              'Superficie frontal m²',
              superficiefrontal.toFixed(2).toString() ?? '---',
              'As (Sección resistente)',
              snorkel.seccionResistenteAsSnorkel?.toFixed(2).toString() ??
                '---',
            ],
            [
              'Coef. aerodinámico',
              snorkel.cwCoefAerodinamicoSnorkel?.toFixed(2).toString() ?? '---',
              'Res. Tracción Mín tornillo 8,8 (Kg/mm2)',
              snorkel.resTraccionMinTornillo88Kgmm2Snorkel
                ?.toFixed(2)
                .toString() ?? '---',
            ],
          ].map(
            ([d1, v1, d2, v2]) =>
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: d1 })],
                      }),
                    ],
                  }),
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: v1 })],
                      }),
                    ],
                  }),
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: d2 })],
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: v2 })],
                      }),
                    ],
                  }),
                ],
              }),
          ),
        ],
      });

      out.push(tablaSnorkel);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      // 3) Tabla de características para presión del aire
      const tablaAire = new Table({
        width: { size: 70, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: CELL_MARGINS,
                columnSpan: 2,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'CARACTERÍSTICAS PARA FUERZA PRODUCIDA POR PRESIÓN DEL AIRE',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          ...[
            [
              'Cw=Coef. Aerodinámico',
              snorkel.cwCoefAerodinamicoSnorkel?.toFixed(2).toString() ?? '---',
            ],
            [
              'A =área de la pieza (m²)',
              superficiefrontal.toFixed(2).toString() ?? '---',
            ],
            [
              'ρ (densidad del aire (Kg/m³))',
              snorkel.densidadAireKgM3Snorkel?.toFixed(2).toString() ?? '---',
            ],
            [
              'V² = velocidad del aire 140Km/h (m/s)',
              snorkel.velocidadAireV2msSnorkel?.toFixed(2).toString() ?? '---',
            ],
            [
              'R (radio de curva) m',
              snorkel.curvaturaSnorkel?.toFixed(2).toString() ?? '---',
            ],
            [
              'K (coeficiente de seguridad)',
              snorkel.coefSeguridadKSnorkel?.toFixed(2).toString() ?? '---',
            ],
          ].map(
            ([desc, val]) =>
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: desc })],
                      }),
                    ],
                  }),
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: val })],
                      }),
                    ],
                  }),
                ],
              }),
          ),
        ],
      });

      out.push(tablaAire);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      let peso = 9.81 * (snorkel.pesoPiezaKgSnorkel ?? 0);
      let fuerzafrenado = (snorkel.pesoPiezaKgSnorkel ?? 0) * 10;
      let resistenciaaerodinamica =
        0.5 *
        (snorkel.cwCoefAerodinamicoSnorkel ?? 0) *
        superficiefrontal *
        (snorkel.densidadAireKgM3Snorkel ?? 0) *
        (snorkel.velocidadAireV2msSnorkel ?? 0) *
        (snorkel.velocidadAireV2msSnorkel ?? 0);
      let fuerzacentrifuga =
        (snorkel.pesoPiezaKgSnorkel ?? 0) *
        (((snorkel.velocidadAireV2msSnorkel ?? 0) *
          (snorkel.velocidadAireV2msSnorkel ?? 0)) /
          ((Number(snorkel.curvaturaSnorkel) || 1) * 100));
      let sumadelasfuerzas =
        peso + fuerzafrenado + resistenciaaerodinamica + fuerzacentrifuga;

      // 4) Tabla de fuerzas que actúan sobre la pieza
      const tablaFuerzas = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: ['FUERZAS QUE ACTÚAN SOBRE LA PIEZA (N)'].map(
              (heading) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  verticalAlign: VerticalAlign.CENTER,
                  columnSpan: 5,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: heading })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              'Peso',
              'Fuerza de frenado',
              'Resistencia aerodinámica',
              'Fuerza centrífuga',
              'Suma de fuerzas',
            ].map(
              (heading) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: heading })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              peso.toFixed(2).toString() ?? '---',
              fuerzafrenado.toFixed(2).toString() ?? '---',
              resistenciaaerodinamica.toFixed(2).toString() ?? '---',
              fuerzacentrifuga.toFixed(2).toString() ?? '---',
              sumadelasfuerzas.toFixed(2).toString() ?? '---',
            ].map(
              (val) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: val })],
                    }),
                  ],
                }),
            ),
          }),
        ],
      });

      out.push(tablaFuerzas);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      let fuerzadediseno =
        sumadelasfuerzas * (snorkel.coefSeguridadKSnorkel ?? 0);
      let fuerzamaximatornillostraccion =
        ((0.9 *
          (snorkel.resTraccionMinTornillo88Kgmm2Snorkel ?? 0) *
          (snorkel.seccionResistenteAsSnorkel ?? 0)) /
          1.25) *
        (snorkel.nTornillosSnorkel ?? 0);
      let fuerzamaximatornilloscortante =
        ((0.5 *
          (snorkel.resTraccionMinTornillo88Kgmm2Snorkel ?? 0) *
          (snorkel.seccionResistenteAsSnorkel ?? 0)) /
          1.25) *
        (snorkel.nTornillosSnorkel ?? 0);
      let comprobacion =
        fuerzadediseno / fuerzamaximatornilloscortante +
        fuerzadediseno / (1.4 * fuerzamaximatornillostraccion);

      // 5) Tabla de comprobación
      const tablaComprobacion = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              'La fuerza de diseño soportada por los anclajes (N)',
              'Fuerza máxima que soportan los tornillos a tracción (N)',
              'Fuerza máxima que soportan los tornillos a cortante (N)',
              'Comprobación <= 1',
            ].map(
              (heading) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: heading, bold: true })],
                    }),
                  ],
                }),
            ),
          }),

          new TableRow({
            cantSplit: true,
            children: [
              fuerzadediseno.toFixed(2).toString() ?? '---',
              fuerzamaximatornillostraccion.toFixed(2).toString() ?? '---',
              fuerzamaximatornilloscortante.toFixed(2).toString() ?? '---',
              comprobacion.toFixed(2).toString() ?? '---',
            ].map(
              (val, i) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  shading:
                    i === 0
                      ? undefined
                      : i === 3 && comprobacion > 1
                        ? { type: ShadingType.CLEAR, fill: 'FF0000' }
                        : { type: ShadingType.CLEAR, fill: '00B050' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: val })],
                    }),
                  ],
                }),
            ),
          }),
        ],
      });

      out.push(tablaComprobacion);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));
    }

    const bombaFreno = modificaciones.find(
      (m) => m.nombre === 'SUSTITUCIÓN DE BOMBA DE FRENO' && m.seleccionado,
    );

    if (bombaFreno) {
      const procesarBomba = (tipo: string) => {
        const isDelan = tipo === 'delantera';
        const sufijo = isDelan ? 'Del' : 'Tras';
        const etiqueta = isDelan ? 'Delantera' : 'Trasera';

        const diametroNuevoMm =
          Number((bombaFreno as any)[`diametroPistonBombaFreno${sufijo}`]) || 0;
        const carreraNuevaMm =
          Number((bombaFreno as any)[`carreraPistonBombaFreno${sufijo}`]) || 0;

        const esIgualOriginal = (bombaFreno as any)[
          `pistonIgualOriginalBombaFreno${sufijo}`
        ];

        let diametroOriginalMm = 0;
        let carreraOriginalMm = 0;

        if (esIgualOriginal) {
          diametroOriginalMm = diametroNuevoMm;
          carreraOriginalMm = carreraNuevaMm;
        } else {
          diametroOriginalMm =
            Number(
              (bombaFreno as any)[`ant_diametroPistonBombaFreno${sufijo}`],
            ) || 0;
          carreraOriginalMm =
            Number(
              (bombaFreno as any)[`ant_carreraPistonBombaFreno${sufijo}`],
            ) || 0;
        }

        const dOrigCm = diametroOriginalMm / 10;
        const lOrigCm = carreraOriginalMm / 10;
        const dNewCm = diametroNuevoMm / 10;
        const lNewCm = carreraNuevaMm / 10;

        const volOrig = Math.PI * Math.pow(dOrigCm / 2, 2) * lOrigCm;
        const volNew = Math.PI * Math.pow(dNewCm / 2, 2) * lNewCm;

        out.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `2.3.${contador} Sustitución de Bomba de Freno ${etiqueta}`,
                bold: true,
                size: 24,
              }),
            ],
          }),
        );
        contador++;

        out.push(new Paragraph({ text: '' }));

        out.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Procederemos a continuación al cálculo del volumen de líquido de freno desplazado por el pistón de la bomba nueva respecto a la de origen.',
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
          }),
        );

        out.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Para ello aplicaremos la siguiente fórmula:',
              }),
            ],
          }),
        );

        out.push(new Paragraph({ text: '' }));

        out.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'V = π × ',
                italics: true,
                size: 24,
              }),
              new TextRun({
                text: '(',
                size: 28,
              }),
              new TextRun({
                text: 'd',
                italics: true,
                size: 24,
              }),
              new TextRun({
                text: '/2',
                size: 24,
              }),
              new TextRun({
                text: ')',
                size: 28,
              }),
              new TextRun({
                text: '2',
                superScript: true,
                size: 18,
              }),
              new TextRun({
                text: ' × L',
                italics: true,
                size: 24,
              }),
            ],
          }),
        );

        out.push(new Paragraph({ text: '' }));

        out.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Donde:',
                bold: true,
              }),
            ],
          }),
        );

        out.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: 'd es el diámetro del pistón de la bomba (en cm).',
              }),
            ],
          }),
        );
        out.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: 'L es la carrera del pistón (en cm).',
              }),
            ],
          }),
        );

        out.push(new Paragraph({ text: '' }));

        out.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Teniendo en cuenta los datos obtenidos de cada una de las bombas:',
              }),
            ],
          }),
        );

        out.push(new Paragraph({ text: '' }));

        const tablaCalculos = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: 'D9D9D9' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: 'ESTADO', bold: true })],
                    }),
                  ],
                }),
                new TableCell({
                  shading: { fill: 'D9D9D9' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: 'D (cm)', bold: true })],
                    }),
                  ],
                }),
                new TableCell({
                  shading: { fill: 'D9D9D9' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: 'L (cm)', bold: true })],
                    }),
                  ],
                }),
                new TableCell({
                  shading: { fill: 'D9D9D9' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: 'V (cm³)', bold: true })],
                    }),
                  ],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: 'ORIGINAL' })],
                    }),
                  ],
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: dOrigCm.toFixed(2) })],
                    }),
                  ],
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: lOrigCm.toFixed(2) })],
                    }),
                  ],
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: volOrig.toFixed(2) })],
                    }),
                  ],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: 'REFORMADO' })],
                    }),
                  ],
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: dNewCm.toFixed(2) })],
                    }),
                  ],
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: lNewCm.toFixed(2) })],
                    }),
                  ],
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: volNew.toFixed(2) })],
                    }),
                  ],
                }),
              ],
            }),
          ],
        });

        out.push(tablaCalculos);
        out.push(new Paragraph({ text: '' }));

        out.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Podemos asegurar que el sistema instalado es capaz de desplazar más volumen de líquido de freno en cada acción, por lo que se ha mejorado el sistema de freno del vehículo.',
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
          }),
        );

        out.push(new Paragraph({ text: '' }));
        out.push(new Paragraph({ text: '' }));
      };

      const ubicacion = bombaFreno.ubicacionBombaFreno;

      if (ubicacion === 'delantera' || ubicacion === 'ambas') {
        procesarBomba('delantera');
      }

      if (ubicacion === 'trasera' || ubicacion === 'ambas') {
        procesarBomba('trasera');
      }
    }

    const cabrestante = modificaciones.find(
      (m) => m.nombre === 'CABRESTANTE' && m.seleccionado,
    );
    if (cabrestante) {
      // 1) Título de sección
      out.push(new Paragraph({ pageBreakBefore: true }));
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '2.3.' + contador + ' Cabrestante',
              bold: true,
            }),
          ],
        }),
      );

      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      contador++;

      // 2) Tabla de características del material y elementos de unión
      const tablaMaterialCabrestante = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          // Encabezado
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: CELL_MARGINS,
                columnSpan: 2,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'Características del material y elementos de unión empleados',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          // Filas de datos
          ...[
            [
              'Tiro máx. del cabrestante (Kg)',
              cabrestante.capacidadCabrestanteKg?.toFixed(2).toString() ??
                '---',
            ],
            [
              'Diámetro de cada perno (cm)',
              ((cabrestante.diametroPernoChasisMmCabrestante ?? 0) * 10)
                .toFixed(2)
                .toString() ?? '---',
            ],
            [
              'Material del perno',
              cabrestante.materialPernoCabrestante ?? '---',
            ],
            [
              'Tensión mín., rotura cortante acero (Kg/cm²)',
              cabrestante.tensionMinCortanteKgCm2Cabrestante
                ?.toFixed(2)
                .toString() ?? '---',
            ],
          ].map(
            ([desc, val]) =>
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: desc })],
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: val })],
                      }),
                    ],
                  }),
                ],
              }),
          ),
        ],
      });

      out.push(tablaMaterialCabrestante);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      let tensioncortante =
        (cabrestante.capacidadCabrestanteKg ?? 0) /
        (Math.PI *
          (((((cabrestante.diametroPernoChasisMmCabrestante ?? 0) * 10) / 2) *
            ((cabrestante.diametroPernoChasisMmCabrestante ?? 0) * 10)) /
            2) *
          (cabrestante.nPernosChasisCabrestante ?? 0));
      let coeficienteseguridad =
        (cabrestante.tensionMinCortanteKgCm2Cabrestante ?? 0) / tensioncortante;

      // 3) Tabla de tensión cortante soportada por los pernos
      const tablaTensionPernos = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          // Encabezado
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: CELL_MARGINS,
                columnSpan: 2,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'Tensión cortante soportada por los pernos de unión al chasis',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          // Filas de datos
          ...[
            [
              'Número de pernos',
              cabrestante.nPernosChasisCabrestante?.toFixed(2).toString() ??
                '---',
            ],
            [
              'Diámetro de cada perno',
              cabrestante.diametroPernoChasisMmCabrestante
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'Material del perno',
              cabrestante.materialPernoCabrestante ?? '---',
            ],
            [
              'Tensión mín., rotura cortante acero (Kg/cm²)',
              cabrestante.tensionMinCortanteChasisKgCm2Cabrestante
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'Tensión cortante ejercida por el tiro del cabrestante sobre los pernos de unión a la estructura de soporte de éste (Kg/cm2)',
              '2482.82',
            ],
          ].map(
            ([desc, val]) =>
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: desc })],
                      }),
                    ],
                  }),
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: val })],
                      }),
                    ],
                  }),
                ],
              }),
          ),
        ],
      });

      out.push(tablaTensionPernos);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      // 4) Tabla de coeficiente de seguridad
      const tablaCoeficiente = new Table({
        width: { size: 50, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    text: 'Coeficiente de seguridad',
                  }),
                ],
              }),
              new TableCell({
                margins: CELL_MARGINS,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    text: coeficienteseguridad.toFixed(2).toString() ?? '---',
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      out.push(tablaCoeficiente);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      // 5) Comentario técnico
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'La tensión cortante de rotura es inferior a la mínima tensión cortante de los pernos, por lo que el técnico que suscribe considera suficiente los anclajes elegidos para la aplicación de cargas a realizar.',
            }),
          ],
        }),
      );
    }

    out.push(new Paragraph({ text: '' }));
    out.push(new Paragraph({ text: '' }));

    const soporteslucesespecificas = modificaciones.find(
      (m) =>
        m.nombre === 'SOPORTES PARA LUCES DE USO ESPECÍFICO' && m.seleccionado,
    );
    if (soporteslucesespecificas) {
      // 1) Título dinámico basado en contador
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '2.3.' + contador + ' Soporte faros de trabajo',
              bold: true,
            }),
          ],
        }),
      );
      out.push(new Paragraph({ text: '' }));
      contador++;

      let superficiefrontal =
        (soporteslucesespecificas.anchuraPiezaMLucesEspecificas ?? 0) *
        (soporteslucesespecificas.alturaPiezaMLucesEspecificas ?? 0);

      // 2) Tabla de características de la pieza y sujeción
      const tablaSoporteFaros = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          // Encabezados
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: CELL_MARGINS,
                columnSpan: 2,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'CARACTERÍSTICAS DE LA PIEZA',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: CELL_MARGINS,
                columnSpan: 2,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: 'SUJECIÓN' })],
                  }),
                ],
              }),
            ],
          }),
          // Filas de datos
          ...[
            [
              'Peso de la pieza en Kg',
              soporteslucesespecificas.pesoPiezaKgLucesEspecificas
                ?.toFixed(2)
                .toString() ?? '---',
              'nº tornillos',
              soporteslucesespecificas.nTornillosLucesEspecificas
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'Anchura de la pieza en m',
              soporteslucesespecificas.anchuraPiezaMLucesEspecificas
                ?.toFixed(2)
                .toString() ?? '---',
              'Métrica',
              Number(soporteslucesespecificas.metricaLucesEspecificas)
                ?.toFixed(2)
                .toString() ?? '---',
              '---',
            ],
            [
              'Altura de la pieza en m',
              soporteslucesespecificas.alturaPiezaMLucesEspecificas
                ?.toFixed(2)
                .toString() ?? '---',
              'Calidad',
              soporteslucesespecificas.calidadTornilloLucesEspecificas
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'Superficie frontal m²',
              superficiefrontal.toFixed(2).toString() ?? '---',
              'As (Sección resistente)',
              soporteslucesespecificas.seccionResistenteAsLucesEspecificas
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'Coef. aerodinámico',
              soporteslucesespecificas.cwCoefAerodinamicoLucesEspecificas
                ?.toFixed(2)
                .toString() ?? '---',
              'Res. Tracción Mín tornillo 8,8 (Kg/mm2)',
              soporteslucesespecificas.resTraccionMinTornillo88Kgmm2LucesEspecificas
                ?.toFixed(2)
                .toString() ?? '---',
            ],
          ].map(
            ([d1, v1, d2, v2]) =>
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        text: d1,
                      }),
                    ],
                  }),
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        text: v1,
                      }),
                    ],
                  }),
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        text: d2,
                      }),
                    ],
                  }),
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        text: v2,
                      }),
                    ],
                  }),
                ],
              }),
          ),
        ],
      });
      out.push(tablaSoporteFaros);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      // 3) Tabla de características para presión del aire
      const tablaAire = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: CELL_MARGINS,
                columnSpan: 2,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'CARACTERÍSTICAS PARA FUERZA PRODUCIDA POR PRESIÓN DEL AIRE',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          ...[
            [
              'Cw=Coef. Aerodinámico',
              soporteslucesespecificas.cwCoefAerodinamicoLucesEspecificas
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'A =área de la pieza (m²)',
              superficiefrontal.toFixed(2).toString() ?? '---',
            ],
            [
              'ρ (densidad del aire (Kg/m³))',
              soporteslucesespecificas.densidadAireKgM3LucesEspecificas
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'V² = velocidad del aire 140Km/h (m/s)',
              soporteslucesespecificas.velocidadAireV2msLucesEspecificas
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'R (radio de curva) m',
              (
                (soporteslucesespecificas.radioCurvaRLucesEspecificas ?? 0) *
                100
              )
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'K (coeficiente de seguridad)',
              soporteslucesespecificas.coefSeguridadKLucesEspecificas
                ?.toFixed(2)
                .toString() ?? '---',
            ],
          ].map(
            ([desc, val]) =>
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        text: desc,
                      }),
                    ],
                  }),
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        text: val,
                      }),
                    ],
                  }),
                ],
              }),
          ),
        ],
      });
      out.push(tablaAire);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      let peso =
        9.81 * (soporteslucesespecificas.pesoPiezaKgLucesEspecificas ?? 0);
      let fuerzafrenado =
        (soporteslucesespecificas.pesoPiezaKgLucesEspecificas ?? 0) * 10;
      let resistenciaaerodinamica =
        0.5 *
        (soporteslucesespecificas.cwCoefAerodinamicoLucesEspecificas ?? 0) *
        superficiefrontal *
        (soporteslucesespecificas.densidadAireKgM3LucesEspecificas ?? 0) *
        (soporteslucesespecificas.velocidadAireV2msLucesEspecificas ?? 0) *
        (soporteslucesespecificas.velocidadAireV2msLucesEspecificas ?? 0);
      let fuerzacentrifuga =
        (soporteslucesespecificas.pesoPiezaKgLucesEspecificas ?? 0) *
        (((soporteslucesespecificas.velocidadAireV2msLucesEspecificas ?? 0) *
          (soporteslucesespecificas.velocidadAireV2msLucesEspecificas ?? 0)) /
          ((soporteslucesespecificas.radioCurvaRLucesEspecificas ?? 0) * 100));
      let sumadelasfuerzas =
        peso + fuerzafrenado + resistenciaaerodinamica + fuerzacentrifuga;

      // 4) Tabla de fuerzas que actúan sobre la pieza
      const tablaFuerzas = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              'Peso',
              'Fuerza de frenado',
              'Resistencia aerodinámica',
              'Fuerza centrífuga',
              'Suma de fuerzas',
            ].map(
              (heading) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: heading })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              peso.toFixed(2).toString() ?? '---',
              fuerzafrenado.toFixed(2).toString() ?? '---',
              resistenciaaerodinamica.toFixed(2).toString() ?? '---',
              fuerzacentrifuga.toFixed(2).toString() ?? '---',
              sumadelasfuerzas.toFixed(2).toString() ?? '---',
            ].map(
              (val) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      text: val,
                    }),
                  ],
                }),
            ),
          }),
        ],
      });
      out.push(tablaFuerzas);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      let fuerzadediseno =
        sumadelasfuerzas *
        (soporteslucesespecificas.coefSeguridadKLucesEspecificas ?? 0);
      let fuerzamaximatornillostraccion =
        ((0.9 *
          (soporteslucesespecificas.resTraccionMinTornillo88Kgmm2LucesEspecificas ??
            0) *
          (soporteslucesespecificas.seccionResistenteAsLucesEspecificas ?? 0)) /
          1.25) *
        (soporteslucesespecificas.nTornillosLucesEspecificas ?? 0);
      let fuerzamaximatornilloscortante =
        ((0.5 *
          (soporteslucesespecificas.resTraccionMinTornillo88Kgmm2LucesEspecificas ??
            0) *
          (soporteslucesespecificas.seccionResistenteAsLucesEspecificas ?? 0)) /
          1.25) *
        (soporteslucesespecificas.nTornillosLucesEspecificas ?? 0);
      let comprobacion =
        fuerzadediseno / fuerzamaximatornilloscortante +
        fuerzadediseno / (1.4 * fuerzamaximatornillostraccion);

      // 5) Tabla de comprobación
      const tablaComprobacion = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              'La fuerza de diseño soportada por los anclajes (N)',
              'Fuerza máxima que soportan los tornillos a tracción (N)',
              'Fuerza máxima que soportan los tornillos a cortante (N)',
              '',
            ].map(
              (heading) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: heading })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              fuerzadediseno.toFixed(2).toString() ?? '---',
              fuerzamaximatornillostraccion.toFixed(2).toString() ?? '---',
              fuerzamaximatornilloscortante.toFixed(2).toString() ?? '---',
              comprobacion.toFixed(2).toString() ?? '---',
            ].map(
              (val, i) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  shading:
                    i === 0
                      ? undefined
                      : i === 3 && comprobacion > 1
                        ? { type: ShadingType.CLEAR, fill: 'FF0000' }
                        : { type: ShadingType.CLEAR, fill: '00B050' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      text: val,
                    }),
                  ],
                }),
            ),
          }),
        ],
      });
      out.push(tablaComprobacion);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));
    }

    const antiempotramiento = modificaciones.find(
      (m) => m.nombre === 'ANTIEMPOTRAMIENTO' && m.seleccionado,
    );
    if (antiempotramiento) {
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '2.3.' + contador + ' Antiempotramiento',
              bold: true,
            }),
          ],
        }),
      );
      out.push(new Paragraph({ text: '' }));
      contador++;

      const numeroTornillosAntiempotramientoRaw =
        antiempotramiento.nTornillosAntiempotramiento ??
        antiempotramiento.nTornillos;
      const metricaAntiempotramientoRaw =
        antiempotramiento.metricaAntiempotramiento;
      const medidasAnti = String(
        antiempotramiento.medidasAntiempotramiento ?? '',
      )
        .toLowerCase()
        .replace(/mm/g, '')
        .replace(/\s/g, '');
      const partesMedidasAnti = medidasAnti.split('x');
      const anchuraAntiM = Number.parseFloat(partesMedidasAnti[0]) / 1000;
      const alturaAntiM =
        partesMedidasAnti.length > 1
          ? Number.parseFloat(partesMedidasAnti[1]) / 1000
          : Number.NaN;
      const superficiefrontalAntiempotramiento =
        antiempotramiento.superficieFrontalM2Antiempotramiento ??
        (Number.isFinite(anchuraAntiM) && Number.isFinite(alturaAntiM)
          ? anchuraAntiM * alturaAntiM
          : undefined);
      const numeroTornillosAntiempotramiento =
        numeroTornillosAntiempotramientoRaw ?? 0;

      const tablaAntiempotramiento = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: CELL_MARGINS,
                columnSpan: 2,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'CARACTERÍSTICAS DE LA PIEZA',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: CELL_MARGINS,
                columnSpan: 2,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: 'SUJECIÓN' })],
                  }),
                ],
              }),
            ],
          }),
          ...[
            [
              'Peso de la pieza en Kg',
              antiempotramiento.pesoPiezaKgAntiempotramiento
                ?.toFixed(2)
                .toString() ?? '---',
              'nº tornillos',
              numeroTornillosAntiempotramientoRaw?.toFixed(2).toString() ??
                '---',
            ],
            [
              'Anchura de la pieza en m',
              Number.isFinite(anchuraAntiM)
                ? anchuraAntiM.toFixed(2).toString()
                : '---',
              'Métrica',
              metricaAntiempotramientoRaw?.toString() ?? '---',
            ],
            [
              'Altura de la pieza en m',
              Number.isFinite(alturaAntiM)
                ? alturaAntiM.toFixed(2).toString()
                : '---',
              'Calidad',
              antiempotramiento.calidadTornilloAntiempotramiento
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'Superficie frontal m²',
              superficiefrontalAntiempotramiento?.toFixed(2).toString() ??
                '---',
              'As (Sección resistente)',
              antiempotramiento.seccionResistenteAsAntiempotramiento
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'Coef. aerodinámico',
              antiempotramiento.cwCoefAerodinamicoAntiempotramiento
                ?.toFixed(2)
                .toString() ?? '---',
              'Res. Tracción Mín tornillo 8,8 (Kg/mm2)',
              antiempotramiento.resTraccionMinTornillo88Kgmm2Antiempotramiento
                ?.toFixed(2)
                .toString() ?? '---',
            ],
          ].map(
            ([d1, v1, d2, v2]) =>
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        text: d1,
                      }),
                    ],
                  }),
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        text: v1,
                      }),
                    ],
                  }),
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        text: d2,
                      }),
                    ],
                  }),
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        text: v2,
                      }),
                    ],
                  }),
                ],
              }),
          ),
        ],
      });
      out.push(tablaAntiempotramiento);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      const tablaAireAntiempotramiento = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: CELL_MARGINS,
                columnSpan: 2,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'CARACTERISTICAS PARA FUERZA PRODUCIDA POR PRESION DEL AIRE',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          ...[
            [
              'Cw=Coef. Aerodinamico',
              antiempotramiento.cwCoefAerodinamicoAntiempotramiento
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'A =area de la pieza (m2)',
              antiempotramiento.superficieFrontalM2Antiempotramiento
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'p (densidad del aire (Kg/m3))',
              antiempotramiento.densidadAireKgM3Antiempotramiento
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'V2 = velocidad del aire 140Km/h (m/s)',
              antiempotramiento.velocidadAireV2msAntiempotramiento
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'R (radio de curva) m',
              antiempotramiento.radioCurvaRAntiempotramiento
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'K (coeficiente de seguridad)',
              antiempotramiento.coefSeguridadKAntiempotramiento
                ?.toFixed(2)
                .toString() ?? '---',
            ],
          ].map(
            ([desc, val]) =>
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        text: desc,
                      }),
                    ],
                  }),
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        text: val,
                      }),
                    ],
                  }),
                ],
              }),
          ),
        ],
      });
      out.push(tablaAireAntiempotramiento);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      let peso = 9.81 * (antiempotramiento.pesoPiezaKgAntiempotramiento ?? 0);
      let fuerzafrenado =
        (antiempotramiento.pesoPiezaKgAntiempotramiento ?? 0) * 10;
      let resistenciaaerodinamica =
        0.5 *
        (antiempotramiento.cwCoefAerodinamicoAntiempotramiento ?? 0) *
        (antiempotramiento.superficieFrontalM2Antiempotramiento ?? 0) *
        (antiempotramiento.densidadAireKgM3Antiempotramiento ?? 0) *
        (antiempotramiento.velocidadAireV2msAntiempotramiento ?? 0) *
        (antiempotramiento.velocidadAireV2msAntiempotramiento ?? 0);
      let fuerzacentrifuga =
        (antiempotramiento.pesoPiezaKgAntiempotramiento ?? 0) *
        (((antiempotramiento.velocidadAireV2msAntiempotramiento ?? 0) *
          (antiempotramiento.velocidadAireV2msAntiempotramiento ?? 0)) /
          (antiempotramiento.radioCurvaRAntiempotramiento ?? 0));
      let sumadelasfuerzas =
        peso + fuerzafrenado + resistenciaaerodinamica + fuerzacentrifuga;

      const tablaFuerzasAntiempotramiento = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              'Peso',
              'Fuerza de frenado',
              'Resistencia aerodinamica',
              'Fuerza centrifuga',
              'Suma de fuerzas',
            ].map(
              (heading) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: heading })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              peso.toFixed(2).toString() ?? '---',
              fuerzafrenado.toFixed(2).toString() ?? '---',
              resistenciaaerodinamica.toFixed(2).toString() ?? '---',
              fuerzacentrifuga.toFixed(2).toString() ?? '---',
              sumadelasfuerzas.toFixed(2).toString() ?? '---',
            ].map(
              (val) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  children: [new Paragraph(val)],
                }),
            ),
          }),
        ],
      });
      out.push(tablaFuerzasAntiempotramiento);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      let fuerzadediseno =
        sumadelasfuerzas *
        (antiempotramiento.coefSeguridadKAntiempotramiento ?? 0);
      let fuerzamaximatornillostraccion =
        ((0.9 *
          (antiempotramiento.resTraccionMinTornillo88Kgmm2Antiempotramiento ??
            0) *
          (antiempotramiento.seccionResistenteAsAntiempotramiento ?? 0)) /
          1.25) *
        numeroTornillosAntiempotramiento;
      let fuerzamaximatornilloscortante =
        ((0.5 *
          (antiempotramiento.resTraccionMinTornillo88Kgmm2Antiempotramiento ??
            0) *
          (antiempotramiento.seccionResistenteAsAntiempotramiento ?? 0)) /
          1.25) *
        numeroTornillosAntiempotramiento;
      let comprobacion =
        fuerzadediseno / fuerzamaximatornilloscortante +
        fuerzadediseno / (1.4 * fuerzamaximatornillostraccion);

      const tablaComprobacionAntiempotramiento = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              'La fuerza de diseño soportada por los anclajes (N)',
              'Fuerza maxima que soportan los tornillos a traccion (N)',
              'Fuerza maxima que soportan los tornillos a cortante (N)',
              '',
            ].map(
              (heading) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: heading, bold: true })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              fuerzadediseno.toFixed(2).toString() ?? '---',
              fuerzamaximatornillostraccion.toFixed(2).toString() ?? '---',
              fuerzamaximatornilloscortante.toFixed(2).toString() ?? '---',
              comprobacion.toFixed(2).toString() ?? '---',
            ].map(
              (val, i) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  shading:
                    i === 0
                      ? undefined
                      : i === 3 && comprobacion > 1
                        ? { type: ShadingType.CLEAR, fill: 'FF0000' }
                        : { type: ShadingType.CLEAR, fill: '00B050' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: val })],
                    }),
                  ],
                }),
            ),
          }),
        ],
      });
      out.push(tablaComprobacionAntiempotramiento);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));
    }

    const NO_BORDERS = {
      top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    };

    const underlineRun = (text: string) =>
      new TextRun({
        text,
        underline: {},
        bold: true,
      });

    const fmtDec = (value?: number, decimals = 2) =>
      Number.isFinite(value)
        ? Number(value).toLocaleString('es-ES', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })
        : '---';

    const fmtInt = (value?: number) =>
      Number.isFinite(value)
        ? Number(value).toLocaleString('es-ES', {
            maximumFractionDigits: 0,
          })
        : '---';

    const makeBorderlessTable = (
      rows: Array<[string, string]>,
      width = 60,
    ): Table =>
      new Table({
        width: { size: width, type: WidthType.PERCENTAGE },
        borders: NO_BORDERS,
        rows: rows.map(
          ([label, value]) =>
            new TableRow({
              cantSplit: true,
              children: [
                new TableCell({
                  margins: CELL_MARGINS,
                  width: { size: 65, type: WidthType.PERCENTAGE },
                  borders: NO_BORDERS,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.LEFT,
                      children: [new TextRun({ text: label })],
                    }),
                  ],
                }),
                new TableCell({
                  margins: CELL_MARGINS,
                  width: { size: 35, type: WidthType.PERCENTAGE },
                  borders: NO_BORDERS,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.LEFT,
                      children: [new TextRun({ text: value })],
                    }),
                  ],
                }),
              ],
            }),
        ),
      });

    const paradelante = modificaciones.find(
      (m) => m.nombre === 'PARAGOLPES DELANTERO' && m.seleccionado,
    );
    if (paradelante) {
      // 1) Título dinámico
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '2.3.' + contador + ' Paragolpes delantero',
              bold: true,
            }),
          ],
        }),
      );
      out.push(new Paragraph({ text: '' }));
      contador++;

      // 2) Tabla de características para presión del aire
      const numeroTornillosParagolpesDelanteroRaw =
        paradelante.ntornillosParaDelantero;
      const metricaParagolpesDelanteroRaw = paradelante.metricaParaDelantero;
      const medidasParagolpesDelantero = String(
        paradelante.medidasParagolpesDelantero ?? '',
      )
        .toLowerCase()
        .replace(/mm/g, '')
        .replace(/\s/g, '');
      const partesMedidasParagolpesDelantero =
        medidasParagolpesDelantero.split('x');
      const anchuraParagolpesDelanteroM =
        Number.parseFloat(partesMedidasParagolpesDelantero[0]) / 1000;
      const alturaParagolpesDelanteroM =
        partesMedidasParagolpesDelantero.length > 1
          ? Number.parseFloat(partesMedidasParagolpesDelantero[1]) / 1000
          : Number.NaN;
      const superficiefrontalParagolpesDelantero =
        paradelante.superficieFrontalM2ParagolpesDelantero ??
        (Number.isFinite(anchuraParagolpesDelanteroM) &&
        Number.isFinite(alturaParagolpesDelanteroM)
          ? anchuraParagolpesDelanteroM * alturaParagolpesDelanteroM
          : undefined);

      const tablaParagolpesDelantero = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: CELL_MARGINS,
                columnSpan: 2,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'CARACTERÍSTICAS DE LA PIEZA' }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: CELL_MARGINS,
                columnSpan: 2,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: 'SUJECIÓN' })],
                  }),
                ],
              }),
            ],
          }),
          ...[
            [
              'Peso de la pieza en Kg',
              paradelante.pesoPiezaKgParagolpesDelantero
                ?.toFixed(2)
                .toString() ?? '---',
              'nº tornillos',
              numeroTornillosParagolpesDelanteroRaw?.toFixed(2).toString() ??
                '---',
            ],
            [
              'Anchura de la pieza en m',
              Number.isFinite(anchuraParagolpesDelanteroM)
                ? anchuraParagolpesDelanteroM.toFixed(2).toString()
                : '---',
              'Métrica',
              metricaParagolpesDelanteroRaw?.toString() ?? '---',
            ],
            [
              'Altura de la pieza en m',
              Number.isFinite(alturaParagolpesDelanteroM)
                ? alturaParagolpesDelanteroM.toFixed(2).toString()
                : '---',
              'Calidad',
              paradelante.calidadTornilloParagolpesDelantero
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'Superficie frontal m²',
              superficiefrontalParagolpesDelantero?.toFixed(2).toString() ??
                '---',
              'As (Sección resistente)',
              paradelante.seccionResistenteAsParagolpesDelantero
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'Coef. aerodinámico',
              paradelante.cwCoefAerodinamicoParagolpesDelantero
                ?.toFixed(2)
                .toString() ?? '---',
              'Res. Tracción Mín tornillo 8,8 (Kg/mm2)',
              paradelante.resTraccionMinTornillo88Kgmm2ParagolpesDelantero
                ?.toFixed(2)
                .toString() ?? '---',
            ],
          ].map(
            ([d1, v1, d2, v2]) =>
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [new Paragraph(d1)],
                  }),
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [new Paragraph(v1)],
                  }),
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [new Paragraph(d2)],
                  }),
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [new Paragraph(v2)],
                  }),
                ],
              }),
          ),
        ],
      });
      out.push(tablaParagolpesDelantero);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));
      const tablaAireParagolpes = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: CELL_MARGINS,
                columnSpan: 2,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'CARACTERÍSTICAS PARA FUERZA PRODUCIDA POR PRESIÓN DEL AIRE',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          ...[
            [
              'Cw=Coef. Aerodinámico',
              paradelante.cwCoefAerodinamicoParagolpesDelantero
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'A =área de la pieza (m²)',
              paradelante.superficieFrontalM2ParagolpesDelantero
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'ρ (densidad del aire (Kg/m³))',
              paradelante.densidadAireKgM3ParagolpesDelantero
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'V² = velocidad del aire 140Km/h (m/s)',
              paradelante.velocidadAireV2msParagolpesDelantero
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'R (radio de curva) m',
              paradelante.radioCurvaRParagolpesDelantero
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'K (coeficiente de seguridad)',
              paradelante.coefSeguridadKParagolpesDelantero
                ?.toFixed(2)
                .toString() ?? '---',
            ],
          ].map(
            ([desc, val]) =>
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        text: desc,
                      }),
                    ],
                  }),
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        text: val,
                      }),
                    ],
                  }),
                ],
              }),
          ),
        ],
      });
      out.push(tablaAireParagolpes);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      let peso = 9.81 * (paradelante.pesoPiezaKgParagolpesDelantero ?? 0);
      let fuerzafrenado =
        (paradelante.pesoPiezaKgParagolpesDelantero ?? 0) * 10;
      let resistenciaaerodinamica =
        0.5 *
        (paradelante.cwCoefAerodinamicoParagolpesDelantero ?? 0) *
        (paradelante.superficieFrontalM2ParagolpesDelantero ?? 0) *
        (paradelante.densidadAireKgM3ParagolpesDelantero ?? 0) *
        (paradelante.velocidadAireV2msParagolpesDelantero ?? 0) *
        (paradelante.velocidadAireV2msParagolpesDelantero ?? 0);
      let fuerzacentrifuga =
        (paradelante.pesoPiezaKgParagolpesDelantero ?? 0) *
        (((paradelante.velocidadAireV2msParagolpesDelantero ?? 0) *
          (paradelante.velocidadAireV2msParagolpesDelantero ?? 0)) /
          ((paradelante.radioCurvaRParagolpesDelantero ?? 0) * 100));
      let sumadelasfuerzas =
        peso + fuerzafrenado + resistenciaaerodinamica + fuerzacentrifuga;

      // 3) Tabla de fuerzas que actúan sobre la pieza
      const tablaFuerzasParagolpes = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              'Peso',
              'Fuerza de frenado',
              'Resistencia aerodinámica',
              'Fuerza centrífuga',
              'Suma de fuerzas',
            ].map(
              (heading) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: heading })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              peso.toFixed(2).toString() ?? '---',
              fuerzafrenado.toFixed(2).toString() ?? '---',
              resistenciaaerodinamica.toFixed(2).toString() ?? '---',
              fuerzacentrifuga.toFixed(2).toString() ?? '---',
              sumadelasfuerzas.toFixed(2).toString() ?? '---',
            ].map(
              (val) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  children: [new Paragraph(val)],
                }),
            ),
          }),
        ],
      });
      out.push(tablaFuerzasParagolpes);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      let fuerzadediseno =
        sumadelasfuerzas * (paradelante.coefSeguridadKParagolpesDelantero ?? 0);
      let fuerzamaximatornillostraccion =
        ((0.9 *
          (paradelante.resTraccionMinTornillo88Kgmm2ParagolpesDelantero ?? 0) *
          (paradelante.seccionResistenteAsParagolpesDelantero ?? 0)) /
          1.25) *
        (paradelante.ntornillosParaDelantero ?? 0);
      let fuerzamaximatornilloscortante =
        ((0.5 *
          (paradelante.resTraccionMinTornillo88Kgmm2ParagolpesDelantero ?? 0) *
          (paradelante.seccionResistenteAsParagolpesDelantero ?? 0)) /
          1.25) *
        (paradelante.ntornillosParaDelantero ?? 0);
      let comprobacion =
        fuerzadediseno / fuerzamaximatornilloscortante +
        fuerzadediseno / (1.4 * fuerzamaximatornillostraccion);

      // 4) Tabla de comprobación
      const tablaComprobacionParagolpes = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              'La fuerza de diseño soportada por los anclajes (N)',
              'Fuerza máxima que soportan los tornillos a tracción (N)',
              'Fuerza máxima que soportan los tornillos a cortante (N)',
              '',
            ].map(
              (heading) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: heading, bold: true })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              fuerzadediseno.toFixed(2).toString() ?? '---',
              fuerzamaximatornillostraccion.toFixed(2).toString() ?? '---',
              fuerzamaximatornilloscortante.toFixed(2).toString() ?? '---',
              comprobacion.toFixed(2).toString() ?? '---',
            ].map(
              (val, i) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  shading:
                    i === 0
                      ? undefined
                      : i === 3 && comprobacion > 1
                        ? { type: ShadingType.CLEAR, fill: 'FF0000' }
                        : { type: ShadingType.CLEAR, fill: '00B050' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: val })],
                    }),
                  ],
                }),
            ),
          }),
        ],
      });
      out.push(tablaComprobacionParagolpes);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));
    }

    const paratras = modificaciones.find(
      (m) => m.nombre === 'PARAGOLPES TRASERO' && m.seleccionado,
    );
    if (paratras) {
      // 1) Título dinámico
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '2.3.' + contador + ' Paragolpes trasero',
              bold: true,
            }),
          ],
        }),
      );
      out.push(new Paragraph({ text: '' }));
      contador++;

      let superficiefrontal =
        (paratras.anchuraMParagolpesTrasero ?? 0) *
        (paratras.alturaMParagolpesTrasero ?? 0);

      // 2) Tabla de características de la pieza y sujeción
      const tablaParagolpesTrasero = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          // Encabezados
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: CELL_MARGINS,
                columnSpan: 2,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'CARACTERÍSTICAS DE LA PIEZA',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: CELL_MARGINS,
                columnSpan: 2,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: 'SUJECIÓN' })],
                  }),
                ],
              }),
            ],
          }),
          // Filas de datos
          ...[
            [
              'Peso de la pieza en Kg',
              paratras.pesoPiezaKgParagolpesTrasero?.toFixed(2).toString() ??
                '---',
              'nº tornillos',
              paratras.nTornillosParagolpesTrasero?.toFixed(2).toString() ??
                '---',
            ],
            [
              'Anchura de la pieza en m',
              paratras.anchuraMParagolpesTrasero?.toFixed(2).toString() ??
                '---',
              'Métrica',
              paratras.metricaParaTrasero?.toString() ?? '---',
            ],
            [
              'Altura de la pieza en m',
              paratras.alturaMParagolpesTrasero?.toFixed(2).toString() ?? '---',
              'Calidad',
              paratras.calidadTornilloParagolpesTrasero
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'Superficie frontal m²',
              superficiefrontal.toFixed(2).toString() ?? '---',
              'As (Sección resistente)',
              paratras.seccionResistenteAsParagolpesTrasero
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'Coef. aerodinámico',
              paratras.coefAerodinamicoParagolpesTrasero
                ?.toFixed(2)
                .toString() ?? '---',
              'Res. Tracción Mín tornillo 8,8 (Kg/mm2)',
              paratras.resTraccionMinTornillo88Kgmm2ParagolpesTrasero
                ?.toFixed(2)
                .toString() ?? '---',
            ],
          ].map(
            ([d1, v1, d2, v2]) =>
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [new Paragraph(d1)],
                  }),
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [new Paragraph(v1)],
                  }),
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [new Paragraph(d2)],
                  }),
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [new Paragraph(v2)],
                  }),
                ],
              }),
          ),
        ],
      });
      out.push(tablaParagolpesTrasero);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      // 3) Tabla de características para presión del aire
      const tablaAireParagolpesTrasero = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: CELL_MARGINS,
                columnSpan: 2,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'CARACTERÍSTICAS PARA FUERZA PRODUCIDA POR PRESIÓN DEL AIRE',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          ...[
            [
              'Cw=Coef. Aerodinámico',
              paratras.coefAerodinamicoParagolpesTrasero
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'A =área de la pieza (m²)',
              superficiefrontal.toFixed(2).toString() ?? '---',
            ],
            [
              'ρ (densidad del aire (Kg/m³))',
              paratras.densidadAireKgM3ParagolpesTrasero
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'V² = velocidad del aire 140Km/h (m/s)',
              paratras.velocidadAireV2msParagolpesTrasero
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'R (radio de curva) m',
              paratras.radioCurvaRParagolpesTrasero?.toFixed(2).toString() ??
                '---',
            ],
            [
              'K (coeficiente de seguridad)',
              paratras.coefSeguridadKParagolpesTrasero?.toFixed(2).toString() ??
                '---',
            ],
          ].map(
            ([desc, val]) =>
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [new Paragraph(desc)],
                  }),
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [new Paragraph(val)],
                  }),
                ],
              }),
          ),
        ],
      });
      out.push(tablaAireParagolpesTrasero);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      let peso = 9.81 * (paratras.pesoPiezaKgParagolpesTrasero ?? 0);
      let fuerzafrenado = (paratras.pesoPiezaKgParagolpesTrasero ?? 0) * 10;
      let resistenciaaerodinamica =
        0.5 *
        (paratras.coefAerodinamicoParagolpesTrasero ?? 0) *
        superficiefrontal *
        (paratras.densidadAireKgM3ParagolpesTrasero ?? 0) *
        (paratras.velocidadAireV2msParagolpesTrasero ?? 0) *
        (paratras.velocidadAireV2msParagolpesTrasero ?? 0);
      let fuerzacentrifuga =
        (paratras.pesoPiezaKgParagolpesTrasero ?? 0) *
        (((paratras.velocidadAireV2msParagolpesTrasero ?? 0) *
          (paratras.velocidadAireV2msParagolpesTrasero ?? 0)) /
          (paratras.radioCurvaRParagolpesTrasero ?? 0));
      let sumadelasfuerzas =
        peso + fuerzafrenado + resistenciaaerodinamica + fuerzacentrifuga;

      // 4) Tabla de fuerzas que actúan sobre la pieza
      const tablaFuerzasParagolpesTrasero = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              'Peso',
              'Fuerza de frenado',
              'Resistencia aerodinámica',
              'Fuerza centrífuga',
              'Suma de fuerzas',
            ].map(
              (heading) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: heading, bold: true })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              peso.toFixed(2).toString() ?? '---',
              fuerzafrenado.toFixed(2).toString() ?? '---',
              resistenciaaerodinamica.toFixed(2).toString() ?? '---',
              fuerzacentrifuga.toFixed(2).toString() ?? '---',
              sumadelasfuerzas.toFixed(2).toString() ?? '---',
            ].map(
              (val) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  children: [new Paragraph(val)],
                }),
            ),
          }),
        ],
      });
      out.push(tablaFuerzasParagolpesTrasero);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      let fuerzadediseno =
        sumadelasfuerzas * (paratras.coefSeguridadKParagolpesTrasero ?? 0);
      let fuerzamaximatornillostraccion =
        ((0.9 *
          (paratras.resTraccionMinTornillo88Kgmm2ParagolpesTrasero ?? 0) *
          (paratras.seccionResistenteAsParagolpesTrasero ?? 0)) /
          1.25) *
        (paratras.nTornillosParagolpesTrasero ?? 0);
      let fuerzamaximatornilloscortante =
        ((0.5 *
          (paratras.resTraccionMinTornillo88Kgmm2ParagolpesTrasero ?? 0) *
          (paratras.seccionResistenteAsParagolpesTrasero ?? 0)) /
          1.25) *
        (paratras.nTornillosParagolpesTrasero ?? 0);
      let comprobacion =
        fuerzadediseno / fuerzamaximatornilloscortante +
        fuerzadediseno / (1.4 * fuerzamaximatornillostraccion);

      // 5) Tabla de comprobación
      const tablaComprobacionParagolpesTrasero = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              'La fuerza de diseño soportada por los anclajes (N)',
              'Fuerza máxima que soportan los tornillos a tracción (N)',
              'Fuerza máxima que soportan los tornillos a cortante (N)',
              '',
            ].map(
              (heading) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: heading, bold: true })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              fuerzadediseno.toFixed(2).toString() ?? '---',
              fuerzamaximatornillostraccion.toFixed(2).toString() ?? '---',
              fuerzamaximatornilloscortante.toFixed(2).toString() ?? '---',
              comprobacion.toFixed(3).toString() ?? '---',
            ].map(
              (val, i) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  shading:
                    i === 0
                      ? undefined
                      : i === 3 && comprobacion > 1
                        ? { type: ShadingType.CLEAR, fill: 'FF0000' }
                        : { type: ShadingType.CLEAR, fill: '00B050' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: val })],
                    }),
                  ],
                }),
            ),
          }),
        ],
      });
      out.push(tablaComprobacionParagolpesTrasero);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));
    }

    const estribostaloneras = modificaciones.find(
      (m) => m.nombre === 'ESTRIBOS LATERALES O TALONERAS' && m.seleccionado,
    );
    if (estribostaloneras) {
      const tipo = estribostaloneras.detalle
        ?.estribosotaloneras as unknown as string;
      const isTaloneras = tipo === 'taloneras';
      // 1) Título dinámico
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: isTaloneras
                ? '2.3.' + contador + ' Taloneras'
                : '2.3.' + contador + ' Estribos laterales',
              bold: true,
            }),
          ],
        }),
      );
      out.push(new Paragraph({ text: '' }));
      contador++;

      let superficiefrontal =
        (estribostaloneras.anchuraMEstribos ?? 0) *
        (estribostaloneras.alturaMEstribos ?? 0);

      // 2) Tabla de características de la pieza y sujeción
      const tablaEstribos = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          // Encabezados
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: CELL_MARGINS,
                columnSpan: 2,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'CARACTERÍSTICAS DE LA PIEZA',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: CELL_MARGINS,
                columnSpan: 2,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: 'SUJECIÓN' })],
                  }),
                ],
              }),
            ],
          }),
          // Filas de datos
          ...[
            [
              'Peso de la pieza en Kg',
              estribostaloneras.pesoPiezaKgEstribos?.toFixed(2).toString() ??
                '---',
              'nº tornillos',
              estribostaloneras.nTornillosEstribos?.toFixed(2).toString() ??
                '---',
            ],
            [
              'Anchura de la pieza en m',
              estribostaloneras.anchuraMEstribos?.toFixed(2).toString() ??
                '---',
              'Métrica',
              estribostaloneras.metricaTalonera?.toString() ?? '---',
            ],
            [
              'Altura de la pieza en m',
              estribostaloneras.alturaMEstribos?.toFixed(2).toString() ?? '---',
              'Calidad',
              estribostaloneras.calidadTornilloEstribos
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'Superficie frontal m²',
              superficiefrontal.toFixed(2).toString() ?? '---',
              'As (Sección resistente)',
              estribostaloneras.seccionResistenteAsEstribos
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'Coef. aerodinámico',
              estribostaloneras.coefAerodinamicoEstribos
                ?.toFixed(2)
                .toString() ?? '---',
              'Res. Tracción Mín tornillo 8,8 (Kg/mm2)',
              estribostaloneras.resTraccionMinTornillo88Kgmm2Estribos
                ?.toFixed(2)
                .toString() ?? '---',
            ],
          ].map(
            ([d1, v1, d2, v2]) =>
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [new Paragraph(d1)],
                  }),
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [new Paragraph(v1)],
                  }),
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [new Paragraph(d2)],
                  }),
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [new Paragraph(v2)],
                  }),
                ],
              }),
          ),
        ],
      });
      out.push(tablaEstribos);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      // 3) Tabla de características para presión del aire
      const tablaAireEstribos = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: CELL_MARGINS,
                columnSpan: 2,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'CARACTERÍSTICAS PARA FUERZA PRODUCIDA POR PRESIÓN DEL AIRE',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          ...[
            [
              'Cw=Coef. Aerodinámico',
              estribostaloneras.coefAerodinamicoEstribos
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'A =área de la pieza (m²)',
              superficiefrontal.toFixed(2).toString() ?? '---',
            ],
            [
              'ρ (densidad del aire (Kg/m³))',
              estribostaloneras.densidadAireKgM3Estribos
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'V² = velocidad del aire 140Km/h (m/s)',
              estribostaloneras.velocidadAireV2msEstribos
                ?.toFixed(2)
                .toString() ?? '---',
            ],
            [
              'R (radio de curva) m',
              estribostaloneras.radioCurvaREstribos?.toFixed(2).toString() ??
                '---',
            ],
            [
              'K (coeficiente de seguridad)',
              estribostaloneras.coefSeguridadKEstribos?.toFixed(2).toString() ??
                '---',
            ],
          ].map(
            ([desc, val]) =>
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [new Paragraph(desc)],
                  }),
                  new TableCell({
                    margins: CELL_MARGINS,
                    children: [new Paragraph(val)],
                  }),
                ],
              }),
          ),
        ],
      });
      out.push(tablaAireEstribos);
      out.push(new Paragraph({ text: '' }));

      let peso = 9.81 * (estribostaloneras.pesoPiezaKgEstribos ?? 0);
      let fuerzafrenado = (estribostaloneras.pesoPiezaKgEstribos ?? 0) * 10;
      let resistenciaaerodinamica =
        0.5 *
        (estribostaloneras.coefAerodinamicoEstribos ?? 0) *
        superficiefrontal *
        (estribostaloneras.densidadAireKgM3Estribos ?? 0) *
        (estribostaloneras.velocidadAireV2msEstribos ?? 0) *
        (estribostaloneras.velocidadAireV2msEstribos ?? 0);
      let fuerzacentrifuga =
        (estribostaloneras.pesoPiezaKgEstribos ?? 0) *
        (((estribostaloneras.velocidadAireV2msEstribos ?? 0) *
          (estribostaloneras.velocidadAireV2msEstribos ?? 0)) /
          (estribostaloneras.radioCurvaREstribos ?? 0));
      let sumadelasfuerzas =
        peso + fuerzafrenado + resistenciaaerodinamica + fuerzacentrifuga;

      // 4) Tabla de fuerzas que actúan sobre la pieza
      const tablaFuerzasEstribos = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              'Peso',
              'Fuerza de frenado',
              'Resistencia aerodinámica',
              'Fuerza centrífuga',
              'Suma de fuerzas',
            ].map(
              (heading) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: heading })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              peso.toFixed(2).toString() ?? '---',
              fuerzafrenado.toFixed(2).toString() ?? '---',
              resistenciaaerodinamica.toFixed(2).toString() ?? '---',
              fuerzacentrifuga.toFixed(2).toString() ?? '---',
              sumadelasfuerzas.toFixed(2).toString() ?? '---',
            ].map(
              (val) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  children: [new Paragraph(val)],
                }),
            ),
          }),
        ],
      });
      out.push(tablaFuerzasEstribos);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      let fuerzadediseno =
        sumadelasfuerzas * (estribostaloneras.coefSeguridadKEstribos ?? 0);
      let fuerzamaximatornillostraccion =
        ((0.9 *
          (estribostaloneras.resTraccionMinTornillo88Kgmm2Estribos ?? 0) *
          (estribostaloneras.seccionResistenteAsEstribos ?? 0)) /
          1.25) *
        (estribostaloneras.nTornillosEstribos ?? 0);
      let fuerzamaximatornilloscortante =
        ((0.5 *
          (estribostaloneras.resTraccionMinTornillo88Kgmm2Estribos ?? 0) *
          (estribostaloneras.seccionResistenteAsEstribos ?? 0)) /
          1.25) *
        (estribostaloneras.nTornillosEstribos ?? 0);
      let comprobacion =
        fuerzadediseno / fuerzamaximatornilloscortante +
        fuerzadediseno / (1.4 * fuerzamaximatornillostraccion);

      // 5) Tabla de comprobación
      const tablaComprobacionEstribos = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              'La fuerza de diseño soportada por los anclajes (N)',
              'Fuerza máxima que soportan los tornillos a tracción (N)',
              'Fuerza máxima que soportan los tornillos a cortante (N)',
              'Comprobación <= 1',
            ].map(
              (heading) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: heading, bold: true })],
                    }),
                  ],
                }),
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              fuerzadediseno.toFixed(2).toString() ?? '---',
              fuerzamaximatornillostraccion.toFixed(2).toString() ?? '---',
              fuerzamaximatornilloscortante.toFixed(2).toString() ?? '---',
              comprobacion.toFixed(3).toString() ?? '---',
            ].map(
              (val, i) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  shading:
                    i === 0
                      ? undefined
                      : i === 3 && comprobacion > 1
                        ? { type: ShadingType.CLEAR, fill: 'FF0000' }
                        : { type: ShadingType.CLEAR, fill: '00B050' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: val })],
                    }),
                  ],
                }),
            ),
          }),
        ],
      });
      out.push(tablaComprobacionEstribos);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));
    }

    const mobil = modificaciones.find(
      (m) =>
        m.nombre === 'MOBILIARIO INTERIOR VEHÍCULO' &&
        m.seleccionado &&
        data.tipoVehiculo === 'camper',
    );
    if (mobil) {
      // 1) Título centrado
      out.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text:
                '2.3.' +
                contador +
                ' Cálculo de esfuerzos en sistemas de fijación',
              bold: true,
            }),
          ],
        }),
      );
      contador++;

      let Tr = 0.6 * data.mmaDespues;

      // 2) Tabla: DATOS DE PARTIDA
      const tablaDatosPartida = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          // Encabezado
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                columnSpan: 2,
                margins: CELL_MARGINS,
                verticalAlign: VerticalAlign.CENTER,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: 'DATOS DE PARTIDA' })],
                  }),
                ],
              }),
            ],
          }),
          // Filas de datos
          ...[
            ['M.T.M.A. (Kg)', data.mmaDespues.toFixed(2).toString() ?? '---'],
            [
              'Velocidad máxima (Km/h)',
              data.velocidadMaxima.toString() ?? '---',
            ],
            ['Coeficiente de rozamiento', '0.6'],
            ['Aceleración de la gravedad (m/s²)', '9.8'],
            ['Deceleración ar = μ * g (m/s²)', '5.88'],
            ['Tr = μ * Mt (Kg)', Tr.toFixed(2).toString() ?? '---'],
          ].map(
            ([desc, val]) =>
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    margins: CELL_MARGINS,
                    verticalAlign: VerticalAlign.CENTER,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: desc })],
                      }),
                    ],
                  }),
                  new TableCell({
                    margins: CELL_MARGINS,
                    verticalAlign: VerticalAlign.CENTER,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: val })],
                      }),
                    ],
                  }),
                ],
              }),
          ),
        ],
      });
      out.push(tablaDatosPartida);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      // 3) Tabla: ESFUERZOS LONGITUDINALES vs ELEMENTOS INSTALADOS
      function generarTablaLongitudinales(data: any): Table {
        const muebles: {
          desc: string;
          peso: string;
          medidas: string;
          tornillos: number;
        }[] = [];

        const modMobiliario = data.modificaciones.find(
          (m: any) =>
            m.nombre === 'MOBILIARIO INTERIOR VEHÍCULO' && m.seleccionado,
        );

        if (modMobiliario) {
          // Muebles bajos
          (modMobiliario.mueblesBajo || []).forEach((m: any) => {
            muebles.push({
              desc: `Mueble bajo ${formatMedidasMueble(m.medidas)}`,
              peso: m.pesoMuebleBajo || '---',
              medidas: formatMedidasMueble(m.medidas),
              tornillos: m.tornillos || 0,
            });
          });

          // Muebles altos
          (modMobiliario.mueblesAlto || []).forEach((m: any) => {
            muebles.push({
              desc: `Mueble alto ${formatMedidasMueble(m.medidas)}`,
              peso: m.pesoMuebleAlto || '---',
              medidas: formatMedidasMueble(m.medidas),
              tornillos: m.tornillos || 0,
            });
          });

          // Aseos
          (modMobiliario.mueblesAseo || []).forEach((m: any) => {
            muebles.push({
              desc: `Aseo ${formatMedidasMueble(m.medidas)}`,
              peso: m.pesoMuebleAseo || '---',
              medidas: formatMedidasMueble(m.medidas),
              tornillos: m.tornillos || 0,
            });
          });
        }

        // Construcción de la tabla
        return new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            // Encabezado dinámico
            new TableRow({
              cantSplit: true,
              children: [
                'Nº',
                'Esfuerzos longitudinales',
                'Elemento instalado',
                'Peso (kg)',
              ].map(
                (h) =>
                  new TableCell({
                    margins: CELL_MARGINS,
                    verticalAlign: VerticalAlign.CENTER,
                    shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: h, bold: true })],
                      }),
                    ],
                  }),
              ),
            }),

            // Filas de muebles
            ...muebles.map(
              (mueble, idx) =>
                new TableRow({
                  cantSplit: true,
                  children: [
                    (idx + 1).toString(),
                    mueble.desc,
                    `Q${idx + 1}`,
                    mueble.peso,
                  ].map(
                    (val) =>
                      new TableCell({
                        margins: CELL_MARGINS,
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: val })],
                          }),
                        ],
                      }),
                  ),
                }),
            ),
          ],
        });
      }

      out.push(generarTablaLongitudinales(data));
      out.push(new Paragraph({ text: '' }));

      // 4) Tabla: CARACTERÍSTICAS DE LOS TORNILLOS
      const tablaTornillos = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          // Encabezado
          new TableRow({
            cantSplit: true,
            children: ['Característica', '4', '5', '6', '8'].map(
              (h) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  verticalAlign: VerticalAlign.CENTER,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: h })],
                    }),
                  ],
                }),
            ),
          }),
          // Filas de propiedades
          ...[
            ['Diámetro nominal (mm)', '4', '5', '6', '8'],
            ['Paso de rosca (mm)', '0,7', '0,8', '1', '1,25'],
            ['Calidad', 'UM8.8', 'UM8.8', 'UM8.8', 'UM8.8'],
            ['Sección de tensión (mm²)', '3,24', '5,93', '7,97', '15,78'],
            ['Resistencia material (kg/mm²)', '64', '64', '64', '64'],
            ['Carga máx. límite elástico (Kg)', '207', '380', '510', '1010'],
            ['Par de apriete (mm)', '120', '290', '1100', '2600'],
            ['Radio sección sin roscar (mm)', '2', '2,5', '3', '4'],
            ['Radio efectivo (mm)', '1,015', '1,374', '1,593', '2,241'],
          ].map(
            (row) =>
              new TableRow({
                cantSplit: true,
                children: row.map(
                  (val) =>
                    new TableCell({
                      margins: CELL_MARGINS,
                      verticalAlign: VerticalAlign.CENTER,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: val })],
                        }),
                      ],
                    }),
                ),
              }),
          ),
        ],
      });
      out.push(tablaTornillos);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      // 5) Tabla: NÚMERO DE TORNILLOS UTILIZADOS Y MÉTRICA
      function generarTablaNumTornillos(data: any): Table {
        const modMobiliario = data.modificaciones.find(
          (m: any) =>
            m.nombre === 'MOBILIARIO INTERIOR VEHÍCULO' && m.seleccionado,
        );

        if (!modMobiliario) {
          return new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph('Sin mobiliario seleccionado')],
                  }),
                ],
              }),
            ],
          });
        }

        const diametroSel = modMobiliario.diametroTornilloSeleccionado;

        const muebles: { desc: string; cantidad: string }[] = [];

        // Muebles bajos
        (modMobiliario.mueblesBajo || []).forEach((m: any) => {
          muebles.push({
            desc: `Mueble bajo ${formatMedidasMueble(m.medidas)}`,
            cantidad: m.tornillosMuebleBajo || '0',
          });
        });

        // Muebles altos
        (modMobiliario.mueblesAlto || []).forEach((m: any) => {
          muebles.push({
            desc: `Mueble alto ${formatMedidasMueble(m.medidas)}`,
            cantidad: m.tornillosMuebleAlto || '0',
          });
        });

        // Aseos
        (modMobiliario.mueblesAseo || []).forEach((m: any) => {
          muebles.push({
            desc: `Aseo ${formatMedidasMueble(m.medidas)}`,
            cantidad: m.tornillosMuebleAseo || '0',
          });
        });

        // Encabezado
        const header = new TableRow({
          cantSplit: true,
          children: [
            'Componente / Diámetro tornillo (mm)',
            '4',
            '5',
            '6',
            '8',
            'Total',
          ].map(
            (h) =>
              new TableCell({
                margins: CELL_MARGINS,
                verticalAlign: VerticalAlign.CENTER,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: h, bold: true })],
                  }),
                ],
              }),
          ),
        });

        // Filas dinámicas
        const filas = muebles.map((mueble) => {
          const cols = ['', '', '', '', ''];
          const idx = ['4', '5', '6', '8'].indexOf(String(diametroSel));
          if (idx !== -1) {
            cols[idx] = mueble.cantidad;
          }
          cols[4] = mueble.cantidad; // total siempre igual

          return new TableRow({
            cantSplit: true,
            children: [mueble.desc, ...cols].map(
              (val) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: val })],
                    }),
                  ],
                }),
            ),
          });
        });

        return new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [header, ...filas],
        });
      }

      out.push(generarTablaNumTornillos(data));
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      function generarTablaPropsTornillo(data: any): Table {
        const modMobiliario = data.modificaciones.find(
          (m: any) =>
            m.nombre === 'MOBILIARIO INTERIOR VEHÍCULO' && m.seleccionado,
        );

        if (!modMobiliario || !modMobiliario.diametroTornilloSeleccionado) {
          return new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph('Sin tornillo seleccionado')],
                  }),
                ],
              }),
            ],
          });
        }

        const diametroSel = modMobiliario.diametroTornilloSeleccionado;
        const areaSel = modMobiliario.areaResistenteTornilloSeleccionado;

        // Aquí defines las propiedades de la tabla
        const propiedades: [string, string][] = [
          ['Calidad', 'M8.8'],
          ['Resistencia a cortadura (Kg)', '227,8'],
          ['Tensión de rotura σr ≥ (Kg/mm²)', '80'],
          ['Tensión límite de elasticidad σe ≥ (Kg/mm²)', '65'],
          ['Diámetro del tornillo (mm)', String(diametroSel)],
          ['Área resistente Ar (mm²)', String(areaSel)],
          ['K', '0,6'],
          ['γMb = Coeficiente de seguridad', '1,25'],
        ];

        const filas = propiedades.map(
          ([desc, val]) =>
            new TableRow({
              cantSplit: true,
              children: [desc, val].map(
                (text) =>
                  new TableCell({
                    margins: CELL_MARGINS,
                    verticalAlign: VerticalAlign.CENTER,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text })],
                      }),
                    ],
                  }),
              ),
            }),
        );

        return new Table({
          width: { size: 50, type: WidthType.PERCENTAGE },
          rows: filas,
        });
      }

      // y luego en tu out:
      out.push(generarTablaPropsTornillo(data));

      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      // 8) Tabla: FUERZAS DE INERCIA y COEF. SEGURIDAD por componente
      function generarTablaFuerzaInercia(data: any): Table {
        const modMobiliario = data.modificaciones.find(
          (m: any) =>
            m.nombre === 'MOBILIARIO INTERIOR VEHÍCULO' && m.seleccionado,
        );

        if (!modMobiliario) {
          return new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph('Sin mobiliario seleccionado')],
                  }),
                ],
              }),
            ],
          });
        }

        const areaResistente =
          modMobiliario.areaResistenteTornilloSeleccionado || 0;

        const muebles: {
          desc: string;
          peso: number;
          tornillos: number;
        }[] = [];

        // Muebles bajos
        (modMobiliario.mueblesBajo || []).forEach((m: any) => {
          muebles.push({
            desc: `Mueble bajo ${formatMedidasMueble(m.medidas)}`,
            peso: parseFloat(m.pesoMuebleBajo) || 0,
            tornillos: parseInt(m.tornillosMuebleBajo) || 0,
          });
        });

        // Muebles altos
        (modMobiliario.mueblesAlto || []).forEach((m: any) => {
          muebles.push({
            desc: `Mueble alto ${formatMedidasMueble(m.medidas)}`,
            peso: parseFloat(m.pesoMuebleAlto) || 0,
            tornillos: parseInt(m.tornillosMuebleAlto) || 0,
          });
        });

        // Aseos
        (modMobiliario.mueblesAseo || []).forEach((m: any) => {
          muebles.push({
            desc: `Aseo ${formatMedidasMueble(m.medidas)}`,
            peso: parseFloat(m.pesoMuebleAseo) || 0,
            tornillos: parseInt(m.tornillosMuebleAseo) || 0,
          });
        });

        // Encabezado
        const header = new TableRow({
          cantSplit: true,
          children: [
            ' ',
            ' ',
            ' ',
            'Fuerza de Inercia I (Kg)',
            'Resistencia a cortante máx. Rm (Kg)',
            'Coef. seguridad λ > 1,25',
          ].map(
            (h) =>
              new TableCell({
                margins: CELL_MARGINS,
                verticalAlign: VerticalAlign.CENTER,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: h, bold: true })],
                  }),
                ],
              }),
          ),
        });

        // Filas dinámicas
        const filas = muebles.map((mueble, idx) => {
          const fuerzaInercia = (mueble.peso * 5.88) / 9.8;
          const resistenciaCortante =
            (0.6 * 80 * areaResistente * mueble.tornillos) / 1.25;
          const coefSeguridad = resistenciaCortante / fuerzaInercia;

          const valores = [
            (idx + 1).toString(),
            mueble.desc,
            'Q' + (idx + 1).toString(),
            fuerzaInercia.toFixed(2),
            resistenciaCortante.toFixed(2),
            coefSeguridad.toFixed(2),
          ];

          return new TableRow({
            cantSplit: true,
            children: valores.map(
              (val) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: val })],
                    }),
                  ],
                }),
            ),
          });
        });

        return new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [header, ...filas],
        });
      }

      // Y lo añades al out:
      out.push(generarTablaFuerzaInercia(data));

      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      // 9) Tabla: ESFUERZOS VERTICALES
      function generarTablaVerticales(data: any): Table {
        const modMobiliario = data.modificaciones.find(
          (m: any) =>
            m.nombre === 'MOBILIARIO INTERIOR VEHÍCULO' && m.seleccionado,
        );

        if (!modMobiliario) {
          return new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph('Sin mobiliario seleccionado')],
                  }),
                ],
              }),
            ],
          });
        }

        const resistenciaCortadura = 227.8;

        // 🔹 Solo muebles altos
        const muebles: {
          desc: string;
          peso: number;
          tornillos: number;
        }[] = [];

        (modMobiliario.mueblesAlto || []).forEach((m: any) => {
          muebles.push({
            desc: `Mueble alto ${formatMedidasMueble(m.medidas)}`,
            peso: parseFloat(m.pesoMuebleAlto) || 0,
            tornillos: parseInt(m.tornillosMuebleAlto) || 0,
          });
        });

        // Encabezado
        const header = new TableRow({
          cantSplit: true,
          children: [
            'Nº',
            'Elemento instalado',
            'Código',
            'Peso (kg)',
            'Número de tornillos',
            'Peso soportado por tornillo',
            'Resistencia a la cortadura (Kg)',
            'Resultado (Kg)',
          ].map(
            (h) =>
              new TableCell({
                margins: CELL_MARGINS,
                verticalAlign: VerticalAlign.CENTER,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: h, bold: true })],
                  }),
                ],
              }),
          ),
        });

        // Filas dinámicas solo de muebles altos
        const filas = muebles.map((mueble, idx) => {
          const pesoPorTornillo =
            mueble.tornillos > 0 ? mueble.peso / mueble.tornillos : 0;
          const resultado = resistenciaCortadura / pesoPorTornillo;

          const valores = [
            (idx + 1).toString(), // Nº
            mueble.desc, // Descripción
            `Q${idx + 1}`, // Código
            mueble.peso.toFixed(2), // Peso (kg)
            mueble.tornillos.toString(), // Nº tornillos
            pesoPorTornillo.toFixed(2), // Peso por tornillo
            resistenciaCortadura.toFixed(2).toString(), // Resistencia cortadura
            resultado.toFixed(2), // Resultado
          ];

          return new TableRow({
            cantSplit: true,
            children: valores.map(
              (val) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: val })],
                    }),
                  ],
                }),
            ),
          });
        });

        return new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [header, ...filas],
        });
      }

      // Y en el out:
      out.push(generarTablaVerticales(data));
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));
    }

    out.push(
      new Paragraph({
        children: [
          new TextRun({
            text:
              '2.3.' + contador + ' Cálculo de las superficies de aireación',
            bold: true,
          }),
        ],
      }),
    );
    contador++;

    // Párrafos explicativos
    out.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Debido a los elementos sustituidos en la parte frontal del vehículo, no se produce variación alguna en la refrigeración del radiador ni en las condiciones termodinámicas del motor.',
          }),
        ],
      }),
    );

    out.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Como podemos observar, podemos certificar que quedan libres las áreas de refrigeración del vehículo pudiendo afirmar que no habrá ningún problema en el rendimiento termodinámico del vehículo.',
          }),
        ],
      }),
    );

    const mod = modificaciones.find(
      (m) =>
        m.nombre ===
          'TODA LA CASUÍSTICA DE MUELLES, BALLESTAS Y AMORTIGUADORES QUE SE PUEDEN DAR' &&
        m.seleccionado,
    )!;

    // 1) Muelles delanteros con referencia
    if (mod) {
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: '2.4 CÁLCULO DEL SISTEMA DE SUSPENSIÓN ',
              color: '000000',
              bold: true,
            }),
          ],
        }),
      );

      contador = 1;
      contador2 = 1;

      out.push(new Paragraph({ text: '' }));

      if (
        mod?.detallesMuelles?.['muelleDelanteroConRef'] ||
        mod?.detallesMuelles?.['muelleDelanteroSinRef'] ||
        mod?.detallesMuelles?.['muelleTraseroConRef'] ||
        mod?.detallesMuelles?.['muelleTraseroSinRef']
      ) {
        out.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '2.4.' + contador + ' Cálculo de los muelles',
                bold: true,
              }),
            ],
          }),
        );
        contador++;

        const tablaMMA = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            // Encabezado
            new TableRow({
              cantSplit: true,
              children: [
                new TableCell({
                  columnSpan: 2,
                  margins: CELL_MARGINS,
                  verticalAlign: VerticalAlign.CENTER,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: 'MMA A CONSIDERAR EN CÁLCULOS',
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            // Filas de datos
            ...[
              ['MMTA/MMA (Kg)', data.mmaDespues?.toString() ?? '---'],
              ['MMTA/MMA eje 1', data.mmaEje1Despues?.toString() ?? '---'],
              ['MMTA/MMA eje 2', data.mmaEje2Despues?.toString() ?? '---'],
            ].map(
              ([desc, val]) =>
                new TableRow({
                  cantSplit: true,
                  children: [
                    new TableCell({
                      margins: CELL_MARGINS,
                      verticalAlign: VerticalAlign.CENTER,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: desc })],
                        }),
                      ],
                    }),
                    new TableCell({
                      margins: CELL_MARGINS,
                      verticalAlign: VerticalAlign.CENTER,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: val })],
                        }),
                      ],
                    }),
                  ],
                }),
            ),
          ],
        });
        out.push(tablaMMA);
        out.push(new Paragraph({ text: '' }));
        out.push(new Paragraph({ text: '' }));

        // 3) Características muelle (Acero EN 12070-2 SiCr)
        const tablaCaracteristicasMuelle = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            // Encabezado
            new TableRow({
              cantSplit: true,
              children: [
                'Características muelle (Acero EN 12070-2 SiCr)',
                'Kg/mm²',
                'MPa',
              ].map(
                (h) =>
                  new TableCell({
                    margins: CELL_MARGINS,
                    verticalAlign: VerticalAlign.CENTER,
                    shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: h })],
                      }),
                    ],
                  }),
              ),
            }),
            // Filas
            ...[
              ['Resistencia mecánica (Rm)', '204', '2001,24'],
              ['Resistencia elástica (Re)', '176', '1726,56'],
              [
                'Resistencia práctica del muelle a cizalla/cortadura (Rc)',
                '114',
                '1118,34',
              ],
              ['Módulo de elasticidad al cizallamiento', '8104', '79500,24'],
              ['Incremento del alargamiento mínimo (A)', '5%', ''],
            ].map(
              ([d, v1, v2]) =>
                new TableRow({
                  cantSplit: true,
                  children: [d, v1, v2].map(
                    (text) =>
                      new TableCell({
                        margins: CELL_MARGINS,
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text })],
                          }),
                        ],
                      }),
                  ),
                }),
            ),
          ],
        });
        out.push(tablaCaracteristicasMuelle);
        out.push(new Paragraph({ text: '' }));
        out.push(new Paragraph({ text: '' }));
      }

      let diametrointerior = 0;
      let diametromedio = 0;
      let curvatura = 0;
      let K = 0;

      if (mod?.detallesMuelles?.['muelleDelanteroConRef']) {
        diametrointerior =
          (mod.diametroExteriorDelanteroRef ?? 0) -
          2 * (mod.diametroEspiraDelanteroRef ?? 0);
        diametromedio =
          ((mod.diametroExteriorDelanteroRef ?? 0) + diametrointerior) / 2;
        curvatura = diametromedio / (mod.diametroEspiraDelanteroRef ?? 0);
        K =
          (Math.pow((mod.diametroEspiraDelanteroRef ?? 0) / 1000, 4) *
            79500.24 *
            1000000) /
          (8 *
            (Math.pow((diametromedio ?? 0) / 1000, 3) *
              (mod.numeroEspirasDelanteroRef ?? 0))) /
          1000;
      }

      if (mod?.detallesMuelles?.['muelleDelanteroSinRef']) {
        diametrointerior =
          (mod.diametroExteriorDelanteroSinRef ?? 0) -
          2 * (mod.diametroEspiraDelanteroSinRef ?? 0);
        diametromedio =
          ((mod.diametroExteriorDelanteroSinRef ?? 0) + diametrointerior) / 2;
        curvatura = diametromedio / (mod.diametroEspiraDelanteroSinRef ?? 0);
        K =
          (Math.pow((mod.diametroEspiraDelanteroSinRef ?? 0) / 1000, 4) *
            79500.24 *
            1000000) /
          (8 *
            (Math.pow((diametromedio ?? 0) / 1000, 3) *
              (mod.numeroEspirasDelanteroSinRef ?? 0))) /
          1000;
      }

      if (
        mod?.detallesMuelles?.['muelleDelanteroConRef'] ||
        mod?.detallesMuelles?.['muelleDelanteroSinRef']
      ) {
        // 4) Características geométricas muelles delanteros
        const tablaGeomDelanteros = new Table({
          width: { size: 50, type: WidthType.PERCENTAGE },
          rows: [
            // Encabezado
            new TableRow({
              cantSplit: true,
              children: [
                'Características geométricas muelles delanteros',
                'mm',
              ].map(
                (h) =>
                  new TableCell({
                    margins: CELL_MARGINS,
                    verticalAlign: VerticalAlign.CENTER,
                    shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: h })],
                      }),
                    ],
                  }),
              ),
            }),
            // Filas
            ...[
              [
                'Diámetro exterior (Dext)',
                mod.diametroExteriorDelanteroRef?.toFixed(2).toString() ??
                  '---',
              ],
              [
                'Diámetro interior (Dint)',
                diametrointerior.toFixed(2).toString() ?? '---',
              ],
              [
                'Diámetro medio (Dm)',
                diametromedio.toFixed(2).toString() ?? '---',
              ],
              [
                'Diámetro de espira (De)',
                mod.diametroEspiraDelanteroRef?.toFixed(2).toString() ?? '---',
              ],
              [
                'Longitud libre (L0)',
                mod.longitudLibreDelanteroRef?.toFixed(2).toString() ?? '---',
              ],
              [
                'Número de espiras (n)',
                mod.numeroEspirasDelanteroRef?.toFixed(2).toString() ?? '---',
              ],
              ['Curvatura (C)', curvatura.toFixed(2).toString() ?? '---'],
              ['Rigidez (K) N/mm', K.toFixed(2).toString() ?? '---'],
            ].map(
              ([d, v]) =>
                new TableRow({
                  cantSplit: true,
                  children: [d, v].map(
                    (text) =>
                      new TableCell({
                        margins: CELL_MARGINS,
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text })],
                          }),
                        ],
                      }),
                  ),
                }),
            ),
          ],
        });
        out.push(tablaGeomDelanteros);
        out.push(new Paragraph({ text: '' }));
        out.push(new Paragraph({ text: '' }));

        let maxCortante = 0;
        let maxCortanteDelantero = 0;
        let coefSeguridad = 0;

        if (mod?.detallesMuelles?.['muelleDelanteroConRef']) {
          maxCortante =
            (Math.PI *
              (((mod.diametroEspiraDelanteroRef ?? 0) / 1000) ** 3 *
                1118.34 *
                1000000)) /
            (8 * (diametromedio / 1000));
          maxCortanteDelantero = maxCortante * 2;
          coefSeguridad =
            maxCortanteDelantero / ((mod.mmta1EjeSuspension ?? 0) * 9.81);
        }

        if (mod?.detallesMuelles?.['muelleDelanteroSinRef']) {
          maxCortante =
            (Math.PI *
              (((mod.diametroEspiraDelanteroSinRef ?? 0) / 1000) ** 3 *
                1118.34 *
                1000000)) /
            (8 * (diametromedio / 1000));
          maxCortanteDelantero = maxCortante * 2;
          coefSeguridad =
            maxCortanteDelantero / ((mod.mmta1EjeSuspension ?? 0) * 9.81);
        }

        // 5) Cálculo del esfuerzo máximo cortante (EMC) delanteros
        const tablaEMCDelanteros = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            // Título
            new TableRow({
              cantSplit: true,
              children: [
                new TableCell({
                  columnSpan: 3,
                  margins: CELL_MARGINS,
                  verticalAlign: VerticalAlign.CENTER,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: 'CÁLCULO DEL ESFUERZO MÁXIMO CORTANTE (EMC)',
                          bold: true,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            // Encabezados de datos
            new TableRow({
              cantSplit: true,
              children: [
                'Esf. Máx. Cortante 1 muelle (N)',
                'Esf. Máx. Cortante eje delantero (N)',
                'Coeficiente de seguridad K>1',
              ].map(
                (h) =>
                  new TableCell({
                    margins: CELL_MARGINS,
                    verticalAlign: VerticalAlign.CENTER,
                    shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: h, bold: true })],
                      }),
                    ],
                  }),
              ),
            }),
            // Valores
            new TableRow({
              cantSplit: true,
              children: [
                maxCortante.toFixed(2).toString() ?? '---',
                maxCortanteDelantero.toFixed(2).toString() ?? '---',
                coefSeguridad.toFixed(2).toString() ?? '---',
              ].map(
                (v, i) =>
                  new TableCell({
                    margins: CELL_MARGINS,
                    verticalAlign: VerticalAlign.CENTER,
                    shading:
                      i === 2 && coefSeguridad <= 1
                        ? { type: ShadingType.CLEAR, fill: 'FF0000' }
                        : i === 2
                          ? { type: ShadingType.CLEAR, fill: '00B050' }
                          : undefined,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: v })],
                      }),
                    ],
                  }),
              ),
            }),
          ],
        });
        out.push(tablaEMCDelanteros);
        out.push(new Paragraph({ text: '' }));
        out.push(new Paragraph({ text: '' }));

        let longMinMuelle = 0;
        let flechaResorte = 0;
        let cargaMaxQ = 0;
        let cargaMaxEje1Q = 0;
        let coefSeguridadK = 0;

        if (mod?.detallesMuelles?.['muelleDelanteroConRef']) {
          longMinMuelle =
            (mod.numeroEspirasDelanteroRef ?? 0) *
            (mod.diametroEspiraDelanteroRef ?? 0);
          flechaResorte = (mod.longitudLibreDelanteroRef ?? 0) - longMinMuelle;
          cargaMaxQ =
            ((flechaResorte / 1000) *
              79500.24 *
              1000000 *
              Math.pow((mod.diametroEspiraDelanteroRef ?? 0) / 1000, 4)) /
            (64 *
              (mod.numeroEspirasDelanteroRef ?? 0) *
              Math.pow(diametromedio / 1000 / 2, 3));
          cargaMaxEje1Q = cargaMaxQ * 2;
          coefSeguridadK =
            cargaMaxEje1Q / ((mod.mmta1EjeSuspension ?? 0) * 9.81);
        }

        if (mod?.detallesMuelles?.['muelleDelanteroSinRef']) {
          longMinMuelle =
            (mod.numeroEspirasDelanteroSinRef ?? 0) *
            (mod.diametroEspiraDelanteroSinRef ?? 0);
          flechaResorte =
            (mod.longitudLibreDelanteroSinRef ?? 0) - longMinMuelle;
          cargaMaxQ =
            ((flechaResorte / 1000) *
              79500.24 *
              1000000 *
              Math.pow((mod.diametroEspiraDelanteroSinRef ?? 0) / 1000, 4)) /
            (64 *
              (mod.numeroEspirasDelanteroSinRef ?? 0) *
              Math.pow(diametromedio / 1000 / 2, 3));
          cargaMaxEje1Q = cargaMaxQ * 2;
          coefSeguridadK =
            cargaMaxEje1Q / ((mod.mmta1EjeSuspension ?? 0) * 9.81);
        }

        // 6) Cálculo carga máx (Q) flecha delanteros
        const tablaQDelanteros = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              cantSplit: true,
              children: [
                new TableCell({
                  columnSpan: 5,
                  margins: CELL_MARGINS,
                  verticalAlign: VerticalAlign.CENTER,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: 'CÁLCULO LA CARGA MÁX (Q) EN FUNCIÓN DE LA FLECHA DEL MUELLE',
                          bold: true,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            new TableRow({
              cantSplit: true,
              children: [
                'Long. Mín muelle (mm)',
                'Flecha del resorte (mm)',
                'Carga máx Q (N)',
                'Carga máx eje 1 Q (N)',
                'Coef. Seguridad K>1',
              ].map(
                (h) =>
                  new TableCell({
                    margins: CELL_MARGINS,
                    verticalAlign: VerticalAlign.CENTER,
                    shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: h, bold: true })],
                      }),
                    ],
                  }),
              ),
            }),
            new TableRow({
              cantSplit: true,
              children: [
                longMinMuelle.toFixed(2).toString() ?? '---',
                flechaResorte.toFixed(2).toString() ?? '---',
                cargaMaxQ.toFixed(2).toString() ?? '---',
                cargaMaxEje1Q.toFixed(2).toString() ?? '---',
                coefSeguridadK.toFixed(2).toString() ?? '---',
              ].map(
                (v, i) =>
                  new TableCell({
                    margins: CELL_MARGINS,
                    verticalAlign: VerticalAlign.CENTER,
                    shading:
                      i === 4 && coefSeguridadK <= 1
                        ? { type: ShadingType.CLEAR, fill: 'FF0000' }
                        : i === 4
                          ? { type: ShadingType.CLEAR, fill: '00B050' }
                          : undefined,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: v })],
                      }),
                    ],
                  }),
              ),
            }),
          ],
        });
        out.push(tablaQDelanteros);
        out.push(new Paragraph({ text: '' }));
        out.push(new Paragraph({ text: '' }));

        let fuerzaMaxEjeDelantero = 0;
        let factorBergstrasserKb = 0;
        let esfuerzoMuelleT = 0;
        let coefSeguridadFinalK = 0;

        if (mod?.detallesMuelles?.['muelleDelanteroConRef']) {
          fuerzaMaxEjeDelantero = ((mod.mmta1EjeSuspension ?? 0) * 9.81) / 2;
          factorBergstrasserKb = (4 * curvatura + 2) / (4 * curvatura - 3);
          esfuerzoMuelleT =
            (8 * fuerzaMaxEjeDelantero * diametromedio * factorBergstrasserKb) /
            (Math.PI * Math.pow(mod.diametroEspiraDelanteroRef ?? 0, 3));
          coefSeguridadFinalK = 1118.34 / esfuerzoMuelleT;
        }

        if (mod?.detallesMuelles?.['muelleDelanteroSinRef']) {
          fuerzaMaxEjeDelantero = ((mod.mmta1EjeSuspension ?? 0) * 9.81) / 2;
          factorBergstrasserKb = (4 * curvatura + 2) / (4 * curvatura - 3);
          esfuerzoMuelleT =
            (8 * fuerzaMaxEjeDelantero * diametromedio * factorBergstrasserKb) /
            (Math.PI * Math.pow(mod.diametroEspiraDelanteroSinRef ?? 0, 3));
          coefSeguridadFinalK = 1118.34 / esfuerzoMuelleT;
        }

        // 7) Esfuerzo del muelle delanteros
        const tablaEsfuerzoDelanteros = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              cantSplit: true,
              children: [
                'Fuerza máx eje delantero (N)',
                'Factor de Bergsträsser Kb',
                'Esfuerzo del muelle (T) MPa',
                'Coeficiente de seguridad K>1',
              ].map(
                (h) =>
                  new TableCell({
                    margins: CELL_MARGINS,
                    verticalAlign: VerticalAlign.CENTER,
                    shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: h, bold: true })],
                      }),
                    ],
                  }),
              ),
            }),
            new TableRow({
              cantSplit: true,
              children: [
                fuerzaMaxEjeDelantero.toFixed(2).toString() ?? '---',
                factorBergstrasserKb.toFixed(2).toString() ?? '---',
                esfuerzoMuelleT.toFixed(2).toString() ?? '---',
                coefSeguridadFinalK.toFixed(2).toString() ?? '---',
              ].map(
                (v, i) =>
                  new TableCell({
                    margins: CELL_MARGINS,
                    verticalAlign: VerticalAlign.CENTER,
                    shading:
                      i === 3 && coefSeguridadFinalK <= 1
                        ? { type: ShadingType.CLEAR, fill: 'FF0000' }
                        : i === 3
                          ? { type: ShadingType.CLEAR, fill: '00B050' }
                          : undefined,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: v })],
                      }),
                    ],
                  }),
              ),
            }),
          ],
        });
        out.push(tablaEsfuerzoDelanteros);
        out.push(new Paragraph({ text: '' }));
        out.push(new Paragraph({ text: '' }));
      }

      if (mod?.detallesMuelles?.['muelleTraseroConRef']) {
        diametrointerior =
          (mod.diametroExteriorTraseroRef ?? 0) -
          2 * (mod.diametroEspiraTraseroRef ?? 0);
        diametromedio =
          ((mod.diametroExteriorTraseroRef ?? 0) + diametrointerior) / 2;
        curvatura = diametromedio / (mod.diametroEspiraTraseroRef ?? 0);
        K =
          (Math.pow((mod.diametroEspiraTraseroRef ?? 0) / 1000, 4) *
            79500.24 *
            1000000) /
          (8 *
            (Math.pow(diametromedio / 1000, 3) *
              (mod.numeroEspirasTraseroRef ?? 0))) /
          1000;
      }

      if (mod?.detallesMuelles?.['muelleTraseroSinRef']) {
        diametrointerior =
          (mod.diametroExteriorTraseroSinRef ?? 0) -
          2 * (mod.diametroEspiraTraseroSinRef ?? 0);
        diametromedio =
          ((mod.diametroExteriorTraseroSinRef ?? 0) + diametrointerior) / 2;
        curvatura = diametromedio / (mod.diametroEspiraTraseroSinRef ?? 0);
        K =
          (Math.pow((mod.diametroEspiraTraseroRef ?? 0) / 1000, 4) *
            79500.24 *
            1000000) /
          (8 *
            (Math.pow(diametromedio / 1000, 3) *
              (mod.numeroEspirasTraseroRef ?? 0))) /
          1000;
      }

      if (
        mod?.detallesMuelles?.['muelleTraseroConRef'] ||
        mod?.detallesMuelles?.['muelleTraseroSinRef']
      ) {
        // 8) Características geométricas muelles traseros
        const tablaGeomTraseros = new Table({
          width: { size: 50, type: WidthType.PERCENTAGE },
          rows: [
            // Encabezado
            new TableRow({
              cantSplit: true,
              children: [
                'Características geométricas muelles traseros',
                'mm',
              ].map(
                (h) =>
                  new TableCell({
                    margins: CELL_MARGINS,
                    verticalAlign: VerticalAlign.CENTER,
                    shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: h })],
                      }),
                    ],
                  }),
              ),
            }),
            // Filas
            ...[
              [
                'Diámetro exterior (Dext)',
                mod.diametroExteriorTraseroRef?.toFixed(2).toString() ?? '---',
              ],
              [
                'Diámetro interior (Dint)',
                diametrointerior.toFixed(2).toString() ?? '---',
              ],
              [
                'Diámetro medio (Dm)',
                diametromedio.toFixed(2).toString() ?? '---',
              ],
              [
                'Diámetro de espira (De)',
                mod.diametroEspiraTraseroRef?.toFixed(2).toString() ?? '---',
              ],
              [
                'Longitud libre (L0)',
                mod.longitudLibreTraseroRef?.toFixed(2).toString() ?? '---',
              ],
              [
                'Número de espiras (n)',
                mod.numeroEspirasTraseroRef?.toFixed(2).toString() ?? '---',
              ],
              ['Curvatura (C)', curvatura.toFixed(2).toString() ?? '---'],
              ['Rigidez (K) N/mm', K.toFixed(2).toString() ?? '---'],
            ].map(
              ([d, v]) =>
                new TableRow({
                  cantSplit: true,
                  children: [d, v].map(
                    (text) =>
                      new TableCell({
                        margins: CELL_MARGINS,
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text })],
                          }),
                        ],
                      }),
                  ),
                }),
            ),
          ],
        });
        out.push(tablaGeomTraseros);
        out.push(new Paragraph({ text: '' }));
        out.push(new Paragraph({ text: '' }));

        let maxCortante = 0;
        let maxCortanteTrasero = 0;
        let coefSeguridad = 0;

        if (mod?.detallesMuelles?.['muelleTraseroConRef']) {
          maxCortante =
            (Math.PI *
              (((mod.diametroEspiraTraseroRef ?? 0) / 1000) ** 3 *
                1118.34 *
                1000000)) /
            (8 * (diametromedio / 1000));
          maxCortanteTrasero = maxCortante * 2;
          coefSeguridad =
            maxCortanteTrasero / ((mod.mmta2EjeSuspension ?? 0) * 9.81);
        }

        if (mod?.detallesMuelles?.['muelleTraseroSinRef']) {
          maxCortante =
            (Math.PI *
              (((mod.diametroEspiraTraseroSinRef ?? 0) / 1000) ** 3 *
                1118.34 *
                1000000)) /
            (8 * (diametromedio / 1000));
          maxCortanteTrasero = maxCortante * 2;
          coefSeguridad =
            maxCortanteTrasero / ((mod.mmta2EjeSuspension ?? 0) * 9.81);
        }
        console.log('maxCortanteTrasero:', maxCortanteTrasero);
        console.log('maxCortanteTrasero:', mod.mmta2EjeSuspension);

        // 9) EMC traseros
        const tablaEMCTraseros = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            // Título
            new TableRow({
              cantSplit: true,
              children: [
                new TableCell({
                  columnSpan: 3,
                  margins: CELL_MARGINS,
                  verticalAlign: VerticalAlign.CENTER,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: 'CÁLCULO DEL ESFUERZO MÁXIMO CORTANTE (EMC)',
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            // Encabezados
            new TableRow({
              cantSplit: true,
              children: [
                'Esf. Máx. Cortante 1 muelle (N)',
                'Esf. Máx. Cortante eje tresero (N)',
                'Coeficiente de seguridad K>1',
              ].map(
                (h) =>
                  new TableCell({
                    margins: CELL_MARGINS,
                    verticalAlign: VerticalAlign.CENTER,
                    shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: h })],
                      }),
                    ],
                  }),
              ),
            }),
            // Valores
            new TableRow({
              cantSplit: true,
              children: [
                maxCortante.toFixed(2).toString() ?? '---',
                maxCortanteTrasero.toFixed(2).toString() ?? '---',
                coefSeguridad.toFixed(2).toString() ?? '---',
              ].map(
                (v, i) =>
                  new TableCell({
                    margins: CELL_MARGINS,
                    verticalAlign: VerticalAlign.CENTER,
                    shading:
                      i === 2
                        ? { type: ShadingType.CLEAR, fill: '00B050' }
                        : undefined,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: v })],
                      }),
                    ],
                  }),
              ),
            }),
          ],
        });
        out.push(tablaEMCTraseros);
        out.push(new Paragraph({ text: '' }));
        out.push(new Paragraph({ text: '' }));

        let longMinMuelle = 0;
        let flechaResorte = 0;
        let cargaMaxQ = 0;
        let cargaMaxEje1Q = 0;
        let coefSeguridadK = 0;

        if (mod?.detallesMuelles?.['muelleTraseroConRef']) {
          longMinMuelle =
            (mod.numeroEspirasTraseroRef ?? 0) *
            (mod.diametroEspiraTraseroRef ?? 0);
          flechaResorte = (mod.longitudLibreTraseroRef ?? 0) - longMinMuelle;
          cargaMaxQ =
            ((flechaResorte / 1000) *
              79500.24 *
              1000000 *
              Math.pow((mod.diametroEspiraTraseroRef ?? 0) / 1000, 4)) /
            (64 *
              (mod.numeroEspirasTraseroRef ?? 0) *
              Math.pow(diametromedio / 1000 / 2, 3));
          cargaMaxEje1Q = cargaMaxQ * 2;
          coefSeguridadK =
            cargaMaxEje1Q / ((mod.mmta2EjeSuspension ?? 0) * 9.81);
        }

        if (mod?.detallesMuelles?.['muelleTraseroSinRef']) {
          longMinMuelle =
            (mod.numeroEspirasTraseroSinRef ?? 0) *
            (mod.diametroEspiraTraseroSinRef ?? 0);
          flechaResorte = (mod.longitudLibreTraseroSinRef ?? 0) - longMinMuelle;
          cargaMaxQ =
            ((flechaResorte / 1000) *
              79500.24 *
              1000000 *
              Math.pow((mod.diametroEspiraTraseroSinRef ?? 0) / 1000, 4)) /
            (64 *
              (mod.numeroEspirasTraseroSinRef ?? 0) *
              Math.pow(diametromedio / 1000 / 2, 3));
          cargaMaxEje1Q = cargaMaxQ * 2;
          coefSeguridadK =
            cargaMaxEje1Q / ((mod.mmta2EjeSuspension ?? 0) * 9.81);
        }

        // 10) Q traseros
        const tablaQTraseros = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            // Título
            new TableRow({
              cantSplit: true,
              children: [
                new TableCell({
                  columnSpan: 5,
                  margins: CELL_MARGINS,
                  verticalAlign: VerticalAlign.CENTER,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: 'CÁLCULO LA CARGA MÁX (Q) EN FUNCIÓN DE LA FLECHA DEL MUELLE',
                          bold: true,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            // Encabezados
            new TableRow({
              cantSplit: true,
              children: [
                'Long. Mín muelle (mm)',
                'Flecha del resorte (mm)',
                'Carga máx Q (N)',
                'Carga máx eje 1 Q (N)',
                'Coef. Seguridad K>1',
              ].map(
                (h) =>
                  new TableCell({
                    margins: CELL_MARGINS,
                    verticalAlign: VerticalAlign.CENTER,
                    shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: h, bold: true })],
                      }),
                    ],
                  }),
              ),
            }),
            // Valores
            new TableRow({
              cantSplit: true,
              children: [
                longMinMuelle.toFixed(2).toString() ?? '---',
                flechaResorte.toFixed(2).toString() ?? '---',
                cargaMaxQ.toFixed(2).toString() ?? '---',
                cargaMaxEje1Q.toFixed(2).toString() ?? '---',
                coefSeguridadK.toFixed(2).toString() ?? '---',
              ].map(
                (v, i) =>
                  new TableCell({
                    margins: CELL_MARGINS,
                    verticalAlign: VerticalAlign.CENTER,
                    shading:
                      i === 4 && coefSeguridadK <= 1
                        ? { type: ShadingType.CLEAR, fill: 'FF0000' }
                        : i === 4
                          ? { type: ShadingType.CLEAR, fill: '00B050' }
                          : undefined,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: v })],
                      }),
                    ],
                  }),
              ),
            }),
          ],
        });
        out.push(tablaQTraseros);
        out.push(new Paragraph({ text: '' }));
        out.push(new Paragraph({ text: '' }));

        let fuerzaMaxEjeDelantero = 0;
        let factorBergstrasserKb = 0;
        let esfuerzoMuelleT = 0;
        let coefSeguridadFinalK = 0;

        if (mod?.detallesMuelles?.['muelleTraseroConRef']) {
          fuerzaMaxEjeDelantero = ((mod.mmta2EjeSuspension ?? 0) * 9.81) / 2;
          factorBergstrasserKb = (4 * curvatura + 2) / (4 * curvatura - 3);
          esfuerzoMuelleT =
            (8 * fuerzaMaxEjeDelantero * diametromedio * factorBergstrasserKb) /
            (Math.PI * Math.pow(mod.diametroEspiraTraseroRef ?? 0, 3));
          coefSeguridadFinalK = 1118.34 / esfuerzoMuelleT;
        }

        if (mod?.detallesMuelles?.['muelleTraseroSinRef']) {
          fuerzaMaxEjeDelantero = ((mod.mmta2EjeSuspension ?? 0) * 9.81) / 2;
          factorBergstrasserKb = (4 * curvatura + 2) / (4 * curvatura - 3);
          esfuerzoMuelleT =
            (8 * fuerzaMaxEjeDelantero * diametromedio * factorBergstrasserKb) /
            (Math.PI * Math.pow(mod.diametroEspiraTraseroSinRef ?? 0, 3));
          coefSeguridadFinalK = 1118.34 / esfuerzoMuelleT;
        }

        // 11) Esfuerzo traseros
        const tablaEsfuerzoTraseros = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              cantSplit: true,
              children: [
                'Fuerza máx eje delantero (N)',
                'Factor de Bergsträsser Kb',
                'Esfuerzo del muelle (T) MPa',
                'Coeficiente de seguridad K>1',
              ].map(
                (h) =>
                  new TableCell({
                    margins: CELL_MARGINS,
                    verticalAlign: VerticalAlign.CENTER,
                    shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: h, bold: true })],
                      }),
                    ],
                  }),
              ),
            }),
            new TableRow({
              cantSplit: true,
              children: [
                fuerzaMaxEjeDelantero.toFixed(2).toString() ?? '---',
                factorBergstrasserKb.toFixed(2).toString() ?? '---',
                esfuerzoMuelleT.toFixed(2).toString() ?? '---',
                coefSeguridadFinalK.toFixed(2).toString() ?? '---',
              ].map(
                (v, i) =>
                  new TableCell({
                    margins: CELL_MARGINS,
                    verticalAlign: VerticalAlign.CENTER,
                    shading:
                      i === 3 && coefSeguridadFinalK <= 1
                        ? { type: ShadingType.CLEAR, fill: 'FF0000' }
                        : i === 3
                          ? { type: ShadingType.CLEAR, fill: '00B050' }
                          : undefined,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: v })],
                      }),
                    ],
                  }),
              ),
            }),
          ],
        });
        out.push(tablaEsfuerzoTraseros);
        out.push(new Paragraph({ text: '' }));
        out.push(new Paragraph({ text: '' }));
      }

      out.push(new Paragraph({ text: '' }));

      contador = 1;

      if (
        mod?.detallesMuelles?.['ballestaDelantera'] ||
        mod?.detallesMuelles?.['ballestaTrasera']
      ) {
        out.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '2.4.' + contador + ' Cálculo de las ballestas',
                bold: true,
              }),
            ],
          }),
        );
        contador++;

        out.push(new Paragraph({ text: '' }));

        out.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Las MMA a considerar en los cálculos son las siguientes:',
              }),
            ],
          }),
        );

        // 2) Tabla: CARACTERÍSTICAS DEL VEHÍCULO
        const tablaVehiculo = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              cantSplit: true,
              children: [
                new TableCell({
                  columnSpan: 2,
                  margins: CELL_MARGINS,
                  verticalAlign: VerticalAlign.CENTER,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: 'CARACTERÍSTICAS DEL VEHÍCULO',
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            ...[
              [
                'MMTA/MMA (Kg)',
                mod.mmtaTotalSuspension?.toFixed(2).toString() ?? '---',
              ],
              [
                'MMTA/MMA eje 1',
                mod.mmta1EjeSuspension?.toFixed(2).toString() ?? '---',
              ],
              [
                'MMTA/MMA eje 2',
                mod.mmta2EjeSuspension?.toFixed(2).toString() ?? '---',
              ],
            ].map(
              ([d, v]) =>
                new TableRow({
                  cantSplit: true,
                  children: [d, v].map(
                    (txt) =>
                      new TableCell({
                        margins: CELL_MARGINS,
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: txt })],
                          }),
                        ],
                      }),
                  ),
                }),
            ),
          ],
        });
        out.push(tablaVehiculo);
        out.push(new Paragraph({ text: '' }));

        out.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Para calcular la carga que puede ser soportada por una ballesta, se emplea la siguiente formulación por flexión:',
              }),
            ],
          }),
        );

        out.push(new Paragraph({ text: '' }));
        out.push(new Paragraph({ text: '' }));

        const arrayBuffer = await (
          await fetch('../assets/ballesta.png')
        ).arrayBuffer();
        const imageData = new Uint8Array(arrayBuffer);

        out.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: imageData,
                type: 'png',
                transformation: {
                  width: 400,
                  height: 300,
                },
              }),
            ],
          }),
        );

        out.push(new Paragraph({ text: '' }));
        out.push(new Paragraph({ text: '' }));

        if (mod?.detallesMuelles?.['ballestaDelantera']) {
          // 3) Tabla: CÁLCULO DE LA BALLESTA EN EL EJE 1 (inputs)
          const tablaInputEje1 = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              ...[
                ['CÁLCULO DE LA BALLESTA EN EL EJE 1:', ' '],
                [' ', ' '],
                [
                  'Número de hojas N=',
                  mod.numHojasBallestaDelantera?.toFixed(2).toString() ?? '---',
                ],
                [
                  'Ancho de la hoja b=',
                  mod.anchoHojaBallestaDelantera?.toFixed(2).toString() ??
                    '---',
                ],
                [
                  'Espesor de la hoja e=',
                  mod.espesorHojaBallestaDelantera?.toFixed(2).toString() ??
                    '---',
                ],
                [
                  'Longitud total ballesta 2L=',
                  mod.longitudBallestaDelantera?.toFixed(2).toString() ?? '---',
                ],
                ['Esfuerzo de la flexión σ=', '60 Kg/mm²'],
              ].map(
                ([d, v]) =>
                  new TableRow({
                    cantSplit: true,
                    children: [d, v].map(
                      (txt) =>
                        new TableCell({
                          margins: CELL_MARGINS,
                          verticalAlign: VerticalAlign.CENTER,
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.CENTER,
                              children: [new TextRun({ text: txt })],
                            }),
                          ],
                        }),
                    ),
                  }),
              ),
            ],
          });
          out.push(tablaInputEje1);
          out.push(new Paragraph({ text: '' }));
          out.push(new Paragraph({ text: '' }));

          let f =
            ((mod.numHojasBallestaDelantera ?? 0) *
              (mod.anchoHojaBallestaDelantera ?? 0) *
              (mod.espesorHojaBallestaDelantera ?? 0) ** 2 *
              60) /
            ((6 * (mod.longitudBallestaDelantera ?? 0)) / 2);

          // 4) Tabla: RESULTADO F = … Kg
          const tablaF = new Table({
            width: { size: 50, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                cantSplit: true,
                children: ['F=', f.toFixed(2).toString() ?? '---', 'Kg'].map(
                  (txt, i) =>
                    new TableCell({
                      margins: CELL_MARGINS,
                      verticalAlign: VerticalAlign.CENTER,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new TextRun({
                              text: txt,
                              shading:
                                i === 1
                                  ? { type: ShadingType.CLEAR, fill: 'FFFFFF' }
                                  : undefined,
                            }),
                          ],
                        }),
                      ],
                    }),
                ),
              }),
            ],
          });
          out.push(tablaF);
          out.push(new Paragraph({ text: '' }));

          let f2 = f * 2;

          // 5) Tabla: RESULTADO 2F = … Kg (celdas rellenadas en rojo/verdes según valor)
          const tabla2F = new Table({
            width: { size: 50, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                cantSplit: true,
                children: ['2F=', f2.toFixed(2).toString() ?? '---', 'Kg'].map(
                  (txt, i) =>
                    new TableCell({
                      margins: CELL_MARGINS,
                      verticalAlign: VerticalAlign.CENTER,
                      shading:
                        i === 1
                          ? { type: ShadingType.CLEAR, fill: 'FF0000' }
                          : undefined,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: txt })],
                        }),
                      ],
                    }),
                ),
              }),
            ],
          });
          out.push(new Paragraph({ text: '' }));
          out.push(new Paragraph({ text: '' }));

          out.push(tabla2F);

          out.push(new Paragraph({ text: '' }));
          out.push(new Paragraph({ text: '' }));
        }

        if (mod?.detallesMuelles?.['ballestaTrasera']) {
          // 6) Tabla: CÁLCULO DE LA BALLESTA EN EL EJE 2 (inputs)
          const tablaInputEje2 = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              ...[
                ['CÁLCULO DE LA BALLESTA EN EL EJE 2:', ' '],
                [' ', ' '],
                [
                  'Número de hojas N=',
                  mod.numHojasBallestaTrasera?.toFixed(2).toString() ?? '---',
                ],
                [
                  'Ancho de la hoja b=',
                  mod.anchoHojaBallestaTrasera?.toFixed(2).toString() ?? '---',
                ],
                [
                  'Espesor de la hoja e=',
                  mod.espesorHojaBallestaTrasera?.toFixed(2).toString() ??
                    '---',
                ],
                [
                  'Longitud total ballesta 2L=',
                  mod.longitudBallestaTrasera?.toFixed(2).toString() ?? '---',
                ],
                ['Esfuerzo de la flexión σ=', '60 Kg/mm²'],
              ].map(
                ([d, v]) =>
                  new TableRow({
                    cantSplit: true,
                    children: [d, v].map(
                      (txt) =>
                        new TableCell({
                          margins: CELL_MARGINS,
                          verticalAlign: VerticalAlign.CENTER,
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.CENTER,
                              children: [new TextRun({ text: txt })],
                            }),
                          ],
                        }),
                    ),
                  }),
              ),
            ],
          });
          out.push(tablaInputEje2);
          out.push(new Paragraph({ text: '' }));
          out.push(new Paragraph({ text: '' }));

          let f =
            ((mod.numHojasBallestaTrasera ?? 0) *
              (mod.anchoHojaBallestaTrasera ?? 0) *
              (mod.espesorHojaBallestaTrasera ?? 0) ** 2 *
              60) /
            ((6 * (mod.longitudBallestaTrasera ?? 0)) / 2);

          let f2 = f * 2;

          // 7) Tabla: 2F eje 2
          const tabla2FEje2 = new Table({
            width: { size: 50, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                cantSplit: true,
                children: ['2F=', f.toFixed(2).toString() ?? '---', 'Kg'].map(
                  (txt, i) =>
                    new TableCell({
                      margins: CELL_MARGINS,
                      verticalAlign: VerticalAlign.CENTER,
                      shading:
                        i === 1
                          ? { type: ShadingType.CLEAR, fill: '00B050' }
                          : undefined,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: txt })],
                        }),
                      ],
                    }),
                ),
              }),
            ],
          });
          out.push(tabla2FEje2);

          out.push(new Paragraph({ text: '' }));
          out.push(new Paragraph({ text: '' }));

          out.push(
            new Paragraph({
              text: 'Por lo tanto, la carga total que puede soportar la ballesta de la suspensión trasera será igual a:',
            }),
          );
          // 8) Tabla: F eje 2
          const tablaFEje2 = new Table({
            width: { size: 50, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                cantSplit: true,
                children: ['F=', f2.toFixed(2).toString() ?? '---', 'Kg'].map(
                  (txt, i) =>
                    new TableCell({
                      margins: CELL_MARGINS,
                      verticalAlign: VerticalAlign.CENTER,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: txt })],
                        }),
                      ],
                    }),
                ),
              }),
            ],
          });
          out.push(tablaFEje2);

          out.push(new Paragraph({ text: '' }));
          out.push(new Paragraph({ text: '' }));
        }
      }

      if (mod?.detallesMuelles?.['tacosDeGoma']) {
        out.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '2.4.' + contador + ' Cálculo de los tacos de nylon',
                bold: true,
              }),
            ],
          }),
        );
        out.push(new Paragraph({ text: '' }));
        contador++;

        // 2) Tabla: CARACTERÍSTICAS DEL VEHÍCULO Y TACOS
        const tablaVehiculoTacos = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              cantSplit: true,
              children: [
                new TableCell({
                  columnSpan: 2,
                  margins: CELL_MARGINS,
                  verticalAlign: VerticalAlign.CENTER,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: 'CARACTERÍSTICAS DEL VEHÍCULO Y TACOS',
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            ...[
              [
                'MMTA/MMA (Kg)',
                mod.mmtaTotalSuspension?.toFixed(2).toString() ?? '---',
              ],
              [
                'MMTA/MMA eje 1',
                mod.mmta1EjeSuspension?.toFixed(2).toString() ?? '---',
              ],
              [
                'MMTA/MMA eje 2',
                mod.mmta2EjeSuspension?.toFixed(2).toString() ?? '---',
              ],
              ['PUNTOS DE APOYO', '2'],
              ['Resistencia a compresión del nylon (Kg/cm²)', '917'],
            ].map(
              ([desc, val]) =>
                new TableRow({
                  cantSplit: true,
                  children: [desc, val].map(
                    (txt) =>
                      new TableCell({
                        margins: CELL_MARGINS,
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: txt })],
                          }),
                        ],
                      }),
                  ),
                }),
            ),
          ],
        });
        out.push(tablaVehiculoTacos);
        out.push(new Paragraph({ text: '' }));
        out.push(new Paragraph({ text: '' }));

        // 3) Texto explicativo
        out.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Capacidad de carga de los tacos de goma.',
              }),
              new TextRun({
                text: ' Los tacos instalados deberán estar diseñados para soportar las masas máximas en cada eje.',
              }),
            ],
          }),
        );
        out.push(new Paragraph({ text: '' }));

        const COL_WIDTH = 33.33; // porcentaje para cada una de las 3 columnas

        if (mod?.tacosDelantero) {
          out.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: ' Peso a soportar por cada taco de goma en el eje delantero:',
                }),
              ],
            }),
          );
          // 4) Tabla: PESO A SOPORTAR POR CADA TACO EN EJE 1

          let resultadoEje1 = (mod.mmta1EjeSuspension ?? 0) / 2;

          const tablaPesoPorTaco = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                cantSplit: true,
                children: [
                  // 1ª columna: texto completo
                  new TableCell({
                    width: { size: COL_WIDTH, type: WidthType.PERCENTAGE },
                    margins: CELL_MARGINS,
                    verticalAlign: VerticalAlign.CENTER,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.LEFT,
                        children: [
                          new TextRun({
                            text: 'Peso a soportar por taco (Kg) =',
                            bold: false,
                          }),
                        ],
                      }),
                    ],
                  }),
                  // 2ª columna: MMA/MMTA sobre Nº puntos de apoyo con línea divisoria
                  new TableCell({
                    width: { size: COL_WIDTH, type: WidthType.PERCENTAGE },
                    margins: CELL_MARGINS,
                    verticalAlign: VerticalAlign.CENTER,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        border: {
                          bottom: {
                            style: BorderStyle.SINGLE,
                            size: 4,
                            color: '000000',
                          },
                        },
                        children: [
                          new TextRun({ text: 'MMA/MMTA', bold: true }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: 'Nº puntos de apoyo',
                            italics: true,
                          }),
                        ],
                      }),
                    ],
                  }),
                  // 3ª columna: "=" y "500"
                  new TableCell({
                    width: { size: COL_WIDTH, type: WidthType.PERCENTAGE },
                    margins: CELL_MARGINS,
                    verticalAlign: VerticalAlign.CENTER,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: '= ' + resultadoEje1.toFixed(2),
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          });

          out.push(tablaPesoPorTaco);
          out.push(new Paragraph({ text: '' }));

          let radio = (mod.diametroTacoDelantero ?? 0) / 2;
          let superficie = Math.PI * radio * radio;
          let resistenciaMaxCompresion = superficie * 917;

          // 5) Tabla: DIMENSIONES DEL TACO
          const tablaDimensionesTaco = new Table({
            width: { size: 50, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    columnSpan: 2,
                    margins: CELL_MARGINS,
                    verticalAlign: VerticalAlign.CENTER,
                    shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: 'DIMENSIONES DEL TACO' }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              ...[
                [
                  'Diámetro (cm)',
                  (mod.diametroTacoDelantero ?? 0).toFixed(2).toString() ??
                    '---',
                ],
                ['Radio (cm)', radio.toFixed(2).toString() ?? '---'],
                [
                  'Espesor (cm)',
                  (mod.espesorTacoDelantero ?? 0).toFixed(2).toString() ??
                    '---',
                ],
                [
                  'Superficie (cm²)',
                  (superficie ?? 0).toFixed(2).toString() ?? '---',
                ],
                [
                  'Res. Máxima a compresión (Kg)',
                  resistenciaMaxCompresion.toFixed(2).toString() ?? '---',
                ],
              ].map(
                ([desc, val]) =>
                  new TableRow({
                    cantSplit: true,
                    children: [desc, val].map(
                      (txt) =>
                        new TableCell({
                          margins: CELL_MARGINS,
                          verticalAlign: VerticalAlign.CENTER,
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.CENTER,
                              children: [new TextRun({ text: txt })],
                            }),
                          ],
                        }),
                    ),
                  }),
              ),
            ],
          });
          out.push(tablaDimensionesTaco);
          out.push(new Paragraph({ text: '' }));
          out.push(new Paragraph({ text: '' }));
        }

        if (mod?.tacosTrasero) {
          out.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: ' Peso a soportar por cada taco de goma en el eje trasero:',
                }),
              ],
            }),
          );

          out.push(new Paragraph({ text: '' }));

          let resultadoEje2 = (mod.mmta2EjeSuspension ?? 0) / 2;

          // 6) Tabla: PESO A SOPORTAR POR CADA TACO EN EJE 2
          const tablaPesoEje2 = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                cantSplit: true,
                children: [
                  // 1ª columna: texto completo
                  new TableCell({
                    width: { size: COL_WIDTH, type: WidthType.PERCENTAGE },
                    margins: CELL_MARGINS,
                    verticalAlign: VerticalAlign.CENTER,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.LEFT,
                        children: [
                          new TextRun({
                            text: 'Peso a soportar por taco (Kg) =',
                            bold: false,
                          }),
                        ],
                      }),
                    ],
                  }),
                  // 2ª columna: MMA/MMTA sobre Nº puntos de apoyo con línea divisoria
                  new TableCell({
                    width: { size: COL_WIDTH, type: WidthType.PERCENTAGE },
                    margins: CELL_MARGINS,
                    verticalAlign: VerticalAlign.CENTER,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        border: {
                          bottom: {
                            style: BorderStyle.SINGLE,
                            size: 4,
                            color: '000000',
                          },
                        },
                        children: [
                          new TextRun({ text: 'MMA/MMTA', bold: true }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: 'Nº puntos de apoyo',
                            italics: true,
                          }),
                        ],
                      }),
                    ],
                  }),
                  // 3ª columna: "=" y "500"
                  new TableCell({
                    width: { size: COL_WIDTH, type: WidthType.PERCENTAGE },
                    margins: CELL_MARGINS,
                    verticalAlign: VerticalAlign.CENTER,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: '= ' + resultadoEje2.toFixed(2),
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          });
          out.push(tablaPesoEje2);
          out.push(new Paragraph({ text: '' }));
          out.push(new Paragraph({ text: '' }));

          let radio = (mod.diametroTacoTrasero ?? 0) / 2;
          let superficie = Math.PI * radio * radio;
          let resistenciaMaxCompresion = superficie * 917;

          const tablaDimensionesTacoTrasero = new Table({
            width: { size: 50, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    columnSpan: 2,
                    margins: CELL_MARGINS,
                    verticalAlign: VerticalAlign.CENTER,
                    shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: 'DIMENSIONES DEL TACO' }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              ...[
                [
                  'Diámetro (cm)',
                  (mod.diametroTacoTrasero ?? 0).toFixed(2).toString() ?? '---',
                ],
                ['Radio (cm)', radio.toFixed(2).toString() ?? '---'],
                [
                  'Espesor (cm)',
                  (mod.espesorTacoTrasero ?? 0).toFixed(2).toString() ?? '---',
                ],
                ['Superficie (cm²)', superficie.toFixed(2).toString() ?? '---'],
                [
                  'Res. Máxima a compresión (Kg)',
                  resistenciaMaxCompresion.toFixed(2).toString() ?? '---',
                ],
              ].map(
                ([desc, val]) =>
                  new TableRow({
                    cantSplit: true,
                    children: [desc, val].map(
                      (txt) =>
                        new TableCell({
                          margins: CELL_MARGINS,
                          verticalAlign: VerticalAlign.CENTER,
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.CENTER,
                              children: [new TextRun({ text: txt })],
                            }),
                          ],
                        }),
                    ),
                  }),
              ),
            ],
          });
          out.push(tablaDimensionesTacoTrasero);
          out.push(new Paragraph({ text: '' }));
          out.push(new Paragraph({ text: '' }));
        }
      }
    }

    const engancheRemolque = modificaciones.find(
      (m) =>
        m.nombre === 'REMOLQUE HOMOLOGADO EN EMPLAZAMIENTO NO HOMOLOGADO' &&
        m.seleccionado,
    );

    if (engancheRemolque) {
      const marcaBola = engancheRemolque.marca;
      const contrasenaHomologacion = engancheRemolque.homologacion;
      const tipoBola = engancheRemolque.tipo;

      const dKn = engancheRemolque?.valorDKnRemolque ?? 0;
      const sKg = engancheRemolque?.mmrBarraTraccion ?? 0;
      const tTn = engancheRemolque?.mmtaRemolque ?? 0;
      const g = 9.81;

      const dN = dKn * 1000;
      const tKg = tTn * 1000;

      const rKg =
        Number.isFinite(dN) &&
        Number.isFinite(tKg) &&
        Number.isFinite(g) &&
        g * tKg !== dN
          ? (dN * tKg) / (g * tKg - dN)
          : undefined;

      let mmrCfKg = engancheRemolque.mmrBarraTraccion ?? 3500;

      let numero = 0;

      out.push(new Paragraph({ text: '' }));
      if (contador2 === 1) {
        numero = 5;
      } else {
        numero = 4;
      }

      out.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: `2.${numero} CÁLCULO ENGANCHE DE REMOLQUE `,
              color: '000000',
              bold: true,
            }),
          ],
        }),
      );

      out.push(new Paragraph({ text: '' }));

      // Creación de la nueva estructura de tabla
      out.push(
        new Paragraph({
          indent: { left: 700 },
          children: [new TextRun({ text: 'Bola de enganche:' })],
        }),
      );

      out.push(
        makeBorderlessTable(
          [
            ['Marca', marcaBola ?? '---'],
            ['Contraseña homologación', contrasenaHomologacion ?? '---'],
            ['Tipo', tipoBola ?? '---'],
          ],
          66,
        ),
      );

      out.push(
        new Paragraph({
          indent: { left: 700 },
          children: [new TextRun({ text: 'Características:' })],
        }),
      );

      out.push(
        makeBorderlessTable(
          [
            ['D', `${fmtDec(dKn, 1)} KN`],
            ['S (Carga vertical enganche)', `${fmtInt(sKg)} Kg`],
            ['T (MTMA)', `${fmtDec(tTn, 2)} Tn`],
            ['g', `${fmtDec(g, 2)} m/seg2`],
          ],
          66,
        ),
      );

      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'R = D·T / (g·T − D)',
              italics: true,
            }),
          ],
        }),
      );

      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `R= ${fmtDec(
                Number.isFinite(rKg) ? Number(rKg) / 1000 : undefined,
                2,
              )} Tn = ${fmtInt(rKg)} Kg`,
            }),
          ],
        }),
      );

      out.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `${fmtInt(rKg)} Kg > ${fmtInt(engancheRemolque.mmrEjeCentral)}Kg (MMR)`,
            }),
          ],
        }),
      );

      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text:
                'Como se ha demostrado mediante cálculo, podemos afirmar que la MMR cf del vehículo será de ' +
                `${fmtInt(engancheRemolque.mmrEjeCentral)}Kg.`,
            }),
          ],
        }),
      );

      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `2.${numero}.2 Cálculo sistema enganche al bastidor del vehículo`,
              bold: true,
            }),
          ],
        }),
      );

      out.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: 'Para la realización de estos cálculos partiremos de la determinación de la fuerza que han de soportar los sistemas de fijación en una superficie expuesta como en nuestro caso.',
            }),
          ],
        }),
      );

      out.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: 'En este punto se pretende demostrar que el sistema situado entre el chasis i la bola de remolque, es capaz de soportar la MMR cf, que el fabricante indica es la máxima que el vehículo puede remolcar.',
            }),
          ],
        }),
      );

      out.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: 'Esta fuerza irá repartida entre los tornillos que unen la estructura con el chasis y que consisten en un conjunto de 4 tornillos M10. Las fuerzas que sufrirán los tornillos se considerarán a tracción.',
            }),
          ],
        }),
      );

      out.push(new Paragraph({ text: '' }));

      const fabricacionEstructura =
        engancheRemolque.tipoFabricacionBarraTraccion ?? 'Artesanal en hierro';
      const referenciaEstructura =
        engancheRemolque.referenciaBarraTraccion ?? 'Sin referencia';

      mmrCfKg = Number(engancheRemolque.mmaBarraTraccion ?? 3500);

      const numeroTornillos = Number(
        engancheRemolque.nTornillosBarraTraccion ??
          engancheRemolque.nTornillos ??
          4,
      );

      const metrica = Number(
        engancheRemolque.metricasTornillosBarraTraccion ??
          engancheRemolque.metrica ??
          16,
      );

      const calidadTexto =
        'ISO ' +
        (engancheRemolque.calidadTornilloBarraTraccion?.toString() ?? '8.8');

      const seccionResistente = Number(
        engancheRemolque.seccionResistenteAsBarraTraccion ?? 157,
      );

      const resistenciaTraccionMin = Number(
        engancheRemolque.resTraccionMinTornillo88Kgmm2BarraTraccion ?? 80,
      );

      const gammaMb = Number(1.25);

      const fuerzaSoportarN = mmrCfKg * 9.81;
      const fuerzaFrenadoN = mmrCfKg * 9.81;
      const esfuerzoMaximoTraccionN =
        ((0.9 * resistenciaTraccionMin * seccionResistente) / gammaMb) *
        numeroTornillos;

      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          indent: { left: 700 },
          children: [
            new TextRun({ text: 'Estructura a chasis del enganche:' }),
          ],
        }),
      );

      out.push(
        makeBorderlessTable(
          [
            ['Fabricación:', fabricacionEstructura],
            ['Referencia:', referenciaEstructura],
          ],
          66,
        ),
      );

      out.push(
        new Paragraph({
          indent: { left: 700 },
          children: [new TextRun({ text: 'Características:' })],
        }),
      );

      out.push(
        makeBorderlessTable(
          [
            [
              'Fuerza a soportar:',
              `${fmtInt(mmrCfKg)} Kg = ${fmtDec(fuerzaSoportarN, 0)} N`,
            ],
          ],
          66,
        ),
      );

      out.push(
        new Paragraph({
          indent: { left: 700 },
          children: [new TextRun({ text: 'Sujeción:' })],
        }),
      );

      out.push(
        makeBorderlessTable(
          [
            ['Nº de tornillos', fmtInt(numeroTornillos)],
            ['Métrica', fmtInt(metrica)],
            ['Calidad', calidadTexto],
            ['Sección resistente', `${fmtInt(seccionResistente)} mm2`],
            [
              'Resistencia a tracción Mín:',
              `${fmtDec(resistenciaTraccionMin, 2)} Kg/mm2`,
            ],
          ],
          66,
        ),
      );

      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [underlineRun('Fuerza de Frenado')],
        }),
      );

      out.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: 'Partiendo de la aceleración de frenado asumida en las consideraciones previas, dicho esfuerzo lo obtendremos mediante la expresión:',
            }),
          ],
        }),
      );

      out.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'F(f) = m(Kg) * a',
            }),
          ],
        }),
      );

      out.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: `Considerando la aceleración (a = 10,00 m/s2), sustituyendo obtenemos que:`,
            }),
          ],
        }),
      );

      out.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `F(f) = ${fmtDec(fuerzaFrenadoN, 0)} N`,
            }),
          ],
        }),
      );

      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            underlineRun('Esfuerzos máximos soportados por los tornillos'),
          ],
        }),
      );

      out.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: 'Los esfuerzos máximos que podrán soportar los tornillos a tracción vendrán dados mediante la siguiente fórmula:',
            }),
          ],
        }),
      );

      out.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'Ft(máx) = (0,9 * fu * As / γMb) * N',
              italics: true,
            }),
          ],
        }),
      );

      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [new TextRun({ text: 'Siendo:' })],
        }),
      );

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Ft(máx): ' }),
            new TextRun({
              text: 'La fuerza máxima que podrá soportar el grupo de tornillos a Tracción.',
            }),
          ],
        }),
      );

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'fu: ' }),
            new TextRun({
              text: 'Tensión última a tracción del tornillo.',
            }),
          ],
        }),
      );

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'As: ' }),
            new TextRun({
              text: 'Área resistente a tracción del tornillo.',
            }),
          ],
        }),
      );

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'γMb: ' }),
            new TextRun({
              text: `Coeficiente parcial de seguridad de los tornillos (${fmtDec(
                gammaMb,
                2,
              )})`,
            }),
          ],
        }),
      );

      out.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'N: ' }),
            new TextRun({
              text: 'Número de tornillos empleados en la sujeción.',
            }),
          ],
        }),
      );

      out.push(new Paragraph({ text: '' }));

      const conjuntoTraccionValido = esfuerzoMaximoTraccionN > fuerzaFrenadoN;

      out.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: 'Sustituyendo los valores en las anteriores expresiones, obtenemos:',
            }),
          ],
        }),
      );

      out.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: 'En la primera fórmula:',
            }),
          ],
        }),
      );

      out.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `Ft(máx)= ${fmtDec(esfuerzoMaximoTraccionN, 1)} N`,
              bold: true,
              italics: true,
            }),
          ],
        }),
      );

      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: 'Al ser los esfuerzos tracción máximos superiores a la fuerza de diseño, el conjunto de tornillos es ',
            }),
            new TextRun({
              text: conjuntoTraccionValido ? 'VALIDO.' : 'NO VÁLIDO.',
              bold: true,
            }),
          ],
        }),
      );

      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      // ===== APARTADO 2.x.3 CARGA VERTICAL =====
      const cargaVerticalKg = Number(sKg ?? 0);
      const fuerzaVerticalN = cargaVerticalKg * 9.81;

      const esfuerzoMaximoCortanteN =
        ((0.6 * resistenciaTraccionMin * seccionResistente) / gammaMb) *
        numeroTornillos;

      const conjuntoCortanteValido = esfuerzoMaximoCortanteN > fuerzaVerticalN;

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `2.${numero}.3 Cálculo sistema enganche debido a la carga vertical`,
              bold: true,
            }),
          ],
        }),
      );

      out.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: 'Para la realización de estos cálculos partiremos de la determinación de la fuerza que han de soportar los sistemas de fijación en una superficie expuesta como en nuestro caso.',
            }),
          ],
        }),
      );

      out.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: `En este punto se pretende demostrar que el sistema es capaz de soportar una fuerza a cortante de ${fmtInt(cargaVerticalKg)}Kg.`,
            }),
          ],
        }),
      );

      out.push(
        new Paragraph({
          indent: { left: 700 },
          children: [new TextRun({ text: 'Características:' })],
        }),
      );

      out.push(
        makeBorderlessTable(
          [
            [
              'Fuerza a soportar:',
              `${fmtInt(cargaVerticalKg)} Kg = ${fmtDec(fuerzaVerticalN, 1)} N`,
            ],
          ],
          66,
        ),
      );

      out.push(
        new Paragraph({
          indent: { left: 700 },
          children: [new TextRun({ text: 'Sujeción:' })],
        }),
      );

      out.push(
        makeBorderlessTable(
          [
            ['Nº de tornillos', fmtInt(numeroTornillos)],
            ['Métrica', fmtInt(metrica)],
            ['Calidad', calidadTexto],
            ['Sección resistente', `${fmtInt(seccionResistente)} mm2`],
            [
              'Resistencia a tracción Mín:',
              `${fmtDec(resistenciaTraccionMin, 2)} Kg/mm2`,
            ],
          ],
          66,
        ),
      );

      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'Fv(máx) = (0,6 * fu * As / γMb) * N',
              italics: true,
            }),
          ],
        }),
      );

      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `Fv(máx)= ${fmtDec(esfuerzoMaximoCortanteN, 1)} N`,
              bold: true,
              italics: true,
            }),
          ],
        }),
      );

      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: 'Al ser los esfuerzos cortantes máximos superiores a la fuerza de diseño, el conjunto de tornillos es ',
            }),
            new TextRun({
              text: conjuntoCortanteValido ? 'VALIDO' : 'NO VÁLIDO',
              bold: true,
            }),
          ],
        }),
      );

      out.push(new Paragraph({ text: '' }));

      contador2 = contador2 + 1;
    }

    const antiempotramiento2 = modificaciones.find(
      (m) => m.nombre === 'ANTIEMPOTRAMIENTO' && m.seleccionado,
    );

    if (antiempotramiento2) {
      const BORDE_NEGRO = {
        style: BorderStyle.SINGLE,
        size: 4,
        color: '000000',
      };

      const BORDES_TABLA = {
        top: BORDE_NEGRO,
        bottom: BORDE_NEGRO,
        left: BORDE_NEGRO,
        right: BORDE_NEGRO,
        insideHorizontal: BORDE_NEGRO,
        insideVertical: BORDE_NEGRO,
      };

      const BORDES_CELDA = {
        top: BORDE_NEGRO,
        bottom: BORDE_NEGRO,
        left: BORDE_NEGRO,
        right: BORDE_NEGRO,
      };

      const mmtaKgAnti = Number(
        antiempotramiento2.pesoMMTAAntiempotramiento ?? 0,
      );

      const fuerzaImpactoKg = Number(mmtaKgAnti / 2);

      const fuerzaImpactoN = fuerzaImpactoKg * 9.81;

      const pesoPiezaKgAnti = Number(
        antiempotramiento2.pesoPiezaKgAntiempotramiento ?? 0,
      );

      const pesoPiezaNAnti = pesoPiezaKgAnti * 9.81;

      const sumaFuerzasAntiN = pesoPiezaNAnti + fuerzaImpactoN;

      const numeroTornillosAnti = Number(
        antiempotramiento2.nTornillosAntiempotramiento ??
          antiempotramiento2.nTornillos ??
          4,
      );

      const metricaAnti = Number(
        antiempotramiento2.metricaAntiempotramiento ??
          antiempotramiento2.metrica ??
          16,
      );

      const calidadAnti =
        'ISO ' +
        (antiempotramiento2.calidadTornilloAntiempotramiento?.toString() ??
          '8.8');

      const seccionResistenteAnti = Number(
        antiempotramiento2.seccionResistenteAsAntiempotramiento ?? 157,
      );

      const resistenciaTraccionMinAnti = Number(
        antiempotramiento2.resTraccionMinTornillo88Kgmm2Antiempotramiento ?? 80,
      );

      const gammaMbAnti = 1.25;

      const fuerzaDisenoAntiN = sumaFuerzasAntiN;

      const fuerzaMaximaTraccionAntiN =
        ((0.9 * resistenciaTraccionMinAnti * seccionResistenteAnti) /
          gammaMbAnti) *
        numeroTornillosAnti;

      const fuerzaMaximaCortanteAntiN =
        ((0.5 * resistenciaTraccionMinAnti * seccionResistenteAnti) /
          gammaMbAnti) *
        numeroTornillosAnti;

      const comprobacionAnti =
        fuerzaDisenoAntiN / fuerzaMaximaCortanteAntiN +
        fuerzaDisenoAntiN / (1.4 * fuerzaMaximaTraccionAntiN);

      const esValidoAnti = comprobacionAnti <= 1;

      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: `2.${contador2} CÁLCULOS DE RESISTENCIA A IMPACTOS`,
              color: '000000',
              bold: true,
            }),
          ],
        }),
      );

      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `2.${contador2}.1 Barra antiempotramiento`,
              bold: true,
            }),
          ],
        }),
      );

      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: 'Para realizar el cálculo de la resistencia a impactos de la barra antiempotramiento trasera se tomarán los siguientes valores característicos',
            }),
          ],
        }),
      );

      out.push(
        new Paragraph({
          indent: { left: 700 },
          children: [new TextRun({ text: 'Características:' })],
        }),
      );

      out.push(
        makeBorderlessTable(
          [
            [
              'Fuerza a soportar:',
              `MMTA/2 = ${fmtInt(fuerzaImpactoKg)} Kg = ${fmtDec(
                fuerzaImpactoN,
                1,
              )} N`,
            ],
          ],
          66,
        ),
      );

      out.push(
        new Paragraph({
          indent: { left: 700 },
          children: [new TextRun({ text: 'Sujeción:' })],
        }),
      );

      out.push(
        makeBorderlessTable(
          [
            ['Nº de tornillos', fmtInt(numeroTornillosAnti)],
            ['Métrica', fmtInt(metricaAnti)],
            ['Calidad', calidadAnti],
            ['Sección resistente', `${fmtInt(seccionResistenteAnti)} mm2`],
            [
              'Resistencia a tracción Mín:',
              `${fmtDec(resistenciaTraccionMinAnti, 2)} Kg/mm2`,
            ],
          ],
          66,
        ),
      );

      out.push(new Paragraph({ text: '' }));

      const tablaFuerzasImpactoAnti = new Table({
        width: { size: 56, type: WidthType.PERCENTAGE },
        borders: BORDES_TABLA,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 3,
                borders: BORDES_CELDA,
                margins: CELL_MARGINS,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'FUERZAS QUE ACTUAN SOBRE LA PIEZA (N)',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: BORDES_CELDA,
                margins: CELL_MARGINS,
                shading: { type: ShadingType.CLEAR, fill: 'D9D9D9' },
                width: { size: 18, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: 'Peso' })],
                  }),
                ],
              }),
              new TableCell({
                borders: BORDES_CELDA,
                margins: CELL_MARGINS,
                shading: { type: ShadingType.CLEAR, fill: 'D9D9D9' },
                width: { size: 42, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: 'Fuerza del  impacto' })],
                  }),
                ],
              }),
              new TableCell({
                borders: BORDES_CELDA,
                margins: CELL_MARGINS,
                shading: { type: ShadingType.CLEAR, fill: 'D9D9D9' },
                width: { size: 40, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: 'Suma de fuerzas' })],
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: BORDES_CELDA,
                margins: CELL_MARGINS,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({ text: fmtDec(pesoPiezaNAnti, 2) }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                borders: BORDES_CELDA,
                margins: CELL_MARGINS,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({ text: fmtDec(fuerzaImpactoN, 2) }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                borders: BORDES_CELDA,
                margins: CELL_MARGINS,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({ text: fmtDec(sumaFuerzasAntiN, 2) }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      out.push(tablaFuerzasImpactoAnti);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      const tablaComprobacionAntiempotramiento = new Table({
        width: { size: 72, type: WidthType.PERCENTAGE },
        borders: BORDES_TABLA,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: BORDES_CELDA,
                verticalAlign: VerticalAlign.CENTER,
                margins: CELL_MARGINS,
                shading: { type: ShadingType.CLEAR, fill: 'D9D9D9' },
                width: { size: 28, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'La fuerza de diseño soportada por los anclajes (N)',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                borders: BORDES_CELDA,
                verticalAlign: VerticalAlign.CENTER,
                margins: CELL_MARGINS,
                shading: { type: ShadingType.CLEAR, fill: 'D9D9D9' },
                width: { size: 20, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'Fuerza máxima que soportan los tornillos a traccion (N)',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                borders: BORDES_CELDA,
                verticalAlign: VerticalAlign.CENTER,
                margins: CELL_MARGINS,
                shading: { type: ShadingType.CLEAR, fill: 'D9D9D9' },
                width: { size: 24, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'Fuerza máxima que soportan los tornillos a cortante (N)',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                borders: BORDES_CELDA,
                verticalAlign: VerticalAlign.CENTER,
                margins: CELL_MARGINS,
                shading: { type: ShadingType.CLEAR, fill: 'D9D9D9' },
                width: { size: 12, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'comprobación <=1',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: BORDES_CELDA,
                verticalAlign: VerticalAlign.CENTER,
                margins: CELL_MARGINS,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: fmtDec(fuerzaDisenoAntiN, 2),
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                borders: BORDES_CELDA,
                verticalAlign: VerticalAlign.CENTER,
                margins: CELL_MARGINS,
                shading: { type: ShadingType.CLEAR, fill: '00B050' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: fmtDec(fuerzaMaximaTraccionAntiN, 1),
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                borders: BORDES_CELDA,
                verticalAlign: VerticalAlign.CENTER,
                margins: CELL_MARGINS,
                shading: { type: ShadingType.CLEAR, fill: '00B050' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: fmtDec(fuerzaMaximaCortanteAntiN, 2),
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                borders: BORDES_CELDA,
                verticalAlign: VerticalAlign.CENTER,
                margins: CELL_MARGINS,
                shading: {
                  type: ShadingType.CLEAR,
                  fill: esValidoAnti ? '00B050' : 'FF0000',
                },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: fmtDec(comprobacionAnti, 3),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      out.push(tablaComprobacionAntiempotramiento);
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: 'Al ser la comprobación inferior o igual a 1, el conjunto de tornillos es ',
            }),
            new TextRun({
              text: esValidoAnti ? 'VÁLIDO.' : 'NO VÁLIDO.',
              bold: true,
            }),
          ],
        }),
      );

      out.push(new Paragraph({ text: '' }));
    }

    // Final
    out.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Las reformas realizadas en el vehículo no afectan a la seguridad activa, ni a la seguridad pasiva del vehículo ni tampoco afectan sobre el medio ambiente.',
            italics: true,
            bold: true,
            underline: { type: UnderlineType.SINGLE, color: '000000' },
          }),
        ],
      }),
    );

    out.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new ImageRun({
            data: imageBuffer5,
            transformation: { width: 170, height: 220 },
            type: 'png',
          }),
        ],
      }),
    );
  } else {
    const mobil = modificaciones.find(
      (m) =>
        m.nombre === 'MOBILIARIO INTERIOR VEHÍCULO' &&
        m.seleccionado &&
        data.tipoVehiculo === 'camper',
    );
    if (mobil) {
      // 1) Título centrado
      out.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: '2.1' + ' Cálculo de esfuerzos en sistemas de fijación',
              bold: true,
            }),
          ],
        }),
      );

      let Tr = 0.6 * data.mmaDespues;

      // 2) Tabla: DATOS DE PARTIDA
      const tablaDatosPartida = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          // Encabezado
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                columnSpan: 2,
                margins: CELL_MARGINS,
                verticalAlign: VerticalAlign.CENTER,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: 'DATOS DE PARTIDA' })],
                  }),
                ],
              }),
            ],
          }),
          // Filas de datos
          ...[
            ['M.T.M.A. (Kg)', data.mmaDespues.toFixed(2).toString() ?? '---'],
            [
              'Velocidad máxima (Km/h)',
              data.velocidadMaxima.toFixed(2).toString() ?? '---',
            ],
            ['Coeficiente de rozamiento', '0.6'],
            ['Aceleración de la gravedad (m/s²)', '9.8'],
            ['Deceleración ar = μ * g (m/s²)', '5.88'],
            ['Tr = μ * Mt (Kg)', Tr.toFixed(2).toString() ?? '---'],
          ].map(
            ([desc, val]) =>
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    margins: CELL_MARGINS,
                    verticalAlign: VerticalAlign.CENTER,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: desc })],
                      }),
                    ],
                  }),
                  new TableCell({
                    margins: CELL_MARGINS,
                    verticalAlign: VerticalAlign.CENTER,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: val })],
                      }),
                    ],
                  }),
                ],
              }),
          ),
        ],
      });
      out.push(tablaDatosPartida);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      // 3) Tabla: ESFUERZOS LONGITUDINALES vs ELEMENTOS INSTALADOS
      function generarTablaLongitudinales(data: any): Table {
        const muebles: {
          desc: string;
          peso: string;
          medidas: string;
          tornillos: number;
        }[] = [];

        const modMobiliario = data.modificaciones.find(
          (m: any) =>
            m.nombre === 'MOBILIARIO INTERIOR VEHÍCULO' && m.seleccionado,
        );

        if (modMobiliario) {
          // Muebles bajos
          (modMobiliario.mueblesBajo || []).forEach((m: any) => {
            muebles.push({
              desc: `Mueble bajo ${formatMedidasMueble(m.medidas)}`,
              peso: m.pesoMuebleBajo || '---',
              medidas: formatMedidasMueble(m.medidas),
              tornillos: m.tornillos || 0,
            });
          });

          // Muebles altos
          (modMobiliario.mueblesAlto || []).forEach((m: any) => {
            muebles.push({
              desc: `Mueble alto ${formatMedidasMueble(m.medidas)}`,
              peso: m.pesoMuebleAlto || '---',
              medidas: formatMedidasMueble(m.medidas),
              tornillos: m.tornillos || 0,
            });
          });

          // Aseos
          (modMobiliario.mueblesAseo || []).forEach((m: any) => {
            muebles.push({
              desc: `Aseo ${formatMedidasMueble(m.medidas)}`,
              peso: m.pesoMuebleAseo || '---',
              medidas: formatMedidasMueble(m.medidas),
              tornillos: m.tornillos || 0,
            });
          });
        }

        // Construcción de la tabla
        return new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            // Encabezado dinámico
            new TableRow({
              cantSplit: true,
              children: [
                'Nº',
                'Esfuerzos longitudinales',
                'Elemento instalado',
                'Peso (kg)',
              ].map(
                (h) =>
                  new TableCell({
                    margins: CELL_MARGINS,
                    verticalAlign: VerticalAlign.CENTER,
                    shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: h, bold: true })],
                      }),
                    ],
                  }),
              ),
            }),

            // Filas de muebles
            ...muebles.map(
              (mueble, idx) =>
                new TableRow({
                  cantSplit: true,
                  children: [
                    (idx + 1).toString(),
                    mueble.desc,
                    `Q${idx + 1}`,
                    mueble.peso,
                  ].map(
                    (val) =>
                      new TableCell({
                        margins: CELL_MARGINS,
                        verticalAlign: VerticalAlign.CENTER,
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: val })],
                          }),
                        ],
                      }),
                  ),
                }),
            ),
          ],
        });
      }

      out.push(generarTablaLongitudinales(data));
      out.push(new Paragraph({ text: '' }));

      // 4) Tabla: CARACTERÍSTICAS DE LOS TORNILLOS
      const tablaTornillos = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          // Encabezado
          new TableRow({
            cantSplit: true,
            children: ['Característica', '4', '5', '6', '8'].map(
              (h) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  verticalAlign: VerticalAlign.CENTER,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: h })],
                    }),
                  ],
                }),
            ),
          }),
          // Filas de propiedades
          ...[
            ['Diámetro nominal (mm)', '4', '5', '6', '8'],
            ['Paso de rosca (mm)', '0,7', '0,8', '1', '1,25'],
            ['Calidad', 'UM8.8', 'UM8.8', 'UM8.8', 'UM8.8'],
            ['Sección de tensión (mm²)', '3,24', '5,93', '7,97', '15,78'],
            ['Resistencia material (kg/mm²)', '64', '64', '64', '64'],
            ['Carga máx. límite elástico (Kg)', '207', '380', '510', '1010'],
            ['Par de apriete (mm)', '120', '290', '1100', '2600'],
            ['Radio sección sin roscar (mm)', '2', '2,5', '3', '4'],
            ['Radio efectivo (mm)', '1,015', '1,374', '1,593', '2,241'],
          ].map(
            (row) =>
              new TableRow({
                cantSplit: true,
                children: row.map(
                  (val) =>
                    new TableCell({
                      margins: CELL_MARGINS,
                      verticalAlign: VerticalAlign.CENTER,
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: val })],
                        }),
                      ],
                    }),
                ),
              }),
          ),
        ],
      });
      out.push(tablaTornillos);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      // 5) Tabla: NÚMERO DE TORNILLOS UTILIZADOS Y MÉTRICA
      function generarTablaNumTornillos(data: any): Table {
        const modMobiliario = data.modificaciones.find(
          (m: any) =>
            m.nombre === 'MOBILIARIO INTERIOR VEHÍCULO' && m.seleccionado,
        );

        if (!modMobiliario) {
          return new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph('Sin mobiliario seleccionado')],
                  }),
                ],
              }),
            ],
          });
        }

        const diametroSel = modMobiliario.diametroTornilloSeleccionado;

        const muebles: { desc: string; cantidad: string }[] = [];

        // Muebles bajos
        (modMobiliario.mueblesBajo || []).forEach((m: any) => {
          muebles.push({
            desc: `Mueble bajo ${formatMedidasMueble(m.medidas)}`,
            cantidad: m.tornillosMuebleBajo || '0',
          });
        });

        // Muebles altos
        (modMobiliario.mueblesAlto || []).forEach((m: any) => {
          muebles.push({
            desc: `Mueble alto ${formatMedidasMueble(m.medidas)}`,
            cantidad: m.tornillosMuebleAlto || '0',
          });
        });

        // Aseos
        (modMobiliario.mueblesAseo || []).forEach((m: any) => {
          muebles.push({
            desc: `Aseo ${formatMedidasMueble(m.medidas)}`,
            cantidad: m.tornillosMuebleAseo || '0',
          });
        });

        // Encabezado
        const header = new TableRow({
          cantSplit: true,
          children: [
            'Componente / Diámetro tornillo (mm)',
            '4',
            '5',
            '6',
            '8',
            'Total',
          ].map(
            (h) =>
              new TableCell({
                margins: CELL_MARGINS,
                verticalAlign: VerticalAlign.CENTER,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: h, bold: true })],
                  }),
                ],
              }),
          ),
        });

        // Filas dinámicas
        const filas = muebles.map((mueble) => {
          const cols = ['', '', '', '', ''];
          const idx = ['4', '5', '6', '8'].indexOf(String(diametroSel));
          if (idx !== -1) {
            cols[idx] = mueble.cantidad;
          }
          cols[4] = mueble.cantidad; // total siempre igual

          return new TableRow({
            cantSplit: true,
            children: [mueble.desc, ...cols].map(
              (val) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: val })],
                    }),
                  ],
                }),
            ),
          });
        });

        return new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [header, ...filas],
        });
      }

      out.push(generarTablaNumTornillos(data));
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      function generarTablaPropsTornillo(data: any): Table {
        const modMobiliario = data.modificaciones.find(
          (m: any) =>
            m.nombre === 'MOBILIARIO INTERIOR VEHÍCULO' && m.seleccionado,
        );

        if (!modMobiliario || !modMobiliario.diametroTornilloSeleccionado) {
          return new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph('Sin tornillo seleccionado')],
                  }),
                ],
              }),
            ],
          });
        }

        const diametroSel = modMobiliario.diametroTornilloSeleccionado;
        const areaSel = modMobiliario.areaResistenteTornilloSeleccionado;

        // Aquí defines las propiedades de la tabla
        const propiedades: [string, string][] = [
          ['Calidad', 'M8.8'],
          ['Resistencia a cortadura (Kg)', '227,8'],
          ['Tensión de rotura σr ≥ (Kg/mm²)', '80'],
          ['Tensión límite de elasticidad σe ≥ (Kg/mm²)', '65'],
          ['Diámetro del tornillo (mm)', String(diametroSel)],
          ['Área resistente Ar (mm²)', String(areaSel)],
          ['K', '0,6'],
          ['γMb = Coeficiente de seguridad', '1,25'],
        ];

        const filas = propiedades.map(
          ([desc, val]) =>
            new TableRow({
              cantSplit: true,
              children: [desc, val].map(
                (text) =>
                  new TableCell({
                    margins: CELL_MARGINS,
                    verticalAlign: VerticalAlign.CENTER,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text })],
                      }),
                    ],
                  }),
              ),
            }),
        );

        return new Table({
          width: { size: 50, type: WidthType.PERCENTAGE },
          rows: filas,
        });
      }

      // y luego en tu out:
      out.push(generarTablaPropsTornillo(data));

      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      // 8) Tabla: FUERZAS DE INERCIA y COEF. SEGURIDAD por componente
      function generarTablaFuerzaInercia(data: any): Table {
        const modMobiliario = data.modificaciones.find(
          (m: any) =>
            m.nombre === 'MOBILIARIO INTERIOR VEHÍCULO' && m.seleccionado,
        );

        if (!modMobiliario) {
          return new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph('Sin mobiliario seleccionado')],
                  }),
                ],
              }),
            ],
          });
        }

        const areaResistente =
          modMobiliario.areaResistenteTornilloSeleccionado || 0;

        const muebles: {
          desc: string;
          peso: number;
          tornillos: number;
        }[] = [];

        // Muebles bajos
        (modMobiliario.mueblesBajo || []).forEach((m: any) => {
          muebles.push({
            desc: `Mueble bajo ${formatMedidasMueble(m.medidas)}`,
            peso: parseFloat(m.pesoMuebleBajo) || 0,
            tornillos: parseInt(m.tornillosMuebleBajo) || 0,
          });
        });

        // Muebles altos
        (modMobiliario.mueblesAlto || []).forEach((m: any) => {
          muebles.push({
            desc: `Mueble alto ${formatMedidasMueble(m.medidas)}`,
            peso: parseFloat(m.pesoMuebleAlto) || 0,
            tornillos: parseInt(m.tornillosMuebleAlto) || 0,
          });
        });

        // Aseos
        (modMobiliario.mueblesAseo || []).forEach((m: any) => {
          muebles.push({
            desc: `Aseo ${formatMedidasMueble(m.medidas)}`,
            peso: parseFloat(m.pesoMuebleAseo) || 0,
            tornillos: parseInt(m.tornillosMuebleAseo) || 0,
          });
        });

        // Encabezado
        const header = new TableRow({
          cantSplit: true,
          children: [
            ' ',
            ' ',
            ' ',
            'Fuerza de Inercia I (Kg)',
            'Resistencia a cortante máx. Rm (Kg)',
            'Coef. seguridad λ > 1,25',
          ].map(
            (h) =>
              new TableCell({
                margins: CELL_MARGINS,
                verticalAlign: VerticalAlign.CENTER,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: h, bold: true })],
                  }),
                ],
              }),
          ),
        });

        // Filas dinámicas
        const filas = muebles.map((mueble, idx) => {
          const fuerzaInercia = (mueble.peso * 5.88) / 9.8;
          const resistenciaCortante =
            (0.6 * 80 * areaResistente * mueble.tornillos) / 1.25;
          const coefSeguridad = resistenciaCortante / fuerzaInercia;

          const valores = [
            (idx + 1).toString(),
            mueble.desc,
            'Q' + (idx + 1).toString(),
            fuerzaInercia.toFixed(2),
            resistenciaCortante.toFixed(2),
            coefSeguridad.toFixed(2),
          ];

          return new TableRow({
            cantSplit: true,
            children: valores.map(
              (val) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: val })],
                    }),
                  ],
                }),
            ),
          });
        });

        return new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [header, ...filas],
        });
      }

      // Y lo añades al out:
      out.push(generarTablaFuerzaInercia(data));

      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      // 9) Tabla: ESFUERZOS VERTICALES
      function generarTablaVerticales(data: any): Table {
        const modMobiliario = data.modificaciones.find(
          (m: any) =>
            m.nombre === 'MOBILIARIO INTERIOR VEHÍCULO' && m.seleccionado,
        );

        if (!modMobiliario) {
          return new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph('Sin mobiliario seleccionado')],
                  }),
                ],
              }),
            ],
          });
        }

        const resistenciaCortadura = 227.8;

        // 🔹 Solo muebles altos
        const muebles: {
          desc: string;
          peso: number;
          tornillos: number;
        }[] = [];

        (modMobiliario.mueblesAlto || []).forEach((m: any) => {
          muebles.push({
            desc: `Mueble alto ${formatMedidasMueble(m.medidas)}`,
            peso: parseFloat(m.pesoMuebleAlto) || 0,
            tornillos: parseInt(m.tornillosMuebleAlto) || 0,
          });
        });

        // Encabezado
        const header = new TableRow({
          cantSplit: true,
          children: [
            'Nº',
            'Elemento instalado',
            'Código',
            'Peso (kg)',
            'Número de tornillos',
            'Peso soportado por tornillo',
            'Resistencia a la cortadura (Kg)',
            'Resultado (Kg)',
          ].map(
            (h) =>
              new TableCell({
                margins: CELL_MARGINS,
                verticalAlign: VerticalAlign.CENTER,
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: h, bold: true })],
                  }),
                ],
              }),
          ),
        });

        // Filas dinámicas solo de muebles altos
        const filas = muebles.map((mueble, idx) => {
          const pesoPorTornillo =
            mueble.tornillos > 0 ? mueble.peso / mueble.tornillos : 0;
          const resultado = resistenciaCortadura / pesoPorTornillo;

          const valores = [
            (idx + 1).toString(), // Nº
            mueble.desc, // Descripción
            `Q${idx + 1}`, // Código
            mueble.peso.toFixed(2), // Peso (kg)
            mueble.tornillos.toString(), // Nº tornillos
            pesoPorTornillo.toFixed(2), // Peso por tornillo
            resistenciaCortadura.toFixed(2).toString(), // Resistencia cortadura
            resultado.toFixed(2), // Resultado
          ];

          return new TableRow({
            cantSplit: true,
            children: valores.map(
              (val) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: val })],
                    }),
                  ],
                }),
            ),
          });
        });

        return new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [header, ...filas],
        });
      }

      // Y en el out:
      out.push(generarTablaVerticales(data));
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      out.push(
        new Paragraph({
          text: 'Conclusión: Después de haber realizado los cálculos correspondientes, podemos asegurar que el sistema de anclajes elegidos son aptos para garantizar la estabilidad de las reformas instaladas.',
        }),
      );

      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Las reformas realizadas en el vehículo no afectan a la seguridad activa, ni a la seguridad pasiva del vehículo ni tampoco afectan sobre el medio ambiente.',
              bold: true,
              underline: { type: UnderlineType.SINGLE },
            }),
          ],
        }),
      );
      out.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new ImageRun({
              data: imageBuffer5,
              transformation: { width: 170, height: 220 },
              type: 'png',
            }),
          ],
        }),
      );
    }
  }

  return out;
}

function cellCentro(text: string): TableCell {
  return new TableCell({
    verticalAlign: VerticalAlign.CENTER,
    margins: CELL_MARGINS,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun(text)],
      }),
    ],
  });
}

function rowVacia(span: number): TableRow {
  return new TableRow({
    children: Array(span)
      .fill(null)
      .map(() => new TableCell({ children: [] })),
  });
}
