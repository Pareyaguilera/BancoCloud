require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Lista blanca de dominios autorizados
const dominiosPermitidos = [
  'http://localhost:5173',               // Entorno local de desarrollo
  'https://main.xxxxxxx.amplifyapp.com'  // Reemplazar más adelante con la URL final de Amplify
];

const opcionesCors = {
  origin: (origin, callback) => {
    // Permite herramientas locales/CLI (sin origin) o dominios en lista blanca
    if (!origin || dominiosPermitidos.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Petición bloqueada por política CORS de BancoCloud'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(opcionesCors));
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

// Ruta para consulta de cuentas
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
