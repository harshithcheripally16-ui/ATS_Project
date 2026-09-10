/**
 * Synchronous theme initializer - runs in <head> to prevent theme flash (FOUC)
 */
(function() {
  try {
    var storedTheme = localStorage.getItem("theme");
    var theme = storedTheme || "dark";
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();
