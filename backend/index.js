const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const { imageSize } = require('image-size');
const multer = require('multer');
const { exec } = require('child_process');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const BACKEND_ROOT = __dirname;
const PROYECTOS_DIR = path.join(BACKEND_ROOT, 'proyectos');
const ULTIMO_PROYECTO_PATH = path.join(BACKEND_ROOT, 'ultimoProyecto.json');
const TALLERES_PATH = path.join(BACKEND_ROOT, 'talleres.json');
const INGENIEROS_PATH = path.join(BACKEND_ROOT, 'ingenieros.json');
const ARQUITECTOS_PATH = path.join(BACKEND_ROOT, 'arquitectos.json');
const INSTALADORES_PATH = path.join(BACKEND_ROOT, 'instaladores.json');
const UPLOADS_DOCX_DIR = path.join(BACKEND_ROOT, 'uploads_docx');

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Aumentado límite por si las imágenes base64 son grandes
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

fs.mkdirSync(UPLOADS_DOCX_DIR, { recursive: true });

const uploadDocxStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DOCX_DIR),
  filename: (_req, file, cb) => {
    const extensionOriginal = path.extname(file.originalname || '').toLowerCase();
    const extension = extensionOriginal === '.docx' ? extensionOriginal : '.docx';
    const nombreTemporal = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    cb(null, nombreTemporal);
  },
});

const uploadDocx = multer({ storage: uploadDocxStorage });
const multerDocx = multer({ storage: multer.memoryStorage() });
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 50 * 1024 * 1024,
    fileSize: 50 * 1024 * 1024
  }
});

// --- GESTIÓN DE USUARIOS ---
const USUARIOS_PATH = path.join(__dirname, 'usuarios.json');
let baseDeDatosUsuariosServidor = [];

if (fs.existsSync(USUARIOS_PATH)) {
  try {
    const rawData = fs.readFileSync(USUARIOS_PATH, 'utf-8');
    baseDeDatosUsuariosServidor = JSON.parse(rawData);
  } catch (error) {
    baseDeDatosUsuariosServidor = [];
  }
}

const llaveSecretaServidorJWT = 'ivanPutoamo';

const guardarUsuariosEnDisco = () => {
  try {
    fs.writeFileSync(USUARIOS_PATH, JSON.stringify(baseDeDatosUsuariosServidor, null, 2));
  } catch (error) {
    console.error('Error guardando usuarios.json', error);
  }
};

const readJsonFile = (filePath, fallback = null) => {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (error) {
    console.error(`Error leyendo JSON en ${filePath}:`, error);
    return fallback;
  }
};

const readJsonArrayFile = (filePath) => {
  const data = readJsonFile(filePath, []);
  if (Array.isArray(data)) return data;
  return data ? [data] : [];
};

const writeJsonFile = (filePath, data) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const resolveProjectDirById = (id) => {
  const safeId = String(id || '').trim();
  if (!safeId) return null;

  const proyectosRoot = path.resolve(PROYECTOS_DIR);
  const resolvedDir = path.resolve(path.join(proyectosRoot, safeId));

  if (resolvedDir === proyectosRoot || !resolvedDir.startsWith(proyectosRoot + path.sep)) {
    return null;
  }

  return resolvedDir;
};

const removeFilesIfExist = (...files) => {
  files.filter(Boolean).forEach((filePath) => {
    fs.rm(filePath, { force: true }, (error) => {
      if (error) {
        console.warn(`No se pudo borrar ${filePath}:`, error.message);
      }
    });
  });
};

const getLibreOfficeExecutable = () => {
  const candidates = [
    process.env.LIBREOFFICE_PATH,
    'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
    'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
  ].filter(Boolean);

  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
};

const crearUsuarioAdminPorDefecto = async () => {
  const saltAdmin = await bcrypt.genSalt(10);
  const passwordHashedAdmin = await bcrypt.hash('220177', saltAdmin);

  const usuarioAdmin = {
    id: 1,
    usuario: 'admin',
    password: passwordHashedAdmin,
    rol: 'administrador'
  };

  const existeAdmin = baseDeDatosUsuariosServidor.find(u => u.usuario === 'admin');
  if (!existeAdmin) {
    baseDeDatosUsuariosServidor.push(usuarioAdmin);
    console.log('--> Usuario ADMIN creado: admin / 220177');
    guardarUsuariosEnDisco();
  }
};

