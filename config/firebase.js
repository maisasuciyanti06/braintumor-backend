// Mengimpor Firebase dan auth untuk versi 8.x.x
const firebase = require('firebase');
require('firebase/auth'); 
require('dotenv').config();

// Konfigurasi Firebase Anda
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);

// Mengakses auth
const auth = firebase.auth();


module.exports = { auth };
