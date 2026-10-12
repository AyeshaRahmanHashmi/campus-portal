/*
 * main.js
 * Behaviour shared by every page: theme, navigation, notifications, storage
 * helpers and the home/dashboard widgets. Page-specific logic lives in
 * courses.js, schedule.js, tasks.js, announcements.js and profile.js.
 */
"use strict";

const STORAGE_KEYS = {
  theme: "mu_theme",
  tasks: "mu_tasks",
  profile: "mu_profile"
};

/* ---------------------------------------------------------------------
   Small helpers
   --------------------------------------------------------------------- */

const byId = (id) => document.getElementById(id);

/* JSON-safe wrapper around localStorage. Returns the fallback if storage is blocked. */
const store = {
  read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  },
  write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      /* nothing to do */
    }
  }
};

/* Escape text before it is placed inside an HTML template string. */
function escapeHtml(value) {
  const replacements = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value).replace(/[&<>"']/g, (character) => replacements[character]);
}

function pad(number) {
  return String(number).padStart(2, "0");
}

/* Today's date as YYYY-MM-DD in local time, comparable with the ISO dates in the data. */
function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function formatDate(iso) {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/* "14:30" becomes "2:30 PM". */
function formatTime(hhmm) {
  const [hours, minutes] = hhmm.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${pad(minutes)} ${suffix}`;
}

function findCourse(code) {
  return COURSES.find((course) => course.code === code);
}

function courseLabel(code) {
  const course = findCourse(code);
  return course ? `${course.code} ${course.name}` : code;
}

/* ---------------------------------------------------------------------
   Task storage (shared by the tasks page, dashboard and home page)
   --------------------------------------------------------------------- */

function loadTasks() {
  const saved = store.read(STORAGE_KEYS.tasks, null);
  if (saved === null) {
    const starter = SEED_TASKS.map((task) => ({ ...task }));
    store.write(STORAGE_KEYS.tasks, starter);
    return starter;
  }
  if (!Array.isArray(saved)) return [];

  /* Replace starter tasks from an earlier version, but keep anything the student added. */
  if (saved.some((task) => LEGACY_SEED_IDS.includes(task.id))) {
    const kept = saved.filter((task) => !LEGACY_SEED_IDS.includes(task.id));
    SEED_TASKS.forEach((seed) => {
      if (!kept.some((task) => task.id === seed.id)) kept.push({ ...seed });
    });
    store.write(STORAGE_KEYS.tasks, kept);
    return kept;
  }
  return saved;
}

function saveTasks(tasks) {
  return store.write(STORAGE_KEYS.tasks, tasks);
}

function sortByDueDate(a, b) {
  return a.due.localeCompare(b.due);
}

/* ---------------------------------------------------------------------
   Theme (light / dark)
   --------------------------------------------------------------------- */

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.classList.toggle("theme-dark", isDark);
  const button = byId("themeToggle");
  if (button) {
    button.setAttribute("aria-pressed", String(isDark));
    button.textContent = isDark ? "Light mode" : "Dark mode";
  }
}

function initThemeToggle() {
  const button = byId("themeToggle");
  if (!button) return;

  applyTheme(document.documentElement.classList.contains("theme-dark") ? "dark" : "light");

  button.addEventListener("click", () => {
    const next = document.documentElement.classList.contains("theme-dark") ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEYS.theme, next);
    } catch (error) {
      /* Theme still changes for this visit even if it cannot be remembered. */
    }
  });
}

/* ---------------------------------------------------------------------
   Responsive navigation
   --------------------------------------------------------------------- */

function initNavigation() {
  const toggle = byId("navToggle");
  const nav = byId("primaryNav");
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };

  toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1032) setOpen(false);
  });
}

/* ---------------------------------------------------------------------
   Toast notifications
   --------------------------------------------------------------------- */

function showToast(message, type = "success") {
  let region = byId("toastRegion");
  if (!region) {
    region = document.createElement("div");
    region.id = "toastRegion";
    region.className = "toast-region";
    region.setAttribute("role", "status");
    region.setAttribute("aria-live", "polite");
    document.body.appendChild(region);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  region.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("is-leaving");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ---------------------------------------------------------------------
   Shared markup builders
   --------------------------------------------------------------------- */

function announcementMarkup(item) {
  return `
    <article class="card notice">
      <div class="notice__meta">
        <span class="badge badge--${CATEGORY_TONE[item.category]}">${escapeHtml(item.category)}</span>
        <time datetime="${item.date}">${formatDate(item.date)}</time>
        ${item.important ? '<span class="badge badge--danger">Important</span>' : ""}
      </div>
      <h3 class="notice__title">${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.description)}</p>
    </article>`;
}

function eventMarkup(item) {
  const date = new Date(`${item.date}T00:00:00`);
  const day = date.getDate();
  const month = date.toLocaleDateString("en-GB", { month: "short" });
  return `
    <li class="event">
      <div class="event__date" aria-hidden="true">
        <span class="event__day">${day}</span>
        <span class="event__month">${month}</span>
      </div>
      <div>
        <h3 class="event__title">${escapeHtml(item.title)}</h3>
        <p class="event__meta">${formatDate(item.date)}, ${escapeHtml(item.time)} &middot; ${escapeHtml(item.venue)}</p>
      </div>
    </li>`;
}

function getUpcomingEvents(limit) {
  const today = todayIso();
  return EVENTS
    .filter((item) => item.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}

function renderEventList(containerId, limit) {
  const container = byId(containerId);
  if (!container) return;
  const events = getUpcomingEvents(limit);
  container.innerHTML = events.length
    ? events.map(eventMarkup).join("")
    : '<li class="text-muted">No upcoming events are scheduled.</li>';
}

/* ---------------------------------------------------------------------
   Home page widgets
   --------------------------------------------------------------------- */

/*
 * Finds the next class by measuring how long from now each weekly slot starts.
 * Returns the timetable entry together with the calendar date it falls on.
 */
function findNextClass(now = new Date()) {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const weekMinutes = 7 * 24 * 60;

  const withWait = SCHEDULE.map((entry) => {
    const dayNumber = DAY_ORDER.indexOf(entry.day) + 1; /* Monday = 1 ... Friday = 5 */
    const [hours, minutes] = entry.start.split(":").map(Number);
    let wait = ((dayNumber - now.getDay() + 7) % 7) * 1440 + hours * 60 + minutes - nowMinutes;
    if (wait < 0) wait += weekMinutes;
    return { entry, wait };
  });

  withWait.sort((a, b) => a.wait - b.wait);
  const next = withWait[0];
  const daysAhead = Math.floor((nowMinutes + next.wait) / 1440);
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAhead);
  return { entry: next.entry, date };
}

function renderHeroGlance() {
  const list = byId("heroGlance");
  if (!list) return;

  const { entry: nextClass, date: nextClassDate } = findNextClass();
  const nextCourse = findCourse(nextClass.code);
  const nextTask = loadTasks().filter((task) => !task.completed).sort(sortByDueDate)[0];
  const nextEvent = getUpcomingEvents(1)[0];

  const items = [
    {
      label: "Next class",
      value: `${nextCourse.name} (${nextClass.code})`,
      detail: `${nextClass.day}, ${nextClassDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} &middot; ${formatTime(nextClass.start)} &middot; ${escapeHtml(nextClass.room)}`
    },
    {
      label: "Nearest deadline",
      value: nextTask ? escapeHtml(nextTask.title) : "No pending tasks",
      detail: nextTask ? `Due ${formatDate(nextTask.due)} &middot; ${escapeHtml(courseLabel(nextTask.course))}` : "Add one from the task manager"
    },
    {
      label: "Next campus event",
      value: nextEvent ? escapeHtml(nextEvent.title) : "No events scheduled",
      detail: nextEvent ? `${formatDate(nextEvent.date)}, ${escapeHtml(nextEvent.time)}` : "Check announcements for updates"
    }
  ];

  list.innerHTML = items
    .map((item) => `
      <div class="glance__item">
        <dt>${item.label}</dt>
        <dd>${item.value}<span>${item.detail}</span></dd>
      </div>`)
    .join("");
}

function renderHomeAnnouncements() {
  const container = byId("homeAnnouncements");
  if (!container) return;

  const important = ANNOUNCEMENTS
    .filter((item) => item.important)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  container.innerHTML = important
    .map((item) => `<div class="col-md-6 col-lg-4">${announcementMarkup(item)}</div>`)
    .join("");
}

/* ---------------------------------------------------------------------
   Dashboard
   --------------------------------------------------------------------- */

function renderDashboard() {
  const statGrid = byId("dashboardStats");
  if (!statGrid) return;

  const enrolled = COURSES.filter((course) => course.status === "Enrolled");
  const completed = COURSES.filter((course) => course.status === "Completed");
  const creditHours = enrolled.reduce((total, course) => total + course.credits, 0);
  const averageAttendance = Math.round(
    enrolled.reduce((total, course) => total + course.attendance, 0) / enrolled.length
  );
  const lowestAttendance = enrolled.reduce((lowest, course) => (course.attendance < lowest.attendance ? course : lowest));
  const pendingTasks = loadTasks().filter((task) => !task.completed).sort(sortByDueDate);
  const upcomingEvents = getUpcomingEvents(EVENTS.length);

  const stats = [
    { label: "Registered courses", value: enrolled.length, note: `${creditHours} credit hours this semester` },
    { label: "Completed courses", value: completed.length, note: `${completed.reduce((total, course) => total + course.credits, 0)} credit hours earned in Semester 4` },
    { label: "Current semester", value: CURRENT_SEMESTER, note: `${CURRENT_TERM_LABEL}, BS Computer Science` },
    { label: "Attendance", value: `${averageAttendance}%`, note: `Lowest: ${lowestAttendance.name} at ${lowestAttendance.attendance}%` },
    {
      label: "Upcoming assignments",
      value: pendingTasks.length,
      note: pendingTasks.length ? `Next due ${formatDate(pendingTasks[0].due)}` : "Nothing pending"
    },
    {
      label: "Upcoming events",
      value: upcomingEvents.length,
      note: upcomingEvents.length ? `Next: ${upcomingEvents[0].title}` : "No events scheduled"
    }
  ];

  statGrid.innerHTML = stats
    .map((stat) => `
      <div class="col-sm-6 col-lg-4">
        <article class="card stat">
          <p class="stat__label">${stat.label}</p>
          <p class="stat__value">${stat.value}</p>
          <p class="stat__note">${escapeHtml(stat.note)}</p>
        </article>
      </div>`)
    .join("");

  /* Attendance by course */
  const attendanceList = byId("attendanceList");
  if (attendanceList) {
    attendanceList.innerHTML = enrolled
      .map((course) => {
        const warn = course.attendance < 85;
        return `
          <li>
            <div class="meter-list__row"><span>${escapeHtml(course.name)}</span><strong>${course.attendance}%</strong></div>
            <div class="progress ${warn ? "progress--warn" : ""}" role="progressbar" aria-label="${escapeHtml(course.name)} attendance" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${course.attendance}"><span style="width:${course.attendance}%"></span></div>
          </li>`;
      })
      .join("");
  }

  /* Pending tasks */
  const taskList = byId("dashboardTasks");
  if (taskList) {
    taskList.innerHTML = pendingTasks.length
      ? pendingTasks
          .slice(0, 5)
          .map((task) => `
            <li>
              <div>${escapeHtml(task.title)}<small>${escapeHtml(courseLabel(task.course))}</small></div>
              <div><span class="badge badge--${task.due < todayIso() ? "danger" : "warning"}">${formatDate(task.due)}</span></div>
            </li>`)
          .join("")
      : '<li class="text-muted">No pending tasks. Use the task manager to add one.</li>';
  }

  /* Registered courses */
  const courseList = byId("dashboardCourses");
  if (courseList) {
    courseList.innerHTML = enrolled
      .map((course) => `
        <li>
          <div>${escapeHtml(course.name)}<small>${escapeHtml(course.instructor)}</small></div>
          <div><span class="badge badge--neutral">${escapeHtml(course.code)}</span></div>
        </li>`)
      .join("");
  }

  /* Personal greeting from the saved profile, if there is one */
  const greeting = byId("dashboardGreeting");
  const profile = store.read(STORAGE_KEYS.profile, null);
  if (greeting && profile && profile.fullName) {
    const firstName = profile.fullName.trim().split(/\s+/)[0];
    greeting.textContent = `Welcome back, ${firstName}. Here is where your ${CURRENT_TERM_LABEL} semester stands today.`;
  }
}

/* ---------------------------------------------------------------------
   Start-up
   --------------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  initNavigation();

  const yearTarget = byId("currentYear");
  if (yearTarget) yearTarget.textContent = new Date().getFullYear();

  renderHeroGlance();
  renderHomeAnnouncements();
  renderEventList("homeEvents", 4);
  renderEventList("dashboardEvents", 5);
  renderDashboard();
});
