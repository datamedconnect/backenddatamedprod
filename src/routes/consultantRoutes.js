const express = require('express');
const router = express.Router();
const consultantController = require('../controllers/consultantController');

router.post('/', consultantController.uploadCV);
router.get('/:id', consultantController.getConsultant);
router.put('/:id', consultantController.updateConsultant); 
router.get('/:id/details', consultantController.getConsultantById);

module.exports = router;