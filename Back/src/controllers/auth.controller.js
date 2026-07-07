const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../config/database');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

const ALLOWED_DEPARTMENTS = ['sistemas', 'seguridad'];

// Cuentas virtuales (no ligadas a un empleado real en Choferes): casetas, kioscos, etc.
// Se identifican porque el LEFT JOIN no encuentra Departamento.
const VIRTUAL_USER_NAMES = {
  '12000': 'Base Siete',
  '12001': 'Clouthier',
};

async function login(req, res, next) {
  try {
    const { claveChofer, password } = req.body;

    if (!claveChofer || !password) {
      return res.status(400).json({ message: 'Clave de chofer y contraseña son requeridos.' });
    }

    const pool = getPool();

    const result = await pool.request()
      .input('claveChofer', sql.NVarChar(50), claveChofer)
      .input('password',    sql.NVarChar(sql.MAX), password)
      .query(`
        SELECT
          u.UsuarioID,
          u.ClaveChoferLink,
          u.RolApp,
          c.Nombre,
          c.ApellidoPaterno,
          c.ApellidoMaterno,
          LTRIM(RTRIM(
            ISNULL(c.Nombre, '') + ' ' +
            ISNULL(c.ApellidoPaterno, '') + ' ' +
            ISNULL(c.ApellidoMaterno, '')
          )) AS NombreCompleto,
          c.Departamento
        FROM [auth].[UsuariosHRMS] u
        LEFT JOIN [dbo].[Choferes] c ON c.ClaveChofer = u.ClaveChoferLink
        WHERE u.ClaveChoferLink = @claveChofer
          AND u.PasswordHash    = @password
          AND u.Activo          = 1
      `);

    const user = result.recordset[0];

    if (!user) {
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }

    const isVirtualUser = !user.Departamento;

    if (!isVirtualUser) {
      const dept = (user.Departamento || '').toLowerCase();
      const allowed = ALLOWED_DEPARTMENTS.some(d => dept.includes(d));

      if (!allowed) {
        return res.status(403).json({
          message: `Acceso denegado. Solo personal de Sistemas y Seguridad puede acceder.`,
        });
      }
    }

    const nombreCompleto = isVirtualUser
      ? (VIRTUAL_USER_NAMES[user.ClaveChoferLink] || `Caseta ${user.ClaveChoferLink}`)
      : user.NombreCompleto.trim();

    const payload = {
      claveChofer:   user.ClaveChoferLink,
      nombreCompleto,
      departamento:  isVirtualUser ? 'CASETA' : user.Departamento,
      rol:           user.RolApp,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({ token, user: payload });
  } catch (error) {
    next(error);
  }
}

module.exports = { login };
