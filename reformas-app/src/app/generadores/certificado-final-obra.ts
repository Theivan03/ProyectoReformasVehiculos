import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Header,
  Footer,
  SectionType,
  PageNumber,
  WidthType,
  BorderStyle,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  VerticalAlign,
  ImageRun,
  HeadingLevel,
} from 'docx';
import ingeniero from '../../assets/ingeniero.json';
import saveAs from 'file-saver';
import { Modificacion } from '../interfaces/modificacion';
import { buildModificacionesParagraphs } from '../Funciones/buildModificacionesParagraphs';
import loadImage from 'blueimp-load-image';

interface ImageInfo {
  buffer: ArrayBuffer;
  width: number;
  height: number;
  mimeType: string;
}

export async function generarDocumentoFinalObra(data: any): Promise<void> {
  const modificaciones: Modificacion[] = data.modificaciones;

  // 1) Header
  const header = new Header({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
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
                        text: 'CERTIFICADO FINAL DE OBRA POR REFORMA DE UN VEHÍCULO',
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
                        text: 'REF.: ' + data.referenciaCFO,
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
      width: { size: 85, type: WidthType.PERCENTAGE },
      borders: {
        // todas las líneas de la tabla a tamaño 0
        top: { style: BorderStyle.NONE, size: 0 },
        bottom: { style: BorderStyle.NONE, size: 0 },
        left: { style: BorderStyle.NONE, size: 0 },
        right: { style: BorderStyle.NONE, size: 0 },
        insideHorizontal: { style: BorderStyle.NONE, size: 0 },
        insideVertical: { style: BorderStyle.NONE, size: 0 },
      },
      rows: [
        ['MARCA', data.marca],
        [
          'TIPO/VARIANTE/VERSIÓN',
          `${data.tipo} / ${data.variante} / ${data.version}`,
        ],
        ['DENOMINACIÓN COMERCIAL', data.denominacion],
        ['Nº DE BASTIDOR', data.bastidor],
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
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 200, right: 200 },
                children: [
                  new Paragraph({
                    text: String(label),
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 200, right: 200 },
                children: [
                  new Paragraph({
                    text: String(value),
                    alignment: AlignmentType.CENTER,
                  }),
                ],
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
      width: { size: 70, type: WidthType.PERCENTAGE },
      alignment: AlignmentType.CENTER, // 1) Centra la tabla en la página
      borders: {
        top: { style: BorderStyle.NONE, size: 0 },
        bottom: { style: BorderStyle.NONE, size: 0 },
        left: { style: BorderStyle.NONE, size: 0 },
        right: { style: BorderStyle.NONE, size: 0 },
        insideHorizontal: { style: BorderStyle.NONE, size: 0 },
        insideVertical: { style: BorderStyle.NONE, size: 0 },
      },
      rows: [
        ['NOMBRE EMPRESA', data.tallerSeleccionado.nombre],
        ['DIRECCIÓN TALLER', data.tallerSeleccionado.direccion],
        ['LOCALIDAD', data.tallerSeleccionado.poblacion],
        ['PROVINCIA', data.tallerSeleccionado.provincia],
        ['Nº REGISTRO INDUSTRIAL', data.tallerSeleccionado.registroIndustrial],
        ['Nº REGISTRO ESPECIAL', data.tallerSeleccionado.registroEspecial],
      ].map(
        ([label, value]) =>
          new TableRow({
            children: [
              new TableCell({
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 150, bottom: 150, left: 150, right: 150 }, // 2) Aumenta márgenes
                children: [
                  new Paragraph({
                    text: String(label),
                  }),
                ],
              }),
              new TableCell({
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 150, bottom: 150, left: 150, right: 150 },
                children: [
                  new Paragraph({
                    text: String(value),
                  }),
                ],
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
          'Los actos reglamentarios aplicables a cada una de ellas y que figuran en el Anexo I del presente certificado y documentación adicional correspondiente.'
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
          text:
            'Teulada, ' +
            new Date(data.fechaProyecto).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }),
        }),
      ],
    }),
    new Paragraph({
      alignment: 'right',
      spacing: { before: 2500 },
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

  const imagenes_reformas = [
    new Paragraph({ pageBreakBefore: true }),
    new Paragraph({
      alignment: 'right',
      spacing: { before: 120 },
      children: [
        new TextRun({
          text: 'Anexo 1: Relación de Actos Reglamentarios aplicables a la/s reforma/s efectuadas en el vehículo',
          bold: true,
        }),
      ],
    }),
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
        imagenes_reformas.push(new Paragraph({ pageBreakBefore: true }));
        alturaAcumulada = 0;
      }

      imagenes_reformas.push(
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
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: 'Anexo 2. Fotografías del vehículo antes de la reforma',
          bold: true,
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
    return [prevTable];
  }

  const anexosPorsteriores = await generarPosteriores(data);

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
      ...anexosPrevios,
      ...anexosPorsteriores,
    ].flat(),
  };

  // 5) Monta y descarga el documento
  const doc = new Document({
    sections: [section1],
  });

  // 2) Empaqueta y descarga
  const blob = await Packer.toBlob(doc);
  saveAs(
    blob,
    `${data.referenciaProyecto} CFO ${data.marca} ${data.modelo} ${data.matricula}.docx`
  );
}
