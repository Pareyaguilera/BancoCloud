const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. Crear transferencia entre cuentas propias con transacción segura
router.post('/', async (req, res) => {
  const { origen, destino, monto, usuarioSub } = req.body;

  if (!origen || !destino || !monto || !usuarioSub) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  if (origen === destino) {
    return res.status(400).json({ error: 'La cuenta de origen y destino no pueden ser iguales' });
  }

  const montoNum = parseFloat(monto);
  if (isNaN(montoNum) || montoNum <= 0) {
    return res.status(400).json({ error: 'El monto debe ser un número positivo' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Validar cuenta de origen, pertenencia y saldo
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

    // Validar que la cuenta de destino exista y pertenezca al mismo usuario (cuentas propias)
    const [destinoRows] = await connection.query(
      'SELECT * FROM cuentas WHERE numero_cuenta = ? AND usuario_sub = ? FOR UPDATE',
      [destino, usuarioSub]
    );

    if (destinoRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Cuenta de destino no existe o no pertenece al usuario' });
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

    // Registrar transferencia
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

// 3. Listar transferencias con filtros (Admin)
router.get('/admin', async (req, res) => {
  try {
    const { estado, cuenta, usuarioSub } = req.query;
    let sql = 'SELECT * FROM transferencias WHERE 1=1';
    const params = [];

    if (estado) {
      sql += ' AND estado = ?';
      params.push(estado);
    }
    if (cuenta) {
      sql += ' AND (cuenta_origen = ? OR cuenta_destino = ?)';
      params.push(cuenta, cuenta);
    }
    if (usuarioSub) {
      sql += ' AND usuario_sub = ?';
      params.push(usuarioSub);
    }

    sql += ' ORDER BY fecha DESC';

    const [filas] = await db.query(sql, params);
    res.json(filas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Anular transferencia (Admin) - revierte saldos
router.put('/admin/anular/:id', async (req, res) => {
  const { id } = req.params;
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [trans] = await connection.query(
      'SELECT * FROM transferencias WHERE id = ? FOR UPDATE',
      [id]
    );

    if (trans.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Transferencia no encontrada' });
    }

    const t = trans[0];
    if (t.estado === 'ANULADA') {
      await connection.rollback();
      return res.status(400).json({ error: 'La transferencia ya se encuentra anulada' });
    }

    const montoNum = parseFloat(t.monto);

    // Reintegrar: devolver monto a cuenta_origen y descontar de cuenta_destino
    await connection.query(
      'UPDATE cuentas SET saldo = saldo + ? WHERE numero_cuenta = ?',
      [montoNum, t.cuenta_origen]
    );
    await connection.query(
      'UPDATE cuentas SET saldo = saldo - ? WHERE numero_cuenta = ?',
      [montoNum, t.cuenta_destino]
    );

    // Cambiar estado a ANULADA
    await connection.query(
      'UPDATE transferencias SET estado = ? WHERE id = ?',
      ['ANULADA', id]
    );

    await connection.commit();
    res.json({ mensaje: 'Transferencia anulada exitosamente y saldos revertidos', transferenciaId: id });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al anular:', error);
    res.status(500).json({ error: 'Error al anular la transferencia', detalle: error.message });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
