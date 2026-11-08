const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { wrap, ROLES, esEnteroPositivo } = require('../utils');
const { autenticar, requiereRol } = require('../middleware/auth');

const COLS = 'id, nombre, email, rol, creado_en';

// Todo este módulo es solo para el admin
router.use(autenticar, requiereRol('admin'));

router.get('/', wrap(async (req, res) => {
  const r = await pool.query(`SELECT ${COLS} FROM usuarios ORDER BY id`);
  res.json(r.rows);
}));

router.get('/:id', wrap(async (req, res) => {
  if (!esEnteroPositivo(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
  const r = await pool.query(`SELECT ${COLS} FROM usuarios WHERE id = $1`, [req.params.id]);
  if (!r.rowCount) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(r.rows[0]);
}));

// Crear usuario con cualquier rol (así se crean los vendedores)
router.post('/', wrap(async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  if (!nombre || !email || !password || !ROLES.includes(rol)) {
    return res.status(400).json({ error: 'nombre, email, password y un rol válido son obligatorios' });
  }
  const hash = await bcrypt.hash(password, 10);
  try {
    const r = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol)
       VALUES ($1, $2, $3, $4) RETURNING ${COLS}`,
      [nombre, email, hash, rol]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Ese correo ya está registrado' });
    throw e;
  }
}));

router.put('/:id', wrap(async (req, res) => {
  if (!esEnteroPositivo(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
  const { nombre, email, password, rol } = req.body;
  if (rol !== undefined && !ROLES.includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }
  const hash = password ? await bcrypt.hash(password, 10) : null;
  try {
    const r = await pool.query(
      `UPDATE usuarios SET
         nombre = COALESCE($1, nombre),
         email = COALESCE($2, email),
         password_hash = COALESCE($3, password_hash),
         rol = COALESCE($4, rol)
       WHERE id = $5 RETURNING ${COLS}`,
      [nombre ?? null, email ?? null, hash, rol ?? null, req.params.id]
    );
    if (!r.rowCount) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(r.rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Ese correo ya está registrado' });
    throw e;
  }
}));

router.delete('/:id', wrap(async (req, res) => {
  if (!esEnteroPositivo(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'No puedes borrar tu propia cuenta' });
  }
  try {
    const r = await pool.query('DELETE FROM usuarios WHERE id = $1', [req.params.id]);
    if (!r.rowCount) return res.status(404).json({ error: 'Usuario no encontrado' });
  } catch (e) {
    if (e.code === '23503') {
      return res.status(409).json({ error: 'El usuario tiene productos o facturas asociadas' });
    }
    throw e;
  }
  res.status(204).end();
}));

module.exports = router;