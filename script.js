function initCenessodSite() {
  // Navigation & Scroll
  const header = document.querySelector("header");
  const navLinks = document.querySelectorAll(".nav-links a");
  const sections = document.querySelectorAll("section[id]");

  function loadScript(src, options = {}) {
    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        existingScript.addEventListener("load", resolve, { once: true });
        existingScript.addEventListener("error", reject, { once: true });
        if (existingScript.dataset.loaded === "true") resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      if (options.type) script.type = options.type;
      script.async = true;
      script.onload = () => {
        script.dataset.loaded = "true";
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function runWhenIdle(callback) {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(callback, { timeout: 2500 });
      return;
    }

    window.setTimeout(callback, 1200);
  }

  function afterPageLoad(callback) {
    if (document.readyState === "complete") {
      callback();
      return;
    }

    window.addEventListener("load", callback, { once: true });
  }

  function initHeroDataCanvas() {
    const canvas = document.getElementById("heroDataCanvas");
    if (!canvas) return;

    const hero = canvas.closest(".hero");
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ambientMotionScale = reduceMotion ? 0.42 : 1;
    const idleStrengthBase = reduceMotion ? 0.22 : 0.34;
    const idleStrengthPulse = reduceMotion ? 0.035 : 0.06;
    const pointer = { x: 0.78, y: 0.46, active: false, strength: 0.38 };
    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationFrame = 0;
    const trail = [];

    const anchors = [
      [0.58, 0.20], [0.72, 0.22], [0.86, 0.30], [0.65, 0.38],
      [0.78, 0.45], [0.92, 0.52], [0.58, 0.62], [0.74, 0.70],
      [0.88, 0.78], [0.48, 0.82], [0.68, 0.88], [0.34, 0.72],
      [0.82, 0.16], [0.96, 0.68], [0.52, 0.50], [0.70, 0.58]
    ];

    const nodes = anchors.map(([x, y], index) => ({
      x,
      y,
      size: 2.4 + (index % 4) * 0.7,
      phase: index * 0.72,
      orbit: 0.004 + (index % 5) * 0.0018,
    }));

    const satelliteNodes = Array.from({ length: 42 }, (_, index) => {
      const band = index % 3;
      const angle = index * 2.399963;
      const radius = 0.09 + (index % 11) * 0.012;
      const centerX = band === 0 ? 0.74 : band === 1 ? 0.62 : 0.86;
      const centerY = band === 0 ? 0.48 : band === 1 ? 0.68 : 0.34;

      return {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius * 0.72,
        size: 1.2 + (index % 4) * 0.38,
        phase: index * 0.43,
        orbit: 0.003 + (index % 7) * 0.001,
      };
    });

    nodes.push(...satelliteNodes);

    function seededUnit(index, salt) {
      return (Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453) % 1;
    }

    const ambientParticles = Array.from({ length: 260 }, (_, index) => {
      const x = Math.abs(seededUnit(index, 1));
      const y = Math.abs(seededUnit(index, 2));
      const hueBand = index % 9;

      return {
        x,
        y,
        size: 0.45 + Math.abs(seededUnit(index, 3)) * 1.35,
        angle: Math.abs(seededUnit(index, 4)) * Math.PI * 2,
        phase: Math.abs(seededUnit(index, 5)) * Math.PI * 2,
        depth: 0.32 + Math.abs(seededUnit(index, 6)) * 0.9,
        twinkle: 0.55 + Math.abs(seededUnit(index, 7)) * 0.45,
        color: hueBand === 0 ? "198, 255, 246" : hueBand <= 2 ? "158, 230, 216" : "255, 255, 255",
      };
    });

    const firmamentStars = Array.from({ length: 180 }, (_, index) => {
      const x = Math.abs(seededUnit(index, 8));
      const y = Math.abs(seededUnit(index, 9));
      const rightBias = Math.min(1, Math.max(0.2, (x - 0.16) / 0.66));

      return {
        x,
        y,
        size: 0.38 + Math.abs(seededUnit(index, 10)) * 1.1,
        phase: Math.abs(seededUnit(index, 11)) * Math.PI * 2,
        blur: 0.7 + Math.abs(seededUnit(index, 12)) * 1.8,
        alpha: (0.08 + Math.abs(seededUnit(index, 13)) * 0.22) * rightBias,
      };
    });

    const trailDust = Array.from({ length: 118 }, (_, index) => {
      const angle = Math.abs(seededUnit(index, 14)) * Math.PI * 2;
      const radius = Math.pow(Math.abs(seededUnit(index, 15)), 0.58);

      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        size: 0.45 + Math.abs(seededUnit(index, 16)) * 1.15,
        alpha: 0.18 + Math.abs(seededUnit(index, 17)) * 0.46,
        phase: Math.abs(seededUnit(index, 18)) * Math.PI * 2,
      };
    });

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function setHeroPointerState(nx, ny) {
      if (!hero) return;
      const offsetX = nx - 0.5;
      const offsetY = ny - 0.5;

      hero.classList.add("is-pointer-active");
      hero.style.setProperty("--hero-cursor-x", `${nx * 100}%`);
      hero.style.setProperty("--hero-cursor-y", `${ny * 100}%`);
      hero.style.setProperty("--hero-shift-x", `${offsetX * 156}px`);
      hero.style.setProperty("--hero-shift-y", `${offsetY * 116}px`);
      hero.style.setProperty("--hero-core-shift-x", `${offsetX * 150}px`);
      hero.style.setProperty("--hero-core-shift-y", `${offsetY * 106}px`);
      hero.style.setProperty("--hero-tilt-x", `${offsetX * 16}deg`);
      hero.style.setProperty("--hero-tilt-y", `${offsetY * -12}deg`);
      hero.style.setProperty("--hero-glow-x", `${60 + nx * 30}%`);
      hero.style.setProperty("--hero-glow-y", `${24 + ny * 52}%`);
      hero.style.setProperty("--hero-orbit-speed", "1.85");
    }

    function resetHeroPointerState() {
      if (!hero) return;

      hero.classList.remove("is-pointer-active");
      hero.style.setProperty("--hero-shift-x", "0px");
      hero.style.setProperty("--hero-shift-y", "0px");
      hero.style.setProperty("--hero-core-shift-x", "0px");
      hero.style.setProperty("--hero-core-shift-y", "0px");
      hero.style.setProperty("--hero-tilt-x", "0deg");
      hero.style.setProperty("--hero-tilt-y", "0deg");
      hero.style.setProperty("--hero-glow-x", "76%");
      hero.style.setProperty("--hero-glow-y", "42%");
      hero.style.setProperty("--hero-orbit-speed", "1");
    }

    function updatePointer(event) {
      const rect = (hero || canvas).getBoundingClientRect();
      const nx = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
      const ny = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);

      pointer.x = nx;
      pointer.y = ny;
      pointer.active = true;
      pointer.strength = 1;
      canvas.dataset.interaction = "active";
      trail.unshift({ x: nx, y: ny, life: 1 });
      if (trail.length > 20) trail.pop();
      setHeroPointerState(nx, ny);
    }

    function releasePointer() {
      pointer.active = false;
      canvas.dataset.interaction = "idle";
      resetHeroPointerState();
    }

    const pointerTarget = hero || canvas;
    pointerTarget.addEventListener("pointermove", updatePointer, { passive: true });
    pointerTarget.addEventListener("pointerdown", updatePointer, { passive: true });
    pointerTarget.addEventListener("pointerleave", releasePointer, { passive: true });

    function drawWave(time, offset, alpha) {
      ctx.beginPath();
      const startY = height * (0.62 + offset);
      ctx.moveTo(0, startY);

      for (let x = 0; x <= width; x += 18) {
        const progress = x / width;
        const y = startY
          + Math.sin(progress * Math.PI * 2.4 + time * 0.0004) * height * 0.035
          + Math.sin(progress * Math.PI * 6.2 - time * 0.0007) * height * 0.012;
        ctx.lineTo(x, y);
      }

      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, `rgba(9, 117, 121, ${alpha * 0.2})`);
      gradient.addColorStop(0.55, `rgba(38, 177, 158, ${alpha})`);
      gradient.addColorStop(1, `rgba(158, 230, 216, ${alpha * 0.35})`);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    function draw(time = 0) {
      ctx.clearRect(0, 0, width, height);
      if (pointer.active) {
        pointer.strength = Math.max(pointer.strength * 0.94, 0.18);
      } else {
        pointer.strength = idleStrengthBase + Math.sin(time * 0.0011 * ambientMotionScale) * idleStrengthPulse;
      }

      const rendered = nodes.map((node) => {
        const drift = Math.sin(time * 0.001 * ambientMotionScale + node.phase) * node.orbit * ambientMotionScale;
        const dx = node.x - pointer.x;
        const dy = node.y - pointer.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 0.18 - distance) * pointer.strength;

        return {
          x: (node.x + drift + dx * influence * 0.34) * width,
          y: (node.y + Math.cos(time * 0.0008 * ambientMotionScale + node.phase) * node.orbit * ambientMotionScale + dy * influence * 0.34) * height,
          size: node.size + influence * 14,
        };
      });

      ctx.globalCompositeOperation = "lighter";

      firmamentStars.forEach((star) => {
        const px = star.x * width;
        const py = star.y * height;
        const alpha = star.alpha * (0.82 + Math.sin(time * 0.00055 * ambientMotionScale + star.phase) * 0.18);
        const radius = star.size * (5.4 + star.blur);

        ctx.save();
        ctx.filter = `blur(${star.blur}px)`;
        const glow = ctx.createRadialGradient(px, py, 0, px, py, radius);
        glow.addColorStop(0, `rgba(198, 255, 246, ${alpha * 0.42})`);
        glow.addColorStop(0.36, `rgba(158, 230, 216, ${alpha * 0.16})`);
        glow.addColorStop(1, "rgba(158, 230, 216, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      ambientParticles.forEach((particle, index) => {
        const baseDriftX = Math.sin(time * 0.00018 * ambientMotionScale * particle.depth + particle.phase) * 7 * ambientMotionScale * particle.depth;
        const baseDriftY = Math.cos(time * 0.00014 * ambientMotionScale * particle.depth + particle.phase) * 6 * ambientMotionScale * particle.depth;
        const pxBase = particle.x * width + baseDriftX;
        const pyBase = particle.y * height + baseDriftY;
        const pointerX = pointer.x * width;
        const pointerY = pointer.y * height;
        const dx = pxBase - pointerX;
        const dy = pyBase - pointerY;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const radius = width < 700 ? 230 : 440;
        const pull = Math.max(0, 1 - distance / radius) * pointer.strength;
        const orbit = pull * 42 * particle.depth;
        const attract = pull * 24 * particle.depth;
        const tangentX = -dy / distance;
        const tangentY = dx / distance;
        const px = pxBase + tangentX * orbit - (dx / distance) * attract;
        const py = pyBase + tangentY * orbit - (dy / distance) * attract;
        const twinkle = 0.82 + Math.sin(time * 0.0015 * ambientMotionScale + particle.phase) * 0.18;
        const alpha = Math.min(0.62, (0.09 + particle.depth * 0.1 + pull * 0.26) * particle.twinkle * twinkle);
        const fieldBias = Math.min(1, Math.max(0.32, (pxBase / width - 0.18) / 0.58));
        const starAlpha = alpha * fieldBias;
        const starRadius = particle.size * (0.9 + pull * 0.75);
        const haloRadius = starRadius * (3.6 + pull * 1.8);
        const tailLength = pull * (2 + particle.depth * 3);
        const angle = particle.angle + pull * 1.9 + time * 0.00012 * ambientMotionScale * particle.depth;

        const starGlow = ctx.createRadialGradient(px, py, 0, px, py, haloRadius);
        starGlow.addColorStop(0, `rgba(${particle.color}, ${starAlpha * 0.52})`);
        starGlow.addColorStop(0.34, `rgba(${particle.color}, ${starAlpha * 0.18})`);
        starGlow.addColorStop(1, `rgba(${particle.color}, 0)`);
        ctx.fillStyle = starGlow;
        ctx.beginPath();
        ctx.arc(px, py, haloRadius, 0, Math.PI * 2);
        ctx.fill();

        if (pull > 0.18) {
          ctx.strokeStyle = `rgba(${particle.color}, ${starAlpha * 0.34})`;
          ctx.lineWidth = Math.max(0.35, starRadius * 0.48);
          ctx.beginPath();
          ctx.moveTo(px - Math.cos(angle) * tailLength, py - Math.sin(angle) * tailLength);
          ctx.lineTo(px + Math.cos(angle) * tailLength * 0.28, py + Math.sin(angle) * tailLength * 0.28);
          ctx.stroke();
        }

        ctx.fillStyle = `rgba(${particle.color}, ${Math.min(0.9, starAlpha + 0.18)})`;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(0.55, starRadius), 0, Math.PI * 2);
        ctx.fill();

        if (index % 29 === 0 && starAlpha > 0.3) {
          const glint = starRadius * (1.9 + pull);
          ctx.strokeStyle = `rgba(${particle.color}, ${starAlpha * 0.28})`;
          ctx.lineWidth = 0.45;
          ctx.beginPath();
          ctx.moveTo(px - glint, py);
          ctx.lineTo(px + glint, py);
          ctx.moveTo(px, py - glint);
          ctx.lineTo(px, py + glint);
          ctx.stroke();
        }
      });

      drawWave(time, 0.18, 0.12);
      drawWave(time, 0.25, 0.08);

      if (trail.length > 1) {
        ctx.save();
        ctx.filter = `blur(${width < 700 ? 15 : 22}px)`;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        trail.forEach((point, index) => {
          const px = point.x * width;
          const py = point.y * height;
          if (index === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.strokeStyle = "rgba(38, 177, 158, 0.16)";
        ctx.lineWidth = width < 700 ? 44 : 62;
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.filter = `blur(${width < 700 ? 4 : 7}px)`;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        trail.forEach((point, index) => {
          const px = point.x * width;
          const py = point.y * height;
          if (index === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.strokeStyle = "rgba(198, 255, 246, 0.12)";
        ctx.lineWidth = width < 700 ? 10 : 16;
        ctx.stroke();
        ctx.restore();
      }

      trail.forEach((point, index) => {
        const falloff = 1 - index / Math.max(1, trail.length);
        const radius = falloff * (width < 700 ? 56 : 76) + 16;
        const px = point.x * width;
        const py = point.y * height;
        const alpha = point.life * (0.09 + falloff * 0.11);

        ctx.save();
        ctx.filter = `blur(${width < 700 ? 8 : 12}px)`;
        const halo = ctx.createRadialGradient(px, py, 0, px, py, radius);
        halo.addColorStop(0, `rgba(198, 255, 246, ${alpha * 0.82})`);
        halo.addColorStop(0.34, `rgba(38, 177, 158, ${alpha * 0.48})`);
        halo.addColorStop(1, "rgba(38, 177, 158, 0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (index < 8) {
          const dustScale = radius * 0.58;
          trailDust.forEach((dust, dustIndex) => {
            if (dustIndex % 2 !== index % 2) return;
            const dustX = px + dust.x * dustScale;
            const dustY = py + dust.y * dustScale * 0.82;
            const dustAlpha = point.life * falloff * dust.alpha * (0.46 + Math.sin(time * 0.0012 + dust.phase) * 0.12);

            ctx.fillStyle = `rgba(198, 255, 246, ${dustAlpha})`;
            ctx.beginPath();
            ctx.arc(dustX, dustY, Math.max(0.45, dust.size * falloff), 0, Math.PI * 2);
            ctx.fill();
          });
        }

        if (index === 0) {
          ctx.fillStyle = `rgba(198, 255, 246, ${point.life * 0.5})`;
          ctx.beginPath();
          ctx.arc(px, py, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }

        point.life *= 0.965;
      });

      for (let i = 0; i < rendered.length; i += 1) {
        for (let j = i + 1; j < rendered.length; j += 1) {
          const a = rendered[i];
          const b = rendered[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const limit = width < 700 ? 112 : 148;

          if (distance < limit) {
            const alpha = (1 - distance / limit) * 0.2;
            ctx.strokeStyle = `rgba(38, 177, 158, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      if (pointer.strength > 0.02) {
        const px = pointer.x * width;
        const py = pointer.y * height;

        rendered.forEach((node) => {
          const dx = node.x - px;
          const dy = node.y - py;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const limit = width < 700 ? 210 : 320;

          if (distance < limit) {
            const alpha = (1 - distance / limit) * pointer.strength * 0.42;
            const beam = ctx.createLinearGradient(px, py, node.x, node.y);
            beam.addColorStop(0, `rgba(198, 255, 246, ${alpha})`);
            beam.addColorStop(1, `rgba(38, 177, 158, ${alpha * 0.22})`);
            ctx.strokeStyle = beam;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(node.x, node.y);
            ctx.stroke();
          }
        });
      }

      rendered.forEach((node) => {
        const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.size * 6);
        glow.addColorStop(0, "rgba(158, 230, 216, 0.55)");
        glow.addColorStop(0.28, "rgba(38, 177, 158, 0.28)");
        glow.addColorStop(1, "rgba(38, 177, 158, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(198, 255, 246, 0.82)";
        ctx.beginPath();
        ctx.arc(node.x, node.y, Math.max(1.2, node.size), 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalCompositeOperation = "source-over";

      animationFrame = window.requestAnimationFrame(draw);
    }

    resizeCanvas();
    canvas.dataset.ready = "true";
    canvas.dataset.interaction = "idle";
    canvas.dataset.motion = reduceMotion ? "soft" : "full";
    draw();

    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(() => {
        resizeCanvas();
        if (reduceMotion) draw();
      });
      resizeObserver.observe(canvas);
    } else {
      window.addEventListener("resize", () => {
        resizeCanvas();
        if (reduceMotion) draw();
      }, { passive: true });
    }
  }

  const updateHeaderOnScroll = () => {
    if (window.scrollY > 30) {
      if (header) header.classList.add("scrolled");
    } else {
      if (header) header.classList.remove("scrolled");
    }
  };

  // Intersection Observer for active navigation links
  const navObserverOptions = {
    root: null,
    rootMargin: "-150px 0px -70% 0px", // Trigger when section is near top
    threshold: 0
  };

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const sectionId = entry.target.getAttribute("id");
        navLinks.forEach((link) => {
          link.classList.remove("active");
          if (link.getAttribute("href") === `#${sectionId}`) {
            link.classList.add("active");
          }
        });
      }
    });
  }, navObserverOptions);

  sections.forEach((section) => navObserver.observe(section));

  // Fade Up Animation
  const fadeElements = document.querySelectorAll(".fade-up");
  const fadeObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        if (entry.target.id === "countersContainer") {
          window.requestAnimationFrame(runCounters);
        }
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  fadeElements.forEach((el) => fadeObserver.observe(el));

  // Init scroll & events (Passive listener for header)
  initHeroDataCanvas();
  updateHeaderOnScroll();
  window.addEventListener("scroll", updateHeaderOnScroll, { passive: true });

  // Mobile Menu
  const menuToggle = document.getElementById("menuToggle");
  const mobileMenuPanel = document.getElementById("mobileMenuPanel");
  const mobileMenuOverlay = document.getElementById("mobileMenuOverlay");
  const mobileMenuClose = document.getElementById("mobileMenuClose");
  const mobileMenuLinks = document.querySelectorAll(".mobile-menu-links a");
  const mobileLangBtn = document.getElementById("mobileLangBtn");
  const desktopLangBtn = document.getElementById("langBtn");

  function isMenuOpen() {
    return mobileMenuPanel && mobileMenuPanel.classList.contains("active");
  }

  function openMobileMenu() {
    if (!menuToggle || !mobileMenuPanel || !mobileMenuOverlay) return;
    mobileMenuPanel.classList.add("active");
    mobileMenuOverlay.classList.add("active");
    document.body.classList.add("menu-open");
    menuToggle.classList.add("active");
    menuToggle.setAttribute("aria-expanded", "true");
  }

  function closeMobileMenu() {
    if (!menuToggle || !mobileMenuPanel || !mobileMenuOverlay) return;
    mobileMenuPanel.classList.remove("active");
    mobileMenuOverlay.classList.remove("active");
    document.body.classList.remove("menu-open");
    menuToggle.classList.remove("active");
    menuToggle.setAttribute("aria-expanded", "false");
  }

  if (menuToggle && mobileMenuPanel && mobileMenuOverlay) {
    menuToggle.addEventListener("click", () => isMenuOpen() ? closeMobileMenu() : openMobileMenu());
  }

  if (mobileMenuClose) mobileMenuClose.addEventListener("click", closeMobileMenu);
  if (mobileMenuOverlay) mobileMenuOverlay.addEventListener("click", closeMobileMenu);
  mobileMenuLinks.forEach((link) => link.addEventListener("click", closeMobileMenu));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isMenuOpen()) {
      closeMobileMenu();
    }
  });

  if (mobileLangBtn && desktopLangBtn) {
    mobileLangBtn.addEventListener("click", () => {
      desktopLangBtn.click();
      closeMobileMenu();
    });
  }

  // --- Dynamic Counters Animation ---
  const counters = document.querySelectorAll(".counter");
  const countersContainer = document.getElementById("countersContainer");
  let countersHaveRun = false;
  let counterVisibilityTimer = 0;

  function runCounters() {
    if (countersHaveRun) return;
    countersHaveRun = true;

    counters.forEach(counter => {
      const targetStr = counter.getAttribute("data-target");
      if (!targetStr) return;
      const target = parseInt(targetStr, 10);

      counter.innerText = "0";
      const duration = 2000;
      let start = null;

      function step(timestamp) {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        const easeOut = progress * (2 - progress);
        counter.innerText = Math.floor(easeOut * target);

        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          counter.innerText = target;
        }
      }
      window.requestAnimationFrame(step);
    });
  }

  function haveCountersBeenReached() {
    if (!countersContainer) return false;

    const rect = countersContainer.getBoundingClientRect();
    return rect.top < window.innerHeight * 0.9;
  }

  function runCountersWhenVisible() {
    if (haveCountersBeenReached()) {
      countersContainer.classList.add("visible");
      runCounters();
      window.removeEventListener("scroll", runCountersWhenVisible);
      window.removeEventListener("resize", runCountersWhenVisible);
      window.clearInterval(counterVisibilityTimer);
    }
  }

  if (countersContainer && counters.length > 0) {
    if ("IntersectionObserver" in window) {
      const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            runCounters();
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.01 });

      counterObserver.observe(countersContainer);
    } else {
      window.addEventListener("load", runCounters, { once: true });
    }

    window.addEventListener("pageshow", runCountersWhenVisible, { once: true });
    window.addEventListener("scroll", runCountersWhenVisible, { passive: true });
    window.addEventListener("resize", runCountersWhenVisible, { passive: true });
    counterVisibilityTimer = window.setInterval(runCountersWhenVisible, 150);
    window.requestAnimationFrame(runCountersWhenVisible);
  }

  // --- Analysis Report Modal Logic ---
  const reportModal = document.getElementById("reportModal");
  const openReportBtn = document.getElementById("openAnalysisReport");
  const closeReportBtn = document.getElementById("closeReportModal");
  const reportOverlay = document.getElementById("reportOverlay");
  let mermaidPromise;

  function loadMermaid() {
    if (window.mermaid) {
      return Promise.resolve(window.mermaid);
    }

    if (!mermaidPromise) {
      mermaidPromise = loadScript("https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js")
        .then(() => {
          window.mermaid.initialize({
            startOnLoad: false,
            theme: "dark",
            securityLevel: "strict",
          });
          return window.mermaid;
        });
    }

    return mermaidPromise;
  }

  if (reportModal && openReportBtn) {
    openReportBtn.addEventListener("click", async () => {
      reportModal.classList.add("active");
      document.body.style.overflow = "hidden"; // Lock scroll
      
      // Render mermaid charts when modal opens
      try {
        const mermaid = await loadMermaid();
        await mermaid.run({
          querySelector: '.mermaid'
        });
      } catch (error) {
        console.warn("No se pudieron cargar las gráficas del reporte.", error);
      }
    });

    const closeReport = () => {
      reportModal.classList.remove("active");
      document.body.style.overflow = ""; // Unlock scroll
    };

    if (closeReportBtn) closeReportBtn.addEventListener("click", closeReport);
    if (reportOverlay) reportOverlay.addEventListener("click", closeReport);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && reportModal.classList.contains("active")) {
        closeReport();
      }
    });
  }

  afterPageLoad(() => {
    runWhenIdle(() => {
      const particlesHost = document.getElementById("particles");
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (!particlesHost || reduceMotion) return;

      loadScript("https://cdn.jsdelivr.net/npm/tsparticles@2/tsparticles.bundle.min.js")
        .then(() => window.tsParticles.load("particles", {
          background: {
            color: "transparent"
          },
          particles: {
            number: { value: 40 },
            color: { value: "#00c6c6" },
            links: {
              enable: true,
              distance: 200,
              color: "#00c6c6",
              opacity: 0.3,
              width: 1
            },
            move: {
              enable: true,
              speed: 1
            },
            size: { value: 2 }
          }
        }))
        .catch((error) => {
          console.warn("No se pudieron cargar las partículas decorativas.", error);
        });
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCenessodSite, { once: true });
} else {
  initCenessodSite();
}
