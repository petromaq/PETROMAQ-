# PETROMAQ

Página con Vite, HTML, CSS y JavaScript. Conserva las secciones, fotografías y colores originales, con navegación móvil y diseño adaptable.

## Desarrollo y publicación

Requiere Node.js 20.19+ o 22.12+.

```sh
npm install
npm run dev
npm run build
npm run preview
```

La vista de desarrollo está en http://127.0.0.1:5173. Para publicar, subir el contenido de `dist/`. Editar los recursos en `public/imagenes`, `public/marcas` y `public/clientes`.

Las 28 imágenes locales se publican en WebP, conservando sus dimensiones y transparencias. Los íconos y logotipos usan compresión sin pérdida; las fotografías usan calidad 86. El peso conjunto pasa de 20,13 MB a 3,42 MB (83 % menos). Los originales PNG/JPG se conservan en `assets/originales/`, con las mismas subcarpetas, fuera de la carpeta pública y de la compilación de Vite. Las imágenes del catálogo obtenidas por API conservan el formato entregado por el servidor.

GitHub Actions compila y publica automáticamente los cambios de `main` en GitHub Pages mediante `.github/workflows/deploy.yml`. Pages debe usar GitHub Actions como origen. El dominio `petromaq.com.bo` se conserva en `public/CNAME` y se incluye en la compilación.

## Buscador público de NuevoServidorDatasoft

La clase `Constants` de `src/constants.js` centraliza la URL hardcodeada del servidor y la ruta:

- URL pública: `https://omnidata.click`.
- Búsqueda: `GET /api/v1/publico/catalogo/buscar/59e2f2e2-4a68-4a8a-913b-755ee212ad4c?q=filtro&pagina=1`.
- Sin headers `empresaid` ni `userid`, sin contraseñas o credenciales del ERP.
- El servidor fija internamente el EID `59e2f2e2-4a68-4a8a-913b-755ee212ad4c` y el identificador lógico `publico`.
- El identificador `publico` se rechaza en las rutas internas del ERP; no se crea una cuenta de usuario de base de datos.

El backend realiza la búsqueda por código, nombre del producto y nombre de factura y devuelve páginas de 12 artículos vigentes. Los botones “Cotizar” llevan a `#buscador` y enfocan el campo. La búsqueda tiene un botón permanente “No encuentro mi producto, hablar con un encargado”, que abre WhatsApp con el texto ingresado. La página permite cargar más resultados y muestra la imagen, el Precio 1 en bolivianos y el nombre de factura (`InventarioItems_NombreFactura`), mostrando “Artículo sin nombre de factura” cuando falte este dato. El endpoint devuelve `precio1` como número o `null`. La página indica “Precio a consultar” cuando falta y conserva los precios cero. No se publican costos ni stock.

```json
{
  "status": "ok",
  "response": [
    {
      "descripcion": "Filtro de combustible",
      "imagen": "/api/v1/publico/catalogo/imagenes/59e2f2e2-4a68-4a8a-913b-755ee212ad4c/2",
      "precio1": 125.5
    }
  ],
  "siguientePagina": null
}
```

Las imágenes se sirven por la ruta pública `/api/v1/publico/catalogo/imagenes/59e2f2e2-4a68-4a8a-913b-755ee212ad4c/:id`, limitada a los BLOB de `imagenesproductos` vinculados a productos vigentes de la empresa fijada en el servidor. Si falta una imagen, se muestra “Imagen no disponible”. El texto del servidor se trata como texto, nunca como HTML.

La web antepone `/app` a las rutas de imágenes del catálogo del servidor configurado, por ejemplo `https://omnidata.click/app/api/v1/publico/catalogo/imagenes/{eid}/{id}`. El prefijo se configura en `Constants.PRODUCT_IMAGE_PREFIX`, se aplica al buscador, detalle y zoom, y se conserva una sola vez cuando ya viene incluido en la respuesta. Las imágenes de otros dominios conservan su URL.

Los cambios de backend están en `C:/Express/NuevoServidorDatasoft`; su documentación está en `docs/catalogo-publico-petromaq.md`. La página utiliza `https://omnidata.click` como URL HTTPS pública del servidor.

### Verificación con la base real

Base confirmada por el usuario: `pampa2026`. El esquema real usa `imagenesproductos` y vigencia `Si/No`; la búsqueda admite también vigencia numérica. Las consultas reales por “filtro” y por un código vigente devolvieron HTTP 200, con `descripcion`, `imagen` y `precio1`. La tabla de imágenes está vacía: se muestra “Imagen no disponible” hasta que se carguen fotos. No se modificaron credenciales, datos ni el esquema de la empresa.

## Pruebas

```sh
npm test
```

Playwright usa Microsoft Edge instalado. Verifica cinco anchos de pantalla, recursos locales, navegación móvil, contrato público sin credenciales, imágenes, paginación, visualización de Precio 1 y de precios cero, HTML tratado como texto, búsqueda vacía y recuperación ante errores. La API se simula en estas pruebas.

## Detalle y cotización de artículos

Al pulsar un resultado se abre un modal con imagen ampliada, nombre de factura y Precio 1. El código y el nombre completo interno no se muestran ni se envían. La respuesta pública incluye `secu` (`InventarioItems_Secu`), `descripcion` (nombre de factura), `imagen` y `precio1`. Si falta el nombre de factura, se usa “Artículo sin nombre de factura” sin sustituirlo por el nombre interno.

Al pulsar la imagen del modal se abre un visor de pantalla completa. Permite ampliar hasta 4× con botones, rueda del mouse o pinza con dos dedos, y arrastrar la imagen ampliada. También admite las teclas `+`, `−`, flechas y `0` para restablecer. Cerrar el visor o pulsar Escape devuelve el foco al detalle y conserva el enlace del artículo. Cada imagen nueva comienza ajustada a la pantalla.

“Cotizar por WhatsApp” prepara un mensaje con “Código interno” (el valor de `InventarioItems_Secu`), nombre de factura, Precio 1 y enlace al artículo. El usuario confirma el envío en WhatsApp. El enlace utiliza `?articulo=SECU#buscador`; al abrirlo se recupera el artículo mediante `GET /api/v1/publico/catalogo/buscar/{eid}?secu=SECU`. Se valida que Secu sea un entero positivo de hasta diez dígitos y el artículo esté vigente dentro del EID habilitado. La búsqueda normal por código o nombre sigue usando `q`.

La dirección compartida toma el dominio donde se abre la página. En desarrollo contiene localhost; para compartir enlaces accesibles desde otros equipos se debe utilizar la web publicada. No se envían mensajes automáticamente.

## Diseño corporativo

La paleta, tipografías, radios y espaciados se centralizan en los tokens de `styles.css`. Se conserva Arial, la tipografía original, tanto en textos como en títulos, sin descargar fuentes externas. Ese archivo contiene la estructura y las secciones; `src/refinements.css` contiene el buscador, las tarjetas de resultados, el modal y la adaptación responsive. Los estilos anteriores duplicados fueron consolidados sin modificar la API ni la lógica de búsqueda o cotización.

Los seis íconos de categoría reservan su tamaño desde el HTML y se cargan sin diferirlos. La verificación de interfaz alterna móvil y escritorio entre 320 y 1920 píxeles y comprueba que permanezcan visibles. Las capturas de la revisión se generan en `test-results/`, fuera del control de versiones.
