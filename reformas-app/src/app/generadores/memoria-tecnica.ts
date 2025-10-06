import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Header,
  Footer,
  TableOfContents,
  SectionType,
  PageNumber,
  HeadingLevel,
  WidthType,
  BorderStyle,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  VerticalAlign,
  ImageRun,
  ExternalHyperlink,
  ShadingType,
  UnderlineType,
} from 'docx';
import saveAs from 'file-saver';
import ingeniero from '../../assets/ingeniero.json';
import { Modificacion } from '../interfaces/modificacion';
import {
  buildModificacionesParagraphs,
  generarDocumentoProyectoParagraphs,
  generarTablaLeyenda,
} from '../Funciones/buildModificacionesParagraphs';
import loadImage from 'blueimp-load-image';
import { buildCalculos } from '../Funciones/calculos';

interface ImageInfo {
  buffer: ArrayBuffer;
  width: number;
  height: number;
  mimeType: string;
}

export function keepTableTogether(table: Table): Table {
  // Use the public API to access rows; fallback to private if necessary
  const rows: TableRow[] =
    (table as any).rows || (table as any).root?.[0]?.children || [];

  const newRows = rows.map((row: TableRow, rowIdx: number) => {
    const isLastRow = rowIdx === rows.length - 1;

    // Get row options safely
    const rowOptions = (row as any).options || {};
    const rowChildren: TableCell[] =
      rowOptions.children || (row as any).children || [];

    // Asegura cantSplit a nivel de fila
    const newRow = new TableRow({
      ...rowOptions,
      cantSplit: true,
      children: rowChildren.map((cell: TableCell) => {
        const cellOptions = (cell as any).options || {};
        const paragraphs: Paragraph[] =
          cellOptions.children || (cell as any).children || [];

        const newParagraphs = paragraphs.map((p: Paragraph) => {
          const opts = (p as any).options || {};
          return new Paragraph({
            ...opts,
            // Mantén unidas las líneas y pega con la siguiente fila
            keepLines: true,
            keepNext: !isLastRow, // en la última fila lo dejamos false
          });
        });

        return new TableCell({
          ...cellOptions,
          children: newParagraphs,
        });
      }),
    });

    return newRow;
  });

  // Get table options safely
  const tableOptions = (table as any).options || {};
  return new Table({
    ...tableOptions,
    rows: newRows,
  });
}

