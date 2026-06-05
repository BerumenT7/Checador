const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

const authRoutes    = require('./auth.routes');
const employeeRoutes = require('./employee.routes');
const entryLogRoutes = require('./entryLog.routes');

router.use('/auth',       authRoutes);
router.use('/employees',  authMiddleware, employeeRoutes);
router.use('/entry-log',  authMiddleware, entryLogRoutes);

module.exports = router;
