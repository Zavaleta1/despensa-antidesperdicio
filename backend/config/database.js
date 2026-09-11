require("dotenv").config();

const sql = require("mssql");

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log("✅ Conectado a SQL Server");
        return pool;
    })
    .catch(error => {
        console.error("❌ Error de conexión a SQL Server:", error);
        throw error;
    });

module.exports = {
    sql,
    poolPromise
};