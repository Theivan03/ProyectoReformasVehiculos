const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const path = require('path');
const { imageSize } = require('image-size');
const multer = require('multer');
const { exec } = require('child_process');
const uploadDocx = multer({ dest: 'uploads_docx/' });

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 50 * 1024 * 1024,  // 50 MB por campo de texto (metadata)
    fileSize: 50 * 1024 * 1024    // 50 MB por archivo
  }
});
const ULTIMO_PROYECTO_PATH = path.join(__dirname, 'ultimoProyecto.json');

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});

app.get('/talleres', (req, res) => {
  const data = fs.readFileSync('./talleres.json', 'utf-8');
  res.json(JSON.parse(data));
});


app.post('/talleres', (req, res) => {
  fs.writeFileSync('./talleres.json', JSON.stringify(req.body, null, 2));
  res.status(200).send({ message: 'Talleres actualizados' });
});

app.delete('/talleres/:nombre', (req, res) => {
  const nombreAEliminar = decodeURIComponent(req.params.nombre).trim().toLowerCase();

  const data = fs.readFileSync('./talleres.json', 'utf-8');
  let talleres = JSON.parse(data);

  const talleresFiltrados = talleres.filter(
    t => t.nombre.trim().toLowerCase() !== nombreAEliminar
  );

  if (talleres.length === talleresFiltrados.length) {
    return res.status(404).send({ message: 'Taller no encontrado para eliminar' });
  }

  fs.writeFileSync('./talleres.json', JSON.stringify(talleresFiltrados, null, 2));
  res.status(200).send({ message: 'Taller eliminado correctamente' });
});

app.use('/imgs', express.static(path.join(__dirname, 'imgs'), {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*'); // permite uso desde html2canvas
  }
}));

app.get('/image-sizes', (req, res) => {
  const carpetaImgs = path.join(__dirname, 'imgs');
  const imagenes = fs.readdirSync(carpetaImgs).filter(file =>
    /\.(png|jpe?g)$/i.test(file)
  );

  try {
    const tamanos = imagenes.map(nombre => {
      const ruta = path.join(carpetaImgs, nombre);
      const buffer = fs.readFileSync(ruta);
      const size = imageSize(buffer);
      return {
        nombre,
        width: size.width,
        height: size.height
      };
    });

    res.json(tamanos);
  } catch (err) {
    console.error('Error obteniendo tamaños de imágenes:', err.message);
    res.status(500).json({ error: 'No se pudieron obtener los tamaños de las imágenes.' });
  }
});

app.post('/guardar-imagen-plano', (req, res) => {
  const { imagenBase64, nombreArchivo = 'plano.png' } = req.body;

  if (!imagenBase64 || !imagenBase64.startsWith('data:image/png;base64,')) {
    return res.status(400).json({ error: 'Formato de imagen no válido' });
  }

  const base64Data = imagenBase64.replace(/^data:image\/png;base64,/, '');
  const rutaDestino = path.join(__dirname, 'imgs/planos', nombreArchivo);

  fs.writeFile(rutaDestino, base64Data, 'base64', (err) => {
    if (err) {
      console.error('Error al guardar la imagen:', err.message);
      return res.status(500).json({ error: 'No se pudo guardar la imagen' });
    }
    res.json({ message: 'Imagen guardada correctamente', ruta: `/imgs/planos/${nombreArchivo}` });
  });
});

app.post('/guardar-firma', (req, res) => {
  const { imagenBase64, nombreArchivo = 'firma.png' } = req.body;

  if (!imagenBase64 || !imagenBase64.startsWith('data:image/png;base64,')) {
    return res.status(400).json({ error: 'Imagen no válida' });
  }

  const base64Data = imagenBase64.replace(/^data:image\/png;base64,/, '');
  const ruta = path.join(__dirname, 'imgs', nombreArchivo);

  fs.writeFileSync(ruta, base64Data, 'base64');
  res.json({ message: 'Firma guardada', ruta });
});

app.post(
  '/guardar-proyecto',
  upload.fields([
    { name: 'prevImage', maxCount: 4 },
    { name: 'postImage', maxCount: 30 },
  ]),
  (req, res) => {
    try {
      // 1) Parseamos metadatos
      let metadata = JSON.parse(req.body.metadata);
      const num = String(metadata.numeroProyecto);

      const añoAhora = new Date().getFullYear().toString();

      // 2) Crear o limpiar carpeta raíz del proyecto
      const projectDir = path.join(__dirname, 'proyectos', num+"_"+añoAhora);
      if (fs.existsSync(projectDir)) {
        // si existe, borramos todo para empezar limpio
        fs.rmSync(projectDir, { recursive: true, force: true });
      }
      fs.mkdirSync(projectDir, { recursive: true });

      // 3) Guardar metadata en proyecto.json (siempre sobreescribe)
      const metadataPath = path.join(projectDir, 'proyecto.json');
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

      // 4) Subcarpetas de imágenes (prev y post)
      const prevDir = path.join(projectDir, 'lados');
      const postDir = path.join(projectDir, 'post');
      fs.mkdirSync(prevDir, { recursive: true });
      fs.mkdirSync(postDir, { recursive: true });

      // 5) Guardar cada imagen previa
      const prevFiles = req.files['prevImage'] || [];
      prevFiles.forEach((file, idx) => {
        const fn = file.originalname || `prev-${idx}.png`;
        fs.writeFileSync(path.join(prevDir, fn), file.buffer);
      });

      // 6) Guardar cada imagen posterior
      const postFiles = req.files['postImage'] || [];
      postFiles.forEach((file, idx) => {
        const fn = file.originalname || `post-${idx}.png`;
        fs.writeFileSync(path.join(postDir, fn), file.buffer);
      });

      const newCounter = { ultimo: num, año: añoAhora };
      fs.writeFileSync(
        ULTIMO_PROYECTO_PATH,
        JSON.stringify(newCounter, null, 2),
        'utf-8'
      );

       // 8) Devolver al cliente
      return res.json({
        message: 'Proyecto guardado correctamente',
        proyecto: num,
      });
    } catch (e) {
      console.error('Error en /guardar-proyecto:', e);
      return res.status(500).json({ error: 'No se pudo guardar el proyecto' });
    }
  }
);

