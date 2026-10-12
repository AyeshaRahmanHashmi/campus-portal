/*
 * courses.js
 * Builds the course cards from the COURSES array and handles searching and
 * filtering. The page never reloads; every control re-runs render().
 */
"use strict";

(function () {
  const grid = byId("courseGrid");
  if (!grid) return;

  const searchInput = byId("courseSearch");
  const semesterSelect = byId("courseSemester");
  const statusSelect = byId("courseStatus");
  const resultCount = byId("courseCount");
  const resetButton = byId("courseReset");

  /* Semester options come from the data so new semesters appear automatically. */
  function buildSemesterOptions() {
    const semesters = [...new Set(COURSES.map((course) => course.semester))].sort((a, b) => a - b);
    semesterSelect.innerHTML =
      '<option value="all">All semesters</option>' +
      semesters.map((semester) => `<option value="${semester}">Semester ${semester}</option>`).join("");
  }

  function getFilteredCourses() {
    const query = searchInput.value.trim().toLowerCase();
    const semester = semesterSelect.value;
    const status = statusSelect.value;

    return COURSES.filter((course) => {
      const matchesQuery =
        query === "" ||
        course.name.toLowerCase().includes(query) ||
        course.code.toLowerCase().includes(query);
      const matchesSemester = semester === "all" || String(course.semester) === semester;
      const matchesStatus = status === "all" || course.status === status;
      return matchesQuery && matchesSemester && matchesStatus;
    });
  }

  function courseCardMarkup(course) {
    const attendance =
      typeof course.attendance === "number"
        ? `<div class="course-card__attendance">
             Attendance: ${course.attendance}%
             <div class="progress ${course.attendance < 85 ? "progress--warn" : ""}" role="progressbar" aria-label="${escapeHtml(course.name)} attendance" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${course.attendance}"><span style="width:${course.attendance}%"></span></div>
           </div>`
        : "";

    return `
      <div class="col-md-6 col-lg-4">
        <article class="card course-card">
          <div class="course-card__head">
            <span class="course-card__code">${escapeHtml(course.code)}</span>
            <span class="badge badge--${STATUS_TONE[course.status]}">${escapeHtml(course.status)}</span>
          </div>
          <h3 class="course-card__title">${escapeHtml(course.name)}</h3>
          <dl class="course-card__meta">
            <div><dt>Instructor</dt><dd>${escapeHtml(course.instructor)}</dd></div>
            <div><dt>Credit hours</dt><dd>${course.credits}</dd></div>
            <div><dt>Semester</dt><dd>${course.semester}</dd></div>
          </dl>
          ${attendance}
        </article>
      </div>`;
  }

  function render() {
    const results = getFilteredCourses();

    if (results.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <strong>No matching course found</strong>
          Try a different course name or code, or reset the filters.
        </div>`;
    } else {
      grid.innerHTML = results.map(courseCardMarkup).join("");
    }

    const credits = results.reduce((total, course) => total + course.credits, 0);
    resultCount.textContent = results.length === 0
      ? `Showing 0 of ${COURSES.length} courses`
      : `Showing ${results.length} of ${COURSES.length} courses, ${credits} credit hours in total`;
  }

  function resetFilters() {
    searchInput.value = "";
    semesterSelect.value = "all";
    statusSelect.value = "all";
    render();
    searchInput.focus();
  }

  buildSemesterOptions();
  searchInput.addEventListener("input", render);
  semesterSelect.addEventListener("change", render);
  statusSelect.addEventListener("change", render);
  resetButton.addEventListener("click", resetFilters);
  render();
})();
