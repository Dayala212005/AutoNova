// --- Seguridad XSS -------------------------------------------------------
// Convierte texto de usuario en texto inofensivo antes de meterlo en innerHTML.
// El & va primero para no volver a escapar los & que generan las otras lineas.
function escapeHTML(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Para usar una URL dentro de url('...') en CSS. escapeHTML no sirve aqui porque
// el navegador decodifica &#39; de vuelta a ' antes de interpretar el CSS.
// Solo acepta rutas que empiezan con / o http(s):// y codifica los caracteres peligrosos.
function urlSegura(url) {
  const u = String(url ?? '').trim();
  if (!/^(https?:\/\/|\/)/i.test(u) || u.startsWith('//')) return '';
  return u.replace(/['"()\\\s<>]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}
// -------------------------------------------------------------------------

function initCatalogoCompleto() {
  const trackContainer = document.getElementById('car-grid-full');
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');

  if (!trackContainer) return;

  const params = new URLSearchParams(window.location.search);
  const qInicial = params.get('q') || '';
  if (searchInput) searchInput.value = qInicial;

  function formatearPrecio(precio) {
    return Number(precio).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    });
  }

  function renderCars(cars) {
    if (!cars.length) {
      trackContainer.innerHTML = `<p style="width: 100%; text-align: center; color: #64748b;">No se encontraron vehículos.</p>`;
      return;
    }

    trackContainer.innerHTML = cars.map(car => {
      const sinStock = car.stock <= 0;
      return `
        <div class="car-card">
          <div class="car-card-img" ${urlSegura(car.imagen_url) ? `style="background-image:url('${urlSegura(car.imagen_url)}');background-size:cover;background-position:center;"` : ''}></div>
          <div class="car-info">
            <h3>${escapeHTML(car.nombre)}</h3>
          </div>
          <div class="car-footer">
            <span class="car-price">${formatearPrecio(car.precio)}</span>
            ${sinStock
          ? `<button class="btn btn-outline" disabled style="background:#e2e8f0; color:#94a3b8; cursor:not-allowed; box-shadow:none; outline:none; border:none;">Agotado</button>`
          : `<a href="producto.html?id=${escapeHTML(encodeURIComponent(car.id))}" class="btn btn-outline">Ver detalle</a>`}
          </div>
        </div>
      `;
    }).join('');
  }

  async function cargarProductos(query) {
    trackContainer.innerHTML = `<p style="width: 100%; text-align: center; color: #64748b;">Cargando...</p>`;
    try {
      const ruta = query ? `/productos?q=${encodeURIComponent(query)}` : '/productos';
      const productos = await api(ruta);
      renderCars(productos);
    } catch (err) {
      trackContainer.innerHTML = `<p style="width: 100%; text-align: center; color: #ef4444;">No se pudo cargar el catálogo.</p>`;
    }
  }

  cargarProductos(qInicial);

  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      cargarProductos(searchInput.value.trim());
    });
  }
}