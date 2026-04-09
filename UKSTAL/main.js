document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '-15% 0px -35% 0px'
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.fade-up').forEach((el, index) => {
        el.style.transitionDelay = `${Math.min(index * 60, 240)}ms`;
        revealObserver.observe(el);
    });

    const heroBg = document.querySelector('.hero-bg');
    const header = document.querySelector('header');

    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;

        if (heroBg) {
            heroBg.style.transform = `scale(${1.06 + scrolled * 0.00018}) translateY(${scrolled * 0.08}px)`;
        }

        if (header) {
            if (scrolled > 80) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    });

    const navMap = [
        { section: '#hero', links: ['a[href="#hero"]'] },
        { section: '#about', links: ['a[href="#about"]'] },
        { section: '#menu', links: ['a[href="#menu"]'] },
        { section: '#services', links: [] }
    ];

    const sections = navMap
        .map(item => ({
            element: document.querySelector(item.section),
            links: item.links.flatMap(selector =>
                Array.from(document.querySelectorAll(selector))
            )
        }))
        .filter(item => item.element);

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                sections.forEach(item => {
                    item.links.forEach(link => {
                        link.classList.remove('is-active');
                    });
                });

                const activeSection = sections.find(item => item.element === entry.target);

                if (activeSection) {
                    activeSection.links.forEach(link => {
                        link.classList.add('is-active');
                    });
                }
            }
        });
    }, observerOptions);

    sections.forEach(item => {
        sectionObserver.observe(item.element);
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            const target = document.querySelector(href);

            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});