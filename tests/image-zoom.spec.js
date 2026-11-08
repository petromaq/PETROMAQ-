import { test, expect } from '@playwright/test';

async function prepareCatalog(page) {
  await page.route('https://omnidata.click/**', route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/sin-imagen')) return route.fulfill({ status: 404, headers: { 'access-control-allow-origin': '*' } });
    if (url.pathname.includes('/imagenes/')) {
      expect(url.pathname).toBe('/app/api/v1/publico/catalogo/imagenes/59e2f2e2-4a68-4a8a-913b-755ee212ad4c/2');
      return route.fulfill({ path: 'public/imagenes/productos/filtro-transporte.webp', contentType: 'image/webp', headers: { 'access-control-allow-origin': '*' } });
    }
    const imagePath = '/api/v1/publico/catalogo/imagenes/59e2f2e2-4a68-4a8a-913b-755ee212ad4c/';
    const products = [
      { secu: '101', descripcion: 'Filtro de factura', imagen: `${imagePath}2`, precio1: 125.5 },
      { secu: '102', descripcion: 'Producto sin foto', imagen: null, precio1: null },
      { secu: '103', descripcion: 'Producto con foto no disponible', imagen: `${imagePath}sin-imagen`, precio1: 0 },
    ];
    return route.fulfill({ json: { status: 'ok', response: products, siguientePagina: null }, headers: { 'access-control-allow-origin': '*' } });
  });
  await page.goto('/?articulo=101#buscador');
  await expect(page.locator('.productModal')).toBeVisible();
}

test('el visor permite zoom, desplazamiento y teclado sin perder el detalle ni la cotización', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await prepareCatalog(page);
  const product = page.locator('.productModal');
  const enlarge = product.getByRole('button', { name: 'Ampliar imagen del producto' });
  const quote = await product.locator('.modalQuote').getAttribute('href');
  await enlarge.click();
  const viewer = page.locator('.imageZoom');
  const viewport = viewer.getByRole('region', { name: 'Imagen con zoom' });
  const level = viewer.locator('output');
  await expect(viewer).toBeVisible();
  await expect(viewer.locator('img')).toHaveAttribute('alt', 'Filtro de factura');
  await expect(viewer.locator('img')).toHaveAttribute('src', 'https://omnidata.click/app/api/v1/publico/catalogo/imagenes/59e2f2e2-4a68-4a8a-913b-755ee212ad4c/2');
  await expect(level).toHaveText('100%');
  await expect(viewer.getByRole('button', { name: 'Alejar imagen' })).toBeDisabled();
  await viewer.getByRole('button', { name: 'Acercar imagen' }).click();
  await expect(level).toHaveText('150%');
  const before = await viewer.locator('img').boundingBox();
  const area = await viewport.boundingBox();
  await page.mouse.move(area.x + area.width / 2, area.y + area.height / 2);
  await page.mouse.down();
  await page.mouse.move(area.x + area.width / 2 + 70, area.y + area.height / 2 + 60, { steps: 5 });
  await page.mouse.up();
  const after = await viewer.locator('img').boundingBox();
  expect(Math.abs(after.x - before.x) + Math.abs(after.y - before.y)).toBeGreaterThan(20);
  await page.mouse.wheel(0, -120);
  await expect(level).not.toHaveText('150%');
  await viewport.focus();
  await page.keyboard.press('0');
  await expect(level).toHaveText('100%');
  for (let step = 0; step < 7; step++) await page.keyboard.press('+');
  await expect(level).toHaveText('400%');
  await expect(viewer.getByRole('button', { name: 'Acercar imagen' })).toBeDisabled();
  await page.keyboard.press('-');
  await expect(level).toHaveText('350%');
  await viewer.getByRole('button', { name: 'Restablecer' }).click();
  await expect(level).toHaveText('100%');
  await page.screenshot({ path: 'test-results/zoom-desktop.png' });
  await page.keyboard.press('Escape');
  await expect(viewer).toBeHidden();
  await expect(product).toBeVisible();
  await expect(enlarge).toBeFocused();
  await expect(page).toHaveURL(/articulo=101/);
  await expect(product.locator('.modalQuote')).toHaveAttribute('href', quote);
  await enlarge.click();
  await expect(level).toHaveText('100%');
  await viewer.getByRole('button', { name: 'Cerrar imagen ampliada' }).click();
  await product.getByRole('button', { name: 'Cerrar detalle' }).click();
  await expect(page).not.toHaveURL(/articulo=/);
  expect(errors).toEqual([]);
});

test('el visor admite pinza y arrastre táctil y se adapta al cambiar el tamaño de pantalla', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepareCatalog(page);
  await page.getByRole('button', { name: 'Ampliar imagen del producto' }).click();
  const viewer = page.locator('.imageZoom');
  const viewport = viewer.locator('.zoomViewport');
  const area = await viewport.boundingBox();
  const centerX = area.x + area.width / 2;
  const centerY = area.y + area.height / 2;
  const session = await context.newCDPSession(page);
  await session.send('Emulation.setTouchEmulationEnabled', { enabled: true });
  const points = gap => [
    { x: centerX - gap, y: centerY, id: 1 },
    { x: centerX + gap, y: centerY, id: 2 },
  ];
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(45) });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(90) });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(viewer.locator('output')).toHaveText('200%');
  const before = await viewer.locator('img').boundingBox();
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: centerX, y: centerY, id: 1 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: centerX + 55, y: centerY + 40, id: 1 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const after = await viewer.locator('img').boundingBox();
  expect(Math.abs(after.x - before.x) + Math.abs(after.y - before.y)).toBeGreaterThan(20);
  await session.detach();
  await page.screenshot({ path: 'test-results/zoom-mobile.png' });
  for (const width of [320, 768, 1440, 390]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await viewer.evaluate(element => element.scrollWidth <= element.clientWidth)).toBeTruthy();
    await expect(viewer.getByRole('button', { name: 'Cerrar imagen ampliada' })).toBeInViewport();
    await expect(viewer.getByRole('button', { name: 'Restablecer' })).toBeInViewport();
    const zoomOut = await viewer.getByRole('button', { name: 'Alejar imagen' }).boundingBox();
    const zoomIn = await viewer.getByRole('button', { name: 'Acercar imagen' }).boundingBox();
    expect(Math.abs(zoomOut.y - zoomIn.y)).toBeLessThan(1);
  }
  await viewer.getByRole('button', { name: 'Restablecer' }).click();
  await expect(viewer.locator('output')).toHaveText('100%');
  await expect.poll(async () => {
    const image = await viewer.locator('img').boundingBox();
    const bounds = await viewport.boundingBox();
    return image.width <= bounds.width + 1 && image.height <= bounds.height + 1;
  }).toBeTruthy();
  await page.keyboard.press('Escape');
  await expect(page.locator('.productModal')).toBeVisible();
});

test('no ofrece zoom para fotos ausentes o con errores de carga', async ({ page }) => {
  await prepareCatalog(page);
  await page.getByRole('button', { name: 'Cerrar detalle' }).click();
  for (const name of ['Producto sin foto', 'Producto con foto no disponible']) {
    await page.getByRole('button', { name: `Ver detalle de ${name}`, exact: true }).click();
    const product = page.locator('.productModal');
    await expect(product.locator('.modalImage')).toHaveText('Imagen no disponible');
    await expect(product.locator('.modalEnlarge')).toHaveCount(0);
    await product.getByRole('button', { name: 'Cerrar detalle' }).click();
  }
});
