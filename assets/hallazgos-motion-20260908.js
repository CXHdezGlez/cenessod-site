(() => {
  const groups = [...document.querySelectorAll('[data-stat-group]')];
  if (!groups.length || !('IntersectionObserver' in window)) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const active = new Map();
  const duration = 2400;
  const stagger = 160;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      if (reduced.matches || document.hidden) return;
      const rows = [...entry.target.querySelectorAll('[data-stat-value]')].map(value => {
        const display = value.querySelector('[data-stat-display]');
        const label = display.textContent;
        const numeric = label.replace('%', '');
        return { display, label, target: Number(numeric), decimals: (numeric.split('.')[1] || '').length,
          suffix: label.includes('%') ? '%' : '', bar: value.parentElement.querySelector('[data-bar]') };
      });
      let frame;
      const finish = () => {
        cancelAnimationFrame(frame);
        rows.forEach(row => { row.display.textContent = row.label; if (row.bar) row.bar.style.removeProperty('transform'); });
        active.delete(entry.target);
      };
      active.set(entry.target, finish);
      const start = performance.now();
      const tick = now => {
        if (reduced.matches || document.hidden) { finish(); return; }
        rows.forEach((row, index) => {
          const progress = Math.min(1, Math.max(0, (now - start - index * stagger) / duration));
          const eased = 1 - Math.pow(1 - progress, 3);
          row.display.textContent = (row.target * eased).toFixed(row.decimals) + row.suffix;
          if (row.bar) row.bar.style.transform = `scaleX(${eased})`;
        });
        if (now - start >= duration + (rows.length - 1) * stagger) finish();
        else frame = requestAnimationFrame(tick);
      };
      tick(start);
    });
  }, { threshold: 0.5 });
  groups.forEach(group => observer.observe(group));
  const finishAll = () => { if (reduced.matches || document.hidden) [...active.values()].forEach(finish => finish()); };
  reduced.addEventListener('change', finishAll);
  document.addEventListener('visibilitychange', finishAll);
})();
