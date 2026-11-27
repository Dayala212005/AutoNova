const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  throw new Error('Falta JWT_SECRET en el .env');
}

function firmarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
    SECRET,
    { expiresIn: '8h' }
  );
}

function autenticar(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido o vencido' });
  }
}

function requiereRol(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tienes permiso' });
    }
    next();
  };
}

module.exports = { firmarToken, autenticar, requiereRol };