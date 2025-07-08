const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");
require("dotenv").config();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "1234",
  database: process.env.DB_NAME || "college_db"
});

db.connect((err) => {
  if (err) {
    console.error("MySQL connection error:", err);
    process.exit(1);
  }
  console.log("Connected to MySQL database.");
});

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("JWT verification error:", err);
      return res.status(403).json({ message: "Invalid token" });
    }
    
    req.user = decoded;
    next();
  });
};

// Student Dashboard
app.get("/api/student/:id/student-dashboard", authMiddleware, (req, res) => {
  const studentId = req.params.id;

  const studentSql = "SELECT name FROM students WHERE id = ?";
  db.query(studentSql, [studentId], (err, studentResults) => {
    if (err) {
      console.error("DB error fetching student:", err);
      return res.status(500).json({ message: "Internal server error." });
    }

    if (studentResults.length === 0) {
      return res.status(404).json({ message: "Student not found." });
    }

    const studentName = studentResults[0].name;

    const courseSql = `
      SELECT c.id, c.name, sc.attendance, sc.grade
      FROM student_courses sc
      JOIN courses c ON sc.course_id = c.id
      WHERE sc.student_id = ?
    `;
    db.query(courseSql, [studentId], (err2, courseResults) => {
      if (err2) {
        console.error("DB error fetching courses:", err2);
        return res.status(500).json({ message: "Internal server error." });
      }

      const eventSql = `
        SELECT e.id, e.title, e.date, c.name AS course
        FROM events e
        JOIN courses c ON e.course_id = c.id
        WHERE e.student_id = ?
        ORDER BY e.date ASC
      `;
      db.query(eventSql, [studentId], (err3, eventResults) => {
        if (err3) {
          console.error("DB error fetching events:", err3);
          return res.status(500).json({ message: "Internal server error." });
        }

        res.json({
          name: studentName,
          role: 'student',
          courses: courseResults.map((c) => ({
            id: c.id,
            name: c.name,
            attendance: c.attendance,
            grade: c.grade,
          })),
          upcomingEvents: eventResults.map((e) => ({
            id: e.id,
            title: e.title,
            date: e.date,
            course: e.course,
          })),
        });
      });
    });
  });
});

// Teacher Dashboard
app.get("/api/teacher/:id/teacher-dashboard", authMiddleware, (req, res) => {
  const teacherId = req.params.id;

  const teacherSql = "SELECT name, department FROM teachers WHERE id = ?";
  db.query(teacherSql, [teacherId], (err, teacherResults) => {
    if (err) {
      console.error("DB error fetching teacher:", err);
      return res.status(500).json({ message: "Internal server error." });
    }

    if (teacherResults.length === 0) {
      return res.status(404).json({ message: "Teacher not found." });
    }

    const { name, department } = teacherResults[0];

       const defaultResponse = {
      name,
      department,
      role: 'teacher',
      courses: [],
      upcomingEvents: []
    };

    const courseSql = `
      SELECT c.id, c.name, c.code
      FROM teacher_courses tc
      JOIN courses c ON tc.course_id = c.id
      WHERE tc.teacher_id = ?
    `;
    db.query(courseSql, [teacherId], (err2, courseResults) => {
      if (err2) {
        console.error("DB error fetching courses:", err2);
        return res.status(500).json({ message: "Internal server error." });
      }

      const eventSql = `
        SELECT e.id, e.title, e.date, c.name AS course, 
               COUNT(s.id) AS student_count
        FROM events e
        JOIN courses c ON e.course_id = c.id
        JOIN student_courses sc ON sc.course_id = c.id
        JOIN students s ON sc.student_id = s.id
        WHERE c.id IN (
          SELECT course_id FROM teacher_courses WHERE teacher_id = ?
        )
        GROUP BY e.id
        ORDER BY e.date ASC
      `;
      db.query(eventSql, [teacherId], (err3, eventResults) => {
        if (err3) {
          console.error("DB error fetching events:", err3);
          return res.status(500).json({ message: "Internal server error." });
        }

        const studentCountSql = `
          SELECT c.id AS course_id, COUNT(sc.student_id) AS student_count
          FROM teacher_courses tc
          JOIN student_courses sc ON tc.course_id = sc.course_id
          JOIN courses c ON tc.course_id = c.id
          WHERE tc.teacher_id = ?
          GROUP BY c.id
        `;
        db.query(studentCountSql, [teacherId], (err4, countResults) => {
          if (err4) {
            console.error("DB error fetching student counts:", err4);
            return res.status(500).json({ message: "Internal server error." });
          }

          res.json({
            name,
            department,
            role: 'teacher',
            courses: courseResults.map(course => {
              const count = countResults.find(c => c.course_id === course.id) || { student_count: 0 };
              return {
                ...course,
                studentCount: count.student_count
              };
            }),
            upcomingEvents: eventResults,
          });
        });
      });
    });
  });
});

