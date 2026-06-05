const sql = require('mssql');
const { DB_CONFIG } = require('./env');

let pool = null;

async function connectDB() {
  try {
    pool = await sql.connect(DB_CONFIG);
    console.log('Conexión a SQL Server exitosa');
    return pool;
  } catch (error) {
    console.error('Error al conectar a SQL Server:', error.message);
    process.exit(1);
  }
}

function getPool() {
  if (!pool) throw new Error('Base de datos no conectada');
  return pool;
}

module.exports = { connectDB, getPool, sql };
