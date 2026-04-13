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

  /** @param {HTMLElement | null} nav */
  /** @param {HTMLElement | null} hero */
  function initNavHeroDark(nav, hero) {
    if (!nav || !hero) return;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;
        nav.classList.toggle("nav--hero-dark", e.isIntersecting);
      },
      { threshold: 0, rootMargin: "-40px 0px 0px 0px" }
    );
    io.observe(hero);
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
          "a, button, [role='button'], input, textarea, select, label, summary, .logo-img, .highlight-card__link, .footer-links__a, .project-sticker, .hero-home__link, .exp-note a, .btn--header-cta"
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

  /** @param {HTMLElement | null} root */
  function initProjectStickers(root) {
    if (!root) return;
    const statusEl = root.querySelector("[data-project-stage-status]");
    /** @type {NodeListOf<HTMLAnchorElement>} */
    const stickers = root.querySelectorAll(".project-sticker");
    /** @type {NodeListOf<HTMLImageElement>} */
    const imgs = root.querySelectorAll(".work-showcase__hero-img");
    if (stickers.length === 0 || imgs.length === 0) return;

    function setActive(index) {
      const i = Math.max(0, Math.min(index, imgs.length - 1));
      root.dataset.activeProject = String(i);
      imgs.forEach((img, j) => {
        img.classList.toggle("is-active", j === i);
      });
      const sticker = [...stickers].find((s) => Number(s.dataset.projectIndex) === i);
      const title = sticker && sticker.dataset.previewTitle;
      if (statusEl) {
        statusEl.textContent = title ? `Showing ${title}` : "";
      }
    }

    setActive(0);

    stickers.forEach((sticker) => {
      sticker.addEventListener("mouseenter", () => {
        const idx = Number(sticker.dataset.projectIndex);
        if (!Number.isNaN(idx)) setActive(idx);
      });
      sticker.addEventListener("focusin", () => {
        const idx = Number(sticker.dataset.projectIndex);
        if (!Number.isNaN(idx)) setActive(idx);
      });
    });

    root.addEventListener("mouseleave", () => {
      if (mqFineHover.matches) setActive(0);
    });

    root.addEventListener("focusout", (e) => {
      const next = /** @type {FocusEvent} */ (e).relatedTarget;
      if (!next || !(next instanceof Node) || !root.contains(next)) {
        setActive(0);
      }
    });
  }

  const nav = document.querySelector("[data-nav]");
  initNavScroll(nav);
  initNavHeroDark(nav, document.querySelector("[data-hero-home]"));
  initScrollProgress(document.querySelector(".scroll-progress"));
  initCursor(document.querySelector(".cursor"));
  initReveal(document.querySelectorAll("[data-reveal]"));
  initProjectStickers(document.querySelector("[data-project-stage]"));
})();
