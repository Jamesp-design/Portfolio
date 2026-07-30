(function () {
  "use strict";

  const root = document.querySelector("[data-scroll-stages]");
  if (!root) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pin = root.querySelector(".scroll-story__pin");
  const landingPanel = root.querySelector('[data-stage="shapes"]');
  if (!pin) return;

  let ticking = false;
  let dotcutTornDown = false;

  function clamp(v, lo, hi) {
    return Math.min(hi, Math.max(lo, v));
  }

  function teardownDotcut() {
    if (dotcutTornDown) return;
    dotcutTornDown = true;
    window.dispatchEvent(new CustomEvent("dotcut:teardown"));
  }

  function update() {
    ticking = false;
    const rect = root.getBoundingClientRect();
    const scrollRange = root.offsetHeight - window.innerHeight;

    /* Scroll-story fully above viewport — hide and kill mesh */
    if (rect.bottom <= 0) {
      root.classList.add("scroll-story--past");
      if (landingPanel) landingPanel.classList.add("is-hidden");
      teardownDotcut();
      return;
    }

    root.classList.remove("scroll-story--past");

    if (scrollRange <= 0 || reduceMotion) {
      pin.style.setProperty("--shapes-opacity", "1");
      pin.style.setProperty("--intro-opacity", reduceMotion ? "1" : "0");
      return;
    }

    const progress = clamp(-rect.top / scrollRange, 0, 1);

    const shapesOpacity = progress < 0.42 ? 1 : clamp(1 - (progress - 0.42) / 0.28, 0, 1);
    const introOpacity = progress < 0.38 ? 0 : clamp((progress - 0.38) / 0.28, 0, 1);

    pin.style.setProperty("--shapes-opacity", String(shapesOpacity));
    pin.style.setProperty("--intro-opacity", String(introOpacity));
    pin.style.setProperty("--shapes-shift", String(shapesOpacity));
    pin.style.setProperty("--shapes-pointer", shapesOpacity > 0.15 ? "auto" : "none");
    pin.style.setProperty("--intro-pointer", introOpacity > 0.85 ? "auto" : "none");

    if (landingPanel) {
      const hideShapes = shapesOpacity < 0.04;
      landingPanel.classList.toggle("is-hidden", hideShapes);
      if (hideShapes) teardownDotcut();
    }
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
