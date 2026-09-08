require('dotenv').config();
const express = require('express');
const cors = require('cors');

const transferenciasRouter = require('./routes/transferencias')

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Endpoint de prueba

app.use('/api/transferencias', transferenciasRouter);

app.get('/api/status', (req, res) => {
    res.json({ ok: true, mensaje: 'Backend Banco Cloud operativo' });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

git branch -M main
git remote add origin https://github.com/Pareyaguilera/BancoCloud.git
    git push -u origin main

git remote set-url origin https://github.com/Pareyaguilera/BancoCloud.git

    git remote add origin https://github.com/Pareyaguilera/BancoCloud.git