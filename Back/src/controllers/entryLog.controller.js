const EntryLogModel = require('../models/entryLog.model');
const EmployeeModel  = require('../models/employee.model');

async function admitEmployee(req, res, next) {
  try {
    const {
      numEmpleado,
      tipoMovimiento = 'ENTRADA',
      esPermiso = false,
      fotoTicket = null,
      empresa = 'SIETE',
      idLocal = null,
      fechaHora = null,
    } = req.body;

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

    const result = await EntryLogModel.createEntry(
      employee.NumEmpleado,
      employee.NombreCompleto,
      employee.Departamento,
      'ADMITTED',
      tipoMovimiento,
      registradoPor,
      esPermiso,
      fotoTicket,
      empresa,
      idLocal,
      fechaHora,
    );

    res.status(result.duplicate ? 200 : 201).json({
      message: result.duplicate ? 'Registro ya sincronizado' : 'Registro guardado',
      id: result.id,
      employee,
      tipoMovimiento,
      esPermiso,
      duplicate: result.duplicate,
    });
  } catch (error) {
    next(error);
  }
}

async function getTodayLog(req, res, next) {
  try {
    const empresa = req.query.empresa || null;
    const entries = await EntryLogModel.getTodayEntries(empresa);
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

async function getEntriesRangeCtrl(req, res, next) {
  try {
    const { desde, hasta, departamento, empresa, registradoPor } = req.query;
    if (!desde || !hasta) {
      return res.status(400).json({ message: 'Los parámetros desde y hasta son requeridos.' });
    }
    const entries = await EntryLogModel.getEntriesByDateRange(desde, hasta, departamento || null, empresa || null, registradoPor || null);
    res.json(entries);
  } catch (error) {
    next(error);
  }
}

async function getEmployeeHistoryCtrl(req, res, next) {
  try {
    const { id } = req.params;
    const soloHoy = req.query.soloHoy !== 'false';
    const entries = await EntryLogModel.getEmployeeHistory(id, soloHoy);
    res.json(entries);
  } catch (error) {
    next(error);
  }
}

module.exports = { admitEmployee, getTodayLog, getEntryPhoto, getEmployeeHistoryCtrl, getEntriesRangeCtrl };
