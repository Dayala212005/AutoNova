const router = require('express').Router();
const pool = require('../db');
const upload = require('../middleware/upload');
const { wrap, esEnteroPositivo } = require('../utils');
const { autenticar, requiereRol } = require('../middleware/auth');

const COLS = 'id, nombre, descripcion, precio, stock, imagen_url, vendedor_id, creado_en';

// Catálogo público, con búsqueda opcional ?q=
router.get('/', wrap(async (req, res) => {
  const q = req.query.q ? `%${req.query.q}%` : null;
  const r = await pool.query(
    `SELECT ${COLS} FROM productos
     WHERE ($1::text IS NULL OR nombre ILIKE $1 OR descripcion ILIKE $1)
     ORDER BY id DESC`,
    [q]
  );
  res.json(r.rows);
}));

// Productos del vendedor logueado (va ANTES de /:id)
router.get('/mios', autenticar, requiereRol('vendedor', 'admin'), wrap(async (req, res) => {
  const r = await pool.query(
    `SELECT ${COLS} FROM productos WHERE vendedor_id = $1 ORDER BY id DESC`,
    [req.user.id]
  );
  res.json(r.rows);
}));

router.get('/:id', wrap(async (req, res) => {
  if (!esEnteroPositivo(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
  const r = await pool.query(`SELECT ${COLS} FROM productos WHERE id = $1`, [req.params.id]);
  if (!r.rowCount) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(r.rows[0]);
}));

// Crear producto (multipart/form-data, campo de archivo: "imagen")
router.post('/', autenticar, requiereRol('vendedor', 'admin'), upload.single('imagen'),
  wrap(async (req, res) => {
    const { nombre, descripcion, precio, stock } = req.body;
    if (!nombre || precio === undefined || stock === undefined) {
      return res.status(400).json({ error: 'nombre, precio y stock son obligatorios' });
    }
    if (!(Number(precio) >= 0) || !Number.isInteger(Number(stock)) || Number(stock) < 0) {
      return res.status(400).json({ error: 'precio o stock inválidos' });
    }
    const imagenUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const r = await pool.query(
      `INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url, vendedor_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${COLS}`,
      [nombre, descripcion || '', Number(precio), Number(stock), imagenUrl, req.user.id]
    );
    res.status(201).json(r.rows[0]);
  })
);

// Editar: el dueño (vendedor) o el admin
router.put('/:id', autenticar, requiereRol('vendedor', 'admin'), upload.single('imagen'),
  wrap(async (req, res) => {
    if (!esEnteroPositivo(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
    const actual = await pool.query('SELECT vendedor_id FROM productos WHERE id = $1', [req.params.id]);
    if (!actual.rowCount) return res.status(404).json({ error: 'Producto no encontrado' });
    if (req.user.rol !== 'admin' && actual.rows[0].vendedor_id !== req.user.id) {
      return res.status(403).json({ error: 'Ese producto no es tuyo' });
    }
    const { nombre, descripcion, precio, stock } = req.body;
    const r = await pool.query(
      `UPDATE productos SET
         nombre = COALESCE($1, nombre),
         descripcion = COALESCE($2, descripcion),
         precio = COALESCE($3, precio),
         stock = COALESCE($4, stock),
         imagen_url = COALESCE($5, imagen_url)
       WHERE id = $6 RETURNING ${COLS}`,
      [
        nombre ?? null,
        descripcion ?? null,
        precio !== undefined ? Number(precio) : null,
        stock !== undefined ? Number(stock) : null,
        req.file ? `/uploads/${req.file.filename}` : null,
        req.params.id,
      ]
    );
    res.json(r.rows[0]);
  })
);

router.delete('/:id', autenticar, requiereRol('vendedor', 'admin'), wrap(async (req, res) => {
  if (!esEnteroPositivo(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
  const actual = await pool.query('SELECT vendedor_id FROM productos WHERE id = $1', [req.params.id]);
  if (!actual.rowCount) return res.status(404).json({ error: 'Producto no encontrado' });
  if (req.user.rol !== 'admin' && actual.rows[0].vendedor_id !== req.user.id) {
    return res.status(403).json({ error: 'Ese producto no es tuyo' });
  }
  try {
    await pool.query('DELETE FROM productos WHERE id = $1', [req.params.id]);
  } catch (e) {
    if (e.code === '23503') {
      return res.status(409).json({ error: 'El producto ya aparece en facturas, no se puede borrar' });
    }
    throw e;
  }
  res.status(204).end();
}));

module.exports = router;