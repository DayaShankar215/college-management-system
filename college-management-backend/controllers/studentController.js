const db = require("../config/db");

exports.getDashboard = async (req, res) => {
  const studentId = req.params.id;

  if (req.user.id !== Number(studentId)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    // Get student basic info
    const [studentResults] = await db.promise().query(
      "SELECT name FROM students WHERE id = ?",
      [studentId]
    );

    if (studentResults.length === 0) {
      return res.status(404).json({ message: "Student not found." });
    }

    const { name } = studentResults[0];

    // Get enrolled courses with grades and attendance
    const [courseResults] = await db.promise().query(
      `SELECT 
        c.id, 
        c.name, 
        c.code,
        sc.attendance, 
        sc.grade
       FROM student_courses sc
       JOIN courses c ON sc.course_id = c.id
       WHERE sc.student_id = ?`,
      [studentId]
    );


    const [eventResults] = await db.promise().query(
      `SELECT 
        e.id, 
        e.title, 
        e.date, 
        c.name AS course
       FROM events e
       JOIN courses c ON e.course_id = c.id
       JOIN student_courses sc ON sc.course_id = c.id
       WHERE sc.student_id = ? AND e.date >= CURDATE()
       ORDER BY e.date ASC
       LIMIT 5`,
      [studentId]
    );

    res.json({
      name,
      courses: courseResults.map(c => ({
        id: c.id,
        name: c.name,
        code: c.code,
        attendance: c.attendance,
        grade: c.grade
      })),
      upcomingEvents: eventResults.map(e => ({
        id: e.id,
        title: e.title,
        date: e.date,
        course: e.course
      }))
    });

  } catch (err) {
    console.error("Error in student dashboard:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};