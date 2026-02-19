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
                }),
            ),
          }),
          // Data row: solo índices > 0 pintan verde, todos centrados
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

      const newradioNeumatico =
        ((frenos.radioNeumaticoDiscos ?? 0) * 25.4 +
          2 *
            (((frenos.perfilNeumaticoDiscos ?? 0) *
              (frenos.anchoNeumaticoDiscos ?? 0)) /
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

      const newradioNeumatico =
        ((frenos.radioNeumaticoDiscoTrasero ?? 0) * 25.4 +
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

      const newradioNeumatico =
        ((pinzaMoto.radioNeumaticoDiscos ?? 0) * 25.4 +
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

      const superficiefrontal =
        (aleron.alturaAleron ?? 0) * (aleron.anchuraAleron ?? 0);

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
          (aleron.curvaturaAleron ?? 0));
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
        (aleron.numTornillosAletines ?? 0);
      const fuerzamaximatornilloscortante =
        ((0.5 *
          (aleron.resTraccionMinTornillo88Kgmm2Aleron ?? 0) *
          (aleron.seccionResistenteAsAleron ?? 0)) /
          1.25) *
        (aleron.numTornillosAletines ?? 0);
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
                }),
            ),
          }),
          // Data row: solo índices > 0 pintan verde, todos centrados
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
              snorkel.pesoPiezaKgSnorkel?.toFixed(2).toString() ?? '---',
              'nº tornillos',
              snorkel.nTornillosSnorkel?.toFixed(2).toString() ?? '---',
            ],
            [
              'Anchura de la pieza en m',
              snorkel.anchuraPiezaMSnorkel?.toFixed(2).toString() ?? '---',
              'Métrica',
              snorkel.metricaSnorkel?.toFixed(2).toString() ?? '---',
            ],
            [
              'Altura de la pieza en m',
              snorkel.alturaPiezaMSnorkel?.toFixed(2).toString() ?? '---',
              'Calidad',
              snorkel.calidadTornilloSnorkel?.toFixed(2).toString() ?? '---',
            ],
            [
              'Superficie frontal m²',
              superficiefrontal.toString() ?? '---',
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
              cabrestante.diametroPernoCmCabrestante?.toFixed(2).toString() ??
                '---',
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
              cabrestante.materialPernoChasisCabrestante ?? '---',
            ],
            [
              'Tensión mín., rotura cortante acero',
              cabrestante.tensionMinCortanteChasisKgCm2Cabrestante
                ?.toFixed(2)
                .toString() ?? '---',
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
              soporteslucesespecificas.metricaLucesEspecificas
                ?.toFixed(2)
                .toString() ?? '---',
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
              soporteslucesespecificas.radioCurvaRLucesEspecificas
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
                }),
            ),
          }),
        ],
      });
      out.push(tablaComprobacion);
      out.push(new Paragraph({ text: '' }));
      out.push(new Paragraph({ text: '' }));
    }

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
              fuerzadediseno.toFixed(2).toString() ?? '---',
              fuerzamaximatornillostraccion.toFixed(2).toString() ?? '---',
              fuerzamaximatornilloscortante.toFixed(2).toString() ?? '---',
              comprobacion.toFixed(2).toString() ?? '---',
            ].map(
              (val) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: '00B050' },
                  children: [new Paragraph(val)],
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
              paratras.metricaParaTrasero?.toFixed(2).toString() ?? '---',
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
              fuerzadediseno.toFixed(2).toString() ?? '---',
              fuerzamaximatornillostraccion.toFixed(2).toString() ?? '---',
              fuerzamaximatornilloscortante.toFixed(2).toString() ?? '---',
              comprobacion.toFixed(2).toString() ?? '---',
            ].map(
              (val) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: '00B050' },
                  children: [new Paragraph(val)],
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
      // 1) Título dinámico
      out.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '2.3.' + contador + ' Estribos laterales',
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
              estribostaloneras.metricaTalonera?.toFixed(2).toString() ?? '---',
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
              fuerzadediseno.toFixed(2).toString() ?? '---',
              fuerzamaximatornillostraccion.toFixed(2).toString() ?? '---',
              fuerzamaximatornilloscortante.toFixed(2).toString() ?? '---',
              comprobacion.toFixed(2).toString() ?? '---',
            ].map(
              (val) =>
                new TableCell({
                  margins: CELL_MARGINS,
                  shading: { type: ShadingType.CLEAR, fill: '00B050' },
                  children: [new Paragraph(val)],
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
            ['M.T.M.A. (Kg)', data.mmaAntes.toFixed(2).toString() ?? '---'],
            ['Velocidad máxima (Km/h)', '148'],
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
              ['MMTA/MMA (Kg)', mod.mmtaTotalSuspension?.toString() ?? '---'],
              ['MMTA/MMA eje 1', mod.mmta1EjeSuspension?.toString() ?? '---'],
              ['MMTA/MMA eje 2', mod.mmta2EjeSuspension?.toString() ?? '---'],
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
            ((longMinMuelle / 1000) *
              79500.24 *
              1000000 *
              ((mod.diametroEspiraDelanteroSinRef ?? 0) / 1000) ** 4) /
            (64 *
              (mod.numeroEspirasDelanteroSinRef ?? 0) *
              (diametromedio / 1000 / 2) ** 3);
          cargaMaxEje1Q = cargaMaxQ * 2;
          coefSeguridadK =
            cargaMaxEje1Q / ((mod.mmta1EjeSuspension ?? 0) * 9.81);
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
                      i === 4
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
                  }),
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
                  }),
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
          coefSeguridad =
            maxCortanteDelantero / ((mod.mmta2EjeSuspension ?? 0) * 9.81);
        }

        if (mod?.detallesMuelles?.['muelleTraseroSinRef']) {
          maxCortante =
            (Math.PI *
              (((mod.diametroEspiraTraseroSinRef ?? 0) / 1000) ** 3 *
                1118.34 *
                1000000)) /
            (8 * (diametromedio / 1000));
          maxCortanteDelantero = maxCortante * 2;
          coefSeguridad =
            maxCortanteDelantero / ((mod.mmta2EjeSuspension ?? 0) * 9.81);
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
            ((longMinMuelle / 1000) *
              79500.24 *
              1000000 *
              ((mod.diametroEspiraTraseroRef ?? 0) / 1000) ** 4) /
            (64 *
              (mod.numeroEspirasTraseroRef ?? 0) *
              (diametromedio / 1000 / 2) ** 3);
          cargaMaxEje1Q = cargaMaxQ * 2;
          coefSeguridadK =
            cargaMaxEje1Q / ((mod.mmta2EjeSuspension ?? 0) * 9.81);
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
                      i === 4
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
          fuerzaMaxEjeDelantero = ((mod.mmta1EjeSuspension ?? 0) * 9.81) / 2;
          factorBergstrasserKb = (4 * curvatura + 2) / (4 * curvatura - 3);
          esfuerzoMuelleT =
            (8 * fuerzaMaxEjeDelantero * diametromedio * factorBergstrasserKb) /
            (Math.PI * Math.pow(mod.diametroEspiraTraseroRef ?? 0, 3));
          coefSeguridadFinalK = 1118.34 / esfuerzoMuelleT;
        }

        if (mod?.detallesMuelles?.['muelleTraseroSinRef']) {
          fuerzaMaxEjeDelantero = ((mod.mmta1EjeSuspension ?? 0) * 9.81) / 2;
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
                  }),
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
            ['M.T.M.A. (Kg)', data.mmaAntes.toFixed(2).toString() ?? '---'],
            ['Velocidad máxima (Km/h)', '148'],
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
