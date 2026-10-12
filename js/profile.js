/*
 * profile.js
 * Student registration / profile form with inline validation.
 * Each field has one validator that returns an error message, or an empty
 * string when the value is acceptable. The password is never stored.
 */
"use strict";

(function () {
  const form = byId("profileForm");
  if (!form) return;

  const fieldNames = ["fullName", "regNo", "email", "department", "semester", "phone", "password", "confirmPassword"];
  const fields = {};
  const errors = {};
  fieldNames.forEach((name) => {
    fields[name] = byId(name);
    errors[name] = byId(`${name}Error`);
  });

  const touched = new Set();
  const successBox = byId("profileSuccess");
  const savedCard = byId("savedProfile");
  const removeButton = byId("removeProfile");

  /* ---------- Validators ---------- */

  const validators = {
    fullName(value) {
      const name = value.trim();
      if (name === "") return "Please enter your full name.";
      if (!/^[A-Za-z][A-Za-z .'-]{2,59}$/.test(name)) return "Use 3 to 60 letters; spaces, apostrophes and hyphens are allowed.";
      return "";
    },
    regNo(value) {
      const regNo = value.trim().toUpperCase();
      if (regNo === "") return "Please enter your registration number.";
      if (!/^\d{4}-[A-Z]{2,6}-\d{3}$/.test(regNo)) return "Use the format 2023-BSCS-014 (year, programme, three digits).";
      return "";
    },
    email(value) {
      const email = value.trim();
      if (email === "") return "Please enter your email address.";
      if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(email)) return "Please enter a valid email address, for example name@university.edu.pk.";
      return "";
    },
    department(value) {
      return value === "" ? "Please select your department." : "";
    },
    semester(value) {
      return value === "" ? "Please select your current semester." : "";
    },
    phone(value) {
      const phone = value.trim();
      if (phone === "") return "Please enter your phone number.";
      if (!/^(\+92|0)?3\d{2}[- ]?\d{7}$/.test(phone)) return "Enter a mobile number such as 0300-1234567 or +92 300 1234567.";
      return "";
    },
    password(value) {
      if (value === "") return "Please create a password.";
      const missing = [];
      if (value.length < 8) missing.push("at least 8 characters");
      if (!/[A-Z]/.test(value)) missing.push("an uppercase letter");
      if (!/[a-z]/.test(value)) missing.push("a lowercase letter");
      if (!/\d/.test(value)) missing.push("a number");
      return missing.length ? `Password needs ${missing.join(", ")}.` : "";
    },
    confirmPassword(value, values) {
      if (value === "") return "Please confirm your password.";
      if (value !== values.password) return "Passwords do not match.";
      return "";
    }
  };

  function currentValues() {
    const values = {};
    fieldNames.forEach((name) => {
      values[name] = fields[name].value;
    });
    return values;
  }

  function validateField(name) {
    const message = validators[name](fields[name].value, currentValues());
    errors[name].textContent = message;
    fields[name].classList.toggle("is-invalid", message !== "");
    fields[name].classList.toggle("is-valid", message === "");
    fields[name].setAttribute("aria-invalid", String(message !== ""));
    return message === "";
  }

  /* ---------- Password strength ---------- */

  function updateStrength() {
    const value = fields.password.value;
    const score = [
      value.length >= 8,
      /[A-Z]/.test(value),
      /[a-z]/.test(value),
      /\d/.test(value),
      /[^A-Za-z0-9]/.test(value)
    ].filter(Boolean).length;

    const labels = ["Not entered", "Very weak", "Weak", "Fair", "Good", "Strong"];
    const bar = byId("strengthBar");
    bar.style.width = `${(score / 5) * 100}%`;
    bar.parentElement.setAttribute("aria-valuenow", String(score));
    byId("strengthText").textContent = `Password strength: ${value === "" ? labels[0] : labels[score]}`;
  }

  /* ---------- Saved profile ---------- */

  function renderSavedProfile() {
    const profile = store.read(STORAGE_KEYS.profile, null);
    if (!profile) {
      savedCard.innerHTML = '<p class="text-muted">No profile has been saved in this browser yet.</p>';
      removeButton.hidden = true;
      return;
    }
    const rows = [
      ["Name", profile.fullName],
      ["Registration no.", profile.regNo],
      ["Email", profile.email],
      ["Department", profile.department],
      ["Semester", profile.semester],
      ["Phone", profile.phone]
    ];
    savedCard.innerHTML =
      '<dl class="fact-list">' +
      rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join("") +
      "</dl>";
    removeButton.hidden = false;
  }

  function prefillFromSaved() {
    const profile = store.read(STORAGE_KEYS.profile, null);
    if (!profile) return;
    ["fullName", "regNo", "email", "department", "semester", "phone"].forEach((name) => {
      if (profile[name]) fields[name].value = profile[name];
    });
  }

  /* ---------- Events ---------- */

  fieldNames.forEach((name) => {
    const field = fields[name];

    field.addEventListener("blur", () => {
      touched.add(name);
      if (name === "regNo") field.value = field.value.trim().toUpperCase();
      validateField(name);
    });

    const onChange = () => {
      if (touched.has(name) || field.classList.contains("is-invalid")) validateField(name);
      if (name === "password") {
        updateStrength();
        if (touched.has("confirmPassword")) validateField("confirmPassword");
      }
    };
    field.addEventListener("input", onChange);
    field.addEventListener("change", onChange);
  });

  document.querySelectorAll("[data-toggle-password]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = byId(button.dataset.togglePassword);
      const reveal = target.type === "password";
      target.type = reveal ? "text" : "password";
      button.textContent = reveal ? "Hide" : "Show";
      button.setAttribute("aria-pressed", String(reveal));
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    successBox.hidden = true;
    fields.regNo.value = fields.regNo.value.trim().toUpperCase();

    let firstInvalid = null;
    fieldNames.forEach((name) => {
      touched.add(name);
      if (!validateField(name) && !firstInvalid) firstInvalid = fields[name];
    });

    if (firstInvalid) {
      firstInvalid.focus();
      showToast("Please correct the highlighted fields.", "error");
      return;
    }

    const profile = {
      fullName: fields.fullName.value.trim().replace(/\s+/g, " "),
      regNo: fields.regNo.value,
      email: fields.email.value.trim(),
      department: fields.department.value,
      semester: fields.semester.value,
      phone: fields.phone.value.trim()
    };
    const saved = store.write(STORAGE_KEYS.profile, profile);

    fields.password.value = "";
    fields.confirmPassword.value = "";
    ["password", "confirmPassword"].forEach((name) => {
      fields[name].classList.remove("is-valid", "is-invalid");
      touched.delete(name);
    });
    updateStrength();

    successBox.hidden = false;
    successBox.textContent = saved
      ? `Profile saved for ${profile.fullName}. Your dashboard will now greet you by name.`
      : "Your details are valid, but this browser would not allow them to be saved.";
    renderSavedProfile();
    showToast(saved ? "Profile saved successfully." : "Profile could not be saved in this browser.", saved ? "success" : "error");
  });

  form.addEventListener("reset", () => {
    touched.clear();
    successBox.hidden = true;
    fieldNames.forEach((name) => {
      errors[name].textContent = "";
      fields[name].classList.remove("is-valid", "is-invalid");
      fields[name].removeAttribute("aria-invalid");
    });
    /* Wait for the browser to clear the values before refreshing the meter. */
    setTimeout(updateStrength, 0);
  });

  removeButton.addEventListener("click", () => {
    store.remove(STORAGE_KEYS.profile);
    form.reset();
    renderSavedProfile();
    showToast("Saved profile removed from this browser.", "info");
  });

  /* ---------- Start-up ---------- */

  byId("department").innerHTML =
    '<option value="">Select department</option>' +
    DEPARTMENTS.map((department) => `<option value="${escapeHtml(department)}">${escapeHtml(department)}</option>`).join("");
  byId("semester").innerHTML =
    '<option value="">Select semester</option>' +
    [1, 2, 3, 4, 5, 6, 7, 8].map((number) => `<option value="${number}">Semester ${number}</option>`).join("");

  prefillFromSaved();
  renderSavedProfile();
  updateStrength();
})();
