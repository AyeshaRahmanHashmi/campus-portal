/*
 * tasks.js
 * Assignment and task manager.
 * Problem -> requirement -> interface -> logic -> data -> result:
 *   students juggle deadlines -> track them -> form and list -> add, complete,
 *   delete -> saved in localStorage -> tasks survive a refresh.
 */
"use strict";

(function () {
  const form = byId("taskForm");
  if (!form) return;

  const fields = {
    title: byId("taskTitle"),
    course: byId("taskCourse"),
    due: byId("taskDue"),
    priority: byId("taskPriority")
  };
  const errorBoxes = {
    title: byId("taskTitleError"),
    course: byId("taskCourseError"),
    due: byId("taskDueError")
  };
  const list = byId("taskList");
  const summary = byId("taskSummary");
  const filterBar = byId("taskFilter");
  const clearCompletedButton = byId("clearCompleted");

  let tasks = loadTasks();
  let activeFilter = "all";

  /* ---------- Form set-up ---------- */

  function buildCourseOptions() {
    const options = COURSES
      .filter((course) => course.status === "Enrolled")
      .map((course) => `<option value="${course.code}">${escapeHtml(course.code)} ${escapeHtml(course.name)}</option>`)
      .join("");
    fields.course.innerHTML =
      '<option value="">Select a course</option>' + options + '<option value="General">General (not tied to a course)</option>';
  }

  /* ---------- Validation ---------- */

  function setError(name, message) {
    errorBoxes[name].textContent = message;
    fields[name].classList.toggle("is-invalid", message !== "");
    fields[name].setAttribute("aria-invalid", String(message !== ""));
  }

  function validateForm() {
    const title = fields.title.value.trim();
    let firstInvalid = null;

    const checks = [
      ["title", title === "" ? "Please enter a task title." : title.length > 80 ? "Keep the title under 80 characters." : ""],
      ["course", fields.course.value === "" ? "Please choose a course." : ""],
      ["due", fields.due.value === "" ? "Please choose a due date." : ""]
    ];

    checks.forEach(([name, message]) => {
      setError(name, message);
      if (message && !firstInvalid) firstInvalid = fields[name];
    });

    if (firstInvalid) firstInvalid.focus();
    return firstInvalid === null;
  }

  /* ---------- Data changes ---------- */

  function persist() {
    if (!saveTasks(tasks)) {
      showToast("Changes could not be saved in this browser.", "error");
    }
  }

  function createId() {
    return `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  function addTask() {
    tasks.push({
      id: createId(),
      title: fields.title.value.trim(),
      course: fields.course.value,
      due: fields.due.value,
      priority: fields.priority.value,
      completed: false
    });
    persist();
  }

  function toggleTask(id) {
    const target = tasks.find((task) => task.id === id);
    if (!target) return;
    target.completed = !target.completed;
    persist();
    showToast(target.completed ? "Task marked as completed." : "Task moved back to pending.", "info");
  }

  function deleteTask(id) {
    const target = tasks.find((task) => task.id === id);
    tasks = tasks.filter((task) => task.id !== id);
    persist();
    showToast(target ? `Deleted "${target.title}".` : "Task deleted.", "info");
  }

  /* ---------- Rendering ---------- */

  function isOverdue(task) {
    return !task.completed && task.due < todayIso();
  }

  function taskMarkup(task) {
    const priorityClass = task.priority.toLowerCase();
    const priorityTone = { High: "danger", Medium: "warning", Low: "info" }[task.priority];
    let statusBadge = '<span class="badge badge--neutral">Pending</span>';
    if (task.completed) statusBadge = '<span class="badge badge--success">Completed</span>';
    else if (isOverdue(task)) statusBadge = '<span class="badge badge--danger">Overdue</span>';

    return `
      <li class="task task--${priorityClass} ${task.completed ? "is-complete" : ""}" data-task-id="${escapeHtml(task.id)}">
        <input class="task__check" type="checkbox" id="check-${escapeHtml(task.id)}" data-action="toggle" ${task.completed ? "checked" : ""}>
        <div>
          <label class="task__title" for="check-${escapeHtml(task.id)}">${escapeHtml(task.title)}</label>
          <p class="task__meta">
            <span>${escapeHtml(task.course === "General" ? "General" : courseLabel(task.course))}</span>
            <span>Due ${formatDate(task.due)}</span>
            <span class="badge badge--${priorityTone}">${escapeHtml(task.priority)} priority</span>
            ${statusBadge}
          </p>
        </div>
        <button class="btn btn--danger btn--sm" type="button" data-action="delete" aria-label="Delete task: ${escapeHtml(task.title)}">Delete</button>
      </li>`;
  }

  function render() {
    const visible = tasks
      .filter((task) => {
        if (activeFilter === "pending") return !task.completed;
        if (activeFilter === "completed") return task.completed;
        return true;
      })
      .sort((a, b) => Number(a.completed) - Number(b.completed) || sortByDueDate(a, b));

    if (visible.length === 0) {
      const message = tasks.length === 0
        ? "No tasks yet. Add your first assignment using the form."
        : "No tasks match this filter.";
      list.innerHTML = `<li class="empty-state"><strong>Nothing to show</strong>${message}</li>`;
    } else {
      list.innerHTML = visible.map(taskMarkup).join("");
    }

    const completedCount = tasks.filter((task) => task.completed).length;
    const overdueCount = tasks.filter(isOverdue).length;
    summary.textContent =
      `${tasks.length - completedCount} pending, ${completedCount} completed` +
      (overdueCount ? `, ${overdueCount} overdue` : "");
    clearCompletedButton.disabled = completedCount === 0;
  }

  /* ---------- Events ---------- */

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateForm()) {
      showToast("Please correct the highlighted fields.", "error");
      return;
    }
    addTask();
    form.reset();
    Object.keys(errorBoxes).forEach((name) => setError(name, ""));
    render();
    showToast("Task added successfully.");
    fields.title.focus();
  });

  /* Clear a field's error as soon as the user corrects it. */
  Object.keys(errorBoxes).forEach((name) => {
    const clear = () => {
      if (fields[name].value.trim() !== "") setError(name, "");
    };
    fields[name].addEventListener("input", clear);
    fields[name].addEventListener("change", clear);
  });

  /* One listener on the list handles every checkbox and delete button. */
  list.addEventListener("click", (event) => {
    const button = event.target.closest('[data-action="delete"]');
    if (!button) return;
    deleteTask(button.closest("[data-task-id]").dataset.taskId);
    render();
  });
  list.addEventListener("change", (event) => {
    if (event.target.matches('[data-action="toggle"]')) {
      toggleTask(event.target.closest("[data-task-id]").dataset.taskId);
      render();
    }
  });

  filterBar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-task-filter]");
    if (!button) return;
    activeFilter = button.dataset.taskFilter;
    filterBar.querySelectorAll("[data-task-filter]").forEach((chip) => {
      chip.setAttribute("aria-pressed", String(chip.dataset.taskFilter === activeFilter));
    });
    render();
  });

  clearCompletedButton.addEventListener("click", () => {
    const removed = tasks.filter((task) => task.completed).length;
    if (removed === 0) return;
    tasks = tasks.filter((task) => !task.completed);
    persist();
    render();
    showToast(`Cleared ${removed} completed ${removed === 1 ? "task" : "tasks"}.`, "info");
  });

  buildCourseOptions();
  render();
})();
