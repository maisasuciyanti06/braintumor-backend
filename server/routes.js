// routes.js
const  express = require ('express');
const { registerDoctorWithEmail, loginDoctor, logoutUser, resetPassword} = ('../controllers/authControllers');
const { savePatient, updatePatientData, deletePatientData, getPatient} = ('../controllers/patientController');
const upload = require('../config/multerConfig');
const router = express.Router();

router.post('/register', registerDoctorWithEmail);  // Register dengan email/password
router.post('/login', loginDoctor);  // Login dengan email/username dan password
router.post('/reset-password', resetPassword);  // Reset password
router.post('/logout', logoutUser);  // Logout user

router.post('/', upload, savePatient);
router.put('/:id', updatePatientData);
router.get('/:id', getPatient);
router.delete('/:id', deletePatientData);

export default router;