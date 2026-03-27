(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.body.classList.toggle("reduce-motion", reduceMotion);

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
        el.closest(
          "a, button, [role='button'], input, textarea, select, label, summary, .work-row, .nav-icon, .skill-pill, .logo-img"
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

  /** @param {HTMLElement} preview */
  function initWorkPreview(preview) {
    const wrap = document.querySelector(".work-wrap");
    const stack = preview && preview.querySelector(".work-preview__stack");
    const rows = document.querySelectorAll(".work-list .work-row");
    if (!preview || !wrap || !stack || !rows.length) return;

    if (stack.querySelectorAll(".work-preview__card").length !== 3) return;

    /** @type {{ src: string; title: string }[]} */
    const slides = Array.from(rows).map((row) => ({
      src: row.getAttribute("data-preview-src") || "",
      title: row.getAttribute("data-preview-title") || "",
    }));

    function norm(i) {
      const n = slides.length;
      return ((i % n) + n) % n;
    }

    /** DOM order changes after each deal(); always read fresh. */
    function getOrderedFigures() {
      return [...stack.querySelectorAll(".work-preview__card")];
    }

    let base = 0;
    /** @type {number | null} */
    let hover = null;
    let timer = null;
    let stepLock = false;
    const tickMs = 520;

    function deal() {
      if (reduceMotion) return;
      const front = stack.lastElementChild;
      if (front) stack.insertBefore(front, stack.firstElementChild);
    }

    function apply() {
      const start = hover !== null ? hover : base;
      const ordered = getOrderedFigures();
      for (let d = 0; d < 3; d++) {
        const item = slides[norm(start + d)];
        const im = ordered[d] && ordered[d].querySelector("img");
        if (!im || !item.src) continue;
        if (im.getAttribute("src") !== item.src) {
          im.setAttribute("src", item.src);
        }
        im.alt = item.title ? `Preview — ${item.title}` : "";
      }
      preview.classList.toggle("is-hover", hover !== null);
    }

    function endAutoTick() {
      window.setTimeout(() => {
        preview.classList.remove("is-tick");
        stepLock = false;
      }, tickMs);
    }

    function runHoverDeal() {
      if (reduceMotion) {
        apply();
        return;
      }
      preview.classList.add("is-tick");
      deal();
      apply();
      window.setTimeout(() => preview.classList.remove("is-tick"), tickMs);
    }

    function step() {
      if (stepLock) return;
      stepLock = true;
      preview.classList.add("is-tick");
      deal();
      base = norm(base + 1);
      apply();
      endAutoTick();
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
        runHoverDeal();
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

  function initSkillPills() {
    const wrap = document.querySelector("[data-skill-pills]");
    const status = document.querySelector("[data-skill-status]");
    if (!wrap || !status) return;

    const lines = [
      "That’s the spine of how I ship.",
      "Big part of my process — talk to me about it.",
      "One of my favourite tools in the kit.",
      "Where clarity compounds over time.",
      "The fun bit — motion with purpose.",
      "I tinker so interfaces feel alive.",
      "Words are interface, too.",
      "Facilitation > hero design.",
    ];

    wrap.querySelectorAll("[data-skill]").forEach((btn, i) => {
      btn.addEventListener("click", () => {
        wrap.querySelectorAll(".is-picked").forEach((b) => b.classList.remove("is-picked"));
        btn.classList.add("is-picked");
        status.textContent = lines[i % lines.length];
      });
    });
  }

  const nav = document.querySelector("[data-nav]");
  initNavScroll(nav);
  initScrollProgress(document.querySelector(".scroll-progress"));
  initCursor(document.querySelector(".cursor"));
  initReveal(document.querySelectorAll("[data-reveal]"));
  initWorkPreview(document.querySelector("[data-work-preview]"));
  initSkillPills();

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
