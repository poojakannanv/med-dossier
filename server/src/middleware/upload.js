const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.resolve(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');

// Ensure the upload directory exists at startup.
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safeBase = path
      .basename(file.originalname)
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 120);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}-${safeBase}`);
  },
});

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv', '.png', '.jpg', '.jpeg', '.zip'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`File type ${ext || '(none)'} is not allowed`));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

module.exports = { upload, UPLOAD_DIR };
