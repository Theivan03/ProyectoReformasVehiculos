const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

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
