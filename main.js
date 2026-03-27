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
        el.closest("a, button, [role='button'], input, textarea, select, label, .work-row");
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
      const ringScale = hovering ? 1.52 : isDown ? 0.9 : 1;
      cursor.style.setProperty("--rs", String(ringScale));
      cursor.style.setProperty("--ds", hovering ? "0.28" : "1");

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

  /** @param {HTMLElement} preview */
  function initWorkPreview(preview) {
    const wrap = document.querySelector(".work-wrap");
    const rows = document.querySelectorAll(".work-list .work-row");
    if (!preview || !wrap || !rows.length) return;

    const imgs = preview.querySelectorAll(".work-preview__card img");
    if (imgs.length !== 3) return;

    /** @type {{ src: string; title: string }[]} */
    const slides = Array.from(rows).map((row) => ({
      src: row.getAttribute("data-preview-src") || "",
      title: row.getAttribute("data-preview-title") || "",
    }));

    function norm(i) {
      const n = slides.length;
      return ((i % n) + n) % n;
    }

    let base = 0;
    /** @type {number | null} */
    let hover = null;
    let timer = null;

    function apply() {
      const start = hover !== null ? hover : base;
      for (let d = 0; d < 3; d++) {
        const item = slides[norm(start + d)];
        const im = imgs[d];
        if (!item.src) continue;
        im.src = item.src;
        im.alt = item.title ? `Preview — ${item.title}` : "";
      }
      preview.classList.toggle("is-hover", hover !== null);
    }

    function step() {
      preview.classList.add("is-tick");
      base = norm(base + 1);
      apply();
      window.setTimeout(() => preview.classList.remove("is-tick"), 420);
    }

    function startAuto() {
      if (reduceMotion || timer) return;
      timer = window.setInterval(step, 4200);
    }

    function stopAuto() {
      if (!timer) return;
      window.clearInterval(timer);
      timer = null;
    }

    apply();

    if (!reduceMotion) {
      startAuto();
    }

    rows.forEach((row, i) => {
      row.addEventListener("pointerenter", () => {
        hover = i;
        stopAuto();
        apply();
      });
    });

    wrap.addEventListener("pointerleave", (e) => {
      const next = e.relatedTarget;
      if (next && wrap.contains(/** @type {Node} */ (next))) return;
      hover = null;
      apply();
      if (!reduceMotion) startAuto();
    });
  }

  const nav = document.querySelector("[data-nav]");
  initNavScroll(nav);
  initScrollProgress(document.querySelector(".scroll-progress"));
  initCursor(document.querySelector(".cursor"));
  initMagnetic(document.querySelectorAll(".magnetic"));
  initReveal(document.querySelectorAll("[data-reveal]"));
  initWorkPreview(document.querySelector("[data-work-preview]"));

  if (!reduceMotion) {
    document.querySelectorAll(".work-list .work-row").forEach((row) => {
      row.addEventListener(
        "pointermove",
        (e) => {
          const r = row.getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * 100;
          const py = ((e.clientY - r.top) / r.height) * 100;
          row.style.setProperty("--px", `${px}%`);
          row.style.setProperty("--py", `${py}%`);
        },
        { passive: true }
      );
    });
  }
})();
