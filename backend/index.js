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

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Aumentado límite por si las imágenes base64 son grandes
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const uploadDocx = multer({ dest: 'uploads_docx/' });
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

const crearUsuarioAdminPorDefecto = async () => {
  const saltAdmin = await bcrypt.genSalt(10);
  const passwordHashedAdmin = await bcrypt.hash('123456', saltAdmin);

  const usuarioAdmin = {
    id: 1,
    usuario: 'admin',
    password: passwordHashedAdmin,
    rol: 'administrador'
  };

  const existeAdmin = baseDeDatosUsuariosServidor.find(u => u.usuario === 'admin');
  if (!existeAdmin) {
    baseDeDatosUsuariosServidor.push(usuarioAdmin);
    console.log('--> Usuario ADMIN creado: admin / 123456');
    guardarUsuariosEnDisco();
  }
};

crearUsuarioAdminPorDefecto();

app.post('/api/registro', async (req, res) => {
  const { usuarioRegistroApp, passwordRegistroApp, tipoUsuarioApp } = req.body;

  const saltServidor = await bcrypt.genSalt(10);
  const passwordHashedServidor = await bcrypt.hash(passwordRegistroApp, saltServidor);

  let siguienteId = 1;
  if (baseDeDatosUsuariosServidor.length > 0) {
    const idsExistentes = baseDeDatosUsuariosServidor.map(u => u.id);
    siguienteId = Math.max(...idsExistentes) + 1;
  }

  const nuevoUsuarioServidor = {
    id: siguienteId,
    usuario: usuarioRegistroApp,
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
const ULTIMO_PROYECTO_PATH = path.join(__dirname, 'ultimoProyecto.json');

app.get('/talleres', (req, res) => {
  try {
    const data = fs.readFileSync('./talleres.json', 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.json([]);
  }
});

app.post('/talleres', (req, res) => {
  fs.writeFileSync('./talleres.json', JSON.stringify(req.body, null, 2));
  res.status(200).send({ message: 'Talleres actualizados' });
});

app.delete('/talleres/:nombre', (req, res) => {
  const nombreAEliminar = decodeURIComponent(req.params.nombre).trim().toLowerCase();

  try {
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
    { name: 'postImage', maxCount: 30 },
  ]),
  (req, res) => {
    try {
      let metadata = JSON.parse(req.body.metadata);
      const num = String(metadata.numeroProyecto);
      const añoAhora = new Date().getFullYear().toString();

      const projectDir = path.join(__dirname, 'proyectos', num + "_" + añoAhora);
      
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
      const prevFiles = req.files['prevImage'] || [];
      prevFiles.forEach((file, idx) => {
        const fn = file.originalname || `prev-${idx}.png`;
        fs.writeFileSync(path.join(prevDir, fn), file.buffer);
      });

      // Guardar imágenes posteriores
      const postFiles = req.files['postImage'] || [];
      postFiles.forEach((file, idx) => {
        const fn = file.originalname || `post-${idx}.png`;
        fs.writeFileSync(path.join(postDir, fn), file.buffer);
      });

      // --- LÓGICA DE CONTADOR CORREGIDA ---
      let ultimoGuardado = 0;
      let añoGuardado = añoAhora;

      // 1. Leemos el contador actual si existe
      if (fs.existsSync(ULTIMO_PROYECTO_PATH)) {
        const raw = fs.readFileSync(ULTIMO_PROYECTO_PATH, 'utf-8');
        const data = JSON.parse(raw);
        ultimoGuardado = Number(data.ultimo);
        añoGuardado = data.año;
      }

      // 2. Solo actualizamos el contador si:
      //    a) El año ha cambiado (reseteo a lo que venga).
      //    b) Es el mismo año PERO el número que guardamos es MAYOR que el último registrado (es uno nuevo).
      const numActual = Number(num);

      if (añoAhora !== añoGuardado || numActual > ultimoGuardado) {
        const newCounter = { ultimo: num, año: añoAhora };
        fs.writeFileSync(
          ULTIMO_PROYECTO_PATH,
          JSON.stringify(newCounter, null, 2),
          'utf-8'
        );
        console.log(`Contador actualizado a: ${num} (${añoAhora})`);
      } else {
        console.log(`Edición detectada (Proyecto ${num}). El contador se mantiene en ${ultimoGuardado}.`);
      }
      // -------------------------------------

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
  const docxPath = path.resolve(req.file.path);
  const outputDir = path.join(__dirname, 'pdf_generados');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const pdfPath = path.join(outputDir, path.parse(docxPath).name + '.pdf');
  const comando = `"C:\\Program Files\\LibreOffice\\program\\soffice.exe"` +
    ` --headless --convert-to pdf "${docxPath}" --outdir "${outputDir}"`;

  exec(comando, (err, stdout, stderr) => {
    if (err) {
      console.error('Error convirtiendo a PDF:', stderr || err);
      return res.status(500).json({ error: 'Fallo al convertir a PDF' });
    }

    res.sendFile(pdfPath, (sendErr) => {
      if (sendErr) {
        console.error('Error enviando el PDF:', sendErr);
      }
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
  if (!fs.existsSync(proyectosDir)) {
      return res.json([]);
  }
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
        enviadoPorCliente: json.enviadoPorCliente || false,
      };
    } else {
      return { id: carpeta, nombre: carpeta, enviadoPorCliente: false };
    }
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
  const id = req.params.id;
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

// --- INGENIEROS & ARQUITECTOS ---
app.get('/ingenieros', (req, res) => {
  try {
    if (!fs.existsSync('./ingenieros.json')) {
        return res.json([]);
    }
    const raw = fs.readFileSync('./ingenieros.json', 'utf-8');
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
    if (!fs.existsSync('./arquitectos.json')) {
        return res.json([]);
    }
    const raw = fs.readFileSync('./arquitectos.json', 'utf-8');
    const data = JSON.parse(raw);

    const lista = Array.isArray(data) ? data : [data];
    res.json(lista);
  } catch (err) {
    console.error('Error al leer arquitectos.json:', err);
    res.status(500).json([]);
  }
});

app.post('/ingenieros', (req, res) => {
  try {
    fs.writeFileSync('./ingenieros.json', JSON.stringify(req.body, null, 2));
    res.status(200).send({ message: 'Ingenieros actualizados' });
  } catch (err) {
    console.error('Error guardando ingenieros:', err);
    res.status(500).send({ message: 'Error al guardar ingenieros' });
  }
});

app.post('/arquitectos', (req, res) => {
  try {
    fs.writeFileSync('./arquitectos.json', JSON.stringify(req.body, null, 2));
    res.status(200).send({ message: 'Ingenieros actualizados' });
  } catch (err) {
    console.error('Error guardando arquitectos:', err);
    res.status(500).send({ message: 'Error al guardar arquitectos' });
  }
});

app.delete('/ingenieros/:nombre', (req, res) => {
  try {
    const nombreAEliminar = decodeURIComponent(req.params.nombre)
      .trim()
      .toLowerCase();

    const raw = fs.readFileSync('./ingenieros.json', 'utf-8');
    let ingenieros = JSON.parse(raw);
    if (!Array.isArray(ingenieros)) ingenieros = [ingenieros];

    const filtrados = ingenieros.filter(
      (i) => i.nombre.trim().toLowerCase() !== nombreAEliminar
    );

    fs.writeFileSync('./ingenieros.json', JSON.stringify(filtrados, null, 2));
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

    const raw = fs.readFileSync('./arquitectos.json', 'utf-8');
    let arquitectos = JSON.parse(raw);
    if (!Array.isArray(arquitectos)) arquitectos = [arquitectos];

    const filtrados = arquitectos.filter(
      (i) => i.nombre.trim().toLowerCase() !== nombreAEliminar
    );

    fs.writeFileSync('./arquitectos.json', JSON.stringify(filtrados, null, 2));
    res.status(200).send({ message: 'Arquitecto eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar arquitecto:', err);
    res.status(500).send({ message: 'Error al eliminar arquitecto' });
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

// ================================================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor completo corriendo en http://0.0.0.0:${PORT}`);
});