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
} from 'docx';
import * as JSZip from 'jszip';
import { saveAs } from 'file-saver';
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
      let pobVivienda = (datos.vivienda_poblacion || 'TEULADA').toUpperCase();
      let provVivienda = (datos.vivienda_provincia || 'ALICANTE').toUpperCase();
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
}
