// Import dependencies
const express = require('express');
const {
    savePatient,
    updatePatientData,
    deletePatientData,
    getPatient } = require('../controllers/patientController');

const upload = require('../config/multerConfig');
const router = express.Router();


router.post('/', upload, savePatient);
router.put('/:id', upload, updatePatientData);
router.get('/:id', getPatient);
router.delete('/:id', deletePatientData);

module.exports = router;