import { DotCut } from "./dotcut/engine.js";

/** Dot-cut mesh inside the landing card only; torn down once user scrolls past. */
function initDotCutHero() {
  const host = document.querySelector("[data-dotcut-hero]");
  if (!host || !(host instanceof HTMLElement)) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const meshRegion = host.closest(".landing-panel__card") || host;
  const scrollStory = host.closest("[data-scroll-stages]");

  /** @type {DotCut | null} */
  let engine = null;
  let tornDown = false;

  function mount() {
    if (tornDown || engine) return;
    if (scrollStory?.classList.contains("scroll-story--past")) return;
    if (host.closest(".landing-panel")?.classList.contains("is-hidden")) return;

    engine = new DotCut(host, "Inter, system-ui, sans-serif");
    engine.setParams({ hold: 2800, brush: 1.4 });
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
    if (tornDown) return;
    tornDown = true;
    engine?.destroy();
    engine = null;
    meshRegion.removeEventListener("pointermove", onPointerMove);
    meshRegion.removeEventListener("pointerleave", onPointerLeave);
  }

  /** @param {PointerEvent} e */
  function onPointerMove(e) {
    if (!engine || tornDown) return;
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

  const io = new IntersectionObserver(
    (entries) => {
      if (tornDown) return;
      const visible = entries.some((e) => e.isIntersecting && e.intersectionRatio > 0.05);
      if (visible) mount();
      else {
        unmount();
        if (!entries.some((e) => e.isIntersecting)) destroy();
      }
    },
    { threshold: [0, 0.05, 0.2] },
  );
  io.observe(host);

  window.addEventListener("dotcut:teardown", destroy, { once: true });

  document.addEventListener("visibilitychange", () => {
    if (!engine || reduceMotion || tornDown) return;
    if (document.hidden) unmount();
    else mount();
  });

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      if (!tornDown && engine) engine.resize();
      else if (!tornDown) mount();
    });
  } else {
    mount();
  }

  window.addEventListener("pagehide", destroy, { once: true });
}

initDotCutHero();
