const mysql = require('mysql2/promise');
require('dotenv').config();
(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'mocktest_lms',
    port: parseInt(process.env.DB_PORT) || 3306
  });

  await connection.execute(`UPDATE institutes SET maxStudents=10, maxBatches=1 WHERE subscriptionPlan='free'`);
  
  const [rows] = await connection.execute('SELECT name, maxStudents, maxBatches, subscriptionPlan FROM institutes');
  console.log(rows);
  await connection.end();
})();
