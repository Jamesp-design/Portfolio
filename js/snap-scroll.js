(function () {
  "use strict";

  const snapRoot = document.getElementById("snap-root");
  if (!snapRoot) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  /** @type {NodeListOf<HTMLElement>} */
  const rails = document.querySelectorAll("[data-horizontal-rail]");

  /** @param {HTMLElement} section */
  function sectionFillRatio(section) {
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;
    const visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
    return visible / vh;
  }

  /** @returns {{ rail: HTMLElement; section: HTMLElement } | null} */
  function activeHorizontalContext() {
    let best = null;
    let bestRatio = 0.45;

    rails.forEach((rail) => {
      const section = rail.closest(".snap-section");
      if (!section) return;
      const ratio = sectionFillRatio(section);
      if (ratio > bestRatio) {
        bestRatio = ratio;
        best = { rail, section };
      }
    });

    return best;
  }

  /** @param {HTMLElement} rail */
  function railAtStart(rail) {
    return rail.scrollLeft <= 2;
  }

  /** @param {HTMLElement} rail */
  function railAtEnd(rail) {
    return rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 2;
  }

  snapRoot.addEventListener(
    "wheel",
    (e) => {
      const ctx = activeHorizontalContext();
      if (!ctx) return;

      const { rail } = ctx;
      const dy = e.deltaY;
      if (Math.abs(dy) < 1) return;

      const scrollingDown = dy > 0;
      const scrollingUp = dy < 0;

      if (scrollingDown && !railAtEnd(rail)) {
        e.preventDefault();
        rail.scrollLeft += dy;
        return;
      }

      if (scrollingUp && !railAtStart(rail)) {
        e.preventDefault();
        rail.scrollLeft += dy;
      }
    },
    { passive: false },
  );
})();
