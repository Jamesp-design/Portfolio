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

  /** @param {WheelEvent} e */
  function wheelDeltaY(e) {
    let dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 40;
    else if (e.deltaMode === 2) dy *= window.innerHeight;
    return dy;
  }

  /** @param {HTMLElement} section */
  function isActiveSection(section) {
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;
    if (rect.top > vh * 0.35 || rect.bottom < vh * 0.45) return false;
    return Math.abs(rect.top) <= Math.max(48, vh * 0.12);
  }

  /** @returns {{ rail: HTMLElement; section: HTMLElement } | null} */
  function activeHorizontalContext() {
    /** @type {{ rail: HTMLElement; section: HTMLElement } | null} */
    let match = null;

    for (const rail of rails) {
      const section = rail.closest(".snap-section");
      if (!section || !(section instanceof HTMLElement)) continue;
      if (!isActiveSection(section)) continue;
      if (rail.scrollWidth <= rail.clientWidth + 8) continue;
      match = { rail, section };
    }

    return match;
  }

  /** @param {HTMLElement} rail */
  function currentSlideIndex(rail) {
    const slides = [...rail.children];
    if (!slides.length) return 0;

    const mid = rail.scrollLeft + rail.clientWidth * 0.5;
    let best = 0;
    let bestDist = Infinity;

    slides.forEach((slide, i) => {
      if (!(slide instanceof HTMLElement)) return;
      const center = slide.offsetLeft + slide.offsetWidth * 0.5;
      const dist = Math.abs(center - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });

    return best;
  }

  /** @param {HTMLElement} rail @param {number} direction */
  function scrollRailStep(rail, direction) {
    const slides = [...rail.children].filter((el) => el instanceof HTMLElement);
    if (!slides.length) return "none";

    const idx = currentSlideIndex(rail);
    const next = idx + direction;

    if (next < 0) return "start";
    if (next >= slides.length) return "end";

    slides[next].scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      inline: "center",
      block: "nearest",
    });
    return "moved";
  }

  /** @param {HTMLElement} section @param {number} direction */
  function scrollVerticalSection(section, direction) {
    const idx = sections.indexOf(section);
    const target = sections[idx + direction];
    if (!target) return;

    target.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  let wheelAccum = 0;
  let stepLocked = false;

  document.addEventListener(
    "wheel",
    (e) => {
      const ctx = activeHorizontalContext();
      if (!ctx) {
        wheelAccum = 0;
        return;
      }

      if (stepLocked) {
        e.preventDefault();
        return;
      }

      wheelAccum += wheelDeltaY(e);
      if (Math.abs(wheelAccum) < 50) {
        e.preventDefault();
        return;
      }

      const direction = wheelAccum > 0 ? 1 : -1;
      wheelAccum = 0;
      e.preventDefault();

      const { rail, section } = ctx;

      if (direction > 0) {
        const result = scrollRailStep(rail, 1);
        if (result === "end" || result === "none") scrollVerticalSection(section, 1);
      } else {
        const result = scrollRailStep(rail, -1);
        if (result === "start" || result === "none") scrollVerticalSection(section, -1);
      }

      stepLocked = true;
      window.setTimeout(() => {
        stepLocked = false;
      }, 380);
    },
    { passive: false, capture: true },
  );
})();
