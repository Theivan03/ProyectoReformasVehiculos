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

export async function buildCalculos(
  modificaciones: Modificacion[],
  data: any,
  memoria?: boolean
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
      })
    );

    let contador = 1;

    const aletines = modificaciones.find(
      (m) =>
        m.nombre === 'ALETINES Y SOBREALETINES' &&
        m.seleccionado &&
        m.detalle?.aletines
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
        })
      );

      contador++;

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
              aletines.coefAerodinamicoCwAletines?.toString() ?? '---',
            ],
            [
              'A =área de la pieza (m²)',
              aletines.superficieFrontalM2Aletines?.toString() ?? '---',
            ],
            [
              'ρ (densidad del aire (Kg/m³)',
              aletines.densidadAireKgM3Aletines?.toString() ?? '---',
            ],
            [
              'V² = velocidad del aire 140Km/h (m/s)',
              aletines.velocidadAireV2msAletines?.toString() ?? '---',
            ],
            [
              'R (radio de curva) m',
              aletines.radioCurvaRAletines?.toString() ?? '---',
            ],
            [
              'K (coeficiente de seguridad)',
              aletines.coefSeguridadKAletines?.toString() ?? '---',
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
              })
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
                })
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
                })
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              peso.toString() ?? '---',
              fuerzafrenado.toString() ?? '---',
              resistenciaaerodinamica.toString() ?? '---',
              fuerzacentrifuga.toString() ?? '---',
              sumadelasfuerzas.toString() ?? '---',
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
                })
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
          // Header row, con texto centrado
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
                })
            ),
          }),
          // Data row: solo índices > 0 pintan verde, todos centrados
          new TableRow({
            cantSplit: true,
            children: [
              fuerzadediseno.toString() ?? '---',
              fuerzamaximatornillostraccion.toString() ?? '---',
              fuerzamaximatornilloscortante.toString() ?? '---',
              comprobacion.toString() ?? '---',
            ].map(
              (v, i) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  // solo las celdas 1,2,3 llevan el fondo verde
                  shading:
                    i === 0
                      ? undefined
                      : { type: ShadingType.CLEAR, fill: '00B050' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: v })],
                    }),
                  ],
                })
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
      (m) => m.nombre === 'SNORKEL' && m.seleccionado
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
        })
      );

      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      contador++;

      const superficiefrontal =
        data.anchuraPiezaMSnorkel * data.alturaPiezaMSnorkel;

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
              snorkel.pesoPiezaKgSnorkel?.toString() ?? '---',
              'nº tornillos',
              snorkel.nTornillosSnorkel?.toString() ?? '---',
            ],
            [
              'Anchura de la pieza en m',
              snorkel.anchuraPiezaMSnorkel?.toString() ?? '---',
              'Métrica',
              snorkel.metricaSnorkel?.toString() ?? '---',
            ],
            [
              'Altura de la pieza en m',
              snorkel.alturaPiezaMSnorkel?.toString() ?? '---',
              'Calidad',
              snorkel.calidadTornilloSnorkel?.toString() ?? '---',
            ],
            [
              'Superficie frontal m²',
              superficiefrontal.toString() ?? '---',
              'As (Sección resistente)',
              snorkel.seccionResistenteAsSnorkel?.toString() ?? '---',
            ],
            [
              'Coef. aerodinámico',
              snorkel.cwCoefAerodinamicoSnorkel?.toString() ?? '---',
              'Res. Tracción Mín tornillo 8,8 (Kg/mm2)',
              snorkel.resTraccionMinTornillo88Kgmm2Snorkel?.toString() ?? '---',
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
              })
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
              snorkel.cwCoefAerodinamicoSnorkel?.toString() ?? '---',
            ],
            ['A =área de la pieza (m²)', superficiefrontal.toString() ?? '---'],
            [
              'ρ (densidad del aire (Kg/m³))',
              snorkel.densidadAireKgM3Snorkel?.toString() ?? '---',
            ],
            [
              'V² = velocidad del aire 140Km/h (m/s)',
              snorkel.velocidadAireV2msSnorkel?.toString() ?? '---',
            ],
            [
              'R (radio de curva) m',
              snorkel.curvaturaSnorkel?.toString() ?? '---',
            ],
            [
              'K (coeficiente de seguridad)',
              snorkel.coefSeguridadKSnorkel?.toString() ?? '---',
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
              })
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
          (Number(snorkel.curvaturaSnorkel) || 1));
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
                })
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
                })
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              peso.toString() ?? '---',
              fuerzafrenado.toString() ?? '---',
              resistenciaaerodinamica.toString() ?? '---',
              fuerzacentrifuga.toString() ?? '---',
              sumadelasfuerzas.toString() ?? '---',
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
                })
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
                })
            ),
          }),

          new TableRow({
            cantSplit: true,
            children: [
              fuerzadediseno.toString() ?? '---',
              fuerzamaximatornillostraccion.toString() ?? '---',
              fuerzamaximatornilloscortante.toString() ?? '---',
              comprobacion.toString() ?? '---',
            ].map(
              (val, i) =>
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: CELL_MARGINS,
                  shading:
                    i === 0
                      ? undefined
                      : { type: ShadingType.CLEAR, fill: '00B050' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: val })],
                    }),
                  ],
                })
            ),
          }),
        ],
      });

      out.push(tablaComprobacion);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));
    }

    const cabrestante = modificaciones.find(
      (m) => m.nombre === 'CABRESTANTE' && m.seleccionado
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
        })
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
              cabrestante.capacidadCabrestanteKg?.toString() ?? '---',
            ],
            [
              'Diámetro de cada perno (cm)',
              cabrestante.diametroPernoCmCabrestante?.toString() ?? '---',
            ],
            [
              'Material del perno',
              cabrestante.materialPernoCabrestante ?? '---',
            ],
            [
              'Tensión mín., rotura cortante acero (Kg/cm²)',
              cabrestante.tensionMinCortanteKgCm2Cabrestante?.toString() ??
                '---',
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
              })
          ),
        ],
      });

      out.push(tablaMaterialCabrestante);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));

      let tensioncortante =
        (cabrestante.capacidadCabrestanteKg ?? 0) /
        (Math.PI *
          ((cabrestante.diametroPernoCmCabrestante ?? 0) / 2) *
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
              cabrestante.nPernosChasisCabrestante?.toString() ?? '---',
            ],
            [
              'Diámetro de cada perno',
              cabrestante.diametroPernoChasisMmCabrestante?.toString() ?? '---',
            ],
            [
              'Material del perno',
              cabrestante.materialPernoChasisCabrestante ?? '---',
            ],
            [
              'Tensión mín., rotura cortante acero',
              cabrestante.tensionMinCortanteChasisKgCm2Cabrestante?.toString() ??
                '---',
            ],
            [
              'Tensión cortante ejercida por el tiro del cabrestante sobre los pernos de unión a la estructura de soporte de éste (Kg/cm2)',
              tensioncortante.toFixed(2).toString() ?? '---',
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
              })
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
        })
      );
    }

    out.push(new Paragraph({ text: '' }));
    out.push(new Paragraph({ text: '' }));

    const soporteslucesespecificas = modificaciones.find(
      (m) =>
        m.nombre === 'SOPORTES PARA LUCES DE USO ESPECÍFICO' && m.seleccionado
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
        })
      );
      out.push(new Paragraph({ text: '' }));
      contador++;

      let superficiefrontal =
        data.anchuraPiezaMLucesEspecificas * data.alturaPiezaMLucesEspecificas;

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
              soporteslucesespecificas.pesoPiezaKgLucesEspecificas?.toString() ??
                '---',
              'nº tornillos',
              soporteslucesespecificas.nTornillosLucesEspecificas?.toString() ??
                '---',
            ],
            [
              'Anchura de la pieza en m',
              soporteslucesespecificas.anchuraPiezaMLucesEspecificas?.toString() ??
                '---',
              'Métrica',
              soporteslucesespecificas.metricaLucesEspecificas?.toString() ??
                '---',
            ],
            [
              'Altura de la pieza en m',
              soporteslucesespecificas.alturaPiezaMLucesEspecificas?.toString() ??
                '---',
              'Calidad',
              soporteslucesespecificas.calidadTornilloLucesEspecificas?.toString() ??
                '---',
            ],
            [
              'Superficie frontal m²',
              superficiefrontal.toString() ?? '---',
              'As (Sección resistente)',
              soporteslucesespecificas.seccionResistenteAsLucesEspecificas?.toString() ??
                '---',
            ],
            [
              'Coef. aerodinámico',
              soporteslucesespecificas.cwCoefAerodinamicoLucesEspecificas?.toString() ??
                '---',
              'Res. Tracción Mín tornillo 8,8 (Kg/mm2)',
              soporteslucesespecificas.resTraccionMinTornillo88Kgmm2LucesEspecificas?.toString() ??
                '---',
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
              })
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
              soporteslucesespecificas.cwCoefAerodinamicoLucesEspecificas?.toString() ??
                '---',
            ],
            ['A =área de la pieza (m²)', superficiefrontal.toString() ?? '---'],
            [
              'ρ (densidad del aire (Kg/m³))',
              soporteslucesespecificas.densidadAireKgM3LucesEspecificas?.toString() ??
                '---',
            ],
            [
              'V² = velocidad del aire 140Km/h (m/s)',
              soporteslucesespecificas.velocidadAireV2msLucesEspecificas?.toString() ??
                '---',
            ],
            [
              'R (radio de curva) m',
              soporteslucesespecificas.radioCurvaRLucesEspecificas?.toString() ??
                '---',
            ],
            [
              'K (coeficiente de seguridad)',
              soporteslucesespecificas.coefSeguridadKLucesEspecificas?.toString() ??
                '---',
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
              })
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
          (soporteslucesespecificas.radioCurvaRLucesEspecificas ?? 0));
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
                })
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              peso.toString() ?? '---',
              fuerzafrenado.toString() ?? '---',
              resistenciaaerodinamica.toString() ?? '---',
              fuerzacentrifuga.toString() ?? '---',
              sumadelasfuerzas.toString() ?? '---',
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
                })
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
                })
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              fuerzadediseno.toString() ?? '---',
              fuerzamaximatornillostraccion.toString() ?? '---',
              fuerzamaximatornilloscortante.toString() ?? '---',
              comprobacion.toString() ?? '---',
            ].map(
              (val) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: '00B050' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      text: val,
                    }),
                  ],
                })
            ),
          }),
        ],
      });
      out.push(tablaComprobacion);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));
    }

    const paradelante = modificaciones.find(
      (m) => m.nombre === 'PARAGOLPES DELANTERO' && m.seleccionado
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
        })
      );
      out.push(new Paragraph({ text: '' }));
      contador++;

      // 2) Tabla de características para presión del aire
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
              paradelante.cwCoefAerodinamicoParagolpesDelantero?.toString() ??
                '---',
            ],
            [
              'A =área de la pieza (m²)',
              paradelante.superficieFrontalM2ParagolpesDelantero?.toString() ??
                '---',
            ],
            [
              'ρ (densidad del aire (Kg/m³))',
              paradelante.densidadAireKgM3ParagolpesDelantero?.toString() ??
                '---',
            ],
            [
              'V² = velocidad del aire 140Km/h (m/s)',
              paradelante.velocidadAireV2msParagolpesDelantero?.toString() ??
                '---',
            ],
            [
              'R (radio de curva) m',
              paradelante.radioCurvaRParagolpesDelantero?.toString() ?? '---',
            ],
            [
              'K (coeficiente de seguridad)',
              paradelante.coefSeguridadKParagolpesDelantero?.toString() ??
                '---',
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
              })
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
        (paradelante.cwCoefAerodinamicoParagolpesDelantero ?? 0) *
        (paradelante.superficieFrontalM2ParagolpesDelantero ?? 0) *
        (paradelante.densidadAireKgM3ParagolpesDelantero ?? 0) *
        (paradelante.velocidadAireV2msParagolpesDelantero ?? 0) *
        (paradelante.velocidadAireV2msParagolpesDelantero ?? 0);
      let fuerzacentrifuga =
        (paradelante.pesoPiezaKgParagolpesDelantero ?? 0) *
        (((paradelante.velocidadAireV2msParagolpesDelantero ?? 0) *
          (paradelante.velocidadAireV2msParagolpesDelantero ?? 0)) /
          (paradelante.radioCurvaRParagolpesDelantero ?? 0));
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
                })
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              peso.toString() ?? '---',
              fuerzafrenado.toString() ?? '---',
              resistenciaaerodinamica.toString() ?? '---',
              fuerzacentrifuga.toString() ?? '---',
              sumadelasfuerzas.toString() ?? '---',
            ].map(
              (val) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  children: [new Paragraph(val)],
                })
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
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: heading })],
                    }),
                  ],
                })
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              fuerzadediseno.toString() ?? '---',
              fuerzamaximatornillostraccion.toString() ?? '---',
              fuerzamaximatornilloscortante.toString() ?? '---',
              comprobacion.toString() ?? '---',
            ].map(
              (val) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: '00B050' },
                  children: [new Paragraph(val)],
                })
            ),
          }),
        ],
      });
      out.push(tablaComprobacionParagolpes);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));
    }

    const paratras = modificaciones.find(
      (m) => m.nombre === 'PARAGOLPES TRASERO' && m.seleccionado
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
        })
      );
      out.push(new Paragraph({ text: '' }));
      contador++;

      let superficiefrontal =
        data.anchuraMParagolpesTrasero * data.alturaMParagolpesTrasero;

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
              paratras.pesoPiezaKgParagolpesTrasero?.toString() ?? '---',
              'nº tornillos',
              paratras.nTornillosParagolpesTrasero?.toString() ?? '---',
            ],
            [
              'Anchura de la pieza en m',
              paratras.anchuraMParagolpesTrasero?.toString() ?? '---',
              'Métrica',
              paratras.metricaParaTrasero?.toString() ?? '---',
            ],
            [
              'Altura de la pieza en m',
              paratras.alturaMParagolpesTrasero?.toString() ?? '---',
              'Calidad',
              paratras.calidadTornilloParagolpesTrasero?.toString() ?? '---',
            ],
            [
              'Superficie frontal m²',
              superficiefrontal.toString() ?? '---',
              'As (Sección resistente)',
              paratras.seccionResistenteAsParagolpesTrasero?.toString() ??
                '---',
            ],
            [
              'Coef. aerodinámico',
              paratras.coefAerodinamicoParagolpesTrasero?.toString() ?? '---',
              'Res. Tracción Mín tornillo 8,8 (Kg/mm2)',
              paratras.resTraccionMinTornillo88Kgmm2ParagolpesTrasero?.toString() ??
                '---',
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
              })
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
              paratras.coefAerodinamicoParagolpesTrasero?.toString() ?? '---',
            ],
            ['A =área de la pieza (m²)', superficiefrontal.toString() ?? '---'],
            [
              'ρ (densidad del aire (Kg/m³))',
              paratras.densidadAireKgM3ParagolpesTrasero?.toString() ?? '---',
            ],
            [
              'V² = velocidad del aire 140Km/h (m/s)',
              paratras.velocidadAireV2msParagolpesTrasero?.toString() ?? '---',
            ],
            [
              'R (radio de curva) m',
              paratras.radioCurvaRParagolpesTrasero?.toString() ?? '---',
            ],
            [
              'K (coeficiente de seguridad)',
              paratras.coefSeguridadKParagolpesTrasero?.toString() ?? '---',
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
              })
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
                })
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              peso.toString() ?? '---',
              fuerzafrenado.toString() ?? '---',
              resistenciaaerodinamica.toString() ?? '---',
              fuerzacentrifuga.toString() ?? '---',
              sumadelasfuerzas.toString() ?? '---',
            ].map(
              (val) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  children: [new Paragraph(val)],
                })
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
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: heading })],
                    }),
                  ],
                })
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              fuerzadediseno.toString() ?? '---',
              fuerzamaximatornillostraccion.toString() ?? '---',
              fuerzamaximatornilloscortante.toString() ?? '---',
              comprobacion.toString() ?? '---',
            ].map(
              (val) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: '00B050' },
                  children: [new Paragraph(val)],
                })
            ),
          }),
        ],
      });
      out.push(tablaComprobacionParagolpesTrasero);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));
    }

    const estribostaloneras = modificaciones.find(
      (m) => m.nombre === 'ESTRIBOS LATERALES O TALONERAS' && m.seleccionado
    );
    if (estribostaloneras) {
      // 1) Título dinámico
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '2.3.' + contador + ' Estribos laterales',
              bold: true,
            }),
          ],
        })
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
              estribostaloneras.pesoPiezaKgEstribos?.toString() ?? '---',
              'nº tornillos',
              estribostaloneras.nTornillosEstribos?.toString() ?? '---',
            ],
            [
              'Anchura de la pieza en m',
              estribostaloneras.anchuraMEstribos?.toString() ?? '---',
              'Métrica',
              estribostaloneras.metricaTalonera?.toString() ?? '---',
            ],
            [
              'Altura de la pieza en m',
              estribostaloneras.alturaMEstribos?.toString() ?? '---',
              'Calidad',
              estribostaloneras.calidadTornilloEstribos?.toString() ?? '---',
            ],
            [
              'Superficie frontal m²',
              superficiefrontal.toString() ?? '---',
              'As (Sección resistente)',
              estribostaloneras.seccionResistenteAsEstribos?.toString() ??
                '---',
            ],
            [
              'Coef. aerodinámico',
              estribostaloneras.coefAerodinamicoEstribos?.toString() ?? '---',
              'Res. Tracción Mín tornillo 8,8 (Kg/mm2)',
              estribostaloneras.resTraccionMinTornillo88Kgmm2Estribos?.toString() ??
                '---',
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
              })
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
              estribostaloneras.coefAerodinamicoEstribos?.toString() ?? '---',
            ],
            ['A =área de la pieza (m²)', superficiefrontal.toString() ?? '---'],
            [
              'ρ (densidad del aire (Kg/m³))',
              estribostaloneras.densidadAireKgM3Estribos?.toString() ?? '---',
            ],
            [
              'V² = velocidad del aire 140Km/h (m/s)',
              estribostaloneras.velocidadAireV2msEstribos?.toString() ?? '---',
            ],
            [
              'R (radio de curva) m',
              estribostaloneras.radioCurvaREstribos?.toString() ?? '---',
            ],
            [
              'K (coeficiente de seguridad)',
              estribostaloneras.coefSeguridadKEstribos?.toString() ?? '---',
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
              })
          ),
        ],
      });
      out.push(tablaAireEstribos);
      out.push(new Paragraph({ text: '' }));

      let peso = 9.81 * (estribostaloneras.pesoPiezaKgEstribos ?? 0);
      let fuerzafrenado = (estribostaloneras.pesoPiezaKgEstribos ?? 0) * 10;
      let resistenciaaerodinamica =
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
                })
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              peso.toString() ?? '---',
              fuerzafrenado.toString() ?? '---',
              resistenciaaerodinamica.toString() ?? '---',
              fuerzacentrifuga.toString() ?? '---',
              sumadelasfuerzas.toString() ?? '---',
            ].map(
              (val) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  children: [new Paragraph(val)],
                })
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
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: heading })],
                    }),
                  ],
                })
            ),
          }),
          new TableRow({
            cantSplit: true,
            children: [
              fuerzadediseno.toString() ?? '---',
              fuerzamaximatornillostraccion.toString() ?? '---',
              fuerzamaximatornilloscortante.toString() ?? '---',
              comprobacion.toString() ?? '---',
            ].map(
              (val) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: '00B050' },
                  children: [new Paragraph(val)],
                })
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
        data.tipoVehiculo === 'camper'
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
        })
      );
      contador++;

      let Tr = 0.6 * data.mmaAntes;

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
            ['M.T.M.A. (Kg)', data.mmaAntes.toString() ?? '---'],
            ['Velocidad máxima (Km/h)', '148'],
            ['Coeficiente de rozamiento', '0.6'],
            ['Aceleración de la gravedad (m/s²)', '9.8'],
            ['Deceleración ar = μ * g (m/s²)', '5.88'],
            ['Tr = μ * Mt (Kg)', Tr.toString() ?? '---'],
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
              })
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
          medidas: number;
          tornillos: number;
        }[] = [];

        const modMobiliario = data.modificaciones.find(
          (m: any) =>
            m.nombre === 'MOBILIARIO INTERIOR VEHÍCULO' && m.seleccionado
        );

        if (modMobiliario) {
          // Muebles bajos
          (modMobiliario.mueblesBajo || []).forEach((m: any) => {
            muebles.push({
              desc: `Mueble bajo ${m.medidas}`,
              peso: m.pesoMuebleBajo || '---',
              medidas: m.medidas || 0,
              tornillos: m.tornillos || 0,
            });
          });

          // Muebles altos
          (modMobiliario.mueblesAlto || []).forEach((m: any) => {
            muebles.push({
              desc: `Mueble alto ${m.medidas}`,
              peso: m.pesoMuebleAlto || '---',
              medidas: m.medidas || 0,
              tornillos: m.tornillos || 0,
            });
          });

          // Aseos
          (modMobiliario.mueblesAseo || []).forEach((m: any) => {
            muebles.push({
              desc: `Aseo ${m.medidas}`,
              peso: m.pesoMuebleAseo || '---',
              medidas: m.medidas || 0,
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
                  })
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
                      })
                  ),
                })
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
                })
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
                    })
                ),
              })
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
            m.nombre === 'MOBILIARIO INTERIOR VEHÍCULO' && m.seleccionado
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
            desc: `Mueble bajo ${m.medidas}`,
            cantidad: m.tornillosMuebleBajo || '0',
          });
        });

        // Muebles altos
        (modMobiliario.mueblesAlto || []).forEach((m: any) => {
          muebles.push({
            desc: `Mueble alto ${m.medidas}`,
            cantidad: m.tornillosMuebleAlto || '0',
          });
        });

        // Aseos
        (modMobiliario.mueblesAseo || []).forEach((m: any) => {
          muebles.push({
            desc: `Aseo ${m.medidas}`,
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
              })
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
                })
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
            m.nombre === 'MOBILIARIO INTERIOR VEHÍCULO' && m.seleccionado
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
                  })
              ),
            })
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
            m.nombre === 'MOBILIARIO INTERIOR VEHÍCULO' && m.seleccionado
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
            desc: `Mueble bajo ${m.medidas}`,
            peso: parseFloat(m.pesoMuebleBajo) || 0,
            tornillos: parseInt(m.tornillosMuebleBajo) || 0,
          });
        });

        // Muebles altos
        (modMobiliario.mueblesAlto || []).forEach((m: any) => {
          muebles.push({
            desc: `Mueble alto ${m.medidas}`,
            peso: parseFloat(m.pesoMuebleAlto) || 0,
            tornillos: parseInt(m.tornillosMuebleAlto) || 0,
          });
        });

        // Aseos
        (modMobiliario.mueblesAseo || []).forEach((m: any) => {
          muebles.push({
            desc: `Aseo ${m.medidas}`,
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
              })
          ),
        });

        // Filas dinámicas
        const filas = muebles.map((mueble, idx) => {
          const fuerzaInercia = mueble.peso * (9.8 / 5.88);
          const resistenciaCortante =
            (0.6 * 80 * areaResistente * mueble.tornillos) / 1.25;
          const coefSeguridad = resistenciaCortante / fuerzaInercia;

          const valores = [
            (idx + 1).toString(),
            mueble.desc,
            mueble.peso.toFixed(2),
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
                })
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
            m.nombre === 'MOBILIARIO INTERIOR VEHÍCULO' && m.seleccionado
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
            desc: `Mueble alto ${m.medidas}`,
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
              })
          ),
        });

        // Filas dinámicas solo de muebles altos
        const filas = muebles.map((mueble, idx) => {
          const pesoPorTornillo =
            mueble.tornillos > 0 ? mueble.peso / mueble.tornillos : 0;
          const resultado =
            resistenciaCortadura > 0
              ? pesoPorTornillo / resistenciaCortadura
              : 0;

          const valores = [
            (idx + 1).toString(), // Nº
            mueble.desc, // Descripción
            `Q${idx + 1}`, // Código
            mueble.peso.toFixed(2), // Peso (kg)
            mueble.tornillos.toString(), // Nº tornillos
            pesoPorTornillo.toFixed(2), // Peso por tornillo
            resistenciaCortadura.toString(), // Resistencia cortadura
            resultado.toFixed(4), // Resultado
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
                })
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
      })
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
      })
    );

    out.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Como podemos observar, podemos certificar que quedan libres las áreas de refrigeración del vehículo pudiendo afirmar que no habrá ningún problema en el rendimiento termodinámico del vehículo.',
          }),
        ],
      })
    );

    const mod = modificaciones.find(
      (m) =>
        m.nombre ===
          'TODA LA CASUÍSTICA DE MUELLES, BALLESTAS Y AMORTIGUADORES QUE SE PUEDEN DAR' &&
        m.seleccionado
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
        })
      );

      contador = 1;

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
          })
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
              ['MTMA/MMA (Kg)', data.mmaDespues.toString() ?? '---'],
              ['MTMA/MMA eje 1', data.mmaEje1Despues.toString() ?? '---'],
              ['MTMA/MMA eje 2', data.mmaEje2Despues.toString() ?? '---'],
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
                })
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
                  })
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
                      })
                  ),
                })
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
          (Math.pow(mod.diametroEspiraDelanteroRef ?? 0, 4) * 8104 * 1000) /
          (8 *
            Math.pow(diametromedio, 3) *
            (mod.numeroEspirasDelanteroRef ?? 0)) /
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
          (((mod.diametroEspiraDelanteroSinRef ?? 0) / 1000) ** 4 * 79500, 24) /
          (8 *
            (diametromedio / 1000) ** 3 *
            (mod.numeroEspirasDelanteroSinRef ?? 0)) /
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
                  })
              ),
            }),
            // Filas
            ...[
              [
                'Diámetro exterior (Dext)',
                mod.diametroExteriorDelanteroRef?.toString() ?? '---',
              ],
              [
                'Diámetro interior (Dint)',
                diametrointerior.toString() ?? '---',
              ],
              ['Diámetro medio (Dm)', diametromedio.toString() ?? '---'],
              [
                'Diámetro de espira (De)',
                mod.diametroEspiraDelanteroRef?.toString() ?? '---',
              ],
              [
                'Longitud libre (L0)',
                mod.longitudLibreDelanteroRef?.toString() ?? '---',
              ],
              [
                'Número de espiras (n)',
                mod.numeroEspirasDelanteroRef?.toString() ?? '---',
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
                      })
                  ),
                })
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
          coefSeguridad = maxCortanteDelantero / (data.mmaEje1Despues * 9.81);
        }

        if (mod?.detallesMuelles?.['muelleDelanteroSinRef']) {
          maxCortante =
            (Math.PI *
              (((mod.diametroEspiraDelanteroSinRef ?? 0) / 1000) ** 3 *
                1118.34 *
                1000000)) /
            (8 * (diametromedio / 1000));
          maxCortanteDelantero = maxCortante * 2;
          coefSeguridad = maxCortanteDelantero / (data.mmaEje1Despues * 9.81);
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
                        children: [new TextRun({ text: h })],
                      }),
                    ],
                  })
              ),
            }),
            // Valores
            new TableRow({
              cantSplit: true,
              children: [
                maxCortante.toString() ?? '---',
                maxCortanteDelantero.toString() ?? '---',
                coefSeguridad.toString() ?? '---',
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
                  })
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
            ((longMinMuelle / 1000) *
              79500.24 *
              1000000 *
              ((mod.diametroEspiraDelanteroRef ?? 0) / 1000) ** 4) /
            (64 *
              (mod.numeroEspirasDelanteroRef ?? 0) *
              (diametromedio / 1000 / 2) ** 3);
          cargaMaxEje1Q = cargaMaxQ * 2;
          coefSeguridadK = cargaMaxEje1Q / (data.mmaEje1Despues * 9.81);
        }

        if (mod?.detallesMuelles?.['muelleDelanteroSinRef']) {
          longMinMuelle =
            (mod.numeroEspirasDelanteroSinRef ?? 0) *
            (mod.diametroEspiraDelanteroSinRef ?? 0);
          flechaResorte =
            (mod.longitudLibreDelanteroSinRef ?? 0) - longMinMuelle;
          cargaMaxQ =
            ((longMinMuelle / 1000) *
              79500.24 *
              1000000 *
              ((mod.diametroEspiraDelanteroSinRef ?? 0) / 1000) ** 4) /
            (64 *
              (mod.numeroEspirasDelanteroSinRef ?? 0) *
              (diametromedio / 1000 / 2) ** 3);
          cargaMaxEje1Q = cargaMaxQ * 2;
          coefSeguridadK = cargaMaxEje1Q / (data.mmaEje1Despues * 9.81);
        }

        // 6) Cálculo carga máx (Q) flecha delanteros
        const tablaQDelanteros = new Table({
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
                        children: [new TextRun({ text: h })],
                      }),
                    ],
                  })
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
                      i === 4
                        ? { type: ShadingType.CLEAR, fill: '00B050' }
                        : undefined,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: v })],
                      }),
                    ],
                  })
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
          fuerzaMaxEjeDelantero = (data.mmaEje1Despues * 9.81) / 2;
          factorBergstrasserKb = (4 * curvatura + 2) / (4 * curvatura - 3);
          esfuerzoMuelleT =
            (8 * fuerzaMaxEjeDelantero * diametromedio * factorBergstrasserKb) /
            (Math.PI * Math.pow(mod.diametroEspiraDelanteroRef ?? 0, 3));
          coefSeguridadFinalK = 1118.34 / esfuerzoMuelleT;
        }

        if (mod?.detallesMuelles?.['muelleDelanteroSinRef']) {
          fuerzaMaxEjeDelantero = (data.mmaEje1Despues * 9.81) / 2;
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
            // Encabezado datos
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
                        children: [new TextRun({ text: h })],
                      }),
                    ],
                  })
              ),
            }),
            // Valores
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
                      i === 3
                        ? { type: ShadingType.CLEAR, fill: '00B050' }
                        : undefined,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: v })],
                      }),
                    ],
                  })
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
          (Math.pow(mod.diametroEspiraTraseroRef ?? 0, 4) * 8104 * 1000) /
          (8 *
            Math.pow(diametromedio, 3) *
            (mod.numeroEspirasTraseroRef ?? 0)) /
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
          (((mod.diametroEspiraTraseroSinRef ?? 0) / 1000) ** 4 * 79500, 24) /
          (8 *
            (diametromedio / 1000) ** 3 *
            (mod.numeroEspirasTraseroSinRef ?? 0)) /
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
                  })
              ),
            }),
            // Filas
            ...[
              ['Diámetro exterior (Dext)', '106,00'],
              ['Diámetro interior (Dint)', '68,00'],
              ['Diámetro medio (Dm)', '87,00'],
              ['Diámetro de espira (De)', '19,00'],
              ['Longitud libre (L0)', '465,00'],
              ['Número de espiras (n)', '8,00'],
              ['Curvatura (C)', '4,58'],
              ['Rigidez (K) N/mm', '245,84'],
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
                      })
                  ),
                })
            ),
          ],
        });
        out.push(tablaGeomTraseros);
        out.push(new Paragraph({ text: '' }));
        out.push(new Paragraph({ text: '' }));

        let maxCortante = 0;
        let maxCortanteDelantero = 0;
        let coefSeguridad = 0;

        if (mod?.detallesMuelles?.['muelleTraseroConRef']) {
          maxCortante =
            (Math.PI *
              (((mod.diametroEspiraTraseroRef ?? 0) / 1000) ** 3 *
                1118.34 *
                1000000)) /
            (8 * (diametromedio / 1000));
          maxCortanteDelantero = maxCortante * 2;
          coefSeguridad = maxCortanteDelantero / (data.mmaEje2Despues * 9.81);
        }

        if (mod?.detallesMuelles?.['muelleTraseroSinRef']) {
          maxCortante =
            (Math.PI *
              (((mod.diametroEspiraTraseroSinRef ?? 0) / 1000) ** 3 *
                1118.34 *
                1000000)) /
            (8 * (diametromedio / 1000));
          maxCortanteDelantero = maxCortante * 2;
          coefSeguridad = maxCortanteDelantero / (data.mmaEje2Despues * 9.81);
        }

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
                        children: [new TextRun({ text: h })],
                      }),
                    ],
                  })
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
                      i === 2
                        ? { type: ShadingType.CLEAR, fill: '00B050' }
                        : undefined,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: v })],
                      }),
                    ],
                  })
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
            ((longMinMuelle / 1000) *
              79500.24 *
              1000000 *
              ((mod.diametroEspiraTraseroRef ?? 0) / 1000) ** 4) /
            (64 *
              (mod.numeroEspirasTraseroRef ?? 0) *
              (diametromedio / 1000 / 2) ** 3);
          cargaMaxEje1Q = cargaMaxQ * 2;
          coefSeguridadK = cargaMaxEje1Q / (data.mmaEje2Despues * 9.81);
        }

        if (mod?.detallesMuelles?.['muelleTraseroSinRef']) {
          longMinMuelle =
            (mod.numeroEspirasDelanteroSinRef ?? 0) *
            (mod.diametroEspiraDelanteroSinRef ?? 0);
          flechaResorte =
            (mod.longitudLibreDelanteroSinRef ?? 0) - longMinMuelle;
          cargaMaxQ =
            ((longMinMuelle / 1000) *
              79500.24 *
              1000000 *
              ((mod.diametroEspiraDelanteroSinRef ?? 0) / 1000) ** 4) /
            (64 *
              (mod.numeroEspirasDelanteroSinRef ?? 0) *
              (diametromedio / 1000 / 2) ** 3);
          cargaMaxEje1Q = cargaMaxQ * 2;
          coefSeguridadK = cargaMaxEje1Q / (data.mmaEje2Despues * 9.81);
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
                        children: [new TextRun({ text: h })],
                      }),
                    ],
                  })
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
                      i === 4
                        ? { type: ShadingType.CLEAR, fill: '00B050' }
                        : undefined,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: v })],
                      }),
                    ],
                  })
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
          fuerzaMaxEjeDelantero = (data.mmaEje1Despues * 9.81) / 2;
          factorBergstrasserKb = (4 * curvatura + 2) / (4 * curvatura - 3);
          esfuerzoMuelleT =
            (8 * fuerzaMaxEjeDelantero * diametromedio * factorBergstrasserKb) /
            (Math.PI * Math.pow(mod.diametroEspiraTraseroRef ?? 0, 3));
          coefSeguridadFinalK = 1118.34 / esfuerzoMuelleT;
        }

        if (mod?.detallesMuelles?.['muelleTraseroSinRef']) {
          fuerzaMaxEjeDelantero = (data.mmaEje1Despues * 9.81) / 2;
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
            // Encabezado datos
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
                        children: [new TextRun({ text: h })],
                      }),
                    ],
                  })
              ),
            }),
            // Valores
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
                      i === 3
                        ? { type: ShadingType.CLEAR, fill: '00B050' }
                        : undefined,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: v })],
                      }),
                    ],
                  })
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
          })
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
          })
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
              ['MTMA/MMA (Kg)', data.mmaDespues.toString() ?? '---'],
              ['MTMA/MMA eje 1', data.mmaEje1Despues.toString() ?? '---'],
              ['MTMA/MMA eje 2', data.mmaEje2Despues.toString() ?? '---'],
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
                      })
                  ),
                })
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
          })
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
          })
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
                  mod.numHojasBallestaDelantera?.toString() ?? '---',
                ],
                [
                  'Ancho de la hoja b=',
                  mod.anchoHojaBallestaDelantera?.toString() ?? '---',
                ],
                [
                  'Espesor de la hoja e=',
                  mod.espesorHojaBallestaDelantera?.toString() ?? '---',
                ],
                [
                  'Longitud total ballesta 2L=',
                  mod.longitudBallestaDelantera?.toString() ?? '---',
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
                        })
                    ),
                  })
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
                children: ['F=', f.toString() ?? '---', 'Kg'].map(
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
                    })
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
                children: ['2F=', f2.toString() ?? '---', 'Kg'].map(
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
                    })
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
                  mod.numHojasBallestaTrasera?.toString() ?? '---',
                ],
                [
                  'Ancho de la hoja b=',
                  mod.anchoHojaBallestaTrasera?.toString() ?? '---',
                ],
                [
                  'Espesor de la hoja e=',
                  mod.espesorHojaBallestaTrasera?.toString() ?? '---',
                ],
                [
                  'Longitud total ballesta 2L=',
                  mod.longitudBallestaTrasera?.toString() ?? '---',
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
                        })
                    ),
                  })
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
                children: ['2F=', f.toString() ?? '---', 'Kg'].map(
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
                    })
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
            })
          );
          // 8) Tabla: F eje 2
          const tablaFEje2 = new Table({
            width: { size: 50, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                cantSplit: true,
                children: ['F=', f2.toString() ?? '---', 'Kg'].map(
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
                    })
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
          })
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
              ['MTMA/MMA (Kg)', data.mmaDespues.toString() ?? '---'],
              ['MTMA/MMA eje 1', data.mmaEje1Despues.toString() ?? '---'],
              ['MTMA/MMA eje 2', data.mmaEje2Despues.toString() ?? '---'],
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
                      })
                  ),
                })
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
          })
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
            })
          );
          // 4) Tabla: PESO A SOPORTAR POR CADA TACO EN EJE 1

          let resultadoEje1 = data.mmaEje1Despues / 2;

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
                  (mod.diametroTacoDelantero ?? 0).toString() ?? '---',
                ],
                ['Radio (cm)', radio.toString() ?? '---'],
                [
                  'Espesor (cm)',
                  (mod.espesorTacoDelantero ?? 0).toString() ?? '---',
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
                        })
                    ),
                  })
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
            })
          );

          out.push(new Paragraph({ text: '' }));

          let resultadoEje2 = data.mmaEje2Despues / 2;

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
                  (mod.diametroTacoTrasero ?? 0).toString() ?? '---',
                ],
                ['Radio (cm)', radio.toString() ?? '---'],
                [
                  'Espesor (cm)',
                  (mod.espesorTacoTrasero ?? 0).toString() ?? '---',
                ],
                ['Superficie (cm²)', superficie.toString() ?? '---'],
                [
                  'Res. Máxima a compresión (Kg)',
                  resistenciaMaxCompresion.toString() ?? '---',
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
                        })
                    ),
                  })
              ),
            ],
          });
          out.push(tablaDimensionesTacoTrasero);
          out.push(new Paragraph({ text: '' }));
          out.push(new Paragraph({ text: '' }));
        }
      }
    }

    // 7) Texto final en cursiva
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
      })
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
      })
    );
  } else {
    const mobil = modificaciones.find(
      (m) =>
        m.nombre === 'MOBILIARIO INTERIOR VEHÍCULO' &&
        m.seleccionado &&
        data.tipoVehiculo === 'camper'
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
        })
      );

      let Tr = 0.6 * data.mmaAntes;

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
            ['M.T.M.A. (Kg)', data.mmaAntes.toString() ?? '---'],
            ['Velocidad máxima (Km/h)', '148'],
            ['Coeficiente de rozamiento', '0.6'],
            ['Aceleración de la gravedad (m/s²)', '9.8'],
            ['Deceleración ar = μ * g (m/s²)', '5.88'],
            ['Tr = μ * Mt (Kg)', Tr.toString() ?? '---'],
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
              })
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
          medidas: number;
          tornillos: number;
        }[] = [];

        const modMobiliario = data.modificaciones.find(
          (m: any) =>
            m.nombre === 'MOBILIARIO INTERIOR VEHÍCULO' && m.seleccionado
        );

        if (modMobiliario) {
          // Muebles bajos
          (modMobiliario.mueblesBajo || []).forEach((m: any) => {
            muebles.push({
              desc: `Mueble bajo ${m.medidas}`,
              peso: m.pesoMuebleBajo || '---',
              medidas: m.medidas || 0,
              tornillos: m.tornillos || 0,
            });
          });

          // Muebles altos
          (modMobiliario.mueblesAlto || []).forEach((m: any) => {
            muebles.push({
              desc: `Mueble alto ${m.medidas}`,
              peso: m.pesoMuebleAlto || '---',
              medidas: m.medidas || 0,
              tornillos: m.tornillos || 0,
            });
          });

          // Aseos
          (modMobiliario.mueblesAseo || []).forEach((m: any) => {
            muebles.push({
              desc: `Aseo ${m.medidas}`,
              peso: m.pesoMuebleAseo || '---',
              medidas: m.medidas || 0,
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
                  })
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
                      })
                  ),
                })
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
                })
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
                    })
                ),
              })
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
            m.nombre === 'MOBILIARIO INTERIOR VEHÍCULO' && m.seleccionado
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
            desc: `Mueble bajo ${m.medidas}`,
            cantidad: m.tornillosMuebleBajo || '0',
          });
        });

        // Muebles altos
        (modMobiliario.mueblesAlto || []).forEach((m: any) => {
          muebles.push({
            desc: `Mueble alto ${m.medidas}`,
            cantidad: m.tornillosMuebleAlto || '0',
          });
        });

        // Aseos
        (modMobiliario.mueblesAseo || []).forEach((m: any) => {
          muebles.push({
            desc: `Aseo ${m.medidas}`,
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
              })
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
                })
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
            m.nombre === 'MOBILIARIO INTERIOR VEHÍCULO' && m.seleccionado
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
                  })
              ),
            })
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
            m.nombre === 'MOBILIARIO INTERIOR VEHÍCULO' && m.seleccionado
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
            desc: `Mueble bajo ${m.medidas}`,
            peso: parseFloat(m.pesoMuebleBajo) || 0,
            tornillos: parseInt(m.tornillosMuebleBajo) || 0,
          });
        });

        // Muebles altos
        (modMobiliario.mueblesAlto || []).forEach((m: any) => {
          muebles.push({
            desc: `Mueble alto ${m.medidas}`,
            peso: parseFloat(m.pesoMuebleAlto) || 0,
            tornillos: parseInt(m.tornillosMuebleAlto) || 0,
          });
        });

        // Aseos
        (modMobiliario.mueblesAseo || []).forEach((m: any) => {
          muebles.push({
            desc: `Aseo ${m.medidas}`,
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
              })
          ),
        });

        // Filas dinámicas
        const filas = muebles.map((mueble, idx) => {
          const fuerzaInercia = mueble.peso * (9.8 / 5.88);
          const resistenciaCortante =
            (0.6 * 80 * areaResistente * mueble.tornillos) / 1.25;
          const coefSeguridad = resistenciaCortante / fuerzaInercia;

          const valores = [
            (idx + 1).toString(),
            mueble.desc,
            mueble.peso.toFixed(2),
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
                })
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
            m.nombre === 'MOBILIARIO INTERIOR VEHÍCULO' && m.seleccionado
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
            desc: `Mueble alto ${m.medidas}`,
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
              })
          ),
        });

        // Filas dinámicas solo de muebles altos
        const filas = muebles.map((mueble, idx) => {
          const pesoPorTornillo =
            mueble.tornillos > 0 ? mueble.peso / mueble.tornillos : 0;
          const resultado =
            resistenciaCortadura > 0
              ? pesoPorTornillo / resistenciaCortadura
              : 0;

          const valores = [
            (idx + 1).toString(), // Nº
            mueble.desc, // Descripción
            `Q${idx + 1}`, // Código
            mueble.peso.toFixed(2), // Peso (kg)
            mueble.tornillos.toString(), // Nº tornillos
            pesoPorTornillo.toFixed(2), // Peso por tornillo
            resistenciaCortadura.toString(), // Resistencia cortadura
            resultado.toFixed(4), // Resultado
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
                })
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
        })
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
        })
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
        })
      );
    }
  }

  return out;
}
