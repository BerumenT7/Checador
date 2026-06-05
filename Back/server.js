require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/database');
const { PORT } = require('./src/config/env');

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

start();
