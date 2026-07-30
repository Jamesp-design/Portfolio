(function () {
  "use strict";

  const snapRoot = document.getElementById("snap-root");
  if (!snapRoot) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  /** @type {NodeListOf<HTMLElement>} */
  const rails = document.querySelectorAll("[data-horizontal-rail]");

  /** @param {WheelEvent} e */
  function wheelDeltaY(e) {
    let dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 18;
    else if (e.deltaMode === 2) dy *= window.innerHeight;
    return dy;
  }

  /** @param {HTMLElement} section */
  function isSectionSnapped(section) {
    const rect = section.getBoundingClientRect();
    return Math.abs(rect.top) <= 14;
  }

  /** @param {HTMLElement} rail */
  function railCanScroll(rail) {
    return rail.scrollWidth > rail.clientWidth + 4;
  }

  /** @param {HTMLElement} rail */
  function railAtStart(rail) {
    return rail.scrollLeft <= 2;
  }

  /** @param {HTMLElement} rail */
  function railAtEnd(rail) {
    return rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 2;
  }

  /** @returns {{ rail: HTMLElement; section: HTMLElement } | null} */
  function activeHorizontalContext() {
    /** @type {{ rail: HTMLElement; section: HTMLElement } | null} */
    let match = null;

    rails.forEach((rail) => {
      const section = rail.closest(".snap-section");
      if (!section || !(section instanceof HTMLElement)) return;
      if (!isSectionSnapped(section) || !railCanScroll(rail)) return;
      match = { rail, section };
    });

    return match;
  }

  snapRoot.addEventListener(
    "wheel",
    (e) => {
      const ctx = activeHorizontalContext();
      if (!ctx) return;

      const { rail } = ctx;
      const dy = wheelDeltaY(e);
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
    { passive: false, capture: true },
  );
})();
