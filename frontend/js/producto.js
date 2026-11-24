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

function initProducto() {
  const contenedor = document.getElementById('producto-detalle');
  if (!contenedor) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    contenedor.innerHTML = `<p style="text-align:center; color:#ef4444; padding:3rem 0;">No se indicó ningún vehículo.</p>`;
    return;
  }

  function formatearPrecio(n) {
    return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  async function cargarProducto() {
    contenedor.innerHTML = `<p style="text-align:center; padding:3rem 0;">Cargando...</p>`;
    try {
      const car = await api(`/productos/${encodeURIComponent(id)}`);
      renderProducto(car);
    } catch (err) {
      contenedor.innerHTML = `<p style="text-align:center; color:#ef4444; padding:3rem 0;">No se encontró el vehículo.</p>`;
    }
  }

  function renderProducto(car) {
    const sinStock = car.stock <= 0;
    const usuario = obtenerUsuario();
    const esComprador = usuario && usuario.rol === 'comprador';
    const puedeComprar = esComprador && !sinStock;
    const rutaVolver = esComprador ? 'comprador.html' : 'catalogo.html';

    let textoBoton = 'Comprar';
    if (sinStock) textoBoton = 'Agotado';
    else if (usuario && !esComprador) textoBoton = 'Solo compradores pueden comprar';

    let claseBadge = 'pd-badge-ok';
    let textoBadge = 'Disponible';
    if (sinStock) { claseBadge = 'pd-badge-out'; textoBadge = 'Agotado'; }
    else if (car.stock <= 3) { claseBadge = 'pd-badge-low'; textoBadge = 'Pocas unidades'; }

    const estiloImagen = urlSegura(car.imagen_url)
      ? `background-image:url('${urlSegura(car.imagen_url)}');`
      : 'background-color:#eef0f4;';

    const botonDeshabilitado = sinStock || (usuario && !esComprador);

    contenedor.innerHTML = `
      <div class="pd-wrap">
        <a href="${rutaVolver}" class="pd-back">&#8592; Volver al catálogo</a>

        <div class="pd-grid">
          <div class="pd-gallery">
            <div class="pd-image" style="${estiloImagen}"></div>
          </div>

          <div class="pd-info">
            <span class="pd-badge ${claseBadge}">${textoBadge}</span>
            <h1 class="pd-title">${escapeHTML(car.nombre)}</h1>
            <p class="pd-price">${formatearPrecio(car.precio)}</p>
            <p class="pd-desc">${escapeHTML(car.descripcion || 'Sin descripción disponible.')}</p>

            <div class="pd-meta">
              <div class="pd-meta-item">
                <span class="pd-meta-label">Disponibilidad</span>
                <span class="pd-meta-value">${sinStock ? 'Agotado' : 'En stock'}</span>
              </div>
              <div class="pd-meta-item">
                <span class="pd-meta-label">Unidades</span>
                <span class="pd-meta-value">${sinStock ? '0' : escapeHTML(car.stock)}</span>
              </div>
            </div>

            ${puedeComprar ? `
              <div class="pd-qty-block">
                <span class="pd-meta-label">Cantidad</span>
                <div class="pd-qty-row">
                  <div class="pd-stepper">
                    <button type="button" id="btn-menos" aria-label="Menos">&minus;</button>
                    <input type="number" id="cantidad-input" value="1" min="1" max="${escapeHTML(car.stock)}">
                    <button type="button" id="btn-mas" aria-label="Más">+</button>
                  </div>
                  <div class="pd-total">
                    <span class="pd-meta-label">Total estimado</span>
                    <strong id="pd-total-valor">${formatearPrecio(car.precio)}</strong>
                  </div>
                </div>
                <span id="cantidad-error" class="pd-error"></span>
              </div>
            ` : ''}

            <button id="btn-comprar" class="pd-btn" ${botonDeshabilitado ? 'disabled' : ''}>
              ${textoBoton}
            </button>

            <ul class="pd-perks">
              <li>Vehículos seleccionados</li>
              <li>Financiamiento flexible</li>
              <li>Factura en minutos</li>
            </ul>
          </div>
        </div>
      </div>
    `;

    const btnComprar = document.getElementById('btn-comprar');

    if (puedeComprar) {
      const input = document.getElementById('cantidad-input');
      const btnMenos = document.getElementById('btn-menos');
      const btnMas = document.getElementById('btn-mas');
      const errorEl = document.getElementById('cantidad-error');
      const totalEl = document.getElementById('pd-total-valor');

      function validarCantidad() {
        let valor = parseInt(input.value, 10);
        if (isNaN(valor) || valor < 1) valor = 1;
        if (valor > car.stock) {
          valor = car.stock;
          errorEl.textContent = `Solo hay ${car.stock} disponibles.`;
        } else {
          errorEl.textContent = '';
        }
        input.value = valor;
        totalEl.textContent = formatearPrecio(car.precio * valor);
      }

      btnMenos.addEventListener('click', () => {
        input.value = parseInt(input.value, 10) - 1;
        validarCantidad();
      });
      btnMas.addEventListener('click', () => {
        input.value = parseInt(input.value, 10) + 1;
        validarCantidad();
      });
      input.addEventListener('input', validarCantidad);

      btnComprar.addEventListener('click', () => {
        const cantidad = parseInt(input.value, 10);
        if (cantidad > car.stock) return;
        agregarAlCarrito(car, cantidad);
        window.location.href = 'comprador.html';
      });
    } else if (!usuario && !sinStock) {
      btnComprar.addEventListener('click', () => {
        window.location.href = 'login.html';
      });
    }
  }

  cargarProducto();
}