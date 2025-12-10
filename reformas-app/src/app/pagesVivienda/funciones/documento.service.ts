import { Injectable } from '@angular/core';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  UnderlineType,
  Header, // Importado para el CEE
  ImageRun,
  Table,
  BorderStyle,
  TableCell,
  TableRow,
  WidthType, // Importado para la imagen del CEE
} from 'docx';
import { saveAs } from 'file-saver';
import { PDFDocument } from 'pdf-lib';

@Injectable({
  providedIn: 'root',
})
export class DocumentoService {
  constructor() {}

  // ===========================================================================
  // AUXILIAR: Cargar imagen desde assets (Para el header del CEE)
  // ===========================================================================
  private async loadImage(url: string): Promise<ArrayBuffer> {
    const response = await fetch(url);
    const blob = await response.blob();
    return await blob.arrayBuffer();
  }

  // ===========================================================================
  // 1. REPRESENTACIÓN (CCU, 2ª Ocupación, etc.)
  // ===========================================================================
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

      // --- 2. LÓGICA DE DIRECCIÓN (SIEMPRE LA DE LA VIVIENDA) ---
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
      const size = 22; // 11pt
      const lineSpacing = 360; // 1.5 líneas (240 es single)

      // --- 5. CONSTRUCCIÓN DEL DOCUMENTO ---
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
                spacing: { after: 300, line: lineSpacing }, // APLICADO INTERLINEADO 1.5
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
                spacing: { after: 300, line: lineSpacing }, // APLICADO INTERLINEADO 1.5
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

              // FECHA 1
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

              // FIRMA REPRESENTADO
              new Paragraph({
                spacing: { before: 600, after: 600 },
                children: [
                  new TextRun({ text: 'FIRMA REPRESENTADO', font, size }),
                ],
              }),

              // ACEPTACIÓN
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

              // TEXTO ACEPTACIÓN
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 400, line: lineSpacing }, // APLICADO INTERLINEADO 1.5
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

  // ===========================================================================
  // 2. REPRESENTACIÓN CEE (IVACE - CON IMAGEN)
  // ===========================================================================
  async generarRepresentacionCEE(datos: any): Promise<void> {
    try {
      // 1. CARGAR IMAGEN (Ruta absoluta desde la raíz de la web)
      // Asegúrate de tener 'src/assets/ivace.jpg'
      const headerImageBuffer = await this.loadImage('/assets/ivace.jpg');

      // 2. DATOS (Misma lógica: Titular/Interesado y Dirección de Vivienda)

      // A) Otorgante
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

      // B) Dirección Vivienda
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

      form.flatten();
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
}
