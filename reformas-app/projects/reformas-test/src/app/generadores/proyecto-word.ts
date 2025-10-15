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

export async function generarDocumentoProyecto(data: any): Promise<Blob> {
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
        text: 'REF.: ' + data.referenciaProyecto,
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
        text: 'PROYECTO TÉCNICO DE REFORMA DE VEHÍCULO',
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
        ['CONTRASEÑA HOMOLOG.', data.homologacion],
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
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 4,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'CODIGOS DE REFORMA (CR) según RD 866/2010',
                    size: 22,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: data.codigosReforma,
                    bold: true,
                    size: 22,
                  }),
                ],
              }),
            ],
            margins: { top: 150, bottom: 150, left: 150, right: 150 },
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 4,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'TITULAR: ' + data.propietario,
                    bold: true,
                    size: 22,
                  }),
                ],
              }),
            ],
            margins: { top: 150, bottom: 150, left: 150, right: 150 },
          }),
        ],
      }),
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
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: 'FIRMADO:', bold: true })],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: ingeniero.nombre, bold: true })],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: ingeniero.colegiado,
                    bold: true,
                  }),
                ],
              }),
            ],
            borders: {
              top: { style: BorderStyle.DOTTED, size: 1, color: '000000' },
              bottom: { style: BorderStyle.DOTTED, size: 1, color: '000000' },
              left: { style: BorderStyle.DOTTED, size: 1, color: '000000' },
              right: { style: BorderStyle.DOTTED, size: 1, color: '000000' },
            },
            margins: { top: 50, bottom: 50, left: 50, right: 50 },
          }),
          new TableCell({
            children: [],
            width: { size: 35, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.DOTTED, size: 1, color: '000000' },
              bottom: { style: BorderStyle.DOTTED, size: 1, color: '000000' },
              left: { style: BorderStyle.DOTTED, size: 1, color: '000000' },
              right: { style: BorderStyle.DOTTED, size: 1, color: '000000' },
            },
          }),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  const webLink = new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new ExternalHyperlink({
        link: ingeniero.url,
        children: [
          new TextRun({
            text: ingeniero.web.toUpperCase(),
            font: 'Arial',
            size: 72,
            bold: true,
            italics: true,
            allCaps: true,
            color: '0000FF',
            underline: {
              type: UnderlineType.SINGLE,
              color: '0000FF',
            },
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
                        text: 'REF.: ' + data.referenciaProyecto,
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

  // 2) Función para crear footers, encapsulando el PageNumber en un TextRun
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
      new Paragraph({ text: '', spacing: { before: 400 } }),
      webLink,

      new Paragraph({ pageBreakBefore: true }),
      // Página 2: índice
      new Paragraph({
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.HEADING_1,
        children: [
          new TextRun({
            text: 'Índice',
            bold: true,
            size: 32,
            color: '000000',
          }),
        ],
      }),
      new TableOfContents('Índice', {
        hyperlink: true,
        headingStyleRange: '1-4',
      }),
    ],
  };

  // 4) Punto 1.1
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
      spacing: { before: 120, after: 120 },
      children: [
        new TextRun({
          text: '1.1 - OBJETO DEL PROYECTO',
          color: '000000',
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun(
          'El siguiente proyecto técnico tiene como objeto principal la reforma y sustitución de algunas de las partes de un vehículo marca '
        ),
        new TextRun({ text: data.matricula, bold: true }),
        new TextRun(' denominación '),
        new TextRun({ text: data.modelo, bold: true }),
        new TextRun(' con número de bastidor '),
        new TextRun({ text: data.bastidor, bold: true }),
        new TextRun(' para mejorar su funcionamiento.'),
      ],
      spacing: {
        line: 260,
        after: 120,
      },
    }),
    new Paragraph({
      spacing: {
        line: 260,
        after: 120,
      },
      children: [
        new TextRun({
          text: 'Se redactarán los criterios, procedimientos y requisitos que se han de cumplir para la tramitación de las reformas según el RD 866/2010 por el que se regula la tramitación de las reformas de vehículos y el Manual de Reforma de Vehículos, en la categoría ',
        }),
        new TextRun({
          text: data.categoria,
          bold: true,
        }),
        new TextRun({
          text: ', así como legalizar y homologar las reformas del presente vehículo acogiéndose a la normativa vigente y obteniendo las autorizaciones pertinentes para la circulación del mismo por vías públicas.',
        }),
      ],
    }),
    new Paragraph({
      spacing: {
        line: 260,
        after: 120,
      },
      text: 'También se tendrá en cuenta el Reglamento General de Vehículos y la normativa del fabricante.',
    }),
    new Paragraph({
      spacing: {
        line: 260,
        after: 120,
      },
      text: 'En este caso el órgano del gobierno que nos facilitará la normativa aplicada a dicha reforma y nos proporcionará las acreditaciones necesarias será el Ministerio de Industria, Comercio y Turismo.',
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_4,
      spacing: { before: 120, after: 120 },
      children: [
        new TextRun({
          text: '1.1.1 - Autor del proyecto',
          color: '000000',
          bold: true,
        }),
      ],
    }),
    ...[
      'Nombre: ' + ingeniero.nombre,
      'DNI: ' + ingeniero.dni,
      'Domicilio: ' + ingeniero.direccionFiscal + ' - ' + ingeniero.oficina,
      'Localidad: ' +
        ingeniero.codigoPostal +
        ' – ' +
        ingeniero.localidad +
        ' (' +
        ingeniero.provincia +
        ')',
      'Titulación: ' + ingeniero.titulacion,
      'Colegiado: ' + ingeniero.colegiado,
      'E-mail: ' + ingeniero.correoEmpresa,
    ].map(
      (linea) =>
        new Paragraph({
          text: '– ' + linea,
          spacing: {
            line: 240,
            after: 80,
          },
          indent: {
            left: 360, // equivale a 0.5 pulgadas ≈ 1.27 cm
          },
        })
    ),
  ];

  const texto = data.reformasPrevias
    ? data.descripcionReformas || ''
    : 'No procede';

  const partes = texto.split(/\r?\n/);
  const children: TextRun[] = [];
  partes.forEach((linea: any, i: number) => {
    // si hay líneas vacías, mantenlas
    children.push(new TextRun({ text: linea }));
    if (i < partes.length - 1)
      children.push(new TextRun({ text: ' - ', break: 1 }));
  });

  const punto1_2Antecedentes = [
    new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 120, after: 120 },
      children: [
        new TextRun({
          text: '1.2 - ANTECEDENTES',
          color: '000000',
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      spacing: {
        line: 260,
        after: 120,
      },
      text: 'Conforme al Manual de Reformas de Vehículos vigente, publicado por el Ministerio de Industria, Comercio y Turismo, la citada reforma se encuadra dentro de los siguientes puntos:',
    }),
    ...Object.values(data.codigosDetallados)
      .flat()
      .map(
        (item: any) =>
          new Paragraph({
            spacing: {
              line: 260,
              after: 120,
            },
            children: [
              new TextRun({ text: `${item.codigo} - `, bold: true }),
              new TextRun(item.descripcion),
            ],
          })
      ),
    new Paragraph({
      spacing: {
        line: 260,
        after: 120,
      },
      text: 'Reformas efectuadas anteriormente:',
    }),
    new Paragraph({
      spacing: { line: 260, after: 120 },
      children, // 👈 en vez de "text: ..."
    }),
    new Paragraph({
      pageBreakBefore: true,
    }),
  ];

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

  // 1.3 - DATOS DEL VEHÍCULO
  const punto1_3DatosVehiculo = [
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
      text: 'Se utiliza el formato de ficha reducida contemplado en el Real Decreto 750/2010 indicando únicamente las características que cambian antes y después de la reforma o aquellos conceptos que el proyectista considera oportuno señalar del vehículo objeto de este proyecto.',
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

  const punto1_4Normativa = [
    new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 260, after: 120 },
      children: [
        new TextRun({
          text: '1.4- REGLAMENTACIÓN Y NORMATIVA DE APLICACIÓN',
          bold: true,
          color: '000000',
        }),
      ],
    }),
    new Paragraph({
      spacing: { line: 260, after: 120 },
      text: 'Para la realización del presente proyecto técnico que describe la reforma a legalizar se ha tenido en cuenta la siguiente reglamentación:',
    }),
    ...[
      'Real Decreto 866/2010, de 2 de julio, por el que se regula la tramitación de las reformas de vehículos.',
      'Manual de Reformas de Vehículos en vigor.',
      'Real Decreto 750/2010, de 4 de junio, por el que se regulan los procedimientos de homologación de vehículos a motor y sus remolques, máquinas autopropulsadas o remolcadas, vehículos agrícolas, así como de sistemas, partes y piezas de dichos vehículos.',
      'Reglamento ECE 26 - Salientes exteriores en los vehículos.',
      'Real Decreto 2028/1986, de 6 de junio, por el que se dictan normas para la aplicación de determinadas Directivas de la CEE, relativas a la homologación de tipos de vehículos automóviles, remolques y semirremolques, así como de partes y piezas de dichos vehículos.',
      'Orden ITC/1900/2006, de 13 de junio de 2006, por la que se actualizan los anexos I y II del RD 2028/1986.',
      'Real Decreto 2822/1998, de 23 de diciembre, por el que se aprueba el Reglamento General de Vehículos.',
      'Orden de 15 de septiembre de 2000, por la que se modifica el anexo XVIII “Placas de matrícula”, del Reglamento General de Vehículos.',
      'Orden PRE/3298/2004, de 13 de octubre, por la que se modifica el anexo IX “Masas y Dimensiones”, del Reglamento General de Vehículos.',
      'Real Decreto 1644/2008, de 10 de octubre, por el que se establecen las normas para la comercialización y puesta en servicio de las máquinas.',
      'Real decreto 1215/1997, de 18 de julio, por el que se establecen las disposiciones mínimas de seguridad y salud para la utilización por los trabajadores de los equipos de trabajo.',
    ].map(
      (texto) =>
        new Paragraph({
          bullet: { level: 0 },
          spacing: { line: 260, after: 120 },
          children: [new TextRun({ text: texto })],
        })
    ),
    new Paragraph({
      heading: HeadingLevel.HEADING_4,
      spacing: { before: 260, after: 120 },
      children: [
        new TextRun({
          text: '1.4.1 - Normativa aplicable en relación a los actos reglamentarios (AR) afectados por la reforma.',
          bold: true,
          color: '000000',
        }),
      ],
    }),
    ...[
      'De acuerdo a lo indicado en la versión en vigor del MANUAL DE REFORMAS DE VEHICULOS la reforma a realizar sobre el vehículo afectan a los siguientes Actos Reglamentarios (AR).',
      'Los AR se aplicarán según columna 3 o requisitos alternativos de la columna 4 del Anexo I del Real Decreto 2028/1986, de 6 de junio, teniendo en cuenta los siguientes criterios de aplicación:',
      '(1) El AR se aplica en su última actualización en vigor, a fecha de tramitación de la reforma.',
      '(2) El AR se aplica en la actualización en vigor en la fecha de la primera matriculación del vehículo, si la homologación del mismo exige el AR incluido en la tabla. En caso que el AR no fuera exigido para la homologación del vehículo en la fecha de su primera matriculación, se deberá aplicar al menos el AR en la primera versión incluida en el Real Decreto 2028/1986, de 6 de junio, como obligatorio (A).',
      '(3) El AR se aplica en la actualización previa a la entrada en vigor de los Reglamentos',
      'Delegados y de Ejecución que desarrollan los Reglamentos (UE) nº 167/2013 o 168/2013.',
      '(-) El AR no es aplicable a la categoría del vehículo.',
      '(X) No es posible realizar la reforma al vehículo, coincidiendo en este caso con un NO en el campo de aplicación para esa categoría.',
      'En el caso de que la reforma implique cambio de categoría, los AR no afectados por la/las reforma/s, se aplicarán en la actualización en vigor en la fecha de la primera matriculación del vehículo para la nueva categoría.',
      'Para el estudio del AR el emisor del informe analizará únicamente los puntos del mismo que se vean afectados por la reforma.',
      'En el caso de que la transformación afecte al cumplimiento de varios CR, se aplicará siempre el nivel más restrictivo de los AR implicados en la misma.',
      'Cuando la reforma no afecte al cumplimiento de alguno de los actos reglamentarios especificados en cada uno de los códigos de reformas descritos en el Manual, se especificará explícitamente en el correspondiente Informe de Conformidad que el acto reglamentario no se ve afectado por la misma, indicando el número de informe donde se justifica o el número de la homologación de tipo.',
      'Los AR aplicables se justificarán tal como se establece en el punto 5.3 (informe de conformidad).',
    ].map(
      (texto) =>
        new Paragraph({
          spacing: { line: 260, after: 120 },
          children: [new TextRun({ text: texto })],
        })
    ),
  ];

  const codigosImagenes = Object.values(data.codigosDetallados ?? {}).flat();
  const tamañosResp = await fetch('http://192.168.1.41:3000/image-sizes');
  const tamaños = await tamañosResp.json();

  let alturaAcumulada = 0;
  const alturaMaximaPagina = 700; // Aproximadamente útil en pt (842pt - márgenes)

  for (const codigo of codigosImagenes) {
    if (
      typeof codigo !== 'object' ||
      codigo === null ||
      typeof (codigo as any).codigo !== 'string'
    ) {
      continue;
    }
    const codigoStr = (codigo as { codigo: string }).codigo;
    const nombreBase = codigoStr.replace('.', '-');
    const nombreArchivo = `${nombreBase}.png`;
    const url = `http://192.168.1.41:3000/imgs/${nombreArchivo}`;
    const tamaño = tamaños.find(
      (img: { nombre: string }) => img.nombre === nombreArchivo
    );

    if (!tamaño) continue;

    try {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();

      const escala = 500 / tamaño.width;
      const alturaEscalada = Math.round(tamaño.height * escala);

      // 🔁 Verificar si cabe en la página actual
      if (alturaAcumulada + alturaEscalada > alturaMaximaPagina) {
        punto1_4Normativa.push(new Paragraph({ pageBreakBefore: true }));
        alturaAcumulada = 0;
      }

      punto1_4Normativa.push(
        new Paragraph({
          spacing: { line: 260, after: 60 },
          children: [
            new TextRun({
              text: `Reforma ${(codigo as { codigo: string }).codigo}`,
              bold: true,
              break: 1,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: buffer,
              transformation: {
                width: 500,
                height: alturaEscalada,
              },
              type: 'png',
            }),
          ],
        })
      );

      alturaAcumulada += alturaEscalada + 100; // Añadimos margen entre imágenes
    } catch (err) {
      console.warn(
        `No se pudo cargar la imagen para el código ${
          (codigo as { codigo: string }).codigo
        }`
      );
    }
  }

  const punto1_5Consideraciones = [
    new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 260, after: 120 },
      children: [
        new TextRun({
          text: '1.5- CONSIDERACIONES GENERALES',
          bold: true,
          color: '000000',
        }),
      ],
    }),
    ...[
      'Una vez expuesto el listado de reformas pasamos a la explicación más detallada del proceso de realización en cada una de ellas.',
      'Es importante señalar que los elementos añadidos al vehículo en esta reforma serán suministrados por una empresa especializada en vehículos, por lo que no serán diseñados a lo largo de este proyecto, ya que todos han sido previamente creados específicamente para el modelo de vehículo que vamos a reformar, siguiendo los patrones del fabricante del vehículo. Por lo tanto es el fabricante el encargado del diseño de las piezas y del cumplimiento de las normativas europeas, adquiriendo así los certificados de calidad y códigos de homologación, así como el marcado CE de los mismos, para su posterior puesta en venta en el mercado.',
      'El montaje de las piezas enumeradas deberá realizarse en un taller autorizado y especializado en este tipo de trabajos. El personal que lleve a cabo la transformación deberá poseer suficientes conocimientos en este tipo de montajes. En el momento en el que finalice la reforma, el taller deberá expedir un certificado de taller por las reformas realizadas.',
      'Los trabajos de instalación de los elementos especificados anteriormente se realizarán previo desmontaje de los elementos sustituidos, incluyendo el desmontaje y acoplamiento posterior de todos aquellos otros elementos que faciliten el montaje definitivo.',
    ].map(
      (texto) =>
        new Paragraph({
          spacing: { line: 260, after: 120 },
          children: [new TextRun({ text: texto })],
        })
    ),

    new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 260, after: 120 },
      children: [
        new TextRun({
          text: '1.6- IDENTIFICACIÓN DE LAS REFORMAS A REALIZAR',
          bold: true,
          color: '000000',
        }),
      ],
    }),

    new Paragraph({
      spacing: { before: 260, after: 120 },
      children: [
        new TextRun({
          text: 'En el vehículo descrito en el apartado anterior se realizará la reforma consistente en: ',
        }),
      ],
    }),
  ];

  const punto1_6Tabla = [
    ...(data.tipoVehiculo === 'coche'
      ? [
          (() => {
            // 1) Definimos los elementos con la clave exacta del campo que queremos mostrar
            const elementos: Array<{
              nombreMod: string;
              etiqueta: string;
              key: keyof Modificacion;
            }> = [
              {
                nombreMod: 'SNORKEL',
                etiqueta: 'Snorkel',
                key: 'curvaturaSnorkel',
              },
              {
                nombreMod: 'PARAGOLPES DELANTERO',
                etiqueta: 'Paragolpes delantero',
                key: 'radioCurvaRParagolpesDelantero',
              },
              {
                nombreMod: 'PARAGOLPES TRASERO',
                etiqueta: 'Paragolpes trasero',
                key: 'curvaturaParagolpesTrasero',
              },
              {
                nombreMod: 'ALETINES Y SOBREALETINES',
                etiqueta: 'Aletines',
                key: 'radioCurvaRAletines',
              },
              {
                nombreMod: 'ALETINES Y SOBREALETINES',
                etiqueta: 'Sobrealetines',
                key: 'curvaturaSobrealetines',
              },
              {
                nombreMod: 'ESTRIBOS LATERALES',
                etiqueta: 'Estribos laterales',
                key: 'curvaturaEstribosLaterales',
              },
              {
                nombreMod: 'PROTECTORES LATERALES',
                etiqueta: 'Protectores laterales',
                key: 'curvaturaProtectoresLaterales',
              },
              {
                nombreMod: 'DEFENSA DELANTERA',
                etiqueta: 'Defensa delantera',
                key: 'curvaturaDefensaDelantera',
              },
              {
                nombreMod: 'SOPORTE PARA RUEDA DE REPUESTO',
                etiqueta: 'Soporte rueda de repuesto',
                key: 'curvaturaSoporteRuedaRepuesto',
              },
            ];

            // 2) Construcción dinámica de filas solo si la mod está seleccionada y el valor existe
            const dataRows = elementos
              .map(({ nombreMod, etiqueta, key }) => {
                const mod = modificaciones.find(
                  (m) => m.nombre === nombreMod && m.seleccionado
                );
                const valor = mod ? mod[key] : null;

                if (
                  !mod ||
                  valor === undefined ||
                  valor === null ||
                  valor === ''
                ) {
                  return null;
                }

                return new TableRow({
                  children: [
                    new TableCell({
                      verticalAlign: VerticalAlign.CENTER,
                      margins: {
                        top: 200,
                        bottom: 200,
                        left: 200,
                        right: 200,
                      },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun(etiqueta)],
                        }),
                      ],
                    }),
                    new TableCell({
                      verticalAlign: VerticalAlign.CENTER,
                      margins: {
                        top: 200,
                        bottom: 200,
                        left: 200,
                        right: 200,
                      },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun(String(valor))],
                        }),
                      ],
                    }),
                  ],
                });
              })
              .filter((row): row is TableRow => row !== null);

            if (dataRows.length === 0) {
              return [];
            }

            // 3) Cabecera
            const headerRow = new TableRow({
              children: [
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: { top: 200, bottom: 200, left: 200, right: 200 },
                  width: { size: 70, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({ text: 'Elemento instalado', bold: true }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  verticalAlign: VerticalAlign.CENTER,
                  margins: { top: 200, bottom: 200, left: 200, right: 200 },
                  width: { size: 30, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: 'Radio de curvatura más desfavorable en mm',
                          bold: true,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            });

            const spacer = new Paragraph({ spacing: { before: 400 } });

            // 4) Construye y devuelve la tabla completa
            const table = new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
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
              rows: [headerRow, ...dataRows],
            });

            return [spacer, table];
          })(),
        ]
      : []),
  ];

  const punto1_6Avisos = [
    ...(data.tipoVehiculo === 'coche'
      ? (() => {
          const textos = [
            'El vehículo dispone de sistema de frenado ABS.',
            'Se cumple en todo caso con la normativa de salientes exteriores.',
            'Los anclajes del paragolpes delantero son los originales, no modificándose la altura libre. Se respetan los anclajes para los ganchos de rescate del vehículo, tanto el delantero como el trasero en su caso.',
            'El sistema de remolcado delantero y trasero no se ve impedido tras la reforma.',
            'Ninguna de las piezas asociadas a las reformas a realizar en el vehículo presenta tipo alguno de aristas vivas o cortantes susceptibles de ser peligrosas.',
          ];

          const bullets: Paragraph[] = textos
            .map((txt, i) =>
              data.opcionesCoche[i]
                ? new Paragraph({
                    bullet: { level: 0 },
                    spacing: { before: 240, after: 120 },
                    children: [new TextRun({ text: txt })],
                  })
                : null
            )
            .filter((p): p is Paragraph => p != null);

          const fraseFinal = new Paragraph({
            spacing: { before: 240, after: 120 },
            children: [
              new TextRun({
                text: 'Ninguna de las piezas instaladas entorpece la entrada del flujo de aire al motor para su respectiva refrigeración.',
              }),
            ],
          });

          return [...bullets, fraseFinal];
        })()
      : []),

    ...(data.tipoVehiculo === 'camper'
      ? (() => {
          const fraseFinal = new Paragraph({
            spacing: { before: 240, after: 120 },
            children: [
              new TextRun({
                text: 'Ninguna de las piezas asociadas a las reformas a realizar en el vehículo presenta tipo alguno de aristas vivas o cortantes susceptibles de ser peligrosas.',
                break: 1,
              }),
              new TextRun({
                text: 'Ninguna de las piezas instaladas entorpece la entrada del flujo del aire al motor para su respectiva refrigeración.',
                break: 1,
              }),
              new TextRun({
                text: 'Se ha comprobado que se mantienen los anclajes de los sistemas originales de retención de carga después de la transformación.',
                break: 1,
              }),
            ],
          });

          return [fraseFinal];
        })()
      : []),

    ...(data.tipoVehiculo === 'moto'
      ? (() => {
          const fraseFinal = new Paragraph({
            spacing: { before: 240, after: 120 },
            children: [
              new TextRun({
                text: 'Ninguna de las piezas asociadas a las reformas a realizar en el vehículo presenta tipo alguno de aristas vivas o cortantes susceptibles de ser peligrosas.',
                break: 1,
              }),
              new TextRun({
                text: 'Ninguna de las piezas instaladas entorpece la entrada del flujo del aire al motor para su respectiva refrigeración.',
                break: 1,
              }),
              new TextRun({
                text: 'Se ha comprobado que se mantienen los anclajes de los sistemas originales de retención de carga después de la transformación.',
                break: 1,
              }),
            ],
          });

          return [fraseFinal];
        })()
      : []),
  ];

  const punto1_6_4_Materiales: Paragraph[] = [
    // Título
    new Paragraph({
      heading: HeadingLevel.HEADING_4,
      spacing: { before: 260, after: 120 },
      children: [
        new TextRun({
          text: '1.6.4- Materiales empleados',
          bold: true,
          color: '000000',
        }),
      ],
    }),
    // Texto
    new Paragraph({
      spacing: { after: 240 },
      children: [
        new TextRun({
          text:
            'Tornillería y fijación: Se utiliza tornillería según normativa DIN 931 8.8 ' +
            'para los elementos metálicos. El diámetro mínimo de los tornillos ' +
            'de fijación es de M5 y su calidad de UM8.8; el número de unidades ' +
            'dispuestas en cada elemento varía en función de su peso y volumen.',
        }),
      ],
    }),
  ];

  // 1.7 – CONCLUSIÓN
  const punto1_7_Conclusion: Paragraph[] = [
    // Título
    new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 260, after: 120 },
      children: [
        new TextRun({ text: '1.7- CONCLUSIÓN', bold: true, color: '000000' }),
      ],
    }),
    // Texto
    new Paragraph({
      spacing: { after: 240 },
      children: [
        new TextRun({
          text:
            'Por todo lo anteriormente expuesto en la documentación que se aporta en ' +
            'esta memoria y en los cálculos, pliego de condiciones, presupuesto y planos, ' +
            'el vehículo es APTO para poder realizar la reforma proyectada.',
        }),
      ],
    }),
    // Pie de firma
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 240 },
      children: [
        new ImageRun({
          data: imageBuffer5,
          transformation: { width: 170, height: 220 },
          type: 'png',
        }),
      ],
    }),
  ];

  const punto2 = [
    new Paragraph({ pageBreakBefore: true }),
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
      text: '',
      spacing: { before: 120, after: 120 },
    }),

    new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 260, after: 120 },
      children: [
        new TextRun({
          text: '2.1- CONSIDERACIONES PREVIAS',
          bold: true,
          color: '000000',
        }),
      ],
    }),

    ...[
      'Para cada una de las piezas sustituidas o añadidas se procede a continuación a calcular los esfuerzos máximos a soportar por cada una de ellas, para que a partir de ellos podamos justificar si los anclajes empleados son los adecuados.',
      'En todos los casos los cálculos se realizarán suponiendo una hipótesis más desfavorable incluso que la que se puede dar en la práctica. Para ello se considerarán todas las fuerzas aplicadas en la misma dirección y sentido, aplicando dicha resultante como esfuerzo total, tanto a tracción como a cortadura.',
      'Las fuerzas consideradas son las siguientes:',
    ].map(
      (texto) =>
        new Paragraph({
          spacing: { line: 260, after: 120 },
          children: [new TextRun({ text: texto })],
        })
    ),

    new Paragraph({
      spacing: { before: 120 },
      indent: { left: 400 },
      children: [new TextRun({ text: '• Peso de la pieza' })],
    }),
    new Paragraph({
      spacing: { before: 120 },
      indent: { left: 400 },
      children: [
        new TextRun({
          text: '• Fuerza sobre la pieza por efecto del frenado ',
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 120 },
      indent: { left: 400 },
      children: [
        new TextRun({
          text: '• Fuerza aerodinámica ejercida por el aire sobre la pieza ',
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 120, after: 120 },
      indent: { left: 400 },
      children: [
        new TextRun({ text: '• Fuerza centrífuga por efecto del giro ' }),
      ],
    }),

    ...[
      'Para obtener la fuerza de frenado y teniendo en cuenta el desarrollo actual de la tecnología aplicada sobe los vehículos podemos considerar un valor de deceleración de 10m/s2.',
      'Para la obtención de los esfuerzos generados por la presión del aire sobre el vehículo y continuando con la premisa de realizar los cálculos para la situación más desfavorable posible, consideramos la presión ejercida a la velocidad máxima del vehículo. ',
    ].map(
      (texto) =>
        new Paragraph({
          spacing: { line: 260, after: 120 },
          children: [new TextRun({ text: texto })],
        })
    ),
    ...(data.velocidadMaxima !== '---'
      ? [
          new Paragraph({
            spacing: { line: 260, after: 120 },
            children: [
              new TextRun({
                text: `Velocidad máxima: ${data.velocidadMaxima} Km/h = ${(
                  data.velocidadMaxima / 3.6
                ).toFixed(2)} m/s`,
              }),
            ],
          }),
        ]
      : []),

    new Paragraph({
      spacing: { before: 120 },
      children: [
        new TextRun({
          text: 'Para la fuerza centrífuga y en base a lo indicado en la Instrucción de carreteras 3.1-IC, el valor máximo de aceleración centrifuga lo obtenemos en una situación de velocidad de 140 km/h (38,89 m/s) y radio de curva de 800m.',
        }),
      ],
    }),
  ];

  let punto2_2 = [];

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

  if (plazasDespues === null) plazasDespues = 1;

  if (momAntes === null || masaRealDespues === null) {
    // Se asume que la diferencia es menor al 3%
    punto2_2 = [
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 260, after: 120 },
        children: [
          new TextRun({
            text: '2.2- REPARTO DE MASAS SOBRE LOS EJES',
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
    const variacion = Math.abs(masaRealDespues - momAntes) / momAntes;

    if (variacion > 0.03) {
      punto2_2 = [
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 260, after: 120 },
          children: [
            new TextRun({
              text: '2.2- REPARTO DE MASAS SOBRE LOS EJES',
              bold: true,
              color: '000000',
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
                        ? (
                            limpiarYParsear(data.masaRealDespues)! + 75
                          ).toString()
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
                          text: data.cdgconductor?.toString() ?? '-',
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
                          text:
                            (data.asientosDelanteros * 75)?.toString() ?? '-',
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
                      text: data.cdgconductor?.toString() ?? '-',
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
                      children: [
                        new TextRun({ text: 'Carga útil', bold: true }),
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
                      children: [
                        new TextRun({ text: cargaUtilDel.toString() }),
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
                        new TextRun({ text: cargaUtilTras.toString() }),
                      ],
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
    } else {
      punto2_2 = [
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 260, after: 120 },
          children: [
            new TextRun({
              text: '2.2- REPARTO DE MASAS SOBRE LOS EJES',
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
              'No se modifica ni el chasis ni el bastidor, tampoco modificaremos el PMA total del vehículo ni por eje por lo que por lo tanto la resistencia se considera que es suficiente la que trae de serie el vehículo.'
            ),
          ],
        }),
      ];
    }
  }

  const punto3 = [
    new Paragraph({ pageBreakBefore: true }),
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: '3. PLIEGO DE CONDICIONES',
          color: '000000',
          bold: true,
          size: 32,
        }),
        new Paragraph({
          text: '',
          spacing: { before: 120 },
        }),
      ],
    }),

    new Paragraph({
      spacing: { before: 240, after: 120 },
      heading: HeadingLevel.HEADING_4,
      children: [
        new TextRun({
          text: '1. CALIDAD DE LOS MATERIALES EMPLEADOS',
          color: '000000',
          bold: true,
          size: 25,
        }),
      ],
    }),

    ...[
      'Todos los materiales serán de la calidad especificada y tendrán las dimensiones y espesores que se marquen en los distintos documentos del proyecto, reservándose el peticionario el derecho de realizar las pruebas y ensayos de calidad de dichos materiales conforme a las normas UNE, corriendo con los gastos de dichos ensayos por su cuenta.',
      'Los materiales metálicos serán de acero de calidad especificada a lo largo del proyecto sin deformaciones, roturas u otros defectos.',
      'La calidad de la tornillería será 8.8 o superior y en caso de sustituir tornillos originales se sustituirán por otros del mismo o mayor diámetro. Las bridas se ajustarán en diámetro y medida a las instrucciones.',
      'En aquellos elementos que precisen soldaduras, éstas serán realizadas por personal especializado.',
      'Los materiales utilizados para la reforma deben ser al menos de la misma calidad que los que tenía el vehículo antes de la misma.',
      'En todo momento se han tenido en cuenta las calidades de los materiales empleados en la reforma del vehículo, y que son de calidad igual o superior a la que el vehículo incorporaba de origen.',
      'Los diferentes elementos instalados o sustituidos en el vehículo deberán tener el marcado CE de homologación en la Unión Europea. Se deberán inspeccionar antes del montaje que tienen grabado el código de homologación europeo.',
      'Para la fijación de los tornillos se utilizarán los soportes que vienen preinstalados de fábrica en el bastidor del vehículo. Si fuera necesario realizar algún taladro para la instalación de algún elemento, se realizará en lugares de gran resistencia.',
      'Si fuera necesario desmontar alguna parte del vehículo para la instalación de algún elemento, se realizará siguiendo las instrucciones pertinentes. Se volverá a su colocación en la posición y estado que se encontraba.',
    ].map(
      (texto) =>
        new Paragraph({
          spacing: { line: 260, after: 120 },
          children: [new TextRun({ text: texto })],
        })
    ),

    new Paragraph({
      spacing: { before: 240, after: 120 },

      heading: HeadingLevel.HEADING_4,
      children: [
        new TextRun({
          text: '2. NORMAS DE EJECUCIÓN',
          bold: true,
          size: 25,
          color: '000000',
        }),
      ],
    }),

    ...[
      'La ejecución de la obra será realizada por un taller homologado por el Ministerio de Industria, Turismo y Comercio, y se ejecutará según proyecto.',
      'Los elementos que se alabeen dentro del plazo de garantía serían sustituidos por el taller sin derecho a ningún tipo de indemnización.',
      'El taller que realice la obra se ajustará a ejecutarla conforme al presente proyecto y a los reglamentos técnicos y normas UNE e ISO vigentes, teniendo completa responsabilidad al no cumplir el siguiente pliego de condiciones con respecto a la ejecución del presente proyecto de reforma de importancia en el vehículo del cliente.',
      'Se observarán las normas de la Presidencia del Gobierno y del Ministerio de Industria, Turismo y Comercio que actualmente estén vigentes.',
      'También se deberán respetar en todo momento las normas, requisitos e instrucciones fijadas por el fabricante del vehículo y los fabricantes de los distintos accesorios instalados.',
      'Si en el transcurso del trabajo, y para buen fin de éste, fuese menester ejecutar cualquier clase de obra que no estuviese especificada, el taller estará obligado a ejecutarla con arreglo a las condiciones que señale la dirección facultativa, sin tener derecho a reclamación alguna.',
      'La Dirección Facultativa se reservará el derecho de mandar retirar de la obra los materiales que a su juicio no reúnan las condiciones, y si éstos estuviesen montados, el taller estaría obligado a sustituirlos sin ningún tipo de indemnización.',
      'La reforma no podrá efectuarse en ningún caso cuando implique riesgo de interferencia entre partes móviles del vehículo.',
      'Se mantienen los anclajes de remolque originales del vehículo.',
      'Debe asegurarse el correcto par de apriete de todos los tornillos, de forma que no exista riesgo de desprendimiento de los componentes instalados.',
      'Los añadidos en carrocería no contienen ángulos penetrantes ni aristas vivas. Con radios de curvatura de las piezas mínimos de 2,5 mm.',
      'El montaje de los muelles se realizará siguiendo las instrucciones de montaje fijadas por el fabricante.',
      'Se certifica que no ha sido afectado ningún otro elemento de la suspensión del vehículo (salvo recambios), ni se ha manipulado el resto de componentes del vehículo.',
      'Se mantienen los parámetros de dirección originales del vehículo. Ajustándose a la normativa UNE 26-192-87.',
    ].map(
      (texto) =>
        new Paragraph({
          spacing: { line: 260, after: 120 },
          children: [new TextRun({ text: texto })],
        })
    ),

    ...[
      'Los elementos elásticos sustituidos del sistema de suspensión han sido ubicados en los emplazamientos de que disponían los originales.',
      'No se podrá alterar ningún elemento fundamental del vehículo que no se detalle en este proyecto (depósito de combustible, sistema de dirección, etc.).',
      'Cuando se incorporen equipos adicionales se incluirá, si es pertinente, el manual de instrucciones de montaje del equipamiento incorporado.',
      'Cuando exista manual del fabricante del elemento instalado, en ningún momento se realizara operación alguna en contra de lo que el manual indique, debiendo dar constancia explícitamente de la obligación de realizar aquello que el fabricante considera como apropiado para la transformación del vehículo solicitada.',
      'Se cumplirá estrictamente la normativa referente a Seguridad de máquinas en función de su año de fabricación por lo que a los equipos y dispositivos instalados se refiere (Real Decreto 1435/1992 BOE 297). Asimismo se deberá garantizar al usuario de las maquinas instaladas las garantías de seguridad que obliga el marcado CE y su previa declaración de conformidad del producto.',
    ].map(
      (texto) =>
        new Paragraph({
          spacing: { line: 260, after: 120 },
          children: [new TextRun({ text: texto })],
        })
    ),

    new Paragraph({ pageBreakBefore: true }),
    new Paragraph({
      spacing: { before: 240, after: 120 },

      heading: HeadingLevel.HEADING_4,
      children: [
        new TextRun({
          text: '3. CERTIFICADOS Y AUTORIZACIONES.REQUSITOS DEL INFORME DE CONFORMIDAD',
          color: '000000',
          bold: true,
          size: 25,
        }),
      ],
    }),

    ...[
      'Conforme a la legislación vigente, y en especial a lo estipulado en el Real Decreto 866/2010, de 2 de julio, por el que se regula la tramitación de las reformas de vehículos, y lo desarrollado en el Manual de Reformas de Vehículos vitgente, publicado por el Ministerio de Industria, Turismo y Comercio, para el tipo de reforma que nos ocupa, se deberá presentar los certificados y autorizaciones allí establecidos y presentarse ante los órganos de la Administración competentes en materia de inspección técnica de vehículos (ITV), junto con el vehículo para tramitar su legalización para circulación por vías públicas.	',
      'En el Certificado de Dirección de Obra se indicará el organismo emisor del mencionado Informe de Conformidad.',
    ].map(
      (texto) =>
        new Paragraph({
          spacing: { line: 260, after: 120 },
          children: [new TextRun({ text: texto })],
        })
    ),

    new Paragraph({
      spacing: { before: 240, after: 120 },

      heading: HeadingLevel.HEADING_4,
      children: [
        new TextRun({
          text: '4. TALLER EJECUTOR',
          color: '000000',
          bold: true,
          size: 25,
        }),
      ],
    }),

    ...[
      'El taller donde se realizará la reforma del vehículo objeto del presente proyectos es:',
    ].map(
      (texto) =>
        new Paragraph({
          spacing: { line: 260, after: 120 },
          children: [new TextRun({ text: texto })],
        })
    ),

    new Table({
      alignment: AlignmentType.CENTER,
      width: {
        size: 75,
        type: WidthType.PERCENTAGE,
      },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
        bottom: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
        left: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
        right: { style: BorderStyle.SINGLE, size: 2, color: '000000' },
        insideHorizontal: {
          style: BorderStyle.SINGLE,
          size: 1,
          color: '000000',
        },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      },
      margins: {
        left: 200,
        right: 200,
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              verticalAlign: VerticalAlign.CENTER,
              width: { size: 50, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, fill: 'D3D3D3' },
              margins: { left: 100, right: 100, top: 40, bottom: 40 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'NOMBRE EMPRESA', bold: true }),
                  ],
                }),
              ],
            }),
            new TableCell({
              verticalAlign: VerticalAlign.CENTER,
              width: { size: 50, type: WidthType.PERCENTAGE },
              margins: { left: 100, right: 100, top: 40, bottom: 40 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: data.taller.nombre || '' })],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              verticalAlign: VerticalAlign.CENTER,
              width: { size: 50, type: WidthType.PERCENTAGE },
              margins: { left: 100, right: 100, top: 40, bottom: 40 },
              shading: { type: ShadingType.CLEAR, fill: 'D3D3D3' },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'DIRECCIÓN TALLER', bold: true }),
                  ],
                }),
              ],
            }),
            new TableCell({
              verticalAlign: VerticalAlign.CENTER,
              width: { size: 50, type: WidthType.PERCENTAGE },
              margins: { left: 100, right: 100, top: 40, bottom: 40 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: data.taller.direccion || '' }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              verticalAlign: VerticalAlign.CENTER,
              width: { size: 50, type: WidthType.PERCENTAGE },
              margins: { left: 100, right: 100, top: 40, bottom: 40 },
              shading: { type: ShadingType.CLEAR, fill: 'D3D3D3' },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: 'LOCALIDAD', bold: true })],
                }),
              ],
            }),
            new TableCell({
              verticalAlign: VerticalAlign.CENTER,
              width: { size: 50, type: WidthType.PERCENTAGE },
              margins: { left: 100, right: 100, top: 40, bottom: 40 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: data.taller.poblacion || '' }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              verticalAlign: VerticalAlign.CENTER,
              width: { size: 50, type: WidthType.PERCENTAGE },
              margins: { left: 100, right: 100, top: 40, bottom: 40 },
              shading: { fill: 'D3D3D3' },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: 'PROVINCIA', bold: true })],
                }),
              ],
            }),
            new TableCell({
              verticalAlign: VerticalAlign.CENTER,
              width: { size: 50, type: WidthType.PERCENTAGE },
              margins: { left: 100, right: 100, top: 40, bottom: 40 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: data.taller.provincia || '' }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              verticalAlign: VerticalAlign.CENTER,
              width: { size: 50, type: WidthType.PERCENTAGE },
              margins: { left: 100, right: 100, top: 40, bottom: 40 },
              shading: { fill: 'D3D3D3' },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'NÚMERO REGISTRO INDUSTRIAL',
                      bold: true,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              verticalAlign: VerticalAlign.CENTER,
              width: { size: 50, type: WidthType.PERCENTAGE },
              margins: { left: 100, right: 100, top: 40, bottom: 40 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: data.taller.registroIndustrial || '',
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
              verticalAlign: VerticalAlign.CENTER,
              width: { size: 50, type: WidthType.PERCENTAGE },
              margins: { left: 100, right: 100, top: 40, bottom: 40 },
              shading: { fill: 'D3D3D3' },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'NÚMERO REGISTRO ESPECIAL',
                      bold: true,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              verticalAlign: VerticalAlign.CENTER,
              width: { size: 50, type: WidthType.PERCENTAGE },
              margins: { left: 100, right: 100, top: 40, bottom: 40 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: data.taller.registroEspecial || '',
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
      alignment: AlignmentType.RIGHT,
      spacing: { before: 300 },
      children: [
        new ImageRun({
          data: imageBuffer5,
          transformation: { width: 170, height: 220 },
          type: 'png',
        }),
      ],
    }),
  ];

  const punto4 = [
    new Paragraph({ pageBreakBefore: true }),
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: '4. PRESUPUESTO',
          color: '000000',
          bold: true,
          size: 32,
        }),
      ],
    }),

    new Paragraph({
      text: '',
      spacing: { before: 120 },
    }),

    new Paragraph({
      spacing: { before: 260, after: 120 },
      children: [
        new TextRun({
          text: 'El presupuesto del estudio y ejecución de la reforma llevada a cabo en el vehículo seleccionado para este proyecto, asciende a la cantidad final de: ',
        }),
      ],
    }),

    new Paragraph({
      spacing: { before: 260, after: 120 },
      children: [
        new TextRun({
          text: 'Desglosados como sigue: ',
        }),
      ],
    }),

    new Table({
      alignment: AlignmentType.CENTER,
      width: {
        size: 50,
        type: WidthType.PERCENTAGE,
      },
      margins: {
        left: 200,
        right: 200,
      },
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
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      },
      rows: [
        // Encabezado
        new TableRow({
          children: [
            new TableCell({
              margins: { left: 100, right: 100, top: 40, bottom: 40 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: 'CONCEPTO', bold: true })],
                }),
              ],
            }),
            new TableCell({
              margins: { left: 100, right: 100, top: 40, bottom: 40 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: 'EUROS', bold: true })],
                }),
              ],
            }),
          ],
        }),
        // Materiales
        new TableRow({
          children: [
            new TableCell({
              margins: { left: 100, right: 100, top: 40, bottom: 40 },
              children: [new Paragraph('Materiales usados en la reforma')],
            }),
            new TableCell({
              verticalAlign: VerticalAlign.CENTER,
              margins: { left: 100, right: 100, top: 40, bottom: 40 },
              children: [
                new Paragraph(data.materialesUsados?.toString() ?? '-'),
              ],
            }),
          ],
        }),
        // Mano de obra
        new TableRow({
          children: [
            new TableCell({
              margins: { left: 100, right: 100, top: 40, bottom: 40 },
              children: [new Paragraph('Mano de obra')],
            }),
            new TableCell({
              verticalAlign: VerticalAlign.CENTER,
              margins: { left: 100, right: 100, top: 40, bottom: 40 },
              children: [new Paragraph(data.manoDeObra?.toString() ?? '-')],
            }),
          ],
        }),
        // Total presupuesto
        new TableRow({
          children: [
            new TableCell({
              margins: { left: 100, right: 100, top: 40, bottom: 40 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Total presupuesto', bold: true }),
                  ],
                }),
              ],
            }),
            new TableCell({
              verticalAlign: VerticalAlign.CENTER,
              margins: { left: 100, right: 100, top: 40, bottom: 40 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: data.totalPresupuesto?.toString() ?? '-',
                      bold: true,
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
      spacing: { before: 260, after: 120 },
      children: [
        new TextRun({
          text: '*(El precio de la Mano de Obra incluye el montaje y desmontaje de las piezas)',
        }),
      ],
    }),

    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 240 },
      children: [
        new ImageRun({
          data: imageBuffer5,
          transformation: { width: 170, height: 220 },
          type: 'png',
        }),
      ],
    }),
  ];

  if (tipo === 'camper' || tipo === 'coche') {
    alto = 250;
    alto2 = 350;
  } else {
    alto = 350;
    alto2 = 350;
  }

  const punto5 = [
    new Paragraph({ pageBreakBefore: true }),
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: '5. PLANOS',
          color: '000000',
          bold: true,
          size: 32,
        }),
      ],
    }),

    new Paragraph({
      text: '',
    }),

    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: 'PLANO Nº1: ESTADO DEL VEHÍCULO ANTES DE LA REFORMA',
          bold: true,
          size: 28,
          color: '000000',
        }),
      ],
    }),

    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new ImageRun({
          data: imageBuffer3,
          transformation: {
            width: 350,
            height: alto,
          },
          type: 'png',
        }),
      ],
    }),

    new Table({
      alignment: AlignmentType.CENTER,
      width: { size: 85, type: WidthType.PERCENTAGE },
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
                createCell(value, false, 50, 2, true),
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
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 120 },
      children: [
        new TextRun({
          text: 'PLANO Nº2: ESTADO DEL VEHÍCULO DESPUÉS DE LA REFORMA',
          bold: true,
          size: 28,
          color: '000000',
        }),
      ],
    }),

    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new ImageRun({
          data: imageBuffer3,
          transformation: {
            width: 350,
            height: alto,
          },
          type: 'png',
        }),
      ],
    }),

    new Table({
      alignment: AlignmentType.CENTER,
      width: { size: 85, type: WidthType.PERCENTAGE },
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
                createCell(value, false, 50, 2, true),
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
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 120 },
      children: [
        new TextRun({
          text: 'PLANO Nº3: REFORMAS REALIZADAS',
          bold: true,
          size: 28,
          color: '000000',
        }),
      ],
    }),

    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new ImageRun({
          data: imageBuffer4,
          transformation: {
            width: 400,
            height: alto2,
          },
          type: 'png',
        }),
      ],
    }),

    generarTablaLeyenda(data),

    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 240 },
      children: [
        new ImageRun({
          data: imageBuffer5,
          transformation: { width: 170, height: 220 },
          type: 'png',
        }),
      ],
    }),
  ];

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

  async function generarPosteriores(data: any): Promise<(Paragraph | Table)[]> {
    const titulo = [
      new Paragraph({ pageBreakBefore: true }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: '6. IMAGENES POSTERIORES A LA REFORMA',
            color: '000000',
            bold: true,
            size: 32,
          }),
        ],
      }),

      new Paragraph({
        text: '',
      }),
    ];

    // Normalizas los File a Blob rotados
    const rawFiles = data.postImages as File[];
    const orientedBlobs = await Promise.all(
      rawFiles.map((f) => normalizeOrientation(f))
    );

    // 2) Aquí lees el arrayBuffer y guardas también el mimeType
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

    // ... tus Paragraphs de título, pageBreak, etc. ...

    function buildPreviosTable(images: ImageInfo[]): Table {
      const rows: TableRow[] = [];
      const maxCellWidth = 300;
      const maxCellHeight = 250;

      for (let i = 0; i < images.length; i += 2) {
        const left = images[i];
        const right = images[i + 1];

        // escalados igual que antes...
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

    const prevTable = buildPreviosTable(infos);
    return [...titulo, prevTable];
  }

  const anexosPorsteriores = await generarPosteriores(data);

  const section2 = {
    properties: { type: SectionType.NEXT_PAGE, pageNumberStart: 1 },
    headers: { default: header },
    footers: { default: makeFooter() },
    children: [
      ...punto1_1MemoriaDescriptiva,
      ...punto1_2Antecedentes,
      ...punto1_3DatosVehiculo,
      ...punto1_4Normativa,
      ...punto1_5Consideraciones,
      ...buildModificacionesParagraphs(modificaciones, data),
      ...punto1_6Tabla,
      ...punto1_6Avisos,
      ...generarDocumentoProyectoParagraphs({ modificaciones }, data),
      ...punto1_6_4_Materiales,
      ...punto1_7_Conclusion,
      ...punto2,
      ...punto2_2,
      ...(await buildCalculos(data.modificaciones, data)),
      ...punto3,
      ...punto4,
      ...punto5,
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
  return blob;
  // saveAs(
  //   blob,
  //   `${data.referenciaProyecto} PROYECTO ${data.marca} ${data.modelo} ${data.matricula}.docx`
  // );
}
