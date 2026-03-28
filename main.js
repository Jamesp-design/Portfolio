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
          "a, button, [role='button'], input, textarea, select, label, summary, .work-row, .nav-icon, .logo-img, .role-row, .photo-slot, .hi-card__link"
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

  /** @param {HTMLElement | null} wrap */
  function initExperience(wrap) {
    if (!wrap) return;
    const previewRoot = wrap.querySelector("[data-experience-preview]");
    const stack = wrap.querySelector("[data-experience-preview-stack]");
    const mqDesk = window.matchMedia("(min-width: 960px)");
    const items = wrap.querySelectorAll(".role-item");
    const firstBody = wrap.querySelector("#exp-panel-0");

    /** @type {HTMLElement | null} */
    let lastDesktopBody = firstBody;

    const tickMs = 520;

    function dealExperienceStack() {
      if (!stack) return;
      const front = stack.lastElementChild;
      if (front) stack.insertBefore(front, stack.firstElementChild);
    }

    /** @param {HTMLElement | null} bodyEl */
    function setPreviewFromBody(bodyEl) {
      if (!bodyEl || !stack) return;
      const cards = stack.querySelectorAll(".experience-preview__card");
      const html = bodyEl.innerHTML;
      cards.forEach((card, i) => {
        const inner = card.querySelector("[data-experience-card-inner]");
        if (!inner) return;
        /* Only the front slot (always third in DOM) shows text; others stay blank white faces */
        inner.innerHTML = i === cards.length - 1 ? html : "";
      });
      lastDesktopBody = bodyEl;
    }

    /** @param {HTMLButtonElement} btn */
    function setActiveButton(btn) {
      items.forEach((it) => {
        const b = it.querySelector(".role-row");
        if (b) b.setAttribute("aria-expanded", b === btn ? "true" : "false");
      });
    }

    /** @param {HTMLButtonElement} btn */
    function applyDesktopHover(btn) {
      const item = btn.closest(".role-item");
      const body = item && item.querySelector(".role__body--inline");
      if (!body) return;
      const changed = body !== lastDesktopBody;
      if (mqDesk.matches && changed && !reduceMotion && previewRoot && stack) {
        previewRoot.classList.add("is-tick");
        dealExperienceStack();
        window.setTimeout(() => previewRoot.classList.remove("is-tick"), tickMs);
      }
      setPreviewFromBody(body);
      setActiveButton(btn);
    }

    function applyDesktopDefault() {
      if (lastDesktopBody) setPreviewFromBody(lastDesktopBody);
      const firstBtn = wrap.querySelector(".role-row");
      if (firstBtn) setActiveButton(firstBtn);
    }

    items.forEach((item) => {
      const btn = item.querySelector(".role-row");
      if (!btn) return;

      btn.addEventListener("click", () => {
        if (mqDesk.matches) return;
        const wasOpen = item.classList.contains("is-open");
        items.forEach((i) => {
          i.classList.remove("is-open");
          const b = i.querySelector(".role-row");
          if (b) b.setAttribute("aria-expanded", "false");
        });
        if (!wasOpen) {
          item.classList.add("is-open");
          btn.setAttribute("aria-expanded", "true");
        }
      });

      btn.addEventListener("mouseenter", () => {
        if (!mqDesk.matches) return;
        applyDesktopHover(btn);
      });

      btn.addEventListener("focus", () => {
        if (!mqDesk.matches) return;
        applyDesktopHover(btn);
      });
    });

    mqDesk.addEventListener("change", () => {
      items.forEach((i) => i.classList.remove("is-open"));
      if (mqDesk.matches) {
        applyDesktopDefault();
      }
    });

    if (mqDesk.matches) {
      applyDesktopDefault();
    }
  }

  /** Fisher–Yates shuffle (mutates array) */
  function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Loads images/gallery/manifest.json, shuffles, assigns up to 18 slots (6×3 rows).
   * If more than 18 files exist, a random 18 are picked each refresh; if fewer, images repeat in shuffled order.
   * @param {HTMLElement | null} section
   * @returns {Promise<void>}
   */
  async function initPhotoGallery(section) {
    if (!section) return;
    let files = [];
    try {
      const res = await fetch("./images/gallery/manifest.json", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      files = Array.isArray(data.images) ? data.images.filter((x) => typeof x === "string" && x.trim()) : [];
    } catch {
      return;
    }
    if (!files.length) return;

    const base = "./images/gallery/";
    /** @type {string[]} */
    let pool = shuffleInPlace([...files]);
    if (pool.length >= 18) {
      pool = pool.slice(0, 18);
    } else {
      const out = [];
      for (let i = 0; i < 18; i++) out.push(pool[i % pool.length]);
      pool = out;
    }

    const rows = section.querySelectorAll("[data-photo-row]");
    rows.forEach((row, rowIndex) => {
      const slice = pool.slice(rowIndex * 6, rowIndex * 6 + 6);
      const chunks = row.querySelectorAll(".photo-strip-chunk");
      if (!chunks.length) return;
      const first = chunks[0];
      const slots = first.querySelectorAll(".photo-slot");
      slots.forEach((slot, i) => {
        const url = slice[i] ? base + encodeURI(slice[i]) : "";
        if (!url) return;
        slot.removeAttribute("data-placeholder");
        const label = slot.querySelector(".photo-slot__label");
        if (label) label.remove();
        slot.innerHTML = "";
        const img = document.createElement("img");
        img.src = url;
        img.alt = "";
        img.loading = "lazy";
        img.decoding = "async";
        slot.appendChild(img);
        slot.setAttribute("aria-label", "Gallery photo");
      });
      for (let c = 1; c < chunks.length; c++) {
        chunks[c].innerHTML = first.innerHTML;
        chunks[c].querySelectorAll(".photo-slot").forEach((slot) => {
          slot.setAttribute("tabindex", "-1");
        });
      }
    });
  }

  /** @param {HTMLElement | null} section */
  function initPhotoStripScroll(section) {
    if (!section) return;
    const rows = section.querySelectorAll("[data-photo-row]");

    function update() {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const denom = Math.max(1, vh + rect.height);
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / denom));
      rows.forEach((row) => {
        const isLeft = row.getAttribute("data-photo-row") === "left";
        const viewport = row.querySelector(".photo-strip-viewport");
        const track = row.querySelector(".photo-strip-track");
        if (!viewport || !track) return;
        if (reduceMotion) {
          track.style.transform = "";
          return;
        }
        const maxPan = Math.max(0, track.scrollWidth - viewport.clientWidth);
        /* Left rows use inverted progress so translate stays ≤0 and the strip never reveals empty space past x=0 */
        const panProgress = isLeft ? 1 - progress : progress;
        const tx = panProgress * maxPan;
        track.style.transform = `translateX(${-tx}px)`;
      });
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /**
   * @param {HTMLElement | null} section
   * @returns {Promise<void>}
   */
  function waitGalleryImages(section) {
    if (!section) return Promise.resolve();
    const imgs = section.querySelectorAll(".photo-strip img");
    if (!imgs.length) return Promise.resolve();
    return Promise.all(
      Array.from(imgs).map(
        (img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((res) => {
                img.addEventListener("load", res, { once: true });
                img.addEventListener("error", res, { once: true });
              })
      )
    );
  }

  const nav = document.querySelector("[data-nav]");
  initNavScroll(nav);
  initScrollProgress(document.querySelector(".scroll-progress"));
  initCursor(document.querySelector(".cursor"));
  initReveal(document.querySelectorAll("[data-reveal]"));
  initWorkPreview(document.querySelector("[data-work-preview]"));
  initExperience(document.querySelector("[data-experience-wrap]"));

  const photoSection = document.querySelector("[data-photo-strip-section]");
  initPhotoGallery(photoSection).then(() => waitGalleryImages(photoSection)).then(() => {
    initPhotoStripScroll(photoSection);
  });

  if (!reduceMotion) {
    function bindWorkRowSpotlight(row) {
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
    }
    document.querySelectorAll(".work-list .work-row").forEach(bindWorkRowSpotlight);
    document.querySelectorAll(".experience-wrap .work-row").forEach(bindWorkRowSpotlight);
  }
})();

