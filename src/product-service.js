import { Constants } from './constants.js';

export function safeImageUrl(value, baseUrl = Constants.API_BASE_URL) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value, baseUrl);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}

export function normalizeProducts(payload) {
  if (payload?.status !== 'ok' || !Array.isArray(payload.response)) {
    throw new Error('No pudimos consultar el catálogo. Intentá nuevamente.');
  }
  return {
    items: payload.response.map(item => ({
      secu: String(item.secu ?? '').trim(),
      description: String(item.descripcion ?? '').trim(),
      image: safeImageUrl(item.imagen),
      price: item.precio1 == null || item.precio1 === '' || !Number.isFinite(Number(item.precio1))
        ? null : Number(item.precio1),
    })).filter(item => item.description),
    nextPage: Number.isSafeInteger(payload.siguientePagina) && payload.siguientePagina > 1
      ? payload.siguientePagina : null,
  };
}

export async function searchProducts(query, signal, page = 1, exactSecu) {
  const url = new URL(Constants.PRODUCT_SEARCH_PATH, Constants.API_BASE_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('pagina', String(page));
  if (exactSecu) url.searchParams.set('secu', exactSecu);
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.any([signal, AbortSignal.timeout(Constants.SEARCH_TIMEOUT_MS)]),
  });
  if (!response.ok) throw new Error('No pudimos consultar el catálogo. Intentá nuevamente en unos instantes.');
  return normalizeProducts(await response.json());
}
