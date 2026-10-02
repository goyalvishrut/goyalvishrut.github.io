// Run in the head, before styles render, to avoid a light flash on dark visits.
(() => {
  "use strict";

  const key = "vg-portfolio-theme";
  const root = document.documentElement;
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  const validTheme = (value) => value === "light" || value === "dark";
  let preference = null;
  let controls = [];

  try {
    const saved = window.localStorage.getItem(key);
    if (validTheme(saved)) preference = saved;
  } catch {
    // Storage can be unavailable for private browsing or file:// previews.
  }

  const applyTheme = () => {
    const theme = preference || (system.matches ? "dark" : "light");
    root.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#151c18" : "#f6f5ef");
    for (const button of controls) {
      button.setAttribute("aria-pressed", String(theme === "dark"));
      button.title = `Switch to ${theme === "dark" ? "light" : "dark"} mode`;
    }
  };

  applyTheme();

  const initializeControls = () => {
    controls = [...document.querySelectorAll("[data-theme-toggle]")];
    for (const button of controls) {
      button.hidden = false;
      button.addEventListener("click", () => {
        preference = root.dataset.theme === "dark" ? "light" : "dark";
        try {
          window.localStorage.setItem(key, preference);
        } catch {
          // The toggle still works for this page when persistence is blocked.
        }
        applyTheme();
      });
    }
    applyTheme();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeControls, {
      once: true,
    });
  } else {
    initializeControls();
  }

  system.addEventListener("change", () => {
    if (preference === null) applyTheme();
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== key && event.key !== null) return;
    preference = validTheme(event.newValue) ? event.newValue : null;
    applyTheme();
  });
})();
