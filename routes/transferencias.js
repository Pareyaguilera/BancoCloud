const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. Crear transferencia con transacción segura
router.post('/', async (req, res) => {
  const { origen, destino, monto, usuarioSub } = req.body;

  if (!origen || !destino || !monto || !usuarioSub) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const montoNum = parseFloat(monto);
  if (isNaN(montoNum) || montoNum <= 0) {
    return res.status(400).json({ error: 'El monto debe ser un número positivo' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Validar cuenta de origen y saldo
    const [origenRows] = await connection.query(
      'SELECT * FROM cuentas WHERE numero_cuenta = ? AND usuario_sub = ? FOR UPDATE',
      [origen, usuarioSub]
    );

    if (origenRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Cuenta de origen no encontrada o no pertenece al usuario' });
    }

    if (parseFloat(origenRows[0].saldo) < montoNum) {
      await connection.rollback();
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    // Validar cuenta de destino
    const [destinoRows] = await connection.query(
      'SELECT * FROM cuentas WHERE numero_cuenta = ? FOR UPDATE',
      [destino]
    );

    if (destinoRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Cuenta de destino no existe' });
    }

    // Actualizar saldos
    await connection.query(
      'UPDATE cuentas SET saldo = saldo - ? WHERE numero_cuenta = ?',
      [montoNum, origen]
    );
    await connection.query(
      'UPDATE cuentas SET saldo = saldo + ? WHERE numero_cuenta = ?',
      [montoNum, destino]
    );

    // Insertar registro en historial
    const [resultado] = await connection.query(
      'INSERT INTO transferencias (cuenta_origen, cuenta_destino, monto, usuario_sub, estado) VALUES (?, ?, ?, ?, ?)',
      [origen, destino, montoNum, usuarioSub, 'COMPLETADA']
    );

    await connection.commit();

    res.status(201).json({
      mensaje: 'Transferencia realizada con éxito',
      transferenciaId: resultado.insertId,
      origen,
      destino,
      monto: montoNum
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error en transferencia:', error);
    res.status(500).json({ error: 'Error interno al procesar la transferencia', detalle: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// 2. Historial por usuario
router.get('/historial/:usuarioSub', async (req, res) => {
  try {
    const [filas] = await db.query(
      'SELECT * FROM transferencias WHERE usuario_sub = ? ORDER BY fecha DESC',
      [req.params.usuarioSub]
    );
    res.json(filas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Listado administrativo general
router.get('/admin', async (req, res) => {
  try {
    const [filas] = await db.query('SELECT * FROM transferencias ORDER BY fecha DESC');
    res.json(filas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
