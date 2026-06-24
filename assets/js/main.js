// Felipe Brugués — site interactions
(function () {
  "use strict";

  // Sticky nav border on scroll
  const nav = document.querySelector(".nav");
  if (nav) {
    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // Mobile menu: open/close is handled purely by CSS (the #nav-toggle
  // checkbox). JS only enhances it: lock page scroll while open, and
  // close it when a link is tapped or Escape is pressed.
  const navCb = document.getElementById("nav-toggle");
  if (navCb) {
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    const sync = () => {
      const open = navCb.checked;
      document.body.style.overflow = open ? "hidden" : "";
      // status-bar tint: brand blue while the menu is open, cream otherwise
      if (themeMeta) themeMeta.setAttribute("content", open ? "#1f4fe0" : "#f3ecd9");
    };
    navCb.addEventListener("change", sync);
    document.querySelectorAll(".nav__links a").forEach((a) =>
      a.addEventListener("click", () => { navCb.checked = false; sync(); })
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { navCb.checked = false; sync(); }
    });
  }

  // Scroll reveal
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  // Footer year
  const y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();

  // Lightbox: open media dialogs from trigger links
  document.querySelectorAll("[data-dialog]").forEach((btn) => {
    const dlg = document.getElementById(btn.dataset.dialog);
    if (!dlg || typeof dlg.showModal !== "function") return;
    btn.addEventListener("click", () => dlg.showModal());
  });
  document.querySelectorAll("dialog.lightbox").forEach((dlg) => {
    const close = () => dlg.close();
    dlg.querySelector(".lightbox__close")?.addEventListener("click", close);
    // close when clicking the backdrop area (outside the panel)
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg) close();
    });
    // stop any media playback when the dialog closes (X, backdrop, or Escape)
    dlg.addEventListener("close", () => {
      dlg.querySelectorAll("audio, video").forEach((m) => {
        m.pause();
        m.currentTime = 0;
      });
    });
  });

  // Gallery carousel: navigate images with left/right buttons + arrow keys
  document.querySelectorAll(".lightbox__panel--gallery").forEach((panel) => {
    const imgs = [...panel.querySelectorAll("img")];
    if (!imgs.length) return;
    const dlg = panel.closest("dialog.lightbox");
    let i = 0;
    let count = null;
    const show = (n) => {
      i = (n + imgs.length) % imgs.length;
      imgs.forEach((img, k) => img.classList.toggle("is-active", k === i));
      if (count) count.textContent = i + 1 + " / " + imgs.length;
    };
    if (imgs.length > 1 && dlg) {
      const mk = (cls, label, glyph) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "lightbox__nav " + cls;
        b.setAttribute("aria-label", label);
        b.textContent = glyph;
        return b;
      };
      const prev = mk("lightbox__nav--prev", "Previous image", "‹");
      const next = mk("lightbox__nav--next", "Next image", "›");
      count = document.createElement("span");
      count.className = "lightbox__count";
      dlg.append(prev, next, count);
      prev.addEventListener("click", (e) => { e.stopPropagation(); show(i - 1); });
      next.addEventListener("click", (e) => { e.stopPropagation(); show(i + 1); });
      dlg.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") show(i - 1);
        else if (e.key === "ArrowRight") show(i + 1);
      });
      dlg.addEventListener("close", () => show(0));
    }
    show(0);
  });

  // Exclusive playback: starting any player stops all the others
  // (native <audio> elements + SoundCloud embed widgets)
  const audios = [...document.querySelectorAll("audio")];
  let scWidgets = [];
  const pauseAudiosExcept = (except) =>
    audios.forEach((a) => { if (a !== except) a.pause(); });
  const pauseWidgetsExcept = (except) =>
    scWidgets.forEach((w) => { if (w !== except) w.pause(); });

  audios.forEach((a) => {
    a.volume = 0.5; // start at half volume
    a.addEventListener("play", () => {
      pauseAudiosExcept(a);
      pauseWidgetsExcept(null);
    });
  });

  const scIframes = [
    ...document.querySelectorAll('iframe[src*="w.soundcloud.com/player"]'),
  ];
  if (scIframes.length) {
    const initWidgets = () => {
      scWidgets = scIframes.map((f) => {
        const w = SC.Widget(f);
        w.bind(SC.Widget.Events.READY, () => w.setVolume(50)); // start at half volume
        w.bind(SC.Widget.Events.PLAY, () => {
          pauseAudiosExcept(null);
          pauseWidgetsExcept(w);
        });
        return w;
      });
    };
    if (window.SC && SC.Widget) {
      initWidgets();
    } else {
      const s = document.createElement("script");
      s.src = "https://w.soundcloud.com/player/api.js";
      s.onload = initWidgets;
      document.head.appendChild(s);
    }
  }
})();
