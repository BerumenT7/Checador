const { getPool, sql } = require('../config/database');

async function createEntry(claveChofer, nombreCompleto, departamento, estatus, tipoMovimiento, registradoPor, esPermiso = 0, fotoTicketBase64 = null) {
  const pool = getPool();
  const fotoBuffer = fotoTicketBase64 ? Buffer.from(fotoTicketBase64, 'base64') : null;
  const result = await pool.request()
    .input('claveChofer',     sql.NVarChar(10),       claveChofer)
    .input('nombreCompleto',  sql.NVarChar(200),      nombreCompleto)
    .input('departamento',    sql.NVarChar(100),      departamento)
    .input('estatus',         sql.NVarChar(20),       estatus)
    .input('tipoMovimiento',  sql.NVarChar(10),       tipoMovimiento)
    .input('registradoPor',   sql.NVarChar(200),      registradoPor)
    .input('esPermiso',       sql.Bit,                esPermiso ? 1 : 0)
    .input('fotoTicket',      sql.VarBinary(sql.MAX), fotoBuffer)
    .query(`
      INSERT INTO RegistroEntradas
        (ClaveChofer, NombreCompleto, Departamento, Estatus, TipoMovimiento, RegistradoPor, EsPermiso, FotoTicket)
      OUTPUT INSERTED.Id
      VALUES
        (@claveChofer, @nombreCompleto, @departamento, @estatus, @tipoMovimiento, @registradoPor, @esPermiso, @fotoTicket)
    `);
  return result.recordset[0].Id;
}

async function getTodayEntries(limit = 200) {
  const pool = getPool();
  const result = await pool.request()
    .input('limit', sql.Int, limit)
    .query(`
      SELECT TOP (@limit)
        Id,
        ClaveChofer,
        NombreCompleto,
        Departamento,
        Estatus,
        TipoMovimiento,
        RegistradoPor,
        EsPermiso,
        CONVERT(varchar(19), FechaHora, 120) AS FechaHora
      FROM RegistroEntradas
      WHERE CAST(FechaHora AS DATE) = CAST(GETDATE() AS DATE)
      ORDER BY FechaHora DESC
    `);
  return result.recordset;
}

async function getPhotoById(id) {
  const pool = getPool();
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query('SELECT FotoTicket FROM RegistroEntradas WHERE Id = @id');
  const row = result.recordset[0];
  if (!row || !row.FotoTicket) return null;
  return Buffer.from(row.FotoTicket).toString('base64');
}

module.exports = { createEntry, getTodayEntries, getPhotoById };
