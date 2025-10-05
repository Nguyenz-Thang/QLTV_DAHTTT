// config/db.js
const sql = require("mssql");
const dotenv = require("dotenv");
dotenv.config();

const dbConfig = {
  user: process.env.DB_USER || "",
  password: process.env.DB_PASSWORD || "",
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT || "1433", 10),
  options: {
    encrypt: false, // set true nếu dùng Azure
    trustServerCertificate: true, // cho local dev
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

if (process.env.DB_INSTANCE) {
  dbConfig.options.instanceName = process.env.DB_INSTANCE;
}

let poolPromise = null;

async function getPool() {
  if (poolPromise) return poolPromise;
  poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then((pool) => {
      console.log("✅ Connected to SQL Server");
      return pool;
    })
    .catch((err) => {
      console.error("❌ DB Connection Failed -", err);
      poolPromise = null;
      throw err;
    });
  return poolPromise;
}

module.exports = {
  sql,
  getPool,
};
