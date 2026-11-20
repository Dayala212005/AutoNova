const multer = require('multer');
const path = require('path');

const DIR = process.env.UPLOAD_DIR || '/app/uploads';

const storage = multer.diskStorage({
  destination: DIR,
  filename: (req, file, cb) => {
    const limpio = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${limpio}`);
  },
});

module.exports = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });