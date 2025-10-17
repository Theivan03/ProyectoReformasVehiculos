import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import { PDFDocument, PDFDropdown, PDFTextField } from 'pdf-lib';

export async function generarDocumentoResponsable(data: any): Promise<void> {
  const ingeniero = data.ingenieroSeleccionado;
  if (data.comunidad === 'andalucia') {
    // === Caso PDF editable Andalucía ===
    const existingPdfBytes = await fetch('/assets/DRAndalucia.pdf').then((r) =>
      r.arrayBuffer()
    );
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const form = pdfDoc.getForm();

    // Formatear fecha
    const fecha = new Date(data.fechaProyecto);
    const dia = fecha.getDate().toString();
    const mes = fecha
      .toLocaleDateString('es-ES', { month: 'long' })
      .toUpperCase();
    const anio = fecha.getFullYear().toString();
    const fechaCompleta = `${dia} DE ${mes} DE ${anio}`;

    // Rellenar los 5 campos
    form
      .getTextField('ghrsthrt')
      .setText(
        `FICHA TÉCNICA REDUCIDA DEL VEHÍCULO ${data.marca} MODELO ${data.modelo} VIN ${data.bastidor}`
      );
    form
      .getTextField('keyjeyhe')
      .setText(
        `FICHA TÉCNICA REDUCIDA DEL VEHÍCULO ${data.marca} MODELO ${data.modelo} VIN ${data.bastidor}`
      );
    form.getTextField('ktyeyhetyue').setText(fechaCompleta);
    form.getTextField('Textfield1').setText(dia);
    form.getTextField('Textfield2').setText(mes);
    form.getTextField('kdudrsu').setText(anio);
    const provinciaField = form.getField('Provincia');

    form.getTextField('NOMBRE_Y_APELLIDOS').setText(fechaCompleta);
    form.getTextField('NIFNIE').setText(fechaCompleta);

    const fecha_desglosada = desglosarDireccion(ingeniero.direccionFiscal);

    //FECHA DESGLOSADA
    form.getTextField('fghdsfgh').setText(fecha_desglosada.tipoVia);
    form.getTextField('jkfjkf').setText(fecha_desglosada.nombreVia);
    form.getTextField('hkty').setText(fecha_desglosada.numero);
    form.getTextField('ESCALERA').setText(fecha_desglosada.escalera);
    form.getTextField('PLANTA').setText(fecha_desglosada.planta);
    form.getTextField('LETRA').setText(fecha_desglosada.letra);
    form.getTextField('BLOQUE').setText(fecha_desglosada.bloque);
    form.getTextField('PORTAL').setText(fecha_desglosada.portal);
    form.getTextField('PUERTA').setText(fecha_desglosada.puerta);

    form.getTextField('paispais').setText('ESPAÑA');
    form.getTextField('kdudrsuhgrg').setText(ingeniero.provincia);
    form.getTextField('MUNICIPIO').setText(ingeniero.localidad);
    form.getTextField('Textfield0').setText(ingeniero.codigoPostal);
    form.getTextField('dfhsdfhsdtj').setText(ingeniero.titulacion);
    form.getTextField('ESPECIALIDAD').setText(ingeniero.especialidad);
    form.getTextField('UNIVERSIDAD').setText(ingeniero.universidad);
    form
      .getTextField('COLEGIO_PROFESIONAL_AL_QUE_PERTENECE')
      .setText(ingeniero.colegio);
    form.getTextField('N_DE_COLEGIADOA').setText(ingeniero.numero);

    if (provinciaField instanceof PDFDropdown) {
      provinciaField.select(data.provincia || 'MÁLAGA');
    } else if (provinciaField instanceof PDFTextField) {
      provinciaField.setText(data.provincia || 'MÁLAGA');
    }

    const pdfBytes = await pdfDoc.save();
    saveAs(
      new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' }),
      `${data.referenciaProyecto} DR ${data.marca || 'Marca'} ${
        data.modelo || 'Modelo'
      }.pdf`
    );
    return;
  }

  if (data.comunidad === 'valenciana') {
    // 1) Carga la plantilla .docx como ArrayBuffer
    const arrayBuffer = await fetch('/assets/DRValenciana.docx').then((r) =>
      r.arrayBuffer()
    );

    // 2) Descomprime con PizZip
    const zip = new PizZip(arrayBuffer);

    // 3) Aísla cada placeholder en su propio <w:r> para que nunca
    //    quede partido ni repita tags, y dejes intactas el resto de etiquetas
    let xml = zip.file('word/document.xml')!.asText();

    // a) Partimos por placeholders
    const parts = xml.split(/({{[^}]+}})/g);

    // b) Reconstruimos, envolviendo sólo los tokens {{…}}
    const rebuilt = parts
      .map((tok) => {
        if (/^{{[^}]+}}$/.test(tok)) {
          // token es un placeholder completo: lo metemos en su run
          return `<w:r><w:rPr/><w:t>${tok}</w:t></w:r>`;
        }
        // cualquier otro fragmento de XML, sin tocar
        return tok;
      })
      .join('');

    // c) Guardamos el XML modificado
    zip.file('word/document.xml', rebuilt);

    // 4) Instancia Docxtemplater sobre el zip "flattened"
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // 5) Formatea la fecha del proyecto en español
    const fechaFormateada = new Date(data.fechaProyecto).toLocaleDateString(
      'es-ES',
      { day: 'numeric', month: 'long', year: 'numeric' }
    );

    // 6) Construye el objeto final (fusión de defaults + data)
    const templateData = {
      nombre: ingeniero.nombre,
      dni: ingeniero.dni,
      direccion: ingeniero.direccionFiscal,
      codigo: ingeniero.codigoPostal,
      localidad: ingeniero.localidad,
      provincia: ingeniero.provincia,
      titulacion: ingeniero.titulacion,
      especialidad: ingeniero.especialidad,
      colegio: ingeniero.colegio,
      colegiado: ingeniero.numero,
      correo: ingeniero.correo,
      marca: data.marca,
      modelo: data.modelo,
      vin: data.bastidor,
      fechaFormateada: fechaFormateada,
    };

    // 7) Renderiza
    try {
      doc.render(templateData);
    } catch (error) {
      console.error('Error al renderizar plantilla:', error);
      throw error;
    }

    // 8) Genera el blob y fuerza descarga
    const outBlob = doc.getZip().generate({
      type: 'blob',
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    saveAs(
      outBlob,
      `${data.referenciaProyecto} DR ${data.marca || 'Marca'} ${
        data.modelo || 'Modelo'
      }.docx`
    );
  }

  if (data.comunidad === 'murcia') {
    // 1) Carga la plantilla .docx como ArrayBuffer
    const arrayBuffer = await fetch('/assets/DRMurcia.docx').then((r) =>
      r.arrayBuffer()
    );

    // 2) Descomprime con PizZip
    const zip = new PizZip(arrayBuffer);

    // 3) Aísla cada placeholder en su propio <w:r> para que nunca
    //    quede partido ni repita tags, y dejes intactas el resto de etiquetas
    let xml = zip.file('word/document.xml')!.asText();

    // a) Partimos por placeholders
    const parts = xml.split(/({{[^}]+}})/g);

    // b) Reconstruimos, envolviendo sólo los tokens {{…}}
    const rebuilt = parts
      .map((tok) => {
        if (/^{{[^}]+}}$/.test(tok)) {
          // token es un placeholder completo: lo metemos en su run
          return `<w:r><w:rPr/><w:t>${tok}</w:t></w:r>`;
        }
        // cualquier otro fragmento de XML, sin tocar
        return tok;
      })
      .join('');

    // c) Guardamos el XML modificado
    zip.file('word/document.xml', rebuilt);

    // 4) Instancia Docxtemplater sobre el zip "flattened"
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // 5) Formatea la fecha del proyecto en español
    const fechaFormateada = new Date(data.fechaProyecto).toLocaleDateString(
      'es-ES',
      { day: 'numeric', month: 'long', year: 'numeric' }
    );

    // 6) Construye el objeto final (fusión de defaults + data)
    const templateData = {
      universidad: ingeniero.universidad,
      colegio: ingeniero.colegio,
      colegiado: ingeniero.numero,
      nombre: ingeniero.nombre,
      dni: ingeniero.dni,
      direccion: ingeniero.direccionFiscal,
      marca: data.marca,
      modelo: data.modelo,
      vin: data.bastidor,
      fechaFormateada: fechaFormateada,
    };

    // 7) Renderiza
    try {
      doc.render(templateData);
    } catch (error) {
      console.error('Error al renderizar plantilla:', error);
      throw error;
    }

    // 8) Genera el blob y fuerza descarga
    const outBlob = doc.getZip().generate({
      type: 'blob',
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    saveAs(
      outBlob,
      `${data.referenciaProyecto} DR ${data.marca || 'Marca'} ${
        data.modelo || 'Modelo'
      }.docx`
    );
  }
}

