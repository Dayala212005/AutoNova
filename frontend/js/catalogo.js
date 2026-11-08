const featuredCars = [
  { id: 1, name: "Sedán compacto", desc: "Económico y ágil para la ciudad.", price: "$18,500" },
  { id: 2, name: "SUV familiar", desc: "Espacio y comodidad para todos.", price: "$26,900" },
  { id: 3, name: "Pickup 4x4", desc: "Fuerza para trabajo y aventura.", price: "$31,200" },
  { id: 4, name: "Deportivo GT", desc: "Máximo rendimiento y diseño aerodinámico.", price: "$45,000" }
];

function initCatalog() {
  const trackContainer = document.getElementById('car-grid');
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const btnPrev = document.getElementById('carousel-prev');
  const btnNext = document.getElementById('carousel-next');
  
  if (!trackContainer) return;

  function renderCars(carsToRender) {
    if (carsToRender.length === 0) {
      trackContainer.innerHTML = `<p style="width: 100%; text-align: center; color: #64748b;">No se encontraron vehículos.</p>`;
      return;
    }

    trackContainer.innerHTML = carsToRender.map(car => `
      <div class="car-card">
        <div class="car-card-img"></div>
        <div class="car-info">
          <h3>${car.name}</h3>
          <p>${car.desc}</p>
        </div>
        <div class="car-footer">
          <span class="car-price">${car.price}</span>
          <a href="login.html" class="btn btn-outline">Ver detalle</a>
        </div>
      </div>
    `).join('');
  }

  renderCars(featuredCars);

  // Activar funcionalidad de los botones del carrusel
  if (btnPrev && btnNext) {
    btnPrev.addEventListener('click', () => {
      trackContainer.scrollBy({ left: -380, behavior: 'smooth' });
    });

    btnNext.addEventListener('click', () => {
      trackContainer.scrollBy({ left: 380, behavior: 'smooth' });
    });
  }

  // Buscador
  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = searchInput.value.toLowerCase().trim();
      const filtered = featuredCars.filter(car => 
        car.name.toLowerCase().includes(query) || car.desc.toLowerCase().includes(query)
      );
      renderCars(filtered);
    });
  }
}