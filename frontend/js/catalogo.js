const featuredCars = [
  { id: 1, name: "Sedán compacto", desc: "Económico y ágil para la ciudad.", price: "$18,500" },
  { id: 2, name: "SUV familiar", desc: "Espacio y comodidad para todos.", price: "$26,900" },
  { id: 3, name: "Pickup 4x4", desc: "Fuerza para trabajo y aventura.", price: "$31,200" }
];

function initCatalog() {
  const gridContainer = document.getElementById('car-grid');
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');

  function renderCars(carsToRender) {
    if (!gridContainer) return;
    
    if (carsToRender.length === 0) {
      gridContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #64748b;">No se encontraron vehículos.</p>`;
      return;
    }

    gridContainer.innerHTML = carsToRender.map(car => `
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

  // buscador
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