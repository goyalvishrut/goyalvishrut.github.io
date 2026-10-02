(() => {
  "use strict";

  const header = document.querySelector(".site-header");
  const menuToggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#site-nav");
  const smallScreen = window.matchMedia("(max-width: 800px)");

  if (header && menuToggle && nav) {
    const closeMenu = () => {
      menuToggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
      menuToggle.querySelector("span").textContent = "+";
    };
    const syncMenu = () => {
      // Return focus before hiding the control or a focused navigation link.
      const active = document.activeElement;
      if (smallScreen.matches) menuToggle.hidden = false;
      if (smallScreen.matches && nav.contains(active)) menuToggle.focus();
      if (!smallScreen.matches && active === menuToggle)
        nav.querySelector("a").focus();
      menuToggle.hidden = !smallScreen.matches;
      closeMenu();
    };
    header.classList.add("nav-enhanced");
    menuToggle.addEventListener("click", () => {
      const open = menuToggle.getAttribute("aria-expanded") !== "true";
      menuToggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
      menuToggle.querySelector("span").textContent = open ? "−" : "+";
    });
    nav.addEventListener("click", (event) => {
      const link = event.target.closest("a");
      if (!link) return;
      closeMenu();
      if (
        smallScreen.matches &&
        link.hash &&
        link.pathname === location.pathname
      ) {
        const target = document.getElementById(link.hash.slice(1));
        if (target) {
          target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
          target.addEventListener(
            "blur",
            () => target.removeAttribute("tabindex"),
            { once: true },
          );
        }
      }
    });
    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        menuToggle.getAttribute("aria-expanded") === "true"
      ) {
        closeMenu();
        menuToggle.focus();
      }
    });
    document.addEventListener("click", (event) => {
      if (!header.contains(event.target)) closeMenu();
    });
    header.addEventListener("focusout", (event) => {
      if (event.relatedTarget && !header.contains(event.relatedTarget))
        closeMenu();
    });
    smallScreen.addEventListener("change", syncMenu);
    syncMenu();
  }

  const filters = document.querySelector(".work-filters");
  const cards = [...document.querySelectorAll(".work-card")];
  const count = document.querySelector("#work-count");
  if (filters && cards.length && count) {
    filters.hidden = false;
    filters.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-filter]");
      if (!button) return;
      const filter = button.dataset.filter;
      for (const item of filters.querySelectorAll("button")) {
        item.setAttribute("aria-pressed", String(item === button));
      }
      let visible = 0;
      for (const card of cards) {
        card.hidden =
          filter !== "all" &&
          !card.dataset.category.split(" ").includes(filter);
        if (!card.hidden) visible += 1;
      }
      const label =
        filter === "all"
          ? "selected work areas"
          : `${filter === "platform" ? "platform" : filter === "mobile" ? "mobile" : "experimental"} work areas`;
      count.textContent = `${visible} ${label}`;
    });
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if ("IntersectionObserver" in window) {
    const entranceObserver = new IntersectionObserver(
      (entries, observer) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (!reduceMotion.matches) entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12 },
    );
    document
      .querySelectorAll(".reveal")
      .forEach((element) => entranceObserver.observe(element));

    const sectionLinks = [
      ...document.querySelectorAll(".site-nav a[href^='#']"),
    ];
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          sectionLinks.forEach((link) => {
            if (link.hash === `#${entry.target.id}`)
              link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
          });
        }
      },
      { rootMargin: "-15% 0px -65% 0px", threshold: 0 },
    );
    sectionLinks.forEach((link) => {
      const section = document.querySelector(link.hash);
      if (section) sectionObserver.observe(section);
    });
    const hero = document.querySelector("#top");
    if (hero) sectionObserver.observe(hero);
  }

  document.querySelectorAll("[data-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });
  const printButton = document.querySelector("[data-print]");
  if (printButton) {
    printButton.hidden = false;
    printButton.addEventListener("click", () => window.print());
  }
})();