export async function generarDocumentoMemoria(data: any): Promise<void> {
  const response = await fetch('assets/logo.png');
  const imageBuffer = await response.arrayBuffer();

  const modificaciones: Modificacion[] = data.modificaciones;

  let tipo = data.tipoVehiculo;
  let alto;
  let alto2;

  let url = `http://192.168.1.41:3000/imgs/${tipo}.png`;
  const response3 = await fetch(url);
  const imageBuffer3 = await response3.arrayBuffer();

  url = `http://192.168.1.41:3000/imgs/planos/plano-generado-proyecto${data.numeroProyecto}.png`;
  const response4 = await fetch(url);
  const imageBuffer4 = await response4.arrayBuffer();

  url = `http://192.168.1.41:3000/imgs/firma-generada.png`;
  const response5 = await fetch(url);
  const imageBuffer5 = await response5.arrayBuffer();

  const logoImage = new ImageRun({
    data: imageBuffer,
    transformation: {
      width: 175,
      height: 75,
    },
    type: 'png',
  });

  // 3) Genera el párrafo “REF/REV”
  const refPara = new Paragraph({
    alignment: AlignmentType.RIGHT,
    children: [
      new TextRun({
        text: 'REF.: ' + (data.referenciaProyecto?.replace('PTRV', 'MT') || ''),
        size: 28,
        color: 'FF0000',
      }),
      new TextRun({
        text: ' REV ' + data.revision,
        size: 28,
        color: 'FF0000',
      }),
    ],
    spacing: {
      before: 0, // Espacio después del párrafo
    },
  });

  // 4) Construye tu tabla de header en 2 columnas (logo + datos)
  const innerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 12, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 12, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 12, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 12, color: '000000' },
      insideVertical: { style: BorderStyle.DOTTED, size: 1, color: '000000' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [logoImage],
              }),
            ],
          }),
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: ingeniero.tlf,
                    font: 'Arial',
                    size: 28,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: ingeniero.correoEmpresa,
                    font: 'Arial',
                    size: 28,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: ingeniero.web,
                    font: 'Arial',
                    size: 28,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: ingeniero.colegiado,
                    font: 'Arial',
                    size: 28,
                  }),
                ],
              }),
            ],
            margins: {
              top: 300, // 300 TWIP ≈ 0.21 cm
              bottom: 300,
            },
          }),
        ],
      }),
    ],
  });

  // Tabla externa que envuelve (marco más grueso)
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 20, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 20, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 20, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 20, color: '000000' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            margins: {
              top: 20,
              bottom: 20,
              left: 40,
              right: 40,
            },
            children: [innerTable],
          }),
        ],
      }),
    ],
  });

  const titleParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: 'MEMORIA TÉCNICO DE REFORMA DE VEHÍCULO',
        bold: true,
        size: 36, // tamaño de título
      }),
    ],
  });

  const innerDataTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.DOTTED, size: 2, color: '000000' },
      bottom: { style: BorderStyle.DOTTED, size: 2, color: '000000' },
      left: { style: BorderStyle.DOTTED, size: 2, color: '000000' },
      right: { style: BorderStyle.DOTTED, size: 2, color: '000000' },
      insideHorizontal: {
        style: BorderStyle.DOTTED,
        size: 1,
        color: '000000',
      },
      insideVertical: { style: BorderStyle.DOTTED, size: 1, color: '000000' },
    },
    rows: [
      new TableRow({
        children: [
          { text: 'MARCA', width: 20 },
          { text: data.marca, width: 25 },
          { text: 'DENOMINACIÓN', width: 15 },
          { text: data.modelo, width: 25 },
        ].map(
          ({ text, width }) =>
            new TableCell({
              verticalAlign: VerticalAlign.CENTER,
              width: { size: width, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text, bold: true, size: 22 })],
                }),
              ],
              margins: { top: 150, bottom: 150, left: 150, right: 150 },
            })
        ),
      }),
      ...[
        [
          'Tipo/Variante/Versión:',
          data.tipo + ' / ' + data.variante + ' / ' + data.version,
        ],
        ['MATRÍCULA', data.matricula],
        ['Nº BASTIDOR', data.bastidor],
        [
          'FECHA 1ª MATRICULACIÓN',
          data.fechaMatriculacion
            ? new Date(data.fechaMatriculacion).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })
            : '',
        ],
      ].map(
        ([label, value]) =>
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 2,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: label, size: 22 })],
                  }),
                ],
                margins: { top: 150, bottom: 150, left: 150, right: 150 },
              }),
              new TableCell({
                columnSpan: 2,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({ text: value, bold: true, size: 22 }),
                    ],
                  }),
                ],
                margins: { top: 150, bottom: 150, left: 150, right: 150 },
              }),
            ],
          })
      ),
    ],
  });

  const outerDataTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 20, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 12, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 20, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 12, color: '000000' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              titleParagraph,
              new Paragraph(''), // espaciado
              innerDataTable,
            ],
            margins: { top: 300, bottom: 300, left: 600, right: 300 },
          }),
        ],
      }),
    ],
  });

  const dataTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 12, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 20, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 12, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 20, color: '000000' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            margins: { top: 30, bottom: 30, left: 30, right: 50 },
            children: [outerDataTable],
          }),
        ],
      }),
    ],
  });

  const signatureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          // Celda izquierda: "Titular:"
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            borders: {
              top: { style: BorderStyle.DOTTED, size: 1, color: '000000' },
              bottom: { style: BorderStyle.DOTTED, size: 1, color: '000000' },
              left: { style: BorderStyle.DOTTED, size: 1, color: '000000' },
              right: { style: BorderStyle.DOTTED, size: 1, color: '000000' },
            },
            margins: { top: 100, bottom: 100, left: 150, right: 150 },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: 'Titular:',
                    bold: true,
                    size: 22,
                  }),
                ],
              }),
            ],
          }),

          // Celda derecha: nombre del titular
          new TableCell({
            width: { size: 75, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            borders: {
              top: { style: BorderStyle.DOTTED, size: 1, color: '000000' },
              bottom: { style: BorderStyle.DOTTED, size: 1, color: '000000' },
              left: { style: BorderStyle.DOTTED, size: 1, color: '000000' },
              right: { style: BorderStyle.DOTTED, size: 1, color: '000000' },
            },
            margins: { top: 100, bottom: 100, left: 150, right: 150 },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: data.propietario?.toUpperCase() || '—',
                    bold: true,
                    size: 22,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // const imgBuffer = await generarDocumentoConWordArt({
  //   web: ingeniero.web,
  //   url: ingeniero.url,
  // });

  // const webLink = new Paragraph({
  //   alignment: AlignmentType.CENTER,
  //   children: [
  //     new ImageRun({
  //       data: imgBuffer,
  //       transformation: {
  //         width: 600, // ajusta al tamaño que necesites
  //         height: 150,
  //       },
  //       type: 'png',
  //     }),
  //   ],
  // });

  // 1) Header
  const header = new Header({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: 'BFBFBF' },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: 'BFBFBF' },
          left: { style: BorderStyle.SINGLE, size: 1, color: 'BFBFBF' },
          right: { style: BorderStyle.SINGLE, size: 1, color: 'BFBFBF' },
          insideHorizontal: {
            style: BorderStyle.SINGLE,
            size: 1,
            color: 'BFBFBF',
          },
          insideVertical: {
            style: BorderStyle.SINGLE,
            size: 1,
            color: 'BFBFBF',
          },
        },
        rows: [
          new TableRow({
            children: [
              // Columna 1 (25%), texto en 8 pt y negrita
              new TableCell({
                width: { size: 40, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 100, right: 100 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: ingeniero.nombre,
                        bold: true,
                        size: 16,
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: ingeniero.titulacion,
                        bold: true,
                        size: 16,
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.LEFT,
                    children: [
                      new TextRun({
                        text: ingeniero.colegiado,
                        bold: true,
                        size: 16,
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.LEFT,
                    children: [
                      new TextRun({
                        text: ingeniero.tlf,
                        bold: true,
                        size: 16,
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.LEFT,
                    children: [
                      new TextRun({
                        text: ingeniero.correoEmpresa,
                        bold: true,
                        size: 16,
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.LEFT,
                    children: [
                      new TextRun({
                        text: ingeniero.web,
                        bold: true,
                        size: 16,
                      }),
                    ],
                  }),
                ],
              }),

              // Columna 2 (50%), texto en 8 pt y negrita
              new TableCell({
                width: { size: 40, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 100, right: 100 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'PROYECTO TÉCNICO POR REFORMA DE UN VEHÍCULO',
                        bold: true,
                        size: 16,
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text:
                          'Marca ' +
                          data.marca +
                          ' Denominación ' +
                          data.modelo,
                        bold: true,
                        size: 16,
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'Nº Bastidor ' + data.bastidor,
                        bold: true,
                        size: 16,
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'SOLICITANTE: ' + data.propietario,
                        bold: true,
                        size: 16,
                      }),
                    ],
                  }),
                ],
              }),

              // Columna 3 (25%), texto en 10 pt y negrita
              new TableCell({
                width: { size: 20, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 100, right: 100 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text:
                          'REF.: ' +
                          (data.referenciaProyecto?.replace('PTRV', 'MT') ||
                            ''),
                        bold: true,
                        size: 18,
                        color: 'FF0000',
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'REV ' + data.revision,
                        bold: true,
                        size: 18,
                        color: 'FF0000',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 0 }, // 500 TWIP ≈ 0,35 cm de espacio
        children: [],
      }),
    ],
  });

  const makeFooter = () =>
    new Footer({
      children: [
        new Paragraph({
          border: {
            top: { color: 'auto', space: 70, style: 'single', size: 6 },
          },
          // spacing: { before: 150, after: 150 },
          children: [
            new TextRun({
              text: ingeniero.textoLegal,
              font: 'Arial',
              size: 14,
            }),
          ],
        }),
        new Paragraph({
          spacing: { before: 100 },
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({ text: 'Página ', font: 'Arial', size: 22 }),
            // PageNumber.CURRENT es un literal string, así que lo metemos en un TextRun
            new TextRun({
              children: [PageNumber.CURRENT],
              font: 'Arial',
              size: 22,
            }),
            new TextRun({
              text: ' de ',
              font: 'Arial',
              size: 22,
            }),
            new TextRun({
              children: [PageNumber.TOTAL_PAGES],
              font: 'Arial',
              size: 22,
            }),
          ],
        }),
      ],
    });

  // 3) Primera sección: portada + TOC (págs 1–2)
  const section1 = {
    properties: {
      type: SectionType.NEXT_PAGE,
      pageNumberStart: 1,
      titlePage: true,
    },
    headers: {
      first: new Header({ children: [] }), // header invisible y sin espacio
      default: header,
    },
    footers: {
      first: new Footer({ children: [] }), // footer invisible y sin espacio
      default: makeFooter(),
    },
    children: [
      // Página 1: portada
      refPara,
      new Paragraph({ text: '', spacing: { before: 200 } }),
      headerTable,
      new Paragraph({ text: '', spacing: { before: 200 } }),
      dataTable,
      new Paragraph({ text: '', spacing: { before: 400 } }),
      signatureTable,
    ],
  };

  const punto1_1MemoriaDescriptiva = [
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: '1. MEMORIA DESCRIPTIVA',
          color: '000000',
          bold: true,
          size: 32,
        }),
      ],
    }),

    new Paragraph({
      text: '',
      spacing: { before: 120, after: 120 },
    }),

    new Paragraph({
      heading: HeadingLevel.HEADING_3,
      children: [
        new TextRun({
          text: '1.1 - OBJETO DE LA MEMORIA',
          color: '000000',
          bold: true,
          size: 32,
        }),
      ],
    }),
    new Paragraph({
      text: '',
      spacing: { before: 120, after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'La siguiente memoria tiene como objetivo proncipal legalización las reformas realizadas en el vehículo objeto de estudio, las cuales son:',
          color: '000000',
        }),
      ],
    }),
  ];

  const reparto = {
    masaReal: { del: 0.536, tras: 0.464 },
    ocupDel: { del: 0.78, tras: 0.22 },
    ocup2: { del: 0.96, tras: 0.04 },
    ocup3: { del: 0.0, tras: 0.0 },
    cargaUtil: { del: 0.105, tras: 0.895 },
  };
  const aientostotal = data.asientosDelanteros + 1;
  const ocupDelTotal = (aientostotal ?? 0) * 75;
  const ocup2Total = (data.asientos2Fila ?? 0) * 75;
  const ocup3Total = (data.asientos3Fila ?? 0) * 75;
  const cargaUtilTotal = Number(data.cargaUtilTotal ?? 0);
  const masaRealTotal = Number(data.masaRealDespues ?? 0) + 75;

  const masaRealDel = Math.round(masaRealTotal * reparto.masaReal.del);
  const masaRealTras = masaRealTotal - masaRealDel;

  const ocupDelDel = Math.round(ocupDelTotal * reparto.ocupDel.del);
  const ocupDelTras = ocupDelTotal - ocupDelDel;

  const ocup2Del = Math.round(ocup2Total * reparto.ocup2.del);
  const ocup2Tras = ocup2Total - ocup2Del;

  const ocup3Del = Math.round(ocup3Total * reparto.ocup3.del);
  const ocup3Tras = ocup3Total - ocup3Del;

  const cargaUtilDel = Math.round(cargaUtilTotal * reparto.cargaUtil.del);
  const cargaUtilTras = cargaUtilTotal - cargaUtilDel;

  const sumaDel = masaRealDel + ocupDelDel + ocup2Del + ocup3Del + cargaUtilDel;
  const sumaTras =
    masaRealTras + ocupDelTras + ocup2Tras + ocup3Tras + cargaUtilTras;

  function limpiarYParsear(valor: string): number | null {
    const limpio = valor?.replace(',', '.').trim();
    if (!limpio || limpio === '---' || isNaN(Number(limpio))) return null;
    return parseFloat(limpio);
  }

  const momAntes = limpiarYParsear(data.momAntes);
  const masaRealDespues = limpiarYParsear(data.masaRealDespues);
  let plazasDespues = limpiarYParsear(data.plazasDespues);

  function createCell(
    text: string,
    bold = false,
    widthPercent = 33,
    columnSpan?: number,
    center?: boolean
  ): TableCell {
    if (center) {
      return new TableCell({
        width: { size: widthPercent, type: WidthType.PERCENTAGE },
        columnSpan,
        margins: {
          top: 40,
          bottom: 40,
          left: 100,
          right: 100,
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text, bold, size: 20 })],
          }),
        ],
      });
    } else {
      return new TableCell({
        width: { size: widthPercent, type: WidthType.PERCENTAGE },
        columnSpan,
        margins: {
          top: 40,
          bottom: 40,
          left: 100,
          right: 100,
        },
        children: [
          new Paragraph({
            children: [new TextRun({ text, bold, size: 20 })],
          }),
        ],
      });
    }
  }

  const punto1_2DatosVehiculo = [
    new Paragraph({
      text: '',
      spacing: { before: 120, after: 120 },
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: {
        line: 360,
        after: 120,
      },
      children: [
        new TextRun({
          text: '1.3 - DATOS DEL VEHÍCULO',
          bold: true,
          color: '000000',
        }),
      ],
    }),
    new Paragraph({
      text: 'Las características del vehículo que nos ocupa en el presente proyecto son las siguientes:',
      spacing: { line: 260, after: 120 },
    }),
    new Paragraph({
      text: '',
      spacing: { before: 120, after: 120 },
    }),
    new Table({
      alignment: AlignmentType.CENTER,
      width: { size: 65, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.DASHED, size: 1, color: '000000' },
        bottom: { style: BorderStyle.DASHED, size: 1, color: '000000' },
        left: { style: BorderStyle.DASHED, size: 1, color: '000000' },
        right: { style: BorderStyle.DASHED, size: 1, color: '000000' },
        insideHorizontal: {
          style: BorderStyle.DASHED,
          size: 1,
          color: '000000',
        },
        insideVertical: { style: BorderStyle.DASHED, size: 1, color: '000000' },
      },
      rows: [
        new TableRow({
          children: [
            createCell('MARCA', true, 33),
            createCell(data.marca, false, 33),
          ],
        }),
        new TableRow({
          children: [
            createCell('TIPO/VARIANTE/VERSIÓN', true, 33),
            createCell(
              `${data.tipo} / ${data.variante} / ${data.version}`,
              false,
              33
            ),
          ],
        }),
        new TableRow({
          children: [
            createCell('DENOMINACIÓN COMERCIAL', true, 33),
            createCell(data.modelo, false, 33),
          ],
        }),
        new TableRow({
          children: [
            createCell('Nº de bastidor:', true, 33),
            createCell(data.bastidor, false, 33),
          ],
        }),
        new TableRow({
          children: [
            createCell('MATRÍCULA', true, 33),
            createCell(data.matricula, false, 33),
          ],
        }),
        new TableRow({
          children: [
            createCell('CLASIFICACIÓN', true, 33),
            createCell(data.clasificacion, false, 33),
          ],
        }),
        new TableRow({
          children: [
            createCell('FECHA 1ª MATRICULACIÓN', true, 33),
            createCell(
              data.fechaMatriculacion
                ? new Date(data.fechaMatriculacion).toLocaleDateString(
                    'es-ES',
                    {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    }
                  )
                : '',
              false,
              33
            ),
          ],
        }),
        new TableRow({
          children: [
            createCell('Nº DE HOMOLOGACIÓN', true, 33),
            createCell(data.homologacion, false, 33),
          ],
        }),
      ],
    }),

    new Paragraph({ pageBreakBefore: true }),

    // 1.3.1 Características antes de la reforma
    new Paragraph({
      heading: HeadingLevel.HEADING_4,
      spacing: {
        line: 260,
        after: 120,
      },
      children: [
        new TextRun({
          text: '1.3.1 Características del vehículo de serie',
          bold: true,
          color: '000000',
        }),
      ],
    }),
    new Paragraph({
      spacing: { line: 260, after: 120 },
      text: ' ',
    }),
    new Table({
      alignment: AlignmentType.CENTER,
      width: { size: 75, type: WidthType.PERCENTAGE },
      rows: [
        ['Longitud total (mm)', data.longitudAntes],
        ['Anchura (mm)', data.anchuraAntes],
        ['Altura total (mm)', data.alturaAntes],
        ['Voladizo trasero (mm)', data.voladizoAntes],
        ['Ancho de vía anterior', data.viaDelanteraAntes],
        ['Ancho de vía posterior', data.viaTraseraAntes],
        ['Neumáticos', data.neumaticoAntes, ''],
        ['Masa del vehículo en Orden de Marcha', data.momAntes],
        ['Masa máxima en carga técnicamente admisible (MMTA)', data.mmaAntes],
        [
          'Masa máxima en carga admisible prevista para matriculación/circulación (MMA)',
          data.mmaAntes,
        ],
        [
          'Masa máxima en carga técnicamente admisible en cada eje (MMTA 1°, 2° ...)',
          '1º ' + data.mmaEje1Antes + ' - 2º ' + data.mmaEje2Antes,
        ],
        [
          'Masa máxima en carga admisible prevista para matriculación/circulación en cada eje (MMA 1°, 2° ...)',
          '1º ' + data.mmaEje1Antes + ' - 2º ' + data.mmaEje2Antes,
        ],
        [
          'Masa máxima técnicamente admisible del conjunto (MMTC)',
          data.mmaConjuntoAntes,
        ],
        [
          'Masa máxima en carga admisible prevista para matriculación/circulación del conjunto (MMAC)',
          data.mmaConjuntoAntes,
        ],
        ['Clasificación', data.clasificacionAntes, ''],
        ['Nº de plazas de asiento', data.plazasAntes, ''],
      ].map(([label, value, unit], i) => {
        const isTwoColumnRow = !unit;
        return new TableRow({
          children: isTwoColumnRow
            ? [
                createCell(label, false, 50),
                createCell(value, false, 50, 2, true), // colspan de 2 columnas
              ]
            : [
                createCell(label, false, 50),
                createCell(value, false, 25),
                createCell(unit, false, 25),
              ],
        });
      }),
    }),

    new Paragraph({ pageBreakBefore: true }),

    // 1.3.2 Características después de la reforma
    new Paragraph({
      spacing: {
        line: 260,
        after: 120,
      },
      heading: HeadingLevel.HEADING_4,
      children: [
        new TextRun({
          text: '1.3.2 - Características del vehículo después de la reforma',
          bold: true,
          color: '000000',
        }),
      ],
    }),
    new Table({
      alignment: AlignmentType.CENTER,
      width: { size: 75, type: WidthType.PERCENTAGE },
      rows: [
        ['Longitud total (mm)', data.longitudDespues],
        ['Anchura (mm)', data.anchuraDespues],
        ['Altura total (mm)', data.alturaDespues],
        ['Voladizo trasero (mm)', data.voladizoDespues],
        ['Ancho de vía anterior', data.viaDelanteraDespues],
        ['Ancho de vías posterior', data.viaTraseraDespues],
        ['Neumáticos', data.neumaticoDespues],
        ['Masa del vehículo en Orden de Marcha', data.masaRealDespues],
        ['Masa máxima en carga técnicamente admisible (MMTA)', data.mmaDespues],
        [
          'Masa máxima en carga admisible prevista para matriculación/circulación (MMA)',
          data.mmaDespues,
        ],
        [
          'Masa máxima en carga técnicamente admisible en cada eje (MMTA 1°, 2° ...)',
          '1º ' + data.mmaEje1Despues + ' - 2º ' + data.mmaEje2Despues,
        ],
        [
          'Masa máxima en carga admisible prevista para matriculación/circulación en cada eje (MMA 1°, 2° ...)',
          '1º ' + data.mmaEje1Despues + ' - 2º ' + data.mmaEje2Despues,
        ],
        [
          'Masa máxima técnicamente admisible del conjunto (MMTC)',
          data.mmaConjuntoDespues,
        ],
        [
          'Masa máxima en carga admisible prevista para matriculación/circulación del conjunto (MMAC)',
          data.mmaConjuntoDespues,
        ],
        ['Clasificación', data.clasificacionDespues],
        ['Nº de plazas de asiento', data.plazasDespues],
      ].map(([label, value, unit]) => {
        const isTwoColumnRow = !unit;
        return new TableRow({
          children: isTwoColumnRow
            ? [
                createCell(label, false, 50),
                createCell(value, false, 50, 2, true), // colspan de 2 columnas
              ]
            : [
                createCell(label, false, 50),
                createCell(value, false, 25),
                createCell(unit, false, 25),
              ],
        });
      }),
    }),
  ];

  let parte2CalculosJustificativos: (Paragraph | Table)[] = [];

  if (momAntes === null || masaRealDespues === null) {
    parte2CalculosJustificativos = [
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 260, after: 120 },
        children: [
          new TextRun({
            text: '2. CÁLCULOS JUSTIFICATIVOS',
            bold: true,
            color: '000000',
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({
            text: 'd) Cálculo de la resistencia del bastidor',
            bold: true,
            underline: {},
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 240 },
        children: [
          new TextRun(
            'No se modifica ni el chasis ni el bastidor, tampoco modificaremos el MMA total del vehículo ni por eje por lo que por lo tanto la resistencia se considera que es suficiente la que trae de serie el vehículo.'
          ),
        ],
      }),
    ];
  } else {
    parte2CalculosJustificativos = [
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: '2. CÁLCULOS JUSTIFICATIVOS',
            color: '000000',
            bold: true,
            size: 32,
          }),
        ],
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: '2.1. REPARTO DE MASAS SOBRE LOS EJES',
            color: '000000',
            bold: true,
            size: 32,
          }),
        ],
      }),

      new Paragraph({
        text: 'a) Obtención de la Masa Real',
        spacing: { after: 200 },
      }),
      new Paragraph({
        spacing: { before: 120, after: 120 },
        text: 'Su valor se obtiene considerando las siguientes cargas:',
      }),
      new Paragraph({
        spacing: { before: 120, after: 120 },
        text: '1- Peso de la Tara del vehículo después de la reforma:',
      }),

      // Tabla: Tara Vehículo
      new Table({
        alignment: AlignmentType.CENTER,
        width: { size: 70, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
          left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
          right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
          insideHorizontal: {
            style: BorderStyle.SINGLE,
            size: 1,
            color: '000000',
          },
          insideVertical: {
            style: BorderStyle.SINGLE,
            size: 1,
            color: '000000',
          },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: '',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                verticalAlign: AlignmentType.CENTER,
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: 'Total',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                verticalAlign: AlignmentType.CENTER,
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: 'Delantero',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                verticalAlign: AlignmentType.CENTER,
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: 'Trasero',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                verticalAlign: AlignmentType.CENTER,
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: 'Tara Vehículo',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                verticalAlign: AlignmentType.CENTER,
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: data.taraTotal?.toString() ?? '-',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                verticalAlign: AlignmentType.CENTER,
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: data.taraDelante?.toString() ?? '-',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                verticalAlign: AlignmentType.CENTER,
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: data.taraDetras?.toString() ?? '-',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                verticalAlign: AlignmentType.CENTER,
              }),
            ],
          }),
        ],
      }),

      new Paragraph({
        text: 'Incluyéndose en este valor depósito de combustible',
        spacing: { before: 120, after: 120 },
      }),
      new Paragraph({
        text: '2- peso del conductor y ocupantes: Se consideran un valor de 75 kg por persona',
        spacing: { before: 120, after: 120 },
      }),

      // Tabla: Masa Real
      new Table({
        alignment: AlignmentType.CENTER,
        width: { size: 50, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [new Paragraph('Masa Real')],
                verticalAlign: AlignmentType.CENTER,
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph(
                    limpiarYParsear(data.masaRealDespues) !== null
                      ? (limpiarYParsear(data.masaRealDespues)! + 75).toString()
                      : ''
                  ),
                ],
                verticalAlign: AlignmentType.CENTER,
              }),
            ],
          }),
        ],
      }),

      new Paragraph({
        text: 'Nota: Mediante el pesaje del vehículo en báscula, se comprueba que la tara del vehículo después de la reforma ha sufrido un incremento superior al 3% permitido con respecto al vehículo de serie. Por esta razón, SÍ se considera necesario reflejar dicha modificación de peso en la ITV.',
        spacing: { before: 200, after: 200 },
      }),

      new Paragraph({
        spacing: { before: 120, after: 120 },
        text: 'b) Comprobaciones a efectuar',
      }),
      new Paragraph({
        spacing: { after: 120 },
        text: '1º) La Masa Real será en todo caso menor a los valores de MMA y MMTA para cualquier eje',
      }),
      new Paragraph({
        spacing: { after: 120 },
        text: '2º) La Masa Real, más el valor de 75 kg por ocupante adicional y una distribución uniforme de la carga útil será en todo caso menor a los valores de MMTA para cualquier eje.',
      }),

      new Paragraph({
        spacing: { before: 120, after: 120 },
        text: 'Datos que afectan al vehículo:',
      }),

      // Tabla: Datos que afectan
      new Table({
        alignment: AlignmentType.CENTER,
        width: { size: 80, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: 'Ocupantes adic.',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: data.ocupantesAdicionales?.toString() ?? '-',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: 'Carga vertical acopl',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: data.cargaverticalDespues?.toString() ?? '-',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: 'Total Kg ocup. Adicion.',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: (75 * plazasDespues!).toString(),
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: 'Resto ocup. Del',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: data.asientosDelanteros?.toString() ?? '-',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: 'MMA',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: data.mmaDespues,
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: 'ocupantes 2ª fila',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: data.asientos2Fila?.toString() ?? '-',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: 'MMA eje 1',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: data.mmaEje1Despues,
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: 'ocupantes 3ª fila',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: data.asientos3Fila?.toString() ?? '-',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: 'MMA eje 2',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: data.mmaEje2Despues,
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: 'Peso ocupante',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: '75',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: 'Carga útil',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: data.cargaUtilTotal?.toString() ?? '-',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),

      // Tabla: Resultados por eje
      new Paragraph({
        spacing: { before: 120, after: 120 },
        text: 'c) Resultados obtenidos:',
      }),
      new Paragraph({
        spacing: { before: 120, after: 120 },
        text: 'El reparto de cargas por ejes y las distintas comprobaciones queda reflejado en la siguiente tabla.',
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: '',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'Distancia entre ejes',
                        bold: true,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                columnSpan: 2,
                children: [
                  new Paragraph({
                    text: data.distanciaEntreEjes?.toString() ?? '-',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: '',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
            ],
          }),

          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: '',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    text: '',
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'Total',
                        bold: true,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'Delantero',
                        bold: true,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'Trasero',
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
              // esta celda abarcará 2 filas (rowSpan)
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'Distancia CDG a eje delantero (mm)',
                        bold: true,
                      }),
                    ],
                  }),
                ],
              }),
              // etiqueta “Tara del vehículo tras la reforma”
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'Tara del vehículo tras la reforma',
                        bold: true,
                      }),
                    ],
                  }),
                ],
              }),
              // encabezados de columnas de datos
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: data.mmaDespues?.toString() ?? '-',
                        bold: true,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: data.mmaEje1Despues?.toString() ?? '-',
                        bold: true,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: data.mmaEje2Despues?.toString() ?? '-',
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
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: data.cdgconductor?.toString() ?? '-',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: 'Conductor',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: '75',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: '58',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: '17',
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
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: '',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: 'Masa Real',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text:
                          limpiarYParsear(data.masaRealDespues) !== null
                            ? (
                                limpiarYParsear(data.masaRealDespues)! + 75
                              ).toString()
                            : '',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: masaRealDel.toString(),
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: masaRealTras.toString(),
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
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: data.cdgocdelant?.toString() ?? '-',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'Ocup. Delant',
                        bold: true,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: (data.asientosDelanteros * 75)?.toString() ?? '-',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: ocupDelDel.toString() ?? '-',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: ocupDelTras.toString() ?? '-',
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
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: data.cdgocu2?.toString() ?? '-',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'Ocup. 2ª fila',
                        bold: true,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: (data.asientos2Fila * 75)?.toString() ?? '-',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: ocup2Del.toString() ?? '-',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: ocup2Tras.toString() ?? '-',
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
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: data.cdgocu3?.toString() ?? '-',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'Ocup. 3ª fila',
                        bold: true,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: (data.asientos3Fila * 75)?.toString() ?? '-',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: ocup3Del.toString() ?? '-',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: ocup3Tras.toString() ?? '-',
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
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: data.cdgcargautil?.toString() ?? '-',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'Carga útil',
                        bold: true,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: data.cargaUtilTotal?.toString() ?? '-',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: cargaUtilDel.toString() ?? '-',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: cargaUtilTras.toString() ?? '-',
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
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: '',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'Suma de cargas',
                        bold: true,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text:
                          (
                            Number(data.cargaUtilTotal) +
                            75 +
                            Number(data.masaRealDespues) +
                            Number(data.asientosDelanteros) +
                            Number(data.asientos2Fila) +
                            Number(data.asientos3Fila)
                          )?.toString() ?? '-',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: sumaDel.toString() ?? '-',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: sumaTras.toString() ?? '-',
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
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: '',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'MMA',
                        bold: true,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: data.mmaDespues })],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: data.mmaEje1Despues })],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: data.mmaEje2Despues })],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),

      new Paragraph({
        spacing: { before: 120, after: 120 },
        children: [
          new TextRun(
            'A continuación realizaremos de nuevo el reparto de cargas teniendo en cuenta una carga vertical en el punto de acoplamiento de '
          ),
          new TextRun({
            text: 'LO QUE MARQUE LA HOMOLOGACIÓN O 4% DE LA MMR',
            color: 'FF0000',
            bold: false,
            allCaps: false,
          }),
          new TextRun('.'),
        ],
      }),

      new Paragraph({ pageBreakBefore: true }),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          // Fila 1
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: 'Distancia CDG a eje delantero (mm)',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: 'Tara del vehículo tras la reforma',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: data.mmaDespues.toString(),
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: data.mmaEje1Despues.toString(),
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: data.mmaEje2Despues.toString(),
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
            ],
          }),
          // Fila 2
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: data.cdgconductor?.toString() ?? '-',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: 'Conductor',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: '75',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: '58',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: '17',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
            ],
          }),
          // Fila 3
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [new Paragraph('')],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: 'Masa Real',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text:
                      limpiarYParsear(data.masaRealDespues) !== null
                        ? (
                            limpiarYParsear(data.masaRealDespues)! + 75
                          ).toString()
                        : '',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: masaRealDel.toString(),
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: masaRealTras.toString(),
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
            ],
          }),
          // Fila 4 (Ocup. Delant)
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: data.cdgocdelant?.toString() ?? '-',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({ text: 'Ocup. Delant', bold: true }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: (data.asientosDelanteros * 75).toString(),
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: ocupDelDel.toString(),
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: ocupDelTras.toString(),
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
            ],
          }),
          // Fila 5 (Ocup. 2ª fila)
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: data.cdgocu2?.toString() ?? '-',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({ text: 'Ocup. 2ª fila', bold: true }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: (data.asientos2Fila * 75).toString(),
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: ocup2Del.toString(),
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: ocup2Tras.toString(),
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
            ],
          }),
          // Fila 6 (Ocup. 3ª fila)
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: data.cdgocu3?.toString() ?? '-',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({ text: 'Ocup. 3ª fila', bold: true }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: (data.asientos3Fila * 75).toString(),
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: ocup3Del.toString(),
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: ocup3Tras.toString(),
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
            ],
          }),
          // Fila 7 (Carga útil)
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    text: data.cdgcargautil?.toString() ?? '-',
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: 'Carga útil', bold: true })],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({ text: data.cargaUtilTotal.toString() }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: cargaUtilDel.toString() })],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: cargaUtilTras.toString() })],
                  }),
                ],
              }),
            ],
          }),
          // Fila 8
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: data.cdgcargavert?.toString() ?? '-',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: 'Carga vert. Acopl.' })],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({ text: data.cargaverticalDespues }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: isNaN(parseFloat(data.cargaverticalDespues))
                          ? '---'
                          : (
                              parseFloat(data.cargaverticalDespues) * 0.975
                            ).toFixed(2),
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: isNaN(parseFloat(data.cargaverticalDespues))
                          ? '---'
                          : (
                              parseFloat(data.cargaverticalDespues) * 0.025
                            ).toFixed(2),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          // Fila 9
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: '' })],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: 'Suma de cargas' })],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text:
                          (
                            Number(data.cargaUtilTotal) +
                            75 +
                            Number(data.masaRealDespues) +
                            Number(data.asientosDelanteros) +
                            Number(data.asientos2Fila) +
                            Number(data.asientos3Fila)
                          )?.toString() ?? '-',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: sumaDel.toString() })],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: sumaTras.toString() })],
                  }),
                ],
              }),
            ],
          }),
          // Fila 10
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: '' })],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: 'MMA' })],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: data.mmaDespues })],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: data.mmaEje1Despues })],
                  }),
                ],
              }),
              new TableCell({
                margins: { top: 40, bottom: 40, left: 40, right: 40 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: data.mmaEje2Despues })],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),

      // Conclusiones
      new Paragraph({
        spacing: { before: 120, after: 120 },
        text: 'Conclusiones',
      }),
      new Paragraph({
        spacing: { after: 120 },
        text: '1.- El reparto de cargas por eje no supera los máximos permitidos por el fabricante',
      }),
      new Paragraph({
        spacing: { after: 120 },
        text: '2.- La masa en cualquier condición en cada uno de los ejes, siempre supera el 25 % de la MMA',
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: '3.- Se comprueba que no se supera más del 15% la carga máxima técnicamente admisible en el eje trasero ni más del 10% o 100 Kg la masa máxima técnicamente admisible en carga.',
            color: 'FF0000',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: '4.- El vehículo no podrá superar la velocidad de 100Km/h cuando lleve instalado el remolque.',
            color: 'FF0000',
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({
            text: 'd) Cálculo de la resistencia del bastidor',
            bold: true,
            underline: {},
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 240 },
        children: [
          new TextRun(
            'No se modifica ni el chasis ni el bastidor, tampoco modificaremos el PMA total del vehículo ni por eje por lo que por lo tanto la resistencia se considera que es suficiente la que trae de serie el vehículo.'
          ),
        ],
      }),
    ];
  }

  async function generarPrevios(data: any): Promise<(Paragraph | Table)[]> {
    // 1) Normalizar orientación de los 4 primeros File a Blob
    const raw = (data.prevImages as File[]).slice(0, 4);
    const blobs = await Promise.all(raw.map((f) => normalizeOrientation(f)));

    // 2) Extraer buffer, dimensiones y mimeType
    const infos: ImageInfo[] = await Promise.all(
      blobs.map(async (blob) => {
        const buffer = await blob.arrayBuffer();
        const url = URL.createObjectURL(blob);
        const img = new Image();
        await new Promise<void>((res, rej) => {
          img.onload = () => res();
          img.onerror = () => rej('No cargó la imagen');
          img.src = url;
        });
        URL.revokeObjectURL(url);
        return {
          buffer,
          width: img.naturalWidth,
          height: img.naturalHeight,
          mimeType: blob.type,
        };
      })
    );

    // 3) Párrafos iniciales
    const salto = new Paragraph({ pageBreakBefore: true });
    const title = new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: 'ANEXO 1 - FOTOGRAFÍAS DEL VEHÍCULO DESPUÉS DE LA REFORMA',
          bold: true,
          size: 28,
        }),
      ],
    });

    // 4) Construir tabla 2×1 + 1×2 + 1×2
    function buildPreviosTable(images: ImageInfo[]): Table {
      const maxW1 = 300,
        maxH1 = 200;
      const maxW2 = maxW1 * 2 + 20,
        maxH2 = 275;
      const scale = (info: ImageInfo, mw: number, mh: number) => {
        const s = Math.min(mw / info.width, mh / info.height, 1);
        return {
          width: Math.round(info.width * s),
          height: Math.round(info.height * s),
        };
      };

      const rows: TableRow[] = [];

      // Fila 1: dos celdas al 50%
      {
        const [L, R] = images;
        const sL = scale(L, maxW1, maxH1);
        const sR = scale(R, maxW1, maxH1);
        rows.push(
          new TableRow({
            children: [L, R].map(
              (info, i) =>
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  margins: { top: 50, bottom: 50, left: 50, right: 50 },
                  borders: {
                    top: { style: BorderStyle.NONE, size: 0 },
                    bottom: { style: BorderStyle.NONE, size: 0 },
                    left: { style: BorderStyle.NONE, size: 0 },
                    right: { style: BorderStyle.NONE, size: 0 },
                  },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new ImageRun({
                          data: info.buffer,
                          transformation: i === 0 ? sL : sR,
                          type: mimeToExt(info.mimeType),
                        }),
                      ],
                    }),
                  ],
                })
            ),
          })
        );
      }

      // Fila 2: imagen 3 spanning 2 columnas
      {
        const I = images[2],
          s = scale(I, maxW2, maxH2);
        rows.push(
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 2,
                verticalAlign: AlignmentType.CENTER,
                margins: { top: 50, bottom: 50, left: 50, right: 50 },
                borders: {
                  top: { style: BorderStyle.NONE, size: 0 },
                  bottom: { style: BorderStyle.NONE, size: 0 },
                  left: { style: BorderStyle.NONE, size: 0 },
                  right: { style: BorderStyle.NONE, size: 0 },
                },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new ImageRun({
                        data: I.buffer,
                        transformation: s,
                        type: mimeToExt(I.mimeType),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          })
        );
      }

      // Fila 3: imagen 4 spanning 2 columnas
      {
        const I = images[3],
          s = scale(I, maxW2, maxH2);
        rows.push(
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 2,
                verticalAlign: AlignmentType.CENTER,
                margins: { top: 50, bottom: 50, left: 50, right: 50 },
                borders: {
                  top: { style: BorderStyle.NONE, size: 0 },
                  bottom: { style: BorderStyle.NONE, size: 0 },
                  left: { style: BorderStyle.NONE, size: 0 },
                  right: { style: BorderStyle.NONE, size: 0 },
                },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new ImageRun({
                        data: I.buffer,
                        transformation: s,
                        type: mimeToExt(I.mimeType),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          })
        );
      }

      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE, size: 0 },
          bottom: { style: BorderStyle.NONE, size: 0 },
          left: { style: BorderStyle.NONE, size: 0 },
          right: { style: BorderStyle.NONE, size: 0 },
          insideHorizontal: { style: BorderStyle.NONE, size: 0 },
          insideVertical: { style: BorderStyle.NONE, size: 0 },
        },
        rows,
      });
    }

    const prevTable = buildPreviosTable(infos);
    return [salto, title, prevTable];
  }

  const anexosPrevios = await generarPrevios(data);

  async function generarPosteriores(data: any): Promise<(Paragraph | Table)[]> {
    // 1️⃣ Normalizas los File a Blob rotados
    const rawFiles = data.postImages as File[];
    const orientedBlobs = await Promise.all(
      rawFiles.map((f) => normalizeOrientation(f))
    );

    // 2️⃣ Lees el arrayBuffer y guardas también el mimeType
    const infos: ImageInfo[] = await Promise.all(
      orientedBlobs.map(async (blob) => {
        const buffer = await blob.arrayBuffer();
        const url = URL.createObjectURL(blob);
        const img = new Image();
        await new Promise<void>((res, rej) => {
          img.onload = () => res();
          img.onerror = () => rej(new Error('No cargó la imagen'));
          img.src = url;
        });
        URL.revokeObjectURL(url);
        return {
          buffer,
          width: img.naturalWidth,
          height: img.naturalHeight,
          mimeType: blob.type,
        };
      })
    );

    // 3️⃣ Construye tabla con imágenes
    function buildPreviosTable(images: ImageInfo[]): Table {
      const rows: TableRow[] = [];
      const maxCellWidth = 300;
      const maxCellHeight = 250;

      for (let i = 0; i < images.length; i += 2) {
        const left = images[i];
        const right = images[i + 1];

        const scaleL = Math.min(
          maxCellWidth / left.width,
          maxCellHeight / left.height,
          1
        );
        const wL = Math.round(left.width * scaleL);
        const hL = Math.round(left.height * scaleL);

        let wR = 0,
          hR = 0;
        if (right) {
          const scaleR = Math.min(
            maxCellWidth / right.width,
            maxCellHeight / right.height,
            1
          );
          wR = Math.round(right.width * scaleR);
          hR = Math.round(right.height * scaleR);
        }

        rows.push(
          new TableRow({
            children: [
              new TableCell({
                verticalAlign: AlignmentType.CENTER,
                width: { size: 50, type: WidthType.PERCENTAGE },
                margins: { top: 50, bottom: 50, left: 50, right: 50 },
                borders: {
                  top: { style: BorderStyle.NONE, size: 0 },
                  bottom: { style: BorderStyle.NONE, size: 0 },
                  left: { style: BorderStyle.NONE, size: 0 },
                  right: { style: BorderStyle.NONE, size: 0 },
                },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new ImageRun({
                        data: left.buffer,
                        transformation: { width: wL, height: hL },
                        type: mimeToExt(left.mimeType),
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                verticalAlign: AlignmentType.CENTER,
                width: { size: 50, type: WidthType.PERCENTAGE },
                margins: { top: 50, bottom: 50, left: 50, right: 50 },
                borders: {
                  top: { style: BorderStyle.NONE, size: 0 },
                  bottom: { style: BorderStyle.NONE, size: 0 },
                  left: { style: BorderStyle.NONE, size: 0 },
                  right: { style: BorderStyle.NONE, size: 0 },
                },
                children: right
                  ? [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new ImageRun({
                            data: right.buffer,
                            transformation: { width: wR, height: hR },
                            type: mimeToExt(right.mimeType),
                          }),
                        ],
                      }),
                    ]
                  : [new Paragraph('')],
              }),
            ],
          })
        );
      }

      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE, size: 0 },
          bottom: { style: BorderStyle.NONE, size: 0 },
          left: { style: BorderStyle.NONE, size: 0 },
          right: { style: BorderStyle.NONE, size: 0 },
          insideHorizontal: { style: BorderStyle.NONE, size: 0 },
          insideVertical: { style: BorderStyle.NONE, size: 0 },
        },
        rows,
      });
    }

    // 4️⃣ Crea la tabla
    const prevTable = buildPreviosTable(infos);

    // 5️⃣ 🔹 Añade título centrado y subrayado antes de la tabla
    const tituloPosteriores = new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: 'ANEXO 2 - FOTOGRAFÍAS DE LOS ELEMENTOS SUSTITUIDOS',
          bold: true,
          size: 28,
        }),
      ],
    });

    // 6️⃣ Devuelve título + tabla
    return [tituloPosteriores, prevTable];
  }

  function mimeToExt(mime: string): 'jpg' | 'png' | 'gif' | 'bmp' {
    const sub = mime.split('/')[1]?.toLowerCase();
    switch (sub) {
      case 'jpeg':
      case 'pjpeg':
        return 'jpg';
      case 'png':
        return 'png';
      case 'gif':
        return 'gif';
      case 'bmp':
        return 'bmp';
      default:
        return 'png'; // nunca devolvemos 'svg'
    }
  }

  // Función auxiliar para construir la tabla 2×N
  function normalizeOrientation(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      loadImage(
        file,
        (canvas) => {
          if (!(canvas instanceof HTMLCanvasElement)) {
            return reject('Error al procesar imagen');
          }
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject('No se pudo generar Blob');
          }, file.type);
        },
        { canvas: true, orientation: true }
      );
    });
  }

  const anexosPorsteriores = await generarPosteriores(data);

  const section2 = {
    properties: { type: SectionType.NEXT_PAGE, pageNumberStart: 1 },
    headers: { default: header },
    footers: { default: makeFooter() },
    children: [
      ...punto1_1MemoriaDescriptiva,
      ...buildModificacionesParagraphs(modificaciones, data),
      ...punto1_2DatosVehiculo,
      ...parte2CalculosJustificativos,
      ...(await buildCalculos(data.modificaciones, data)),
      ...anexosPrevios,
      ...anexosPorsteriores,
    ]
      .flat()
      .filter((child) => child !== null),
  };

  //5) Monta y descarga el documento
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            size: 22,
          },
        },
      },
    },
    sections: [section1, section2],
  });

  //2) Empaqueta y descarga
  const blob = await Packer.toBlob(doc);
  saveAs(
    blob,
    `${data.referenciaProyecto.replace('PTRV', 'MT') || ''} MEMORIA TECNICA ${
      data.marca
    } ${data.modelo} ${data.matricula}.docx`
  );
}
