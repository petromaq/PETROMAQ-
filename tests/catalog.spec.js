import { test, expect } from '@playwright/test';

test('el formato se adapta a móvil y escritorio, con recursos y navegación funcionales', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.productCard')).toHaveCount(6);
  for (const width of [320, 390, 600, 768, 900, 1024, 1440, 1920, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    expect(await page.locator('.header').evaluate(element => element.scrollWidth <= element.clientWidth)).toBeTruthy();
    await expect(page.locator('.productIcon img')).toHaveCount(6);
    await expect.poll(() => page.locator('.productIcon img').evaluateAll(images => images.every(image =>
      image.complete && image.naturalWidth > 0 && image.getBoundingClientRect().width > 0 && getComputedStyle(image).visibility === 'visible'
    ))).toBeTruthy();
  }
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'test-results/design-desktop.png', fullPage: true });
  await page.screenshot({ path: 'test-results/design-preview.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/design-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Menú' }).click();
  await expect(page.getByRole('navigation')).toBeVisible();
  await page.getByRole('navigation').getByRole('link', { name: 'Marcas' }).click();
  await expect(page.getByRole('navigation')).toBeHidden();
  expect(await page.locator('img').evaluateAll(images => images.filter(image => !image.complete || image.naturalWidth === 0).map(image => image.src))).toEqual([]);
  expect(errors).toEqual([]);
});

test('el buscador público pagina y muestra imagen, nombre y Precio 1 sin interpretar HTML', async ({ page }) => {
  await page.route('http://localhost:1360/**', async route => {
    const url = new URL(route.request().url());
    expect(route.request().headers().empresaid).toBeUndefined();
    expect(route.request().headers().userid).toBeUndefined();
    if (url.pathname.includes('/imagenes/')) {
      return route.fulfill({ path: 'public/imagenes/productos/filtro-transporte.png', contentType: 'image/png', headers: { 'access-control-allow-origin': '*' } });
    }
    expect(url.pathname).toBe('/api/v1/publico/catalogo/buscar/59e2f2e2-4a68-4a8a-913b-755ee212ad4c');
    const query = url.searchParams.get('q');
    const secondPage = url.searchParams.get('pagina') === '2';
    await route.fulfill({ json: {
      status: 'ok',
      response: query === 'inexistente' ? [] : [{
        descripcion: secondPage ? 'Segundo filtro' : 'Filtro hidráulico <img src=x onerror=alert(1)>',
        imagen: `/api/v1/publico/catalogo/imagenes/59e2f2e2-4a68-4a8a-913b-755ee212ad4c/2`,
        precio: 918273,
        precio1: secondPage ? 0 : 125.5,
      }],
      siguientePagina: query === 'inexistente' || secondPage ? null : 2,
    }, headers: { 'access-control-allow-origin': '*' } });
  });
  await page.goto('/');
  await page.locator('#filter-search').fill('volvo hidraulico');
  await page.locator('#searchForm').getByRole('button').click();
  await expect(page.locator('.searchResult')).toHaveCount(1);
  await expect(page.locator('.searchResult')).toContainText('<img src=x onerror=alert(1)>');
  await expect(page.locator('.searchResult img')).toHaveCount(1);
  await expect(page.locator('.searchResult [onerror]')).toHaveCount(0);
  await expect(page.locator('#productGrid')).not.toContainText('918273');
  await expect(page.locator('.resultPrice')).toHaveText(/Bs\s125[,.]50/);
  await expect(page.locator('.searchResult a')).toHaveCount(0);
  await page.getByRole('button', { name: 'Ver más resultados' }).click();
  await expect(page.locator('.searchResult')).toHaveCount(2);
  await expect(page.locator('.resultPrice').last()).toHaveText(/Bs\s0[,.]00/);
  await expect(page.getByRole('button', { name: 'Ver más resultados' })).toBeHidden();
  await page.locator('#filter-search').fill('inexistente');
  await page.locator('#searchForm').getByRole('button').click();
  await expect(page.locator('#resultNote')).toContainText('No encontramos');
  await page.getByRole('button', { name: 'Volver a las categorías' }).click();
  await expect(page.locator('.productCard')).toHaveCount(6);
});

