(function () {
  "use strict";

  const root = document.querySelector("[data-scroll-stages]");
  if (!root) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pin = root.querySelector(".scroll-story__pin");
  if (!pin) return;

  let ticking = false;

  function clamp(v, lo, hi) {
    return Math.min(hi, Math.max(lo, v));
  }

  function setDotcutActive(active) {
    window.dispatchEvent(new CustomEvent("dotcut:active", { detail: { active } }));
  }

  function update() {
    ticking = false;
    const rect = root.getBoundingClientRect();
    const scrollRange = root.offsetHeight - window.innerHeight;
    const inView = rect.bottom > 0 && rect.top < window.innerHeight;

    root.classList.toggle("scroll-story--past", rect.bottom <= 0);
    root.classList.toggle("scroll-story--active", inView && rect.bottom > 0);

    if (scrollRange <= 0 || reduceMotion) {
      pin.style.setProperty("--shapes-opacity", "1");
      pin.style.setProperty("--intro-opacity", reduceMotion ? "1" : "0");
      setDotcutActive(inView);
      return;
    }

    /* Only animate while scroll-story is on screen */
    const progress = inView ? clamp(-rect.top / scrollRange, 0, 1) : rect.bottom <= 0 ? 1 : 0;

    const shapesOpacity = progress < 0.4 ? 1 : clamp(1 - (progress - 0.4) / 0.25, 0, 1);
    const introOpacity = progress < 0.35 ? 0 : clamp((progress - 0.35) / 0.25, 0, 1);

    pin.style.setProperty("--shapes-opacity", String(shapesOpacity));
    pin.style.setProperty("--intro-opacity", String(introOpacity));
    pin.style.setProperty("--shapes-shift", String(shapesOpacity));
    pin.style.setProperty("--shapes-pointer", shapesOpacity > 0.2 ? "auto" : "none");
    pin.style.setProperty("--intro-pointer", introOpacity > 0.5 ? "auto" : "none");
    pin.style.setProperty("--shapes-visibility", shapesOpacity > 0.02 ? "visible" : "hidden");
    pin.style.setProperty("--intro-visibility", introOpacity > 0.02 ? "visible" : "hidden");

    setDotcutActive(inView && shapesOpacity > 0.15);
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();
