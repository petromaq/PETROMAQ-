import { Constants } from './constants.js';
import { createImageZoom } from './image-zoom.js';

export const formatPrice = value => value === null ? 'Precio a consultar'
  : `Bs ${new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;

export function productUrl(secu) {
  const url = new URL(location.pathname, location.origin);
  url.searchParams.set('articulo', secu);
  url.hash = 'buscador';
  return url;
}

export function createProductModal() {
  const imageZoom = createImageZoom();
  const dialog = document.createElement('dialog');
  dialog.className = 'productModal';
  dialog.setAttribute('aria-labelledby', 'productModalTitle');
  dialog.innerHTML = `<form method="dialog"><button class="modalClose" aria-label="Cerrar detalle" autofocus>×</button></form>
    <div class="modalLayout"><div class="modalImage"></div><div class="modalCopy">
      <span class="kicker">DETALLE DEL PRODUCTO</span>
      <h2 id="productModalTitle"></h2><p class="modalPrice"></p>
      <a class="modalQuote" target="_blank" rel="noopener noreferrer">Cotizar por WhatsApp ↗</a>
    </div></div>`;
  document.body.append(dialog);
  dialog.addEventListener('close', () => {
    imageZoom.close();
    document.body.classList.remove('modalOpen');
    const url = new URL(location.href);
    url.searchParams.delete('articulo');
    history.replaceState(null, '', url);
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  return product => {
    const media = dialog.querySelector('.modalImage');
    media.replaceChildren();
    if (product.image) {
      const enlarge = document.createElement('button');
      enlarge.type = 'button';
      enlarge.className = 'modalEnlarge';
      enlarge.setAttribute('aria-label', 'Ampliar imagen del producto');
      enlarge.setAttribute('aria-haspopup', 'dialog');
      enlarge.disabled = true;
      const image = document.createElement('img');
      image.src = product.image;
      image.alt = product.description;
      image.addEventListener('load', () => { enlarge.disabled = false; }, { once: true });
      image.addEventListener('error', () => { media.textContent = 'Imagen no disponible'; }, { once: true });
      const hint = document.createElement('span');
      hint.className = 'modalZoomHint';
      hint.textContent = 'Ampliar imagen +';
      enlarge.append(image, hint);
      enlarge.addEventListener('click', () => imageZoom.open(product.image, product.description));
      media.append(enlarge);
    } else media.textContent = 'Imagen no disponible';
    dialog.querySelector('h2').textContent = product.description;
    dialog.querySelector('.modalPrice').textContent = formatPrice(product.price);
    const url = productUrl(product.secu);
    const message = ['Hola PETROMAQ, quiero cotizar este artículo:', `Código interno: ${product.secu}`,
      `Nombre de factura: ${product.description}`,
      `Precio 1: ${formatPrice(product.price)}`, `Artículo: ${url.href}`].join('\n');
    dialog.querySelector('.modalQuote').href = `${Constants.WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
    history.replaceState(null, '', url);
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('modalOpen');
  };
}
