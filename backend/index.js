const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const path = require('path');
const { imageSize } = require('image-size');

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

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