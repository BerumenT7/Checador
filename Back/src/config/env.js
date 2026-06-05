module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'checador_secret_change_in_prod',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',

  DB_CONFIG: {
    server:   process.env.DB_SERVER,
    port:     parseInt(process.env.DB_PORT) || 1433,
    database: process.env.DB_DATABASE,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
      encrypt:                process.env.DB_ENCRYPT === 'true',
      trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
    },
    requestTimeout: 15000,
    connectionTimeout: 10000,
    pool: {
      max: 20,
      min: 2,
      idleTimeoutMillis: 30000,
      acquireTimeoutMillis: 10000,
    },
  },
};
