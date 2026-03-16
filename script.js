document.addEventListener("DOMContentLoaded", () => {
  const header = document.getElementById("site-header");
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll("section[id]");

  const updateHeaderOnScroll = () => {
    if (window.scrollY > 30) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
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
        if (activeLink) {
          activeLink.classList.add("active");
        }
      }
    });
  };

  const fadeElements = document.querySelectorAll(".fade-up");

  const fadeObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
    }
  );

  fadeElements.forEach((el) => fadeObserver.observe(el));

  updateHeaderOnScroll();
  updateActiveNavLink();

  window.addEventListener("scroll", () => {
    updateHeaderOnScroll();
    updateActiveNavLink();
  });
});

const menuToggle = document.getElementById("menuToggle");
const mobileMenuPanel = document.getElementById("mobileMenuPanel");
const mobileMenuOverlay = document.getElementById("mobileMenuOverlay");
const mobileMenuClose = document.getElementById("mobileMenuClose");
const mobileMenuLinks = document.querySelectorAll(".mobile-menu-links a");

function openMobileMenu() {
  mobileMenuPanel.classList.add("active");
  mobileMenuOverlay.classList.add("active");
  document.body.classList.add("menu-open");
  if (menuToggle) menuToggle.setAttribute("aria-expanded", "true");
}

function closeMobileMenu() {
  mobileMenuPanel.classList.remove("active");
  mobileMenuOverlay.classList.remove("active");
  document.body.classList.remove("menu-open");
  if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
}

if (menuToggle) {
  menuToggle.addEventListener("click", openMobileMenu);
}

if (mobileMenuClose) {
  mobileMenuClose.addEventListener("click", closeMobileMenu);
}

if (mobileMenuOverlay) {
  mobileMenuOverlay.addEventListener("click", closeMobileMenu);
}

mobileMenuLinks.forEach((link) => {
  link.addEventListener("click", closeMobileMenu);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMobileMenu();
  }
});

const mobileLangBtn = document.getElementById("mobileLangBtn");
const desktopLangBtn = document.getElementById("langBtn");

if (mobileLangBtn && desktopLangBtn) {
  mobileLangBtn.addEventListener("click", () => {
    desktopLangBtn.click();
  });
}
