import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
  Media,
  ImageRun,
  ExternalHyperlink,
} from 'docx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'reformas-app';

  async downloadAdvancedDoc() {
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
          text: 'REF.: PTRV 57 25',
          size: 28,
          color: 'FF0000',
        }),
        new TextRun({
          text: ' REV 00',
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
                      text: '☎ 618 622 012',
                      font: 'Arial',
                      size: 28,
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: '✉ hablamos@projectes.es',
                      font: 'Arial',
                      size: 28,
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: '⌂ www.projectes.es',
                      font: 'Arial',
                      size: 28,
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: 'Colegiado 11.380 - COITIG Valencia',
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
            { text: 'JEEP', width: 25 },
            { text: 'MODELO', width: 15 },
            { text: 'WRANGLER UNLIMITED', width: 25 },
          ].map(
            ({ text, width }) =>
              new TableCell({
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
          ['Tipo/Variante/Versión:', 'JK / JXJF9 / C5HD3A'],
          ['MATRÍCULA', '3639JFV'],
          ['Nº BASTIDOR', '1C4HJWE50CL287950'],
          ['FECHA 1ª MATRICULACIÓN', '27/03/2006'],
          ['CONTRASEÑA HOMOLOG.', 'e4*2001/116*0116*11'],
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
                      text: '4.4 - 4.5 - 5.1 - 8.52',
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
                      text: 'TITULAR: JULIO GUNTHER ARAOS BUSTOS',
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
                  children: [
                    new TextRun({ text: 'LUIS SERRANO ARTESERO', bold: true }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: 'COL.11380 COGITI - VALENCIA',
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
          link: 'http://www.projectes.es',
          children: [
            new TextRun({
              font: 'Arial',
              text: 'WWW.PROJECTES.ES',
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

    // 1) Header “tonto”
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
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  verticalAlign: VerticalAlign.CENTER,
                  margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: 'Luis Serrano Artesero',
                          bold: true,
                          size: 16,
                        }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: 'Ingeniero Técnico Industrial',
                          bold: true,
                          size: 16,
                        }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: 'Col. 11.380 COIIG Valencia',
                          bold: true,
                          size: 16,
                        }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: '☎ 618 622 012',
                          bold: true,
                          size: 16,
                        }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: '✉ hablamos@projectes.es',
                          bold: true,
                          size: 16,
                        }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: '⌂ www.projectes.es',
                          bold: true,
                          size: 16,
                        }),
                      ],
                    }),
                  ],
                }),

                // Columna 2 (50%), texto en 8 pt y negrita
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
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
                          text: 'Marca KNAUS Modelo FIAT AUTO SPA I 10',
                          bold: true,
                          size: 16,
                        }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: 'Nº Bastidor ZFA2440007669248',
                          bold: true,
                          size: 16,
                        }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: 'SOLICITANTE: ALQUILA FACIL COSTA SL',
                          bold: true,
                          size: 16,
                        }),
                      ],
                    }),
                  ],
                }),

                // Columna 3 (25%), texto en 10 pt y negrita
                new TableCell({
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  verticalAlign: VerticalAlign.CENTER,
                  margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: 'REF.: PTRV 57/25',
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
                          text: 'REV 00',
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
      ],
    });

    // 2) Función para crear footers, encapsulando el PageNumber en un TextRun
    const makeFooter = () =>
      new Footer({
        children: [
          new Paragraph({
            children: [
              new TextRun('Página '),
              // PageNumber.CURRENT es un literal string, así que lo metemos en un TextRun
              new TextRun({ children: [PageNumber.CURRENT] }),
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
          text: 'Índice',
          heading: HeadingLevel.HEADING_1, // <— usa el enum HeadingLevel.HEADING_1
        }),
        new TableOfContents('Índice', {
          hyperlink: true,
          headingStyleRange: '1-1',
        }),
      ],
    };

    // 4) Segunda sección: páginas 3–7, reiniciando numeración
    const children2: Paragraph[] = [];
    for (let i = 1; i <= 4; i++) {
      children2.push(
        new Paragraph({
          text: `Sección ${i}`,
          heading: HeadingLevel.HEADING_1,
          pageBreakBefore: i !== 1,
        }),
        new Paragraph({
          children: [
            new TextRun('Estás en la página '),
            new TextRun({ children: [PageNumber.CURRENT] }),
          ],
        })
      );
    }
    // Página 7 extra
    children2.push(
      new Paragraph({
        text: 'Contenido extra en la página final.',
        pageBreakBefore: true,
      }),
      new Paragraph({
        children: [
          new TextRun('Estás en la página '),
          new TextRun({ children: [PageNumber.CURRENT] }),
        ],
      })
    );

    const section2 = {
      properties: { type: SectionType.NEXT_PAGE, pageNumberStart: 1 },
      headers: { default: header },
      footers: { default: makeFooter() },
      children: children2,
    };

    // 5) Monta y descarga el documento
    const doc = new Document({
      sections: [section1, section2],
    });

    // 2) Empaqueta y descarga
    const blob = await Packer.toBlob(doc);
    saveAs(blob, 'documento-avanzado.docx');
  }
}
