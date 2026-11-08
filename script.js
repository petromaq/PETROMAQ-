import { setupSearch, setupNavigation } from './src/interactions.js';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');


/* =====================================================
   PRODUCTOS
===================================================== */

const products = [
  [
    'FH / FM / F12',
    'Filtros para transporte pesado',
    'Aire · aceite · combustible',
    'Volvo, Scania, Mercedes-Benz y Renault Trucks',
    'imagenes/productos/filtro-transporte.webp'
  ],
  [
    'RACOR',
    'Trampas de combustible',
    'Separación de agua',
    'Transporte, agro y maquinaria pesada',
    'imagenes/productos/trampa-combustible.webp'
  ],
  [
    'HD',
    'Filtros para maquinaria',
    'Motor · hidráulico · cabina',
    'CAT, New Holland y John Deere',
    'imagenes/productos/filtro-maquinaria.webp'
  ],
  [
    'EP2 / EP3',
    'Grasas de alto desempeño',
    'Rodamientos · chasis',
    'Minería, industria y flotas',
    'imagenes/productos/grasa.webp'
  ],
  [
    'DIESEL',
    'Lubricantes',
    'Motores y transmisiones',
    'Operación continua y trabajo severo',
    'imagenes/productos/lubricante.webp'
  ],
  [
    'IND',
    'Filtración industrial',
    'Polvo · proceso · compresores',
    'Industria, minería y construcción',
    'imagenes/productos/filtro-industrial.webp'
  ]
];


/* =====================================================
   FOTOS DE CLIENTES
===================================================== */

const clients = [
  [
    'clientes/cliente-01.webp',
    'Entrega a transporte pesado',
    'Filtros preparados para mantener la flota trabajando.'
  ],
  [
    'clientes/cliente-02.webp',
    'Atención directa',
    'Asesoramiento para encontrar la aplicación correcta.'
  ],
  [
    'clientes/cliente-03.webp',
    'Despachos a toda Bolivia',
    'Pedidos listos para llegar donde nuestros clientes operan.'
  ],
  [
    'clientes/cliente-04.webp',
    'Soluciones para maquinaria',
    'Filtración para trabajo pesado y condiciones exigentes.'
  ],
  [
    'clientes/cliente-05.webp',
    'Talleres y empresas',
    'Productos confiables para mantenimiento y continuidad.'
  ],
  [
    'clientes/cliente-06.webp',
    'Clientes PETROMAQ',
    'Relaciones construidas con atención, calidad y respuesta.'
  ]
];


/* =====================================================
   MARCAS
===================================================== */

const brands = [
  ['marcas/Marca 01.webp', 'Donaldson'],
  ['marcas/Marca 02.webp', 'MANN-FILTER'],
  ['marcas/Marca 03.webp', 'Hardman Filters'],
  ['marcas/Marca 04.webp', 'SF'],
  ['marcas/Marca 05.webp', 'MAQFIL Filters'],
  ['marcas/Marca 06.webp', 'Lubrax'],
  ['marcas/Marca 07.webp', 'Ipiranga'],
  ['marcas/Marca 08.webp', 'YPF']
];


/* =====================================================
   INICIAR LA PÁGINA
===================================================== */

