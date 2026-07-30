(function () {
  "use strict";

  const snapRoot = document.getElementById("snap-root");
  if (!snapRoot) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** @type {NodeListOf<HTMLElement>} */
  const rails = document.querySelectorAll("[data-horizontal-rail]");

  /** @param {HTMLElement} section */
  function isSectionPinned(section) {
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;
    return Math.abs(rect.top) <= vh * 0.08 && rect.bottom >= vh * 0.92;
  }

  /** @returns {{ rail: HTMLElement; section: HTMLElement } | null} */
  function activeHorizontalContext() {
    /** @type {{ rail: HTMLElement; section: HTMLElement } | null} */
    let match = null;

    rails.forEach((rail) => {
      const section = rail.closest(".snap-section");
      if (!section || !(section instanceof HTMLElement)) return;
      if (isSectionPinned(section)) match = { rail, section };
    });

    return match;
  }

  /** @param {HTMLElement} rail */
  function railAtStart(rail) {
    return rail.scrollLeft <= 2;
  }

  /** @param {HTMLElement} rail */
  function railAtEnd(rail) {
    return rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 2;
  }

  if (!reduceMotion) {
    snapRoot.addEventListener(
      "wheel",
      (e) => {
        const ctx = activeHorizontalContext();
        if (!ctx) return;

        const { rail } = ctx;
        const dy = e.deltaY;
        if (Math.abs(dy) < 1) return;

        if (dy > 0 && !railAtEnd(rail)) {
          e.preventDefault();
          rail.scrollLeft += dy;
          return;
        }

        if (dy < 0 && !railAtStart(rail)) {
          e.preventDefault();
          rail.scrollLeft += dy;
        }
      },
      { passive: false },
    );
  }
})();
