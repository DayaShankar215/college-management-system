const db = require("../config/db");

exports.getDashboard = async (req, res) => {
  const teacherId = req.params.id;

  if (req.user.id !== Number(teacherId)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
 
    const [teacherResults] = await db.promise().query(
      "SELECT name, department FROM teachers WHERE id = ?",
      [teacherId]
    );

    if (teacherResults.length === 0) {
      return res.status(404).json({ message: "Teacher not found." });
    }

    const { name, department } = teacherResults[0];

   
    const [courseResults] = await db.promise().query(
      `SELECT 
        c.id, 
        c.name, 
        c.code,
        COUNT(sc.student_id) AS student_count
       FROM teacher_courses tc
       JOIN courses c ON tc.course_id = c.id
       LEFT JOIN student_courses sc ON sc.course_id = c.id
       WHERE tc.teacher_id = ?
       GROUP BY c.id`,
      [teacherId]
    );

    
    const [eventResults] = await db.promise().query(
      `SELECT 
        e.id, 
        e.title, 
        e.date, 
        c.name AS course,
        COUNT(sc.student_id) AS student_count
       FROM events e
       JOIN courses c ON e.course_id = c.id
       JOIN teacher_courses tc ON tc.course_id = c.id AND tc.teacher_id = ?
       LEFT JOIN student_courses sc ON sc.course_id = c.id
       WHERE e.date >= CURDATE()
       GROUP BY e.id
       ORDER BY e.date ASC
       LIMIT 5`,
      [teacherId]
    );

    res.json({
      name,
      department,
      courses: courseResults.map(c => ({
        id: c.id,
        name: c.name,
        code: c.code,
        studentCount: c.student_count
      })),
      upcomingEvents: eventResults.map(e => ({
        id: e.id,
        title: e.title,
        date: e.date,
        course: e.course,
        student_count: e.student_count
      }))
    });

  } catch (err) {
    console.error("Error in teacher dashboard:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};