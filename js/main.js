/* I Mori — motion pass ElevateStudios */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof gsap !== "undefined";

  // named eases (una volta sola)
  if (hasGSAP && typeof CustomEase !== "undefined") {
    CustomEase.create("es-out", "0.16,1,0.3,1");
    CustomEase.create("es-inout", "0.87,0,0.13,1");
  }
  var EASE = hasGSAP && gsap.parseEase("es-out") ? "es-out" : "power3.out";

  if (hasGSAP && typeof ScrollTrigger !== "undefined") gsap.registerPlugin(ScrollTrigger);
  if (hasGSAP && typeof DrawSVGPlugin !== "undefined") gsap.registerPlugin(DrawSVGPlugin);

  // diagnostica: ?nolenis = scroll nativo (per isolare la causa della lentezza)
  var noLenis = new URLSearchParams(location.search).has("nolenis");

  // Lenis + sync ScrollTrigger
  if (!reduce && !noLenis && typeof Lenis !== "undefined") {
    var lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1.05 });
    if (typeof ScrollTrigger !== "undefined") lenis.on("scroll", ScrollTrigger.update);
    if (hasGSAP) {
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      requestAnimationFrame(function raf(t){ lenis.raf(t); requestAnimationFrame(raf); });
    }
    // link interni -> scroll lenis
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var el = document.querySelector(a.getAttribute("href"));
        if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: 0 }); }
      });
    });
  }

  // HERO — slideshow crossfade (indipendente da GSAP, rispetta reduced-motion)
  var heroSlides = document.querySelectorAll(".hero__slide");
  if (heroSlides.length > 1 && !reduce) {
    var hs = 0;
    setInterval(function () {
      heroSlides[hs].classList.remove("is-active");
      hs = (hs + 1) % heroSlides.length;
      heroSlides[hs].classList.add("is-active");
    }, 4800);
  }

  // DORMIRE — frecce del carosello (scroll orizzontale)
  var roomsVp = document.querySelector(".rooms__viewport");
  if (roomsVp) {
    document.querySelectorAll(".rooms__btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var card = roomsVp.querySelector(".room");
        var step = card ? card.getBoundingClientRect().width + 22 : 320;
        var dir = btn.getAttribute("data-scroll") === "next" ? 1 : -1;
        roomsVp.scrollBy({ left: dir * step, behavior: "smooth" });
      });
    });
  }

  if (!hasGSAP || reduce) return; // contenuto gia visibile via CSS

  // HERO — split reveal mascherato
  var title = document.querySelector(".hero__title");
  if (title && typeof SplitText !== "undefined") {
    var split = SplitText.create(title, { type: "lines", mask: "lines" });
    gsap.from(split.lines, { yPercent: 110, stagger: 0.09, duration: 1.15, ease: EASE, delay: 0.15 });
  } else if (title) {
    gsap.from(title, { yPercent: 20, opacity: 0, duration: 1.1, ease: EASE });
  }
  gsap.from(".hero__eyebrow, .hero__scroll", { opacity: 0, y: 18, duration: 1, stagger: 0.12, delay: 0.5, ease: EASE });

  // ringhiera cotto — DrawSVG (fallback scaleX)
  document.querySelectorAll("[data-railing]").forEach(function (line) {
    var trig = line.closest("section");
    if (typeof DrawSVGPlugin !== "undefined") {
      gsap.fromTo(line, { drawSVG: "50% 50%" }, {
        drawSVG: "0% 100%", duration: 1.4, ease: "es-inout",
        scrollTrigger: { trigger: trig, start: "top 75%" }
      });
    } else {
      gsap.fromTo(line, { scaleX: 0, transformOrigin: "50% 50%" }, {
        scaleX: 1, duration: 1.4, ease: "power3.inOut",
        scrollTrigger: { trigger: trig, start: "top 75%" }
      });
    }
  });

  // parallax hero: il blocco slideshow scorre lento (la scala Ken Burns e' sui figli)
  document.querySelectorAll(".hero__slides").forEach(function (layer) {
    var depth = parseFloat(layer.getAttribute("data-depth")) || 0.2;
    gsap.to(layer, {
      yPercent: depth * 100,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.6 }
    });
  });

  // reveal sezioni — una volta, sobrio
  gsap.utils.toArray("[data-reveal]").forEach(function (el) {
    gsap.from(el, {
      y: 40, opacity: 0, duration: 1, ease: EASE,
      scrollTrigger: { trigger: el, start: "top 85%", once: true }
    });
  });

  // sezione notte (wellness) — leggero scale in
  gsap.from(".wellness__grid", {
    scale: 0.97, opacity: 0, duration: 1.2, ease: EASE,
    scrollTrigger: { trigger: "#wellness", start: "top 70%", once: true }
  });
})();
