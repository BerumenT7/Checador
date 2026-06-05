const EntryLogModel = require('../models/entryLog.model');
const EmployeeModel  = require('../models/employee.model');

async function admitEmployee(req, res, next) {
  try {
    const { numEmpleado, tipoMovimiento = 'ENTRADA', esPermiso = false, fotoTicket = null } = req.body;

    if (!['ENTRADA', 'SALIDA'].includes(tipoMovimiento)) {
      return res.status(400).json({ message: 'TipoMovimiento debe ser ENTRADA o SALIDA.' });
    }

    const employee = await EmployeeModel.findById(numEmpleado);
    if (!employee) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    if (employee.Estatus !== 'ACTIVE') {
      return res.status(403).json({ message: 'Empleado inactivo, acceso denegado' });
    }

    const registradoPor = req.user?.nombreCompleto || req.user?.claveChofer || 'Sistema';

    const newId = await EntryLogModel.createEntry(
      employee.NumEmpleado,
      employee.NombreCompleto,
      employee.Departamento,
      'ADMITTED',
      tipoMovimiento,
      registradoPor,
      esPermiso,
      fotoTicket
    );

    res.status(201).json({ message: 'Registro guardado', id: newId, employee, tipoMovimiento, esPermiso });
  } catch (error) {
    next(error);
  }
}

async function getTodayLog(req, res, next) {
  try {
    const entries = await EntryLogModel.getTodayEntries();
    res.json(entries);
  } catch (error) {
    next(error);
  }
}

async function getEntryPhoto(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });
    const base64 = await EntryLogModel.getPhotoById(id);
    if (!base64) return res.status(404).json({ message: 'Foto no encontrada' });
    res.json({ foto: base64 });
  } catch (error) {
    next(error);
  }
}

module.exports = { admitEmployee, getTodayLog, getEntryPhoto };
