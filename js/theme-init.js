/*
 * theme-init.js
 * Runs in the <head> before the page is painted so the saved theme is applied
 * immediately and the page does not flash the wrong colours on load.
 * The toggle button itself is handled in main.js.
 */
(function () {
  var theme = "light";
  try {
    var saved = localStorage.getItem("mu_theme");
    if (saved === "dark" || saved === "light") {
      theme = saved;
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      theme = "dark";
    }
  } catch (error) {
    /* localStorage can be blocked; fall back to the light theme. */
  }
  if (theme === "dark") {
    document.documentElement.classList.add("theme-dark");
  }
})();
