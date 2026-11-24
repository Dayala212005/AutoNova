const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { wrap } = require('../utils');
const { firmarToken, autenticar } = require('../middleware/auth');

// Protección contra fuerza bruta en el login
const MAX_INTENTOS = 5;        // fallos seguidos antes de bloquear
const MINUTOS_BLOQUEO = 15;    // duración del bloqueo
// Hash falso para igualar el tiempo de respuesta cuando el correo no existe
const HASH_FALSO = bcrypt.hashSync('relleno-no-es-una-clave', 10);

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

router.post('/login', wrap(async (req, res) => {
  const { email, password, rol } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email y password son obligatorios' });
  }
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  // La comparación con la hora se hace en SQL (NOW()) para no depender del reloj de Node
  const r = await pool.query(
    `SELECT id, nombre, email, rol, password_hash, bloqueado_hasta,
            (bloqueado_hasta IS NOT NULL AND bloqueado_hasta > NOW()) AS esta_bloqueado,
            GREATEST(CEIL(EXTRACT(EPOCH FROM (bloqueado_hasta - NOW()))), 0)::int AS segundos_restantes
     FROM usuarios WHERE email = $1`,
    [email]
  );
  const u = r.rows[0];

  if (!u) {
    // Comparación falsa: un correo inexistente tarda lo mismo que uno real
    await bcrypt.compare(password, HASH_FALSO);
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  // Bloqueo vigente: no se revisa la contraseña ni se suma otro intento
  if (u.esta_bloqueado) {
    const minutos = Math.max(1, Math.ceil(u.segundos_restantes / 60));
    res.set('Retry-After', String(u.segundos_restantes));
    return res.status(429).json({
      error: `Cuenta bloqueada temporalmente por demasiados intentos. Intenta de nuevo en ${minutos} min.`,
    });
  }

  // Bloqueo ya vencido: se reinicia el contador para empezar de cero
  if (u.bloqueado_hasta) {
    await pool.query(
      'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = $1',
      [u.id]
    );
  }

  const ok = await bcrypt.compare(password, u.password_hash);

  if (!ok) {
    // Atómico: en un UPDATE, "intentos_fallidos" a la derecha es el valor ANTERIOR,
    // por eso se compara intentos_fallidos + 1 contra el máximo.
    // Así 50 peticiones simultáneas no pueden pisarse el contador entre sí.
    await pool.query(
      `UPDATE usuarios
       SET intentos_fallidos = intentos_fallidos + 1,
           bloqueado_hasta = CASE
             WHEN intentos_fallidos + 1 >= $2::int
             THEN NOW() + ($3::int * INTERVAL '1 minute')
             ELSE bloqueado_hasta END
       WHERE id = $1`,
      [u.id, MAX_INTENTOS, MINUTOS_BLOQUEO]
    );
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  // Contraseña correcta: se reinicia el contador
  await pool.query(
    'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = $1',
    [u.id]
  );

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