import { Injectable } from '@angular/core';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  UnderlineType,
  Header,
  ImageRun,
  Table,
  BorderStyle,
  TableCell,
  TableRow,
  WidthType,
  Footer,
  PageNumber,
  ShadingType,
  HeightRule,
  VerticalAlign,
} from 'docx';
import { saveAs } from 'file-saver';
import html2pdf from 'html2pdf.js';
import { PDFDocument } from 'pdf-lib';

@Injectable({
  providedIn: 'root',
})
export class DocumentoService {
  constructor() {}

  private async loadImage(url: string): Promise<ArrayBuffer> {
    const response = await fetch(url);
    const blob = await response.blob();
    return await blob.arrayBuffer();
  }

  async generarRepresentacionCCU2ocu(datos: any, frase: string): Promise<void> {
    try {
      // --- 1. LÓGICA DE PERSONA (OTORGANTE) ---
      let nombreOtorgante = '';
      let dniOtorgante = '';

      if (datos.existe_interesado_representante) {
        nombreOtorgante =
          `${datos.interesada_nombre} ${datos.interesada_apellidos}`.trim();
        dniOtorgante = datos.interesada_dni_nif;
      } else {
        nombreOtorgante =
          `${datos.titular_nombre} ${datos.titular_apellidos}`.trim();
        dniOtorgante = datos.titular_dni_nif;
      }

      if (!nombreOtorgante)
        nombreOtorgante = '................................................';
      if (!dniOtorgante) dniOtorgante = '...................';

      let domicilioCompleto = '';

      if (datos.vivienda_nombre_via) {
        domicilioCompleto = `${datos.vivienda_tipo_via} ${datos.vivienda_nombre_via}`;
        if (datos.vivienda_numero)
          domicilioCompleto += `, Nº ${datos.vivienda_numero}`;
        if (datos.vivienda_piso)
          domicilioCompleto += `, Piso ${datos.vivienda_piso}`;
        if (datos.vivienda_puerta)
          domicilioCompleto += `, Pta ${datos.vivienda_puerta}`;

        const cp = datos.vivienda_codigo_postal || '';
        const pob = datos.vivienda_poblacion || '';
        const prov = datos.vivienda_provincia || '';

        if (cp || pob) domicilioCompleto += `, ${cp} ${pob}`;
        if (prov) domicilioCompleto += ` (${prov})`;
      } else {
        domicilioCompleto =
          datos.vivienda_direccion_completa ||
          '..........................................................................................';
      }

      const municipioFirma = datos.vivienda_poblacion || 'Teulada';

      // --- 3. DATOS DEL TÉCNICO (REPRESENTANTE) ---
      const tecnico =
        datos.tecnico_ingeniero_seleccionado ||
        datos.tecnico_arquitecto_seleccionado ||
        {};
      const repNombre = (
        tecnico.nombre ||
        '..........................................................'
      ).toUpperCase();
      const repDNI = tecnico.dni || '...................';

      let repDireccion =
        '..........................................................................................';
      if (tecnico.direccionFiscal) {
        repDireccion = tecnico.direccionFiscal;
        if (tecnico.codigoPostal) repDireccion += `, ${tecnico.codigoPostal}`;
        if (tecnico.localidad) repDireccion += ` (${tecnico.localidad})`;
      }

      // --- 4. FECHA ---
      let fechaRaw = datos.usar_fechas_distintas
        ? datos.fechas_tramites['servicio_seleccion_ccu']
        : datos.fecha_global;

      const dateObj = fechaRaw ? new Date(fechaRaw) : new Date();
      const meses = [
        'enero',
        'febrero',
        'marzo',
        'abril',
        'mayo',
        'junio',
        'julio',
        'agosto',
        'septiembre',
        'octubre',
        'noviembre',
        'diciembre',
      ];
      const fechaTexto = `${dateObj.getDate()} de ${
        meses[dateObj.getMonth()]
      } de ${dateObj.getFullYear()}`;

      const font = 'Arial';
      const size = 22;
      const lineSpacing = 360;

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              // TÍTULO
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
                children: [
                  new TextRun({
                    text: 'MODELO DE OTORGAMIENTO DE REPRESENTACIÓN',
                    font,
                    size: 24,
                    bold: true,
                    underline: { type: UnderlineType.SINGLE, color: '000000' },
                  }),
                ],
              }),

