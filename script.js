document.addEventListener("DOMContentLoaded", () => {
  // Navigation & Scroll
  const header = document.getElementById("site-header");
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll("section[id]");

  const updateHeaderOnScroll = () => {
    if (window.scrollY > 30) {
      if (header) header.classList.add("scrolled");
    } else {
      if (header) header.classList.remove("scrolled");
    }
  };

  const updateActiveNavLink = () => {
    const scrollPosition = window.scrollY + 140;

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute("id");

      if (
        scrollPosition >= sectionTop &&
        scrollPosition < sectionTop + sectionHeight
      ) {
        navLinks.forEach((link) => link.classList.remove("active"));
        const activeLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
        if (activeLink) activeLink.classList.add("active");
      }
    });
  };

  // Fade Up Animation
  const fadeElements = document.querySelectorAll(".fade-up");
  const fadeObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  fadeElements.forEach((el) => fadeObserver.observe(el));

  // Init scroll & events
  updateHeaderOnScroll();
  updateActiveNavLink();
  window.addEventListener("scroll", () => {
    updateHeaderOnScroll();
    updateActiveNavLink();
  });

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
  let hasAnimated = false;

  function runCounters() {
    counters.forEach(counter => {
      counter.innerText = "0";
      const targetStr = counter.getAttribute("data-target");
      if (!targetStr) return;
      const target = parseInt(targetStr, 10);
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

  function handleCountersScroll() {
    if (hasAnimated || !countersContainer || counters.length === 0) return;
    const rect = countersContainer.getBoundingClientRect();
    if (rect.top <= window.innerHeight - 50 && rect.bottom >= 0) {
      hasAnimated = true;
      runCounters();
      window.removeEventListener("scroll", handleCountersScroll);
    }
  }

  window.addEventListener("scroll", handleCountersScroll);
  setTimeout(handleCountersScroll, 100);
});
