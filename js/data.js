/*
 * data.js
 * Sample records for the Fall 2026 prototype. In a production portal these
 * arrays would be returned by a server; here they stand in for that data so the
 * interface can be built and tested entirely in the browser.
 */
"use strict";

const CURRENT_SEMESTER = 5;
const CURRENT_TERM_LABEL = "Fall 2026";

/* Course records. "attendance" is only recorded for courses in progress. */
const COURSES = [
  { code: "CS-301", name: "Web Technology", instructor: "Sir Hussain Gillani", credits: 3, semester: 5, status: "Enrolled", attendance: 92 },
  { code: "CS-403", name: "Mobile Application Development", instructor: "Sir Usair Hassan", credits: 3, semester: 5, status: "Enrolled", attendance: 88 },
  { code: "CS-307", name: "Operating Systems", instructor: "Prof. Kamran Aziz", credits: 3, semester: 5, status: "Enrolled", attendance: 81 },
  { code: "CS-309", name: "HCI and Computer Graphics", instructor: "Sir Zafar Khan", credits: 3, semester: 5, status: "Enrolled", attendance: 90 },
  { code: "MG-101", name: "Introduction to Management", instructor: "Mam Mufleeha Adeel", credits: 3, semester: 5, status: "Enrolled", attendance: 85 },
  { code: "CS-303", name: "Computer Architecture", instructor: "Dr. Sehrish Tayyaba", credits: 3, semester: 5, status: "Enrolled", attendance: 86 },
  { code: "CS-201", name: "Data Structures and Algorithms", instructor: "Mam Majida", credits: 4, semester: 4, status: "Completed" },
  { code: "CS-203", name: "Object-Oriented Programming", instructor: "Mam Maheen Nadir", credits: 3, semester: 4, status: "Completed" },
  { code: "CS-205", name: "Computer Networks", instructor: "Sir Abdul Qadir", credits: 3, semester: 4, status: "Completed" },
  { code: "CS-401", name: "Artificial Intelligence", instructor: "Dr. Mehwish Anwar", credits: 3, semester: 6, status: "Upcoming" }
];

/* Badge colour used for each course status. */
const STATUS_TONE = { Enrolled: "info", Completed: "success", Upcoming: "neutral" };

/*
 * Weekly timetable (Tuesday to Friday; Monday is a free day).
 * Course name and instructor are looked up from COURSES by code.
 * Times use the 24-hour format and must fall on :00 or :30 so they line up
 * with the half-hour rows of the calendar grid.
 */
const SCHEDULE = [
  { code: "CS-301", day: "Tuesday",   start: "09:00", end: "11:00", room: "Block 2, Lab 4",  type: "Lab" },
  { code: "CS-309", day: "Tuesday",   start: "11:30", end: "13:00", room: "Block 1, Room 6", type: "Lecture" },
  { code: "CS-303", day: "Tuesday",   start: "14:00", end: "15:30", room: "Block 1, Room 3", type: "Lecture" },
  { code: "MG-101", day: "Wednesday", start: "09:00", end: "10:30", room: "Block 3, Room 2", type: "Lecture" },
  { code: "CS-307", day: "Wednesday", start: "11:00", end: "12:30", room: "Block 1, Room 4", type: "Lecture" },
  { code: "CS-403", day: "Wednesday", start: "14:00", end: "16:00", room: "Block 2, Lab 2",  type: "Lab" },
  { code: "CS-301", day: "Thursday",  start: "09:00", end: "10:30", room: "Block 1, Room 5", type: "Lecture" },
  { code: "CS-303", day: "Thursday",  start: "11:00", end: "12:30", room: "Block 1, Room 3", type: "Lecture" },
  { code: "CS-309", day: "Thursday",  start: "14:00", end: "16:00", room: "Block 2, Lab 1",  type: "Lab" },
  { code: "CS-403", day: "Friday",    start: "09:00", end: "10:30", room: "Block 1, Room 5", type: "Lecture" },
  { code: "CS-307", day: "Friday",    start: "11:00", end: "12:30", room: "Block 1, Room 4", type: "Lecture" },
  { code: "MG-101", day: "Friday",    start: "14:00", end: "15:30", room: "Block 3, Room 2", type: "Lecture" }
];

/*
 * Quizzes. Each quiz is held at the start of that course's class on the given
 * date, so "time" must match the start of a SCHEDULE entry for that weekday.
 */
