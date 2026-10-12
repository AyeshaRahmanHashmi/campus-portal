/*
 * schedule.js
 * Weekly academic calendar. It combines four sources on one board:
 *   classes      SCHEDULE array in data.js (repeat every week)
 *   quizzes      QUIZZES array in data.js (fixed dates)
 *   assignments  tasks saved by the task manager (loadTasks, due dates)
 *   events       EVENTS array in data.js
 * Desktop shows a time-slot grid; smaller screens show the same week as
 * day-by-day cards. Both views are built from the same data on every render.
 */
"use strict";

(function () {
  const gridHost = byId("calendarGrid");
  if (!gridHost) return;

  const agendaHost = byId("calendarAgenda");
  const weekLabel = byId("weekLabel");
  const summaryHost = byId("weekSummary");
  const deadlineList = byId("deadlineList");
  const courseKey = byId("courseKey");
  const typeBar = byId("typeFilter");

  const SLOT_MINUTES = 30;
  const FIRST_ROW = 3; /* row 1 = day headers, row 2 = all-day strip */
  let weekStart = defaultWeekStart();
  let activeType = "all";

  /* ---------- Date helpers ---------- */

  function toMinutes(hhmm) {
    const [hours, minutes] = hhmm.split(":").map(Number);
    return hours * 60 + minutes;
  }

  function toIso(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function addDays(date, count) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + count);
  }

  function shortDate(date) {
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  /* Monday of the current week; on Saturday and Sunday, the coming Monday. */
  function defaultWeekStart() {
    const now = new Date();
    const weekday = now.getDay();
    const offset = weekday === 0 ? 1 : weekday === 6 ? 2 : 1 - weekday;
    return addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), offset);
  }

  function getWeekDays() {
    return DAY_ORDER.map((name, index) => {
      const date = addDays(weekStart, index);
      return { name, date, iso: toIso(date), isToday: toIso(date) === todayIso() };
    });
  }

  /* ---------- Data for one day ---------- */

  function showType(type) {
    return activeType === "all" || activeType === type;
  }

  function classesOn(day) {
    return SCHEDULE
      .filter((session) => session.day === day.name)
      .sort((a, b) => a.start.localeCompare(b.start));
  }

  function quizzesOn(day) {
    return QUIZZES.filter((quiz) => quiz.date === day.iso);
  }

  /* Quiz held at the start of this class, if there is one. */
  function quizFor(session, day) {
    return quizzesOn(day).find((quiz) => quiz.code === session.code && quiz.time === session.start);
  }

  /* Quizzes, assignments and events for a day as one list of simple objects. */
  function markersOn(day, tasks) {
    const markers = [];
    if (showType("quiz")) {
      quizzesOn(day).forEach((quiz) => {
        markers.push({ kind: "quiz", time: quiz.time, title: `${findCourse(quiz.code).name} ${quiz.title}`, detail: formatTime(quiz.time) });
      });
    }
    if (showType("assignment")) {
      tasks.filter((task) => task.due === day.iso).forEach((task) => {
        markers.push({
          kind: "task",
          time: "23:59",
          title: task.title,
          detail: `${task.course === "General" ? "General" : courseLabel(task.course)}, ${task.priority} priority`,
          done: task.completed
        });
      });
    }
    if (showType("event")) {
      EVENTS.filter((item) => item.date === day.iso).forEach((item) => {
        markers.push({ kind: "event", time: "00:00", title: item.title, detail: `${item.time}, ${item.venue}` });
      });
    }
    return markers.sort((a, b) => a.time.localeCompare(b.time));
  }

  /* ---------- Markup ---------- */

  const MARKER_LABEL = { quiz: "Quiz", task: "Due", event: "Event" };
  const MARKER_TONE = { quiz: "warning", task: "danger", event: "neutral" };

  function markerMarkup(marker) {
    return `
      <div class="marker marker--${marker.kind} ${marker.done ? "is-done" : ""}">
        <span class="badge badge--${marker.done ? "success" : MARKER_TONE[marker.kind]}">${marker.done ? "Done" : MARKER_LABEL[marker.kind]}</span>
        <span class="marker__text">${escapeHtml(marker.title)}<small>${escapeHtml(marker.detail)}</small></span>
      </div>`;
  }

  function slotMarkup(session, day, placement) {
    const course = findCourse(session.code);
    const quiz = quizFor(session, day);
    const isLab = session.type === "Lab";
    return `
      <article class="slot ${isLab ? "slot--lab" : "slot--lecture"}" ${placement ? `style="${placement}"` : ""}>
        <p class="slot__time">${formatTime(session.start)} to ${formatTime(session.end)}</p>
        <h4 class="slot__title">${escapeHtml(course.name)}</h4>
        <p class="slot__meta">${escapeHtml(session.room)}<br>${escapeHtml(course.instructor)}</p>
        <p class="slot__badges">
          <span class="badge badge--${isLab ? "success" : "info"}">${session.type}</span>
          ${quiz ? `<span class="badge badge--warning">${escapeHtml(quiz.title)} today</span>` : ""}
        </p>
      </article>`;
  }

  /* ---------- Desktop time-slot grid ---------- */

  function renderGrid(days, tasks) {
    const starts = SCHEDULE.map((session) => toMinutes(session.start));
    const ends = SCHEDULE.map((session) => toMinutes(session.end));
    const gridStart = Math.floor(Math.min(...starts) / 60) * 60;
    const gridEnd = Math.ceil(Math.max(...ends) / 60) * 60;
    const rowCount = (gridEnd - gridStart) / SLOT_MINUTES;
    const rowOf = (minutes) => (minutes - gridStart) / SLOT_MINUTES + FIRST_ROW;

    let html = `<div class="cal__grid" style="grid-template-rows: auto auto repeat(${rowCount}, var(--slot-height));">`;
    html += '<div class="cal__corner" style="grid-column:1; grid-row:1;"><span class="sr-only">Time</span></div>';

    days.forEach((day, index) => {
      html += `
        <div class="cal__dayhead ${day.isToday ? "is-today" : ""}" style="grid-column:${index + 2}; grid-row:1;">
          <h3 class="cal__dayname">${day.name}</h3>
          <p class="cal__daydate">${day.date.getDate()} <span>${day.date.toLocaleDateString("en-GB", { month: "short" })}</span></p>
          ${day.isToday ? '<span class="badge badge--info">Today</span>' : ""}
        </div>`;
    });

    html += '<div class="cal__label" style="grid-column:1; grid-row:2;">Quizzes, due dates and events</div>';
    days.forEach((day, index) => {
      const markers = markersOn(day, tasks);
      html += `<div class="cal__allday ${day.isToday ? "is-today" : ""}" style="grid-column:${index + 2}; grid-row:2;">${markers.map(markerMarkup).join("")}</div>`;
    });

    for (let minutes = gridStart; minutes < gridEnd; minutes += 60) {
      const label = formatTime(`${pad(Math.floor(minutes / 60))}:00`);
      html += `<div class="cal__time" style="grid-column:1; grid-row:${rowOf(minutes)} / span 2;">${label}</div>`;
    }

    days.forEach((day, index) => {
      html += `<div class="cal__col ${day.isToday ? "is-today" : ""}" style="grid-column:${index + 2}; grid-row:${FIRST_ROW} / span ${rowCount};"></div>`;
    });

    days.forEach((day, index) => {
      if (!showType("class")) return;
      classesOn(day).forEach((session) => {
        const placement = `grid-column:${index + 2}; grid-row:${rowOf(toMinutes(session.start))} / ${rowOf(toMinutes(session.end))};`;
        html += slotMarkup(session, day, placement);
      });
    });

    html += "</div>";
    gridHost.innerHTML = html;
  }

  /* ---------- Phone and tablet day cards ---------- */

  function renderAgenda(days, tasks) {
    agendaHost.innerHTML = days
      .map((day) => {
        const sessions = showType("class") ? classesOn(day) : [];
        const markers = markersOn(day, tasks);
        const body = sessions.length || markers.length
          ? sessions.map((session) => slotMarkup(session, day, "")).join("") + markers.map(markerMarkup).join("")
          : '<p class="text-muted">Nothing scheduled.</p>';
        return `
          <div class="col-md-6">
            <section class="card agenda-day ${day.isToday ? "is-today" : ""}" aria-label="${day.name} ${shortDate(day.date)}">
              <header class="agenda-day__head">
                <h3>${day.name}</h3>
                <span>${shortDate(day.date)}</span>
                ${day.isToday ? '<span class="badge badge--info">Today</span>' : ""}
              </header>
              <div class="agenda-day__body">${body}</div>
            </section>
          </div>`;
      })
      .join("");
  }

  /* ---------- Summary, deadlines, course key ---------- */

  function renderSummary(days, tasks) {
    const sessions = days.flatMap((day) => classesOn(day));
    const contactMinutes = sessions.reduce((total, session) => total + toMinutes(session.end) - toMinutes(session.start), 0);
    const quizCount = days.reduce((total, day) => total + quizzesOn(day).length, 0);
    const assignmentCount = tasks.filter((task) => !task.completed && days.some((day) => day.iso === task.due)).length;
    const hours = contactMinutes / 60;

    const cards = [
      { label: "Class sessions", value: sessions.length, note: `${sessions.filter((s) => s.type === "Lab").length} of them labs` },
      { label: "Contact hours", value: Number.isInteger(hours) ? hours : hours.toFixed(1), note: "Lectures and labs this week" },
      { label: "Quizzes", value: quizCount, note: quizCount ? "Check the highlighted slots" : "None this week" },
      { label: "Assignments due", value: assignmentCount, note: assignmentCount ? "Pending in your task manager" : "Nothing pending" }
    ];

    summaryHost.innerHTML = cards
      .map((card) => `
        <div class="col-sm-6 col-lg-3">
          <article class="card stat stat--compact">
            <p class="stat__label">${card.label}</p>
            <p class="stat__value">${card.value}</p>
            <p class="stat__note">${card.note}</p>
          </article>
        </div>`)
      .join("");
  }

  function renderDeadlines(tasks) {
    const today = todayIso();
    const items = [];

    QUIZZES.filter((quiz) => quiz.date >= today).forEach((quiz) => {
      items.push({ date: quiz.date, time: quiz.time, kind: "quiz", title: `${findCourse(quiz.code).name} ${quiz.title}`, sub: formatTime(quiz.time) });
    });
    tasks.filter((task) => !task.completed).forEach((task) => {
      items.push({ date: task.due, time: "23:59", kind: "task", title: task.title, sub: task.course === "General" ? "General" : courseLabel(task.course), overdue: task.due < today });
    });

    items.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

    deadlineList.innerHTML = items.length
      ? items.slice(0, 8).map((item) => `
          <li>
            <div>${escapeHtml(item.title)}<small>${escapeHtml(item.sub)}</small></div>
            <div class="deadline__tags">
              <span class="badge badge--${item.kind === "quiz" ? "warning" : "danger"}">${item.kind === "quiz" ? "Quiz" : item.overdue ? "Overdue" : "Assignment"}</span>
              <span class="deadline__date">${formatDate(item.date)}</span>
            </div>
          </li>`).join("")
      : '<li class="text-muted">No quizzes or assignments are pending.</li>';
  }

  function renderCourseKey() {
    courseKey.innerHTML = COURSES
      .filter((course) => course.status === "Enrolled")
      .map((course) => `
        <li>
          <div>${escapeHtml(course.name)}<small>${escapeHtml(course.instructor)}</small></div>
          <div><span class="badge badge--neutral">${escapeHtml(course.code)}</span></div>
        </li>`)
      .join("");
  }

  /* ---------- Render and events ---------- */

  function render() {
    const days = getWeekDays();
    const tasks = loadTasks();
    weekLabel.textContent = `${shortDate(days[0].date)} to ${shortDate(days[4].date)} ${days[4].date.getFullYear()}`;
    renderSummary(days, tasks);
    renderGrid(days, tasks);
    renderAgenda(days, tasks);
    renderDeadlines(tasks);
  }

  byId("weekPrev").addEventListener("click", () => {
    weekStart = addDays(weekStart, -7);
    render();
  });
  byId("weekNext").addEventListener("click", () => {
    weekStart = addDays(weekStart, 7);
    render();
  });
  byId("weekToday").addEventListener("click", () => {
    weekStart = defaultWeekStart();
    render();
  });

  typeBar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-type]");
    if (!button) return;
    activeType = button.dataset.type;
    typeBar.querySelectorAll("[data-type]").forEach((chip) => {
      chip.setAttribute("aria-pressed", String(chip.dataset.type === activeType));
    });
    render();
  });

  /* Tasks added or completed in another tab appear here without a reload. */
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEYS.tasks) render();
  });

  renderCourseKey();
  render();
})();
