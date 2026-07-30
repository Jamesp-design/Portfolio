import { DotCut } from "./dotcut/engine.js";

/**
 * Full-bleed dot-cut mesh behind the Webflow hero (jamesp.co / main).
 */
function initDotCutHero() {
  const host = document.querySelector("[data-dotcut-hero]");
  if (!host || !(host instanceof HTMLElement)) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const meshRegion = host.closest(".page-wrapper") || document.body;

  /** @type {DotCut | null} */
  let engine = null;

  function mount() {
    if (engine) return;
    engine = new DotCut(host, "Recoleta, Lato, sans-serif");
    if (!engine.ok) {
      engine = null;
      return;
    }
    if (reduceMotion) {
      engine.renderStill();
      return;
    }
    engine.start();
  }

  function unmount() {
    engine?.stop();
  }

  function destroy() {
    engine?.destroy();
    engine = null;
  }

  /** @param {PointerEvent} e */
  function onPointerMove(e) {
    if (!engine) return;
    const rect = host.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    engine.setPointer(engine.toCell(px, py));
  }

  function onPointerLeave() {
    engine?.setPointer(null);
  }

  if (!reduceMotion) {
    meshRegion.addEventListener("pointermove", onPointerMove, { passive: true });
    meshRegion.addEventListener("pointerleave", onPointerLeave, { passive: true });
  }

  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries.some((e) => e.isIntersecting);
      if (visible) mount();
      else unmount();
    },
    { threshold: 0.05 },
  );
  io.observe(host);

  document.addEventListener("visibilitychange", () => {
    if (!engine || reduceMotion) return;
    if (document.hidden) unmount();
    else mount();
  });

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      if (engine) engine.resize();
      else mount();
    });
  } else {
    mount();
  }

  window.addEventListener("pagehide", destroy, { once: true });
}

initDotCutHero();
