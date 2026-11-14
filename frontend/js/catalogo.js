function initCatalog() {
  const trackContainer = document.getElementById('car-grid');
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const btnPrev = document.getElementById('carousel-prev');
  const btnNext = document.getElementById('carousel-next');

  if (!trackContainer) return;

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

    trackContainer.innerHTML = cars.map(car => `
      <div class="car-card">
        <div class="car-card-img" ${car.imagen_url ? `style="background-image:url('${car.imagen_url}');background-size:cover;background-position:center;"` : ''}></div>
        <div class="car-info">
          <h3>${car.nombre}</h3>
        </div>
        <div class="car-footer">
          <span class="car-price">${formatearPrecio(car.precio)}</span>
          <a href="producto.html?id=${car.id}" class="btn btn-outline">Ver detalle</a>
        </div>
      </div>
    `).join('');
  }

  async function cargarDestacados() {
    trackContainer.innerHTML = `<p style="width: 100%; text-align: center; color: #64748b;">Cargando...</p>`;
    try {
      const productos = await api('/productos');
      const destacados = productos
        .filter(p => p.stock > 0)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 6);
      renderCars(destacados);
    } catch (err) {
      trackContainer.innerHTML = `<p style="width: 100%; text-align: center; color: #ef4444;">No se pudo cargar el catálogo.</p>`;
    }
  }

  cargarDestacados();

  if (btnPrev && btnNext) {
    btnPrev.addEventListener('click', () => {
      trackContainer.scrollBy({ left: -380, behavior: 'smooth' });
    });
    btnNext.addEventListener('click', () => {
      trackContainer.scrollBy({ left: 380, behavior: 'smooth' });
    });
  }
  
  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = searchInput.value.trim();
      window.location.href = `catalogo.html${q ? '?q=' + encodeURIComponent(q) : ''}`;
    });
  }
}