import { DotCut } from "./dotcut/engine.js";

/** Dot-cut mesh inside the landing card; pauses off-screen, resumes on scroll back. */
function initDotCutHero() {
  const host = document.querySelector("[data-dotcut-hero]");
  if (!host || !(host instanceof HTMLElement)) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const meshRegion = host.closest(".landing-panel__card") || host;

  /** @type {DotCut | null} */
  let engine = null;
  let shouldRun = true;

  function mount() {
    if (!shouldRun) return;

    if (!engine) {
      engine = new DotCut(host, "Inter, system-ui, sans-serif");
      engine.setParams({ hold: 2800, brush: 1.4 });
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

  /** @param {PointerEvent} e */
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

  window.addEventListener("dotcut:active", (e) => {
    const active = /** @type {CustomEvent<{ active: boolean }>} */ (e).detail?.active;
    shouldRun = active !== false;
    if (shouldRun) mount();
    else pause();
  });

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
