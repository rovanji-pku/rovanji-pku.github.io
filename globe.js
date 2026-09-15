(() => {
  const canvas = document.querySelector('#earth');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const scene = canvas.parentElement;
  const marker = scene.querySelector('.pku-marker');
  const tooltip = scene.querySelector('.globe-tooltip');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const rad = Math.PI / 180;
  let longitude = 108 * rad, latitude = 24 * rad;
  let texture, tw, th, active = false, lastX, lastY, vx = 0, vy = 0, frame = 0;
  const size = 440, radius = 193, center = size / 2;
  canvas.width = canvas.height = size;
  const pixels = ctx.createImageData(size, size);
  const points = [];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const nx = (x - center) / radius, ny = (center - y) / radius;
    const d = nx * nx + ny * ny;
    if (d <= 1) points.push([4 * (y * size + x), nx, ny, Math.sqrt(1 - d)]);
  }
  function show(open) {
    tooltip.hidden = !open;
    marker.setAttribute('aria-expanded', String(open));
  }
  function render() {
    if (!texture) return;
    const sl = Math.sin(latitude), cl = Math.cos(latitude);
    for (const [i, x, y, z] of points) {
      const worldY = y * cl + z * sl;
      const lon = Math.atan2(x, z * cl - y * sl) + longitude;
      const lat = Math.asin(Math.max(-1, Math.min(1, worldY)));
      const tx = ((Math.floor((lon / (2 * Math.PI) + .5) * tw) % tw) + tw) % tw;
      const ty = Math.min(th - 1, Math.floor((.5 - lat / Math.PI) * th));
      const t = 4 * (ty * tw + tx);
      const light = .28 + .62 * Math.max(0, -.3 * x + .4 * y + .85 * z);
      const rim = Math.pow(1 - z, 3);
      pixels.data[i] = texture[t] * light * .66 + rim * 13;
      pixels.data[i+1] = texture[t+1] * light * .83 + rim * 36;
      pixels.data[i+2] = texture[t+2] * light + 12 + rim * 62;
      pixels.data[i+3] = Math.min(255, z * 2300);
    }
    ctx.clearRect(0, 0, size, size);
    ctx.putImageData(pixels, 0, 0);
    const glow = ctx.createRadialGradient(center, center, radius-1, center, center, radius+16);
    glow.addColorStop(0, '#80caff50'); glow.addColorStop(.22, '#4c9cde25'); glow.addColorStop(1, '#4c9cde00');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(center, center, radius+16, 0, Math.PI*2); ctx.arc(center, center, radius-1, 0, Math.PI*2, true); ctx.fill();
    const dlon = 116.31 * rad - longitude, plat = 39.99 * rad;
    const mx = Math.cos(plat) * Math.sin(dlon);
    const my = Math.sin(plat)*cl - Math.cos(plat)*Math.cos(dlon)*sl;
    const mz = Math.sin(plat)*sl + Math.cos(plat)*Math.cos(dlon)*cl;
    marker.hidden = mz < .12;
    const px = (center + radius*mx)/size*100, py = (center-radius*my)/size*100;
    marker.style.left = `${px}%`; marker.style.top = `${py}%`;
    tooltip.style.left = `${Math.max(20, Math.min(65, px))}%`;
    tooltip.style.top = `${Math.min(66, py+5)}%`;
    if (marker.hidden) show(false);
    canvas.dataset.longitude = (longitude/rad).toFixed(1);
  }
  function tick() {
    frame = 0;
    if (!active && !reduced.matches) { longitude += vx; latitude = Math.max(-1.2, Math.min(1.2, latitude+vy)); vx *= .9; vy *= .9; }
    render();
    if (!active && Math.abs(vx)+Math.abs(vy) > .0003 && !reduced.matches) frame = requestAnimationFrame(tick);
  }
  function requestRender() { if (!frame) frame = requestAnimationFrame(tick); }
  canvas.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    active = true; vx = vy = 0; lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId); show(false); canvas.classList.add('dragging');
  });
  canvas.addEventListener('pointermove', e => {
    if (!active) return;
    vx = -(e.clientX-lastX)*.006; vy = (e.clientY-lastY)*.006;
    longitude += vx; latitude = Math.max(-1.2, Math.min(1.2, latitude+vy));
    lastX = e.clientX; lastY = e.clientY; requestRender();
  });
  function release() { active = false; canvas.classList.remove('dragging'); requestRender(); }
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', () => { vx = vy = 0; release(); });
  const reset = () => { longitude = 108*rad; latitude = 24*rad; vx = vy = 0; show(false); requestRender(); };
  scene.querySelector('.globe-reset').addEventListener('click', reset);
  canvas.addEventListener('keydown', e => {
    if (e.key === 'Home') { e.preventDefault(); reset(); return; }
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) return;
    e.preventDefault(); vx = vy = 0;
    longitude += e.key === 'ArrowLeft' ? -.12 : e.key === 'ArrowRight' ? .12 : 0;
    latitude = Math.max(-1.2, Math.min(1.2, latitude+(e.key === 'ArrowUp' ? .1 : e.key === 'ArrowDown' ? -.1 : 0)));
    requestRender();
  });
  marker.addEventListener('pointerenter', e => { if(e.pointerType === 'mouse') show(true); });
  marker.addEventListener('focus', () => { if (marker.matches(':focus-visible')) show(true); });
  marker.addEventListener('click', e => {
    if (!matchMedia('(hover: hover)').matches && tooltip.hidden) { e.preventDefault(); show(true); }
  });
  scene.addEventListener('keydown', e => { if(e.key === 'Escape') show(false); });
  const image = new Image();
  image.onload = () => {
    const buffer = document.createElement('canvas'); buffer.width = tw = 1024; buffer.height = th = 512;
    const source = buffer.getContext('2d'); source.drawImage(image, 0, 0, tw, th);
    texture = source.getImageData(0,0,tw,th).data; render();
  };
  image.onerror = () => { scene.querySelector('.globe-controls small').textContent = 'Currently at Peking University · Beijing'; marker.hidden = true; };
  image.src = 'assets/earth-day.jpg';
})();
