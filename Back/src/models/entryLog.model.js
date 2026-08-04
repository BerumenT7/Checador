const { getPool, sql } = require('../config/database');

async function createEntry(claveChofer, nombreCompleto, departamento, estatus, tipoMovimiento, registradoPor, esPermiso = 0, fotoTicketBase64 = null, empresa = 'SIETE', idLocal = null, fechaHora = null) {
  const pool = getPool();
  const fotoBuffer = fotoTicketBase64 ? Buffer.from(fotoTicketBase64, 'base64') : null;
  const request = pool.request()
    .input('claveChofer',     sql.NVarChar(10),        claveChofer)
    .input('nombreCompleto',  sql.NVarChar(200),       nombreCompleto)
    .input('departamento',    sql.NVarChar(100),       departamento)
    .input('estatus',         sql.NVarChar(20),        estatus)
    .input('tipoMovimiento',  sql.NVarChar(10),        tipoMovimiento)
    .input('registradoPor',   sql.NVarChar(200),       registradoPor)
    .input('esPermiso',       sql.Bit,                 esPermiso ? 1 : 0)
    .input('fotoTicket',      sql.VarBinary(sql.MAX),  fotoBuffer)
    .input('empresa',         sql.NVarChar(50),        empresa)
    .input('idLocal',         sql.NVarChar(100),       idLocal || null)
    .input('fechaHora',       sql.DateTime2,           fechaHora ? new Date(fechaHora) : null);

  if (idLocal) {
    const existing = await pool.request()
      .input('idLocal', sql.NVarChar(100), idLocal)
      .query('SELECT Id FROM RegistroEntradas WHERE IdLocal = @idLocal');
    if (existing.recordset[0]) return { id: existing.recordset[0].Id, duplicate: true };
  }

  const result = await request.query(`
      INSERT INTO RegistroEntradas
        (ClaveChofer, NombreCompleto, Departamento, Estatus, TipoMovimiento, RegistradoPor, EsPermiso, FotoTicket, Empresa, IdLocal, FechaHora, FechaSincronizacion, FueOffline)
      OUTPUT INSERTED.Id
      VALUES
        (@claveChofer, @nombreCompleto, @departamento, @estatus, @tipoMovimiento, @registradoPor, @esPermiso, @fotoTicket, @empresa, @idLocal, COALESCE(@fechaHora, GETDATE()), CASE WHEN @idLocal IS NULL THEN NULL ELSE GETDATE() END, CASE WHEN @idLocal IS NULL THEN 0 ELSE 1 END)
    `);
  return { id: result.recordset[0].Id, duplicate: false };
}

async function getTodayEntries(empresa = null) {
  const pool = getPool();
  const req = pool.request();
  let empresaFilter = '';
  if (empresa) {
    req.input('empresa', sql.NVarChar(50), empresa);
    empresaFilter = 'AND Empresa = @empresa';
  }
  const result = await req.query(`
      SELECT
        Id,
        ClaveChofer,
        NombreCompleto,
        Departamento,
        Estatus,
        TipoMovimiento,
        RegistradoPor,
        EsPermiso,
        Empresa,
        CONVERT(varchar(19), FechaHora, 120) AS FechaHora
      FROM RegistroEntradas
      WHERE CAST(FechaHora AS DATE) = CAST(GETDATE() AS DATE)
      ${empresaFilter}
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

async function getEntriesByDateRange(fechaInicio, fechaFin, departamento = null, empresa = null, registradoPor = null) {
  const pool = getPool();
  const request = pool.request()
    .input('fechaInicio', sql.Date, fechaInicio)
    .input('fechaFin',    sql.Date, fechaFin);

  let filters = '';
  if (departamento) {
    request.input('departamento', sql.NVarChar(100), departamento);
    filters += ' AND Departamento = @departamento';
  }
  if (empresa) {
    request.input('empresa', sql.NVarChar(50), empresa);
    filters += ' AND Empresa = @empresa';
  }
  if (registradoPor) {
    request.input('registradoPor', sql.NVarChar(200), registradoPor);
    filters += ' AND RegistradoPor = @registradoPor';
  }

  const result = await request.query(`
      SELECT
        Id,
        ClaveChofer,
        NombreCompleto,
        Departamento,
        Estatus,
        TipoMovimiento,
        RegistradoPor,
        EsPermiso,
        Empresa,
        CONVERT(varchar(19), FechaHora, 120) AS FechaHora
      FROM RegistroEntradas
      WHERE CAST(FechaHora AS DATE) BETWEEN @fechaInicio AND @fechaFin
      ${filters}
      ORDER BY FechaHora DESC
    `);
  return result.recordset;
}

async function getEmployeeHistory(claveChofer, soloHoy = true) {
  const pool = getPool();
  const result = await pool.request()
    .input('ClaveChofer', sql.NVarChar(10), claveChofer)
    .input('SoloHoy',     sql.Bit,          soloHoy ? 1 : 0)
    .execute('sp_HistorialEmpleado');
  return result.recordset;
}

module.exports = { createEntry, getTodayEntries, getPhotoById, getEmployeeHistory, getEntriesByDateRange };
