const router = require('express').Router();
const pool = require('../db');
const { wrap } = require('../utils');
const { autenticar, requiereRol } = require('../middleware/auth');

const IVA = 0.13;
const redondear = (n) => Math.round(n * 100) / 100;

// Generar factura (comprador). Body: { items: [{ producto_id, cantidad }] }
router.post('/', autenticar, requiereRol('comprador'), wrap(async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'Debes enviar al menos un producto' });
  }

  // Juntar repetidos y validar
  const pedido = new Map();
  for (const it of items) {
    const pid = Number(it.producto_id);
    const qty = Number(it.cantidad);
    if (!Number.isInteger(pid) || pid <= 0 || !Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ error: 'producto_id o cantidad inválidos' });
    }
    pedido.set(pid, (pedido.get(pid) || 0) + qty);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let subtotal = 0;
    const lineas = [];

    for (const pid of [...pedido.keys()].sort((a, b) => a - b)) {
      const qty = pedido.get(pid);
      const p = await client.query(
        'SELECT id, nombre, precio, stock FROM productos WHERE id = $1 FOR UPDATE',
        [pid]
      );
      if (!p.rowCount) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: `Producto ${pid} no existe` });
      }
      const prod = p.rows[0];
      if (prod.stock < qty) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: `Stock insuficiente de "${prod.nombre}"` });
      }
      await client.query('UPDATE productos SET stock = stock - $1 WHERE id = $2', [qty, pid]);
      const precio = Number(prod.precio); // el precio SIEMPRE sale de la BD
      subtotal += precio * qty;
      lineas.push({ producto_id: pid, nombre: prod.nombre, cantidad: qty, precio_unitario: precio });
    }

    subtotal = redondear(subtotal);
    const iva = redondear(subtotal * IVA);
    const total = redondear(subtotal + iva);

    const f = await client.query(
      'INSERT INTO facturas (cliente_id, total) VALUES ($1, $2) RETURNING id, creada_en',
      [req.user.id, total]
    );
    for (const l of lineas) {
      await client.query(
        `INSERT INTO factura_detalle (factura_id, producto_id, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4)`,
        [f.rows[0].id, l.producto_id, l.cantidad, l.precio_unitario]
      );
    }
    await client.query('COMMIT');

    res.status(201).json({
      id: f.rows[0].id,
      creada_en: f.rows[0].creada_en,
      cliente: req.user.nombre,
      detalle: lineas,
      subtotal, iva, total,
    });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}));

// Mis facturas (solo las del comprador logueado)
router.get('/', autenticar, requiereRol('comprador'), wrap(async (req, res) => {
  const r = await pool.query(
    'SELECT id, total, creada_en FROM facturas WHERE cliente_id = $1 ORDER BY creada_en DESC',
    [req.user.id]
  );
  res.json(r.rows);
}));


router.get('/ventas', autenticar, requiereRol('vendedor', 'admin'), wrap(async (req, res) => {
  const r = await pool.query(
    `SELECT fd.factura_id, p.nombre AS producto, fd.cantidad, f.creada_en
     FROM factura_detalle fd
     JOIN productos p ON p.id = fd.producto_id
     JOIN facturas f ON f.id = fd.factura_id
     WHERE p.vendedor_id = $1
     ORDER BY f.creada_en DESC`,
    [req.user.id]
  );
  res.json(r.rows);
}));


router.get('/:id', autenticar, wrap(async (req, res) => {
  try {
    const f = await pool.query(
      `SELECT f.id, f.total, f.creada_en, u.nombre AS cliente, u.email AS cliente_email
       FROM facturas f JOIN usuarios u ON u.id = f.cliente_id
       WHERE f.id = $1`,
      [req.params.id]
    );
    if (!f.rowCount) return res.status(404).json({ error: 'Factura no encontrada' });

    const d = await pool.query(
      `SELECT p.nombre, fd.cantidad, fd.precio_unitario
       FROM factura_detalle fd JOIN productos p ON p.id = fd.producto_id
       WHERE fd.factura_id = $1`,
      [req.params.id]
    );
    const subtotal = redondear(d.rows.reduce((s, l) => s + Number(l.precio_unitario) * l.cantidad, 0));
    const total = Number(f.rows[0].total);
    res.json({ ...f.rows[0], detalle: d.rows, subtotal, iva: redondear(total - subtotal), total });
  } catch (e) {
    if (e.code === '22P02') return res.status(404).json({ error: 'Factura no encontrada' });
    throw e;
  }
}));

module.exports = router;