              // PÁRRAFO 1
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 300, line: lineSpacing },
                children: [
                  new TextRun({ text: 'D./Dña. ', font, size }),
                  new TextRun({ text: nombreOtorgante, font, size }),
                  new TextRun({
                    text: ', mayor de edad, provisto de N.I.E. / D.N.I. nº ',
                    font,
                    size,
                  }),
                  new TextRun({ text: dniOtorgante, font, size }),
                  new TextRun({ text: ', con domicilio en ', font, size }),
                  new TextRun({ text: domicilioCompleto, font, size }),
                  new TextRun({ text: '.', font, size }),
                ],
              }),

              // DECLARA
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 },
                children: [
                  new TextRun({ text: 'DECLARA:', font, size, bold: true }),
                ],
              }),

              // PÁRRAFO 2
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 300, line: lineSpacing },
                children: [
                  new TextRun({
                    text: 'Que mediante el presente documento otorga la representación a que se refiere el art. 5 de la Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas, a ',
                    font,
                    size,
                  }),
                  new TextRun({ text: 'D. ' + repNombre, font, size }),
                  new TextRun({ text: ' N.I.F. ', font, size }),
                  new TextRun({ text: repDNI, font, size }),
                  new TextRun({
                    text: ' , con capacidad de obrar suficiente y domicilio a efectos de notificaciones en la siguiente dirección ',
                    font,
                    size,
                  }),
                  new TextRun({ text: repDireccion, font, size }),
                  new TextRun({
                    text: ', para que se entiendan con éste todas las actuaciones administrativas correspondientes al expediente, en el cual ostento condición de interesado, relativo a la obtención ',
                    font,
                    size,
                  }),
                  new TextRun({
                    text: frase || 'del trámite correspondiente',
                    font,
                    size,
                  }),
                  new TextRun({
                    text: ' de la vivienda sita ',
                    font,
                    size,
                  }),
                  new TextRun({
                    text: domicilioCompleto,
                    font,
                    size,
                    bold: true,
                  }),
                  new TextRun({ text: '.', font, size }),
                ],
              }),

              new Paragraph({
                spacing: { after: 800 },
                children: [
                  new TextRun({
                    text: `En ${municipioFirma} a ${fechaTexto}`,
                    font,
                    size,
                  }),
                ],
              }),

              new Paragraph({
                spacing: { before: 600, after: 600 },
                children: [new TextRun({ text: ' ', font, size })],
              }),

              new Paragraph({
                spacing: { before: 600, after: 600 },
                children: [
                  new TextRun({ text: 'FIRMA REPRESENTADO', font, size }),
                ],
              }),

              new Paragraph({
                spacing: { after: 300 },
                children: [
                  new TextRun({
                    text: 'ACEPTACIÓN DE LA REPRESENTACIÓN',
                    font,
                    size,
                    bold: true,
                  }),
                ],
              }),

              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 400, line: lineSpacing },
                children: [
                  new TextRun({
                    text: 'Con la firma del presente escrito el representante acepta la representación conferida y responde de la autenticidad de la firma del/de los otorgante/s, así como de la/s copia/s del D.N.I. (3) del/de los mismo/s que acompaña/n este/estos documento/s.',
                    font,
                    size,
                  }),
                ],
              }),

              // FECHA 2
              new Paragraph({
                spacing: { after: 800 },
                children: [
                  new TextRun({
                    text: `En ${municipioFirma}, a ${fechaTexto}`,
                    font,
                    size,
                  }),
                ],
              }),

              new Paragraph({
                spacing: { before: 600, after: 600 },
                children: [new TextRun({ text: ' ', font, size })],
              }),

              // FIRMA TÉCNICO
              new Paragraph({
                spacing: { before: 600 },
                children: [
                  new TextRun({ text: 'EL REPRESENTANTE', font, size }),
                ],
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const nombreArchivoClean = nombreOtorgante.replace(/[^a-zA-Z0-9]/g, '_');
      saveAs(blob, `Representacion_${nombreArchivoClean}.docx`);
    } catch (error) {
      console.error('Error en DocumentoService:', error);
      throw error;
    }
  }

  async generarRepresentacionCEE(datos: any): Promise<void> {
    try {
      const headerImageBuffer = await this.loadImage('/assets/ivace.jpg');

      let nombreOtorgante = '';
      let dniOtorgante = '';
      if (datos.existe_interesado_representante) {
        nombreOtorgante =
          `${datos.interesada_nombre} ${datos.interesada_apellidos}`.trim();
        dniOtorgante = datos.interesada_dni_nif;
      } else {
        nombreOtorgante =
          `${datos.titular_nombre} ${datos.titular_apellidos}`.trim();
        dniOtorgante = datos.titular_dni_nif;
      }
      nombreOtorgante =
        nombreOtorgante || '................................................';
      dniOtorgante = dniOtorgante || '...................';

      let domicilioCompleto = '';
      if (datos.vivienda_nombre_via) {
        domicilioCompleto = `${datos.vivienda_tipo_via} ${datos.vivienda_nombre_via}`;
        if (datos.vivienda_numero)
          domicilioCompleto += `, Nº ${datos.vivienda_numero}`;
        if (datos.vivienda_piso)
          domicilioCompleto += `, Piso ${datos.vivienda_piso}`;
        if (datos.vivienda_puerta)
          domicilioCompleto += `, Pta ${datos.vivienda_puerta}`;

        const cp = datos.vivienda_codigo_postal || '';
        const pob = datos.vivienda_poblacion || '';
        const prov = datos.vivienda_provincia || '';

        if (cp || pob) domicilioCompleto += `, ${cp} ${pob}`;
        if (prov) domicilioCompleto += ` (${prov})`;
      } else {
        domicilioCompleto =
          datos.vivienda_direccion_completa ||
          '..........................................................................................';
      }
      const municipioFirma = datos.vivienda_poblacion || 'Teulada';

      const response = await fetch('assets/ivace.jpg');
      const imageBuffer = await response.arrayBuffer();

      // C) Técnico
      const tecnico =
        datos.tecnico_ingeniero_seleccionado ||
        datos.tecnico_arquitecto_seleccionado ||
        {};
      const repNombre = (
        tecnico.nombre ||
        '..........................................................'
      ).toUpperCase();
      const repDNI = tecnico.dni || '...................';

      // D) Fecha
      let fechaRaw = datos.usar_fechas_distintas
        ? datos.fechas_tramites['servicio_seleccion_cee']
        : datos.fecha_global;

      const dateObj = fechaRaw ? new Date(fechaRaw) : new Date();
      const meses = [
        'enero',
        'febrero',
        'marzo',
        'abril',
        'mayo',
        'junio',
        'julio',
        'agosto',
        'septiembre',
        'octubre',
        'noviembre',
        'diciembre',
      ];
      const fechaTexto = `${dateObj.getDate()} de ${
        meses[dateObj.getMonth()]
      } de ${dateObj.getFullYear()}`;

      // Estilos
      const font = 'Arial';
      const size = 22; // 11pt
      const lineSpacing = 360; // 1.5 líneas

      // --- 3. CONSTRUCCIÓN DOCX CEE ---
      const doc = new Document({
        sections: [
          {
            headers: {
              default: new Header({
                children: [
                  new Paragraph({
                    children: [
                      new ImageRun({
                        data: imageBuffer,
                        transformation: {
                          width: 350,
                          height: 225,
                        },
                        type: 'png',
                      }),
                    ],
                  }),
                  new Paragraph({ spacing: { after: 400 } }),
                ],
              }),
            },
            properties: {},
            children: [
              // Título
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 1200 },
                children: [
                  new TextRun({
                    text: 'DELEGACION PARA LA TRAMITACION ADMINISTRATIVA DE INSCRIPCIÓN DEL CERTIFICADO DE EFICIENCIA ENERGÉTICA DE EDIFICIOS EN EL REGISTRO DE CERTIFICACIÓN DE EFICIENCIA ENERGÉTICA DE EDIFICIOS',
                    font,
                    size,
                    bold: true,
                    allCaps: true,
                  }),
                ],
              }),

              // Párrafo Principal (Sin negritas, espaciado 1.5)
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { line: lineSpacing, after: 800 },
                children: [
                  new TextRun({ text: 'Yo, ', font, size }),
                  new TextRun({ text: nombreOtorgante, font, size }),
                  new TextRun({
                    text: ' con N.I.E. / D.N.I. nº: ',
                    font,
                    size,
                  }),
                  new TextRun({ text: dniOtorgante, font, size }),
                  new TextRun({
                    text: ', propietario del inmueble ubicado en ',
                    font,
                    size,
                  }),
                  new TextRun({ text: domicilioCompleto, font, size }),
                  new TextRun({
                    text: ', por la presente, otorgo poder legal y suficiente a D. ',
                    font,
                    size,
                  }),
                  new TextRun({ text: repNombre, font, size }),
                  new TextRun({ text: ', con D.N.I. nº: ', font, size }),
                  new TextRun({ text: repDNI, font, size }),
                  new TextRun({
                    text: ', técnico competente para la certificación energética de edificios, de acuerdo a lo previsto en el Real Decreto 235/2013, de 5 de abril, para, en cumplimiento de lo establecido en el artículo 5.6 del citado Real Decreto 235/2013, la realización de los trámites necesarios de inscripción del certificado de eficiencia energética en el registro de certificación de Eficiencia Energética de Edificios de la Comunitat Valenciana, de conformidad con lo establecido por el Decreto 39/2015, de 2 de abril, del Consell, que regula la certificación de la eficiencia energética de edificios.',
                    font,
                    size,
                  }),
                ],
              }),

              // Fecha y Lugar
              new Paragraph({
                spacing: { after: 1200 },
                children: [
                  new TextRun({
                    text: `En ${municipioFirma}, a ${fechaTexto}`,
                    font,
                    size,
                  }),
                ],
              }),

              // Firma
              new Paragraph({
                spacing: { before: 1500 },
                children: [
                  new TextRun({ text: `Firmado: ${fechaTexto}`, font, size }),
                ],
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const nombreArchivoClean = nombreOtorgante.replace(/[^a-zA-Z0-9]/g, '_');
      saveAs(blob, `Representacion_CEE_IVACE_${nombreArchivoClean}.docx`);
    } catch (error) {
      console.error('Error generando DOCX (CEE):', error);
      throw error;
    }
  }

  async generarActaVisita(datos: any): Promise<void> {
    try {
      // 1. CARGAR IMÁGENES
      // Cabecera: ivace2.jpg
      const headerImageBuffer = await this.loadImage('/assets/ivace2.jpg');

      // Firma: solo si NO está marcado el check de firma digital
      let firmaImageBuffer: ArrayBuffer | null = null;
      if (!datos.check_firma_digital_disponible) {
        try {
          firmaImageBuffer = await this.loadImage('/assets/firmaLuis.png');
        } catch (e) {
          console.warn('No se encontró la firma del técnico (firmaLuis.png)');
        }
      }

      // 2. DATOS
      let nombreOtorgante = '';
      let dniOtorgante = '';

      if (datos.existe_interesado_representante) {
        nombreOtorgante =
          `${datos.interesada_nombre} ${datos.interesada_apellidos}`.trim();
        dniOtorgante = datos.interesada_dni_nif;
      } else {
        nombreOtorgante =
          `${datos.titular_nombre} ${datos.titular_apellidos}`.trim();
        dniOtorgante = datos.titular_dni_nif;
      }
      nombreOtorgante =
        nombreOtorgante || '................................................';
      dniOtorgante = dniOtorgante || '...................';

      let domicilioCompleto = '';
      if (datos.vivienda_nombre_via) {
        domicilioCompleto = `${datos.vivienda_tipo_via} ${datos.vivienda_nombre_via}`;
        if (datos.vivienda_numero)
          domicilioCompleto += `, Nº ${datos.vivienda_numero}`;
        if (datos.vivienda_piso)
          domicilioCompleto += `, Piso ${datos.vivienda_piso}`;
        if (datos.vivienda_puerta)
          domicilioCompleto += `, Pta ${datos.vivienda_puerta}`;
        const cp = datos.vivienda_codigo_postal || '';
        const pob = datos.vivienda_poblacion || '';
        const prov = datos.vivienda_provincia || '';
        if (cp || pob) domicilioCompleto += `, ${cp} ${pob}`;
        if (prov) domicilioCompleto += ` (${prov})`;
      } else {
        domicilioCompleto =
          datos.vivienda_direccion_completa ||
          '..........................................................................................';
      }
      const refCatastral =
        datos.vivienda_referencia_catastral || '.............................';

      const tecnico =
        datos.tecnico_ingeniero_seleccionado ||
        datos.tecnico_arquitecto_seleccionado ||
        {};
      const repNombre = (
        tecnico.nombre ||
        '..........................................................'
      ).toUpperCase();
      const repDNI = tecnico.dni || '...................';

      let fechaRaw = datos.usar_fechas_distintas
        ? datos.fechas_tramites['servicio_seleccion_cee']
        : datos.fecha_global;
      const dateObj = fechaRaw ? new Date(fechaRaw) : new Date();
      const meses = [
        'enero',
        'febrero',
        'marzo',
        'abril',
        'mayo',
        'junio',
        'julio',
        'agosto',
        'septiembre',
        'octubre',
        'noviembre',
        'diciembre',
      ];
      const fechaTexto = `${dateObj.getDate()} de ${
        meses[dateObj.getMonth()]
      } de ${dateObj.getFullYear()}`;

      // Estilos
      const font = 'Arial';
      const size = 20; // 10pt
      const sizeTitle = 24; // 12pt
      const lineSpacing = 300;

      const doc = new Document({
        sections: [
          {
            headers: {
              default: new Header({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new ImageRun({
                        data: headerImageBuffer,
                        transformation: { width: 250, height: 60 },
                        type: 'jpg',
                      }),
                    ],
                  }),
                  new Paragraph({ spacing: { after: 400 } }),
                ],
              }),
            },
            properties: {},
            children: [
              // TÍTULO
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 600 },
                children: [
                  new TextRun({
                    text: 'ACTA DE VISITA PREVIA A LA CERTIFICACIÓN ENERGÉTICA',
                    font,
                    size: sizeTitle,
                    bold: true,
                  }),
                ],
              }),

              // PÁRRAFO 1 (TEXTO LEGAL LARGO)
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 300, line: lineSpacing },
                children: [
                  new TextRun({
                    text: 'En cumplimiento de lo dispuesto en el artículo 6 del Real Decreto 390/2021, de 1 de junio, por el que se aprueba el procedimiento básico para la certificación de la eficiencia energética de los edificios, que regula la certificación de la eficiencia energética de un edificio y en cuyo apartado 5 exige que “',
                    font,
                    size,
                  }),
                  new TextRun({
                    text: 'Durante el proceso de certificación, el técnico competente realizará al menos una visita al inmueble',
                    font,
                    size,
                    bold: true,
                    italics: true,
                  }),
                  new TextRun({
                    text: ', con una antelación máxima de tres meses antes de la emisión del certificado, ',
                    font,
                    size,
                    italics: true,
                  }),
                  new TextRun({
                    text: 'para realizar las tomas de datos, pruebas y comprobaciones necesarias para la correcta realización del certificado de eficiencia energética del edificio o de la parte del mismo',
                    font,
                    size,
                    bold: true,
                    italics: true,
                  }),
                  new TextRun({
                    text: '”, así como a los efectos de acreditar la veracidad en la expedición del certificado de eficiencia energética, teniendo en cuenta lo establecido en la Disposición adicional duodécima del Real Decreto Legislativo 7/2015, de 30 de octubre, por el que se aprueba el texto refundido de la Ley de Suelo y Rehabilitación Urbana, que prevé como infracción muy grave en el ámbito de la certificación de eficiencia energética de los edificios “',
                    font,
                    size,
                  }),
                  new TextRun({
                    text: 'Falsear la información en la expedición o registro de certificados de eficiencia energética',
                    font,
                    size,
                    bold: true,
                    italics: true,
                  }),
                  new TextRun({ text: '”.', font, size }),
                ],
              }),

              // PÁRRAFO 2
              new Paragraph({
                spacing: { after: 300 },
                children: [
                  new TextRun({
                    text: 'Se formaliza la presente ',
                    font,
                    size,
                  }),
                  new TextRun({
                    text: 'ACTA DE VISITA',
                    font,
                    size,
                    bold: true,
                  }),
                  new TextRun({
                    text: ' en la que el propietario/promotor del inmueble sito en la siguiente dirección:',
                    font,
                    size,
                  }),
                ],
              }),

              // DIRECCIÓN (Centrada o indentada)
              new Paragraph({
                indent: { left: 720 },
                spacing: { after: 300 },
                children: [
                  new TextRun({
                    text: domicilioCompleto,
                    font,
                    size,
                    bold: true,
                  }),
                ],
              }),

              // PÁRRAFO 3
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 300, line: lineSpacing },
                children: [
                  new TextRun({
                    text: 'con referencia catastral número ',
                    font,
                    size,
                  }),
                  new TextRun({ text: refCatastral, font, size, bold: true }),
                  new TextRun({
                    text: ', manifiesta, de manera fehaciente, que el técnico competente ',
                    font,
                    size,
                  }),
                  new TextRun({ text: repNombre, font, size, bold: true }),
                  new TextRun({
                    text: ' ha realizado una visita al inmueble objeto de certificación energética, el día ',
                    font,
                    size,
                  }),
                  new TextRun({ text: fechaTexto, font, size }),
                  new TextRun({ text: '.', font, size }),
                ],
              }),

              // PÁRRAFO 4 (Consecuencias)
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 600, line: lineSpacing },
                children: [
                  new TextRun({
                    text: 'El propietario/promotor mediante la firma de la presente acta, conoce que el IVACE, es el órgano competente para la certificación de la eficiencia energética de edificios en la Comunitat Valenciana, así como para supervisar, ente otras, las actividades de trámite y registro de la certificación, y cuantas actividades de comprobación fueran necesarias para el cumplimiento de las disposiciones aplicables a la certificación energética de edificios, de conformidad con lo establecido en el Decreto 39/2015, de 2 de abril, del Consell, por el que se regula la certificación de la eficiencia energética de los edificios. Si IVACE comprobara, tras el correspondiente procedimiento, que no se ha realizado la visita al inmueble, con el consiguiente incumplimiento del procedimiento establecido en el artículo 6.5 del real Decreto 390/2021, ',
                    font,
                    size,
                  }),
                  new TextRun({
                    text: 'procederá a dar de baja el certificado de eficiencia energética en el registro de Certificación de Eficiencia Energética de Edificios de manera que no tendrá validez a efectos del cumplimiento del Real Decreto 390/2021',
                    font,
                    size,
                    bold: true,
                  }),
                  new TextRun({
                    text: ', sin perjuicio de las infracciones derivadas de la Ley de Suelo y Rehabilitación Urbana que se pudieran producir.',
                    font,
                    size,
                  }),
                ],
              }),

              // FECHA FINAL
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 800 },
                children: [
                  new TextRun({ text: `, a fecha ${fechaTexto}`, font, size }),
                ],
              }),

              // TABLA DE FIRMAS
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                  insideVertical: { style: BorderStyle.NONE },
                  insideHorizontal: { style: BorderStyle.NONE },
                },
                rows: [
                  new TableRow({
                    children: [
                      // COLUMNA IZQUIERDA: PROPIETARIO
                      new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: 'PROPIETARIO/PROMOTOR',
                                font,
                                size: 18,
                                bold: true,
                              }),
                            ],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: `D.N.I./N.I.E.: ${dniOtorgante}`,
                                font,
                                size: 18,
                              }),
                            ],
                          }),
                        ],
                      }),
                      // COLUMNA DERECHA: TÉCNICO
                      new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: 'TÉCNICO COMPETENTE',
                                font,
                                size: 18,
                                bold: true,
                              }),
                            ],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: `D.N.I./N.I.E.: ${repDNI}`,
                                font,
                                size: 18,
                              }),
                            ],
                          }),
                          // FIRMA IMAGEN (CONDICIONAL)
                          firmaImageBuffer
                            ? new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { before: 200 },
                                children: [
                                  new ImageRun({
                                    data: firmaImageBuffer,
                                    transformation: { width: 100, height: 60 },
                                    type: 'png',
                                  }),
                                ],
                              })
                            : new Paragraph({ text: '' }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const nombreArchivoClean = nombreOtorgante.replace(/[^a-zA-Z0-9]/g, '_');
      saveAs(blob, `Acta_Visita_CEE_${nombreArchivoClean}.docx`);
    } catch (error) {
      console.error('Error generando Acta Visita:', error);
      throw error;
    }
  }

  // (Mantén aquí tus funciones generarRepresentacionCCU2ocu, generarRepresentacionCEE, generarActaVisita...)

  // ===========================================================================
  // 4. DECLARACIÓN RESPONSABLE TÉCNICO (Edición de PDF)
  // ===========================================================================
  async generarDeclaracionResponsableTecnico(datos: any): Promise<void> {
    try {
      // 1. Cargar la plantilla PDF desde assets
      const pdfBytes = await this.loadImage(
        '/assets/DECLARACION RESPONSABLE TECNICO PROYECTISTA.pdf'
      );

      const pdfDoc = await PDFDocument.load(pdfBytes);
      while (pdfDoc.getPageCount() > 1) {
        pdfDoc.removePage(1); // Siempre borramos la "segunda" página hasta que solo quede una
      }
      const form = pdfDoc.getForm();

      const limpiarTexto = (texto: string) => {
        if (!texto) return '';
        return texto.replace(/[^\w\s\d.,;:\-\/()áéíóúÁÉÍÓÚñÑüÜ@]/g, '').trim();
      };

      // 3. Preparar Datos del Técnico
      const tecnico = datos.tecnico_arquitecto_seleccionado || {};

      const campos = {
        A_NOM: tecnico.nombre || '',
        A_NIF: tecnico.dni || '',
        A_DOMICILI: tecnico.direccionFiscal || '',
        A_TELEFON: tecnico.tlf || '618622012',
        A_FAX: '',
        A_MUNICIPI: tecnico.localidad || '',
        A_PROVINCIA: tecnico.provincia || '',
        A_CODI: tecnico.codigoPostal || '',
        A_TITULAC: tecnico.titulacion || '',
        A_ESPECIALI: tecnico.especialidad || '',
        A_ADRESA: tecnico.correo || 'hablamos@projectes.es',
        A_COLEGIO: tecnico.colegio || '',
        A_COLEGIAT: tecnico.numero || '',
      };

      // 4. Preparar Frase de Declaración
      let domicilioVivienda = '';
      let domicilioCompleto = '';
      if (datos.vivienda_nombre_via) {
        domicilioCompleto = `${datos.vivienda_tipo_via} ${datos.vivienda_nombre_via}`;
        if (datos.vivienda_numero)
          domicilioVivienda += `, Nº ${datos.vivienda_numero}`;
        // ... (resto de campos)
      } else {
        domicilioVivienda = datos.vivienda_direccion_completa || '';
      }

      const cpVivienda = datos.vivienda_codigo_postal || '';
      const pobVivienda = datos.vivienda_poblacion || 'TEULADA';
      const provVivienda = datos.vivienda_provincia || 'ALICANTE';

      const fraseDeclaracion = `CERTIFICADO TÉCNICO PARA EXPEDICIÓN DE LICENCIA MUNICIPAL DE SEGUNDA OCUPACIÓN O POSTERIORES DE VIVIENDA SITA EN ${domicilioVivienda.toUpperCase()} - ${cpVivienda} ${pobVivienda.toUpperCase()}(${provVivienda.toUpperCase()})`;

      // 5. Preparar Fecha
      let fechaRaw = datos.usar_fechas_distintas
        ? datos.fechas_tramites['servicio_seleccion_segunda_ocupacion']
        : datos.fecha_global;
      const fechaHoy = fechaRaw ? new Date(fechaRaw) : new Date();

      const meses = [
        'ENERO',
        'FEBRERO',
        'MARZO',
        'ABRIL',
        'MAYO',
        'JUNIO',
        'JULIO',
        'AGOSTO',
        'SEPTIEMBRE',
        'OCTUBRE',
        'NOVIEMBRE',
        'DICIEMBRE',
      ];
      const anioCompleto = fechaHoy.getFullYear().toString();

      // 6. Rellenar
      for (const [key, value] of Object.entries(campos)) {
        try {
          const field = form.getTextField(key);
          if (field)
            field.setText(limpiarTexto(value.toString()).toUpperCase());
        } catch (e) {}
      }

      try {
        form
          .getTextField('B_DECLARACIO')
          ?.setText(limpiarTexto(fraseDeclaracion));
        form
          .getTextField('B_LLOC')
          ?.setText(limpiarTexto(tecnico.localidad.toUpperCase()));
        form.getTextField('B_DIA')?.setText(fechaHoy.getDate().toString());
        form.getTextField('B_MES')?.setText(meses[fechaHoy.getMonth()]);
        form.getTextField('B_ANY')?.setText(anioCompleto);
      } catch (e) {}

      form.getFields().forEach((field) => {
        field.enableReadOnly();
      });
      const pdfBytesModificado = await pdfDoc.save();

      // 7. Descargar (SOLUCIÓN ERROR TS)
      // Usamos 'as any' para evitar el error de tipado estricto entre Uint8Array y BlobPart
      const nombreArchivo = `Declaracion_Responsable_${
        tecnico.nombre || 'Tecnico'
      }.pdf`;
      const blob = new Blob([pdfBytesModificado as any], {
        type: 'application/pdf',
      });
      saveAs(blob, nombreArchivo);
    } catch (error) {
      console.error('Error generando PDF Declaración Responsable:', error);
      throw error;
    }
  }

  // ===========================================================================
  // 5. MEMORIA TÉCNICA (CCU VIVIENDA TURÍSTICA)
  // ===========================================================================
  async generarMemoriaTecnica(datos: any): Promise<void> {
    try {
      // 1. CARGAR IMAGENES
      // Logo empresa para la portada (asegúrate de tenerlo en assets)
      const logoEmpresaBuffer = await this.loadImage('/assets/logo.png');

      // 2. PREPARAR DATOS
      // -- Titular --
      const titularNombre = `${datos.titular_nombre} ${datos.titular_apellidos}`
        .trim()
        .toUpperCase();
      const titularDNI = (datos.titular_dni_nif || '').toUpperCase();

      // -- Vivienda --
      const calle = (datos.vivienda_nombre_via || '').toUpperCase();
      const numero = datos.vivienda_numero || '';
      const cp = datos.vivienda_codigo_postal || '';
      const poblacion = (datos.vivienda_poblacion || '').toUpperCase();
      const provincia = (datos.vivienda_provincia || '').toUpperCase();
      const direccionCorta = `C/ ${calle} ${numero}`;
      const direccionLarga = `${direccionCorta}, en el término municipal de ${poblacion}, provincia de ${provincia}.`;
      const direccionCompletaPortada = `${direccionCorta}\n${cp} - ${poblacion} (${provincia})`;
      const refCatastral = datos.vivienda_referencia_catastral || '';
      const anoConstruccion = datos.vivienda_ano_construccion || '';
      const superficieTotal = datos.vivienda_superficie_total || 0;
      const superficieUtil = datos.vivienda_superficie_util || 0;

      // -- Ingeniero (Datos fijos del servidor) --
      // Usamos el ingeniero seleccionado. Si no hay, los campos saldrán vacíos.
      const ing = datos.tecnico_ingeniero_seleccionado || {};
      const ingNombre = (ing.nombre || '').toUpperCase();
      const ingTitulo = (ing.titulacion || '').toUpperCase(); // "INGENIERO TÉCNICO INDUSTRIAL"
      const ingColegio = (ing.colegio || '').toUpperCase(); // "COGITI VALENCIA"
      const ingNumColegiado = ing.numero || ''; // "11.380"
      const ingTlf = ing.tlf || ''; // "☎ 618..."
      const ingEmail = ing.correo || ''; // "luis@..."
      const ingWeb = ing.web || ''; // "www..."

      // -- Fecha --
      const meses = [
        'enero',
        'febrero',
        'marzo',
        'abril',
        'mayo',
        'junio',
        'julio',
        'agosto',
        'septiembre',
        'octubre',
        'noviembre',
        'diciembre',
      ];
      let fechaRaw = datos.usar_fechas_distintas
        ? datos.fechas_tramites['servicio_seleccion_ccu']
        : datos.fecha_global;

      const dateObj = fechaRaw ? new Date(fechaRaw) : new Date();

      // Formato: "Teulada, 02 de octubre de 2025"
      const fechaTexto = `${
        poblacion.charAt(0) + poblacion.slice(1).toLowerCase()
      }, ${dateObj.getDate().toString().padStart(2, '0')} de ${
        meses[dateObj.getMonth()]
      } de ${dateObj.getFullYear()}`;

      // 3. ESTILOS COMUNES
      const font = 'Arial';
      const sizeCuerpo = 22; // 11pt
      const sizeTitulo = 24; // 12pt
      const lineSpacing = 360; // 1.5 líneas

      // --- DEFINICIÓN DEL HEADER (Para páginas 2 en adelante) ---
      // Tabla con borde exterior, dividida en 2 columnas
      const headerTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: '808080' },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: '808080' },
          left: { style: BorderStyle.SINGLE, size: 1, color: '808080' },
          right: { style: BorderStyle.SINGLE, size: 1, color: '808080' },
        },
        rows: [
          new TableRow({
            children: [
              // COLUMNA IZQUIERDA (Datos Ingeniero)
              new TableCell({
                width: { size: 35, type: WidthType.PERCENTAGE },
                margins: { top: 100, bottom: 100, left: 100, right: 100 },
                children: [
                  new Paragraph({
                    alignment: 'center',
                    children: [
                      new TextRun({
                        text: ingNombre,
                        font: 'Arial',
                        size: 16,
                        italics: true,
                        bold: true,
                        color: '666666',
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: 'center',
                    children: [
                      new TextRun({
                        text: ingTitulo,
                        font: 'Arial',
                        size: 14,
                        color: '666666',
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: 'center',
                    children: [
                      new TextRun({
                        text: `Col. ${ingNumColegiado} ${ingColegio}`,
                        font: 'Arial',
                        size: 14,
                        color: '666666',
                      }),
                    ],
                    spacing: { after: 120 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: ingTlf,
                        font: 'Arial',
                        size: 14,
                        color: '666666',
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `✉ ${ingEmail}`,
                        font: 'Arial',
                        size: 14,
                        color: '666666',
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `💻 ${ingWeb}`,
                        font: 'Arial',
                        size: 14,
                        color: '666666',
                      }),
                    ],
                  }),
                ],
              }),
              // COLUMNA DERECHA (Datos Proyecto)
              new TableCell({
                width: { size: 65, type: WidthType.PERCENTAGE },
                margins: { top: 100, bottom: 100, left: 100, right: 100 },
                verticalAlign: AlignmentType.CENTER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'SOLICITUD CERTIFICADO DE COMPATIBILIDAD URBANÍSTICA',
                        font: 'Arial',
                        size: 14,
                        bold: true,
                        color: '808080',
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 60 },
                    children: [
                      new TextRun({
                        text: 'VIVIENDA TURÍSTICA',
                        font: 'Arial',
                        size: 14,
                        bold: true,
                        color: '808080',
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 120 },
                    children: [
                      new TextRun({
                        text: `SOLICITANTE: ${titularNombre}`,
                        font: 'Arial',
                        size: 14,
                        bold: true,
                        color: '808080',
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 120 },
                    children: [
                      new TextRun({
                        text: 'EMPLAZAMIENTO:',
                        font: 'Arial',
                        size: 12,
                        bold: true,
                        color: '808080',
                      }),
                      new TextRun({
                        text: `\nC/ ${calle} ${numero} – ${cp} – ${poblacion} (${provincia})`,
                        font: 'Arial',
                        size: 12,
                        bold: true,
                        color: '808080',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      // --- 4. CONSTRUCCIÓN DEL DOCUMENTO ---
      const doc = new Document({
        sections: [
          // ==========================================
          // SECCIÓN 1: PORTADA (Sin Header visual, Footer numérico empieza aquí)
          // ==========================================
          {
            properties: {
              titlePage: true, // Esto hace que el header/footer de esta sección sea distinto (o vacío)
            },
            headers: {
              default: new Header({ children: [new Paragraph({})] }), // Header vacío para portada si titlePage no basta en algunos viewers
            },
            footers: {
              default: new Footer({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'Página ',
                        font: 'Arial',
                        size: 18,
                        color: '808080',
                      }),
                      new TextRun({
                        children: ['PAGE'],
                        font: 'Arial',
                        size: 18,
                        color: '808080',
                      }),
                      new TextRun({
                        text: ' de ',
                        font: 'Arial',
                        size: 18,
                        color: '808080',
                      }),
                      new TextRun({
                        children: ['NUMPAGES'],
                        font: 'Arial',
                        size: 18,
                        color: '808080',
                      }),
                    ],
                  }),
                ],
              }),
            },
            children: [
              // RECUADRO SUPERIOR (Datos Ingeniero)
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.DOUBLE, size: 6 },
                  bottom: { style: BorderStyle.DOUBLE, size: 6 },
                  left: { style: BorderStyle.DOUBLE, size: 6 },
                  right: { style: BorderStyle.DOUBLE, size: 6 },
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        borders: {
                          right: { style: BorderStyle.DASHED, size: 2 },
                        }, // Línea punteada vertical
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new ImageRun({
                                data: logoEmpresaBuffer,
                                transformation: {
                                  width: 215,
                                  height: 125,
                                },
                                type: 'png',
                              }),
                            ],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: ingNombre,
                                font: 'Arial',
                                size: 20,
                              }),
                            ],
                          }),
                        ],
                      }),
                      new TableCell({
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        verticalAlign: AlignmentType.CENTER,
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: `☎ ${ingTlf.replace('☎', '').trim()}`,
                                font: 'Arial',
                                size: 18,
                              }),
                            ],
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: `✉ ${ingEmail.replace('✉', '').trim()}`,
                                font: 'Arial',
                                size: 18,
                              }),
                            ],
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: `💻 ${ingWeb}`,
                                font: 'Arial',
                                size: 18,
                              }),
                            ],
                          }),
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: `Colegiado ${ingNumColegiado} - ${ingColegio}`,
                                font: 'Arial',
                                size: 18,
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),

              new Paragraph({ spacing: { after: 800 } }), // Espacio

              // RECUADRO CENTRAL (Título del Proyecto)
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 400, after: 200 },
                            children: [
                              new TextRun({
                                text: 'MEMORIA TÉCNICA PARA LA SOLICITUD DE',
                                font: 'Arial',
                                size: 36,
                              }),
                            ],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 200 },
                            children: [
                              new TextRun({
                                text: 'CERTIFICADO DE COMPATIBILIDAD',
                                font: 'Arial',
                                size: 36,
                              }),
                            ],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 600 },
                            children: [
                              new TextRun({
                                text: 'URBANÍSTICA DE VIVIENDA TURÍSTICA',
                                font: 'Arial',
                                size: 36,
                              }),
                            ],
                          }),
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 400 },
                            children: [
                              new TextRun({
                                text: direccionCompletaPortada,
                                font: 'Arial',
                                size: 32,
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),

              new Paragraph({ spacing: { after: 800 } }), // Espacio

              // TABLA INFERIOR (Resumen)
              // TABLA RESUMEN (SIN BORDES)
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                // CLAVE: Definir explícitamente SIN BORDES
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  insideHorizontal: {
                    style: BorderStyle.NONE,
                    size: 0,
                    color: 'auto',
                  },
                  insideVertical: {
                    style: BorderStyle.NONE,
                    size: 0,
                    color: 'auto',
                  },
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 30, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: 'SOLICITUD:',
                                font: 'Arial',
                                size: 24,
                              }),
                            ],
                          }),
                        ],
                      }),
                      new TableCell({
                        width: { size: 70, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: 'Certificado de Compatibilidad Urbanística de Vivienda Turística',
                                font: 'Arial',
                                size: 24,
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
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: 'SOLICITANTE:',
                                font: 'Arial',
                                size: 24,
                              }),
                            ],
                          }),
                        ],
                      }),
                      new TableCell({
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: titularNombre,
                                font: 'Arial',
                                size: 24,
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
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: 'Emplazamiento:',
                                font: 'Arial',
                                size: 24,
                              }),
                            ],
                          }),
                        ],
                      }),
                      new TableCell({
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: direccionCompletaPortada,
                                font: 'Arial',
                                size: 24,
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),

              // FECHA PORTADA
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 800 },
                children: [
                  new TextRun({ text: fechaTexto, font: 'Arial', size: 20 }),
                ],
              }),
            ],
          },

          // ==========================================
          // SECCIÓN 2: CUERPO DE LA MEMORIA (Con Header y Footer)
          // ==========================================
          {
            properties: {},
            headers: {
              default: new Header({
                children: [
                  headerTable, // Usamos la tabla definida arriba
                  new Paragraph({ spacing: { after: 400 } }), // Espacio tras header
                ],
              }),
            },
            footers: {
              default: new Footer({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'Página ',
                        font: 'Arial',
                        size: 18,
                        color: '808080',
                      }),
                      new TextRun({
                        children: [PageNumber.CURRENT],
                        font: 'Arial',
                        size: 18,
                        color: '808080',
                      }),
                      new TextRun({
                        text: ' de ',
                        font: 'Arial',
                        size: 18,
                        color: '808080',
                      }),
                      new TextRun({
                        children: [PageNumber.TOTAL_PAGES],
                        font: 'Arial',
                        size: 18,
                        color: '808080',
                      }),
                    ],
                  }),
                ],
              }),
            },
            children: [
              // 1. INTRODUCCIÓN
              new Paragraph({
                spacing: { after: 200 },
                children: [
                  new TextRun({
                    text: '1. INTRODUCCIÓN',
                    font,
                    size: sizeTitulo,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { line: lineSpacing, after: 400 },
                children: [
                  new TextRun({ text: 'Dña. ', font, size: sizeCuerpo }),
                  new TextRun({ text: titularNombre, font, size: sizeCuerpo }),
                  new TextRun({
                    text: ' con N.I.E. nº ',
                    font,
                    size: sizeCuerpo,
                  }),
                  new TextRun({ text: titularDNI, font, size: sizeCuerpo }),
                  new TextRun({
                    text: ' desea iniciar una actividad de ',
                    font,
                    size: sizeCuerpo,
                  }),
                  new TextRun({
                    text: 'VIVIENDA TURÍSTICA',
                    font,
                    size: sizeCuerpo,
                    bold: true,
                    underline: { type: UnderlineType.SINGLE },
                  }),
                  new TextRun({
                    text: ` en C/ ${calle} ${numero}, en el término municipal de ${poblacion}, provincia de ${provincia}.`,
                    font,
                    size: sizeCuerpo,
                  }),
                ],
              }),

              // 2. OBJETO
              new Paragraph({
                spacing: { after: 200 },
                children: [
                  new TextRun({
                    text: '2. OBJETO DE LA MEMORIA',
                    font,
                    size: sizeTitulo,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { line: lineSpacing, after: 200 },
                children: [
                  new TextRun({
                    text: 'La presente memoria tiene por objeto la descripción de las características principales de la vivienda donde se pretende instalar la actividad solicitada, con el fin de solicitar al Ayuntamiento de ',
                    font,
                    size: sizeCuerpo,
                  }),
                  new TextRun({ text: poblacion, font, size: sizeCuerpo }),
                  new TextRun({
                    text: ' el Certificado de Compatibilidad Urbanística, que autoriza la actividad de Vivienda Turística en el emplazamiento donde se sitúa la finca.',
                    font,
                    size: sizeCuerpo,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { line: lineSpacing, after: 400 },
                children: [
                  new TextRun({
                    text: 'En la presente memoria se describen y justifican todas y cada una de las partes de la edificación que nos ocupa.',
                    font,
                    size: sizeCuerpo,
                  }),
                ],
              }),

              // 3. ACTIVIDAD
              new Paragraph({
                spacing: { after: 200 },
                children: [
                  new TextRun({
                    text: '3. ACTIVIDAD',
                    font,
                    size: sizeTitulo,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { line: lineSpacing, after: 200 },
                children: [
                  new TextRun({
                    text: 'Se entiende por vivienda de uso turístico “aquellas viviendas, cualquiera que sea su tipología, que son cedidas temporalmente por su propietario o persona con título habilitante, directa o indirectamente, a terceros y en las que, reuniendo los requisitos establecidos, se presta únicamente el servicio de alojamiento mediante precio, de forma habitual”.',
                    font,
                    size: sizeCuerpo,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { line: lineSpacing, after: 200 },
                children: [
                  new TextRun({
                    text: 'Estarán amuebladas y equipadas en condiciones de uso inmediato, y serán comercializadas o promocionadas en canales de oferta turística (plataformas online, catálogos etc.).',
                    font,
                    size: sizeCuerpo,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { line: lineSpacing, after: 400 },
                children: [
                  new TextRun({
                    text: 'Además, el reglamento las redefine como los inmuebles completos, cualquiera que sea su tipología, que, contando con el informe municipal de compatibilidad urbanística que permita dicho uso, se cedan mediante precio con habitualidad en condiciones de inmediata disponibilidad y con fines turísticos, vacacionales o de ocio.',
                    font,
                    size: sizeCuerpo,
                  }),
                ],
              }),

              // 4. ANTECEDENTES
              new Paragraph({
                spacing: { after: 200 },
                children: [
                  new TextRun({
                    text: '4. ANTECEDENTES Y CONDICIONES DE PARTIDA',
                    font,
                    size: sizeTitulo,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { line: lineSpacing, after: 400 },
                children: [
                  new TextRun({
                    text: 'La vivienda no se había alquilado con fines turísticos anteriormente. Se trata de una vivienda de uso residencial. Actualmente la actividad no dispone de licencia. El propietario quiere conseguir todos los permisos y licencias con el fin de registrar la vivienda en el Registro de Turismo de la Comunitat Valenciana, mediante la presentación de una declaración responsable.',
                    font,
                    size: sizeCuerpo,
                  }),
                ],
              }),

              // 5. EMPLAZAMIENTO
              new Paragraph({
                spacing: { after: 200 },
                children: [
                  new TextRun({
                    text: '5. EMPLAZAMIENTO',
                    font,
                    size: sizeTitulo,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { line: lineSpacing, after: 200 },
                children: [
                  new TextRun({
                    text: `La vivienda donde se pretende implantar la actividad se encuentra la ${direccionCorta} - ${cp} - ${poblacion} (${provincia}). `,
                    font,
                    size: sizeCuerpo,
                  }),
                  new TextRun({
                    text: 'La referencia catastral',
                    font,
                    size: sizeCuerpo,
                  }),
                  new TextRun({
                    text: ` es: ${refCatastral}.`,
                    font,
                    size: sizeCuerpo,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { line: lineSpacing, after: 400 },
                children: [
                  new TextRun({
                    text: `Consultado Plan General de Ordenación Urbana de ${poblacion}, la vivienda que nos ocupa se sitúa en un emplazamiento de uso residencial, situado en zona cuyo suelo está calificado como urbano, en el cual está permitido este tipo de actividades, dotado de la infraestructura necesaria para el desarrollo de la actividad que se pretende llevar a cabo.`,
                    font,
                    size: sizeCuerpo,
                  }),
                ],
              }),

              // 6. ENTORNO FÍSICO (TABLA)
              new Paragraph({
                spacing: { after: 200 },
                children: [
                  new TextRun({
                    text: '6. ENTORNO FÍSICO',
                    font,
                    size: sizeTitulo,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 200 },
                children: [
                  new TextRun({
                    text: 'Colindando con la parcela encontramos, mirando de frente a la fachada:',
                    font,
                    size: sizeCuerpo,
                  }),
                ],
              }),

              // TABLA LINDEROS
              // TABLA LINDEROS (SIN BORDES)
              new Table({
                width: { size: 80, type: WidthType.PERCENTAGE }, // Ajustado a 80% para que se centre mejor
                indent: { size: 80, type: WidthType.DXA },
                // ESTA ES LA CLAVE: Desactivar explícitamente todos los bordes
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  insideVertical: {
                    style: BorderStyle.NONE,
                    size: 0,
                    color: 'auto',
                  },
                  insideHorizontal: {
                    style: BorderStyle.NONE,
                    size: 0,
                    color: 'auto',
                  },
                },
                rows: [
                  ['Delante:', datos.vivienda_lindero_frente || 'Vivienda'],
                  [
                    'Detrás:',
                    datos.vivienda_lindero_fondo || 'Terreno no construido',
                  ],
                  [
                    'Izquierda:',
                    datos.vivienda_lindero_izquierda || 'Terreno no construido',
                  ],
                  ['Derecha:', datos.vivienda_lindero_derecha || 'Vivienda'],
                  ['Arriba:', datos.vivienda_lindero_arriba || 'Nada'],
                  ['Debajo:', datos.vivienda_lindero_abajo || 'Nada'],
                ].map(
                  (row) =>
                    new TableRow({
                      children: [
                        // Celda Izquierda (Etiqueta)
                        new TableCell({
                          // Aseguramos que la celda tampoco tenga bordes
                          borders: {
                            top: {
                              style: BorderStyle.NONE,
                              size: 0,
                              color: 'auto',
                            },
                            bottom: {
                              style: BorderStyle.NONE,
                              size: 0,
                              color: 'auto',
                            },
                            left: {
                              style: BorderStyle.NONE,
                              size: 0,
                              color: 'auto',
                            },
                            right: {
                              style: BorderStyle.NONE,
                              size: 0,
                              color: 'auto',
                            },
                          },
                          width: { size: 30, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              alignment: AlignmentType.RIGHT,
                              children: [
                                new TextRun({
                                  text: row[0],
                                  font: 'Arial',
                                  size: 22,
                                }),
                              ],
                            }),
                          ],
                        }),
                        // Celda Derecha (Valor)
                        new TableCell({
                          borders: {
                            top: {
                              style: BorderStyle.NONE,
                              size: 0,
                              color: 'auto',
                            },
                            bottom: {
                              style: BorderStyle.NONE,
                              size: 0,
                              color: 'auto',
                            },
                            left: {
                              style: BorderStyle.NONE,
                              size: 0,
                              color: 'auto',
                            },
                            right: {
                              style: BorderStyle.NONE,
                              size: 0,
                              color: 'auto',
                            },
                          },
                          width: { size: 70, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: ' ' + row[1],
                                  font: 'Arial',
                                  size: 22,
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    })
                ),
              }),
              new Paragraph({ spacing: { after: 400 } }),

              // 7. DESCRIPCIÓN VIVIENDA
              new Paragraph({
                spacing: { after: 200 },
                children: [
                  new TextRun({
                    text: '7. DESCRIPCIÓN DE LA VIVIENDA',
                    font,
                    size: sizeTitulo,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { line: lineSpacing, after: 200 },
                children: [
                  new TextRun({
                    text: `La vivienda sometida a estudio se ubica en un edificio de viviendas con una superficie neta total de ${superficieTotal} m².`,
                    font,
                    size: sizeCuerpo,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { line: lineSpacing, after: 200 },
                children: [
                  new TextRun({
                    text: `Según indicaciones del catastro, el edificio fue construido en ${anoConstruccion}.`,
                    font,
                    size: sizeCuerpo,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { line: lineSpacing, after: 200 },
                children: [
                  new TextRun({
                    text: `La vivienda tiene una superficie total construida de ${datos.vivienda_superficie_construida} m² y superficie útil de ${superficieUtil} m².`,
                    font,
                    size: sizeCuerpo,
                  }),
                ],
              }),

              // Plantas (Iterativo)
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'La vivienda se compone de:',
                    font,
                    size: sizeCuerpo,
                  }),
                ],
              }),
              ...(datos.vivienda_lista_plantas || []).map(
                (planta: any) =>
                  new Paragraph({
                    spacing: { line: lineSpacing },
                    children: [
                      new TextRun({
                        text: `- ${planta.tipo}: compuesta de ${planta.descripcion}.`,
                        font,
                        size: sizeCuerpo,
                      }),
                    ],
                  })
              ),

              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { line: lineSpacing, after: 400, before: 200 },
                children: [
                  new TextRun({
                    text: 'La vivienda cuenta con acometidas de todas las instalaciones precisas, como agua, electricidad, teléfono, etc., así como huecos para el paso de la salida de humos, ventilación, etc., directamente a exterior.',
                    font,
                    size: sizeCuerpo,
                  }),
                ],
              }),

              // 8. SERVICIOS PÚBLICOS
              new Paragraph({
                spacing: { after: 200 },
                children: [
                  new TextRun({
                    text: '8. REQUERIMIENTO DE LA VIVIENDA RESPECTO A LOS SERVICIOS PÚBLICOS ESENCIALES',
                    font,
                    size: sizeTitulo,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: 'Agua',
                    font,
                    size: sizeCuerpo,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 120 },
                children: [
                  new TextRun({
                    text: `Entre la documentación facilitada, podemos encontrar evidencias de que tienen contrato para el suministro de agua potable con la empresa ${
                      datos.vivienda_empresa_agua ||
                      'la compañía suministradora'
                    }.`,
                    font,
                    size: sizeCuerpo,
                  }),
                ],
              }),

              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: 'Luz',
                    font,
                    size: sizeCuerpo,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 120 },
                children: [
                  new TextRun({
                    text: `La empresa comercializadora de electricidad es ${
                      datos.vivienda_empresa_luz || 'la compañía suministradora'
                    }.`,
                    font,
                    size: sizeCuerpo,
                  }),
                ],
              }),

              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: 'Basura',
                    font,
                    size: sizeCuerpo,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 400 },
                children: [
                  new TextRun({
                    text: `La recogida de basuras es realizada por ${
                      datos.vivienda_empresa_basura ||
                      'los Servicios Municipales'
                    }.`,
                    font,
                    size: sizeCuerpo,
                  }),
                ],
              }),

              // 9. DESCRIPCIÓN AMBIENTAL
              new Paragraph({
                spacing: { after: 200 },
                children: [
                  new TextRun({
                    text: '9. DESCRIPCIÓN AMBIENTAL DE LA ZONA',
                    font,
                    size: sizeTitulo,
                    bold: true,
                  }),
                ],
              }),
              // (Aquí va el texto genérico que siempre es igual, copiado de tu imagen)
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: '9.1 Medio físico',
                    font,
                    size: sizeCuerpo,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: '9.1.1 Aire',
                    font,
                    size: sizeCuerpo,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: '9.1.1.1 Emisiones:',
                    font,
                    size: sizeCuerpo,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Debido al tipo de actividad, no se prevén emisiones de ningún tipo a la atmósfera.',
                    font,
                    size: sizeCuerpo,
                  }),
                ],
                spacing: { after: 120 },
              }),

              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: '9.1.1.2 Ruidos:',
                    font,
                    size: sizeCuerpo,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                children: [
                  new TextRun({
                    text: 'Las únicas molestias que puede producir la actividad son las correspondientes a ruidos generados por inquilinos que arrenden la vivienda, no obstante y debido a la distancia en la que se encuentran unas viviendas de las otras, no se considera que el ruido pueda llegar a causar molestias a los vecinos.',
                    font,
                    size: sizeCuerpo,
                  }),
                ],
                spacing: { after: 120 },
              }),

              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: '9.1.1.3 Vibraciones:',
                    font,
                    size: sizeCuerpo,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'La actividad que nos ocupa, no produce vibraciones.',
                    font,
                    size: sizeCuerpo,
                  }),
                ],
                spacing: { after: 120 },
              }),

              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: '9.1.2 Agua',
                    font,
                    size: sizeCuerpo,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                children: [
                  new TextRun({
                    text: 'El agua necesaria para el desarrollo de la actividad procede de la red municipal de abastecimiento.',
                    font,
                    size: sizeCuerpo,
                  }),
                ],
                spacing: { after: 120 },
              }),

              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: '9.1.3 Suelo',
                    font,
                    size: sizeCuerpo,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Debido al tipo de actividad, no se prevén vertidos que puedan contaminar el suelo.',
                    font,
                    size: sizeCuerpo,
                  }),
                ],
                spacing: { after: 120 },
              }),

              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: '9.2 Medio biológico',
                    font,
                    size: sizeCuerpo,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: '9.2.1 Vegetación',
                    font,
                    size: sizeCuerpo,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                children: [
                  new TextRun({
                    text: 'Debido a que en la instalación donde se va a llevar a cabo la actividad no se van a realizar ningún tipo de obra, ampliación o modificación exterior de la misma, y teniendo en cuenta que la actividad se va a desarrollar en el interior de una vivienda, podemos concluir que las afecciones sobre la vegetación van a ser nulas.',
                    font,
                    size: sizeCuerpo,
                  }),
                ],
                spacing: { after: 120 },
              }),

              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: '9.2.2 Fauna',
                    font,
                    size: sizeCuerpo,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                children: [
                  new TextRun({
                    text: 'No se observa ningún tipo de especie animal que esté cerca o en la misma zona donde se pretende desarrollar la actividad. Por lo tanto consideramos que las afecciones sobre la fauna serán nulas.',
                    font,
                    size: sizeCuerpo,
                  }),
                ],
                spacing: { after: 120 },
              }),

              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: '9.2.3 Espacios naturales protegidos',
                    font,
                    size: sizeCuerpo,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                children: [
                  new TextRun({
                    text: 'No se observa ningún espacio natural protegido cerca de la instalación donde se va a llevar a cabo la actividad. Por lo tanto las afecciones sobre los espacios naturales protegidos son inexistentes.',
                    font,
                    size: sizeCuerpo,
                  }),
                ],
                spacing: { after: 120 },
              }),

              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: '9.3 Medio urbano',
                    font,
                    size: sizeCuerpo,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: '9.3.1 Tipo de edificación',
                    font,
                    size: sizeCuerpo,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                children: [
                  new TextRun({
                    text: 'La actividad que se pretende desarrollar, se realiza en una vivienda que no pertenece ni forma parte de ningún edificio residencial que cuente con ningún tipo de protección especial.',
                    font,
                    size: sizeCuerpo,
                  }),
                ],
                spacing: { after: 120 },
              }),

              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: '9.3.2 Patrimonio cultural',
                    font,
                    size: sizeCuerpo,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'La vivienda que nos ocupa, no pertenece a ningún edificio catalogado como bien de interés cultural.',
                    font,
                    size: sizeCuerpo,
                  }),
                ],
                spacing: { after: 120 },
              }),

              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: '9.3.3 Urbanismo',
                    font,
                    size: sizeCuerpo,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                children: [
                  new TextRun({
                    text: 'La vivienda que nos ocupa, está situada en un emplazamiento de uso residencial, situado en zona cuyo suelo está calificado como suelo urbano, en el cual está permitido este tipo de actividades.',
                    font,
                    size: sizeCuerpo,
                  }),
                ],
                spacing: { after: 400 },
              }),

              // 10. CONCLUSIÓN
              new Paragraph({
                spacing: { after: 200 },
                children: [
                  new TextRun({
                    text: '10. CONCLUSIÓN',
                    font,
                    size: sizeTitulo,
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { line: lineSpacing, after: 600 },
                children: [
                  new TextRun({
                    text: 'Por todo lo expuesto anteriormente, podemos concluir que la actividad se encuentra en una zona que permite su desarrollo y por todo ello solicitamos tengan a bien conceder con carácter POSITIVO el Certificado de Compatibilidad Urbanística.',
                    font,
                    size: sizeCuerpo,
                  }),
                ],
              }),

              // FECHA FINAL Y FIRMA
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 800 },
                children: [
                  new TextRun({ text: fechaTexto, font, size: sizeCuerpo }),
                ],
              }),

              new Paragraph({
                spacing: { before: 600, after: 600 },
                children: [new TextRun({ text: ' ', font })],
              }),

              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'El Ingeniero Técnico Industrial',
                    font,
                    size: sizeCuerpo,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: ingNombre, font, size: sizeCuerpo }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `Col nº ${ingNumColegiado} ${ingColegio}`,
                    font,
                    size: sizeCuerpo,
                  }),
                ],
              }),
            ],
          },
        ],
      });

      // 5. GUARDAR Y DESCARGAR
      const blob = await Packer.toBlob(doc);
      const nombreArchivoClean = titularNombre.replace(/[^a-zA-Z0-9]/g, '_');
      saveAs(blob, `Memoria_Tecnica_${nombreArchivoClean}.docx`);
    } catch (error) {
      console.error('Error generando Memoria Técnica:', error);
      throw error;
    }
  }

  async generarAnexoDecretoOcupacion(datos: any): Promise<void> {
    try {
      // 1. CARGAR PLANTILLA ÚNICA
      const pdfBytes = await this.loadImage(
        '/assets/ANEXOS DECRETO OCUPACION.pdf'
      );
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();

      // Función de limpieza
      const limpiarTexto = (texto: string) => {
        if (!texto) return '';
        return texto
          .replace(/[^\w\s\d.,;:\-\/()áéíóúÁÉÍÓÚñÑüÜ@]/g, '')
          .trim()
          .toUpperCase();
      };

      // --- 2. PREPARACIÓN DE DATOS ---

      // A) PERSONAS (Declarante vs Representante)
      let declNombre = '';
      let declDni = '';

      // Si hay un interesado distinto, él es el declarante. Si no, el titular.
      if (datos.existe_interesado_representante) {
        declNombre = `${datos.interesada_nombre} ${datos.interesada_apellidos}`;
        declDni = datos.interesada_dni_nif;
      } else {
        declNombre = `${datos.titular_nombre} ${datos.titular_apellidos}`;
        declDni = datos.titular_dni_nif;
      }

      // El Ingeniero actúa como REPRESENTANTE en el formulario
      const tecnico = datos.tecnico_ingeniero_seleccionado || {};
      const repNombre = tecnico.nombre || '';
      const repDni = tecnico.dni || '';
      const repTitulacion = tecnico.titulacion || '';

      // Datos de contacto (Del Ingeniero)
      const contDireccion = tecnico.direccionFiscal || '';
      const contCP = tecnico.codigoPostal || '';
      const contMunicipio = tecnico.localidad || '';
      const contProvincia = tecnico.provincia || '';
      const contTlf = tecnico.tlf || '';
      const contEmail = tecnico.correoEmpresa || '';
      const contPuerta = tecnico.oficina || '';

      // B) VIVIENDA / EDIFICACIÓN
      let calle = '';
      let numero = '';
      let piso = '';
      let puerta = '';
      let cpVivienda = datos.vivienda_codigo_postal || '';
      let pobVivienda = (datos.vivienda_poblacion || '').toUpperCase();
      let provVivienda = (datos.vivienda_provincia || '').toUpperCase();
      let direccionCompleta = '';
      let bloqueDetalle = ''; // Para campos tipo "Nº/Bloque/Escalera"

      if (datos.vivienda_nombre_via) {
        calle =
          `${datos.vivienda_tipo_via} ${datos.vivienda_nombre_via}`.toUpperCase();
        numero = datos.vivienda_numero || '';
        piso = datos.vivienda_piso || '';
        puerta = datos.vivienda_puerta || '';

        let detalles = [];
        if (numero) detalles.push(`Nº ${numero}`);
        if (piso) detalles.push(`Piso ${piso}`);
        if (puerta) detalles.push(`Pta ${puerta}`);
        bloqueDetalle = detalles.join(' - ');

        direccionCompleta = `${calle} ${bloqueDetalle}`;
      } else {
        direccionCompleta = (
          datos.vivienda_direccion_completa || ''
        ).toUpperCase();
        calle = direccionCompleta; // Si no hay desglose, todo a calle
      }

      const refCatastral = datos.vivienda_referencia_catastral || '';

      // C) FECHA
      let fechaRaw = datos.usar_fechas_distintas
        ? datos.fechas_tramites['servicio_seleccion_segunda_ocupacion']
        : datos.fecha_global;
      const fechaHoy = fechaRaw ? new Date(fechaRaw) : new Date();
      const meses = [
        'ENERO',
        'FEBRERO',
        'MARZO',
        'ABRIL',
        'MAYO',
        'JUNIO',
        'JULIO',
        'AGOSTO',
        'SEPTIEMBRE',
        'OCTUBRE',
        'NOVIEMBRE',
        'DICIEMBRE',
      ];

      const diaStr = fechaHoy.getDate().toString();
      const mesStr = meses[fechaHoy.getMonth()];
      const anyoStr = fechaHoy.getFullYear().toString(); // Ponemos año completo (ej 2025)

      const arquitecto = datos.tecnico_arquitecto_seleccionado || {};
      const arquitectoNombre = arquitecto.nombre || '';
      const arquitectoTitulacion = arquitecto.titulacion || '';

      // --- 3. MAPEO DE TODOS LOS CAMPOS (Anexo I y Anexo II juntos) ---
      const campos = {
        // --- PARTE 1: SOLICITUD / DECLARACIÓN RESPONSABLE ---
        // Declarante
        'Apellidos y Nombre  Razón SocialRow1': declNombre,
        DNICIFNIEPASAPORTERow1: declDni,

        // Representante (El Ingeniero)
        'Apellidos y Nombre  Razón SocialRow1_2': repNombre,
        DNICIFNIEPASAPORTERow1_2: repDni,

        // Datos Contacto (Del Ingeniero)
        Dirección: contDireccion,
        NBloqueEscaleraPlantaPuerta: contPuerta,
        CP: contCP,
        Municipio: contMunicipio,
        'A Provincia E': contProvincia,
        Teléfono: contTlf,
        'Correo electrónico': contEmail,

        // Emplazamiento Edificación (Parte 1)
        'Emplazamiento de la Edificación  DirecciónRow1': calle,
        NBloqueEscaleraPlantaPuertaRow1: bloqueDetalle,
        'Referencia Catastral de la edificación o de la parcela en caso de obra nuevaRow1':
          refCatastral,

        // --- PARTE 2: CERTIFICADO DE CONFORMIDAD ---
        // Datos Edificación (Parte 2)
        'Nombre Edificio': direccionCompleta, // Usamos la dirección como nombre identificativo
        Dirección_2: calle,
        n: numero,
        Municipio_2: pobVivienda,
        CP_2: cpVivienda,
        Provincia: provVivienda,

        // Datos Facultativos (Ingeniero)
        'Datos facultativos 1': arquitectoNombre,
        'en su condición de': arquitectoTitulacion, // Titulación

        'Identificación vivienda': direccionCompleta,
        'Referencia catastral': refCatastral,
        'Identificación vivienda_2': direccionCompleta,
        'Referencia catastral_2': refCatastral,
        'Identificación vivienda_3': direccionCompleta,
        'Referencia catastral_3': refCatastral,

        // Fecha de firma
        día: diaStr,
        mes: mesStr,
        año: anyoStr,
      };

      // 4. RELLENAR CAMPOS DE TEXTO
      for (const [key, value] of Object.entries(campos)) {
        try {
          const field = form.getTextField(key);
          if (field) {
            field.setText(limpiarTexto(value));
          } else if (key === 'n') {
            // Intento extra para el campo número que a veces falla por caracteres raros
            try {
              form.getTextField('n.º')?.setText(limpiarTexto(value));
            } catch (e) {}
          }
        } catch (e) {
          // Campo no encontrado (puede variar según versión del PDF)
        }
      }

      // 5. CHECKBOXES

      // A) Notificación Electrónica (Parte 1)
      if (contEmail) {
        try {
          // Intenta nombres comunes, ajusta si ves el nombre exacto en otra captura
          const check =
            form.getCheckBox('Si') ||
            form.getCheckBox('C sí') ||
            form.getCheckBox('Check Box1');
          if (check) check.check();
        } catch (e) {}
      }

      // B) Antigüedad Vivienda (Fichas 2.1, 2.2, 2.3)
      // B) Antigüedad Vivienda (Fichas 2.1, 2.2, 2.3)
      const year = parseInt(datos.vivienda_ano_construccion || '0');

      if (year > 0) {
        try {
          // PASO CLAVE: Desmarcar TODOS primero para limpiar la plantilla
          // (Esto evita que si la plantilla trae uno marcado, se queden dos marcados)
          const check34 = form.getCheckBox('Check Box34');
          const check35 = form.getCheckBox('Check Box35');
          const check36 = form.getCheckBox('Check Box36');

          if (check34) check34.uncheck();
          if (check35) check35.uncheck();
          if (check36) check36.uncheck();

          // PASO 2: Marcar el correcto según la fecha
          // Nota: Al tener solo el año, aproximamos 1989 y 2010 a los grupos intermedios.

          if (year < 1989) {
            // Antes de 1989 -> Ficha 2.1
            if (check34) check34.check();
          } else if (year >= 1989 && year <= 2010) {
            // Entre 1989 y 2010 -> Ficha 2.2
            if (check35) check35.check();
          } else if (year > 2010) {
            // Después de 2010 -> Ficha 2.3
            if (check36) check36.check();
          }
        } catch (e) {
          console.warn(
            'No se encontraron los checkboxes de año o hubo un error al marcarlos.',
            e
          );
        }
      }

      // 6. GUARDAR Y DESCARGAR
      form.flatten();
      const nombreLimpio = declNombre.replace(/[^a-zA-Z0-9]/g, '_');

      // --- DOCUMENTO 1: ANEXO I (Páginas 1 a 5) ---
      // Índices: 0, 1, 2, 3, 4
      const docAnexo1 = await PDFDocument.create();
      // Copiamos las páginas del documento original ya relleno (pdfDoc)
      const paginasAnexo1 = await docAnexo1.copyPages(pdfDoc, [0, 1, 2, 3, 4]);
      paginasAnexo1.forEach((page) => docAnexo1.addPage(page));

      const pdfBytes1 = await docAnexo1.save();
      saveAs(
        new Blob([pdfBytes1 as any], { type: 'application/pdf' }),
        `ANEXO_I.pdf`
      );

      // --- DOCUMENTO 2: ANEXO II (Páginas 6 y 7) ---
      // Índices: 5, 6
      const docAnexo2 = await PDFDocument.create();
      const paginasAnexo2 = await docAnexo2.copyPages(pdfDoc, [5, 6]);
      paginasAnexo2.forEach((page) => docAnexo2.addPage(page));

      const pdfBytes2 = await docAnexo2.save();
      saveAs(
        new Blob([pdfBytes2 as any], { type: 'application/pdf' }),
        `ANEXO_II.pdf`
      );

      // --- DOCUMENTO 3: FICHA TÉCNICA (Según Año) ---
      let indicesFicha: number[] = [];
      let nombreFicha = '';

      if (year > 0) {
        if (year < 1989) {
          // FICHA 2.1: Páginas 17 y 18 (Índices 16, 17)
          indicesFicha = [16, 17];
          nombreFicha = 'FICHA2_1';
        } else if (year >= 1989 && year <= 2010) {
          // FICHA 2.2: Páginas 19 a 22 (Índices 18, 19, 20, 21)
          indicesFicha = [18, 19, 20, 21];
          nombreFicha = 'FICHA2_2';
        } else if (year > 2010) {
          // FICHA 2.3: Páginas 23 a 26 (Índices 22, 23, 24, 25)
          indicesFicha = [22, 23, 24, 25];
          nombreFicha = 'FICHA2_3';
        }

        // Si hemos encontrado rango de fecha, creamos el PDF de la ficha
        if (indicesFicha.length > 0) {
          const docFicha = await PDFDocument.create();
          const paginasFicha = await docFicha.copyPages(pdfDoc, indicesFicha);
          paginasFicha.forEach((page) => docFicha.addPage(page));

          const pdfBytesFicha = await docFicha.save();
          saveAs(
            new Blob([pdfBytesFicha as any], { type: 'application/pdf' }),
            `${nombreFicha}.pdf`
          );
        }
      }
    } catch (error) {
      console.error('Error generando Anexo Decreto Completo:', error);
      alert(
        'Error al generar el PDF. Verifica que "ANEXOS DECRETO OCUPACION.pdf" está en assets.'
      );
    }
  }

  async generarRegistroVTCoselleria(datos: any): Promise<void> {
    const COLORS = {
      red: 'CC0000', // Rojo para asteriscos y selectores
      headerDark: '666666', // Gris oscuro (Letra sección)
      headerLight: 'F2F2F2', // Gris claro (Título sección)
      inputBorder: 'CCCCCC', // Borde gris de los inputs
      inputBg: 'FFFFFF', // Fondo blanco inputs
      textLabel: '333333', // Color etiqueta
      infoBg: 'E6E6E6', // Fondo gris para bloques de texto (A, H)
    };

    // Fuentes y tamaños (en medios puntos, 14 = 7pt, 18 = 9pt, 20 = 10pt)
    const SIZES = {
      label: 14, // 7pt
      value: 18, // 9pt
      icon: 16,
    };
    try {
      // --- 1. PREPARACIÓN DE DATOS ---
      const ingeniero = datos.tecnico_ingeniero_seleccionado || {};

      // Limpiezas
      const cleanTlf = (ingeniero.tlf || '').replace(/[^0-9\s]/g, '').trim();
      const cleanEmail = (ingeniero.correoEmpresa || '')
        .toLowerCase()
        .replace(/[^a-z0-9@._-]/g, '')
        .trim();
      const toUpper = (str: any) => (str ? String(str).toUpperCase() : '');

      // Mapeo seguro de datos
      const dTitular = {
        nombre: toUpper(datos.titular_nombre),
        apellidos: toUpper(datos.titular_apellidos),
        dni: toUpper(datos.titular_dni_nif),
        tipoVia: toUpper(datos.titular_tipo_via),
        nombreVia: toUpper(datos.titular_nombre_via),
        numero: toUpper(datos.titular_numero),
        piso: toUpper(datos.titular_piso),
        puerta: toUpper(datos.titular_puerta),
        cp: toUpper(datos.titular_codigo_postal),
        poblacion: toUpper(datos.titular_poblacion),
        provincia: toUpper(datos.titular_provincia),
      };

      // Lógica Interesado (Hereda de titular si no existe tercero)
      let dInteresado: any = {};
      if (datos.existe_interesado_representante) {
        dInteresado = {
          nombre: toUpper(datos.interesada_nombre),
          apellidos: toUpper(datos.interesada_apellidos),
          dni: toUpper(datos.interesada_dni_nif),
          tipoVia: toUpper(dTitular.tipoVia), // Hereda dirección
          nombreVia: toUpper(dTitular.nombreVia),
          numero: toUpper(dTitular.numero),
          piso: toUpper(dTitular.piso),
          puerta: toUpper(dTitular.puerta),
          cp: toUpper(dTitular.cp),
          poblacion: toUpper(dTitular.poblacion),
          provincia: toUpper(dTitular.provincia),
        };
      } else {
        dInteresado = { ...dTitular };
      }

      // Separar apellidos interesado
      const intApellidos = dInteresado.apellidos || '';
      const intApellido1 = intApellidos.split(' ')[0] || intApellidos;
      const intApellido2 = intApellidos.split(' ').slice(1).join(' ') || '';

      // Lógica Representante
      let dRep: any = {};
      let repNombre = '';
      let repApellidos = '';

      if (datos.check_requiere_representacion) {
        // Representante es el Ingeniero
        dRep.dni = toUpper(ingeniero.dni);
        repNombre = toUpper(ingeniero.nombre);
        repApellidos = ''; // Ingeniero suele tener nombre completo en 'nombre' o ajustar según tu DB
      } else {
        // Se representa a sí mismo
        dRep.dni = dInteresado.dni;
        repNombre = dInteresado.nombre;
        repApellidos = dInteresado.apellidos;
      }
      const repApellido1 =
        repApellidos.split(' ')[0] || (repApellidos ? '' : repNombre); // Fallback
      const repApellido2 = repApellidos.split(' ').slice(1).join(' ') || '';
      const repNombreReal = repApellidos ? repNombre : '';

      // --- 2. HELPERS DE DISEÑO ---

      /** Crea el encabezado de sección: Caja oscura (Letra) + Caja clara (Título) */
      const crearHeaderSeccion = (letra: string, titulo: string) => {
        return new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE },
          },
          rows: [
            new TableRow({
              height: { value: 400, rule: HeightRule.ATLEAST },
              children: [
                new TableCell({
                  width: { size: 5, type: WidthType.PERCENTAGE },
                  shading: { fill: COLORS.headerDark, type: ShadingType.CLEAR },
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: letra,
                          color: 'FFFFFF',
                          bold: true,
                          size: 24,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 95, type: WidthType.PERCENTAGE },
                  shading: {
                    fill: COLORS.headerLight,
                    type: ShadingType.CLEAR,
                  },
                  verticalAlign: VerticalAlign.CENTER,
                  margins: { left: 150 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: titulo.toUpperCase(),
                          bold: true,
                          size: 20,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        });
      };

      /** * Crea un INPUT visual.
       * label: Etiqueta superior
       * value: Valor dentro de la caja
       * widthPct: Ancho en porcentaje de la fila
       * required: Si lleva asterisco rojo
       * isSelect: Si lleva flecha roja a la derecha
       * noCaps: Si es true, no fuerza mayúsculas (para emails)
       */
      const crearInput = (
        label: string,
        value: string,
        widthPct: number,
        required: boolean = false,
        isSelect: boolean = false,
        noCaps: boolean = false
      ) => {
        const valFinal = noCaps ? value || '' : (value || '').toUpperCase();

        return new TableCell({
          width: { size: widthPct, type: WidthType.PERCENTAGE },
          // IMPORTANTE: Quitamos bordes de la celda contenedora
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
          },
          // IMPORTANTE: Margen derecho pequeño para separar inputs
          margins: { right: 100, left: 0, top: 0, bottom: 0 },
          children: [
            // 1. Label
            new Paragraph({
              spacing: { before: 60, after: 30 }, // Espaciado ajustado
              children: [
                required
                  ? new TextRun({
                      text: '* ',
                      color: COLORS.red,
                      bold: true,
                      size: SIZES.label + 2,
                    })
                  : new TextRun({ text: '' }),
                new TextRun({
                  text: label.toUpperCase(),
                  size: SIZES.label,
                  color: COLORS.textLabel,
                }),
              ],
            }),
            // 2. La Caja (Input Box) hecha con una tabla anidada de 1 celda
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      // Borde gris alrededor del valor
                      borders: {
                        top: {
                          style: BorderStyle.SINGLE,
                          color: COLORS.inputBorder,
                        },
                        bottom: {
                          style: BorderStyle.SINGLE,
                          color: COLORS.inputBorder,
                        },
                        left: {
                          style: BorderStyle.SINGLE,
                          color: COLORS.inputBorder,
                        },
                        right: {
                          style: BorderStyle.SINGLE,
                          color: COLORS.inputBorder,
                        },
                      },
                      shading: {
                        fill: isSelect ? COLORS.headerLight : COLORS.inputBg,
                        type: ShadingType.CLEAR,
                      }, // Selects grisáceos a veces
                      margins: { top: 50, bottom: 50, left: 80, right: 80 }, // Margen interno cómodo pero no excesivo
                      verticalAlign: VerticalAlign.CENTER,
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: valFinal, size: SIZES.value }),
                            // Flecha si es select
                            isSelect
                              ? new TextRun({
                                  text: '\t▼',
                                  color: COLORS.red,
                                  size: 14,
                                })
                              : new TextRun({ text: '' }),
                          ],
                          tabStops: isSelect
                            ? [{ type: 'right', position: 9000 }]
                            : [], // Empuja la flecha a la derecha
                          alignment: isSelect
                            ? AlignmentType.BOTH
                            : AlignmentType.LEFT,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        });
      };

      /** Crea una fila contenedora para los inputs */
      const crearFila = (celdas: TableCell[]) => {
        return new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE },
          },
          rows: [new TableRow({ children: celdas })],
        });
      };

      /** Crea bloque de texto gris (A y G) */
      const crearBloqueTextoGris = (
        texto: string,
        conCheck: boolean = false
      ) => {
        return new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, color: COLORS.inputBorder },
            bottom: { style: BorderStyle.SINGLE, color: COLORS.inputBorder },
            left: { style: BorderStyle.SINGLE, color: COLORS.inputBorder },
            right: { style: BorderStyle.SINGLE, color: COLORS.inputBorder },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: COLORS.infoBg, type: ShadingType.CLEAR },
                  margins: { top: 100, bottom: 100, left: 100, right: 100 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.JUSTIFIED,
                      children: [
                        conCheck
                          ? new TextRun({
                              text: '☑ ',
                              color: '008000',
                              size: 24,
                            })
                          : new TextRun({
                              text: '* ',
                              color: COLORS.red,
                              size: 24,
                              bold: true,
                            }),
                        new TextRun({
                          text: texto,
                          size: 16,
                          color: conCheck ? '008000' : '333333',
                        }), // Verde o Gris oscuro
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        });
      };

      // --- 3. CONSTRUCCIÓN DEL DOCUMENTO ---
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              // ================= SECCIÓN A =================
              crearHeaderSeccion('A', 'PROCEDIMIENTO'),
              new Paragraph({ spacing: { before: 100 } }),
              crearBloqueTextoGris(
                'AUTOREGISTRO DE VIVIENDAS DE USO TURÍSTICO. DECLARACIÓN RESPONSABLE referente al ALTA/INICIO DE ACTIVIDAD...'
              ),
              new Paragraph({ spacing: { after: 200 } }),

              // ================= SECCIÓN B =================
              crearHeaderSeccion('B', 'TIPO DE EXPEDIENTE'),
              crearFila([
                crearInput(
                  'TIPO DE EXPEDIENTE',
                  'Expedientes Inscripción Viviendas de uso turístico',
                  100,
                  true,
                  true
                ),
              ]),
              new Paragraph({ spacing: { after: 200 } }),

              // ================= SECCIÓN C =================
              crearHeaderSeccion(
                'C',
                'DATOS DE LA PERSONA O ENTIDAD INTERESADA'
              ),

              // Fila 1: DNI (20) | Apell1 (35) | Apell2 (20) | Nombre (25)
              crearFila([
                crearInput('DNI/NIF/NIE', dInteresado.dni, 20, true),
                crearInput(
                  'PRIMER APELLIDO O RAZÓN SOCIAL',
                  intApellido1,
                  35,
                  true
                ),
                crearInput('SEGUNDO APELLIDO', intApellido2, 20),
                crearInput('NOMBRE', dInteresado.nombre, 25), // Nombre solo si es persona física
              ]),

              // Fila 2: Tipo Via (20) | Nombre Via (80)
              crearFila([
                crearInput('TIPO DE VÍA', dInteresado.tipoVia, 20, true, true),
                crearInput(
                  'NOMBRE DE LA VÍA PÚBLICA',
                  dInteresado.nombreVia,
                  80,
                  true
                ),
              ]),

              // Fila 3: Num (15) | Letra (15) | Esc (20) | Piso (25) | Puerta (25)
              crearFila([
                crearInput('NÚMERO', dInteresado.numero, 15, true),
                crearInput('LETRA', '', 15),
                crearInput('ESCALERA', '', 20),
                crearInput('PISO', dInteresado.piso, 25),
                crearInput('PUERTA', dInteresado.puerta, 25),
              ]),

              // Fila 4: CP (15) | Provincia (40) | Municipio (45)
              crearFila([
                crearInput('CP', dInteresado.cp, 15, true),
                crearInput('PROVINCIA', dInteresado.provincia, 40, true, true),
                crearInput('MUNICIPIO', dInteresado.poblacion, 45, true, true),
              ]),

              // Fila 5: Telefono (25) | Email (75) - EMAIL EN MINÚSCULAS
              crearFila([
                crearInput('TELÉFONO', cleanTlf, 25, true),
                crearInput('E-MAIL', cleanEmail, 75, true, false, true), // noCaps = true
              ]),

              new Paragraph({ spacing: { after: 200 } }),

              // ================= SECCIÓN D =================
              crearHeaderSeccion('D', 'DATOS DE LA PERSONA REPRESENTANTE'),

              // Fila Rep: Apell1 (30) | Apell2 (20) | Nombre (20) | DNI (15) | Telefono (15)
              crearFila([
                crearInput(
                  'PRIMER APELLIDO O RAZÓN SOCIAL',
                  repApellido1,
                  30,
                  true
                ),
                crearInput('SEGUNDO APELLIDO', repApellido2, 20),
                crearInput('NOMBRE', repNombreReal, 20),
                crearInput('DNI', dRep.dni, 15, true),
                crearInput('TELÉFONO', cleanTlf, 15),
              ]),

              new Paragraph({ spacing: { after: 200 } }),

              // ================= SECCIÓN E (Notificaciones) =================
              crearHeaderSeccion(
                'E',
                'NOTIFICACIONES (SI ES PERSONA FÍSICA...)'
              ),

              // Dirección notificación (Usamos datos interesado por defecto)
              crearFila([
                crearInput('TIPO DE VÍA', dInteresado.tipoVia, 25, false, true),
                crearInput(
                  'NOMBRE DE LA VÍA PÚBLICA',
                  dInteresado.nombreVia,
                  75
                ),
              ]),

              // Fila 3: Num (15) | Letra (15) | Esc (20) | Piso (25) | Puerta (25)
              crearFila([
                crearInput('NÚMERO', dInteresado.numero, 15),
                crearInput('LETRA', '', 15),
                crearInput('ESCALERA', '', 20),
                crearInput('PISO', dInteresado.piso, 25),
                crearInput('PUERTA', dInteresado.puerta, 25),
              ]),

              crearFila([
                crearInput('CP', dInteresado.cp, 15),
                crearInput('PROVINCIA', dInteresado.provincia, 40, false, true),
                crearInput('MUNICIPIO', dInteresado.poblacion, 45, false, true),
              ]),

              crearFila([
                crearInput('TELÉFONO', cleanTlf, 25),
                crearInput(
                  'CORREO ELECTRÓNICO',
                  cleanEmail,
                  75,
                  true,
                  false,
                  true
                ), // noCaps
              ]),

              // Checkbox verde final de sección E
              new Paragraph({
                spacing: { before: 150 },
                children: [
                  new TextRun({ text: '☑ ', color: '008000', size: 24 }),
                  new TextRun({
                    text: 'Si el solicitante es persona física, ¿acepta la notificación exclusivamente por medios electrónicos...?',
                    size: 14,
                    color: '008000',
                  }),
                ],
              }),

              new Paragraph({ spacing: { after: 200 } }),

              // ================= SECCIÓN F =================
              crearHeaderSeccion('F', 'IDIOMA DE LA NOTIFICACIÓN'),
              crearFila([
                crearInput('ESCOGE UNA OPCIÓN', 'Castellano', 40, true, true),
              ]),
              new Paragraph({ spacing: { after: 200 } }),

              // ================= SECCIÓN G =================
              crearHeaderSeccion('G', 'DECLARACIÓN RESPONSABLE'),
              crearBloqueTextoGris(
                'La persona que firma declara, bajo su responsabilidad, que los datos reseñados...',
                true
              ), // true = Check verde
              new Paragraph({ spacing: { after: 200 } }),

              // ================= SECCIÓN H =================
              crearHeaderSeccion('H', 'PROTECCIÓN DE DATOS'),
              // Caja simple gris claro
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.SINGLE, color: 'CCCCCC' },
                  bottom: { style: BorderStyle.SINGLE, color: 'CCCCCC' },
                  left: { style: BorderStyle.SINGLE, color: 'CCCCCC' },
                  right: { style: BorderStyle.SINGLE, color: 'CCCCCC' },
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        shading: {
                          fill: COLORS.infoBg,
                          type: ShadingType.CLEAR,
                        },
                        margins: {
                          top: 100,
                          bottom: 100,
                          left: 100,
                          right: 100,
                        },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.JUSTIFIED,
                            children: [
                              new TextRun({
                                text: 'PROTECCIÓN DE DATOS: De conformidad con...',
                                size: 14,
                                color: '333333',
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              new Paragraph({ spacing: { after: 200 } }),

              // ================= SECCIÓN I =================
              crearHeaderSeccion('I', 'ORGANISMO'),
              new Paragraph({ spacing: { before: 50 } }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        shading: {
                          fill: COLORS.infoBg,
                          type: ShadingType.CLEAR,
                        },
                        margins: {
                          top: 100,
                          bottom: 100,
                          left: 100,
                          right: 100,
                        },
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: '* ',
                                color: COLORS.red,
                                bold: true,
                                size: 24,
                              }),
                              new TextRun({
                                text: 'Conselleria de Industria, Turismo, Innovación y Comercio',
                                size: 18,
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),

              // ================= FIRMA =================
              new Paragraph({
                spacing: { before: 400 },
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'FIRMA:', bold: true })],
              }),

              datos.firma_cliente_imagen
                ? new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new ImageRun({
                        data: await (await fetch(datos.firma_cliente_imagen))
                          .blob()
                          .then((blob) => blob.arrayBuffer()),
                        transformation: { width: 150, height: 100 },
                        type: 'png',
                      }),
                    ],
                  })
                : new Paragraph({ text: '' }),

              // ================= BOTONES FOOTER =================
              new Paragraph({ spacing: { before: 400 } }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.NONE },
                  left: { style: BorderStyle.NONE },
                  right: { style: BorderStyle.NONE },
                  insideVertical: { style: BorderStyle.NONE },
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 70, type: WidthType.PERCENTAGE },
                        children: [],
                      }),
                      // Cancelar
                      new TableCell({
                        width: { size: 15, type: WidthType.PERCENTAGE },
                        shading: { fill: '333333', type: ShadingType.CLEAR },
                        verticalAlign: VerticalAlign.CENTER,
                        margins: { top: 100, bottom: 100 },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: 'Cancelar ',
                                color: 'FFFFFF',
                                size: 20,
                              }),
                              new TextRun({
                                text: '↪',
                                color: 'FFFFFF',
                                size: 24,
                                bold: true,
                              }),
                            ],
                          }),
                        ],
                      }),
                      new TableCell({
                        width: { size: 1, type: WidthType.PERCENTAGE },
                        children: [],
                      }),
                      // Finalizar
                      new TableCell({
                        width: { size: 14, type: WidthType.PERCENTAGE },
                        shading: { fill: '2E7D32', type: ShadingType.CLEAR },
                        verticalAlign: VerticalAlign.CENTER,
                        margins: { top: 100, bottom: 100 },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: 'Finaliza ',
                                color: 'FFFFFF',
                                size: 20,
                              }),
                              new TextRun({
                                text: '✓',
                                color: 'FFFFFF',
                                size: 24,
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
            ],
          },
        ],
      });

      // GENERAR DOC
      const blob = await Packer.toBlob(doc);
      const nombreLimpio = dInteresado.nombre
        ? dInteresado.nombre.replace(/[^a-zA-Z0-9]/g, '_')
        : 'Registro';
      saveAs(blob, `Registro_VT_Conselleria_${nombreLimpio}.docx`);
    } catch (error) {
      console.error('Error generando Registro VT:', error);
      throw error;
    }
  }

  async generarRegistroVTPDF(datos: any): Promise<void> {
    // 1. CARGA DINÁMICA DE LA LIBRERÍA (Soluciona el error "Dynamic require")
    // Esto carga la librería solo cuando se llama a la función, evitando el error de compilación.
    const html2pdf = (await import('html2pdf.js')).default;

    // 2. PREPARACIÓN DE DATOS
    const toUpper = (str: any) => (str ? String(str).toUpperCase() : '');
    const ingeniero = datos.tecnico_ingeniero_seleccionado || {};

    // Limpieza
    const cleanTlf = (ingeniero.tlf || '').replace(/[^0-9\s]/g, '').trim();
    const cleanEmail = (ingeniero.correoEmpresa || '').toLowerCase().trim();

    // Mapeo Titular
    const dTitular = {
      nombre: toUpper(datos.titular_nombre),
      apellidos: toUpper(datos.titular_apellidos),
      dni: toUpper(datos.titular_dni_nif),
      tipoVia: toUpper(datos.titular_tipo_via),
      nombreVia: toUpper(datos.titular_nombre_via),
      numero: toUpper(datos.titular_numero),
      piso: toUpper(datos.titular_piso),
      puerta: toUpper(datos.titular_puerta),
      cp: toUpper(datos.titular_codigo_postal),
      poblacion: toUpper(datos.titular_poblacion),
      provincia: toUpper(datos.titular_provincia),
    };

    // Mapeo Interesado
    let dInteresado = datos.existe_interesado_representante
      ? {
          nombre: toUpper(datos.interesada_nombre),
          apellidos: toUpper(datos.interesada_apellidos),
          dni: toUpper(datos.interesada_dni_nif),
          tipoVia: toUpper(dTitular.tipoVia),
          nombreVia: toUpper(dTitular.nombreVia),
          numero: toUpper(dTitular.numero),
          piso: toUpper(dTitular.piso),
          puerta: toUpper(dTitular.puerta),
          cp: toUpper(dTitular.cp),
          poblacion: toUpper(dTitular.poblacion),
          provincia: toUpper(dTitular.provincia),
        }
      : { ...dTitular };

    // Gestión de nombres compuestos
    const intApellidos = dInteresado.apellidos || '';
    // Si hay apellidos, intentamos separar el primero del resto. Si no, lo dejamos todo en el primero.
    const intParts = intApellidos.split(' ');
    const intApellido1 = intParts[0] || '';
    const intApellido2 = intParts.slice(1).join(' ') || '';

    // Mapeo Representante
    let dRep: any = {};
    let repNombre = '';
    let repApellidos = '';

    if (datos.check_requiere_representacion) {
      dRep.dni = toUpper(ingeniero.dni);
      repNombre = toUpper(ingeniero.nombre);
      repApellidos = ''; // Asumimos nombre completo en 'nombre' para el técnico
    } else {
      dRep.dni = dInteresado.dni;
      repNombre = dInteresado.nombre;
      repApellidos = dInteresado.apellidos;
    }

    const repParts = repApellidos ? repApellidos.split(' ') : [];
    const repApellido1 = repParts[0] || (repApellidos ? '' : repNombre);
    const repApellido2 = repParts.slice(1).join(' ') || '';
    const repNombreReal = repApellidos ? repNombre : '';

    // 3. PLANTILLA HTML/CSS (DISEÑO IDÉNTICO A CAPTURAS)
    const content = `
    <html>
    <head>
      <style>
        /* RESET Y FUENTES */
        body { font-family: 'Arial', sans-serif; font-size: 10px; color: #333; margin: 0; padding: 20px; box-sizing: border-box; }
        * { box-sizing: border-box; }

        /* SISTEMA DE REJILLA FLEX */
        .row { display: flex; width: 100%; gap: 15px; margin-bottom: 8px; align-items: flex-end; }
        .col { display: flex; flex-direction: column; }

        /* ENCABEZADOS DE SECCIÓN (Estilo GVA) */
        .header-section { display: flex; width: 100%; margin-bottom: 10px; margin-top: 15px; }
        .header-letter {
          background-color: #666666; color: white; font-weight: bold; font-size: 16px;
          width: 35px; height: 35px; display: flex; align-items: center; justify-content: center;
        }
        .header-title {
          background-color: #F2F2F2; color: #000; font-weight: bold; font-size: 13px;
          flex-grow: 1; display: flex; align-items: center; padding-left: 15px; text-transform: uppercase;
          height: 35px;
        }

        /* INPUTS Y LABELS */
        .label {
          font-size: 8px; color: #333; margin-bottom: 3px;
          text-transform: uppercase; font-weight: normal; letter-spacing: 0.5px;
        }
        .req { color: #CC0000; font-weight: bold; font-size: 10px; margin-right: 2px; }

        .input-box {
          border: 1px solid #CCCCCC; /* Borde gris suave */
          height: 26px; /* Altura estándar input */
          display: flex; align-items: center; padding: 0 5px;
          font-size: 11px; background: #fff; position: relative; color: #000;
        }

        /* Selectores con flecha roja */
        .is-select { background-color: #FFFFFF; } /* A veces GVA usa blanco, a veces gris muy claro */
        .is-select::after {
          content: '⌵'; /* Caracter unicode flecha abajo */
          color: #CC0000; font-weight: bold; font-size: 14px; position: absolute; right: 8px; top: 2px;
          transform: scaleX(1.5); /* Ensanchar para que parezca el icono de GVA */
        }

        /* CAJAS DE INFORMACIÓN (Gris Fondo) */
        .info-box {
          background-color: #E6E6E6; padding: 12px; text-align: justify;
          font-size: 9px; line-height: 1.3; border: 1px solid #CCC; margin-bottom: 5px; color: #333;
        }

        /* CHECKBOX VERDE */
        .check-green-box {
          display: inline-block; width: 14px; height: 14px; background-color: #2E7D32; color: white;
          text-align: center; line-height: 14px; font-size: 10px; margin-right: 5px; vertical-align: middle;
        }
        .text-green { color: #2E7D32; font-size: 9px; vertical-align: middle; }

        /* FOOTER DE FIRMA Y BOTONES */
        .footer-btns { margin-top: 40px; display: flex; justify-content: flex-end; gap: 5px; }
        .btn { padding: 8px 15px; color: white; font-size: 12px; font-family: sans-serif; display: flex; align-items: center; gap: 5px; border: none; }
        .btn-cancel { background-color: #444; }
        .btn-success { background-color: #2E7D32; }

      </style>
    </head>
    <body>

      <div class="header-section">
        <div class="header-letter">A</div>
        <div class="header-title">Procedimiento</div>
      </div>
      <div class="label"><span class="req">*</span></div>
      <div class="info-box">
        AUTOREGISTRO DE VIVIENDAS DE USO TURÍSTICO. DECLARACIÓN RESPONSABLE referente al ALTA/INICIO DE ACTIVIDAD de viviendas de uso turístico, así como MODIFICACIÓN (cambio TITULAR, cambio persona PROPIETARIA, capacidad, periodo funcionamiento, datos contacto y otros datos no esenciales), y/o BAJA de las viviendas de uso turístico ya inscritas
      </div>

      <div class="header-section">
        <div class="header-letter">B</div>
        <div class="header-title">Tipo de Expediente</div>
      </div>
      <div class="label"><span class="req">*</span></div>
      <div class="row">
        <div class="col" style="width: 100%">
          <div class="input-box is-select">Expedientes Inscripción Viviendas de uso turístico</div>
        </div>
      </div>

      <div class="header-section">
        <div class="header-letter">C</div>
        <div class="header-title">Datos de la persona o entidad interesada</div>
      </div>

      <div class="row">
        <div class="col" style="width: 18%">
          <div class="label"><span class="req">*</span> DNI/NIF/NIE</div>
          <div class="input-box">${dInteresado.dni}</div>
        </div>
        <div class="col" style="width: 38%">
          <div class="label"><span class="req">*</span> Primer Apellido o Razón Social</div>
          <div class="input-box">${intApellido1}</div>
        </div>
        <div class="col" style="width: 22%">
          <div class="label">Segundo Apellido</div>
          <div class="input-box">${intApellido2}</div>
        </div>
        <div class="col" style="width: 22%">
          <div class="label">Nombre</div>
          <div class="input-box">${dInteresado.nombre}</div>
        </div>
      </div>

      <div class="row">
        <div class="col" style="width: 20%">
          <div class="label"><span class="req">*</span> Tipo de vía</div>
          <div class="input-box is-select">${dInteresado.tipoVia}</div>
        </div>
        <div class="col" style="width: 80%">
          <div class="label"><span class="req">*</span> Nombre de la vía pública</div>
          <div class="input-box">${dInteresado.nombreVia}</div>
        </div>
      </div>

      <div class="row">
        <div class="col" style="width: 15%">
          <div class="label"><span class="req">*</span> Número</div>
          <div class="input-box">${dInteresado.numero}</div>
        </div>
        <div class="col" style="width: 15%">
          <div class="label">Letra</div>
          <div class="input-box"></div>
        </div>
        <div class="col" style="width: 20%">
          <div class="label">Escalera</div>
          <div class="input-box"></div>
        </div>
        <div class="col" style="width: 25%">
          <div class="label">Piso</div>
          <div class="input-box">${dInteresado.piso}</div>
        </div>
        <div class="col" style="width: 25%">
          <div class="label">Puerta</div>
          <div class="input-box">${dInteresado.puerta}</div>
        </div>
      </div>

      <div class="row">
        <div class="col" style="width: 18%">
          <div class="label"><span class="req">*</span> CP</div>
          <div class="input-box">${dInteresado.cp}</div>
        </div>
        <div class="col" style="width: 41%">
          <div class="label"><span class="req">*</span> Provincia</div>
          <div class="input-box is-select">${dInteresado.provincia}</div>
        </div>
        <div class="col" style="width: 41%">
          <div class="label"><span class="req">*</span> Municipio</div>
          <div class="input-box is-select">${dInteresado.poblacion}</div>
        </div>
      </div>

      <div class="row">
        <div class="col" style="width: 25%">
          <div class="label"><span class="req">*</span> Teléfono</div>
          <div class="input-box">${cleanTlf}</div>
        </div>
        <div class="col" style="width: 75%">
          <div class="label"><span class="req">*</span> E-Mail</div>
          <div class="input-box" style="text-transform: lowercase !important;">${cleanEmail}</div>
        </div>
      </div>

      <div class="header-section">
        <div class="header-letter">D</div>
        <div class="header-title">Datos de la persona representante</div>
      </div>
       <div class="row">
        <div class="col" style="width: 30%">
          <div class="label"><span class="req">*</span> Primer Apellido o Razón Social</div>
          <div class="input-box">${repApellido1}</div>
        </div>
        <div class="col" style="width: 20%">
          <div class="label">Segundo Apellido</div>
          <div class="input-box">${repApellido2}</div>
        </div>
        <div class="col" style="width: 20%">
          <div class="label">Nombre</div>
          <div class="input-box">${repNombreReal}</div>
        </div>
         <div class="col" style="width: 15%">
          <div class="label"><span class="req">*</span> DNI</div>
          <div class="input-box">${dRep.dni}</div>
        </div>
        <div class="col" style="width: 15%">
          <div class="label">Teléfono</div>
          <div class="input-box">${cleanTlf}</div>
        </div>
      </div>

      <div class="header-section">
        <div class="header-letter">E</div>
        <div class="header-title">Notificaciones (Si es persona física...)</div>
      </div>

      <div class="row">
        <div class="col" style="width: 20%">
          <div class="label">Tipo de vía</div>
          <div class="input-box is-select">${dInteresado.tipoVia}</div>
        </div>
        <div class="col" style="width: 80%">
          <div class="label">Nombre de la vía pública</div>
          <div class="input-box">${dInteresado.nombreVia}</div>
        </div>
      </div>

      <div class="row">
        <div class="col" style="width: 15%">
          <div class="label">Número</div>
          <div class="input-box">${dInteresado.numero}</div>
        </div>
        <div class="col" style="width: 15%">
          <div class="label">Letra</div>
          <div class="input-box"></div>
        </div>
        <div class="col" style="width: 20%">
          <div class="label">Escalera</div>
          <div class="input-box"></div>
        </div>
        <div class="col" style="width: 25%">
          <div class="label">Piso</div>
          <div class="input-box">${dInteresado.piso}</div>
        </div>
        <div class="col" style="width: 25%">
          <div class="label">Puerta</div>
          <div class="input-box">${dInteresado.puerta}</div>
        </div>
      </div>

      <div class="row">
        <div class="col" style="width: 15%">
          <div class="label">CP</div>
          <div class="input-box">${dInteresado.cp}</div>
        </div>
        <div class="col" style="width: 42%">
          <div class="label">Provincia</div>
          <div class="input-box is-select" style="background-color: #E6E6E6;">${dInteresado.provincia}</div>
        </div>
         <div class="col" style="width: 43%">
          <div class="label">Municipio</div>
          <div class="input-box is-select">${dInteresado.poblacion}</div>
        </div>
      </div>

      <div class="row">
        <div class="col" style="width: 25%">
          <div class="label">Teléfono</div>
          <div class="input-box">${cleanTlf}</div>
        </div>
        <div class="col" style="width: 75%">
          <div class="label"><span class="req">*</span> Correo electrónico</div>
          <div class="input-box" style="text-transform: lowercase !important;">${cleanEmail}</div>
        </div>
      </div>

      <div style="margin-top: 15px; display: flex; align-items: flex-start;">
         <div class="check-green-box">✓</div>
         <div class="text-green">
           Si el solicitante es persona física, ¿acepta la notificación exclusivamente por medios electrónicos, caso de que no sea obligatoria de acuerdo con la normativa vigente?
         </div>
      </div>

      <div class="header-section">
        <div class="header-letter">F</div>
        <div class="header-title">Idioma de la notificación</div>
      </div>
      <div class="label"><span class="req">*</span> Escoge una opción</div>
      <br>
      <br>
      <div class="row">
        <div class="col" style="width: 35%">
           <div class="input-box is-select">Castellano</div>
        </div>
      </div>

      <div class="header-section">
        <div class="header-letter">G</div>
        <div class="header-title">Declaración responsable</div>
      </div>
      <div class="info-box" style="background-color: #f9f9f9; border: none; padding-left: 0;">
        <div style="display: flex;">
             <div class="check-green-box" style="margin-top: 2px;">✓</div>
             <div class="text-green" style="font-size: 10px; text-align: justify; line-height: 1.4;">
                La persona que firma declara, bajo su responsabilidad, que los datos reseñados en la presente solicitud y en la documentación que se adjunta son exactos y conformes con lo establecido en la legislación, y que se encuentra en posesión de la documentación que así lo acredita, quedando a disposición de la Generalitat para su presentación, comprobación, control e inspección posterior que se estimen oportunos.
             </div>
        </div>
      </div>

      <div class="header-section">
        <div class="header-letter">H</div>
        <div class="header-title">Protección de datos</div>
      </div>
      <div class="info-box" style="color: #444; font-size: 8px;">
        PROTECCIÓN DE DATOS: De conformidad con el Reglamento General de Protección de Datos y la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales, los datos de carácter personal que nos proporcione serán tratados por la Generalitat... (texto legal abreviado para el PDF)
      </div>

       <div class="header-section">
        <div class="header-letter">I</div>
        <div class="header-title">Organismo</div>
      </div>
      <div class="label"><span class="req">*</span></div>
      <div class="info-box" style="font-size: 11px;">
        Conselleria de Industria, Turismo, Innovación y Comercio
      </div>

      <div class="footer-btns">
        <button class="btn btn-cancel">Cancelar ↪</button>
        <button class="btn btn-success">Finaliza ✓</button>
      </div>

    </body>
    </html>
  `;

    // 4. CONFIGURACIÓN Y GENERACIÓN
    const element = document.createElement('div');
    element.innerHTML = content;

    const opt: any = {
      margin: [10, 10],
      filename: `RREGISTRO_VT_PRIMERA_PARTE.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    await html2pdf().set(opt).from(element).save();
  }

  async generarRegistroVT_SEGUNDA_PARTE(datos: any): Promise<void> {
    // --- 1. PREPARACIÓN DE DATOS ---
    const toUpper = (str: any) => (str ? String(str).toUpperCase() : '');
    const formatFecha = (str: string) =>
      str ? str.split('-').reverse().join('/') : '';

    const ingeniero = datos.tecnico_ingeniero_seleccionado || {};
    const cleanTlf = (ingeniero.tlf || '').replace(/[^0-9\s]/g, '').trim();
    const cleanEmail = (ingeniero.correoEmpresa || '')
      .toLowerCase()
      .replace(/[^a-z0-9@._-]/g, '')
      .trim();

    // TITULAR
    const dTitular = {
      nombre: toUpper(datos.titular_nombre),
      apellidos: toUpper(datos.titular_apellidos),
      dni: toUpper(datos.titular_dni_nif),
      tipoVia: toUpper(datos.titular_tipo_via),
      nombreVia: toUpper(datos.titular_nombre_via),
      numero: toUpper(datos.titular_numero),
      piso: toUpper(datos.titular_piso),
      puerta: toUpper(datos.titular_puerta),
      cp: toUpper(datos.titular_codigo_postal),
      poblacion: toUpper(datos.titular_poblacion),
      provincia: toUpper(datos.titular_provincia),
      telefono: cleanTlf,
      email: cleanEmail,
    };

    // J2 - REPRESENTANTE (Inicializamos vacío)
    let dJ2 = {
      dni: '',
      apellido1: '',
      apellido2: '',
      nombre: '',
      tipoVia: '',
      nombreVia: '',
      numero: '',
      piso: '',
      puerta: '',
      cp: '',
      provincia: '',
      poblacion: '',
      telefono: '',
      email: '',
    };

    if (datos.existe_interesado_representante) {
      const apellidosInt = toUpper(datos.interesada_apellidos || '');
      dJ2.dni = toUpper(datos.interesada_dni_nif);
      dJ2.apellido1 = apellidosInt.split(' ')[0] || apellidosInt;
      dJ2.apellido2 = apellidosInt.split(' ').slice(1).join(' ') || '';
      dJ2.nombre = toUpper(datos.interesada_nombre);
      // Hereda dirección titular si no hay específica
      dJ2.tipoVia = toUpper(dTitular.tipoVia);
      dJ2.nombreVia = toUpper(dTitular.nombreVia);
      dJ2.numero = toUpper(dTitular.numero);
      dJ2.piso = toUpper(dTitular.piso);
      dJ2.puerta = toUpper(dTitular.puerta);
      dJ2.cp = toUpper(dTitular.cp);
      dJ2.provincia = toUpper(dTitular.provincia);
      dJ2.poblacion = toUpper(dTitular.poblacion);
      dJ2.telefono = cleanTlf;
      dJ2.email = cleanEmail;
    }

    // VIVIENDA (Apartado M extendido)
    // Construimos la dirección completa para el campo "DIRECCIÓN" del apartado M
    const direccionVivienda = `${toUpper(
      datos.vivienda_tipo_via || ''
    )} ${toUpper(datos.vivienda_nombre_via || '')} ${toUpper(
      datos.vivienda_numero || ''
    )} ${toUpper(datos.vivienda_piso || '')} ${toUpper(
      datos.vivienda_puerta || ''
    )}`.trim();

    const dVivienda = {
      nombreComercial: toUpper(datos.vivienda_nombre_comercial || ''),
      refCatastral: toUpper(datos.vivienda_referencia_catastral),
      cru: '', // CRU SIEMPRE VACÍO
      fechaCompra: formatFecha(datos.vivienda_fecha_ultima_compra),
      icuCodigo: toUpper(datos.vivienda_codigo_seguridad_icu),
      icuFecha: formatFecha(datos.vivienda_fecha_emision_icu),
      direccion:
        direccionVivienda ||
        toUpper(
          dTitular.tipoVia + ' ' + dTitular.nombreVia + ' ' + dTitular.numero
        ),
      cp: datos.vivienda_codigo_postal || dTitular.cp,
      provincia: toUpper(datos.vivienda_provincia || dTitular.provincia),
      localidad: toUpper(datos.vivienda_poblacion || dTitular.poblacion),
      tipoSuelo: toUpper(datos.vivienda_tipo_suelo || 'URBANO'),

      esEstudio: datos.vivienda_es_estudio || false,
      superficie:
        datos.vivienda_superficie_util ||
        datos.vivienda_superficie_construida ||
        '0,00',
      dormitorios: datos.vivienda_cantidad_dormitorios || 0,
      plazas:
        datos.vivienda_numero_plazas_totales ||
        parseInt(datos.vivienda_cantidad_dormitorios || '0') * 2,
    };

    // HELPERS
    const checkHtml = (checked: boolean) =>
      checked
        ? `<div class="check-box-solid">✓</div>`
        : `<div class="check-box-empty"></div>`;

    const radioHtml = (checked: boolean) =>
      checked
        ? `<div class="circle-green"></div>`
        : `<div class="circle-gray"></div>`;

    // --- 2. PLANTILLA HTML ---
    const htmlContent = `
    <html>
    <head>
      <style>
        body { font-family: 'Arial', sans-serif; font-size: 10px; color: #333; margin: 0; padding: 20px; box-sizing: border-box; }
        * { box-sizing: border-box; }

        .row { display: flex; width: 100%; gap: 10px; margin-bottom: 4px; align-items: flex-end; }
        .col { display: flex; flex-direction: column; }
        .mb-2 { margin-bottom: 2px; }
        .mt-10 { margin-top: 10px; }

        /* HEADERS */
        .header-section { display: flex; width: 100%; margin-bottom: 5px; margin-top: 12px; }
        .header-letter {
          background-color: #666; color: white; font-weight: bold; font-size: 14px;
          width: 30px; height: 26px; display: flex; align-items: center; justify-content: center;
        }
        .header-title {
          background-color: #F2F2F2; color: #000; font-weight: bold; font-size: 10px;
          flex-grow: 1; display: flex; align-items: center; padding-left: 10px; text-transform: uppercase;
          height: 26px;
        }

        /* INPUTS */
        .label { font-size: 7px; color: #333; margin-bottom: 1px; text-transform: uppercase; letter-spacing: 0.2px; }
        .req { color: #CC0000; font-weight: bold; margin-right: 2px; }
        .input-box {
          border: 1px solid #BBB; height: 20px; display: flex; align-items: center; padding: 0 4px;
          font-size: 9px; background: #fff; width: 100%; overflow: hidden; white-space: nowrap; color: #000;
        }
        .is-select::after { content: '▼'; color: #CC0000; font-size: 6px; position: absolute; right: 4px; top: 6px; }
        .relative { position: relative; }

        /* INFO & ALERTS */
        .info-blue { border: 1px solid #5BC0DE; padding: 5px 8px; margin: 6px 0; display: flex; align-items: center; gap: 8px; background: #FFF; }
        .info-i { color: #007ACC; font-family: serif; font-weight: bold; font-style: italic; font-size: 20px; }
        .info-text { font-size: 8px; color: #333; text-align: justify; line-height: 1.1; text-transform: uppercase; }

        .info-warning {
          border: 1px solid #F0AD4E; border-left: 5px solid #F0AD4E; padding: 5px; margin: 8px 0;
          display: flex; align-items: center; gap: 10px; background-color: #FFF;
        }
        .warn-triangle { width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 14px solid #F0AD4E; position: relative; }
        .warn-triangle::after { content: '!'; position: absolute; top: 2px; left: -2px; color: white; font-weight: bold; font-size: 9px; }

        /* CHECKS & RADIOS */
        .check-row { display: flex; align-items: flex-start; margin-bottom: 3px; }
        .check-box-solid { min-width: 13px; height: 13px; background-color: #398439; color: white; display: flex; align-items: center; justify-content: center; font-size: 10px; margin-right: 6px; margin-top: 1px; border-radius: 2px; }
        .check-box-empty { min-width: 13px; height: 13px; background-color: #CCC; margin-right: 6px; margin-top: 1px; border-radius: 2px; }
        .check-label { font-size: 8px; color: #398439; line-height: 1.2; }
        .check-label-black { font-size: 8px; color: #333; line-height: 1.2; }

        .radio-container { display: flex; align-items: center; gap: 10px; margin-top: 3px; }
        .radio-option { display: flex; align-items: center; font-size: 8px; font-weight: bold; }
        .circle-green { width: 10px; height: 10px; background-color: #398439; border-radius: 50%; margin-right: 4px; }
        .circle-gray { width: 10px; height: 10px; background-color: #CCC; border-radius: 50%; margin-right: 4px; }

        /* TABLES & LEGAL */
        .table-periods { width: 100%; border-collapse: collapse; margin-top: 5px; }
        .table-periods th { background: #EEE; font-size: 7px; border: 1px solid #CCC; text-align: left; padding: 2px; }
        .table-periods td { border: 1px solid #CCC; height: 50px; }

        .legal-text { font-size: 7px; text-align: justify; color: #444; margin-bottom: 8px; line-height: 1.3; }
        .green-link { color: #398439; text-decoration: none; }

        .firma-section { margin-top: 30px; display: flex; flex-direction: column; align-items: flex-end; }
        .btn { padding: 5px 12px; color: white; font-size: 10px; font-weight: bold; border: none; }
      </style>
    </head>
    <body>

      <div class="header-section"><div class="header-letter">J1</div><div class="header-title">Nombre comercial con el que se publicita el titular gestor (en su caso)</div></div>
      <div class="label">NOMBRE COMERCIAL</div>
      <div class="input-box">${dVivienda.nombreComercial}</div>

      <div class="header-section"><div class="header-letter">J2</div><div class="header-title">Datos del representante de la persona titular (en su caso)</div></div>
      <div class="row">
        <div class="col" style="width: 15%"><div class="label">TIPO DOCUMENTO</div><div class="input-box relative is-select">${
          dJ2.dni ? 'NIF' : 'Selecciona...'
        }</div></div>
        <div class="col" style="width: 15%"><div class="label">DOCUMENTO</div><div class="input-box">${
          dJ2.dni
        }</div></div>
        <div class="col" style="width: 35%"><div class="label">PRIMER APELLIDO O RAZÓN SOCIAL</div><div class="input-box">${
          dJ2.apellido1
        }</div></div>
        <div class="col" style="width: 15%"><div class="label">SEGUNDO APELLIDO</div><div class="input-box">${
          dJ2.apellido2
        }</div></div>
        <div class="col" style="width: 20%"><div class="label">NOMBRE</div><div class="input-box">${
          dJ2.nombre
        }</div></div>
      </div>
      <div class="row">
        <div class="col" style="width: 20%"><div class="label">TIPO VIA</div><div class="input-box relative is-select">${
          dJ2.tipoVia ? dJ2.tipoVia : 'Selecciona...'
        }</div></div>
        <div class="col" style="width: 80%"><div class="label">NOMBRE VIA</div><div class="input-box">${
          dJ2.nombreVia
        }</div></div>
      </div>
      <div class="row">
        <div class="col" style="width: 15%"><div class="label">NUMERO</div><div class="input-box">${
          dJ2.numero
        }</div></div>
        <div class="col" style="width: 10%"><div class="label">LETRA</div><div class="input-box"></div></div>
        <div class="col" style="width: 10%"><div class="label">ESCALERA</div><div class="input-box"></div></div>
        <div class="col" style="width: 10%"><div class="label">PISO</div><div class="input-box">${
          dJ2.piso
        }</div></div>
        <div class="col" style="width: 10%"><div class="label">PUERTA</div><div class="input-box">${
          dJ2.puerta
        }</div></div>
        <div class="col" style="width: 15%"><div class="label">CP</div><div class="input-box">${
          dJ2.cp
        }</div></div>
        <div class="col" style="width: 30%"><div class="label">PROVINCIA</div><div class="input-box relative is-select">${
          dJ2.provincia ? dJ2.provincia : 'Selecciona...'
        }</div></div>
      </div>
      <div class="row">
        <div class="col" style="width: 30%"><div class="label">LOCALIDAD</div><div class="input-box relative is-select">${
          dJ2.poblacion ? dJ2.poblacion : 'Selecciona...'
        }</div></div>
        <div class="col" style="width: 20%"><div class="label">TELÉFONO</div><div class="input-box">${
          dJ2.telefono
        }</div></div>
        <div class="col" style="width: 50%"><div class="label">E-MAIL</div><div class="input-box" style="text-transform: lowercase !important;">${
          dJ2.email
        }</div></div>
      </div>
      <div class="label">PÁGINA WEB</div>
      <div class="input-box"></div>

      <div class="header-section"><div class="header-letter">K</div><div class="header-title">Datos de la persona propietaria de la vivienda</div></div>
      <div class="row">
        <div class="col" style="width: 15%"><div class="label"><span class="req">*</span> TIPO DOCUMENTO</div><div class="input-box relative is-select">NIF</div></div>
        <div class="col" style="width: 15%"><div class="label"><span class="req">*</span> DOCUMENTO</div><div class="input-box">${
          dTitular.dni
        }</div></div>
        <div class="col" style="width: 35%"><div class="label"><span class="req">*</span> PRIMER APELLIDO O RAZÓN SOCIAL</div><div class="input-box">${
          dTitular.apellidos.split(' ')[0]
        }</div></div>
        <div class="col" style="width: 15%"><div class="label">SEGUNDO APELLIDO</div><div class="input-box">${dTitular.apellidos
          .split(' ')
          .slice(1)
          .join(' ')}</div></div>
        <div class="col" style="width: 20%"><div class="label">NOMBRE</div><div class="input-box">${
          dTitular.nombre
        }</div></div>
      </div>
      <div class="row">
        <div class="col" style="width: 20%"><div class="label"><span class="req">*</span> TIPO VIA</div><div class="input-box relative is-select">${
          dTitular.tipoVia
        }</div></div>
        <div class="col" style="width: 80%"><div class="label"><span class="req">*</span> NOMBRE VIA</div><div class="input-box">${
          dTitular.nombreVia
        }</div></div>
      </div>
      <div class="row">
        <div class="col" style="width: 15%"><div class="label"><span class="req">*</span> NUMERO</div><div class="input-box">${
          dTitular.numero
        }</div></div>
        <div class="col" style="width: 10%"><div class="label">LETRA</div><div class="input-box"></div></div>
        <div class="col" style="width: 10%"><div class="label">ESCALERA</div><div class="input-box"></div></div>
        <div class="col" style="width: 10%"><div class="label">PISO</div><div class="input-box">${
          dTitular.piso
        }</div></div>
        <div class="col" style="width: 10%"><div class="label">PUERTA</div><div class="input-box">${
          dTitular.puerta
        }</div></div>
        <div class="col" style="width: 15%"><div class="label"><span class="req">*</span> CP</div><div class="input-box">${
          dTitular.cp
        }</div></div>
        <div class="col" style="width: 30%"><div class="label"><span class="req">*</span> PROVINCIA</div><div class="input-box relative is-select">${
          dTitular.provincia
        }</div></div>
      </div>
      <div class="row">
        <div class="col" style="width: 30%"><div class="label"><span class="req">*</span> LOCALIDAD</div><div class="input-box relative is-select">${
          dTitular.poblacion
        }</div></div>
        <div class="col" style="width: 20%"><div class="label"><span class="req">*</span> TELÉFONO</div><div class="input-box">${cleanTlf}</div></div>
        <div class="col" style="width: 50%"><div class="label"><span class="req">*</span> E-MAIL</div><div class="input-box" style="text-transform: lowercase !important;">${cleanEmail}</div></div>
      </div>
      <div class="label">PÁGINA WEB</div>
      <div class="input-box"></div>

      <div class="header-section"><div class="header-letter">L</div><div class="header-title">Disponibilidad de la vivienda para su comercialización</div></div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
         <div class="check-row" style="margin:0;">
            ${checkHtml(
              true
            )} <span class="check-label">DISPONIBILIDAD INDEFINIDA</span>
         </div>
         <div style="text-align: right;">
            <div class="label">FECHA FIN CONTRATO</div>
            <div class="input-box" style="width: 90px; background-color: #EEE;">dd/mm/aaaa</div>
         </div>
      </div>
      <div class="info-blue">
        <span class="info-i">i</span>
        <span class="info-text">Fecha en que finaliza el contrato de arrendamiento...</span>
      </div>

      <div class="header-section"><div class="header-letter">M</div><div class="header-title">Datos de la vivienda de uso turístico</div></div>
      <div class="info-blue">
        <span class="info-i">i</span>
        <span class="info-text">El CRU es un código compuesto por 14 dígitos del 0 al 9. NO CONFUNDIR CON EL NÚMERO DE REGISTRO...</span>
      </div>
      <div class="row">
        <div class="col" style="width: 35%"><div class="label">REFERENCIA CATASTRAL</div><div class="input-box">${
          dVivienda.refCatastral
        }</div></div>
        <div class="col" style="width: 35%"><div class="label">CÓDIGO REGISTRAL ÚNICO</div><div class="input-box">${
          dVivienda.cru
        }</div></div>
        <div class="col" style="width: 30%"><div class="label"><span class="req">*</span> FECHA DE ÚLTIMA COMPRA DE LA VIVIENDA</div><div class="input-box relative"><span style="position:absolute; right:5px;">📅</span>${
          dVivienda.fechaCompra
        }</div></div>
      </div>
      <div class="row">
        <div class="col" style="width: 25%">
            <div class="label"><span class="req">*</span> ICU EMITIDO POR</div>
            <div class="radio-container">
                <div class="radio-option">${radioHtml(true)} AYUNTAMIENTO</div>
                <div class="radio-option">${radioHtml(false)} ECUV</div>
            </div>
        </div>
        <div class="col" style="width: 50%"><div class="label">CÓDIGO SEGURO DE VERIFICACION DEL ICU</div><div class="input-box">${
          dVivienda.icuCodigo
        }</div></div>
        <div class="col" style="width: 25%"><div class="label"><span class="req">*</span> FECHA DE EMISIÓN DEL ICU</div><div class="input-box relative"><span style="position:absolute; right:5px;">📅</span>${
          dVivienda.icuFecha
        }</div></div>
      </div>
      <div class="label">NOMBRE COMERCIAL</div>
      <div class="input-box mb-2">${dVivienda.nombreComercial}</div>
      <div class="row">
        <div class="col" style="width: 40%"><div class="label"><span class="req">*</span> DIRECCIÓN</div><div class="input-box">${
          dVivienda.direccion
        }</div></div>
        <div class="col" style="width: 10%"><div class="label"><span class="req">*</span> CP</div><div class="input-box">${
          dVivienda.cp
        }</div></div>
        <div class="col" style="width: 25%"><div class="label"><span class="req">*</span> PROVINCIA</div><div class="input-box relative is-select">${
          dVivienda.provincia
        }</div></div>
        <div class="col" style="width: 25%"><div class="label"><span class="req">*</span> LOCALIDAD</div><div class="input-box relative is-select">${
          dVivienda.localidad
        }</div></div>
      </div>
      <div class="row">
        <div class="col" style="width: 20%"><div class="label"><span class="req">*</span> TELÉFONO</div><div class="input-box">${cleanTlf}</div></div>
        <div class="col" style="width: 40%"><div class="label"><span class="req">*</span> CORREO ELECTRÓNICO</div><div class="input-box" style="text-transform: lowercase !important;">${cleanEmail}</div></div>
        <div class="col" style="width: 40%"><div class="label">PÁGINA WEB</div><div class="input-box"></div></div>
      </div>
      <div class="label"><span class="req">*</span> TIPO DE SUELO</div>
      <div class="input-box relative is-select">${dVivienda.tipoSuelo}</div>
<div style="page-break-before: always;"></div>
      <div class="header-section"><div class="header-letter">N</div><div class="header-title">Periodo de funcionamiento</div></div>
      <div style="display: flex; gap: 15px; margin-bottom: 5px;">
         <div class="check-row">${checkHtml(
           true
         )} <span class="check-label">ANUAL</span></div>
         <div class="check-row">${checkHtml(
           false
         )} <span class="check-label-black" style="color:#AAA">VERANO</span></div>
         <div class="check-row">${checkHtml(
           false
         )} <span class="check-label-black" style="color:#AAA">OTROS...</span></div>
      </div>
      <div class="label">OTROS PERIODOS DE FUNCIONAMIENTO (máximo 99 elementos)</div>
      <div style="background-color: #888; color: white; display: inline-block; padding: 2px 6px; font-size: 8px; margin-bottom: 2px;">👁 Consultar</div>
      <table class="table-periods">
        <tr><th style="width: 25%">DESDE DIA</th><th style="width: 25%">DESDE MES</th><th style="width: 25%">HASTA DIA</th><th style="width: 25%">HASTA MES</th></tr>
        <tr><td></td><td></td><td></td><td></td></tr>
      </table>

      <div class="header-section"><div class="header-letter">O</div><div class="header-title">Capacidad de la vivienda</div></div>

      <div style="background-color: #F9F9F9; padding: 10px 5px; display: flex; gap: 40px; margin-bottom: 10px;">
         <div>
            <div class="label"><span class="req">*</span> MODALIDAD RURAL</div>
            <div class="radio-container" style="margin-top: 5px;">
                <div class="radio-option">${radioHtml(false)} SÍ</div>
                <div class="radio-option">${radioHtml(true)} NO</div>
            </div>
         </div>
         <div>
            <div class="label"><span class="req">*</span> SUPERFICIE</div>
            <div class="input-box" style="width: 70px;">${
              dVivienda.superficie
            }</div>
         </div>
         <div>
            <div class="label"><span class="req">*</span> ESTUDIO</div>
            <div class="radio-container" style="margin-top: 5px;">
                <div class="radio-option">${radioHtml(
                  dVivienda.esEstudio
                )} SÍ</div>
                <div class="radio-option">${radioHtml(
                  !dVivienda.esEstudio
                )} NO</div>
            </div>
         </div>
      </div>

      <div class="info-blue">
        <span class="info-i">i</span>
        <span class="info-text">DORMITORIOS INDIVIDUALES (SI NO ES ESTUDIO)</span>
      </div>

      <div class="row">
         <div class="col" style="width: 50%">
            <div class="label"><span class="req">*</span> Nº DORMITORIOS</div>
            <div class="input-box">0</div>
         </div>
         <div class="col" style="width: 50%">
            <div class="label"><span class="req">*</span> Nº PLAZAS</div>
            <div class="input-box" style="background-color: #E6E6E6;">0</div>
         </div>
      </div>

      <div class="info-blue" style="margin-top: 10px;">
        <span class="info-i">i</span>
        <span class="info-text">DORMITORIOS DOBLES (SI NO ES ESTUDIO)</span>
      </div>

      <div class="row">
         <div class="col" style="width: 50%">
            <div class="label"><span class="req">*</span> Nº DORMITORIOS</div>
            <div class="input-box">${dVivienda.dormitorios}</div>
         </div>
         <div class="col" style="width: 50%">
            <div class="label"><span class="req">*</span> Nº PLAZAS</div>
            <div class="input-box" style="background-color: #E6E6E6;">${
              dVivienda.plazas
            }</div>
         </div>
      </div>

      <div class="row" style="margin-top: 15px;">
         <div class="col" style="width: 50%">
            <div class="label"><span class="req">*</span> NÚMERO TOTAL DORMITORIOS</div>
            <div class="input-box" style="background-color: #E6E6E6;">${
              dVivienda.dormitorios
            }</div>
         </div>
         <div class="col" style="width: 50%">
            <div class="label"><span class="req">*</span> NÚMERO PLAZAS TOTALES</div>
            <div class="input-box" style="background-color: #E6E6E6;">${
              dVivienda.plazas
            }</div>
         </div>
      </div>

      <div class="header-section"><div class="header-letter">P</div><div class="header-title">Características de la vivienda</div></div>

      <div class="label" style="font-weight: bold; margin-bottom: 3px;">ACCESOS Y COMUNICACIONES</div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Plano de evacuación del edificio en la puerta de las viviendas o, en su defecto, instrucciones de emergencia en varios idiomas.</span></div>
      <div class="check-row">${checkHtml(
        datos.check_ascensor
      )} <span class="check-label-black">Ascensor</span></div>
      <div class="check-row">${checkHtml(
        !datos.check_ascensor
      )} <span class="check-label">No dispone de ascensor y está en un piso inferior al cuarto (planta baja+4 está exentos de ascensor)</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Entrada de clientes, en el caso de viviendas situados en bajos.</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Teléfono de atención 24 horas.</span></div>

      <div class="label" style="font-weight: bold; margin-top: 8px;">INSTALACIONES Y SERVICIOS</div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Tomas de corriente en todas las habitaciones con indicador de voltaje junto a las tomas de corriente o general situado en lugar bien visible.</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Agua caliente</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Plano de evacuación situado en la puerta de la vivienda</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Listado de teléfonos de urgencia y de interés situado en lugar visible.</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Refrigeración al menos en sala de estar-comedor o sala de estar-comedor-cocina</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Calefacción al menos en sala de estar-comedor o sala de estar-comedor-cocina</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Conexión a internet, salvo que la vivienda se ubique en zona geográfica sin cobertura.</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Botiquín primeros auxilios</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Información detallada del centro médico más próximo.</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Listado de teléfonos de urgencia y de interés.</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Servicio de recepción. No se entregan las llaves a través de cajetines ubicados en la vía pública.</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Servicio de limpieza</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Cambio de lencería</span></div>

      <div class="label" style="font-weight: bold; margin-top: 8px;">DIMENSIONES</div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Dimensiones sujetas a las que establece la normativa correspondiente al uso residencial de las mismas.</span></div>

      <div class="label" style="font-weight: bold; margin-top: 8px;">DOTACIÓN</div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Mobiliario, cubertería, menaje, lencería y demás utensilios y accesorios necesarios para atender las necesidades de los clientes conforme a su capacidad.</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Todos los dormitorios están dotados de armario, dentro o fuera del mismo.</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Conexión a internet, salvo zonas sin cobertura, y televisor.</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Lavadora automática o lavandería común que incluya lavadoras y secadoras a disposición de los clientes en el propio recinto.</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Frigorífico.</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Plancha eléctrica</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Horno / microondas</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Extractor de humos, campana, etc.</span></div>
      <div class="check-row">${checkHtml(
        false
      )} <span class="check-label-black" style="color:#BBB;">Al menos dos fogones eléctricos.</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Tres fogones o más</span></div>

      <div class="header-section"><div class="header-letter">Q</div><div class="header-title">Información de la Administración</div></div>
      <div class="legal-text">
        Se le informa que, de acuerdo con lo estipulado en el 69.4 ley 39/2015 y el art 53.4 ley 15/2018, la inexactitud o falsedad de los datos declarados, la indisponibilidad de la documentación preceptiva o el incumplimiento de los requisitos técnicos generales y específicos requeridos en el Decreto 10/2021, de 22 de enero, sin perjuicio de las responsabilidades a que pudieran dar lugar en el ámbito disciplinario, podrán comportar, previa audiencia al interesado, la baja del establecimiento en el registro y la revocación de la clasificación turística. Las mismas consecuencias comportará no iniciar la actividad en el plazo de dos meses, contados desde el día de la comunicación efectuada. </br></br> Se le recuerda que la vivienda no debe tener prohibida la actividad de vivienda de uso turístico de acuerdo con el título constitutivo o estatutos de la comunidad de propietarios.
      </div>

      <div class="header-section"><div class="header-letter">R</div><div class="header-title">Protección de datos de carácter personal</div></div>
      <div class="legal-text">
        De conformidad con la normativa europea y española en materia de protección de datos de carácter personal, los datos que nos proporcione serán tratados por esta Conselleria, en calidad de responsable y en el ejercicio de las competencias que tiene atribuidas, con la finalidad de gestionar el objeto de la instancia que está presentando, de conformidad con la actividad de tratamiento .”Registro de Turismo de la Comunitat Valenciana” </br></br>Podrá ejercer los derechos de acceso, rectificación, supresión y portabilidad de sus datos personales, limitación y oposición de tratamiento y no ser objeto de decisiones individuales automatizadas respecto a sus datos personales registrados en esta Conselleria a través del trámite telemático o presentando escrito en el registro de entrada de esta Conselleria, según proceda.</br></br>Así mismo, podrá reclamar, en su caso, ante la autoridad de control en materia de protección de datos, especialmente cuando no haya obtenido respuesta o esta no haya sido satisfactoria en el ejercicio de sus derechos.
        <br><br>
        <span class="green-link">Delegación de Protección de Datos de la GVA</span><br>
        <span class="green-link">Agencia Española de Protección de Datos</span><br>
        Más información sobre el tratamiento de los datos en: <span class="green-link">https://www.cindi.gva.es/es/proteccion-datos</span></br>Se le informa que de acuerdo con lo establecido en la disposición adicional octava de la Ley Orgánica 3/2018, de 5 de diciembre, de protección de Datos personales y garantía de derechos digitales y en el artículo 4 de la Ley 40/2015, de 1 de octubre, de Régimen Jurídico del Sector Publico, el órgano gestor podrá verificar aquellos datos manifestados en su solicitud.
      </div>
      <div class="check-row" style="margin-top: 5px; align-items:flex-start;">
         ${checkHtml(true)}
         <span class="check-label" style="line-height:1.2;">
            He leído la información sobre protección de datos, dado que comporta el tratamiento de datos de carácter personal y declaro haber informado a los terceros, cuyos datos de carácter personal se incluyan en la documentación que se presenta, de la comunicación y tratamiento de sus datos por parte de esta Conselleria, así como de haber obtenido de ellos el correspondiente consentimiento para ello.
         </span>
      </div>

      <div class="header-section"><div class="header-letter">S</div><div class="header-title">Declaración responsable específica</div></div>
      <div class="legal-text">
        De acuerdo con el Decreto 10/2021, de 22 de enero, por el que se aprueba el Reglamento regulador del alojamiento turístico en la Comunitat Valenciana, la persona abajo firmante MANIFIESTA BAJO SU RESPONSABILIDAD que todos los datos recogidos en la presente declaración responsable y la documentación adjunta son verídicos y que se encuentra en posesión de la documentación que así lo acredita, y queda a disposición de la Generalitat para la comprobación que se estime oportuna.
      </div>

      <div class="info-warning">
        <div class="warn-triangle"></div>
        <div class="label" style="font-size:8px;">OBLIGATORIO EN TODO CASO:</div>
      </div>

      <div class="check-row mt-10">${checkHtml(
        true
      )} <span class="check-label">Que ostenta la disponibilidad de la vivienda para su dedicación al uso turístico y la documentación que lo acredita según el caso (escritura de propiedad del inmueble, contrato de arrendamiento, autorización para la gestión entre persona propietaria y empresa, u otro título válido a estos efectos).</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Que la vivienda dispone de los requisitos exigidos por la normativa para su inscripción en el Registro con la capacidad comunicada, y que tales requisitos se mantendrán durante la vigencia de la actividad.</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Que dispone del informe municipal de compatibilidad urbanística para uso turístico favorable, o documento equivalente previsto en este reglamento.</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Que la referencia catastral consignada es única e individualizada y responde a la realidad física, económica y jurídica actual del inmueble o que, en su defecto, se hace constar el código registral único del inmueble de forma provisional hasta la obtención, en menos de un año, de la referencia catastral única e individualizada correspondiente.</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Que dispone de un seguro de responsabilidad civil u otra garantía equivalente para cubrir los daños y perjuicios que puedan provocarse en el desarrollo de la actividad en los términos previstos en el artículo 26 de este decreto.</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Que la vivienda cuenta con las licencias, certificados o autorizaciones exigidas por otros departamentos o administraciones públicas, especialmente urbanísticas, ambientales, de propiedad horizontal, sanitarias y de apertura, en el caso de resultar exigibles, y que cumple con toda la normativa sectorial aplicable.</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Que la vivienda se comercializará turísticamente únicamente en los periodos indicados.</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Que cumple con las disposiciones legales relativas a las obligaciones fiscales, tributarias, de seguridad social y, en caso de tener personas empleadas a cargo, que se rigen por el convenio colectivo que resulta de aplicación, correspondientes a esta actividad económica.</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Que dispone de certificación registral que acredita que ni el título constitutivo o los estatutos de la comunidad de propietarios, o algún acuerdo de ésta, oponible a terceros, determinan la imposibilidad de uso para finalidades diferentes a las de vivienda como residencia habitual, o que dispone de certificado expedido por la administración de la comunidad de propietarios en el mismo sentido.</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Que se cumple con las obligaciones del Real Decreto 933/2021, de 26 de octubre por el que se establecen las obligaciones de registro documental e información de las personas físicas o jurídicas que ejercen actividades de hospedaje y alquiler de vehículos a motor o norma que lo sustituya.</span></div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Que dispone del certificado energético del inmueble.</span></div>

      <div class="info-warning mt-10">
        <div class="warn-triangle"></div>
        <div class="label" style="font-size:8px;">Las dos siguientes casillas son incompatibles entre sí y una de ellas es obligatoria:</div>
      </div>

      <div class="info-blue">
        <span class="info-i">i</span>
        <span class="info-text">Solo obligatorio en el caso de las viviendas que se implanten en edificaciones cuyo uso principal sea residencial vivienda (no aplicable a viviendas ubicadas en locales de uso terciario):</span>
      </div>
      <div class="check-row">${checkHtml(
        true
      )} <span class="check-label">Que dispone de licencia de primera o segunda ocupación de la vivienda o del título habilitante equivalente previsto en el Decreto 12/2021, de 22 de enero, del Consell de regulación de la declaración responsable para la primera ocupación y sucesivas de viviendas, así como, en su caso, el título habilitante municipal exigible para su destino al uso de alojamiento turístico, cuando de conformidad con el planeamiento municipal el uso vivienda turística sea residencial. Excepcionalmente, en casos de imposibilidad acreditada, se admitirá informe municipal equivalente.</span></div>

      <div class="info-blue">
        <span class="info-i">i</span>
        <span class="info-text">Solo obligatorio para viviendas turísticas que se implanten en locales de uso terciario:</span>
      </div>
      <div class="check-row">${checkHtml(
        false
      )} <span class="check-label-black" style="color:#888;">Que en la vivienda turística se cumplen las condiciones de diseño, calidad, accesibilidad y seguridad establecidas en el 49.2, 3 y 4 del Decreto 10/2021 de alojamiento de la CV, y que dispone de las licencias, autorizaciones, títulos habilitantes o cualesquiera otros instrumentos de intervención urbanística, ambiental o de apertura municipales preceptivos para su destino al uso turístico, cuando de conformidad con el planeamiento municipal el uso vivienda turística sea considerado terciario.</span></div>

      <div class="info-blue">
        <span class="info-i">i</span>
        <span class="info-text">Marcar en el caso de viviendas turísticas que se implanten en locales de uso terciario existentes y que se acojan a los criterios de flexibilidad establecidos en el decreto 10/2021 de alojamiento de la CV respecto de la normativa de calidad y diseño:</span>
      </div>
      <div class="check-row">${checkHtml(
        false
      )} <span class="check-label-black" style="color:#888;">En el caso de viviendas de uso turístico que se implanten en locales de uso terciario de edificaciones existentes, que se dispone de la memoria técnica descriptiva recogida en el artículo 49.3 del decreto 10/2021 de alojamiento de la CV.</span></div>

      <div class="info-warning mt-10">
        <div class="warn-triangle"></div>
        <div class="label" style="font-size:8px;">Las casillas siguientes, marcar si aplica</div>
      </div>
<div style="page-break-before: always;"></div>
      <div class="info-blue">
        <span class="info-i">i</span>
        <span class="info-text">SOLO MARCAR EN LOS CASOS DE SOLICITAR LA ESPECIALIDAD RURAL Y CONTAR CON EL CERTIFICADO ACREDITATIVO Y RESTO REQUISITOS DEL ARTÍCULO 68 DEL DECRETO 10/21. RESULTA OBLIGATORIO ADJUNTAR EL CORRESPONDIENTE CERTIFICADO ACREDITATIVO EN EL PASO 3 DOCUMENTAR.</span>
      </div>
      <div class="check-row">${checkHtml(
        false
      )} <span class="check-label-black" style="color:#888;">En el caso de ostentar la especialidad rural, que cumple con las prescripciones previstas en el artículo 68 del Decreto 10/2021, de 22 de enero, del Consell, por el que se regula el alojamiento turístico en la Comunidad Valenciana.</span></div>

      <div class="info-blue">
        <span class="info-i">i</span>
        <span class="info-text">SOLO MARCAR EN CASOS DE VIVIENDAS DE USO TURÍSTICO UBICADAS EN SUELO NO URBANIZABLE</span>
      </div>
      <div class="check-row">${checkHtml(
        false
      )} <span class="check-label-black" style="color:#888;">Si el establecimiento está ubicado en suelo no urbanizable común, que se ha obtenido la declaración de interés comunitario que atribuye el correspondiente uso y aprovechamiento turístico o, en su caso, que se ha tramitado su exención conforme a la legislación urbanística vigente.</span></div>

      <div class="firma-section">
        <div style="display: flex; gap: 5px; margin-top: 30px;">
            <button class="btn" style="background-color: #333;">Cancelar ↩</button>
            <button class="btn" style="background-color: #398439;">Finaliza ✓</button>
        </div>
      </div>

    </body>
    </html>
  `;

    // 3. CONFIGURACIÓN Y GENERACIÓN
    const element = document.createElement('div');
    element.innerHTML = htmlContent;

    const opt: any = {
      margin: [10, 10],
      filename: `REGISTRO_VT_SEGUNDA_PARTE_${dTitular.nombre.replace(
        /[^a-zA-Z0-9]/g,
        '_'
      )}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    await html2pdf().set(opt).from(element).save();
  }

  async generarGuiaPresentacionNRA(datos: any): Promise<void> {
    // 1. CARGA DINÁMICA DE LA LIBRERÍA
    const html2pdf = (await import('html2pdf.js')).default;

    // 2. PREPARACIÓN DE DATOS
    const toUpper = (str: any) => (str ? String(str).toUpperCase() : '');
    const ingeniero = datos.tecnico_ingeniero_seleccionado || {};

    // DATOS DE CONTACTO (INGENIERO)
    const contactTlf = (ingeniero.tlf || '').replace(/[^0-9\s]/g, '').trim();
    const contactEmail = (ingeniero.correoEmpresa || '').toLowerCase().trim();
    const lugarFirma = toUpper(ingeniero.poblacion || 'Valencia');
    const nombreIngeniero = toUpper(
      ingeniero.nombre || 'LUIS SERRANO ARTESERO'
    ); // Fallback visual
    const dniIngeniero = toUpper(ingeniero.dni || '20037410V'); // Fallback visual

    // DATOS TITULAR (PROPIETARIO)
    const dTitular = {
      nombre: toUpper(datos.titular_nombre),
      apellidos: toUpper(datos.titular_apellidos),
      dni: toUpper(datos.titular_dni_nif),
      esEmpresa: datos.titular_dni_nif && datos.titular_dni_nif.length > 9,
    };

    // DATOS VIVIENDA
    const dVivienda = {
      direccion: toUpper(
        datos.vivienda_direccion_completa ||
          `${datos.vivienda_tipo_via} ${datos.vivienda_nombre_via} ${datos.vivienda_numero}`
      ),
      cp: datos.vivienda_codigo_postal || '',
      provincia: toUpper(datos.vivienda_provincia || ''),
      municipio: toUpper(datos.vivienda_poblacion || ''),
      refCatastral: toUpper(datos.vivienda_referencia_catastral || ''),
      cru: toUpper(datos.vivienda_cru || ''),
      latitud: datos.vivienda_coordenada_latitud || '',
      longitud: datos.vivienda_coordenada_longitud || '',
      esTuristico:
        datos.vivienda_es_turistica === true ||
        datos.vivienda_es_turistica === 'SI',
      licencia: toUpper(datos.vivienda_numero_vt || ''),
      plazas: datos.vivienda_numero_plazas_totales || '4',
    };

    // Registro de Destino
    const registroDestino = toUpper(
      datos.vivienda_nombre_registro_propiedad ||
        `REGISTRO DE LA PROPIEDAD DE ${dVivienda.municipio}`
    );

    // NUEVO DATO: Referencia del documento dinámica
    const tipoTexto = dVivienda.esTuristico ? 'TURÍSTICO' : 'NO TURÍSTICO';
    const refDocumento = `NRA ${tipoTexto} - ${dVivienda.direccion} - ${dTitular.nombre} ${dTitular.apellidos}`;

    // Helpers visuales
    const radioOn = `<span style="color:#D32F2F; font-size:14px; font-weight:bold;">◉</span>`;
    const radioOff = `<span style="color:#CCC; font-size:14px;">◎</span>`;
    const checkOff = `<span style="border:1px solid #CCC; width:12px; height:12px; display:inline-block;"></span>`;

    // 3. PLANTILLA HTML
    // Ayer cuando arranqué la moto me hizo un ruido muy raro de como si una pieza hubiese necajado a la fuerza ya que hico un ruido a metal y seco, que puede haber sido?
    const htmlContent = `
    <!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        @page { margin: 0; size: A4; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #333; margin: 0; padding: 25px; background-color: #FFF; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        * { box-sizing: border-box; }

        /* HEADER & NAV */
        .reg_form_header_main { background-color: #A30014; color: white; padding: 12px 30px; display: flex; justify-content: space-between; align-items: center; border-radius: 4px 4px 0 0; }
        .reg_form_header_logo { font-size: 18px; font-weight: bold; }
        .reg_form_user_badge { background: #800000; padding: 5px 10px; border-radius: 4px; font-size: 10px; color: white; }
        .reg_form_menu_nav { background: #F5F5F5; padding: 10px 30px; border-bottom: 1px solid #DDD; font-weight: bold; font-size: 11px; color: #555; display: flex; gap: 20px; margin-bottom: 20px; }

        /* STEPS 1-4 CARDS */
        .reg_form_step_card { border: 1px solid #CCC; background: #FAFAFA; padding: 15px; margin-bottom: 15px; border-radius: 4px; page-break-inside: avoid; }
        .reg_form_step_title { color: #A30014; font-weight: bold; font-size: 12px; margin-bottom: 10px; display: flex; align-items: center; gap: 10px; }
        .reg_form_step_circle { border: 2px solid #A30014; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; color: #A30014; background: #FFF; }

        .reg_form_selector_box { display: flex; gap: 10px; }
        .reg_form_selector_item { border: 1px solid #CCC; background: white; padding: 8px 10px; font-weight: bold; font-size: 10px; color: #555; flex: 1; text-align: center; display: flex; align-items: center; justify-content: center; }
        .reg_form_selector_active { border: 2px solid #333; color: #000; }

        .reg_form_dropdown_box { border: 1px solid #999; background: white; padding: 8px 10px; width: 100%; display: flex; justify-content: space-between; align-items: center; font-size: 11px; }
        .reg_form_dropdown_red { border-color: #A30014; color: #A30014; background: #FFF5F5; font-weight: bold; }
        .reg_form_btn_download { border: 1px solid #A30014; color: #A30014; background: white; padding: 6px 12px; font-weight: bold; font-size: 10px; display: inline-block; margin-top: 10px; border-radius: 3px; }

        /* VISUAL ARROWS & TITLES */
        .reg_form_arrow_icon { text-align: center; font-size: 20px; color: #A30014; margin: 10px 0; }
        .reg_form_arrow_text { text-align: center; font-size: 14px; font-weight: bold; color: #555; margin: 25px 0; border-top: 1px solid #EEE; padding-top: 20px; }

        .reg_form_web_title { font-size: 20px; font-weight: bold; color: #222; margin-top: 20px; margin-bottom: 5px; page-break-after: avoid; }
        .reg_form_section_header { font-size: 14px; font-weight: bold; color: #222; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #DDD; padding-bottom: 5px; page-break-after: avoid; }

        /* FORM INPUT STRUCTURE */
        .reg_form_group_container { border: 1px solid #DDD; padding: 15px; background-color: #FDFDFD; border-radius: 4px; margin-bottom: 15px; page-break-inside: avoid; }
        .reg_form_row_wrapper { display: flex; gap: 15px; margin-bottom: 10px; align-items: flex-end; }
        .reg_form_col_container { flex: 1; display: flex; flex-direction: column; min-width: 0; }

        .reg_form_label_text { font-size: 9px; font-weight: bold; color: #444; margin-bottom: 4px; text-transform: uppercase; }
        .reg_form_input_field { border: 1px solid #CCC; background: #FFF; height: 26px; display: flex; align-items: center; padding: 0 8px; font-size: 11px; border-radius: 2px; overflow: hidden; white-space: nowrap; }
        .reg_form_input_gray { background: #F0F0F0; color: #666; }
        .reg_form_input_tall { height: 50px; align-items: flex-start; padding-top: 5px; }

        .reg_form_radio_group { display: flex; gap: 15px; align-items: center; margin-bottom: 5px; min-height: 20px; }
        .reg_form_radio_item { display: flex; align-items: center; gap: 5px; font-size: 11px; }

        /* MAP & UNITS */
        .reg_form_map_placeholder { width: 100%; height: 100px; background: #E1F5FE; border: 1px solid #81D4FA; display: flex; align-items: center; justify-content: center; color: #0277BD; font-weight: bold; margin-bottom: 10px; font-size: 10px; }

        .reg_form_units_header { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 10px; font-weight: bold; }
        .reg_form_units_col { flex: 1; padding-right: 5px; }
        .reg_form_units_question { margin-top: 15px; font-size: 10px; font-weight: bold; color: #222; margin-bottom: 5px; }
        .reg_form_units_desc { font-size: 10px; color: #555; text-align: justify; line-height: 1.3; margin-bottom: 10px; }

        .reg_form_block_nontourist { border: 2px dashed #4CAF50; padding: 10px; margin-top: 15px; background: #F1F8E9; page-break-inside: avoid; }
        .reg_form_block_tourist { border: 2px dashed #E91E63; padding: 10px; margin-top: 15px; background: #FFF0F5; page-break-inside: avoid; }
        .reg_form_block_title { font-weight: bold; font-size: 11px; margin-bottom: 10px; text-transform: uppercase; }

        /* STEP 5 & 6 & 7 SPECIFICS */
        .reg_form_doc_section { margin-top: 20px; border-top: 1px dashed #CCC; padding-top: 15px; page-break-inside: avoid; }
        .reg_form_step_badge { color: #A30014; font-weight: bold; font-size: 14px; border: 2px solid #A30014; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px; background: #FFF; }
        .reg_form_section_title_lg { font-size: 14px; font-weight: bold; color: #333; display: flex; align-items: center; margin-bottom: 15px; }

        .reg_form_checklist_wrapper { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
        .reg_form_check_item { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #444; }

        .reg_form_bienes_box { background: #FAFAFA; border: 1px solid #EEE; padding: 15px; margin-top: 15px; }

        .reg_form_upload_container { margin-top: 20px; padding: 15px; border: 1px solid #DDD; background: #FFF; box-shadow: 0 1px 3px rgba(0,0,0,0.1); page-break-inside: avoid; }
        .reg_form_warning_yellow { background-color: #FFF3CD; color: #856404; padding: 10px; border-left: 4px solid #FFC107; font-size: 10px; margin-bottom: 10px; }
        .reg_form_warning_red { background-color: #F8D7DA; color: #721C24; padding: 10px; border-left: 4px solid #D32F2F; font-size: 10px; margin-bottom: 15px; }
        .reg_form_dropzone { border: 1px dashed #999; padding: 25px; text-align: center; border-radius: 4px; background: #FAFAFA; color: #777; font-size: 11px; cursor: pointer; margin-bottom: 5px; }

        .reg_form_presenter_box { margin-top: 20px; padding: 15px; border: 1px solid #DDD; background: #FFF; page-break-inside: avoid; }

        .reg_form_footer_actions { margin-top: 30px; border-top: 2px solid #000; padding-top: 20px; display: flex; justify-content: space-between; align-items: center; page-break-inside: avoid; }
        .reg_form_footer_legal { margin-top: 20px; padding: 15px; background-color: #E3F2FD; border: 1px solid #2196F3; text-align: center; color: #0D47A1; font-weight: bold; font-size: 11px; page-break-inside: avoid; }

        /* UTILS */
        .reg_form_pink_dot { color: #E91E63; font-size: 14px; font-weight: bold; margin-right: 3px; }
        .reg_form_grey_circle { border: 1px solid #999; border-radius: 50%; width: 10px; height: 10px; display: inline-block; margin-right: 3px; background: #FFF; }
        .reg_form_help_icon { color: #008CBA; font-size: 10px; margin-left: 4px; cursor: help; font-weight: bold; }

    </style>
</head>
<body>

    <div class="reg_form_header_main">
        <div class="reg_form_header_logo">R Registradores DE ESPAÑA</div>
        <div class="reg_form_user_badge">Usuario: ${dTitular.nombre}</div>
    </div>

    <div class="reg_form_menu_nav">
        <span>Propiedad</span> <span>Mercantil</span> <span>Bienes Muebles</span> <span>La Sede</span>
    </div>

    <div class="reg_form_step_card">
        <div class="reg_form_step_title"><div class="reg_form_step_circle">1</div> ¿En qué registro desea hacer la presentación?</div>
        <div class="reg_form_selector_box">
            <div class="reg_form_selector_item reg_form_selector_active">Registro de la Propiedad</div>
            <div class="reg_form_selector_item">Registro Mercantil</div>
            <div class="reg_form_selector_item">Registro de Bienes Muebles</div>
        </div>
    </div>

    <div class="reg_form_arrow_icon">⬇</div>

    <div class="reg_form_step_card">
        <div class="reg_form_step_title"><div class="reg_form_step_circle">2</div> ¿Qué desea hacer?</div>
        <div class="reg_form_selector_box">
            <div class="reg_form_selector_item reg_form_selector_active">Nueva presentación</div>
            <div class="reg_form_selector_item">Subsanar una presentación</div>
            <div class="reg_form_selector_item">Complementar</div>
        </div>
    </div>

    <div class="reg_form_step_card">
        <div class="reg_form_step_title"><div class="reg_form_step_circle">3</div> ¿Qué quiere presentar?</div>
        <div class="reg_form_label_text" style="margin-top:5px;">Naturaleza del documento</div>
        <div class="reg_form_dropdown_box">DOCUMENTO PRIVADO ▼</div>
        <div class="reg_form_label_text" style="margin-top:10px;">Tipo de operación</div>
        <div class="reg_form_dropdown_box reg_form_dropdown_red">
            ASIGNACIÓN DE NÚMERO DE REGISTRO DE ALQUILER PARA ALQUILERES DE CORTA DURACIÓN... ▼
        </div>
        <div class="reg_form_btn_download">⬇ Descargar instancia de presentación</div>
    </div>

    <div class="reg_form_step_card">
        <div class="reg_form_step_title"><div class="reg_form_step_circle">4</div> Elija el registro de destino</div>
        <div class="reg_form_dropdown_box" style="font-weight:bold;">${registroDestino} ▼</div>
    </div>

    <div class="reg_form_arrow_text">⬇ CONTINUAR AL FORMULARIO WEB ⬇</div>

    <div class="reg_form_web_title">Asignación de Número de Registro de Alquiler de Corta Duración</div>

    <div class="reg_form_section_header">Registro destino</div>
    <div class="reg_form_group_container">
        <div class="reg_form_row_wrapper">
            <div class="reg_form_col_container" style="flex:3">
                <div class="reg_form_label_text">NOMBRE (*)</div>
                <div class="reg_form_input_field reg_form_input_gray">${registroDestino}</div>
            </div>
            <div class="reg_form_col_container" style="flex:1">
                <div class="reg_form_label_text">CÓDIGO (*)</div>
                <div class="reg_form_input_field reg_form_input_gray">AUTO</div>
            </div>
        </div>
        <div class="reg_form_row_wrapper">
            <div class="reg_form_col_container">
                <div class="reg_form_label_text">DIRECCIÓN</div>
                <div class="reg_form_input_field reg_form_input_gray"></div>
            </div>
        </div>
    </div>

    <div class="reg_form_section_header">Interesado</div>
    <div class="reg_form_group_container">
        <div class="reg_form_label_text">Identificación (*)</div>
        <div class="reg_form_radio_group">
            <div class="reg_form_radio_item">${
              !dTitular.esEmpresa ? radioOn : radioOff
            } PERSONA FÍSICA</div>
            <div class="reg_form_radio_item">${
              dTitular.esEmpresa ? radioOn : radioOff
            } PERSONA JURÍDICA</div>
        </div>

        <div class="reg_form_row_wrapper">
            <div class="reg_form_col_container">
                <div class="reg_form_label_text">NOMBRE (*)</div>
                <div class="reg_form_input_field">${dTitular.nombre}</div>
            </div>
            <div class="reg_form_col_container">
                <div class="reg_form_label_text">APELLIDOS (*)</div>
                <div class="reg_form_input_field">${dTitular.apellidos}</div>
            </div>
        </div>
        <div class="reg_form_row_wrapper">
            <div class="reg_form_col_container">
                <div class="reg_form_label_text">IDENTIFICADOR (*)</div>
                <div class="reg_form_radio_group" style="font-size:10px; margin-bottom:2px;">
                    <span>${radioOn} NIF</span> <span>${radioOff} NIE</span> <span>${radioOff} PASAPORTE</span>
                </div>
                <div class="reg_form_input_field">${dTitular.dni}</div>
            </div>
        </div>

        <div class="reg_form_label_text" style="margin-top:15px; border-top:1px dashed #CCC; padding-top:10px;">Datos de contacto</div>
        <div style="font-size:10px; color:#D32F2F; margin-bottom:5px;">(Para notificaciones: Datos del Ingeniero / Ubicación de la vivienda)</div>

        <div class="reg_form_row_wrapper">
            <div class="reg_form_col_container" style="flex:0.5">
                <div class="reg_form_label_text">PAÍS (*)</div>
                <div class="reg_form_input_field">España</div>
            </div>
            <div class="reg_form_col_container" style="flex:2">
                <div class="reg_form_label_text">DIRECCIÓN (*)</div>
                <div class="reg_form_input_field">${dVivienda.direccion}</div>
            </div>
        </div>
        <div class="reg_form_row_wrapper">
            <div class="reg_form_col_container">
                <div class="reg_form_label_text">CÓDIGO POSTAL (*)</div>
                <div class="reg_form_input_field">${dVivienda.cp}</div>
            </div>
            <div class="reg_form_col_container">
                <div class="reg_form_label_text">PROVINCIA (*)</div>
                <div class="reg_form_input_field">${dVivienda.provincia}</div>
            </div>
            <div class="reg_form_col_container">
                <div class="reg_form_label_text">MUNICIPIO (*)</div>
                <div class="reg_form_input_field">${dVivienda.municipio}</div>
            </div>
        </div>
        <div class="reg_form_row_wrapper">
            <div class="reg_form_col_container">
                <div class="reg_form_label_text">CORREO ELECTRÓNICO (INGENIERO) (*)</div>
                <div class="reg_form_input_field">${contactEmail}</div>
            </div>
        </div>
        <div class="reg_form_row_wrapper">
            <div class="reg_form_col_container">
                <div class="reg_form_label_text">TELÉFONO DE CONTACTO EN ESPAÑA (INGENIERO) (*)</div>
                <div class="reg_form_input_field">${contactTlf}</div>
            </div>
        </div>
    </div>

    <div class="reg_form_section_header">Finca registral</div>
    <div class="reg_form_group_container">
        <div class="reg_form_row_wrapper">
            <div class="reg_form_col_container">
                <div class="reg_form_label_text">CRU (CÓDIGO REGISTRAL ÚNICO) (*)</div>
                <div class="reg_form_input_field">${dVivienda.cru}</div>
            </div>
        </div>
    </div>

    <div class="reg_form_section_header">Descripción y coordenadas geográficas de la dirección</div>
    <div class="reg_form_group_container">
        <div class="reg_form_map_placeholder">
            📍 [MAPA] Lat: ${dVivienda.latitud} | Lon: ${dVivienda.longitud}
        </div>
        <div class="reg_form_row_wrapper">
            <div class="reg_form_col_container" style="flex:3">
                <div class="reg_form_label_text">TIPO Y NOMBRE DE VÍA (*)</div>
                <div class="reg_form_input_field">${dVivienda.direccion}</div>
            </div>
            <div class="reg_form_col_container" style="flex:1">
                <div class="reg_form_label_text">NÚMERO</div>
                <div class="reg_form_input_field"></div>
            </div>
        </div>
    </div>

    <div class="reg_form_section_header">Información que permita su identificación</div>
    <div class="reg_form_group_container">
        <div class="reg_form_row_wrapper">
            <div class="reg_form_col_container">
                <div class="reg_form_label_text">REFERENCIA CATASTRAL (*)</div>
                <div class="reg_form_input_field">${
                  dVivienda.refCatastral
                }</div>
            </div>
        </div>
    </div>

    <div class="reg_form_section_header" style="color:#A30014;">Unidades arrendadas para la misma finca</div>
    <div class="reg_form_group_container">
        <div class="reg_form_units_header">
            <div class="reg_form_units_col">
                <div class="reg_form_label_text">TIPO DE UNIDAD (*)</div>
                <div class="reg_form_radio_group">
                    <div class="reg_form_radio_item"><span class="reg_form_pink_dot">●</span> FINCA COMPLETA</div>
                    <div class="reg_form_radio_item"><span class="reg_form_grey_circle"></span> HABITACIÓN FINCA</div>
                </div>
            </div>
            <div class="reg_form_units_col">
                <div class="reg_form_label_text">CATEGORÍA DEL ARRENDAMIENTO (*)</div>
                <div class="reg_form_radio_group">
                    <div class="reg_form_radio_item">
                        <span class="${
                          !dVivienda.esTuristico
                            ? 'reg_form_pink_dot'
                            : 'reg_form_grey_circle'
                        }">
                            ${!dVivienda.esTuristico ? '●' : ''}
                        </span> NO TURÍSTICO
                    </div>
                    <div class="reg_form_radio_item">
                        <span class="${
                          dVivienda.esTuristico
                            ? 'reg_form_pink_dot'
                            : 'reg_form_grey_circle'
                        }">
                            ${dVivienda.esTuristico ? '●' : ''}
                        </span> TURÍSTICO
                    </div>
                </div>
            </div>
            <div class="reg_form_units_col">
                <div class="reg_form_label_text">TIPO DE RESIDENCIA DEL ARRENDADOR (*)</div>
                <div class="reg_form_radio_group">
                    <div class="reg_form_radio_item"><span class="reg_form_grey_circle"></span> PRINCIPAL</div>
                    <div class="reg_form_radio_item"><span class="reg_form_pink_dot">●</span> SECUNDARIA</div>
                    <div class="reg_form_radio_item"><span class="reg_form_grey_circle"></span> OTROS</div>
                </div>
            </div>
        </div>

        <div class="reg_form_label_text">NÚMERO MÁXIMO DE ARRENDATARIOS (*)</div>
        <div class="reg_form_input_field" style="width: 60px; margin-bottom: 15px;">${
          dVivienda.plazas
        }</div>

        <div class="reg_form_units_question">¿La Unidad cuenta con equipamiento, mobiliario y enseres adecuados para atender el uso de la unidad de carácter temporal de acuerdo con el Reglamento (UE) 2024/1028...? (*)</div>
        <div class="reg_form_radio_group" style="margin-bottom: 20px;">
            <div class="reg_form_radio_item"><span class="reg_form_pink_dot">●</span> SI</div>
            <div class="reg_form_radio_item"><span class="reg_form_grey_circle"></span> NO</div>
        </div>

        <div style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #222;">Documentación acreditativa de autorización o inscripción previa</div>
        <div class="reg_form_units_desc">Si la unidad es turística y está sujeta a un régimen de autorización o inscripción previa administrativa, debe adjuntar el documento...</div>

        <div class="reg_form_block_nontourist">
            <div class="reg_form_block_title" style="color: #2E7D32;">OPCIÓN 1: CASO NO TURÍSTICO</div>
            <div class="reg_form_units_question">¿La unidad es turística y está sujeta a un régimen de autorización...? (*)</div>
            <div class="reg_form_radio_group" style="margin-bottom: 15px;">
                <div class="reg_form_radio_item"><span class="reg_form_grey_circle"></span> SI</div>
                <div class="reg_form_radio_item"><span class="reg_form_pink_dot">●</span> NO</div>
            </div>
            <div class="reg_form_units_question">¿Aporta otro tipo de documentación? (*)</div>
            <div class="reg_form_radio_group">
                <div class="reg_form_radio_item"><span class="reg_form_grey_circle"></span> SI</div>
                <div class="reg_form_radio_item"><span class="reg_form_pink_dot">●</span> NO</div>
            </div>
        </div>

        <div class="reg_form_block_tourist">
            <div class="reg_form_block_title" style="color: #E91E63;">OPCIÓN 2: CASO TURÍSTICO</div>
            <div class="reg_form_units_question">¿La unidad es turística y está sujeta a un régimen de autorización...? (*)</div>
            <div class="reg_form_radio_group" style="margin-bottom: 15px;">
                <div class="reg_form_radio_item"><span class="reg_form_pink_dot">●</span> SI</div>
                <div class="reg_form_radio_item"><span class="reg_form_grey_circle"></span> NO</div>
            </div>
            <div class="reg_form_units_question">¿Aporta la documentación que acredite autorización...? (*)</div>
            <div class="reg_form_radio_group" style="margin-bottom: 15px;">
                <div class="reg_form_radio_item"><span class="reg_form_grey_circle"></span> SI</div>
                <div class="reg_form_radio_item"><span class="reg_form_pink_dot">●</span> NO</div>
            </div>
            <div class="reg_form_label_text">Número de licencia CCAA (*)</div>
            <div class="reg_form_input_field" style="width: 100%; margin-bottom: 15px;">${
              dVivienda.licencia
            }</div>

            <div class="reg_form_units_question">¿Aporta otro tipo de documentación? (*)</div>
            <div class="reg_form_radio_group">
                <div class="reg_form_radio_item"><span class="reg_form_grey_circle"></span> SI</div>
                <div class="reg_form_radio_item"><span class="reg_form_pink_dot">●</span> NO</div>
            </div>
        </div>

        <div style="margin-top: 20px;">
            <span style="border: 1px solid #CCC; padding: 5px 10px; font-size: 10px; color: #555;">Añadir</span>
        </div>

        <div class="reg_form_section_header">Lugar, fecha y firma</div>
        <div class="reg_form_row_wrapper">
            <div class="reg_form_col_container">
                <div class="reg_form_label_text">LUGAR (*)</div>
                <div class="reg_form_input_field">${lugarFirma}</div>
            </div>
            <div class="reg_form_col_container">
                <div class="reg_form_label_text">FECHA (*)</div>
                <div class="reg_form_input_field">DD/MM/AAAA</div>
            </div>
        </div>
        <div class="reg_form_row_wrapper" style="margin-top:10px;">
            <div class="reg_form_col_container">
                <div class="reg_form_label_text">FIRMA INTERESADO</div>
                <div class="reg_form_input_field reg_form_input_tall"></div>
            </div>
        </div>
    </div>

    <div class="reg_form_warning_yellow" style="text-align:center; color:#F57F17; background:#FFF8E1; border:1px solid #FFECB3; margin-top:20px;">
        ⚠️ IMPORTANTE: ESTE DOCUMENTO ES UNA GUÍA. AL FINALIZAR EL TRÁMITE ONLINE, DEBE FIRMARSE CON EL CERTIFICADO DIGITAL DEL CLIENTE.
    </div>

    <div class="reg_form_doc_section">
        <div class="reg_form_section_title_lg">
            <span class="reg_form_step_badge">5</span> Datos del documento
        </div>

        <div class="reg_form_row_wrapper">
            <div class="reg_form_col_container" style="flex:1">
                <div class="reg_form_label_text">Fecha del documento</div>
                <div class="reg_form_input_field">DD/MM/AAAA</div>
            </div>
            <div class="reg_form_col_container" style="flex:2">
                <div class="reg_form_label_text">Referencia del documento <span style="font-weight:normal; color:#888;">(Máximo 40 caracteres)</span></div>
                <div class="reg_form_input_field">${refDocumento}</div>
            </div>
        </div>

        <div class="reg_form_label_text" style="margin-top:20px; font-size:12px;">Solicitudes:</div>
        <div class="reg_form_checklist_wrapper">
            <div class="reg_form_check_item">${checkOff} Cancelación de las cargas regla 8ª del artículo 210 de la Ley Hipotecaria <span class="reg_form_help_icon">(?)</span></div>
            <div class="reg_form_check_item">${checkOff} Solicita publicidad gráfica de la finca <span class="reg_form_help_icon">(?)</span></div>
            <div class="reg_form_check_item">${checkOff} Solicita la coordinación con el Catastro <span class="reg_form_help_icon">(?)</span></div>
            <div class="reg_form_check_item">${checkOff} No constancia de la referencia catastral <span class="reg_form_help_icon">(?)</span></div>
            <div class="reg_form_check_item">${checkOff} Inscripción parcial <span class="reg_form_help_icon">(?)</span></div>
            <div class="reg_form_check_item">${checkOff} Acceso Administración Tributaria <span class="reg_form_help_icon">(?)</span></div>
            <div class="reg_form_check_item">${checkOff} Cargas caducadas Art. 353 RH <span class="reg_form_help_icon">(?)</span></div>
        </div>

        <div class="reg_form_label_text" style="margin-top:20px; font-size:12px;">Bienes inmuebles</div>
        <div class="reg_form_units_desc">Para continuar con la presentación, es necesario que añada al menos una finca, que puede estar inscrita o no en el Registro.</div>
        <div class="reg_form_btn_download" style="text-align:center;">Añadir finca</div>

        <div class="reg_form_bienes_box">
            <div class="reg_form_label_text" style="font-size:12px; margin-bottom:10px;">Datos de un nuevo bien inmueble</div>
            <div class="reg_form_label_text">¿La finca está inscrita en el Registro de la Propiedad?</div>
            <div class="reg_form_radio_group" style="margin-bottom:15px;">
                <div class="reg_form_radio_item"><span class="reg_form_pink_dot">●</span> Sí</div>
                <div class="reg_form_radio_item"><span class="reg_form_grey_circle"></span> No</div>
            </div>

            <div class="reg_form_label_text">Seleccione una de las siguientes opciones:</div>
            <div class="reg_form_radio_group" style="margin-bottom:15px;">
                <div class="reg_form_radio_item"><span class="reg_form_pink_dot">●</span> CRU/IDUFIR</div>
                <div class="reg_form_radio_item"><span class="reg_form_grey_circle"></span> Datos registrales</div>
            </div>

            <div class="reg_form_label_text">CRU/IDUFIR</div>
            <div class="reg_form_input_field" style="margin-bottom:15px;">${
              dVivienda.cru || '03038000747769'
            }</div>

            <div class="reg_form_label_text">Descripción</div>
            <div class="reg_form_input_field" style="margin-bottom:20px; font-style:italic; color:#999;">Opcional</div>

            <div style="display:flex; gap:10px; justify-content:center;">
                <span style="border:1px solid #A30014; color:#A30014; padding:8px 30px; font-weight:bold; font-size:11px; border-radius:3px;">Cancelar</span>
                <span style="background-color:#C00; color:white; padding:8px 30px; font-weight:bold; font-size:11px; border-radius:3px;">Aceptar</span>
            </div>
        </div>
    </div>

    <div class="reg_form_upload_container">
        <div class="reg_form_section_title_lg">
            <span class="reg_form_step_badge">6</span> Adjunte la documentación
        </div>
        <div style="font-size: 11px; color: #444; margin-bottom: 20px;">Por favor, adjunte los archivos necesarios para la presentación.</div>
        <div class="reg_form_warning_yellow"><strong>AVISO IMPORTANTE:</strong> Si desea realizar la presentación como vivienda turística, es obligatorio adjuntar también el documento de VT correspondiente.</div>
        <div class="reg_form_warning_red">Debe adjuntar al menos un archivo para enviar la presentación.</div>

        <div class="reg_form_dropzone">
            📎 Haga clic para seleccionar el documento o arrástrelo sobre esta caja.
        </div>
        <div style="font-size: 10px; color: #888; margin-top: 5px; font-style: italic;">
            Formatos válidos: pdf, doc, docx, tif, rtf, xml, xls, xlsx, txt, jpg, jpeg, asc, zip y gml.<br>
            Tamaño máximo por archivo: 10 MB. Tamaño máximo total: 300 MB.
        </div>
    </div>

    <div class="reg_form_presenter_box">
        <div class="reg_form_section_title_lg">
            <span class="reg_form_step_badge">7</span> ¿Cuáles son los datos del presentante?
        </div>
        <div class="reg_form_label_text" style="font-size:11px; margin-bottom:5px;">Presentante</div>
        <div class="reg_form_input_field" style="background:#FFF; justify-content:space-between;">LUIS SERRANO ARTESERO <span>▼</span></div>

        <div class="reg_form_label_text" style="font-size:11px; margin-top:15px; margin-bottom:5px;">Email</div>
        <div class="reg_form_input_field" style="background:#FFF; justify-content:space-between;">
            ${
              ingeniero.correoEmpresa
            } <span style="background:#DDD; padding:0 5px; border-radius:2px; font-size:9px;">...</span>
        </div>
        <div style="font-size:10px; color:#999; font-style:italic;">Para recibir las notificaciones</div>

        <div class="reg_form_label_text" style="font-size:11px; margin-top:15px; margin-bottom:5px;">Confirmación del email</div>
        <div class="reg_form_input_field">${ingeniero.correoEmpresa}</div>

        <div class="reg_form_label_text" style="font-size:11px; margin-top:15px; margin-bottom:5px;">Teléfono móvil</div>
        <div class="reg_form_input_field" style="font-style:italic; color:#999;">Opcional</div>
        <div style="font-size:10px; color:#999; font-style:italic;">Para recibir las notificaciones</div>

        <div style="font-size:12px; font-weight:bold; margin-top:20px; margin-bottom:10px;">Datos de facturación</div>
        <div style="display:flex; align-items:center; gap:10px; font-size:11px; margin-bottom:15px;">
            <div style="width:14px; height:14px; border:1px solid #333;"></div> Usar otros datos de facturación
        </div>

        <div class="reg_form_label_text" style="font-size:11px; margin-bottom:5px;">Destinatario</div>
        <div class="reg_form_input_field" style="background:#FFF; justify-content:space-between;">LUIS SERRANO ARTESERO <span>▼</span></div>

        <div class="reg_form_label_text" style="font-size:11px; margin-top:15px; margin-bottom:5px;">Tipo de documento</div>
        <div class="reg_form_input_field" style="background:#F0F0F0; color:#999; justify-content:space-between;">NIF <span>▼</span></div>

        <div class="reg_form_label_text" style="font-size:11px; margin-top:15px; margin-bottom:5px;">Número de documento</div>
        <div class="reg_form_input_field" style="background:#F0F0F0; color:#555;">20037410V</div>

        <div class="reg_form_label_text" style="font-size:11px; margin-top:15px; margin-bottom:5px;">Nombre / denominación social</div>
        <div class="reg_form_input_field">LUIS</div>

        <div class="reg_form_label_text" style="font-size:11px; margin-top:15px; margin-bottom:5px;">Primer apellido</div>
        <div class="reg_form_input_field">SERRANO</div>

        <div class="reg_form_label_text" style="font-size:11px; margin-top:15px; margin-bottom:5px;">Segundo apellido</div>
        <div class="reg_form_input_field" style="justify-content:space-between;">ARTESERO <span style="background:#DDD; padding:0 5px; border-radius:2px; font-size:9px;">...</span></div>

        <div class="reg_form_label_text" style="font-size:11px; margin-top:15px; margin-bottom:5px;">Dirección de facturación</div>
        <div class="reg_form_input_field">${ingeniero.direccionFiscal}</div>

        <div class="reg_form_row_wrapper" style="margin-top:15px;">
            <div class="reg_form_col_container">
                <div class="reg_form_label_text" style="font-size:11px; margin-bottom:5px;">Código Postal</div>
                <div class="reg_form_input_field">${
                  ingeniero.codigoPostal
                }</div>
            </div>
            <div class="reg_form_col_container">
                <div class="reg_form_label_text" style="font-size:11px; margin-bottom:5px;">Provincia</div>
                <div class="reg_form_input_field" style="background:#F0F0F0;">Alicante/Alacant</div>
            </div>
        </div>

        <div class="reg_form_label_text" style="font-size:11px; margin-top:15px; margin-bottom:5px;">Municipio</div>
        <div class="reg_form_input_field" style="justify-content:space-between;">${
          ingeniero.localidad
        } <span>▼</span></div>

        <div style="font-size:11px; font-weight:bold; margin-top:20px; margin-bottom:10px;">¿Está usted obligado a practicar retención IRPF? <span class="reg_form_help_icon">(?)</span></div>
        <div style="display:flex; gap:20px; margin-bottom:20px;">
            <div style="display:flex; align-items:center; gap:5px; font-size:11px;">
                <span style="width:14px; height:14px; border:1px solid #CCC; border-radius:50%; display:inline-block;"></span> Sí
            </div>
            <div style="display:flex; align-items:center; gap:5px; font-size:11px;">
                <span style="width:14px; height:14px; border:5px solid #A30014; border-radius:50%; display:inline-block;"></span> No
            </div>
        </div>
    </div>

    <div class="reg_form_footer_actions">
        <button style="background: white; border: 1px solid #A30014; color: #A30014; padding: 10px 30px; font-weight: bold; border-radius: 4px; font-size: 12px;">Cancelar</button>
        <div style="display: flex; gap: 15px;">
            <button style="background: #C00; border: none; color: white; padding: 10px 30px; font-weight: bold; border-radius: 4px; font-size: 12px;">Guardar</button>
            <button style="background: #C00; border: none; color: white; padding: 10px 30px; font-weight: bold; border-radius: 4px; font-size: 12px;">Guardar y continuar</button>
        </div>
    </div>

    <div class="reg_form_footer_legal">
        ⚠️ IMPORTANTE: CUANDO SE VAYA A FIRMAR LA PRESENTACIÓN SE TIENE QUE FIRMAR CON EL CERTIFICADO DIGITAL DEL INGENIERO.
    </div>

</body>
</html>
    `;

    const element = document.createElement('div');
    element.innerHTML = htmlContent;

    const tipoNombre = dVivienda.esTuristico
      ? 'formulario_instancia_presentacion_turistico'
      : 'formulario_instancia_presentacion_no_turistico';
    const nombreLimpio = dTitular.nombre.replace(/[^a-zA-Z0-9]/g, '_');

    const opt: any = {
      margin: 0,
      filename: `${tipoNombre}_${nombreLimpio}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    await html2pdf().set(opt).from(element).save();
  }
}
