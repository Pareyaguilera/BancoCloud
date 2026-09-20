require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Ruta de estado
app.get('/api/status', (req, res) => {
  res.json({ ok: true, mensaje: 'Backend Banco Cloud operativo' });
});

// Importar rutas de transferencias si existe el archivo
try {
  const transferenciasRoutes = require('./routes/transferencias');
  app.use('/api/transferencias', transferenciasRoutes);
  app.use('/api/trasferencias', transferenciasRoutes);
} catch (e) {
  console.log('Ruta de transferencias pendiente o no encontrada');
}

app.get('/api/cuentas', async (req, res) => {
  try {
    const db = require('./config/db');
    const [rows] = await db.query('SELECT * FROM cuentas');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor Banco Cloud escuchando en el puerto ${PORT}`);
});
