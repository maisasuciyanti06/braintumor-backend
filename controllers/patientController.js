const queryDatabase = require('../config/db');
const { bucket } = require('../config/storage.js');
const path = require('path');

// Helper function for validation
const validatePatientData = (data) => {
    const { id, name, age, gender, address, email} = data;
    const ageNumber = Number(age);
    if (!id || !name || !age || !gender || !address || !email) {
        throw new Error('Required fields missing');
    }
    if (isNaN(ageNumber) || ageNumber <= 0) {
        throw new Error('Invalid age');
    }
    const validGenders = ['laki-laki', 'perempuan'];
    if (!validGenders.includes(gender.toLowerCase())) {
        throw new Error('Invalid gender. Must be "laki-laki" or "perempuan".');
    }
    if (!email.includes('@')) {
        throw new Error('Invalid email. Must contain "@".');
    }
};

// Fungsi untuk upload gambar dan prediksi
const savePatient = async (req, res) => {
  const { id, name, age, gender, email, address, complications } = req.body;
  const image = req.file;

  if (!image) {
    return res.status(400).json({ error: 'Gambar harus di-upload.' });
  }

  try {
    validatePatientData({ id, name, age, gender, address, email});
    // Cek apakah ID pasien sudah ada di database
    const existingPatient = await queryDatabase(
      'SELECT * FROM patients WHERE id = ?',
      [id]
    );

    if (existingPatient.length > 0) {
      return res.status(400).json({ error: 'ID pasien sudah ada di database.' });
    }

    // Simpan data pasien ke database jika ID belum ada
    await queryDatabase(
      'INSERT INTO patients (id, name, age, gender, email, address, komplikasi) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, age, gender, email, address, complications]
    );

    // Generate nama file unik
    const timestamp = Date.now();
    const fileName = `${id}-${timestamp}-${image.originalname}`;

    // Upload gambar ke Storage
    const blob = bucket.file(fileName);
    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: image.mimetype,
    });

    blobStream.on('error', (err) => {
      console.error('Upload error:', err);
      return res.status(500).json({ error: 'Gagal mengunggah gambar ke Storage.' });
    });

    blobStream.on('finish', async () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      try {
        // Update URL gambar di database
        const result = await queryDatabase(
          'UPDATE patients SET xray_image_url = ? WHERE id = ?',
          [publicUrl, id]
        );

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Patient ID tidak ditemukan.' });
        }

        return res.status(201).json({
          message: 'Data pasien dan gambar berhasil disimpan.',
        });
      } catch (dbError) {
        console.error('Database error:', dbError);
        return res.status(500).json({ error: 'Gagal menyimpan URL ke database.' });
      }
    });

    blobStream.end(image.buffer);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
};

// get patient data
const getPatient = async (req, res) => {
  try {
      const { id } = req.params;
      if (!id) {
          return res.status(400).json({ message: 'Patient ID is required' });
      }

      const query = 'SELECT id, name, age, gender, address, email, komplikasi, created_at, update_at FROM patients WHERE id = ?';
      const patient = await queryDatabase(query, [id]);

      if (!patient || patient.length === 0) {
          return res.status(404).json({ message: 'Patient not found' });
      }

      res.status(200).json({ patient: patient[0] });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
  }
};

// update patient
const updatePatientData = async (req, res) => {
  try {
      // Fungsi untuk membuat nama file unik
      const generateFileName = (id, originalName) => {
          const extension = path.extname(originalName); 
          const timestamp = Date.now(); 
          return `${id}_${timestamp}${extension}`;
      };

      // Ambil data dari request body
      const { id, age, gender, address, email } = req.body;

      if (isNaN(age) || age < 0) {
          return res.status(400).json({ message: 'Umur tidak valid' });
      }

      // Pertama, update data pasien tanpa mengubah ID atau komplikasi
      const patientUpdateQuery = `
          UPDATE patients 
          SET age = ?, gender = ?, address = ?, email = ?
          WHERE id = ?
      `;
      const result = await queryDatabase(patientUpdateQuery, [age, gender, address, email, id]);

      if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Pasien tidak ditemukan' });
      }

      // Jika ada gambar baru (retake), update gambar di storage dan database
      if (req.file) {
          const image = req.file;  // Ambil file gambar baru
          const fileName = generateFileName(id, image.originalname); // Nama file gambar baru 

          // Mulai upload stream dengan file buffer
          const blob = bucket.file(fileName);
          const blobStream = blob.createWriteStream({
              resumable: false,
              contentType: image.mimetype,
          });

          blobStream.on('error', (err) => {
              console.error('Upload error:', err);
              return res.status(500).json({ error: 'Gagal mengunggah gambar baru' });
          });

          blobStream.on('finish', async () => {
              // Dapatkan URL publik dari gambar yang di-upload
              const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

              try {
                  // Simpan URL gambar baru ke database, menggantikan yang lama
                  const updateImageQuery = `
                      UPDATE patients 
                      SET xray_image_url = ? 
                      WHERE id = ?
                  `;
                  const imageUpdateResult = await queryDatabase(updateImageQuery, [publicUrl, id]);

                  if (imageUpdateResult.affectedRows === 0) {
                      return res.status(404).json({ error: 'ID pasien tidak ditemukan untuk pembaruan gambar' });
                  }

                  // Kirim respons sukses
                  res.status(200).json({
                      message: 'Data pasien dan gambar berhasil diperbarui',
                      publicUrl: publicUrl,  // url baru
                  });
              } catch (dbError) {
                  console.error('Database error:', dbError);
                  return res.status(500).json({ error: 'Gagal menyimpan URL gambar baru ke database' });
              }
          });

          // Mulai unggah file
          blobStream.end(image.buffer);
      } else {
          // Jika tidak ada gambar baru (retake), hanya update data pasien tanpa gambar
          res.status(200).json({ message: 'Data pasien berhasil diperbarui' });
      }

  } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
  }
};

// delete patient data
const deletePatientData = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'Patient ID is required' });
        }

        const patient = await queryDatabase('SELECT xray_image_url FROM patients WHERE id = ?', [id]);
        if (patient[0]?.xray_image_url) {
            const fileName = patient[0].xray_image_url.split('/').pop();
            await bucket.file(fileName).delete();
        }

        await queryDatabase('DELETE FROM patients WHERE id = ?', [id]);
        res.status(200).json({ message: 'Patient data deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    savePatient,
    updatePatientData,
    deletePatientData,
    getPatient,
};
