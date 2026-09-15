(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let scrollFrame = 0;
  function updateSpace() {
    scrollFrame = 0;
    const range = document.documentElement.scrollHeight - innerHeight;
    const progress = range > 0 ? Math.max(0, Math.min(1, scrollY / range)) : 0;
    document.body.style.setProperty('--space-offset', `${motion.matches ? 0 : -progress * 100}px`);
    document.body.style.setProperty('--stars-offset', `${motion.matches ? 0 : -progress * 170}px`);
  }
  const queueSpace = () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateSpace); };
  addEventListener('scroll', queueSpace, {passive: true});
  addEventListener('resize', queueSpace);
  motion.addEventListener('change', queueSpace);
  updateSpace();
  const cards = document.querySelectorAll('.language-card, .paper');

  cards.forEach(card => {
    card.addEventListener('pointermove', event => {
      if (motion.matches || !finePointer.matches) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
      card.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
    });
  });

  const layer = document.createElement('div');
  layer.className = 'click-effects';
  layer.setAttribute('aria-hidden', 'true');
  document.body.append(layer);

  document.addEventListener('click', event => {
    if (event.target.closest('.globe-scene')) return;
    if (motion.matches || event.detail === 0 || layer.childElementCount > 70) return;
    const card = event.target.closest('.language-card');
    const color = card ? getComputedStyle(card).getPropertyValue('--tone') : '#8ab4f8';
    const ring = document.createElement('i');
    ring.className = 'click-ring';
    ring.style.cssText = `left:${event.clientX}px;top:${event.clientY}px;--spark-color:${color};`;
    layer.append(ring);
    ring.addEventListener('animationend', () => ring.remove(), {once: true});
    for (let i = 0; i < 10; i++) {
      const spark = document.createElement('i');
      const angle = Math.PI * 2 * i / 10;
      const distance = 25 + Math.random() * 38;
      spark.className = 'click-spark';
      spark.style.cssText = `left:${event.clientX}px;top:${event.clientY}px;--spark-color:${color};--dx:${Math.cos(angle) * distance}px;--dy:${Math.sin(angle) * distance}px;`;
      layer.append(spark);
      spark.addEventListener('animationend', () => spark.remove(), {once: true});
    }
  });
  motion.addEventListener('change', () => layer.replaceChildren());
})();