// Combined Login
app.post("/api/login", (req, res) => {
  let { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  email = email.trim().toLowerCase();

  // First try to find in students table
  const studentSql = "SELECT * FROM students WHERE LOWER(TRIM(email)) = ?";
  db.query(studentSql, [email], (err, studentResults) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ message: "Internal server error." });
    }

    if (studentResults.length > 0) {
      const student = studentResults[0];

      if (password !== student.password) {
        return res.status(401).json({ message: "Invalid credentials." });
      }

      const token = jwt.sign(
        { id: student.id, email: student.email, role: 'student' },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      return res.json({
        token,
        email: student.email,
        id: student.id,
        name: student.name,
        role: 'student'
      });
    }

    // If not found in students, try teachers table
    const teacherSql = "SELECT * FROM teachers WHERE LOWER(TRIM(email)) = ?";
    db.query(teacherSql, [email], (err2, teacherResults) => {
      if (err2) {
        console.error("DB error:", err2);
        return res.status(500).json({ message: "Internal server error." });
      }

      if (teacherResults.length > 0) {
        const teacher = teacherResults[0];

        if (password !== teacher.password) {
          return res.status(401).json({ message: "Invalid credentials." });
        }

        const token = jwt.sign(
          { id: teacher.id, email: teacher.email, role: 'teacher' },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );

        return res.json({
          token,
          email: teacher.email,
          id: teacher.id,
          name: teacher.name,
          role: 'teacher'
        });
      }

      // If not found in either table
      return res.status(401).json({ message: "Invalid credentials." });
    });
  });
});

// Student Registration
app.post("/api/register/student", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required." });
  }

  const checkSql = "SELECT * FROM students WHERE email = ?";
  db.query(checkSql, [email.trim().toLowerCase()], (err, results) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ message: "Internal server error." });
    }
    
    if (results.length > 0) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const insertSql = "INSERT INTO students (name, email, password) VALUES (?, ?, ?)";
    db.query(
      insertSql,
      [name, email.trim().toLowerCase(), password],
      (err2, result) => {
        if (err2) {
          console.error("DB error on insert:", err2);
          return res.status(500).json({ message: "Internal server error." });
        }
        
        const token = jwt.sign(
          { id: result.insertId, email: email, role: 'student' },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );

        res.status(201).json({ 
          message: "Student registration successful!",
          token,
          id: result.insertId,
          email,
          name,
          role: 'student'
        });
      }
    );
  });
});

// Teacher Registration
app.post("/api/register/teacher", (req, res) => {
  const { name, email, password, department } = req.body;

  if (!name || !email || !password || !department) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const checkSql = "SELECT * FROM teachers WHERE email = ?";
  db.query(checkSql, [email.trim().toLowerCase()], (err, results) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ message: "Internal server error." });
    }
    
    if (results.length > 0) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const insertSql = "INSERT INTO teachers (name, email, password, department) VALUES (?, ?, ?, ?)";
    db.query(
      insertSql,
      [name, email.trim().toLowerCase(), password, department],
      (err2, result) => {
        if (err2) {
          console.error("DB error on insert:", err2);
          return res.status(500).json({ message: "Internal server error." });
        }
        
        const token = jwt.sign(
          { id: result.insertId, email: email, role: 'teacher' },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );

        res.status(201).json({ 
          message: "Teacher registration successful!",
          token,
          id: result.insertId,
          email,
          name,
          department,
          role: 'teacher'
        });
      }
    );
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));