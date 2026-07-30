(function () {
  "use strict";

  const snapRoot = document.getElementById("snap-root");
  if (!snapRoot) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** @type {HTMLElement[]} */
  const sections = [...snapRoot.querySelectorAll(".snap-section")].filter(
    (el) => el instanceof HTMLElement,
  );

  /** @type {HTMLElement[]} */
  const rails = [...document.querySelectorAll("[data-horizontal-rail]")].filter(
    (el) => el instanceof HTMLElement,
  );

  /** Cooldown after leaving a rail so vertical scroll isn't re-captured. */
  let verticalPassThroughUntil = 0;

  /** @param {WheelEvent} e */
  function wheelDeltaY(e) {
    let dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 48;
    else if (e.deltaMode === 2) dy *= window.innerHeight;
    return dy * 2.2;
  }

  /** @param {HTMLElement} section */
  function isActiveSection(section) {
    if (performance.now() < verticalPassThroughUntil) return false;
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;
    if (rect.top > vh * 0.2 || rect.bottom < vh * 0.5) return false;
    return Math.abs(rect.top) <= Math.max(64, vh * 0.14);
  }

  /** @param {HTMLElement} rail */
  function railMaxScroll(rail) {
    return Math.max(0, rail.scrollWidth - rail.clientWidth);
  }

  /** @param {HTMLElement} rail */
  function railAtStart(rail) {
    return rail.scrollLeft <= 6;
  }

  /** @param {HTMLElement} rail */
  function railAtEnd(rail) {
    return rail.scrollLeft >= railMaxScroll(rail) - 6;
  }

  /** @returns {{ rail: HTMLElement; section: HTMLElement } | null} */
  function activeHorizontalContext() {
    /** @type {{ rail: HTMLElement; section: HTMLElement } | null} */
    let match = null;

    for (const rail of rails) {
      const section = rail.closest(".snap-section");
      if (!section || !(section instanceof HTMLElement)) continue;
      if (!isActiveSection(section)) continue;
      if (railMaxScroll(rail) <= 8) continue;
      match = { rail, section };
    }

    return match;
  }

  /** @param {HTMLElement} target */
  function scrollSnapRootTo(target) {
    const top = target.offsetTop;
    snapRoot.scrollTo({
      top,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  /** @param {HTMLElement} section @param {number} direction */
  function leaveHorizontalSection(section, direction) {
    const idx = sections.indexOf(section);
    const target = sections[idx + direction];
    if (!target) return;

    verticalPassThroughUntil = performance.now() + 700;
    scrollSnapRootTo(target);
  }

  document.addEventListener(
    "wheel",
    (e) => {
      const ctx = activeHorizontalContext();
      if (!ctx) return;

      const { rail, section } = ctx;
      const dy = wheelDeltaY(e);
      if (Math.abs(dy) < 1) return;

      const scrollingDown = dy > 0;
      const scrollingUp = dy < 0;

      if (scrollingDown) {
        if (railAtEnd(rail)) {
          e.preventDefault();
          leaveHorizontalSection(section, 1);
          return;
        }
        e.preventDefault();
        rail.scrollLeft = Math.min(railMaxScroll(rail), rail.scrollLeft + dy);
        return;
      }

      if (scrollingUp) {
        if (railAtStart(rail)) {
          e.preventDefault();
          leaveHorizontalSection(section, -1);
          return;
        }
        e.preventDefault();
        rail.scrollLeft = Math.max(0, rail.scrollLeft + dy);
      }
    },
    { passive: false, capture: true },
  );
})();
