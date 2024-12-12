const { auth } = require('../config/firebase');
const queryDatabase = require('../config/db'); // Koneksi MySQL
const bcrypt = require('bcryptjs');
const validator = require('validator');

// Register Dokter
const registerDoctorWithEmail = async (req, res) => {
  const { name, email, password } = req.body;

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name cannot be empty' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const emailExists = await queryDatabase('SELECT email FROM doctors WHERE email = ?', [email]);
    if (emailExists.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const usernameExists = await queryDatabase('SELECT name FROM doctors WHERE name = ?', [name]);
    if (usernameExists.length > 0) {
      return res.status(400).json({ error: 'Name already in use' });
    }

    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = 'INSERT INTO doctors (name, email, password) VALUES (?, ?, ?)';
    await queryDatabase(sql, [name, email, hashedPassword]);

    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Account already registered' });
  }
};

// Login Dokter
const loginDoctor = async (req, res) => {
  const { login, password } = req.body;

 // Validasi input
 if (!login || login.trim().length === 0) {
  return res.status(400).json({ error: 'Login field is required' });
}
if (!password || password.trim().length === 0) {
  return res.status(400).json({ error: 'Password is required' });
}

try {
  // Tentukan apakah login menggunakan email atau username
  const isEmail = validator.isEmail(login);
  const sql = isEmail
    ? 'SELECT * FROM doctors WHERE email = ?'
    : 'SELECT * FROM doctors WHERE name = ?';
  const rows = await queryDatabase(sql, [login]);

  // Validasi jika user tidak ditemukan di database
  if (rows.length === 0) {
    return res.status(404).json({ error: 'User not found. Please check your username or email.' });
  }

  const user = rows[0];

  // Bandingkan password yang dimasukkan dengan yang ada di database
  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    return res.status(401).json({ error: 'Incorrect password. Please try again.' });
  }

    // Login ke Firebase
    const userCredential = await auth.signInWithEmailAndPassword(
      rows[0].email,
      password
    );

    // Jika login berhasil, hash password baru
    const hashedPassword = await bcrypt.hash(password, 10);

    // Perbarui password di database
    const updateSql = 'UPDATE doctors SET password = ? WHERE email = ?';
    await queryDatabase(updateSql, [hashedPassword, rows[0].email]);

    res.status(200).json({
      message: 'Login successful'});
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Account not registered' });
  }
};


// reset password
const resetPassword = async (req, res) => {
  const { email } = req.body;

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  try {
    // Cek apakah email ada di database
    const sql = 'SELECT * FROM doctors WHERE email = ?';
    const rows = await queryDatabase(sql, [email]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Email not registered' });
    }

    // Kirim email reset password melalui Firebase
    await auth.sendPasswordResetEmail(email);

    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ error: 'Make sure the email you enter is correct' });
  }
};

// Log out 
const logoutUser = async (req, res) => {
  try {
    // Mengecek apakah user sudah terautentikasi di Firebase
    const user = auth.currentUser;

    if (!user) {
      return res.status(401).json({ error: 'User is not logged in' });
    }

    // Jika user sudah login, lanjutkan dengan logout
    await auth.signOut();
    res.status(200).json({ message: 'User logged out successfully' });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ error: 'Failed to log out' });
  }
};


module.exports = {
  registerDoctorWithEmail,
  loginDoctor,
  resetPassword,
  logoutUser,
};