crearUsuarioAdminPorDefecto();

app.post('/api/registro', async (req, res) => {
  const { usuarioRegistroApp, passwordRegistroApp, tipoUsuarioApp } = req.body;
  const usuarioNormalizado = String(usuarioRegistroApp || '').trim();

  if (!usuarioNormalizado || !passwordRegistroApp || !tipoUsuarioApp) {
    return res.status(400).json({ error: 'Faltan datos obligatorios del usuario' });
  }

  const usuarioDuplicado = baseDeDatosUsuariosServidor.some(
    (u) => String(u.usuario || '').trim().toLowerCase() === usuarioNormalizado.toLowerCase()
  );

  if (usuarioDuplicado) {
    return res.status(409).json({ error: 'El usuario ya existe' });
  }

  const saltServidor = await bcrypt.genSalt(10);
  const passwordHashedServidor = await bcrypt.hash(passwordRegistroApp, saltServidor);

  let siguienteId = 1;
  if (baseDeDatosUsuariosServidor.length > 0) {
    const idsExistentes = baseDeDatosUsuariosServidor.map(u => u.id);
    siguienteId = Math.max(...idsExistentes) + 1;
  }

  const nuevoUsuarioServidor = {
    id: siguienteId,
    usuario: usuarioNormalizado,
    password: passwordHashedServidor,
    rol: tipoUsuarioApp
  };

  baseDeDatosUsuariosServidor.push(nuevoUsuarioServidor);
  guardarUsuariosEnDisco();
  res.json({ mensaje: 'Usuario cifrado y almacenado exitosamente' });
});

app.post('/api/login', async (req, res) => {
  const { usuarioLoginApp, passwordLoginApp } = req.body;

  const usuarioEncontradoServidor = baseDeDatosUsuariosServidor.find(u => u.usuario === usuarioLoginApp);

  if (!usuarioEncontradoServidor) {
    return res.status(400).json({ error: 'Usuario no encontrado' });
  }

  const passwordValidaServidor = await bcrypt.compare(passwordLoginApp, usuarioEncontradoServidor.password);

  if (!passwordValidaServidor) {
    return res.status(400).json({ error: 'Contraseña incorrecta' });
  }

  const tokenSesionServidor = jwt.sign(
    { id: usuarioEncontradoServidor.id, rol: usuarioEncontradoServidor.rol },
    llaveSecretaServidorJWT,
    { expiresIn: '1h' }
  );

  res.json({ token: tokenSesionServidor });
});

app.get('/api/usuarios', (req, res) => {
  res.json(baseDeDatosUsuariosServidor);
});

app.delete('/api/usuarios/:id', (req, res) => {
  const idUsuario = parseInt(req.params.id);
  const indiceUsuario = baseDeDatosUsuariosServidor.findIndex(u => u.id === idUsuario);

  if (indiceUsuario !== -1) {
    baseDeDatosUsuariosServidor.splice(indiceUsuario, 1);
    guardarUsuariosEnDisco();
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } else {
    res.status(404).json({ error: 'Usuario no encontrado' });
  }
});

// --- GESTIÓN DE TALLERES ---

app.get('/talleres', (req, res) => {
  try {
    res.json(readJsonArrayFile(TALLERES_PATH));
  } catch (error) {
    res.json([]);
  }
});

app.post('/talleres', (req, res) => {
  writeJsonFile(TALLERES_PATH, req.body);
  res.status(200).send({ message: 'Talleres actualizados' });
});

app.delete('/talleres/:nombre', (req, res) => {
  const nombreAEliminar = decodeURIComponent(req.params.nombre).trim().toLowerCase();

  try {
    const talleres = readJsonArrayFile(TALLERES_PATH);

    const talleresFiltrados = talleres.filter(
      t => String(t?.nombre || '').trim().toLowerCase() !== nombreAEliminar
    );

    if (talleres.length === talleresFiltrados.length) {
      return res.status(404).send({ message: 'Taller no encontrado para eliminar' });
    }

    writeJsonFile(TALLERES_PATH, talleresFiltrados);
    res.status(200).send({ message: 'Taller eliminado correctamente' });
  } catch (error) {
    res.status(500).send({ message: 'Error al eliminar taller' });
  }
});

