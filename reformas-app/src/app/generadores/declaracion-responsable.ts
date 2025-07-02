import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import ingenieroJson from '../../assets/ingeniero.json';

export async function generarDocumentoResponsable(data: any): Promise<void> {
  console.log('🏗️  Llamando a generarDocumentoResponsable con:', data);

  // 1) Carga la plantilla .docx como ArrayBuffer
  const arrayBuffer = await fetch('/assets/template_fixed.docx').then((r) =>
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
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

  // 5) Defaults del ingeniero (por si faltara algún campo)
  const ingenieroDefaults = {
    nombre: 'Nombre por defecto',
    dni: '00000000X',
    direccionFiscal: 'Calle Falsa 123',
    codigoPostal: '00000',
    localidad: 'Localidad por defecto',
    provincia: 'Provincia por defecto',
    titulacion: 'Titulación por defecto',
    especialidad: 'Especialidad por defecto',
    colegio: 'Colegio por defecto',
    colegiado: '00000',
    correo: 'correo@ejemplo.com',
  };

  // 6) Formatea la fecha del proyecto en español
  const fechaFormateada = new Date(data.fechaProyecto).toLocaleDateString(
    'es-ES',
    { day: 'numeric', month: 'long', year: 'numeric' }
  );

  // 7) Construye el objeto final (fusión de defaults + data)
  const templateData = {
    nombre: ingenieroJson.nombre,
    dni: ingenieroJson.dni,
    direccion: ingenieroJson.direccionFiscal,
    codigo: ingenieroJson.codigoPostal,
    localidad: ingenieroJson.localidad,
    provincia: ingenieroJson.provincia,
    titulacion: ingenieroJson.titulacion,
    especialidad: ingenieroJson.especialidad,
    colegio: ingenieroJson.colegio,
    colegiado: ingenieroJson.numero,
    correo: ingenieroJson.correo,
    marca: data.marca,
    modelo: data.modelo,
    vin: data.bastidor,
    fechaFormateada: fechaFormateada,
  };

  // 8) Renderiza
  try {
    doc.render(templateData);
  } catch (error) {
    console.error('Error al renderizar plantilla:', error);
    throw error;
  }
  console.log('DATOS INYECTADOS EN LA PLANTILLA:', templateData);

  // 9) Genera el blob y fuerza descarga
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
