const express = require('express');
const router = express.Router();
const { 
  registerDoctorWithEmail,  
  loginDoctor, 
  logoutUser, 
  resetPassword 
} = require('../controllers/authControllers');

router.post('/register', registerDoctorWithEmail); 
router.post('/login', loginDoctor);  
router.post('/logout', logoutUser);  
router.post('/reset-password', resetPassword); 

module.exports = router;