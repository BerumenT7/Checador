const express = require('express');
const router = express.Router();
const { admitEmployee, getTodayLog, getEntryPhoto, getEmployeeHistoryCtrl, getEntriesRangeCtrl } = require('../controllers/entryLog.controller');

router.post('/', admitEmployee);
router.get('/today', getTodayLog);
router.get('/range', getEntriesRangeCtrl);
router.get('/history/:id', getEmployeeHistoryCtrl);
router.get('/:id/foto', getEntryPhoto);

module.exports = router;
