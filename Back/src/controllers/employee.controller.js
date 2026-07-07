const EmployeeModel = require('../models/employee.model');

async function getEmployeeById(req, res, next) {
  try {
    const { id } = req.params;
    const employee = await EmployeeModel.findById(id);

    if (!employee) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    res.json(employee);
  } catch (error) {
    next(error);
  }
}

async function getEmployeePhoto(req, res, next) {
  try {
    const { id } = req.params;
    const base64 = await EmployeeModel.findPhotoById(id);
    if (!base64) return res.status(404).json({ message: 'Foto no encontrada' });
    res.json({ foto: base64 });
  } catch (error) {
    next(error);
  }
}

async function getEmployeeThumbnail(req, res, next) {
  try {
    const { id } = req.params;
    const base64 = await EmployeeModel.findThumbnailById(id);
    if (!base64) return res.status(404).json({ message: 'Foto no encontrada' });
    res.json({ foto: base64 });
  } catch (error) {
    next(error);
  }
}

async function getDepartamentosCtrl(req, res, next) {
  try {
    const departamentos = await EmployeeModel.getDepartamentos();
    res.json(departamentos);
  } catch (error) {
    next(error);
  }
}

module.exports = { getEmployeeById, getEmployeePhoto, getEmployeeThumbnail, getDepartamentosCtrl };
