const multer = require('multer');
const multerStorage = multer.memoryStorage();  

const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 10 * 1024 * 1024 },  // Maksimum ukuran file 10MB
}).single('image');  // 'image' adalah nama field di form yang mengupload file

module.exports = upload;