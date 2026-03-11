const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { parseExcelFile } = require('../parser');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, 'data-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.xlsx') {
      cb(null, true);
    } else {
      cb(new Error('Pouze .xlsx soubory jsou povoleny'));
    }
  },
});

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nebyl nahrán žádný soubor' });
  }

  try {
    console.log(`Zpracovávám soubor: ${req.file.originalname} (${req.file.path})`);
    const results = parseExcelFile(req.file.path);
    console.log(`Úspěšně zpracováno ${results.length} měsíců:`, results.map(r => r.month).join(', '));
    res.json({
      message: 'Soubor úspěšně zpracován',
      months: results,
    });
  } catch (err) {
    console.error('=== CHYBA PŘI PARSOVÁNÍ ===');
    console.error('Soubor:', req.file.path);
    console.error('Chyba:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({
      error: 'Chyba při zpracování souboru: ' + err.message,
      details: err.stack,
    });
  }
});

module.exports = router;
