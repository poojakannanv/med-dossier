require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { startCronJobs } = require('./services/cronService');

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    startCronJobs();
    app.listen(PORT, () => {
      console.log(`MedDossier API listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    });
  } catch (err) {
    console.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

start();
