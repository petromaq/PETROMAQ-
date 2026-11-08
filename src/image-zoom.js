export function createImageZoom() {
  const dialog = document.createElement('dialog');
  dialog.className = 'imageZoom';
  dialog.setAttribute('aria-labelledby', 'imageZoomTitle');
  dialog.innerHTML = `<header class="zoomHeader">
      <div><span class="kicker">VISTA AMPLIADA</span><h2 id="imageZoomTitle"></h2></div>
      <button type="button" class="zoomClose" aria-label="Cerrar imagen ampliada" autofocus>×</button>
    </header>
    <div class="zoomViewport" tabindex="0" role="region" aria-label="Imagen con zoom" aria-describedby="zoomHelp">
      <p class="zoomError" role="status" hidden>Imagen no disponible</p>
    </div>
    <div class="zoomFooter">
      <div class="zoomControls" role="group" aria-label="Controles de zoom">
        <button type="button" data-zoom="out" aria-label="Alejar imagen">−</button>
        <output aria-label="Nivel de zoom" aria-live="polite">100%</output>
        <button type="button" data-zoom="in" aria-label="Acercar imagen">+</button>
        <button type="button" class="zoomReset" data-zoom="reset">Restablecer</button>
      </div>
      <p id="zoomHelp">Usá + y − para ampliar. Arrastrá para mover; en celular, usá dos dedos.</p>
    </div>`;
  document.body.append(dialog);

  const viewport = dialog.querySelector('.zoomViewport');
  const image = document.createElement('img');
  image.draggable = false;
  const error = dialog.querySelector('.zoomError');
  const zoomOut = dialog.querySelector('[data-zoom="out"]');
  const zoomIn = dialog.querySelector('[data-zoom="in"]');
  const reset = dialog.querySelector('[data-zoom="reset"]');
  const level = dialog.querySelector('output');
  const pointers = new Map();
  let scale = 1, x = 0, y = 0, width = 0, height = 0;
  const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));

  function render() {
    x = clamp(x, Math.max(0, (width * scale - viewport.clientWidth) / 2));
    y = clamp(y, Math.max(0, (height * scale - viewport.clientHeight) / 2));
    image.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`;
    level.textContent = `${Math.round(scale * 100)}%`;
    zoomOut.disabled = !width || scale <= 1;
    zoomIn.disabled = !width || scale >= 4;
    reset.disabled = !width;
    viewport.classList.toggle('isZoomed', scale > 1);
  }

  function fit() {
    if (!dialog.open || !image.complete || !image.naturalWidth) return;
    const ratio = Math.min(viewport.clientWidth / image.naturalWidth, viewport.clientHeight / image.naturalHeight);
    width = image.naturalWidth * ratio;
    height = image.naturalHeight * ratio;
    image.style.width = `${width}px`;
    image.style.height = `${height}px`;
    render();
  }

  function zoomTo(next, anchorX = 0, anchorY = 0) {
    if (!width) return;
    const nextScale = Math.max(1, Math.min(4, next));
    x = anchorX - (anchorX - x) * nextScale / scale;
    y = anchorY - (anchorY - y) * nextScale / scale;
    scale = nextScale;
    render();
  }

  zoomOut.addEventListener('click', () => zoomTo(scale - .5));
  zoomIn.addEventListener('click', () => zoomTo(scale + .5));
  reset.addEventListener('click', () => { x = y = 0; zoomTo(1); });
  dialog.querySelector('.zoomClose').addEventListener('click', () => dialog.close());
  image.addEventListener('load', fit);
  image.addEventListener('error', () => {
    image.hidden = true;
    error.hidden = false;
    width = height = 0;
    render();
  });
  new ResizeObserver(fit).observe(viewport);

  viewport.addEventListener('wheel', event => {
    event.preventDefault();
    const rect = viewport.getBoundingClientRect();
    zoomTo(scale * (event.deltaY < 0 ? 1.15 : 1 / 1.15),
      event.clientX - rect.left - rect.width / 2, event.clientY - rect.top - rect.height / 2);
  }, { passive: false });

  // Las coordenadas de los punteros permiten arrastrar con mouse o dedo y hacer pinza.
  const gesture = () => {
    const points = [...pointers.values()];
    if (points.length < 2) return { ...points[0], distance: 0 };
    const [first, second] = points;
    return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2,
      distance: Math.hypot(first.x - second.x, first.y - second.y) };
  };
  viewport.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    viewport.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    viewport.classList.add('isDragging');
    viewport.focus({ preventScroll: true });
  });
  viewport.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId)) return;
    const before = gesture();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const after = gesture();
    if (before.distance && after.distance) {
      const rect = viewport.getBoundingClientRect();
      zoomTo(scale * after.distance / before.distance,
        before.x - rect.left - rect.width / 2, before.y - rect.top - rect.height / 2);
    }
    if (scale > 1) { x += after.x - before.x; y += after.y - before.y; render(); }
  });
  const release = event => {
    pointers.delete(event.pointerId);
    if (!pointers.size) viewport.classList.remove('isDragging');
  };
  viewport.addEventListener('pointerup', release);
  viewport.addEventListener('pointercancel', release);
  viewport.addEventListener('lostpointercapture', release);

  dialog.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (['+', '=', '-', '0', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      if (event.key === '+' || event.key === '=') zoomTo(scale + .5);
      else if (event.key === '-') zoomTo(scale - .5);
      else if (event.key === '0') { x = y = 0; zoomTo(1); }
      else {
        x += event.key === 'ArrowLeft' ? 40 : event.key === 'ArrowRight' ? -40 : 0;
        y += event.key === 'ArrowUp' ? 40 : event.key === 'ArrowDown' ? -40 : 0;
        render();
      }
    }
  });
  dialog.addEventListener('close', () => {
    pointers.clear();
    viewport.classList.remove('isDragging');
    image.remove();
  });

  return {
    open(source, description) {
      scale = 1;
      x = y = width = height = 0;
      image.hidden = false;
      error.hidden = true;
      image.alt = description;
      dialog.querySelector('h2').textContent = description;
      viewport.prepend(image);
      image.src = source;
      dialog.showModal();
      render();
      fit();
    },
    close() { if (dialog.open) dialog.close(); },
  };
}
