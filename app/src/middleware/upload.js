const multer = require('multer');
const path = require('path');

const DIR = process.env.UPLOAD_DIR || '/app/uploads';

const storage = multer.diskStorage({
  destination: DIR,
  filename: (req, file, cb) => {
    // Se conserva el nombre y la extensión originales del archivo
    const limpio = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${limpio}`);
  },
});

function fileFilter(req, file, cb) {
  if (file.mimetype && file.mimetype.startsWith('image/')) return cb(null, true);
  const err = new Error('Solo se permiten imágenes');
  err.status = 400;
  cb(err);
}

module.exports = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });