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
  data: any
): Promise<(Paragraph | Table)[]> {
  const out: (Paragraph | Table)[] = [];
  console.log('Modificaciones para cálculos:', modificaciones);

  let url = `http://192.168.1.41:3000/imgs/firma-generada.png`;
  const response5 = await fetch(url);
  const imageBuffer5 = await response5.arrayBuffer();

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
          ['Cw=Coef. Aerodinámico', '0,82'],
          ['A =área de la pieza (m²)', '0,16'],
          ['ρ (densidad del aire (Kg/m³)', '1,29'],
          ['V² = velocidad del aire 140Km/h (m/s)', '38,89'],
          ['R (radio de curva) m', '800'],
          ['K (coeficiente de seguridad)', '3'],
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
          children: ['4,91', '5,00', '127,99', '0,95', '138,84'].map(
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
          children: ['416,51', '11746,944', '6526,08', '0,089'].map(
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
          ['Peso de la pieza en Kg', '12', 'nº tornillos', '6'],
          ['Anchura de la pieza en m', '1,13', 'Métrica', 'S'],
          ['Altura de la pieza en m', '1,17', 'Calidad', '8,8'],
          ['Superficie frontal m²', '1,32', 'As (Sección resistente)', '36,64'],
          [
            'Coef. aerodinámico',
            '0,82',
            'Res. Tracción Mín tornillo 8,8 (Kg/mm2)',
            '80',
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
          ['Cw=Coef. Aerodinámico', '0,82'],
          ['A =área de la pieza (m²)', '1,32'],
          ['ρ (densidad del aire (Kg/m³))', '1,29'],
          ['V² = velocidad del aire 140Km/h (m/s)', '38,89'],
          ['R (radio de curva) m', '800'],
          ['K (coeficiente de seguridad)', '3'],
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
          children: ['117,72', '120,00', '1057,58', '22,69', '1317,99'].map(
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
          children: ['3953,96', '12662,784', '7034,88', '0,785'].map(
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
          ['Tiro máx. del cabrestante (Kg)', '6120'],
          ['Diámetro de cada perno (cm)', '1'],
          ['Material del perno', 'Acero 8.8'],
          ['Tensión mín., rotura cortante acero (Kg/cm²)', '3.100'],
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
          ['Número de pernos', '4'],
          ['Diámetro de cada perno', '10 mm'],
          ['Material del perno', 'Acero 8.8'],
          ['Tensión mín., rotura cortante acero', '3.100 Kg/cm2'],
          [
            'Tensión cortante ejercida por el tiro del cabrestante sobre los pernos de unión a la estructura de soporte de éste (Kg/cm2)',
            '1 948,06',
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
                  text: '1,59',
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
          ['Peso de la pieza en Kg', '0,5', 'nº tornillos', '4'],
          ['Anchura de la pieza en m', '0,125', 'Métrica', '4'],
          ['Altura de la pieza en m', '0,065', 'Calidad', '8,8'],
          ['Superficie frontal m²', '0,01', 'As (Sección resistente)', '8,78'],
          [
            'Coef. aerodinámico',
            '0,82',
            'Res. Tracción Mín tornillo 8,8 (Kg/mm2)',
            '80',
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
          ['Cw=Coef. Aerodinámico', '0,82'],
          ['A =área de la pieza (m²)', '0,01'],
          ['ρ (densidad del aire (Kg/m³))', '1,29'],
          ['V² = velocidad del aire 140Km/h (m/s)', '38,89'],
          ['R (radio de curva) m', '800'],
          ['K (coeficiente de seguridad)', '3'],
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
          children: ['4,91', '5,00', '6,50', '0,95', '17,35'].map(
            (val) =>
              new TableCell({
                margins: CELL_MARGINS,
                children: [
                  new Paragraph({ alignment: AlignmentType.CENTER, text: val }),
                ],
              })
          ),
        }),
      ],
    });
    out.push(tablaFuerzas);
    out.push(new Paragraph({ text: '' }));
    out.push(new Paragraph({ text: '' }));

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
          children: ['52,05', '2022,912', '1123,84', '0,065'].map(
            (val) =>
              new TableCell({
                margins: CELL_MARGINS,
                shading: { type: ShadingType.CLEAR, fill: '00B050' },
                children: [
                  new Paragraph({ alignment: AlignmentType.CENTER, text: val }),
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
          ['Cw=Coef. Aerodinámico', '0,82'],
          ['A =área de la pieza (m²)', '0,44'],
          ['ρ (densidad del aire (Kg/m³))', '1,29'],
          ['V² = velocidad del aire 140Km/h (m/s)', '38,89'],
          ['R (radio de curva) m', '800'],
          ['K (coeficiente de seguridad)', '3'],
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
          children: ['19,62', '20,00', '351,89', '3,78', '395,29'].map(
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
          children: ['1185,86', '16879,104', '9377,28', '0,177'].map(
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
          ['Peso de la pieza en Kg', '1,5', 'nº tornillos', '6'],
          ['Anchura de la pieza en m', '0,43', 'Métrica', '8'],
          ['Altura de la pieza en m', '0,33', 'Calidad', '8,8'],
          ['Superficie frontal m²', '0,14', 'As (Sección resistente)', '36,63'],
          [
            'Coef. aerodinámico',
            '0,82',
            'Res. Tracción Mín tornillo 8,8 (Kg/mm2)',
            '80',
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
          ['Cw=Coef. Aerodinámico', '0,82'],
          ['A =área de la pieza (m²)', '0,14'],
          ['ρ (densidad del aire (Kg/m³))', '1,29'],
          ['V² = velocidad del aire 140Km/h (m/s)', '38,89'],
          ['R (radio de curva) m', '800'],
          ['K (coeficiente de seguridad)', '3'],
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
          children: ['14,72', '15,00', '113,51', '2,84', '146,06'].map(
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
          children: ['438,18', '12659,328', '7032,96', '0,087'].map(
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
          ['Peso de la pieza en Kg', '90', 'nº tornillos', '6'],
          ['Anchura de la pieza en m', '0,85', 'Métrica', '10'],
          ['Altura de la pieza en m', '0,15', 'Calidad', '8,8'],
          ['Superficie frontal m²', '0,13', 'As (Sección resistente)', '58,03'],
          [
            'Coef. aerodinámico',
            '0,82',
            'Res. Tracción Mín tornillo 8,8 (Kg/mm2)',
            '80',
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
          ['Cw=Coef. Aerodinámico', '0,82'],
          ['A =área de la pieza (m²)', '0,13'],
          ['ρ (densidad del aire (Kg/m³))', '1,29'],
          ['V² = velocidad del aire 140Km/h (m/s)', '38,89'],
          ['R (radio de curva) m', '800'],
          ['K (coeficiente de seguridad)', '3'],
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
          children: ['882,90', '900,00', '101,99', '170,15', '2055,04'].map(
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
          children: ['6165,12', '20055,168', '11141,76', '0,773'].map(
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
          ['M.T.M.A. (Kg)', '2000'],
          ['Velocidad máxima (Km/h)', '148'],
          ['Coeficiente de rozamiento', '0,6'],
          ['Aceleración de la gravedad (m/s²)', '9,8'],
          ['Deceleración ar = μ * g (m/s²)', '5,88'],
          ['Tr = μ * Mt (Kg)', '1200'],
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
    const tablaLongitudinales = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        // Encabezado de columnas
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
                    children: [new TextRun({ text: h })],
                  }),
                ],
              })
          ),
        }),
        // Filas 1–8
        ...[
          ['1', 'Mueble alto 1250x405x325mm', 'Q1', '12'],
          ['2', 'Mueble alto 1120x390x320mm', 'Q2', '12'],
          ['3', 'Mueble bajo 1350x1800x900mm', 'Q3', '50'],
          ['4', 'Mueble bajo 600x1420x900mm', 'Q4', '50'],
          ['5', 'Mueble bajo 1200x610x580mm', 'Q5', '50'],
          ['6', 'Armario 1180x320x625mm', 'Q6', '15'],
          ['7', 'Mueble bajo 1080x610x580mm', 'Q7', '50'],
          ['8', 'Aseo 1030x2100x590mm', 'Q8', '13'],
        ].map(
          ([i, desc, q, peso]) =>
            new TableRow({
              cantSplit: true,
              children: [i, desc, q, peso].map(
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
    out.push(tablaLongitudinales);
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
    const tablaNumTornillos = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        // Encabezado
        new TableRow({
          cantSplit: true,
          children: [
            'Componente / Diámetro tornillo (mm)',
            '4',
            '5',
            '6',
            '8',
            'total',
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
        // Filas de componentes
        ...[
          ['Mueble alto 1250x405x325mm', '15', '', '', '', '15'],
          ['Mueble alto 1120x390x320mm', '15', '', '', '', '15'],
          ['Mueble bajo 1350x1800x900mm', '20', '', '', '', '20'],
          ['Mueble bajo 600x1420x900mm', '20', '', '', '', '20'],
          ['Mueble bajo 1200x610x580mm', '20', '', '', '', '20'],
          ['Armario 1180x320x625mm', '15', '', '', '', '15'],
          ['Mueble bajo 1080x610x580mm', '20', '', '', '', '20'],
          ['Aseo 1030x2100x590mm', '12', '', '', '', '12'],
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
    out.push(tablaNumTornillos);
    out.push(new Paragraph({ text: '' }));
    out.push(new Paragraph({ text: '' }));

    // 6) Tabla: PROPIEDADES DEL TORNILLO SELECCIONADO
    const tablaPropsTornillo = new Table({
      width: { size: 50, type: WidthType.PERCENTAGE },
      rows: [
        ...[
          ['Calidad', 'M8.8'],
          ['Resistencia a cortadura (Kg)', '227,8'],
          ['Tensión de rotura σr ≥ (Kg/mm²)', '80'],
          ['Tensión límite de elasticidad σe ≥ (Kg/mm²)', '65'],
          ['Diámetro del tornillo (mm)', '5'],
        ].map(
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
        ),
      ],
    });
    out.push(tablaPropsTornillo);
    out.push(new Paragraph({ text: '' }));
    out.push(new Paragraph({ text: '' }));

    // 7) Tabla: ÁREA RESISTENTE y K y γMb
    const tablaAreaResistente = new Table({
      width: { size: 50, type: WidthType.PERCENTAGE },
      rows: [
        ...[
          ['Área resistente Ar (mm²)', '14,2'],
          ['K', '0,6'],
          ['γMb = Coeficiente de seguridad', '1,25'],
        ].map(
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
        ),
      ],
    });
    out.push(tablaAreaResistente);
    out.push(new Paragraph({ text: '' }));
    out.push(new Paragraph({ text: '' }));

    // 8) Tabla: FUERZAS DE INERCIA y COEF. SEGURIDAD por componente
    const tablaFuerzaInercia = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        // Encabezado
        new TableRow({
          cantSplit: true,
          children: [
            'Nº',
            'Componente',
            'Diámetro tornillo',
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
                    children: [new TextRun({ text: h })],
                  }),
                ],
              })
          ),
        }),
        // Filas 1–8
        ...[
          ['1', 'Mueble alto 1250x405x325mm', 'Q1', '7,20', '8179,20', '1136'],
          ['2', 'Mueble alto 1120x390x320mm', 'Q2', '7,20', '8179,20', '1136'],
          [
            '3',
            'Mueble bajo 1350x1800x900mm',
            'Q3',
            '30,00',
            '10905,60',
            '363,52',
          ],
          [
            '4',
            'Mueble bajo 600x1420x900mm',
            'Q4',
            '30,00',
            '10905,60',
            '363,52',
          ],
          [
            '5',
            'Mueble bajo 1200x610x580mm',
            'Q5',
            '30,00',
            '10905,60',
            '363,52',
          ],
          ['6', 'Armario 1180x320x625mm', 'Q6', '9,00', '8179,20', '908,8'],
          [
            '7',
            'Mueble bajo 1080x610x580mm',
            'Q7',
            '30,00',
            '10905,60',
            '363,52',
          ],
          ['8', 'Aseo 1030x2100x590mm', 'Q8', '7,80', '6543,36', '838,892308'],
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
    out.push(tablaFuerzaInercia);
    out.push(new Paragraph({ text: '' }));
    out.push(new Paragraph({ text: '' }));

    // 9) Tabla: ESFUERZOS VERTICALES
    const tablaVerticales = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        // Encabezado
        new TableRow({
          cantSplit: true,
          children: [
            'Nº',
            'Componente',
            'Diámetro tornillo',
            'Peso (kg)',
            'Pasador (??)', // ajusta el texto si hace falta
            'λ',
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
                    children: [new TextRun({ text: h })],
                  }),
                ],
              })
          ),
        }),
        // Filas de datos
        ...[
          [
            '1',
            'Mueble alto 1250x405x325mm',
            'Q1',
            '12',
            '15',
            '0,80',
            '227,8',
          ],
          [
            '2',
            'Mueble alto 1120x390x320mm',
            'Q2',
            '12',
            '15',
            '0,80',
            '227,8',
          ],
        ].map(
          (row) =>
            new TableRow({
              cantSplit: true,
              children: row.map(
                (val: any) =>
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
    out.push(tablaVerticales);
    out.push(new Paragraph({ text: '' }));
    out.push(new Paragraph({ text: '' }));
  }

  out.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '2.3.' + contador + ' Cálculo de las superficies de aireación',
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
      mod?.detallesMuelles?.['muelleDelanteroSinRef']
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
            ['MTMA/MMA (Kg)', '2000'],
            ['MTMA/MMA eje 1', '1500'],
            ['MTMA/MMA eje 2', '1000'],
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
            ['Diámetro exterior (Dext)', '105,00'],
            ['Diámetro interior (Dint)', '75,00'],
            ['Diámetro medio (Dm)', '90,00'],
            ['Diámetro de espira (De)', '15,00'],
            ['Longitud libre (L0)', '470,00'],
            ['Número de espiras (n)', '7,00'],
            ['Curvatura (C)', '6,00'],
            ['Rigidez (K) N/mm', '98,59'],
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
            children: ['16468,92', '32937,83', '2,24'].map(
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
            children: ['105,00', '365,00', '35984,11', '71968,22', '4,89'].map(
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
            children: ['7357,50', '1,24', '618,58', '1,81'].map(
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
            children: ['34623,84', '69247,69', '7,06'].map(
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
              '152,00',
              '313,00',
              '76946,60',
              '153893,21',
              '15,69',
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
            children: ['4905,00', '1,33', '210,15', '5,32'].map(
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
            ['MTMA/MMA (Kg)', '2000'],
            ['MTMA/MMA eje 1', '1500'],
            ['MTMA/MMA eje 2', '1000'],
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

      if (mod?.detallesMuelles?.['ballestaDelantera']) {
        // 3) Tabla: CÁLCULO DE LA BALLESTA EN EL EJE 1 (inputs)
        const tablaInputEje1 = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              cantSplit: true,
              children: [],
            }),
            ...[
              ['CÁLCULO DE LA BALLESTA EN EL EJE 1:', ' '],
              [' ', ' '],
              ['Número de hojas N=', '7'],
              ['Ancho de la hoja b=', '50 mm'],
              ['Espesor de la hoja e=', '8 mm'],
              ['Longitud total ballesta 2L=', '800 mm'],
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

        // 4) Tabla: RESULTADO F = … Kg
        const tablaF = new Table({
          width: { size: 50, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              cantSplit: true,
              children: ['F=', '560', 'Kg'].map(
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
      }

      if (mod?.detallesMuelles?.['ballestaTrasera']) {
        out.push(
          new Paragraph({
            text: 'Por lo tanto, la carga total que puede soportar la ballesta de la suspensión delantera será igual a:',
          })
        );

        // 5) Tabla: RESULTADO 2F = … Kg (celdas rellenadas en rojo/verdes según valor)
        const tabla2F = new Table({
          width: { size: 50, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              cantSplit: true,
              children: ['2F=', '1120', 'Kg'].map(
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
        out.push(tabla2F);
        out.push(new Paragraph({ text: '' }));
        out.push(new Paragraph({ text: '' }));

        // 6) Tabla: CÁLCULO DE LA BALLESTA EN EL EJE 2 (inputs)
        const tablaInputEje2 = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            ...[
              ['CÁLCULO DE LA BALLESTA EN EL EJE 2:', ' '],
              [' ', ' '],
              ['Número de hojas N=', '9'],
              ['Ancho de la hoja b=', '60 mm'],
              ['Espesor de la hoja e=', '12 mm'],
              ['Longitud total ballesta 2L=', '750 mm'],
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

        // 7) Tabla: F eje 2
        const tablaFEje2 = new Table({
          width: { size: 50, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              cantSplit: true,
              children: ['F=', '2073,6', 'Kg'].map(
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

        // 8) Tabla: 2F eje 2
        const tabla2FEje2 = new Table({
          width: { size: 50, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              cantSplit: true,
              children: ['2F=', '4147,2', 'Kg'].map(
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
            ['MTMA/MMA (Kg)', '2000'],
            ['MTMA/MMA eje 1', '1500'],
            ['MTMA/MMA eje 2', '1000'],
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
                      children: [new TextRun({ text: 'MMA/MMTA', bold: true })],
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
                      children: [new TextRun({ text: '= 700' })],
                    }),
                  ],
                }),
              ],
            }),
          ],
        });

        out.push(tablaPesoPorTaco);
        out.push(new Paragraph({ text: '' }));

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
                      children: [new TextRun({ text: 'DIMENSIONES DEL TACO' })],
                    }),
                  ],
                }),
              ],
            }),
            ...[
              ['Diámetro (cm)', '9'],
              ['Radio (cm)', '4,5'],
              ['Espesor (cm)', '4,5'],
              ['Superficie (cm²)', '63,585'],
              ['Res. Máxima a compresión (Kg)', '58307,445'],
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
                      children: [new TextRun({ text: 'MMA/MMTA', bold: true })],
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
                      children: [new TextRun({ text: '= 500' })],
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
                      children: [new TextRun({ text: 'DIMENSIONES DEL TACO' })],
                    }),
                  ],
                }),
              ],
            }),
            ...[
              ['Diámetro (cm)', '9'],
              ['Radio (cm)', '4,5'],
              ['Espesor (cm)', '4,5'],
              ['Superficie (cm²)', '63,585'],
              ['Res. Máxima a compresión (Kg)', '58307,445'],
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

  return out;
}
