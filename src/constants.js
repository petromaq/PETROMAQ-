export class Constants {
  // Servidor local. Reemplazar por el dominio HTTPS al publicar.
  static API_BASE_URL = 'http://localhost:1360';
  static EMPRESA_ID = '59e2f2e2-4a68-4a8a-913b-755ee212ad4c';
  static PRODUCT_SEARCH_PATH = `/api/v1/publico/catalogo/buscar/${this.EMPRESA_ID}`;
  static SEARCH_TIMEOUT_MS = 15000;
  static WHATSAPP_URL = 'https://wa.me/59171644088';
}
