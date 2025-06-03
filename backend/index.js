const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = 3000;
const path = require('path');
const { imageSize } = require('image-size');

app.use(cors());
app.use(express.json());

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

app.get('/talleres', (req, res) => {
  const data = fs.readFileSync('./talleres.json', 'utf-8');
  res.json(JSON.parse(data));
});

app.post('/talleres', (req, res) => {
  fs.writeFileSync('./talleres.json', JSON.stringify(req.body, null, 2));
  res.status(200).send({ message: 'Talleres actualizados' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
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

app.use('/imgs', express.static(path.join(__dirname, 'imgs')));

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