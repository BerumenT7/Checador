const express = require('express');
const router = express.Router();
const { admitEmployee, getTodayLog, getEntryPhoto } = require('../controllers/entryLog.controller');

router.post('/', admitEmployee);
router.get('/today', getTodayLog);
router.get('/:id/foto', getEntryPhoto);

module.exports = router;
