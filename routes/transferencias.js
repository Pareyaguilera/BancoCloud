const express = require('express');
const router = express.Router();

// Base de datos simulada en memoria
let cuentas = [
    { numeroCuenta: '1111', usuarioSub: 'user123', saldo: 50000 },
    { numeroCuenta: '2222', usuarioSub: 'user123', saldo: 15000 },
    { numeroCuenta: '3333', usuarioSub: 'otroUser', saldo: 80000 }
];

let transferencias = [];

// 1. [Usuario] Crear transferencia entre cuentas propias
router.post('/', (req, res) => {
    const { origen, destino, monto, usuarioSub } = req.body;

    if (!origen || !destino || !monto || !usuarioSub) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const cOrigen = cuentas.find(c => c.numeroCuenta === origen);
    const cDestino = cuentas.find(c => c.numeroCuenta === destino);

    if (!cOrigen || !cDestino) {
        return res.status(404).json({ error: 'Una o ambas cuentas no existen' });
    }

    // Validar cuentas propias
    if (cOrigen.usuarioSub !== usuarioSub || cDestino.usuarioSub !== usuarioSub) {
        return res.status(403).json({ error: 'Solo se permiten transferencias entre cuentas propias' });
    }

    // Validar saldo
    if (cOrigen.saldo < monto) {
        return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    // Movimiento de fondos
    cOrigen.saldo -= monto;
    cDestino.saldo += monto;

    const nuevaTransferencia = {
        id: transferencias.length + 1,
        origen,
        destino,
        monto,
        usuarioSub,
        fecha: new Date().toISOString(),
        estado: 'COMPLETADA'
    };

    transferencias.push(nuevaTransferencia);
    res.status(201).json({ mensaje: 'Transferencia realizada', transferencia: nuevaTransferencia });
});

// 2. [Usuario] Consultar historial propio
router.get('/historial/:usuarioSub', (req, res) => {
    const { usuarioSub } = req.params;
    const historial = transferencias.filter(t => t.usuarioSub === usuarioSub);
    res.json(historial);
});

// 3. [Admin] Listar transferencias con filtros opcionales
router.get('/admin', (req, res) => {
    const { origen, estado } = req.query;
    let resultado = [...transferencias];

    if (origen) {
        resultado = resultado.filter(t => t.origen === origen);
    }
    if (estado) {
        resultado = resultado.filter(t => t.estado === estado);
    }

    res.json(resultado);
});

// 4. [Admin] Anular transferencia
router.put('/admin/:id/anular', (req, res) => {
    const { id } = req.params;
    const trans = transferencias.find(t => t.id === parseInt(id));

    if (!trans) {
        return res.status(404).json({ error: 'Transferencia no encontrada' });
    }

    if (trans.estado === 'ANULADA') {
        return res.status(400).json({ error: 'La transferencia ya está anulada' });
    }

    // Revertir saldos
    const cOrigen = cuentas.find(c => c.numeroCuenta === trans.origen);
    const cDestino = cuentas.find(c => c.numeroCuenta === trans.destino);

    if (cOrigen && cDestino) {
        cOrigen.saldo += trans.monto;
        cDestino.saldo -= trans.monto;
    }

    trans.estado = 'ANULADA';
    res.json({ mensaje: 'Transferencia anulada exitosamente', transferencia: trans });
});

module.exports = router;