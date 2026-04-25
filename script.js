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
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  fadeElements.forEach((el) => fadeObserver.observe(el));

  // Init scroll & events (Passive listener for header)
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

  if (countersContainer && counters.length > 0) {
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          runCounters();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    counterObserver.observe(countersContainer);
  }

  // --- Analysis Report Modal Logic ---
  const reportModal = document.getElementById("reportModal");
  const openReportBtn = document.getElementById("openAnalysisReport");
  const closeReportBtn = document.getElementById("closeReportModal");
  const reportOverlay = document.getElementById("reportOverlay");

  if (reportModal && openReportBtn) {
    openReportBtn.addEventListener("click", () => {
      reportModal.classList.add("active");
      document.body.style.overflow = "hidden"; // Lock scroll
      
      // Render mermaid charts when modal opens
      if (typeof mermaid !== 'undefined') {
        mermaid.run({
          querySelector: '.mermaid'
        });
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
});
