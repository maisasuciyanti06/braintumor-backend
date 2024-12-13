const { Storage } = require('@google-cloud/storage');
const path = require('path');

const storage = new Storage({
  keyFilename:path.join(__dirname, '../serviceKey.json'),
  projectId:process.env.project_id, 
});

const bucket = storage.bucket('xray-images-patient');

module.exports = { bucket };
