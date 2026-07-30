import { DotCut } from "./dotcut/engine.js";

function initDotCutHero() {
  const host = document.querySelector("[data-dotcut-hero]");
  if (!host || !(host instanceof HTMLElement)) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const heroSection = host.closest(".section-hero");
  const meshRegion = heroSection || host;

  /** @type {DotCut | null} */
  let engine = null;
  let shouldRun = true;

  function mount() {
    if (!shouldRun) return;
    if (!engine) {
      engine = new DotCut(host, "Inter, system-ui, sans-serif");
      engine.setParams({ hold: 2800, brush: 2.4, cols: 22 });
      if (!engine.ok) {
        engine = null;
        return;
      }
    }
    if (reduceMotion) {
      engine.renderStill();
      return;
    }
    engine.start();
  }

  function pause() {
    engine?.stop();
  }

  function destroy() {
    engine?.destroy();
    engine = null;
    meshRegion.removeEventListener("pointermove", onPointerMove);
    meshRegion.removeEventListener("pointerleave", onPointerLeave);
  }

  function onPointerMove(e) {
    if (!engine || !shouldRun) return;
    const rect = host.getBoundingClientRect();
    engine.setPointer(engine.toCell(e.clientX - rect.left, e.clientY - rect.top));
  }

  function onPointerLeave() {
    engine?.setPointer(null);
  }

  if (!reduceMotion) {
    meshRegion.addEventListener("pointermove", onPointerMove, { passive: true });
    meshRegion.addEventListener("pointerleave", onPointerLeave, { passive: true });
  }

  const observeTarget = heroSection || host;
  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries.some((e) => e.isIntersecting && e.intersectionRatio > 0.2);
      shouldRun = visible;
      if (visible) mount();
      else pause();
    },
    { threshold: [0, 0.2, 0.5] },
  );
  io.observe(observeTarget);

  document.addEventListener("visibilitychange", () => {
    if (!engine || reduceMotion) return;
    if (document.hidden) pause();
    else if (shouldRun) mount();
  });

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      if (engine) engine.resize();
      else if (shouldRun) mount();
    });
  } else if (shouldRun) {
    mount();
  }

  window.addEventListener("pagehide", destroy, { once: true });
}

initDotCutHero();
