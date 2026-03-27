(function () {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.classList.toggle("reduce-motion", reduceMotion);

  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /** @param {HTMLElement} nav */
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

  /** @param {HTMLElement} bar */
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

  /** @param {HTMLElement} cursor */
  function initCursor(cursor) {
    if (!cursor || reduceMotion) return;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let lx = x;
    let ly = y;
    let active = false;

    window.addEventListener(
      "pointermove",
      (e) => {
        x = e.clientX;
        y = e.clientY;
        active = true;
      },
      { passive: true }
    );

    function tick() {
      if (active) {
        lx += (x - lx) * 0.18;
        ly += (y - ly) * 0.18;
        cursor.style.setProperty("--cx", `${lx}px`);
        cursor.style.setProperty("--cy", `${ly}px`);
      }
      window.requestAnimationFrame(tick);
    }
    tick();
  }

  /** @param {NodeListOf<HTMLElement>} nodes */
  function initMagnetic(nodes) {
    if (!nodes.length || reduceMotion) return;
    nodes.forEach((el) => {
      const strength = Number(el.dataset.strength || "0.3");
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const ox = (e.clientX - (r.left + r.width / 2)) * strength;
        const oy = (e.clientY - (r.top + r.height / 2)) * strength;
        el.style.setProperty("--mx", `${ox}px`);
        el.style.setProperty("--my", `${oy}px`);
      });
      el.addEventListener("pointerleave", () => {
        el.style.setProperty("--mx", "0px");
        el.style.setProperty("--my", "0px");
      });
    });
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

  const nav = document.querySelector("[data-nav]");
  initNavScroll(nav);
  initScrollProgress(document.querySelector(".scroll-progress"));
  initCursor(document.querySelector(".cursor"));
  initMagnetic(document.querySelectorAll(".magnetic"));
  initReveal(document.querySelectorAll("[data-reveal]"));

  if (!reduceMotion) {
    document.querySelectorAll(".work-list .work-row").forEach((row) => {
      const thumb = row.querySelector(".work-row__thumb");
      row.addEventListener(
        "pointermove",
        (e) => {
          const r = row.getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * 100;
          const py = ((e.clientY - r.top) / r.height) * 100;
          row.style.setProperty("--px", `${px}%`);
          row.style.setProperty("--py", `${py}%`);
          if (!thumb) return;
          const tr = thumb.getBoundingClientRect();
          const nx = (e.clientX - tr.left) / tr.width - 0.5;
          const ny = (e.clientY - tr.top) / tr.height - 0.5;
          thumb.style.setProperty("--thumb-shift", `${nx * 12}px`);
          thumb.style.setProperty("--thumb-lift", `${ny * -10}px`);
        },
        { passive: true }
      );
      row.addEventListener("pointerleave", () => {
        if (!thumb) return;
        thumb.style.setProperty("--thumb-shift", "0px");
        thumb.style.setProperty("--thumb-lift", "0px");
      });
    });
  }
})();
