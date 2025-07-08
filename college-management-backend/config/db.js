//db.js

const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234", 
  database: "college_db" 
});
connection.connect((err) => {
  if (err) {
    console.error('DB connection failed:', err);
    return;
  }
  console.log('Connected to MySQL');
});
module.exports = connection;
