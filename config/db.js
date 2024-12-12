require('dotenv').config();
const mysql = require('mysql2');

// Konfigurasi koneksi dengan connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 30000 // Waktu tunggu (dalam milidetik)
});


// Memeriksa koneksi pool saat aplikasi dimulai
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database:', err.code, err.message);
    return;
  }
  console.log('Connected to the database with id ' + connection.threadId);
  connection.release();
});


// Fungsi untuk menjalankan query dengan Promise
const queryDatabase = (sql, params) => {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

module.exports = queryDatabase;