// --- GESTIÓN DE IMÁGENES ---
app.use('/imgs', express.static(path.join(__dirname, 'imgs'), {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

app.get('/image-sizes', (req, res) => {
  const carpetaImgs = path.join(__dirname, 'imgs');
  
  if (!fs.existsSync(carpetaImgs)) {
      return res.json([]);
  }

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

  const dir = path.dirname(rutaDestino);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

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

// --- GESTIÓN DE PROYECTOS (MODIFICADA) ---
app.post(
  '/guardar-proyecto',
  upload.fields([
    { name: 'prevImage', maxCount: 4 },
    { name: 'postImage', maxCount: 50 },
  ]),
  (req, res) => {
    try {
      const metadata = JSON.parse(req.body.metadata || '{}');
      if (!metadata || typeof metadata !== 'object') {
        return res.status(400).json({ error: 'Metadata de proyecto invalida' });
      }

      const num = String(metadata.numeroProyecto || '').trim();
      if (!num) {
        return res.status(400).json({ error: 'El numero de proyecto es obligatorio' });
      }
      const numActual = Number(num);
      const anyoAhora = new Date().getFullYear().toString();
      const esEdicion = String(req.body.esEdicion || '').toLowerCase() === 'true';
      const proyectoIdOriginal = String(req.body.proyectoId || '').trim();
      let anyoProyecto = anyoAhora;
      let previousProjectDir = null;

      if (esEdicion && proyectoIdOriginal) {
        previousProjectDir = resolveProjectDirById(proyectoIdOriginal);
        if (!previousProjectDir) {
          return res.status(400).json({ error: 'ID de proyecto invalido' });
        }

        const yearFromId = path.basename(previousProjectDir).split('_').pop();
        if (/^\d{4}$/.test(yearFromId || '')) {
          anyoProyecto = yearFromId;
        }
      }

      const projectDir = path.join(PROYECTOS_DIR, `${num}_${anyoProyecto}`);

      if (
        previousProjectDir &&
        path.resolve(previousProjectDir) !== path.resolve(projectDir) &&
        fs.existsSync(previousProjectDir)
      ) {
        fs.rmSync(previousProjectDir, { recursive: true, force: true });
      }
      
      // Si la carpeta existe, la limpiamos para sobreescribir (edición)
      if (fs.existsSync(projectDir)) {
        fs.rmSync(projectDir, { recursive: true, force: true });
      }
      fs.mkdirSync(projectDir, { recursive: true });

      // Guardar metadata
      const metadataPath = path.join(projectDir, 'proyecto.json');
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

      // Crear carpetas de imágenes
      const prevDir = path.join(projectDir, 'lados');
      const postDir = path.join(projectDir, 'post');
      fs.mkdirSync(prevDir, { recursive: true });
      fs.mkdirSync(postDir, { recursive: true });

      // Guardar imágenes previas
      const prevFiles = req.files?.['prevImage'] || [];
      prevFiles.forEach((file, idx) => {
        const fn = file.originalname || `prev-${idx}.png`;
        fs.writeFileSync(path.join(prevDir, fn), file.buffer);
      });

      // Guardar imágenes posteriores
      const postFiles = req.files?.['postImage'] || [];
      postFiles.forEach((file, idx) => {
        const fn = file.originalname || `post-${idx}.png`;
        fs.writeFileSync(path.join(postDir, fn), file.buffer);
      });

      if (!esEdicion && Number.isFinite(numActual) && numActual > 0) {
        const newCounter = { ultimo: num, año: anyoAhora };
        writeJsonFile(ULTIMO_PROYECTO_PATH, newCounter);
        console.log(`Contador actualizado a: ${num} (${anyoAhora})`);
      } else {
        console.log(`Guardado en modo edición detectado (Proyecto ${num}). El contador no se modifica.`);
      }

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
    if (!fs.existsSync(ULTIMO_PROYECTO_PATH)) {
        return res.json({ siguiente: 1, año: new Date().getFullYear().toString() });
    }
    const raw = fs.readFileSync(ULTIMO_PROYECTO_PATH, 'utf-8');
    const data = JSON.parse(raw);
    const añoGuardado = data.año;
    const ultimoGuardado = Number(data.ultimo);

    const añoAhora = new Date().getFullYear().toString();

    const siguiente = añoAhora !== añoGuardado
      ? 1
      : ultimoGuardado + 1;

    res.json({ siguiente, año: añoAhora });
  } catch (err) {
    console.error('Error en GET /ultimo-proyecto:', err);
    res.status(500).json({ error: 'No se pudo leer ultimoProyecto.json' });
  }
});

// --- CONVERSIÓN DOCX -> PDF ---
app.post('/convertir-docx-a-pdf', uploadDocx.single('doc'), (req, res) => {
  if (!req.file?.path) {
    return res.status(400).json({ error: 'No se ha recibido ningun archivo DOCX' });
  }

  const libreOfficeExecutable = getLibreOfficeExecutable();
  if (!libreOfficeExecutable) {
    removeFilesIfExist(req.file.path);
    return res.status(500).json({ error: 'LibreOffice no esta disponible en el servidor' });
  }

  const docxPath = path.resolve(req.file.path);
  const outputDir = path.join(__dirname, 'pdf_generados');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const pdfPath = path.join(outputDir, path.parse(docxPath).name + '.pdf');
  const comando = `"${libreOfficeExecutable}"` +
    ` --headless --convert-to pdf "${docxPath}" --outdir "${outputDir}"`;

  exec(comando, (err, stdout, stderr) => {
    if (err || !fs.existsSync(pdfPath)) {
      console.error('Error convirtiendo a PDF:', stderr || err);
      removeFilesIfExist(docxPath, pdfPath);
      return res.status(500).json({ error: 'Fallo al convertir a PDF' });
    }

    res.sendFile(pdfPath, (sendErr) => {
      if (sendErr) {
        console.error('Error enviando el PDF:', sendErr);
      }
      removeFilesIfExist(docxPath, pdfPath);
    });
  });
});

app.get('/proyectos', (req, res) => {
  if (!fs.existsSync(PROYECTOS_DIR)) {
      return res.json([]);
  }
  const carpetas = fs.readdirSync(PROYECTOS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  let proyectos = carpetas.map(carpeta => {
    const pjPath = path.join(PROYECTOS_DIR, carpeta, 'proyecto.json');
    if (fs.existsSync(pjPath)) {
      try {
        const json = JSON.parse(fs.readFileSync(pjPath, 'utf-8'));
        return {
          id: carpeta,
          nombre: json.referenciaProyecto || carpeta,
          marca: json.marca || '---',
          matricula: json.matricula || '---',
          propietario: json.propietario || '---',
          numeroProyecto: json.numeroProyecto || 0,
          enviadoPorCliente: json.enviadoPorCliente || false,
        };
      } catch (error) {
        console.warn(`Proyecto omitido por JSON invalido: ${carpeta}`, error);
      }
    } else {
      return { id: carpeta, nombre: carpeta, enviadoPorCliente: false, numeroProyecto: 0 };
    }

    return {
      id: carpeta,
      nombre: carpeta,
      marca: '---',
      matricula: '---',
      propietario: '---',
      numeroProyecto: 0,
      enviadoPorCliente: false,
    };
  });

  proyectos.sort((a, b) => Number(b.numeroProyecto) - Number(a.numeroProyecto));

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

  if (!marca && !matricula && !propietario) {
    proyectos = proyectos.slice(0, 25);
  }

  res.json(proyectos);
});

app.get('/proyectos/:id/proyecto.json', (req, res) => {
  const projectDir = resolveProjectDirById(req.params.id);
  if (!projectDir) {
    return res.status(400).json({ error: 'ID de proyecto invalido' });
  }

  const pjPath = path.join(projectDir, 'proyecto.json');

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

app.delete('/proyectos/:id', (req, res) => {
  const projectDir = resolveProjectDirById(req.params.id);

  if (!projectDir) {
    return res.status(400).json({ error: 'Ruta de proyecto invalida' });
  }

  if (!fs.existsSync(projectDir)) {
    return res.status(404).json({ error: 'Proyecto no encontrado' });
  }

  try {
    let referenciaProyecto = '';
    let numeroProyecto = '';
    const pjPath = path.join(projectDir, 'proyecto.json');

    if (fs.existsSync(pjPath)) {
      try {
        const proyecto = JSON.parse(fs.readFileSync(pjPath, 'utf-8'));
        referenciaProyecto = String(proyecto?.referenciaProyecto || '').trim();
        numeroProyecto = String(proyecto?.numeroProyecto || '').trim();
      } catch (error) {
        console.warn('No se pudo leer proyecto.json antes de eliminar el expediente:', error);
      }
    }

    fs.rmSync(projectDir, { recursive: true, force: true });

    if (referenciaProyecto) {
      const referenciaSanitizada = referenciaProyecto
        .replace(/[\/\\:*?"<>|]/g, '-')
        .trim();
      const docxPath = path.join(
        __dirname,
        'documentos_generados',
        `${referenciaSanitizada}.docx`
      );
      if (fs.existsSync(docxPath)) {
        fs.rmSync(docxPath, { force: true });
      }
    }

    if (numeroProyecto) {
      const planoPath = path.join(
        __dirname,
        'imgs',
        'planos',
        `plano-generado-proyecto${numeroProyecto}.png`
      );
      if (fs.existsSync(planoPath)) {
        fs.rmSync(planoPath, { force: true });
      }
    }

    res.json({ message: 'Expediente eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando proyecto:', error);
    res.status(500).json({ error: 'No se pudo eliminar el expediente' });
  }
});

// --- GUARDAR DOCX ---
app.post('/guardar-docx', multerDocx.single('docx'), (req, res) => {
  try {
    const referenciaOriginal = req.body.referenciaProyecto || 'documento_sin_nombre';
    const docBuffer = req.file?.buffer;

    if (!docBuffer) {
      return res.status(400).json({ error: 'No se ha recibido ningún archivo DOCX' });
    }

    const referencia = referenciaOriginal.replace(/[\/\\:*?"<>|]/g, '-').trim();

    const outputDir = path.join(__dirname, 'documentos_generados');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const filename = `${referencia}.docx`;
    const fullPath = path.join(outputDir, filename);

    fs.writeFileSync(fullPath, docBuffer);
    console.log(`📄 Documento guardado correctamente: ${fullPath}`);

    res.json({
      message: 'Documento DOCX recibido y guardado correctamente',
      ruta: `/documentos_generados/${filename}`,
    });
  } catch (err) {
    console.error('Error en /guardar-docx:', err);
    res.status(500).json({ error: 'No se pudo guardar el DOCX en el servidor' });
  }
});

app.use(
  '/documentos_generados',
  express.static(path.join(__dirname, 'documentos_generados'), {
    setHeaders: (res) => {
      res.set('Access-Control-Allow-Origin', '*');
    }
  })
);

// --- INGENIEROS, ARQUITECTOS E INSTALADORES ---
app.get('/ingenieros', (req, res) => {
  try {
    if (!fs.existsSync(INGENIEROS_PATH)) {
        return res.json([]);
    }
    const raw = fs.readFileSync(INGENIEROS_PATH, 'utf-8');
    const data = JSON.parse(raw);

    const lista = Array.isArray(data) ? data : [data];
    res.json(lista);
  } catch (err) {
    console.error('Error al leer ingenieros.json:', err);
    res.status(500).json([]);
  }
});

app.get('/arquitectos', (req, res) => {
  try {
    if (!fs.existsSync(ARQUITECTOS_PATH)) {
        return res.json([]);
    }
    const raw = fs.readFileSync(ARQUITECTOS_PATH, 'utf-8');
    const data = JSON.parse(raw);

    const lista = Array.isArray(data) ? data : [data];
    res.json(lista);
  } catch (err) {
    console.error('Error al leer arquitectos.json:', err);
    res.status(500).json([]);
  }
});

app.get('/instaladores', (req, res) => {
  try {
    if (!fs.existsSync(INSTALADORES_PATH)) {
        return res.json([]);
    }
    const raw = fs.readFileSync(INSTALADORES_PATH, 'utf-8');
    const data = JSON.parse(raw);

    const lista = Array.isArray(data) ? data : [data];
    res.json(lista);
  } catch (err) {
    console.error('Error al leer instaladores.json:', err);
    res.status(500).json([]);
  }
});

app.post('/ingenieros', (req, res) => {
  try {
    writeJsonFile(INGENIEROS_PATH, req.body);
    res.status(200).send({ message: 'Ingenieros actualizados' });
  } catch (err) {
    console.error('Error guardando ingenieros:', err);
    res.status(500).send({ message: 'Error al guardar ingenieros' });
  }
});

app.post('/arquitectos', (req, res) => {
  try {
    writeJsonFile(ARQUITECTOS_PATH, req.body);
    res.status(200).send({ message: 'Ingenieros actualizados' });
  } catch (err) {
    console.error('Error guardando arquitectos:', err);
    res.status(500).send({ message: 'Error al guardar arquitectos' });
  }
});

app.post('/instaladores', (req, res) => {
  try {
    writeJsonFile(INSTALADORES_PATH, req.body);
    res.status(200).send({ message: 'Instaladores actualizados' });
  } catch (err) {
    console.error('Error guardando instaladores:', err);
    res.status(500).send({ message: 'Error al guardar instaladores' });
  }
});

app.delete('/ingenieros/:nombre', (req, res) => {
  try {
    const nombreAEliminar = decodeURIComponent(req.params.nombre)
      .trim()
      .toLowerCase();

    const raw = fs.readFileSync(INGENIEROS_PATH, 'utf-8');
    let ingenieros = JSON.parse(raw);
    if (!Array.isArray(ingenieros)) ingenieros = [ingenieros];

    const filtrados = ingenieros.filter(
      (i) => i.nombre.trim().toLowerCase() !== nombreAEliminar
    );

    writeJsonFile(INGENIEROS_PATH, filtrados);
    res.status(200).send({ message: 'Ingeniero eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar ingeniero:', err);
    res.status(500).send({ message: 'Error al eliminar ingeniero' });
  }
});

app.delete('/arquitectos/:nombre', (req, res) => {
  try {
    const nombreAEliminar = decodeURIComponent(req.params.nombre)
      .trim()
      .toLowerCase();

    const raw = fs.readFileSync(ARQUITECTOS_PATH, 'utf-8');
    let arquitectos = JSON.parse(raw);
    if (!Array.isArray(arquitectos)) arquitectos = [arquitectos];

    const filtrados = arquitectos.filter(
      (i) => i.nombre.trim().toLowerCase() !== nombreAEliminar
    );

    writeJsonFile(ARQUITECTOS_PATH, filtrados);
    res.status(200).send({ message: 'Arquitecto eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar arquitecto:', err);
    res.status(500).send({ message: 'Error al eliminar arquitecto' });
  }
});

app.delete('/instaladores/:nombre', (req, res) => {
  try {
    const nombreAEliminar = decodeURIComponent(req.params.nombre)
      .trim()
      .toLowerCase();

    if (!fs.existsSync(INSTALADORES_PATH)) {
      return res.status(200).send({ message: 'No hay instaladores guardados' });
    }

    const raw = fs.readFileSync(INSTALADORES_PATH, 'utf-8');
    let instaladores = JSON.parse(raw);
    if (!Array.isArray(instaladores)) instaladores = [instaladores];

    const filtrados = instaladores.filter(
      (i) =>
        String(i.empresaInstaladoraOInstalador || '')
          .trim()
          .toLowerCase() !== nombreAEliminar
    );

    writeJsonFile(INSTALADORES_PATH, filtrados);
    res.status(200).send({ message: 'Instalador eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar instalador:', err);
    res.status(500).send({ message: 'Error al eliminar instalador' });
  }
});

// ================================================================
//  NUEVO: GESTIÓN DE VIVIENDAS (EXPEDIENTES TIPO TRELLO)
// ================================================================

// Definimos la carpeta y el archivo JSON
const VIVIENDAS_DIR = path.join(__dirname, 'viviendas');
const VIVIENDAS_FILE = path.join(VIVIENDAS_DIR, 'viviendas.json');

app.post('/api/viviendas', (req, res) => {
  try {
    // 1. Crear carpeta si no existe
    if (!fs.existsSync(VIVIENDAS_DIR)) {
      fs.mkdirSync(VIVIENDAS_DIR, { recursive: true });
    }

    // 2. Leer archivo actual o iniciar array vacío
    let viviendas = [];
    if (fs.existsSync(VIVIENDAS_FILE)) {
      const data = fs.readFileSync(VIVIENDAS_FILE, 'utf-8');
      try {
        viviendas = JSON.parse(data);
        if (!Array.isArray(viviendas)) viviendas = [];
      } catch (e) {
        viviendas = [];
      }
    }

    // 3. Crear el nuevo objeto (Expediente)
    // Generamos un ID simple basado en el timestamp para poder identificarlo luego en el Trello
    const nuevoExpediente = {
      id: Date.now(), // ID único
      ...req.body
    };

    // 4. Añadir al array y guardar
    viviendas.push(nuevoExpediente);
    fs.writeFileSync(VIVIENDAS_FILE, JSON.stringify(viviendas, null, 2));

    console.log(`--> Nuevo expediente de vivienda guardado. ID: ${nuevoExpediente.id}`);
    
    res.status(200).json({ 
      message: 'Expediente guardado correctamente', 
      id: nuevoExpediente.id 
    });

  } catch (error) {
    console.error('Error guardando vivienda:', error);
    res.status(500).json({ error: 'Error interno al guardar el expediente' });
  }
});

// Endpoint GET opcional por si quieres listar las viviendas (para el Trello)
app.get('/api/viviendas', (req, res) => {
  try {
    if (fs.existsSync(VIVIENDAS_FILE)) {
      const data = fs.readFileSync(VIVIENDAS_FILE, 'utf-8');
      res.json(JSON.parse(data));
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error leyendo viviendas:', error);
    res.status(500).json({ error: 'Error al leer viviendas' });
  }
});

app.put('/api/viviendas/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const nuevosDatos = req.body;

    if (!fs.existsSync(VIVIENDAS_FILE)) {
      return res.status(404).json({ error: 'No existe el archivo de datos' });
    }

    const data = fs.readFileSync(VIVIENDAS_FILE, 'utf-8');
    let viviendas = JSON.parse(data);

    const index = viviendas.findIndex(v => v.id === id);

    if (index !== -1) {
      viviendas[index] = { ...viviendas[index], ...nuevosDatos };
      fs.writeFileSync(VIVIENDAS_FILE, JSON.stringify(viviendas, null, 2));
      res.json({ message: 'Vivienda actualizada correctamente' });
    } else {
      res.status(404).json({ error: 'Vivienda no encontrada' });
    }
  } catch (error) {
    console.error('Error actualizando vivienda:', error);
    res.status(500).json({ error: 'Error interno al actualizar' });
  }
});

const MEMORIAS_DIR = path.join(__dirname, 'memorias_tecnicas');
const MEMORIAS_FILE = path.join(MEMORIAS_DIR, 'memorias.json');

// 1. Guardar (Crear o Editar) una Memoria
app.post('/api/memorias', (req, res) => {
  try {
    // Asegurar que existe la carpeta
    if (!fs.existsSync(MEMORIAS_DIR)) {
      fs.mkdirSync(MEMORIAS_DIR, { recursive: true });
    }

    // Leer archivo existente o iniciar array
    let memorias = [];
    if (fs.existsSync(MEMORIAS_FILE)) {
      try {
        const data = fs.readFileSync(MEMORIAS_FILE, 'utf-8');
        memorias = JSON.parse(data);
        if (!Array.isArray(memorias)) memorias = [];
      } catch (e) {
        memorias = [];
      }
    }

    const datosEntrantes = req.body;
    let memoriaGuardada;

    // Lógica: Si trae ID, buscamos y actualizamos. Si no, creamos nuevo.
    if (datosEntrantes.id) {
      // --- EDICIÓN ---
      const index = memorias.findIndex(m => m.id === datosEntrantes.id);
      if (index !== -1) {
        // Actualizamos mezclando datos antiguos con nuevos
        memorias[index] = { ...memorias[index], ...datosEntrantes, fechaEdicion: new Date().toISOString() };
        memoriaGuardada = memorias[index];
        console.log(`--> Memoria Técnica actualizada. ID: ${memoriaGuardada.id}`);
      } else {
        // Traía ID pero no existía (raro, pero lo tratamos como nuevo)
        memorias.push(datosEntrantes);
        memoriaGuardada = datosEntrantes;
      }
    } else {
      // --- CREACIÓN ---
      const nuevaMemoria = {
        ...datosEntrantes,
        id: Date.now(), // Generamos ID único basado en tiempo
        fechaCreacion: new Date().toISOString()
      };
      memorias.push(nuevaMemoria);
      memoriaGuardada = nuevaMemoria;
      console.log(`--> Nueva Memoria Técnica creada. ID: ${nuevaMemoria.id}`);
    }

    // Guardar en disco
    fs.writeFileSync(MEMORIAS_FILE, JSON.stringify(memorias, null, 2));

    // Devolver ID al frontend
    res.json({ 
      message: 'Memoria guardada correctamente', 
      id: memoriaGuardada.id 
    });

  } catch (error) {
    console.error('Error guardando memoria técnica:', error);
    res.status(500).json({ error: 'Error al guardar la memoria en el servidor' });
  }
});

// 2. Obtener una memoria por ID (Para cargar datos futuros)
app.get('/api/memorias/:id', (req, res) => {
  try {
    const idBuscado = Number(req.params.id);
    if (!fs.existsSync(MEMORIAS_FILE)) return res.status(404).json({ error: 'No hay datos' });

    const data = fs.readFileSync(MEMORIAS_FILE, 'utf-8');
    const memorias = JSON.parse(data);
    const memoria = memorias.find(m => m.id === idBuscado);

    if (memoria) res.json(memoria);
    else res.status(404).json({ error: 'Memoria no encontrada' });

  } catch (error) {
    console.error('Error leyendo memoria:', error);
    res.status(500).json({ error: 'Error interno leyendo datos' });
  }
});

// 3. Eliminar una memoria por ID
app.delete('/api/memorias/:id', (req, res) => {
  try {
    const idBuscado = Number(req.params.id);
    if (!Number.isFinite(idBuscado)) {
      return res.status(400).json({ error: 'ID invalido' });
    }

    if (!fs.existsSync(MEMORIAS_FILE)) {
      return res.status(404).json({ error: 'No hay memorias guardadas' });
    }

    const data = fs.readFileSync(MEMORIAS_FILE, 'utf-8');
    const memorias = JSON.parse(data);
    if (!Array.isArray(memorias)) {
      return res.status(500).json({ error: 'Formato de memorias invalido' });
    }

    const memoriasActualizadas = memorias.filter((m) => m.id !== idBuscado);

    if (memoriasActualizadas.length === memorias.length) {
      return res.status(404).json({ error: 'Memoria no encontrada' });
    }

    fs.writeFileSync(MEMORIAS_FILE, JSON.stringify(memoriasActualizadas, null, 2));
    res.json({ message: 'Memoria eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando memoria:', error);
    res.status(500).json({ error: 'Error interno eliminando memoria' });
  }
});

// 4. Obtener TODAS las memorias (Para la lista)
app.get('/api/memorias', (req, res) => {
  try {
    if (fs.existsSync(MEMORIAS_FILE)) {
      const data = fs.readFileSync(MEMORIAS_FILE, 'utf-8');
      const memorias = JSON.parse(data);
      res.json(memorias);
    } else {
      res.json([]); // Si no existe el archivo, devolvemos un array vacío
    }
  } catch (error) {
    console.error('Error leyendo lista de memorias:', error);
    res.status(500).json({ error: 'Error interno leyendo lista' });
  }
});

// ================================================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor completo corriendo en http://0.0.0.0:${PORT}`);
});
