const multer = require('multer');
const path = require('path');
const { AppError } = require('./error.middleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    image: /jpeg|jpg|png|gif|webp/,
    video: /mp4|webm|ogg|mov|mkv/,
    csv: /csv/,
    pdf: /pdf/,
  };

  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mime = file.mimetype;

  if (
    allowedTypes.image.test(ext) ||
    allowedTypes.video.test(ext) ||
    allowedTypes.csv.test(ext) ||
    allowedTypes.pdf.test(ext)
  ) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only images, videos, CSV, and PDF allowed.', 400));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100MB to allow videos
  },
});

module.exports = upload;
