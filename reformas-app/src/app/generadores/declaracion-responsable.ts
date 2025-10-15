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
