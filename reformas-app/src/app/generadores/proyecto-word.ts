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

export async function generarDocumentoProyecto(data: any): Promise<void> {
  const response = await fetch('assets/logo.png');
  const imageBuffer = await response.arrayBuffer();

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
    ],
  };

  //5) Monta y descarga el documento
  const doc = new Document({
    sections: [section1, section2],
  });

  //2) Empaqueta y descarga
  const blob = await Packer.toBlob(doc);
  saveAs(blob, 'documento-avanzado.docx');
}
