const multer = require('multer');

// Konfigurasi penyimpanan untuk multer
const multerStorage = multer.memoryStorage();  // Menggunakan memoryStorage untuk menyimpan file sementara di buffer

// Konfigurasi batasan ukuran file
const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 10 * 1024 * 1024 },  // Maksimum ukuran file 10MB
}).single('image');  // Pastikan 'image' adalah nama field di form yang mengupload file

module.exports = upload;