const express = require('express');
const router = express.Router();
const { getEmployeeById, getEmployeePhoto, getEmployeeThumbnail, getDepartamentosCtrl } = require('../controllers/employee.controller');
const validateId = require('../middleware/validateId');

router.get('/meta/departamentos', getDepartamentosCtrl);
router.get('/:id', validateId, getEmployeeById);
router.get('/:id/foto', validateId, getEmployeePhoto);
router.get('/:id/foto/thumbnail', validateId, getEmployeeThumbnail);

module.exports = router;
