const { Storage } = require('@google-cloud/storage');
const path = require('path');
// Setel kredensial untuk service account secara eksplisit
const storage = new Storage({
  keyFilename:path.join(__dirname, '../serviceKey.json'),
  projectId:process.env.project_id, // Pastikan variabel ini berisi path file JSON key Anda
});

const bucket = storage.bucket('xray-images-patient');

module.exports = { bucket };
