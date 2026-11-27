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

function initComprador() {
  if (!exigirRol('comprador')) return;

  const tabCatalogoBtn = document.getElementById('tab-catalogo-btn');
  const tabFacturaBtn = document.getElementById('tab-factura-btn');
  const tabCatalogo = document.getElementById('tab-catalogo');
  const tabFactura = document.getElementById('tab-factura');

  const carsCatalogContainer = document.getElementById('cars-catalog');
  const invoiceItemsContainer = document.getElementById('invoice-items');
  const subtotalEl = document.getElementById('subtotal-amount');
  const ivaEl = document.getElementById('iva-amount');
  const totalEl = document.getElementById('total-amount');
  const dateEl = document.getElementById('current-date');
  const clientEl = document.querySelector('.invoice-client strong');
  const invoiceNumEl = document.querySelector('.invoice-num');
  const generateBtn = document.getElementById('generate-invoice-btn');

  const usuario = obtenerUsuario();
  if (clientEl && usuario) clientEl.textContent = usuario.nombre;

  const today = new Date();
  dateEl.textContent = today.toLocaleDateString('es-ES');

  function formatearPrecio(n) {
    return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function mostrarTab(nombre) {
    const esCatalogo = nombre === 'catalogo';
    tabCatalogo.style.display = esCatalogo ? 'block' : 'none';
    tabFactura.style.display = esCatalogo ? 'none' : 'block';
    tabCatalogoBtn.classList.toggle('active', esCatalogo);
    tabFacturaBtn.classList.toggle('active', !esCatalogo);
    if (!esCatalogo) renderInvoice();
  }

  tabCatalogoBtn.addEventListener('click', () => mostrarTab('catalogo'));
  tabFacturaBtn.addEventListener('click', () => mostrarTab('factura'));

  async function cargarCatalogo() {
    carsCatalogContainer.innerHTML = `<p style="color:#94a3b8;">Cargando...</p>`;
    try {
      const autos = await api('/productos');
      renderCatalog(autos);
    } catch (err) {
      carsCatalogContainer.innerHTML = `<p style="color:#ef4444;">No se pudo cargar el catálogo.</p>`;
    }
  }

  function renderCatalog(autos) {
    if (!autos.length) {
      carsCatalogContainer.innerHTML = `<p style="color:#94a3b8;">No hay vehículos disponibles.</p>`;
      return;
    }
    carsCatalogContainer.innerHTML = autos.map(car => {
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

  function renderInvoice() {
    const carrito = obtenerCarrito();

    if (carrito.length === 0) {
      invoiceItemsContainer.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #94a3b8; padding: 1.5rem 0;">No hay vehículos seleccionados</td></tr>`;
      subtotalEl.textContent = '$0.00';
      ivaEl.textContent = '$0.00';
      totalEl.textContent = '$0.00';
      return;
    }

    invoiceItemsContainer.innerHTML = carrito.map(item => `
      <tr>
        <td>${escapeHTML(item.nombre)}</td>
        <td>${escapeHTML(item.cantidad)}</td>
        <td>${formatearPrecio(item.precio * item.cantidad)}</td>
        <td><button class="btn btn-outline" onclick="quitarItemFactura(${Number(item.id)})">Quitar</button></td>
      </tr>
    `).join('');

    const subtotal = carrito.reduce((acc, item) => acc + Number(item.precio) * item.cantidad, 0);
    const iva = subtotal * 0.13;
    const total = subtotal + iva;

    subtotalEl.textContent = formatearPrecio(subtotal);
    ivaEl.textContent = formatearPrecio(iva);
    totalEl.textContent = formatearPrecio(total);
  }

  window.quitarItemFactura = function (id) {
    quitarDelCarrito(id);
    renderInvoice();
  };

  generateBtn.addEventListener('click', async () => {
    const carrito = obtenerCarrito();
    if (carrito.length === 0) {
      alert('Por favor selecciona al menos un vehículo para generar la factura.');
      return;
    }

    generateBtn.disabled = true;
    const textoOriginal = generateBtn.textContent;
    generateBtn.textContent = 'Generando...';

    try {
      const items = carrito.map(item => ({ producto_id: item.id, cantidad: item.cantidad }));
      const factura = await api('/facturas', { method: 'POST', body: { items } });

      if (invoiceNumEl) invoiceNumEl.textContent = `N.° ${factura.id.slice(0, 8)}`;


      vaciarCarrito();
      window.location.href = `factura.html?id=${factura.id}`;
      renderInvoice();
      cargarCatalogo();
    } catch (err) {
      alert(err.message || 'No se pudo generar la factura.');
    } finally {
      generateBtn.disabled = false;
      generateBtn.textContent = textoOriginal;
    }
  });

  mostrarTab('catalogo');
  cargarCatalogo();
  renderInvoice();
}