import {
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  ShadingType,
  BorderStyle,
  HeadingLevel,
} from 'docx';
import { Modificacion } from '../interfaces/modificacion';

export function buildCalculos(
  modificaciones: Modificacion[],
  data: any
): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];

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

  let contador = 0;

  const aletines = modificaciones.find(
    (m) =>
      m.nombre === 'ALETINES Y SOBREALETINES' &&
      m.seleccionado &&
      m.detalle?.aletines
  );
  if (aletines) {
    out.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '2.3.' + contador,
            bold: true,
          }),
        ],
      })
    );

    contador++;

    const tablaCaracteristicas = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'CARACTERÍSTICAS PARA FUERZA PRODUCIDA POR PRESIÓN DEL AIRE',
                      bold: true,
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
              children: [
                new TableCell({ children: [new Paragraph(desc)] }),
                new TableCell({ children: [new Paragraph(val)] }),
              ],
            })
        ),
      ],
    });

    const tablaFuerzas = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            'Peso',
            'Fuerza de frenado',
            'Resistencia aerodinámica',
            'Fuerza centrífuga',
            'Suma de fuerzas',
          ].map(
            (t) =>
              new TableCell({
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: t, bold: true })],
                  }),
                ],
              })
          ),
        }),
        new TableRow({
          children: ['4,91', '5,00', '127,99', '0,95', '138,84'].map(
            (v) => new TableCell({ children: [new Paragraph(v)] })
          ),
        }),
      ],
    });

    const tablaComprobacion = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            'La fuerza de diseño soportada por los anclajes (N)',
            'Fuerza máxima que soportan los tornillos a tracción (N)',
            'Fuerza máxima que soportan los tornillos a cortante (N)',
            'comprobación <= 1',
          ].map(
            (t) =>
              new TableCell({
                shading: { type: ShadingType.CLEAR, fill: 'C0C0C0' },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: t, bold: true })],
                  }),
                ],
              })
          ),
        }),
        new TableRow({
          children: ['416,51', '11746,944', '6526,08', '0,089'].map(
            (v) =>
              new TableCell({
                shading: { type: ShadingType.CLEAR, fill: '00B050' },
                children: [new Paragraph(v)],
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

  return out;
}
