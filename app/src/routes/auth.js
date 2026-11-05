const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { wrap } = require('../utils');
const { firmarToken, autenticar } = require('../middleware/auth');

// Registro público: SIEMPRE crea compradores
router.post('/register', wrap(async (req, res) => {
  const { nombre, email, password } = req.body;
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'nombre, email y password son obligatorios' });
  }
  const hash = await bcrypt.hash(password, 10);
  try {
    const r = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol)
       VALUES ($1, $2, $3, 'comprador')
       RETURNING id, nombre, email, rol`,
      [nombre, email, hash]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Ese correo ya está registrado' });
    throw e;
  }
}));

// Login: "rol" es opcional (el selector Comprador/Vendedor del mockup)
router.post('/login', wrap(async (req, res) => {
  const { email, password, rol } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email y password son obligatorios' });
  }
  const r = await pool.query(
    'SELECT id, nombre, email, rol, password_hash FROM usuarios WHERE email = $1',
    [email]
  );
  const u = r.rows[0];
  const ok = u && (await bcrypt.compare(password, u.password_hash));
  if (!ok) return res.status(401).json({ error: 'Credenciales incorrectas' });
  if (rol && rol !== u.rol) {
    return res.status(403).json({ error: 'Ese usuario no tiene el rol seleccionado' });
  }
  res.json({
    token: firmarToken(u),
    usuario: { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol },
  });
}));

router.get('/me', autenticar, (req, res) => res.json(req.user));

module.exports = router;