function iniciarPetromaq() {

  /* ===================================================
     CATÁLOGO
  =================================================== */

  const productGrid =
    document.querySelector('#productGrid');


  function productHTML(product) {
    return `
      <article class="productCard">

        <div class="productIcon">
          <img
            src="${product[4]}"
            alt="${product[1]}"
            loading="eager"
            decoding="async"
            width="88"
            height="88"
          >
        </div>

        <span class="productCode">
          ${product[0]}
        </span>

        <h3>${product[1]}</h3>

        <b>${product[2]}</b>

        <p>${product[3]}</p>

        <a
          href="#buscador"
          data-open-search
        >
          Cotizar <span>↗</span>
        </a>

      </article>
    `;
  }


  function renderProducts(productList) {
    if (!productGrid) return;

    productGrid.innerHTML = productList
      .map(productHTML)
      .join('');
  }


  renderProducts(products);


  /* ===================================================
     BUSCADOR
  =================================================== */

  const searchForm =
    document.querySelector('#searchForm');

  const searchInput =
    document.querySelector('#filter-search');

  const resultNote =
    document.querySelector('#resultNote');


  setupSearch({ searchForm, searchInput, resultNote, productGrid, restore: () => renderProducts(products) });
  setupNavigation();

  /* ===================================================
     CARRUSEL DE CLIENTES
  =================================================== */

  const clientCarousel =
    document.querySelector('#clientCarousel');


  if (clientCarousel) {
    clientCarousel.innerHTML = clients
      .map(function (client, index) {
        return `
          <article class="clientStory">

            <div
              class="clientPhoto"
              style="background-image: url('${client[0]}')"
            >
              <span class="photoNumber">
                0${index + 1}
              </span>

              <div class="photoPlaceholder">
                <b>PETROMAQ</b>
                <small>Siempre en movimiento</small>
              </div>

              <i>PETROMAQ · BOLIVIA</i>
            </div>

            <div class="storyCopy">
              <h3>${client[1]}</h3>
              <p>${client[2]}</p>
            </div>

          </article>
        `;
      })
      .join('');


    /* Quitar el texto FOTO REAL cuando carga la foto */

    clientCarousel
      .querySelectorAll('.clientPhoto')
      .forEach(function (photoElement, index) {
        const image = new Image();

        image.onload = function () {
          const placeholder =
            photoElement.querySelector(
              '.photoPlaceholder'
            );

          if (placeholder) {
            placeholder.remove();
          }
        };

        image.src = clients[index][0];
      });
  }


  /* ===================================================
     CARRUSEL DE MARCAS
  =================================================== */

  const brandsCarousel =
    document.querySelector('#brandsCarousel');


  if (brandsCarousel) {
    const duplicatedBrands = [
      ...brands,
      ...brands
    ];

    brandsCarousel.innerHTML =
      duplicatedBrands
        .map(function (brand, index) {
          return `
            <article
              class="brandSlot"
              ${index >= brands.length
                ? 'aria-hidden="true"'
                : ''}
            >
              <img
                src="${brand[0]}"
                alt="${index < brands.length
                  ? brand[1]
                  : ''}"
              >
            </article>
          `;
        })
        .join('');
  }


  /* ===================================================
     BOTONES DE CARRUSELES
  =================================================== */

  document
    .querySelectorAll('[data-scroll]')
    .forEach(function (button) {
      button.addEventListener(
        'click',
        function () {
          const carouselId =
            button.dataset.scroll;

          const direction =
            Number(button.dataset.direction) || 1;

          const carousel =
            document.querySelector(
              '#' + carouselId
            );

          if (!carousel) return;

          carousel.scrollBy({
            left: direction * 450,
            behavior: 'smooth'
          });
        }
      );
    });


  /* ===================================================
     MOVIMIENTO AUTOMÁTICO DE CLIENTES
     Avanza cada 5 segundos
  =================================================== */

  if (clientCarousel) {
    window.setInterval(function () {
      if (reducedMotion.matches || document.hidden || clientCarousel.matches(':hover, :focus-within')) return;
      const firstCard =
        clientCarousel.firstElementChild;

      if (!firstCard) return;

      const styles =
        window.getComputedStyle(
          clientCarousel
        );

      const gap =
        parseFloat(styles.gap) || 16;

      const cardWidth =
        firstCard.getBoundingClientRect().width;

      const step =
        cardWidth + gap;

      const maximumScroll =
        clientCarousel.scrollWidth -
        clientCarousel.clientWidth;

      const reachedEnd =
        clientCarousel.scrollLeft + step >=
        maximumScroll - 5;

      clientCarousel.scrollTo({
        left: reachedEnd
          ? 0
          : clientCarousel.scrollLeft + step,
        behavior: 'smooth'
      });

    }, 5000);
  }


  /* ===================================================
     MOVIMIENTO CONTINUO DE MARCAS
  =================================================== */

  if (brandsCarousel) {
    window.setInterval(function () {
      if (reducedMotion.matches || document.hidden || brandsCarousel.matches(':hover, :focus-within')) return;
      const loopPoint =
        brandsCarousel.scrollWidth / 2;

      if (loopPoint <= 0) return;

      brandsCarousel.scrollLeft += 1;

      if (
        brandsCarousel.scrollLeft >=
        loopPoint
      ) {
        brandsCarousel.scrollLeft = 0;
      }

    }, 25);
  }

}


/* =====================================================
   EJECUTAR CUANDO EL HTML ESTÉ LISTO
===================================================== */

if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    iniciarPetromaq
  );
} else {
  iniciarPetromaq();
}