app.get('/ultimo-proyecto', (req, res) => {
  try {
    // Leemos el JSON de contador
    const raw = fs.readFileSync(ULTIMO_PROYECTO_PATH, 'utf-8');
    const data = JSON.parse(raw);
    const añoGuardado = data.año;
    const ultimoGuardado = Number(data.ultimo);

    // Año actual en servidor
    const añoAhora = new Date().getFullYear().toString();

    // Calculamos el siguiente número
    const siguiente = añoAhora !== añoGuardado
      ? 1    // ha cambiado de año → arrancamos en 1
      : ultimoGuardado + 1;

    // Devolvemos sin tocar el archivo
    res.json({ siguiente, año: añoAhora });
  } catch (err) {
    console.error('Error en GET /ultimo-proyecto:', err);
    res.status(500).json({ error: 'No se pudo leer ultimoProyecto.json' });
  }
});

app.post('/convertir-docx-a-pdf', uploadDocx.single('doc'), (req, res) => {
  const docxPath = path.resolve(req.file.path);
  const outputDir = path.join(__dirname, 'pdf_generados');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const pdfPath = path.join(outputDir, path.parse(docxPath).name + '.pdf');
  const comando = `"C:\\Program Files\\LibreOffice\\program\\soffice.exe"` +
                  ` --headless --convert-to pdf "${docxPath}" --outdir "${outputDir}"`;

  exec(comando, (err, stdout, stderr) => {
    if (err) {
      console.error('Error convirtiendo a PDF:', stderr || err);
      // respuesta de error al cliente
      return res.status(500).json({ error: 'Fallo al convertir a PDF' });
    }

    // enviamos el PDF al cliente
    res.sendFile(pdfPath, (sendErr) => {
      if (sendErr) {
        console.error('Error enviando el PDF:', sendErr);
      }
      // y ahora borramos ambos ficheros sin que rompa si no existen
      [docxPath, pdfPath].forEach((file) => {
        fs.rm(file, { force: true }, (rmErr) => {
          if (rmErr) {
            console.warn(`No se pudo borrar ${file}:`, rmErr.message);
          }
        });
      });
    });
  });
});

app.get('/proyectos', (req, res) => {
  const proyectosDir = path.join(__dirname, 'proyectos');
  const carpetas = fs.readdirSync(proyectosDir);

  let proyectos = carpetas.map(carpeta => {
    const pjPath = path.join(proyectosDir, carpeta, 'proyecto.json');
    if (fs.existsSync(pjPath)) {
      const json = JSON.parse(fs.readFileSync(pjPath, 'utf-8'));
      return {
        id: carpeta,
        nombre: json.referenciaProyecto,
        marca: json.marca || '---',
        matricula: json.matricula || '---',
        propietario: json.propietario || '---',
        numeroProyecto: json.numeroProyecto || 0,
      };
    } else {
      return { id: carpeta, nombre: carpeta };
    }
  });

  // Ordenar descendente por númeroProyecto
  proyectos.sort((a, b) => Number(b.numeroProyecto) - Number(a.numeroProyecto));

  // Filtros
  const { marca, matricula, propietario } = req.query;
  if (marca) {
    proyectos = proyectos.filter(p =>
      p.marca?.toLowerCase().includes(marca.toLowerCase())
    );
  }
  if (matricula) {
    proyectos = proyectos.filter(p =>
      p.matricula?.toLowerCase().includes(matricula.toLowerCase())
    );
  }
  if (propietario) {
    proyectos = proyectos.filter(p =>
      p.propietario?.toLowerCase().includes(propietario.toLowerCase())
    );
  }

  // Limitar a 25 si no hay filtros
  if (!marca && !matricula && !propietario) {
    proyectos = proyectos.slice(0, 25);
  }

  res.json(proyectos);
});

app.get('/proyectos/:id/proyecto.json', (req, res) => {
  const id = req.params.id; // ej: "15_2025"
  const pjPath = path.join(__dirname, 'proyectos', id, 'proyecto.json');

  if (!fs.existsSync(pjPath)) {
    return res.status(404).json({ error: 'Proyecto no encontrado' });
  }

  try {
    const data = JSON.parse(fs.readFileSync(pjPath, 'utf-8'));
    res.json(data);
  } catch (err) {
    console.error('Error leyendo proyecto:', err);
    res.status(500).json({ error: 'No se pudo leer el proyecto' });
  }
});
