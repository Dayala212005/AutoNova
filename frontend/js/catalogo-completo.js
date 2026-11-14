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
          <div class="car-card-img" ${car.imagen_url ? `style="background-image:url('${car.imagen_url}');background-size:cover;background-position:center;"` : ''}></div>
          <div class="car-info">
            <h3>${car.nombre}</h3>
          </div>
          <div class="car-footer">
            <span class="car-price">${formatearPrecio(car.precio)}</span>
            ${sinStock
          ? `<button class="btn btn-outline" disabled style="background:#e2e8f0; color:#94a3b8; cursor:not-allowed; box-shadow:none; outline:none; border:none;">Agotado</button>`
          : `<a href="producto.html?id=${car.id}" class="btn btn-outline">Ver detalle</a>`}
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