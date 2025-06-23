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
} from 'docx';
import ingeniero from '../../assets/ingeniero.json';
import saveAs from 'file-saver';
import { Modificacion } from '../interfaces/modificacion';
import { buildModificacionesParagraphs } from '../Funciones/buildModificacionesParagraphs';

export async function generarDocumentoFinalObra(data: any): Promise<void> {
  const modificaciones: Modificacion[] = data.modificaciones;

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

  const seccion = [
    new Paragraph({
      children: [
        new TextRun(
          'D. LUIS SERRANO ARTESERO con DNI 20.037.410-V, colegiado nº 11.380 del Colegio Oficial'
        ),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun(
          'de Peritos e Ingenieros Técnicos Industriales y de Grado de Valencia.'
        ),
      ],
    }),
    new Paragraph({ text: '', spacing: { after: 200 } }),
    new Paragraph({ text: 'CERTIFICA:', spacing: { after: 100 } }),
    new Paragraph({
      text: 'Que bajo mi dirección técnica en el vehículo con los siguientes datos:',
      spacing: { after: 200 },
    }),

    // TABLA DE DATOS DEL VEHÍCULO
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        ['MARCA', data.marca],
        [
          'TIPO/VARIANTE/VERSIÓN',
          `${data.tipo} / ${data.variante} / ${data.version}`,
        ],
        ['DENOMINACIÓN COMERCIAL', data.denominacion],
        ['Nº de bastidor:', data.bastidor],
        ['MATRÍCULA', data.matricula],
        ['CLASIFICACIÓN', data.clasificacion],
        [
          'FECHA 1ª MATRICULACIÓN',
          new Date(data.fechaMatriculacion).toLocaleDateString('es-ES'),
        ],
        ['Nº DE HOMOLOGACIÓN', data.homologacion],
      ].map(
        ([label, value]) =>
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: label })],
              }),
              new TableCell({
                children: [new Paragraph({ text: value })],
              }),
            ],
          })
      ),
    }),

    new Paragraph({ text: '', spacing: { after: 200 } }),
    new Paragraph({
      text: 'Se ha efectuado la reforma realizada en las instalaciones de:',
      spacing: { after: 200 },
    }),

    // TABLA DE DATOS DEL TALLER
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        ['NOMBRE EMPRESA', data.tallerSeleccionado.nombre],
        ['DIRECCIÓN TALLER', data.tallerSeleccionado.direccion],
        ['LOCALIDAD', data.tallerSeleccionado.poblacion],
        ['PROVINCIA', data.tallerSeleccionado.provincia],
        [
          'NÚMERO REGISTRO INDUSTRIAL',
          data.tallerSeleccionado.registroIndustrial,
        ],
        ['NÚMERO REGISTRO ESPECIAL', data.tallerSeleccionado.registroEspecial],
      ].map(
        ([label, value]) =>
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: label })],
              }),
              new TableCell({
                children: [new Paragraph({ text: value })],
              }),
            ],
          })
      ),
    }),

    new Paragraph({ text: '', spacing: { after: 200 } }),
    new Paragraph({
      text: 'La reforma realizada en el vehículo ha consistido en:',
      spacing: { after: 200 },
    }),
  ];

  const punto1_6Tabla = [
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
                nombreMod: 'ALETINES Y SOBREALETINES',
                etiqueta: 'Sobrealetines',
                valor: modificaciones.find(
                  (m) => m.nombre === 'ALETINES Y SOBREALETINES'
                )!.curvaturaSobrealetines!,
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
                  })
              );

            if (dataRows.length === 0) {
              return [];
            }

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

  const bloqueLegal = [
    new Paragraph({
      children: [
        new TextRun({
          text: 'Las modificaciones indicadas anteriormente se corresponden con los códigos de reforma ',
        }),
        new TextRun({
          text: data.codigosReforma,
          bold: true,
        }),
        new TextRun({
          text: ' según la versión en vigor del Manual de Reformas',
          bold: true,
        }),
      ],
      spacing: { after: 200 },
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: 'De acuerdo al R.D. 866/2010, las referidas reformas se efectúan de conformidad a:',
        }),
      ],
      spacing: { after: 200 },
    }),

    new Paragraph({
      bullet: { level: 0 },
      children: [
        new TextRun('PROYECTO TECNICO DE REFORMA, '),
        new TextRun({
          text: 'REF.: ' + data.referenciaProyecto + ' REV ' + data.revision,
          bold: true,
        }),
        new TextRun(
          ', adjunto al presente certificado y firmado por Ingeniero Técnico Industrial Luis Serrano Artesero, colegiado 11380 COGITI Valencia.'
        ),
      ],
      spacing: { after: 200 },
    }),

    new Paragraph({
      bullet: { level: 0 },
      children: [
        new TextRun(
          '·	Los actos reglamentarios aplicables a cada una de ellas y que figuran en el Anexo I del presente certificado y documentación adicional correspondiente.'
        ),
      ],
      spacing: { after: 200 },
    }),

    new Paragraph({
      bullet: { level: 0 },
      children: [
        new TextRun(
          'La reforma del vehículo se concluye, tomándose las fotografías correspondientes que se aportan como Anexo II a este certificado.	'
        ),
      ],
    }),

    new Paragraph({
      bullet: { level: 0 },
      children: [
        new TextRun(
          'La presente Certificación se adjuntará a la documentación que debe aportarse para la legalización de dicho vehículo.'
        ),
      ],
    }),

    new Paragraph({
      alignment: 'right',
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: 'Teulada, ' + new Date().toLocaleDateString(),
        }),
      ],
    }),
    new Paragraph({
      alignment: 'right',
      spacing: { before: 120 },
      children: [new TextRun({ text: 'El Ingeniero Técnico Industrial' })],
    }),
    new Paragraph({
      alignment: 'right',
      spacing: { before: 120 },
      children: [new TextRun({ text: 'Luis Serrano Artesero' })],
    }),
    new Paragraph({
      alignment: 'right',
      spacing: { before: 120 },
      children: [new TextRun({ text: 'Col nº 11380 COITIG Valencia' })],
    }),
  ];

  const section1 = {
    properties: { type: SectionType.NEXT_PAGE, pageNumberStart: 1 },
    headers: { default: header },
    footers: { default: makeFooter() },
    children: [
      ...seccion,
      ...buildModificacionesParagraphs(modificaciones, data),
      ...punto1_6Tabla.flat(),
      ...punto1_6Avisos,
      ...bloqueLegal,
    ],
  };

  // 5) Monta y descarga el documento
  const doc = new Document({
    sections: [section1],
  });

  // 2) Empaqueta y descarga
  const blob = await Packer.toBlob(doc);
  saveAs(blob, 'documento-final-obra.docx');
}
