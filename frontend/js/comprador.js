const availableCars = [
  { id: 1, name: "Sedán compacto", desc: "Disponible · Stock: 4", price: 18500 },
  { id: 2, name: "SUV familiar", desc: "Disponible · Stock: 2", price: 26900 },
  { id: 3, name: "Pickup 4x4", desc: "Disponible · Stock: 3", price: 31200 },
  { id: 4, name: "Hatchback urbano", desc: "Disponible · Stock: 5", price: 14900 }
];

let cart = [];

function initComprador() {
  const carsCatalogContainer = document.getElementById('cars-catalog');
  const invoiceItemsContainer = document.getElementById('invoice-items');
  const subtotalEl = document.getElementById('subtotal-amount');
  const ivaEl = document.getElementById('iva-amount');
  const totalEl = document.getElementById('total-amount');
  const dateEl = document.getElementById('current-date');
  const generateBtn = document.getElementById('generate-invoice-btn');

  if (!carsCatalogContainer) return;

  const today = new Date();
  dateEl.textContent = today.toLocaleDateString('es-ES');

  function renderCatalog() {
    carsCatalogContainer.innerHTML = availableCars.map(car => {
      const isInCart = cart.some(item => item.id === car.id);
      return `
        <div class="car-shop-card">
          <div class="car-shop-thumb">
            
          </div>
          <div class="car-shop-info">
            <h3>${car.name}</h3>
            <p>${car.desc}</p>
          </div>
          <div class="car-shop-footer">
            <span class="car-shop-price">$${car.price.toLocaleString()}</span>
            <button class="btn-add-cart ${isInCart ? 'added' : ''}" onclick="toggleCarCart(${car.id})">
              ${isInCart ? 'En la factura' : 'Agregar'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderInvoice() {
    if (cart.length === 0) {
      invoiceItemsContainer.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #94a3b8; padding: 1.5rem 0;">No hay vehículos seleccionados</td></tr>`;
      subtotalEl.textContent = '$0.00';
      ivaEl.textContent = '$0.00';
      totalEl.textContent = '$0.00';
      return;
    }

    invoiceItemsContainer.innerHTML = cart.map(item => `
      <tr>
        <td>${item.name}</td>
        <td>1</td>
        <td>$${item.price.toLocaleString()}</td>
      </tr>
    `).join('');

    const subtotal = cart.reduce((acc, item) => acc + item.price, 0);
    const iva = subtotal * 0.13;
    const total = subtotal + iva;

    subtotalEl.textContent = `$${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    ivaEl.textContent = `$${iva.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    totalEl.textContent = `$${total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  }

  window.toggleCarCart = function(id) {
    const carIndex = cart.findIndex(item => item.id === id);
    if (carIndex > -1) {
      cart.splice(carIndex, 1);
    } else {
      const carToAdd = availableCars.find(c => c.id === id);
      if (carToAdd) cart.push(carToAdd);
    }
    renderCatalog();
    renderInvoice();
  };

  generateBtn.addEventListener('click', () => {
    if (cart.length === 0) {
      alert('Por favor selecciona al menos un vehículo para generar la factura.');
      return;
    }
    alert('¡Factura generada con éxito! Su proceso de compra ha sido registrado.');
    cart = [];
    renderCatalog();
    renderInvoice();
  });

  renderCatalog();
  renderInvoice();
}