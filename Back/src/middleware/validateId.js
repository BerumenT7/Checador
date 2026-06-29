function validateId(req, res, next) {
  const { id } = req.params;

  if (!id || !/^\d{1,8}$/.test(id)) {
    return res.status(400).json({ message: 'ID de empleado inválido. Solo números, máximo 5 dígitos.' });
  }

  next();
}

module.exports = validateId;
