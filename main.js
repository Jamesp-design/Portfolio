(function () {
  "use strict";

  const mqReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduceMotion = mqReduceMotion.matches;
  document.body.classList.toggle("reduce-motion", reduceMotion);
  mqReduceMotion.addEventListener("change", () => {
    document.body.classList.toggle("reduce-motion", mqReduceMotion.matches);
  });

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
          "a, button, [role='button'], input, textarea, select, label, summary, .logo-img, .highlight-feed__link, .footer-links__a, .project-wave-card, .intro__link, .exp-note a, .work-wave__btn, .btn--header-cta"
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

  const WAVE_GAP = 10;
  const WAVE_SCALES = [1, 0.5, 0.33, 0.21, 0.14, 0.09];

  /** @param {number} d */
  function waveScaleAt(d) {
    return WAVE_SCALES[Math.min(d, WAVE_SCALES.length - 1)] ?? 0.07;
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

    let activeIndex = 0;
    /** @type {number | null} */
    let timer = null;
    const tickMs = 5200;

    function rowMetrics() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const maxByWidth = Math.min(825, vw * 0.94);
      const hFromW = (maxByWidth * 1080) / 825;
      const maxH = vh * 0.86;
      const H = Math.min(hFromW, maxH);
      const activeW = (H * 825) / 1080;
      return { H, activeW };
    }

    function updateStatus() {
      if (!statusEl) return;
      const card = cards[activeIndex];
      const title = card && card.getAttribute("data-preview-title");
      statusEl.textContent = title ? `Showing ${title}` : "";
    }

    function layout() {
      const { H, activeW } = rowMetrics();
      root.style.setProperty("--wave-h", `${H}px`);
      root.style.setProperty("--wave-active-w", `${activeW}px`);

      let offset = 0;
      const widths = cards.map((_, i) => {
        const d = Math.abs(i - activeIndex);
        const w = activeW * waveScaleAt(d);
        return w;
      });

      cards.forEach((card, i) => {
        const w = widths[i];
        card.style.width = `${w}px`;
        card.style.flex = `0 0 ${w}px`;
        card.style.height = `${H}px`;
        card.classList.toggle("is-active", i === activeIndex);
        card.toggleAttribute("data-active", i === activeIndex);
        card.tabIndex = i === activeIndex ? 0 : -1;
      });

      let left = 0;
      for (let i = 0; i < activeIndex; i++) {
        left += widths[i] + WAVE_GAP;
      }
      const activeCenter = left + widths[activeIndex] / 2;
      const vw = viewport.clientWidth;
      const tx = vw / 2 - activeCenter;
      track.style.transform = `translate3d(${tx}px, 0, 0)`;

      updateStatus();
    }

    function go(delta) {
      const n = cards.length;
      activeIndex = (activeIndex + delta + n) % n;
      layout();
    }

    function startAuto() {
      if (reduceMotion || timer) return;
      timer = window.setInterval(() => go(1), tickMs);
    }

    function stopAuto() {
      if (!timer) return;
      window.clearInterval(timer);
      timer = null;
    }

    cards.forEach((card, i) => {
      card.addEventListener("click", (e) => {
        if (i !== activeIndex) {
          e.preventDefault();
          activeIndex = i;
          layout();
        }
      });
    });

    if (prevBtn) prevBtn.addEventListener("click", () => { stopAuto(); go(-1); startAuto(); });
    if (nextBtn) nextBtn.addEventListener("click", () => { stopAuto(); go(1); startAuto(); });

    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        stopAuto();
        go(-1);
        startAuto();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        stopAuto();
        go(1);
        startAuto();
      }
    });

    root.addEventListener("pointerenter", stopAuto);
    root.addEventListener("pointerleave", startAuto);

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