const QUIZZES = [
  { id: "quiz-mg-1",  code: "MG-101", title: "Quiz 1", date: "2026-10-14", time: "09:00" },
  { id: "quiz-web-1", code: "CS-301", title: "Quiz 1", date: "2026-10-15", time: "09:00" },
  { id: "quiz-os-1",  code: "CS-307", title: "Quiz 1", date: "2026-10-16", time: "11:00" },
  { id: "quiz-hci-1", code: "CS-309", title: "Quiz 1", date: "2026-10-20", time: "11:30" },
  { id: "quiz-ca-1",  code: "CS-303", title: "Quiz 1", date: "2026-10-22", time: "11:00" },
  { id: "quiz-mad-1", code: "CS-403", title: "Quiz 1", date: "2026-10-23", time: "09:00" }
];

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const ANNOUNCEMENTS = [
  {
    title: "Mid-term examination date sheet published",
    description: "The Fall 2026 mid-term date sheet is available at the Examination Office. Papers run from 16 to 27 November. Report any clash in your timetable to the Examination Office by 23 October.",
    date: "2026-10-08", category: "Examination", important: true
  },
  {
    title: "Course withdrawal requests close on 30 October",
    description: "Withdrawal requests for Fall 2026 courses are accepted at the department office until 30 October. Requests received after that date cannot be processed.",
    date: "2026-10-06", category: "Academic", important: true
  },
  {
    title: "Second tuition fee installment due 31 October",
    description: "The second installment of Fall 2026 tuition is payable by 31 October. Fee challans are issued by the Accounts Office during working hours.",
    date: "2026-10-02", category: "General", important: true
  },
  {
    title: "Central library extends weekday hours",
    description: "From 12 October until the end of the semester the central library will stay open until 10:00 pm on weekdays. Weekend hours are unchanged.",
    date: "2026-10-05", category: "General", important: false
  },
  {
    title: "Annual Software Showcase on 4 November",
    description: "Final-year project teams will present their work in the Faculty of Computing atrium. Students from all semesters are welcome to attend and ask questions.",
    date: "2026-10-03", category: "Event", important: false
  },
  {
    title: "Elective preferences for Semester 6",
    description: "Students entering Semester 6 should submit their elective preferences to the department coordinator before 6 November. Allocation depends on seat availability.",
    date: "2026-09-30", category: "Academic", important: false
  },
  {
    title: "CV and interview preparation workshop",
    description: "Career Services is running a workshop on 21 October at 2:00 pm in Seminar Hall B. Bring a printed copy of your current CV for review.",
    date: "2026-09-28", category: "Event", important: false
  },
  {
    title: "Examination conduct rules for mid-terms",
    description: "Students must carry their university ID card to every paper. Mobile phones and smart watches are not permitted inside the examination hall.",
    date: "2026-09-25", category: "Examination", important: false
  }
];

const ANNOUNCEMENT_CATEGORIES = ["Academic", "Examination", "Event", "General"];
const CATEGORY_TONE = { Academic: "info", Examination: "warning", Event: "success", General: "neutral" };

const EVENTS = [
  { title: "Intra-University Sports Week", date: "2026-10-19", time: "9:30 AM", venue: "Main Ground" },
  { title: "CV and Interview Preparation Workshop", date: "2026-10-21", time: "2:00 PM", venue: "Seminar Hall B" },
  { title: "Guest Lecture: Secure Web Application Design", date: "2026-10-28", time: "11:00 AM", venue: "Main Auditorium" },
  { title: "Annual Software Showcase", date: "2026-11-04", time: "10:00 AM", venue: "Faculty of Computing Atrium" },
  { title: "Mid-term Examinations Begin", date: "2026-11-16", time: "9:00 AM", venue: "Examination Hall Complex" }
];

/* Tasks shown the first time the portal is opened, before anything is saved. */
const SEED_TASKS = [
  { id: "seed-risc-cisc", title: "Comparison of RISC and CISC", course: "CS-303", due: "2026-10-14", priority: "Medium", completed: false },
  { id: "seed-mobile-1", title: "Mobile App Assignment 1", course: "CS-403", due: "2026-10-16", priority: "High", completed: false }
];

/* Ids of the starter tasks from an earlier version; they are removed from saved lists. */
const LEGACY_SEED_IDS = ["seed-1", "seed-2", "seed-3"];

const DEPARTMENTS = [
  "Computer Science (CS)",
  "Computer Engineering (CE)",
  "Business Administration (BBA)"
];

