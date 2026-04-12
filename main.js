(function () {
  "use strict";

  const mqReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduceMotion = mqReduceMotion.matches;
  document.body.classList.toggle("reduce-motion", reduceMotion);
  mqReduceMotion.addEventListener("change", () => {
    document.body.classList.toggle("reduce-motion", mqReduceMotion.matches);
  });

  const mqFineHover = window.matchMedia("(hover: hover) and (pointer: fine)");

  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /** @param {HTMLElement | null} nav */
  function initNavScroll(nav) {
    if (!nav || reduceMotion) return;
    let ticking = false;
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY || document.documentElement.scrollTop;
          nav.classList.toggle("nav--dense", y > 40);
          ticking = false;
        });
        ticking = true;
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /** @param {HTMLElement | null} bar */
  function initScrollProgress(bar) {
    if (!bar) return;
    function setProgress() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const p = max > 0 ? (doc.scrollTop / max) * 100 : 0;
      bar.style.transform = `scaleX(${Math.min(1, Math.max(0, p / 100))})`;
    }
    window.addEventListener("scroll", setProgress, { passive: true });
    window.addEventListener("resize", setProgress);
    setProgress();
  }

  /** @param {HTMLElement | null} cursor */
  function initCursor(cursor) {
    if (!cursor || reduceMotion) return;

    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let dx = tx;
    let dy = ty;
    let rx = tx;
    let ry = ty;
    let isDown = false;

    function setHoverFromPoint(clientX, clientY) {
      const el = document.elementFromPoint(clientX, clientY);
      const interactive =
        el &&
        el.closest &&
        el.closest(
          "a, button, [role='button'], input, textarea, select, label, summary, .logo-img, .highlight-card__link, .footer-links__a, .project-wave-card, .intro__link, .exp-note a, .work-wave__btn, .btn--header-cta"
        );
      cursor.classList.toggle("is-hover", !!interactive);
    }

    window.addEventListener(
      "pointermove",
      (e) => {
        tx = e.clientX;
        ty = e.clientY;
        setHoverFromPoint(tx, ty);
      },
      { passive: true }
    );

    window.addEventListener("pointerdown", () => {
      isDown = true;
      cursor.classList.add("is-down");
    });
    window.addEventListener("pointerup", () => {
      isDown = false;
      cursor.classList.remove("is-down");
    });

    function tick() {
      const fd = 0.42;
      const fr = 0.13;
      dx += (tx - dx) * fd;
      dy += (ty - dy) * fd;
      rx += (tx - rx) * fr;
      ry += (ty - ry) * fr;

      cursor.style.setProperty("--dx", `${dx}px`);
      cursor.style.setProperty("--dy", `${dy}px`);
      cursor.style.setProperty("--rx", `${rx}px`);
      cursor.style.setProperty("--ry", `${ry}px`);

      const hovering = cursor.classList.contains("is-hover");
      const ringScale = hovering ? 1.6 : isDown ? 0.9 : 1;
      cursor.style.setProperty("--rs", String(ringScale));
      cursor.style.setProperty("--ds", hovering ? "0.26" : "1");

      window.requestAnimationFrame(tick);
    }
    tick();
  }

  /** @param {NodeListOf<HTMLElement>} items */
  function initReveal(items) {
    if (!items.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("is-visible");
            io.unobserve(en.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    items.forEach((el) => io.observe(el));
  }

  /** @param {number} n */
  function buildPingPongSequence(n) {
    if (n <= 1) return [0];
    const seq = [];
    for (let i = 0; i < n; i++) seq.push(i);
    for (let i = n - 2; i >= 1; i--) seq.push(i);
    return seq;
  }

  const WAVE_GAP = 10;
  const WAVE_SCALES = [1, 0.42, 0.27, 0.17, 0.11, 0.072];

  /** @param {number} d */
  function waveScaleAt(d) {
    return WAVE_SCALES[Math.min(d, WAVE_SCALES.length - 1)] ?? 0.06;
  }

  /** @param {HTMLElement | null} root */
  function initWorkWave(root) {
    if (!root) return;
    const track = root.querySelector("[data-wave-track]");
    const viewport = root.querySelector(".work-wave__viewport");
    const statusEl = root.querySelector("[data-wave-status]");
    const prevBtn = root.querySelector("[data-wave-prev]");
    const nextBtn = root.querySelector("[data-wave-next]");
    /** @type {HTMLElement[]} */
    const cards = track ? [...track.querySelectorAll(".project-wave-card")] : [];
    if (!track || !viewport || cards.length === 0) return;

    const n = cards.length;
    const pingPong = buildPingPongSequence(n);
    let seqPos = 0;
    let autoIndex = pingPong[0];
    /** @type {number | null} */
    let hoverIndex = null;
    let mouseInsideStage = false;
    /** @type {number | null} */
    let timer = null;
    const tickMs = 4800;
    let rafHover = 0;

    function rowMetrics() {
      const vw = viewport.clientWidth;
      const vh = window.innerHeight;
      const maxW = Math.min(vw * 0.92, 720);
      const hCapByWidth = (maxW * 1080) / 825;
      const hCapByViewport = Math.min(vh * 0.36, vw * 0.55);
      const H = Math.max(128, Math.min(hCapByWidth, hCapByViewport, 420));
      const activeW = (H * 825) / 1080;
      return { H, activeW };
    }

    function effectiveIndex() {
      if (mqFineHover.matches && mouseInsideStage && hoverIndex !== null) {
        return hoverIndex;
      }
      return autoIndex;
    }

    function updateStatus() {
      if (!statusEl) return;
      const ei = effectiveIndex();
      const card = cards[ei];
      const title = card && card.getAttribute("data-preview-title");
      statusEl.textContent = title ? `Showing ${title}` : "";
    }

    function layout() {
      const ei = effectiveIndex();
      const { H, activeW } = rowMetrics();
      root.style.setProperty("--wave-h", `${H}px`);
      root.style.setProperty("--wave-active-w", `${activeW}px`);

      const widths = cards.map((_, i) => {
        const d = Math.abs(i - ei);
        return activeW * waveScaleAt(d);
      });

      cards.forEach((card, i) => {
        const w = widths[i];
        card.style.width = `${w}px`;
        card.style.flex = `0 0 ${w}px`;
        card.style.height = `${H}px`;
        const active = i === ei;
        card.classList.toggle("is-active", active);
        card.toggleAttribute("data-active", active);
        card.tabIndex = active ? 0 : -1;
      });

      let left = 0;
      for (let i = 0; i < ei; i++) {
        left += widths[i] + WAVE_GAP;
      }
      const activeCenter = left + widths[ei] / 2;
      const vw = viewport.clientWidth;
      const tx = vw / 2 - activeCenter;
      track.style.transform = `translate3d(${tx}px, 0, 0)`;

      updateStatus();
    }

    function syncSeqToIndex(idx) {
      for (let k = 0; k < pingPong.length; k++) {
        const test = (seqPos + k) % pingPong.length;
        if (pingPong[test] === idx) {
          seqPos = test;
          autoIndex = pingPong[seqPos];
          return;
        }
      }
      autoIndex = idx;
    }

    function stepAuto(delta) {
      seqPos = (seqPos + delta + pingPong.length) % pingPong.length;
      autoIndex = pingPong[seqPos];
      layout();
    }

    function startAuto() {
      if (reduceMotion || timer || mouseInsideStage) return;
      timer = window.setInterval(() => stepAuto(1), tickMs);
    }

    function stopAuto() {
      if (!timer) return;
      window.clearInterval(timer);
      timer = null;
    }

    function onStagePointerMove(e) {
      if (!mqFineHover.matches) return;
      if (rafHover) return;
      rafHover = window.requestAnimationFrame(() => {
        rafHover = 0;
        const under = document.elementFromPoint(e.clientX, e.clientY);
        const cardEl = under && under.closest && under.closest(".project-wave-card");
        const next = cardEl ? cards.indexOf(/** @type {HTMLElement} */ (cardEl)) : null;
        if (next !== hoverIndex) {
          hoverIndex = next;
          layout();
        }
      });
    }

    root.addEventListener("pointermove", onStagePointerMove, { passive: true });

    root.addEventListener("pointerenter", () => {
      mouseInsideStage = true;
      stopAuto();
      layout();
    });

    root.addEventListener("pointerleave", () => {
      const lastShown =
        mqFineHover.matches && hoverIndex !== null ? hoverIndex : autoIndex;
      mouseInsideStage = false;
      hoverIndex = null;
      syncSeqToIndex(lastShown);
      layout();
      if (!reduceMotion) startAuto();
    });

    cards.forEach((card, i) => {
      card.addEventListener("click", (e) => {
        if (i !== effectiveIndex()) {
          e.preventDefault();
          syncSeqToIndex(i);
          layout();
        }
      });
    });

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        stopAuto();
        stepAuto(-1);
        startAuto();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        stopAuto();
        stepAuto(1);
        startAuto();
      });
    }

    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        stopAuto();
        stepAuto(-1);
        startAuto();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        stopAuto();
        stepAuto(1);
        startAuto();
      }
    });

    window.addEventListener("resize", layout);

    layout();
    if (!reduceMotion) startAuto();

    if (!reduceMotion) {
      cards.forEach((card) => {
        card.addEventListener(
          "pointermove",
          (e) => {
            const r = card.getBoundingClientRect();
            const px = ((e.clientX - r.left) / r.width) * 100;
            const py = ((e.clientY - r.top) / r.height) * 100;
            card.style.setProperty("--px", `${px}%`);
            card.style.setProperty("--py", `${py}%`);
          },
          { passive: true }
        );
      });
    }
  }

  const nav = document.querySelector("[data-nav]");
  initNavScroll(nav);
  initScrollProgress(document.querySelector(".scroll-progress"));
  initCursor(document.querySelector(".cursor"));
  initReveal(document.querySelectorAll("[data-reveal]"));
  initWorkWave(document.querySelector("[data-work-wave]"));
})();
