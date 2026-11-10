let autos = [];
let cart = [];

function initComprador() {
  if (!exigirRol('comprador')) return;

  const carsCatalogContainer = document.getElementById('cars-catalog');
  const invoiceItemsContainer = document.getElementById('invoice-items');
  const subtotalEl = document.getElementById('subtotal-amount');
  const ivaEl = document.getElementById('iva-amount');
  const totalEl = document.getElementById('total-amount');
  const dateEl = document.getElementById('current-date');
  const clientEl = document.querySelector('.invoice-client strong');
  const invoiceNumEl = document.querySelector('.invoice-num');
  const generateBtn = document.getElementById('generate-invoice-btn');

  if (!carsCatalogContainer) return;

  const today = new Date();
  dateEl.textContent = today.toLocaleDateString('es-ES');

  const usuario = obtenerUsuario();
  if (clientEl && usuario) clientEl.textContent = usuario.nombre;

  function formatearPrecio(n) {
    return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function renderCatalog() {
    if (!autos.length) {
      carsCatalogContainer.innerHTML = `<p style="color:#94a3b8;">No hay vehículos disponibles.</p>`;
      return;
    }
    carsCatalogContainer.innerHTML = autos.map(car => {
      const enCarrito = cart.some(item => item.id === car.id);
      const sinStock = car.stock <= 0;
      return `
        <div class="car-shop-card">
          <div class="car-shop-thumb" ${car.imagen_url ? `style="background-image:url('${car.imagen_url}');background-size:cover;background-position:center;"` : ''}>
          </div>
          <div class="car-shop-info">
            <h3>${car.nombre}</h3>
            <p>${sinStock ? 'Agotado' : `Disponible · Stock: ${car.stock}`}</p>
          </div>
          <div class="car-shop-footer">
            <span class="car-shop-price">${formatearPrecio(car.precio)}</span>
            <button class="btn-add-cart ${enCarrito ? 'added' : ''}" ${sinStock ? 'disabled' : ''} onclick="toggleCarCart(${car.id})">
              ${enCarrito ? 'En la factura' : 'Agregar'}
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
        <td>${item.nombre}</td>
        <td>1</td>
        <td>${formatearPrecio(item.precio)}</td>
      </tr>
    `).join('');

    const subtotal = cart.reduce((acc, item) => acc + Number(item.precio), 0);
    const iva = subtotal * 0.13;
    const total = subtotal + iva;

    subtotalEl.textContent = formatearPrecio(subtotal);
    ivaEl.textContent = formatearPrecio(iva);
    totalEl.textContent = formatearPrecio(total);
  }

  async function cargarCatalogo() {
    try {
      autos = await api('/productos');
      renderCatalog();
    } catch (err) {
      carsCatalogContainer.innerHTML = `<p style="color:#ef4444;">No se pudo cargar el catálogo.</p>`;
    }
  }

  window.toggleCarCart = function (id) {
    const idx = cart.findIndex(item => item.id === id);
    if (idx > -1) {
      cart.splice(idx, 1);
    } else {
      const auto = autos.find(c => c.id === id);
      if (auto) cart.push(auto);
    }
    renderCatalog();
    renderInvoice();
  };

  generateBtn.addEventListener('click', async () => {
    if (cart.length === 0) {
      alert('Por favor selecciona al menos un vehículo para generar la factura.');
      return;
    }

    generateBtn.disabled = true;
    const textoOriginal = generateBtn.textContent;
    generateBtn.textContent = 'Generando...';

    try {
      const items = cart.map(item => ({ producto_id: item.id, cantidad: 1 }));
      const factura = await api('/facturas', { method: 'POST', body: { items } });

      if (invoiceNumEl) invoiceNumEl.textContent = `N.° ${factura.id.slice(0, 8)}`;
      alert(`¡Factura generada con éxito! Total: ${formatearPrecio(factura.total)}`);

      cart = [];
      await cargarCatalogo(); // vuelve a cargar: el stock ya bajó en el servidor
      renderInvoice();
    } catch (err) {
      alert(err.message || 'No se pudo generar la factura.');
    } finally {
      generateBtn.disabled = false;