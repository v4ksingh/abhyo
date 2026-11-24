const { sequelize } = require('./src/config/database'); 
sequelize.query("ALTER TABLE users MODIFY COLUMN role ENUM('superadmin', 'institute', 'student', 'instructor') DEFAULT 'student';")
  .then(()=> {console.log('done'); process.exit()})
  .catch(e => {console.log(e); process.exit(1)});
