const { getPool, sql } = require('../config/database');
const { SimpleCache } = require('../utils/cache');
const sharp = require('sharp');

const cache = new SimpleCache(300000);

async function findById(claveChofer) {
  const cacheKey = `emp_${claveChofer}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const pool = getPool();
  const result = await pool.request()
    .input('claveChofer', sql.NVarChar(10), claveChofer)
    .query(`
      SELECT
        ClaveChofer                                                           AS NumEmpleado,
        LTRIM(RTRIM(
          ISNULL(Nombre, '') + ' ' +
          ISNULL(ApellidoPaterno, '') + ' ' +
          ISNULL(ApellidoMaterno, '')
        ))                                                                    AS NombreCompleto,
        ISNULL(Departamento, '')                                              AS Departamento,
        ISNULL(Puesto, '')                                                    AS Puesto,
        CASE WHEN Activo = 1 THEN 'ACTIVE' ELSE 'INACTIVE' END               AS Estatus,
        CASE WHEN Foto IS NOT NULL THEN 1 ELSE 0 END                        AS TieneFoto
      FROM [dbo].[Choferes]
      WHERE ClaveChofer = @claveChofer
    `);

  const row = result.recordset[0];
  if (!row) return null;

  const employee = {
    NumEmpleado:    row.NumEmpleado,
    NombreCompleto: row.NombreCompleto.trim(),
    Departamento:   row.Departamento,
    Puesto:         row.Puesto,
    Estatus:        row.Estatus,
    TieneFoto:      row.TieneFoto === 1,
  };

  cache.set(cacheKey, employee);
  return employee;
}

async function findPhotoById(claveChofer) {
  const pool = getPool();
  const result = await pool.request()
    .input('claveChofer', sql.NVarChar(10), claveChofer)
    .query('SELECT Foto FROM [dbo].[Choferes] WHERE ClaveChofer = @claveChofer');

  const row = result.recordset[0];
  if (!row || !row.Foto) return null;
  return Buffer.from(row.Foto).toString('base64');
}

async function findThumbnailById(claveChofer) {
  const cacheKey = `thumb_${claveChofer}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const pool = getPool();
  const result = await pool.request()
    .input('claveChofer', sql.NVarChar(10), claveChofer)
    .query('SELECT Foto FROM [dbo].[Choferes] WHERE ClaveChofer = @claveChofer');

  const row = result.recordset[0];
  if (!row || !row.Foto) return null;

  const resized = await sharp(Buffer.from(row.Foto))
    .resize(80, 100, { fit: 'cover' })
    .jpeg({ quality: 70, progressive: true })
    .toBuffer();

  const base64 = resized.toString('base64');
  cache.set(cacheKey, base64);
  return base64;
}

function invalidateCache(claveChofer) {
  cache.del(`emp_${claveChofer}`);
  cache.del(`thumb_${claveChofer}`);
}

module.exports = { findById, findPhotoById, findThumbnailById, invalidateCache };
