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
} from 'docx';
import fs from 'fs';
import path from 'path';
import saveAs from 'file-saver';
import ingeniero from '../../assets/ingeniero.json';
import { Modificacion } from '../interfaces/modificacion';
import {
  buildModificacionesParagraphs,
  generarDocumentoProyectoParagraphs,
} from './buildModificacionesParagraphs';

export async function generarDocumentoProyecto(data: any): Promise<void> {
  const response = await fetch('assets/logo.png');
  const imageBuffer = await response.arrayBuffer();

  const modificaciones: Modificacion[] = data.modificaciones;

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
          { text: 'MODELO', width: 15 },
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
          data.tipo + ' / ' + data.version + ' / ' + data.variante,
        ],
        ['MATRÍCULA', data.matricula],
        ['Nº BASTIDOR', data.bastidor],
        ['FECHA 1ª MATRICULACIÓN', data.fechaMatriculacion],
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
            font: 'Arial',
            text: ingeniero.web,
            color: '000000',
            bold: true,
            size: 48, // 24pt
            italics: true,
            underline: {},
          }),
        ],
      }),
    ],
  });

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
                width: { size: 33, type: WidthType.PERCENTAGE },
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
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: ingeniero.colegiado,
                        bold: true,
                        size: 16,
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: ingeniero.tlf,
                        bold: true,
                        size: 16,
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: ingeniero.correoEmpresa,
                        bold: true,
                        size: 16,
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
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
                width: { size: 34, type: WidthType.PERCENTAGE },
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
                        text: 'Marca ' + data.marca + ' Modelo ' + data.modelo,
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
                width: { size: 33, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 100, right: 100 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'REF.: ' + data.referenciaProyecto,
                        bold: true,
                        size: 20,
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
                        size: 20,
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
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: '1. MEMORIA DESCRIPTIVA',
          color: '000000',
          bold: true,
          size: 32,
        }),
        new Paragraph({
          text: '',
          spacing: { before: 120, after: 120 },
        }),
      ],
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
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
        new TextRun(' modelo '),
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
          text: '1.1.1.1 - Autor del proyecto',
          color: '000000',
          bold: true,
        }),
      ],
    }),
    ...[
      'Nombre: ' + ingeniero.nombre,
      'DNI: ' + ingeniero.dni,
      'Domicilio: Avda. Mediterráneo, 134 – 1º - Oficina 4 ' +
        ingeniero.direccionFiscal +
        ' - ' +
        ingeniero.oficina,
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

  const punto1_2Antecedentes = [
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
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
      spacing: {
        line: 260,
        after: 120,
      },
      text: data.reformasPrevias ? data.descripcionReformas : 'No procede',
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
            children: [new TextRun({ text, bold })],
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
            children: [new TextRun({ text, bold })],
          }),
        ],
      });
    }
  }

  // 1.3 - DATOS DEL VEHÍCULO
  const punto1_3DatosVehiculo = [
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
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
            createCell(data.denominacion, false, 33),
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
            createCell(data.fechaMatriculacion, false, 33),
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

    new Paragraph({
      text: '',
      spacing: { before: 120, after: 120 },
    }),

    // 1.3.1 Características antes de la reforma
    new Paragraph({
      heading: HeadingLevel.HEADING_3,
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
      width: { size: 65, type: WidthType.PERCENTAGE },
      rows: [
        ['Longitud', data.longitudAntes, 'mm'],
        ['Anchura', data.anchuraAntes, 'mm'],
        ['Altura', data.alturaAntes, 'mm'],
        ['Voladizo', data.voladizoAntes, 'mm'],
        ['Ancho de vías anterior', data.viaDelanteraAntes, 'mm'],
        ['Ancho de vías posterior', data.viaTraseraAntes, 'mm'],
        ['Neumáticos', data.neumaticoAntes, ''],
        ['Masa del vehículo en orden de marcha (MOM)', data.momAntes, 'kg'],
        ['MMA/MMTA', data.mmaAntes, 'kg'],
        ['MMA/MMTA eje 1º', data.mmaEje1Antes, 'kg'],
        ['MMA/MMTA eje 2º', data.mmaEje2Antes, 'kg'],
        ['MMTAC/MMC', data.mmaConjuntoAntes, 'kg'],
        ['Clasificación', data.clasificacionAntes, ''],
        ['Nº de plazas de asiento', data.plazasDespues, ''],
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
      heading: HeadingLevel.HEADING_3,
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
      width: { size: 65, type: WidthType.PERCENTAGE },
      rows: [
        ['Longitud', data.longitudDespues, 'mm'],
        ['Anchura', data.anchuraDespues, 'mm'],
        ['Altura', data.alturaDespues, 'mm'],
        ['Voladizo', data.voladizoDespues, 'mm'],
        ['Ancho de vías anterior', data.viaDelanteraDespues, 'mm'],
        ['Ancho de vías posterior', data.viaTraseraDespues, 'mm'],
        ['Neumáticos', data.neumaticoDespues],
        ['Masa Real', data.masaRealDespues, 'kg'],
        ['MMA/MMTA', data.mmaDespues, 'kg'],
        ['MMA/MMTA eje 1º', data.mmaEje1Despues, 'kg'],
        ['MMA/MMTA eje 2º', data.mmaEje2Despues, 'kg'],
        ['MMTAC/MMC', data.mmaConjuntoDespues, 'kg'],
        ['Clasificación', data.clasificacionDespues],
        ['Nº de plazas de asiento', data.plazasFinal],
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
      heading: HeadingLevel.HEADING_2,
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
      heading: HeadingLevel.HEADING_3,
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
    new Paragraph({
      pageBreakBefore: true,
    }),
  ];

  const codigosImagenes = Object.values(data.codigosDetallados ?? {}).flat();
  const tamañosResp = await fetch('http://localhost:3000/image-sizes');
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
    const url = `http://localhost:3000/imgs/${nombreArchivo}`;
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
              text: `Código ${(codigo as { codigo: string }).codigo}`,
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
    new Paragraph({ pageBreakBefore: true }), // Salto de página antes del título
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
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
      'Es importante señalar que los elementos añadidos al vehículo en esta reforma serán suministrados por una empresa especializada en vehículos todoterreno, por lo que no serán diseñados a lo largo de este proyecto, ya que todos han sido previamente creados específicamente para el modelo de vehículo que vamos a reformar, siguiendo los patrones del fabricante del vehículo. Por lo tanto es el fabricante el encargado del diseño de las piezas y del cumplimiento de las normativas europeas, adquiriendo así los certificados de calidad y códigos de homologación, así como el marcado CE de los mismos, para su posterior puesta en venta en el mercado.',
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
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 260, after: 120 },
      children: [
        new TextRun({
          text: '1.6- IDENTIFICACIÓN DE LAS REFORMAS A REALIZAR',
          bold: true,
          color: '000000',
        }),
      ],
    }),
    ...(data.tipoVehiculo === 'coche'
      ? [
          (() => {
            // 1) Define un array con las claves de modificación, su etiqueta y la propiedad donde guardas el valor
            const elementos: Array<{
              nombreMod: string;
              etiqueta: string;
              valor: string | number;
            }> = [
              {
                nombreMod: 'SNORKEL',
                etiqueta: 'Snorkel',
                valor: modificaciones.find((m) => m.nombre === 'SNORKEL')!
                  .curvaturaSnorkel!,
              },
              {
                nombreMod: 'PARAGOLPES DELANTERO',
                etiqueta: 'Paragolpes delantero',
                valor: modificaciones.find(
                  (m) => m.nombre === 'PARAGOLPES DELANTERO'
                )!.curvaturaParagolpesDelantero!,
              },
              {
                nombreMod: 'PARAGOLPES TRASERO',
                etiqueta: 'Paragolpes trasero',
                valor: modificaciones.find(
                  (m) => m.nombre === 'PARAGOLPES TRASERO'
                )!.curvaturaParagolpesTrasero!,
              },
              {
                nombreMod: 'ALETINES Y SOBREALETINES',
                etiqueta: 'Aletines',
                valor: modificaciones.find(
                  (m) => m.nombre === 'ALETINES Y SOBREALETINES'
                )!.curvaturaAletines!,
              },
              {
                nombreMod: 'ESTRIBOS LATERALES',
                etiqueta: 'Estribos laterales',
                valor: modificaciones.find(
                  (m) => m.nombre === 'SEPARADORES DE RUEDA'
                )!.curvaturaEstribosLaterales!,
              },
              {
                nombreMod: 'PROTECTORES LATERALES',
                etiqueta: 'Protectores laterales',
                valor: modificaciones.find(
                  (m) => m.nombre === 'ALETINES Y SOBREALETINES'
                )!.curvaturaProtectoresLaterales!,
              },
              {
                nombreMod: 'DEFENSA DELANTERA',
                etiqueta: 'Defensa delantera',
                valor: modificaciones.find(
                  (m) => m.nombre === 'DEFENSA DELANTERA'
                )!.curvaturaDefensaDelantera!,
              },
              {
                nombreMod: 'SOPORTE PARA RUEDA DE REPUESTO',
                etiqueta: 'Soporte rueda de repuesto',
                valor: modificaciones.find(
                  (m) => m.nombre === 'SOPORTE PARA RUEDA DE REPUESTO'
                )!.curvaturaSoporteRuedaRepuesto!,
              },
            ];

            // 2) Cabecera de la tabla
            const headerRow = new TableRow({
              children: [
                new TableCell({
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

            // 3) Filas: sólo para los mods seleccionados
            const dataRows = elementos
              .filter(({ nombreMod }) =>
                modificaciones.some(
                  (m) => m.nombre === nombreMod && m.seleccionado
                )
              )
              .map(
                ({ etiqueta, valor }) =>
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph(etiqueta)],
                      }),
                      new TableCell({
                        children: [new Paragraph(String(valor))],
                      }),
                    ],
                  })
              );

            // 4) Construye y devuelve la tabla completa
            return new Table({
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
          })(),
        ]
      : []),
  ];

  const punto1_6Consideraciones = [
    ...(modificaciones.some(
      (mod: Modificacion) =>
        mod.nombre === 'REMOLQUE HOMOLOGADO EN EMPLAZAMIENTO NO HOMOLOGADO' &&
        mod.seleccionado
    )
      ? [
          (() => {
            const mod = modificaciones.find(
              (m: Modificacion) =>
                m.nombre ===
                  'REMOLQUE HOMOLOGADO EN EMPLAZAMIENTO NO HOMOLOGADO' &&
                m.seleccionado
            );
            return mod
              ? new Paragraph({
                  spacing: { line: 260, after: 120 },
                  indent: { left: 400 },
                  children: [
                    new TextRun({
                      text: `- Instalación de enganche de remolque homologado en emplazamiento no homologado, consistente en: soporte marca ${mod.marca}, tipo ${mod.tipo}, clase ${mod.clase}, contraseña de homologación ${mod.homologacion}, para una MMR en remolques de eje central ${mod.mmrEjeCentral}kg y de barra de tracción ${mod.mmrBarraTraccion}kg.`,
                    }),
                  ],
                })
              : null;
          })(),
        ].filter(Boolean)
      : []),

    ...(modificaciones.some(
      (mod) =>
        mod.nombre ===
          'REMOLQUE HOMOLOGADO EN EMPLAZAMIENTO TAMBIÉN HOMOLOGADO' &&
        mod.seleccionado
    )
      ? [
          (() => {
            const mod = modificaciones.find(
              (m: Modificacion) =>
                m.nombre ===
                  'REMOLQUE HOMOLOGADO EN EMPLAZAMIENTO TAMBIÉN HOMOLOGADO' &&
                m.seleccionado
            );
            return mod
              ? new Paragraph({
                  spacing: { line: 260, after: 120 },
                  indent: { left: 400 },
                  children: [
                    new TextRun({
                      text: `- Instalación de enganche de remolque en emplazamiento de homologación, consistente en: barra marca ${mod.marcaBarra}, tipo ${mod.tipoBarra}, clase ${mod.claseBarra}, contraseña de homologación ${mod.homologacionBarra} // bola marca ${mod.marcaBola}, clase ${mod.claseBola}, contraseña de homologación ${mod.homologacionBola}, para una MMR en remolques de eje central ${mod.mmrEjeCentral}kg y de barra de tracción ${mod.mmrBarraTraccion}kg.`,
                    }),
                  ],
                })
              : null;
          })(),
        ].filter(Boolean)
      : []),

    // REDUCCIÓN DE PLAZAS
    ...(modificaciones.some(
      (mod) => mod.nombre === 'REDUCCIÓN DE PLAZAS' && mod.seleccionado
    )
      ? [
          (() => {
            const mod = modificaciones.find(
              (m) => m.nombre === 'REDUCCIÓN DE PLAZAS' && m.seleccionado
            );
            if (!mod) return null;

            // Creamos dos párrafos y los devolvemos juntos
            return [
              new Paragraph({
                spacing: { line: 260, after: 360 },
                indent: { left: 400 },
                children: [
                  new TextRun({
                    text: `- Reducción de plazas de asiento pasando de ${mod.plazasAntes} a ${mod.plazasDespues} mediante la desinstalación del cinturón de seguridad y el anclaje de la plaza ${mod.enclaje}. `,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { line: 260, after: 120 },
                children: [
                  new TextRun({ text: 'NOTA: ', bold: true }),
                  new TextRun({
                    text: 'En la plaza en la cual se ha desinstalado el cinturón de seguridad, se ha instalado un pictograma con texto el cual indica inequívocamente que dicha plaza no puede utilizarse con el vehículo en circulación.',
                  }),
                ],
              }),
            ];
          })(),
        ]
          .flat()
          .filter(Boolean)
      : []),

    // NEUMÁTICOS
    ...(modificaciones.some(
      (mod) => mod.nombre === 'NEUMÁTICOS' && mod.seleccionado
    )
      ? [
          (() => {
            const mod = modificaciones.find(
              (m) => m.nombre === 'NEUMÁTICOS' && m.seleccionado
            );
            if (!mod) return null;

            const parrafos = [
              new Paragraph({
                spacing: { line: 260, after: 360 },
                indent: { left: 400 },
                children: [
                  new TextRun({
                    text: `- Sustitución de neumáticos en ambos ejes por otros homologados de medidas no equivalentes ${mod.neumaticos}, montados sobre llantas de medidas ${mod.medidas}”, asegurando la compatibilidad llanta-neumático y la no interferencia entre los neumáticos y ningún punto de la carrocería.`,
                  }),
                ],
              }),
            ];

            if (mod.anotacion === '1') {
              parrafos.push(
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

            if (mod.anotacion === '2') {
              parrafos.push(
                new Paragraph({
                  spacing: { line: 260, after: 120 },
                  children: [
                    new TextRun({
                      text: 'NOTA 2: ',
                      bold: true,
                    }),
                    new TextRun({
                      text: `Debido a que por su construcción, este vehículo es capaz de alcanzar una velocidad máxima de Vmáx = ${mod.velocidadMaximaAntes} Km/h, superior al índice de velocidad de los neumáticos instalados, se deberá instalar una pegatina limitadora de velocidad de Vmáx = ${mod.velocidadMaximaDespues} Km/h, visible desde el puesto de conducción.`,
                    }),
                  ],
                })
              );
            }

            return parrafos;
          })(),
        ]
          .flat()
          .filter(Boolean)
      : []),

    // --- SEPARADORES DE RUEDA ---
    ...(modificaciones.some(
      (mod) => mod.nombre === 'SEPARADORES DE RUEDA' && mod.seleccionado
    )
      ? [
          (() => {
            const mod = modificaciones.find(
              (m) => m.nombre === 'SEPARADORES DE RUEDA' && m.seleccionado
            );
            return mod
              ? new Paragraph({
                  spacing: { line: 260, after: 120 },
                  indent: { left: 400 },
                  children: [
                    new TextRun({
                      text: `- Instalación de separadores de rueda en eje trasero marca ${mod.marcaSeparadores}, referencia ${mod.referenciaSeparadores}, de ${mod.grosorSeparadores} de espesor fabricados en duraluminio, asegurando la no interferencia entre la rueda y ningún punto de la carrocería.`,
                    }),
                  ],
                })
              : null;
          })(),
        ].filter(Boolean)
      : []),

    // --- ALETINES Y SOBREALETINES ---
    ...(modificaciones.some(
      (m) =>
        m.nombre === 'ALETINES Y SOBREALETINES' &&
        m.seleccionado &&
        m.detalle?.aletines
    )
      ? [
          new Paragraph({
            spacing: { line: 260, after: 120 },
            indent: { left: 400 },
            children: [
              new TextRun({
                text: `- Sustitución de los aletines originales por otros, marca ${
                  modificaciones.find(
                    (m) => m.nombre === 'ALETINES Y SOBREALETINES'
                  )!.marcaAletines
                }, referencia ${
                  modificaciones.find(
                    (m) => m.nombre === 'ALETINES Y SOBREALETINES'
                  )!.referenciaAletines
                }, de material plástico ABS y ancho de ${
                  modificaciones.find(
                    (m) => m.nombre === 'ALETINES Y SOBREALETINES'
                  )!.anchoAletines
                } mm. Se asegura la no interferencia entre el neumático y ningún punto de la carrocería.`,
              }),
            ],
          }),
        ]
      : []),

    // SOBREALETINES
    ...(modificaciones.some(
      (m) =>
        m.nombre === 'ALETINES Y SOBREALETINES' &&
        m.seleccionado &&
        m.detalle?.sobrealetines
    )
      ? [
          new Paragraph({
            spacing: { line: 260, after: 120 },
            indent: { left: 400 },
            children: [
              new TextRun({
                text: `- Instalación de sobrealetines en los cuatro pasos de rueda fabricados en goma de forma artesanal de ${
                  modificaciones.find(
                    (m) => m.nombre === 'ALETINES Y SOBREALETINES'
                  )!.anchoSobrealetines
                } mm de ancho, asegurando la no interferencia entre el neumático y cualquier punto de la carrocería.`,
              }),
            ],
          }),
        ]
      : []),

    // --- SNORKEL ---
    ...(modificaciones.some(
      (mod) => mod.nombre === 'SNORKEL' && mod.seleccionado
    )
      ? [
          (() => {
            const mod = modificaciones.find(
              (m) => m.nombre === 'SNORKEL' && m.seleccionado
            );
            return mod
              ? new Paragraph({
                  spacing: { line: 260, after: 120 },
                  indent: { left: 400 },
                  children: [
                    new TextRun({
                      text: `- Instalación de Snorkel fabricado en material ${mod.materialSnorkel}, de marca ${mod.marcaSnorkel}, con medidas ${mod.medidasSnorkel}, garantizando que se respeta la admisión original del vehículo y que los nuevos conductos tienen una sección superior a la del filtro de admisión original.`,
                    }),
                  ],
                })
              : null;
          })(),
        ].filter(Boolean)
      : []),

    // PARAGOLPES DELANTERO
    ...(modificaciones.some(
      (m) => m.nombre === 'PARAGOLPES DELANTERO' && m.seleccionado
    )
      ? [
          (() => {
            const mod = modificaciones.find(
              (m) => m.nombre === 'PARAGOLPES DELANTERO' && m.seleccionado
            )!;

            // Aquí definimos la frase según la opción
            const fraseParagolpesDelantero =
              mod.tipoFabricacionParagolpesDelantero === 'comercial'
                ? `Sustitución de paragolpes delantero marca ${mod.marcaParagolpes}, referencia ${mod.referenciaParagolpes} de medidas ${mod.medidasParagolpesDelantero} mm.`
                : `Sustitución de paragolpes delantero fabricado en acero de forma artesanal de medidas ${mod.medidasParagolpesDelantero} mm.`;

            return new Paragraph({
              spacing: { line: 260, after: 120 },
              indent: { left: 400 },
              children: [
                new TextRun({ text: `- ${fraseParagolpesDelantero}` }),
              ],
            });
          })(),
        ]
      : []),

    // PARAGOLPES TRASERO
    ...(modificaciones.some(
      (m) => m.nombre === 'PARAGOLPES TRASERO' && m.seleccionado
    )
      ? [
          (() => {
            const mod = modificaciones.find(
              (m) => m.nombre === 'PARAGOLPES TRASERO' && m.seleccionado
            )!;

            // Aquí definimos la frase según la opción
            const fraseParagolpesTrasero =
              mod.tipoFabricacionParagolpesTrasero === 'comercial'
                ? `Sustitución de paragolpes trasero marca ${mod.marcaParagolpesTrasero}, referencia ${mod.referenciaParagolpesTrasero} de medidas ${mod.medidasParagolpesTrasero} mm.`
                : `Sustitución de paragolpes trasero fabricado en acero de forma artesanal de medidas ${mod.medidasParagolpesTrasero} mm.`;

            return new Paragraph({
              spacing: { line: 260, after: 120 },
              indent: { left: 400 },
              children: [new TextRun({ text: `- ${fraseParagolpesTrasero}` })],
            });
          })(),
        ]
      : []),

    // CABRESTANTE
    ...(modificaciones.some((m) => m.nombre === 'CABRESTANTE' && m.seleccionado)
      ? [
          (() => {
            const mod = modificaciones.find(
              (m) => m.nombre === 'CABRESTANTE' && m.seleccionado
            )!;
            return new Paragraph({
              spacing: { line: 260, after: 120 },
              indent: { left: 400 },
              children: [
                new TextRun({
                  text: `- Instalación de cabrestante en la parte delantera del vehículo con marca ${mod.marcaCabrestante}, con carga vertical de ${mod.capacidadCabrestanteLb} LB (${mod.capacidadCabrestanteKg} Kg). Este dispositivo solamente puede funcionar en estacionario mediante relé.`,
                }),
              ],
            });
          })(),
        ]
      : []),

    // ANTIEMPOTRAMIENTO
    ...(modificaciones.some(
      (m) => m.nombre === 'ANTIEMPOTRAMIENTO' && m.seleccionado
    )
      ? [
          (() => {
            const mod = modificaciones.find(
              (m) => m.nombre === 'ANTIEMPOTRAMIENTO' && m.seleccionado
            )!;
            return new Paragraph({
              spacing: { line: 260, after: 120 },
              indent: { left: 400 },
              children: [
                new TextRun({
                  text: `- Instalación de barra trasera de antiempotramiento, fabricada en acero de forma artesanal de medidas ${mod.medidasAntiempotramiento} mm, ubicada bajo paragolpes posterior.`,
                }),
              ],
            });
          })(),
        ]
      : []),

    // SOPORTES PARA LUCES DE USO ESPECÍFICO
    ...(modificaciones.some(
      (m) =>
        m.nombre === 'SOPORTES PARA LUCES DE USO ESPECÍFICO' && m.seleccionado
    )
      ? [
          (() => {
            const mod = modificaciones.find(
              (m) =>
                m.nombre === 'SOPORTES PARA LUCES DE USO ESPECÍFICO' &&
                m.seleccionado
            )!;
            return new Paragraph({
              spacing: { line: 260, after: 120 },
              indent: { left: 400 },
              children: [
                new TextRun({
                  text: `- Instalación de soporte para luces de uso específico en condiciones reglamentarias ${mod.ubicacionLucesEspecificas}, fabricado en acero de medidas ${mod.medidasLucesEspecificas} mm.`,
                }),
              ],
            });
          })(),
        ]
      : []),

    // SOPORTE PARA RUEDA DE REPUESTO
    ...(modificaciones.some(
      (m) => m.nombre === 'SOPORTE PARA RUEDA DE REPUESTO' && m.seleccionado
    )
      ? [
          (() => {
            const mod = modificaciones.find(
              (m) =>
                m.nombre === 'SOPORTE PARA RUEDA DE REPUESTO' && m.seleccionado
            )!;
            const textoRueda =
              mod.tipoFabricacionRuedaRepuesto === 'comercial'
                ? `Sustitución de soporte para rueda de repuesto marca ${mod.marcaRuedaRepuesto}, referencia ${mod.referenciaRuedaRepuesto} de medidas ${mod.medidasRuedaRepuesto} mm.`
                : `Sustitución de soporte para rueda de repuesto fabricado en acero de forma artesanal de medidas ${mod.medidasRuedaRepuesto} mm.`;

            return new Paragraph({
              spacing: { line: 260, after: 120 },
              indent: { left: 400 },
              children: [new TextRun({ text: `- ${textoRueda}` })],
            });
          })(),
        ]
      : []),

    // SUSPENSIÓN
    ...(modificaciones.some((m) => m.nombre === 'SUSPENSIÓN' && m.seleccionado)
      ? [
          (() => {
            const mod = modificaciones.find(
              (m) => m.nombre === 'SUSPENSIÓN' && m.seleccionado
            )!;

            return new Paragraph({
              spacing: { line: 260, after: 120 },
              indent: { left: 400 },
              children: [
                new TextRun({
                  text: `- Modificación del sistema de suspensión del vehículo instalando: ${mod.descripcionSuspensionDelantera}`,
                }),
              ],
            });
          })(),
        ]
      : []),

    // CASUÍSTICA DE MUELLES, BALLESTAS Y AMORTIGUADORES
    ...(modificaciones.some(
      (m) =>
        m.nombre ===
          'TODA LA CASUÍSTICA DE MUELLES, BALLESTAS Y AMORTIGUADORES QUE SE PUEDEN DAR' &&
        m.seleccionado
    )
      ? [
          (() => {
            const mod = modificaciones.find(
              (m) =>
                m.nombre ===
                  'TODA LA CASUÍSTICA DE MUELLES, BALLESTAS Y AMORTIGUADORES QUE SE PUEDEN DAR' &&
                m.seleccionado
            )!;
            const out: Paragraph[] = [];

            // 1) Muelles delanteros con referencia
            if (mod.detallesMuelles?.['muelleDelanteroConRef']) {
              out.push(
                new Paragraph({
                  spacing: { line: 260, after: 120 },
                  indent: { left: 420 },
                  children: [
                    new TextRun({
                      text: `- Muelles delanteros marca ${mod.marcaMuelleDelanteroConRef} referencia ${mod.referenciaMuelleDelanteroConRef}.`,
                    }),
                  ],
                })
              );
            }

            // 2) Muelles delanteros sin referencia
            if (mod.detallesMuelles?.['muelleDelanteroSinRef']) {
              out.push(
                new Paragraph({
                  spacing: { line: 260, after: 120 },
                  indent: { left: 400 },
                  children: [
                    new TextRun({
                      text: `- Muelles delanteros marca ${mod.marcaMuelleDelanteroSinRef}, sin referencia de dimensiones:`,
                    }),
                  ],
                }),
                new Paragraph({
                  spacing: { line: 260, after: 120 },
                  indent: { left: 620 },
                  children: [
                    new TextRun({
                      text: `
  • Diámetro exterior ${mod.diametroExteriorDelantero} mm
  • Longitud de muelle ${mod.longitudDelantero} mm
  • Diámetro de la espira ${mod.diametroEspiraDelantero} mm
  • Número de espiras ${mod.numeroEspirasDelantero}.`,
                    }),
                  ],
                })
              );
            }

            // 3) Ballesta delantera
            if (mod.detallesMuelles?.['ballestaDelantera']) {
              out.push(
                new Paragraph({
                  spacing: { line: 260, after: 120 },
                  indent: { left: 400 },
                  children: [
                    new TextRun({
                      text: `- Ballesta delantera marca ${mod.marcaBallestaDelantera} referencia ${mod.referenciaBallestaDelantera}.`,
                    }),
                  ],
                })
              );
            }

            // 4) Amortiguador delantero
            if (mod.detallesMuelles?.['amortiguadorDelantero']) {
              out.push(
                new Paragraph({
                  spacing: { line: 260, after: 120 },
                  indent: { left: 400 },
                  children: [
                    new TextRun({
                      text: `- Amortiguadores delanteros marca ${mod.marcaAmortiguadorDelantero} referencia ${mod.referenciaAmortiguadorDelantero}.`,
                    }),
                  ],
                })
              );
            }

            // 5) Amortiguador trasero
            if (mod.detallesMuelles?.['amortiguadorTrasero']) {
              out.push(
                new Paragraph({
                  spacing: { line: 260, after: 120 },
                  indent: { left: 400 },
                  children: [
                    new TextRun({
                      text: `- Amortiguadores traseros marca ${mod.marcaAmortiguadorTrasero} referencia ${mod.referenciaAmortiguadorTrasero}.`,
                    }),
                  ],
                })
              );
            }

            // 6) Tacos de goma
            if (mod.detallesMuelles?.['tacosDeGoma']) {
              out.push(
                new Paragraph({
                  spacing: { line: 260, after: 120 },
                  indent: { left: 400 },
                  children: [
                    new TextRun({
                      text: `- Instalación de tacos de goma sobre amortiguadores delanteros de ${mod.diametroTacoDelantero} mm de diámetro y ${mod.espesorTacoDelantero} mm de espesor, y traseros de ${mod.diametroTacoTrasero} mm de diámetro y ${mod.espesorTacoTrasero} mm de espesor.`,
                    }),
                  ],
                })
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

              out.push(
                new Paragraph({
                  spacing: { line: 260, after: 120 },
                  indent: { left: 400 },
                  children: [
                    new TextRun({
                      text:
                        `- Instalación de kit de elevación en ` +
                        partesEjes.join(' y ') +
                        `, fabricados en aluminio marca ` +
                        marcas.join(' y ') +
                        `, compuestos por:`,
                    }),
                  ],
                })
              );

              // 2) DETALLE MUELLES DELANTEROS
              if (mod.detallesMuelles?.['kitElevacionDelantero']) {
                out.push(
                  new Paragraph({
                    spacing: { line: 260, after: 60 },
                    indent: { left: 620 },
                    children: [
                      new TextRun({
                        text:
                          `• Muelles delanteros: taco ${mod.tipoTacoDelantero} de aluminio de ` +
                          `${mod.diametroTacoDelantero} mm Ø y ` +
                          `${mod.espesorTacoDelantero} mm de espesor ` +
                          `instalado en cada muelle delantero, marca ${mod.marcaKitElevacionDelantera}.`,
                      }),
                    ],
                  })
                );
              }

              // 3) DETALLE BALLESTAS TRASERAS
              if (mod.detallesMuelles?.['kitElevacionTrasero']) {
                out.push(
                  new Paragraph({
                    spacing: { line: 260, after: 360 },
                    indent: { left: 620 },
                    children: [
                      new TextRun({
                        text:
                          `• Ballestas traseras: taco ${mod.tipoTacoTrasero} de aluminio ` +
                          `${
                            mod.tipoTacoTrasero === 'rectangular'
                              ? 'de forma rectangular de medidas '
                              : ''
                          }` +
                          `${mod.diametroTacoTrasero} x ${mod.espesorTacoTrasero} mm de espesor ` +
                          `sobre ballesta trasera, marca ${mod.marcaKitElevacionTrasera}.`,
                      }),
                    ],
                  })
                );
              }
            }

            // 8) Nota final
            if (mod.anotacion) {
              out.push(
                new Paragraph({
                  spacing: { line: 260, after: 120 },
                  children: [
                    new TextRun({ text: 'NOTA: ', bold: true }),
                    new TextRun({
                      text: 'Estos dispositivos no modifican las condiciones técnicas de dirección. Se asegura la no interferencia entre los neumáticos y ningún punto de la carrocería.',
                    }),
                  ],
                })
              );
            }

            return out;
          })(),
        ].flat()
      : []),

    // MATRÍCULA Y PORTAMATRÍCULA
    ...(modificaciones.some(
      (m) => m.nombre === 'MATRÍCULA Y PORTAMATRÍCULA' && m.seleccionado
    )
      ? [
          (() => {
            const mod = modificaciones.find(
              (m) => m.nombre === 'MATRÍCULA Y PORTAMATRÍCULA' && m.seleccionado
            )!;
            const out: Paragraph[] = [];

            // 1) Instalación
            if (
              mod.detalle?.instalacionPorta &&
              mod.fabricacionPorta1 === 'artesanal'
            ) {
              out.push(
                new Paragraph({
                  spacing: { line: 260, after: 120 },
                  indent: { left: 420 },
                  children: [
                    new TextRun({
                      text: `- Instalación de portamatrículas ${mod.ubicacionPorta1} en el lado ${mod.ladoPorta1} fabricado en ${mod.materialPorta1} de forma artesanal.`,
                    }),
                  ],
                })
              );
            } else {
              out.push(
                new Paragraph({
                  spacing: { line: 260, after: 120 },
                  indent: { left: 420 },
                  children: [
                    new TextRun({
                      text: `- Instalación de portamatrículas ${mod.ubicacionPorta1} en el lado ${mod.ladoPorta1} fabricado en ${mod.materialPorta1} de la marca ${mod.marcaPorta1} y referencia ${mod.referenciaPorta1}.`,
                    }),
                  ],
                })
              );
            }

            // 2) Reubicación
            if (mod.detalle?.reubicacionTrasera) {
              const nuevo = mod.paragolpesNuevo2 === true ? 'nuevo ' : '';
              out.push(
                new Paragraph({
                  spacing: { line: 260, after: 120 },
                  indent: { left: 400 },
                  children: [
                    new TextRun({
                      text: `- Reubicación de la placa de matrícula ${mod.ubicacionPorta2} en el ${nuevo} portamatrículas ${mod.portamatr2}`,
                    }),
                  ],
                })
              );
            }

            // 3) Cambio de ubicación
            if (mod.detalle?.cambioUbicacionDelantera) {
              const nuevo = mod.paragolpesNuevo3 === true ? 'nuevo ' : '';
              out.push(
                new Paragraph({
                  spacing: { line: 260, after: 120 },
                  indent: { left: 400 },
                  children: [
                    new TextRun({
                      text: `- Cambio de ubicación de placa de matrícula ${mod.ubicacionMat3} ${mod.materialMat3} de medidas ${mod.medidasMat3} mm en la parte ${mod.ubicacionBumper3} del ${nuevo} paragolpes.`,
                    }),
                  ],
                })
              );
            }
            return out;
          })(),
        ].flat()
      : []),

    // DEFENSA DELANTERA
    ...(modificaciones.some(
      (m) => m.nombre === 'DEFENSA DELANTERA' && m.seleccionado
    )
      ? [
          (() => {
            const mod = modificaciones.find(
              (m) => m.nombre === 'DEFENSA DELANTERA' && m.seleccionado
            )!;
            return new Paragraph({
              spacing: { line: 260, after: 120 },
              indent: { left: 400 },
              children: [
                new TextRun({
                  text:
                    `- Instalación de defensa integral delantera ${mod.marcaDefensa}` +
                    (mod.modeloDefensa ? ` modelo ${mod.modeloDefensa}` : '') +
                    `, fabricada con tubo de ${mod.grosorTuboDefensa} mm de acero inoxidable de dimensiones ${mod.medidasDefensa} mm.`,
                }),
              ],
            });
          })(),
        ]
      : []),

    // AMORTIGUADOR DE DIRECCIÓN
    ...(modificaciones.some(
      (m) => m.nombre === 'AMORTIGUADOR DE DIRECCIÓN' && m.seleccionado
    )
      ? [
          (() => {
            const mod = modificaciones.find(
              (m) => m.nombre === 'AMORTIGUADOR DE DIRECCIÓN' && m.seleccionado
            )!;
            return new Paragraph({
              spacing: { line: 260, after: 120 },
              indent: { left: 400 },
              children: [
                new TextRun({
                  text:
                    `- Sustitución del amortiguador de dirección original por otro marca ${mod.marcaAmortiguador}` +
                    (mod.referenciaAmortiguador
                      ? ` referencia ${mod.referenciaAmortiguador}`
                      : '') +
                    `, instalado en anclajes originales.`,
                }),
              ],
            });
          })(),
        ]
      : []),

    // BARRA DE DIRECCIÓN
    ...(modificaciones.some(
      (m) => m.nombre === 'BARRA DE DIRECCIÓN' && m.seleccionado
    )
      ? [
          (() => {
            const mod = modificaciones.find(
              (m) => m.nombre === 'BARRA DE DIRECCIÓN' && m.seleccionado
            )!;
            return new Paragraph({
              spacing: { line: 260, after: 120 },
              indent: { left: 400 },
              children: [
                new TextRun({
                  text:
                    `- Instalación de barra de dirección reforzada, marca ${mod.marcaBarraDireccion}. ` +
                    `Esta barra es una sustitución de la original, está anclada sobre anclajes originales, ` +
                    `tiene un diámetro superior al de origen y es de material más resistente.`,
                }),
              ],
            });
          })(),
        ]
      : []),

    // BARRA PARA REGULAR LA CONVERGENCIA DE LAS RUEDAS (alineamiento)
    ...(modificaciones.some(
      (m) =>
        m.nombre ===
          'BARRA PARA REGULAR LA CONVERGENCIA DE LAS RUEDAS (alineamiento)' &&
        m.seleccionado
    )
      ? [
          (() => {
            const mod = modificaciones.find(
              (m) =>
                m.nombre ===
                  'BARRA PARA REGULAR LA CONVERGENCIA DE LAS RUEDAS (alineamiento)' &&
                m.seleccionado
            )!;
            return new Paragraph({
              spacing: { line: 260, after: 120 },
              indent: { left: 400 },
              children: [
                new TextRun({
                  text: `- Instalación de barra para regular la convergencia de ambas ruedas delanteras al mismo valor regulable y reforzada, marca ${mod.marcaConvergencia}. Esta barra es una sustitución de la original, está anclada sobre anclajes originales, tiene un diámetro superior a la de origen, es de material más resistente.`,
                }),
              ],
            });
          })(),
        ]
      : []),

    // BARRA PARA REGULAR LA CONVERGENCIA DE LAS RUEDAS (movimiento lateral)
    ...(modificaciones.some(
      (m) =>
        m.nombre ===
          'BARRA PARA REGULAR LA CONVERGENCIA DE LAS RUEDAS (movimiento lateral)' &&
        m.seleccionado
    )
      ? [
          (() => {
            const mod = modificaciones.find(
              (m) =>
                m.nombre ===
                  'BARRA PARA REGULAR LA CONVERGENCIA DE LAS RUEDAS (movimiento lateral)' &&
                m.seleccionado
            )!;
            const regulable =
              mod.regulable === true ? 'regulable ' : 'no regulable';
            return new Paragraph({
              spacing: { line: 260, after: 120 },
              indent: { left: 400 },
              children: [
                new TextRun({
                  text: `- Instalación de barra de Panhard ${regulable} marca ${mod.marcaConvergenciaReg} referencia ${mod.referenciaConvergenciaReg}. Esta barra es una sustitución de la original, está anclada sobre anclajes originales, tiene un diámetro superior a la de origen, es de material más resistente.`,
                }),
              ],
            });
          })(),
        ]
      : []),

    // FAROS DELANTEROS PRINCIPALES
    ...(modificaciones.some(
      (m) => m.nombre === 'FAROS DELANTEROS PRINCIPALES' && m.seleccionado
    )
      ? [
          (() => {
            const mod = modificaciones.find(
              (m) =>
                m.nombre === 'FAROS DELANTEROS PRINCIPALES' && m.seleccionado
            )!;
            const led = mod.esLed === true ? 'LED ' : 'tradicional';
            const regulable =
              mod.regulable === true ? 'regulable ' : 'no regulable';
            return new Paragraph({
              spacing: { line: 260, after: 120 },
              indent: { left: 400 },
              children: [
                new TextRun({
                  text: `- Sustitución de los faros delanteros sin cambiar la posición original ni anclajes originales por otros con sistema ${led} de la marca ${mod.marca}. Contraseña de homologación nº ${mod.homologacion} y marcado ${mod.marcadoCruce} (luz cruce/carretera) ${mod.marcadoPosicion} (luz de posición) con ${mod.pdlFaro}pdl/ud. Estos dispositivos se encienden desde los mandos originales. La luz de posición y cruce quedan desactivadas.`,
                }),
              ],
            });
          })(),
        ]
      : []),

    // LUZ DE CRUCE
    ...(modificaciones.some(
      (m) => m.nombre === 'LUZ DE CRUCE' && m.seleccionado
    )
      ? [
          (() => {
            const mod = modificaciones.find(
              (m) => m.nombre === 'LUZ DE CRUCE' && m.seleccionado
            )!;
            const carretera =
              mod.carreteraDesactivada === true
                ? ' La función de luz de carretera queda desactivada. '
                : '';
            return new Paragraph({
              spacing: { line: 260, after: 120 },
              indent: { left: 400 },
              children: [
                new TextRun({
                  text: `- Sustitución de luz de cruce por otra con marcaje ${mod.marcaje} y contraseña de homologación ${mod.homologacion} con ${mod.pdlFaroCruce}pdl/ud, accionada desde los mandos originales.${carretera}`,
                }),
              ],
            });
          })(),
        ]
      : []),

    // LUCES DE LARGO ALCANCE
    ...(modificaciones.some(
      (m) => m.nombre === 'LUCES DE LARGO ALCANCE' && m.seleccionado
    )
      ? [
          (() => {
            const mod = modificaciones.find(
              (m) => m.nombre === 'LUCES DE LARGO ALCANCE' && m.seleccionado
            )!;
            const regulable =
              mod.regulable === true ? 'regulable ' : 'no regulable';
            return new Paragraph({
              spacing: { line: 260, after: 120 },
              indent: { left: 400 },
              children: [
                new TextRun({
                  text: `- Instalación de luces de largo alcance marca ${mod.marca} ref. ${mod.referencia} con marcaje ${mod.marcaje} y contraseña de homologación ${mod.homologacion}, índice de referencia ${mod.indiceReferencia} pdl/ud sin superar los 100 puntos de luz ni 430000 candelas, conectados al mando original.`,
                }),
              ],
            });
          })(),
        ]
      : []),

    // LUZ DE POSICIÓN
    ...(modificaciones.some(
      (m) => m.nombre === 'LUZ DE POSICIÓN' && m.seleccionado
    )
      ? [
          (() => {
            const mod = modificaciones.find(
              (m) => m.nombre === 'LUZ DE POSICIÓN' && m.seleccionado
            )!;
            const esLed = mod.esLed === true ? 'LED' : 'tradicional';
            return new Paragraph({
              spacing: { line: 260, after: 120 },
              indent: { left: 400 },
              children: [
                new TextRun({
                  text: `- Instalación de luz de posición con sistema ${esLed} marca ${mod.marcaPosicion} con marcaje ${mod.marcajePosicion} y contraseña de homologación ${mod.homologacionPosicion}, accionada desde los mandos originales.`,
                }),
              ],
            });
          })(),
        ]
      : []),

    // 3ª LUZ DE FRENO
    ...(modificaciones.some(
      (m) => m.nombre === '3ª LUZ DE FRENO' && m.seleccionado
    )
      ? [
          (() => {
            const mod = modificaciones.find(
              (m) => m.nombre === '3ª LUZ DE FRENO' && m.seleccionado
            )!;
            const regulable =
              mod.regulable === true ? 'regulable ' : 'no regulable';
            return new Paragraph({
              spacing: { line: 260, after: 120 },
              indent: { left: 400 },
              children: [
                new TextRun({
                  text: `- Sustitución de la tercera luz de freno por otra marca ${mod.marca3Freno} con marcaje ${mod.marcaje3Freno} y homologación ${mod.homologacion3Freno}, situado ${mod.situado3Freno} y accionada desde los mandos originales.`,
                }),
              ],
            });
          })(),
        ]
      : []),

    // DIURNAS
    ...(modificaciones.some((m) => m.nombre === 'DIURNAS' && m.seleccionado)
      ? [
          (() => {
            const mod = modificaciones.find(
              (m) => m.nombre === 'DIURNAS' && m.seleccionado
            )!;
            return new Paragraph({
              spacing: { line: 260, after: 120 },
              indent: { left: 400 },
              children: [
                new TextRun({
                  text: `- Instalación de luces diurnas marca ${mod.marcaDiurnas} con contraseña de homologación ${mod.homologacionDiurnas}.`,
                }),
              ],
            });
          })(),
        ]
      : []),

    // ANTINIEBLA
    ...(modificaciones.some((m) => m.nombre === 'ANTINIEBLA' && m.seleccionado)
      ? [
          (() => {
            const mod = modificaciones.find(
              (m) => m.nombre === 'ANTINIEBLA' && m.seleccionado
            )!;
            return new Paragraph({
              spacing: { line: 260, after: 120 },
              indent: { left: 400 },
              children: [
                new TextRun({
                  text: `- Instalación de luces antiniebla marca ${mod.marcaAntiniebla} con contraseña de homologación ${mod.homologacionAntiniebla}.`,
                }),
              ],
            });
          })(),
        ]
      : []),

    // PILOTO TRASERO
    ...(modificaciones.some(
      (m) => m.nombre === 'PILOTO TRASERO' && m.seleccionado
    )
      ? [
          (() => {
            const mod = modificaciones.find(
              (m) => m.nombre === 'PILOTO TRASERO' && m.seleccionado
            )!;
            const out: Paragraph[] = [];

            // Línea principal
            out.push(
              new Paragraph({
                spacing: { line: 260, after: 120 },
                indent: { left: 400 },
                children: [
                  new TextRun({
                    text: `- Sustitución de los pilotos traseros por otros marca ${mod.marcaPilotoTrasero} con los siguientes marcajes:`,
                  }),
                ],
              })
            );

            // Sub‐bullets
            if (mod.detalle?.luzPosicionFreno) {
              out.push(
                new Paragraph({
                  spacing: { line: 260, after: 60 },
                  indent: { left: 620 },
                  children: [
                    new TextRun({
                      text: `• Luz de posición y freno ${mod.referenciaLuzPosicionFreno}`,
                    }),
                  ],
                })
              );
            }
            if (mod.detalle?.intermitente) {
              out.push(
                new Paragraph({
                  spacing: { line: 260, after: 60 },
                  indent: { left: 620 },
                  children: [
                    new TextRun({
                      text: `• Intermitente ${mod.referenciaIntermitente}`,
                    }),
                  ],
                })
              );
            }
            if (mod.detalle?.marchaAtras) {
              out.push(
                new Paragraph({
                  spacing: { line: 260, after: 60 },
                  indent: { left: 620 },
                  children: [
                    new TextRun({
                      text: `• Marcha atrás ${mod.referenciaMarchaAtras}`,
                    }),
                  ],
                })
              );
            }
            if (mod.detalle?.catadioptrico) {
              out.push(
                new Paragraph({
                  spacing: { line: 260, after: 60 },
                  indent: { left: 620 },
                  children: [
                    new TextRun({
                      text: `• Catadióptrico ${mod.referenciaCatadioptrico}`,
                    }),
                  ],
                })
              );
            }

            return out;
          })(),
        ].flat()
      : []),

    // INTERMITENTES
    ...(modificaciones.some(
      (m) => m.nombre === 'INTERMITENTES' && m.seleccionado
    )
      ? [
          (() => {
            const mod = modificaciones.find(
              (m) => m.nombre === 'INTERMITENTES' && m.seleccionado
            )!;
            const regulable =
              mod.regulable === true ? 'regulable ' : 'no regulable';
            return new Paragraph({
              spacing: { line: 260, after: 120 },
              indent: { left: 400 },
              children: [
                new TextRun({
                  text: `- Sustitución de los intermitentes delanteros por otros con marcaje ${mod.marcajeIntermitentes} y contraseña de homologación ${mod.homologacionIntermitentes}, Los intermitentes delanteros originales quedan inhabilitados.`,
                }),
              ],
            });
          })(),
        ]
      : []),

    // SUSTITUCIÓN DE EJES
    ...(modificaciones.some(
      (m) => m.nombre === 'SUSTITUCIÓN DE EJES' && m.seleccionado
    )
      ? [
          (() => {
            return new Paragraph({
              spacing: { line: 260, after: 120 },
              indent: { left: 400 },
              children: [
                new TextRun({
                  text: `- Sustitución del eje delantero por otro procedente de un vehículo marca ${data.marca} denominación comercial ${data.denominacion}, con contraseña de homologación de tipo ${data.homologacion}.`,
                }),
              ],
            });
          })(),
        ]
      : []),

    // ESTRIBOS LATERALES O TALONERAS
    ...(modificaciones.some(
      (m) => m.nombre === 'ESTRIBOS LATERALES O TALONERAS' && m.seleccionado
    )
      ? [
          (() => {
            return new Paragraph({
              spacing: { line: 260, after: 120 },
              indent: { left: 400 },
              children: [
                new TextRun({
                  text: `- Instalación de ${data.estribosotaloneras} laterales marca ${data.marcataloneras} fabricados en ${data.materialEstribos}, de dimensiones ${data.dimensionesTaloneras}mm.`,
                }),
              ],
            });
          })(),
        ]
      : []),
  ];

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
      //...punto1_6Consideraciones,
      ...buildModificacionesParagraphs(modificaciones, data),
      ...generarDocumentoProyectoParagraphs({ modificaciones }, data),
    ].filter((child) => child !== null),
  };

  //5) Monta y descarga el documento
  const doc = new Document({
    sections: [section1, section2],
  });

  //2) Empaqueta y descarga
  const blob = await Packer.toBlob(doc);
  saveAs(blob, 'documento-avanzado.docx');
}
