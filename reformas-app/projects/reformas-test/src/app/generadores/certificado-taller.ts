import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  SectionType,
  AlignmentType,
} from 'docx';
import saveAs from 'file-saver';
import { Modificacion } from '../interfaces/modificacion';
import { buildModificacionesParagraphs } from '../Funciones/buildModificacionesParagraphs';

export async function generarDocumentoTaller(data: any): Promise<void> {
  const ingeniero = data.ingenieroSeleccionado;
  const modificaciones: Modificacion[] = data.modificaciones;

  const seccion = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'ANEXO III (R.D. 866/2010 Y MANUAL DE REFORMAS DE VEHÍCULOS)',
          bold: true,
        }),
        new TextRun({
          text: ' CERTIFICADO DE TALLER',
          bold: true,
        }),
      ],
      spacing: { after: 300 },
    }),

    new Paragraph({
      children: [
        new TextRun({
          size: 22,
          text: `D. ${data.taller.responsable}, expresamente autorizado por la empresa ${data.taller.nombre}, domiciliada en ${data.taller.poblacion}, provincia de ${data.taller.provincia}, ${data.taller.direccion}, teléfono ${data.taller.telefono} dedicada a la actividad de mecánica, con nº de registro industrial ${data.taller.registroIndustrial} y nº de registro especial (1) ${data.taller.registroEspecial}.`,
        }),
      ],
      spacing: { after: 300 },
    }),

    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'CERTIFICA', bold: true })],
      spacing: { after: 300 },
    }),

    new Paragraph({
      children: [
        new TextRun({
          size: 22,
          text: `Que la mencionada empresa ha realizado la/s reformas, y asume la responsabilidad de la ejecución, sobre el vehículo marca ${data.marca} tipo ${data.tipo}, variante ${data.variante}, versión ${data.version} y denominación comercial ${data.modelo}, contraseña de homologación ${data.homologacion}, matrícula ${data.matricula}, y con n.º de bastidor ${data.bastidor}, de acuerdo con:\n`,
        }),
      ],
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: '- La normativa vigente en materia de reformas de vehículos.',
          size: 22,
        }),
      ],
      spacing: { after: 100, before: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '- Las normas del fabricante del vehículo aplicables a la/s reforma/s llevadas a cabo en dicho vehículo.',
          size: 22,
        }),
      ],
      spacing: { after: 100, before: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `- El proyecto técnico REF.: ${data.referenciaProyecto}, de las reformas adjunto al expediente, realizado por el Ingeniero Técnico Industrial D. ${ingeniero.nombre}, Colegiado nº ${ingeniero.numero} del ${ingeniero.colegio}.`,
          size: 22,
        }),
      ],
      spacing: { after: 200 },
    }),

    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: 'OBSERVACIONES:',
          bold: true,
        }),
      ],
    }),
  ];

  const seccion2 = [
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          size: 22,
          text: 'Se garantiza el cumplimiento de lo previsto en el artículo 6 del Reglamento General de vehículos y, en su caso, en el artículo 9 del Real Decreto 1457/1986, de 10 enero, por el que se regula la actividad industrial en talleres de vehículos automóviles, de equipos y sus componentes, modificado por 455/2010, de 16 de abril.',
        }),
      ],
    }),

    new Paragraph({
      spacing: { after: 200 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          size: 22,
          text: 'Firma y sello:',
        }),
      ],
    }),

    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1000, after: 300 },
      children: [
        new TextRun({
          size: 22,
          text: `Fdo: ${data.taller.responsable}`,
          bold: true,
        }),
      ],
    }),

    new Paragraph({
      spacing: { before: 500, after: 500 },
      children: [
        new TextRun({
          size: 22,
          text: `En ${data.taller.poblacion}, a ${new Date(
            data.fechaProyecto
          ).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}`,
        }),
      ],
      indent: { left: 400 },
    }),

    new Paragraph({
      children: [
        new TextRun({
          size: 22,
          text: '(1)',
          bold: true,
        }),
        new TextRun({
          size: 22,
          text: 'En el caso de que la reforma sea efectuada por un fabricante se indicará N/A.',
        }),
      ],
      spacing: { after: 200 },
    }),

    new Paragraph({
      children: [
        new TextRun({
          size: 22,
          text: '(2)',
          bold: true,
        }),
        new TextRun({
          size: 22,
          text:
            'En el apartado de observaciones se debe especificar la identificación de los equipos o sistemas modificados. ' +
            'Cualquier equipo o sistema modificado, sustituido o incorporado, debe ser identificado indicando sus referencias ' +
            '(marca, modelo, número de homologación o marcaje) si estas existen.',
        }),
      ],
    }),
  ];

  const modificacionesParagraphs = buildModificacionesParagraphs(
    modificaciones,
    data
  );

  const section1 = {
    properties: { type: SectionType.NEXT_PAGE, pageNumberStart: 1 },
    children: [...seccion, ...modificacionesParagraphs, ...seccion2],
  };

  // 5) Monta y descarga el documento
  const doc = new Document({
    sections: [section1],
  });

  // 2) Empaqueta y descarga
  const blob = await Packer.toBlob(doc);
  saveAs(
    blob,
    `${data.referenciaProyecto} CT ${data.marca} ${data.modelo} ${data.matricula}.docx`
  );
}
