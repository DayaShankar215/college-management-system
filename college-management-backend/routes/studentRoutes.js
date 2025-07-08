// studentRoutes.js
const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");
const auth = require("../middleware/authMiddleware");

router.get("/", auth, studentController.getStudents);
router.get("/:id", auth, studentController.getStudentById);
router.post("/", auth, studentController.createStudent);
router.put("/:id", auth, studentController.updateStudent);
router.delete("/:id", auth, studentController.deleteStudent);

router.get("/:id/dashboard", auth, studentController.getDashboardData);
router.post("/login", studentController.loginStudent);
router.post("/register", studentController.registerStudent);

router.get("/:id/attendance", auth, studentController.getAttendance);
router.get("/:id/grades", auth, studentController.getGrades);
router.get("/:id/courses", auth, studentController.getCourses);
router.get("/:id/exams", auth, studentController.getExams);
router.get("/:id/notifications", auth, studentController.getNotifications);
router.get("/:id/assignments", auth, studentController.getAssignments);
router.get("/:id/feedback", auth, studentController.getFeedback);
router.get(
  "/:id/academic-calendar",
  auth,
  studentController.getAcademicCalendar
);
router.get("/:id/academic-summary", auth, studentController.getAcademicSummary);

module.exports = router;
