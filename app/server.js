const express = require('express');

const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/productos', require('./src/routes/productos'));
app.use('/api/facturas', require('./src/routes/facturas'));
app.use('/api/usuarios', require('./src/routes/usuarios'));

app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Manejador global de errores
app.use((err, req, res, next) => {
  if (err.status) return res.status(err.status).json({ error: err.message });
  if (err.name === 'MulterError') return res.status(400).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(3000, () => console.log('App escuchando en 3000'));