test('una falla del servidor ofrece contacto y permite volver al catálogo', async ({ page }) => {
  await page.route('http://localhost:1360/**', route => route.fulfill({ status: 503, json: { message: 'No disponible' }, headers: { 'access-control-allow-origin': '*' } }));
  await page.goto('/');
  await page.locator('#filter-search').fill('Racor');
  await page.locator('#searchForm').getByRole('button').click();
  await expect(page.locator('#resultNote')).toContainText('No pudimos consultar');
  await expect(page.locator('#searchHelp')).toHaveAttribute('href', /wa.me/);
  await page.locator('#filter-search').fill('');
  await expect(page.locator('.productCard')).toHaveCount(6);
  await expect(page.locator('#resultNote')).toBeHidden();
});


test('Cotizar lleva al buscador y la ayuda al encargado incluye el producto escrito', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const selector of ['.headerCta', '.productCard a', '.floatWa']) {
    await page.goto('/');
    await page.locator(selector).first().click();
    await expect(page).toHaveURL(/#buscador$/);
    await expect(page.locator('#filter-search')).toBeFocused();
    await expect(page.locator('#filter-search')).toBeInViewport();
  }
  await page.locator('#filter-search').fill('AB / 123 & filtro');
  const help = page.getByRole('link', { name: /No encuentro mi producto, hablar con un encargado/ });
  await expect(help).toBeVisible();
  const url = new URL(await help.getAttribute('href'));
  expect(url.hostname).toBe('wa.me');
  expect(url.searchParams.get('text')).toContain('AB / 123 & filtro');
  await page.setViewportSize({ width: 360, height: 800 });
  expect(await page.locator('#buscador').evaluate(element => element.scrollWidth <= element.clientWidth)).toBeTruthy();
});

test('el modal amplía la imagen y prepara la cotización con nombre de factura, Secu y enlace recuperable', async ({ page }) => {
  const secu = '101';
  const code = 'FH/001 & Ñ';
  const fullName = 'Filtro completo para maquinaria pesada con todos sus datos y especificaciones & aplicación';
  const invoiceName = 'Filtro hidráulico de factura';
  await page.route('http://localhost:1360/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname.includes('/imagenes/')) return route.fulfill({ path: 'public/imagenes/productos/filtro-transporte.png', contentType: 'image/png', headers: { 'access-control-allow-origin': '*' } });
    if (url.searchParams.has('secu')) expect(url.searchParams.get('secu')).toBe(secu);
    expect(url.searchParams.has('codigo')).toBe(false);
    return route.fulfill({ json: { status: 'ok', response: [{ secu, codigo: code, nombreCompleto: fullName, descripcion: invoiceName, imagen: '/api/v1/publico/catalogo/imagenes/59e2f2e2-4a68-4a8a-913b-755ee212ad4c/2', precio1: 125.5 }], siguientePagina: null }, headers: { 'access-control-allow-origin': '*' } });
  });
  await page.goto('/');
  await page.locator('#filter-search').fill('FH001');
  await page.locator('#searchForm button').click();
  const item = page.getByRole('button', { name: `Ver detalle de ${invoiceName}` });
  await item.focus();
  await item.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('img')).toHaveAttribute('alt', invoiceName);
  await expect(dialog).toContainText(invoiceName);
  await expect(dialog).not.toContainText(fullName);
  await expect(dialog).not.toContainText(code);
  const quote = new URL(await dialog.getByRole('link', { name: 'Cotizar por WhatsApp' }).getAttribute('href'));
  expect(quote.hostname).toBe('wa.me');
  const message = quote.searchParams.get('text');
  expect(message).not.toContain(fullName);
  expect(message).not.toContain(code);
  expect(message).toContain(`Nombre de factura: ${invoiceName}`);
  expect(message).toContain(`Código interno: ${secu}`);
  expect(message).not.toContain('InventarioItems_Secu');
  const sharedUrl = message.split('Artículo: ')[1];
  expect(new URL(sharedUrl).searchParams.get('articulo')).toBe(secu);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(item).toBeFocused();
  await expect(page).not.toHaveURL(/articulo=/);
  await page.goto(sharedUrl);
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(invoiceName);
  await expect(dialog).not.toContainText(fullName);
  await expect(dialog).not.toContainText(code);
  await page.setViewportSize({ width: 360, height: 800 });
  expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBeTruthy();
  await dialog.getByRole('button', { name: 'Cerrar detalle' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page).not.toHaveURL(/articulo=/);
});