function desglosarDireccion(direccion: string) {
  // Inicializamos todos los campos como cadena vacía
  const campos = {
    tipoVia: '',
    nombreVia: '',
    numero: '',
    escalera: '',
    planta: '',
    letra: '',
    bloque: '',
    portal: '',
    puerta: '',
  };

  if (!direccion || typeof direccion !== 'string') return campos;

  // Normalizar texto
  let dir = direccion.trim().toUpperCase().replace(/\s+/g, ' ');

  // 1️⃣ Detectar tipo de vía (AVDA., C/, PZA., CAMINO, etc.)
  const tipoViaRegex =
    /^(AVDA\.?|AVENIDA|C\/|CALLE|CL\.?|PZA\.?|PLAZA|CAMINO|CMNO\.?|CR\.?|CARRETERA|PASEO|PSO\.?|URB\.?|POL\.?|POLÍGONO)/;
  const tipoViaMatch = dir.match(tipoViaRegex);
  if (tipoViaMatch) {
    campos.tipoVia = tipoViaMatch[0].replace('.', '').trim();
    dir = dir.replace(tipoViaRegex, '').trim();
  }

  // 2️⃣ Separar por coma → antes de la coma suele ir nombre y número
  const partes = dir.split(',');
  const primeraParte = partes[0].trim();
  const resto = partes.slice(1).join(',').trim();

  // 3️⃣ Buscar número (puede incluir BIS o letra)
  const numMatch = primeraParte.match(/(\d+[A-Z]?(?:\s?BIS)?)/);
  if (numMatch) {
    campos.numero = numMatch[1];
    campos.nombreVia = primeraParte.replace(numMatch[0], '').trim();
  } else {
    campos.nombreVia = primeraParte.trim();
  }

  // 4️⃣ Buscar el resto de campos en la parte posterior
  if (resto) {
    const planta = resto.match(/(\d+º|\bBAJO\b|\bENTLO\b|\bENTRESUELO\b)/);
    const escalera = resto.match(/ESC\.?\s*([A-Z0-9]+)/);
    const bloque = resto.match(/BLQ\.?\s*([A-Z0-9]+)/);
    const portal = resto.match(/PORTAL\s*([A-Z0-9]+)/);
    const puerta = resto.match(/PTA\.?\s*([A-Z0-9]+)/);
    const letra = resto.match(/(\d+º\s*([A-Z]))/);

    campos.planta = planta ? planta[1] : '';
    campos.escalera = escalera ? escalera[1] : '';
    campos.bloque = bloque ? bloque[1] : '';
    campos.portal = portal ? portal[1] : '';
    campos.puerta = puerta ? puerta[1] : '';
    campos.letra = letra ? letra[2] : '';
  }

  // Aseguramos que todos los campos sean strings
  for (const key of Object.keys(campos)) {
    if (!campos[key as keyof typeof campos])
      campos[key as keyof typeof campos] = '';
  }

  return campos;
}
