import { Constants } from './constants.js';
import { searchProducts } from './product-service.js';
import { createProductModal, formatPrice } from './product-modal.js';

function resultCard(product, openProduct) {
  const card = document.createElement('article');
  card.className = 'searchResult';
  const open = document.createElement('button');
  open.type = 'button';
  open.className = 'resultOpen';
  open.setAttribute('aria-haspopup', 'dialog');
  open.setAttribute('aria-label', `Ver detalle de ${product.description}`);
  open.addEventListener('click', () => openProduct(product));
  const media = document.createElement('span');
  media.className = 'resultImage';
  const fallback = () => { media.textContent = 'Imagen no disponible'; };
  if (product.image) {
    const image = document.createElement('img');
    image.src = product.image;
    image.alt = product.description;
    image.loading = 'lazy';
    image.addEventListener('error', fallback, { once: true });
    media.append(image);
  } else fallback();
  const description = document.createElement('span');
  description.className = 'resultTitle';
  description.textContent = product.description;
  open.append(media, description);
  const price = document.createElement('span');
  price.className = 'resultPrice';
  price.textContent = formatPrice(product.price);
  open.append(price);
  card.append(open);
  return card;
}

export function setupSearch({ searchForm, searchInput, resultNote, productGrid, restore }) {
  const openProduct = createProductModal();
  let pending, currentQuery = '', nextPage = null, count = 0;
  const button = searchForm.querySelector('button');
  const help = document.querySelector('#searchHelp');
  function updateHelp() {
    const query = searchInput.value.trim();
    help.href = `${Constants.WHATSAPP_URL}?text=${encodeURIComponent(
      query ? `Hola PETROMAQ, no encuentro el producto: ${query}. Quiero hablar con un encargado.`
        : 'Hola PETROMAQ, no encuentro mi producto. Quiero hablar con un encargado.'
    )}`;
  }
  updateHelp();
  searchInput.addEventListener('input', updateHelp);
  document.addEventListener('click', event => {
    const link = event.target.closest('[data-open-search]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (location.hash !== '#buscador') history.pushState(null, '', '#buscador');
    document.querySelector('#buscador').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    searchInput.focus({ preventScroll: true });
  });
  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'resetSearch';
  reset.textContent = 'Volver a las categorías ↗';
  reset.hidden = true;
  resultNote.after(reset);
  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'loadMore';
  more.textContent = 'Ver más resultados ↓';
  more.hidden = true;
  productGrid.after(more);
  function clear() {
    pending?.abort();
    currentQuery = searchInput.value = '';
    updateHelp();
    nextPage = null;
    count = 0;
    restore();
    resultNote.hidden = reset.hidden = more.hidden = true;
    productGrid.removeAttribute('aria-busy');
    button.textContent = 'Buscar →';
  }
  reset.addEventListener('click', clear);
  searchInput.addEventListener('input', () => { if (!searchInput.value.trim()) clear(); });
  async function load(page = 1) {
    pending?.abort();
    const controller = new AbortController();
    pending = controller;
    const query = currentQuery;
    resultNote.hidden = reset.hidden = false;
    more.hidden = true;
    resultNote.textContent = `Buscando “${query}”…`;
    if (page === 1) { productGrid.replaceChildren(); count = 0; nextPage = null; }
    productGrid.setAttribute('aria-busy', 'true');
    button.textContent = 'Buscando…';
    try {
      const result = await searchProducts(query, controller.signal, page);
      if (controller.signal.aborted) return;
      productGrid.append(...result.items.map(product => resultCard(product, openProduct)));
      count += result.items.length;
      nextPage = result.nextPage;
      more.hidden = nextPage === null;
      resultNote.textContent = count ? `${count} resultado(s) para “${query}”` : `No encontramos productos para “${query}”.`;
    } catch (error) {
      if (controller.signal.aborted) return;
      more.hidden = page === 1 || nextPage === null;
      resultNote.textContent = ['TypeError', 'TimeoutError'].includes(error.name)
        ? 'No pudimos conectar con el catálogo. Intentá nuevamente o consultá con un asesor.' : error.message;
    } finally {
      if (pending === controller) {
        productGrid.removeAttribute('aria-busy');
        button.textContent = 'Buscar →';
      }
    }
  }
  more.addEventListener('click', () => { if (nextPage !== null) load(nextPage); });
  searchForm.addEventListener('submit', event => {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return clear();
    if (query.length < 2) {
      searchInput.setCustomValidity('Ingresá al menos dos caracteres.');
      searchInput.reportValidity();
      return;
    }
    currentQuery = query;
    document.querySelector('#catalogo').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    load();
  });
  searchInput.addEventListener('input', () => searchInput.setCustomValidity(''));
  const sharedSecu = new URL(location.href).searchParams.get('articulo');
  if (sharedSecu) {
    if (!/^[1-9][0-9]{0,9}$/.test(sharedSecu)) {
      resultNote.hidden = false;
      resultNote.textContent = 'El enlace del artículo no es válido.';
      return;
    }
    searchInput.value = currentQuery = '';
    updateHelp();
    const controller = new AbortController();
    pending = controller;
    resultNote.hidden = reset.hidden = false;
    resultNote.textContent = 'Cargando artículo…';
    productGrid.replaceChildren();
    productGrid.setAttribute('aria-busy', 'true');
    searchProducts('', controller.signal, 1, sharedSecu).then(result => {
      if (controller.signal.aborted) return;
      productGrid.replaceChildren(...result.items.map(product => resultCard(product, openProduct)));
      const product = result.items.find(item => item.secu === sharedSecu);
      resultNote.textContent = product ? 'Artículo seleccionado' : 'Este artículo ya no está disponible. Podés consultar con un encargado.';
      if (product) openProduct(product);
    }).catch(error => {
      if (!controller.signal.aborted) resultNote.textContent = 'No pudimos cargar el artículo. Intentá nuevamente o hablá con un encargado.';
    }).finally(() => {
      if (pending === controller) productGrid.removeAttribute('aria-busy');
    });
  }
}

export function setupNavigation() {
  const menu = document.querySelector('.menuToggle');
  const nav = document.querySelector('#mainNav');
  const close = () => { menu.setAttribute('aria-expanded', 'false'); nav.classList.remove('isOpen'); };
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('isOpen', open);
  });
  nav.addEventListener('click', event => { if (event.target.closest('a')) close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
}
