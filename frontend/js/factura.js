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
// -------------------------------------------------------------------------

function initFactura() {
    if (!obtenerToken()) {
        window.location.href = 'login.html';
        return;
    }

    const contenedor = document.getElementById('factura-detalle');
    const id = new URLSearchParams(window.location.search).get('id');

    if (!id) {
        contenedor.innerHTML = `<p style="text-align:center; color:#ef4444; padding:3rem 0;">No se indicó ninguna factura.</p>`;
        return;
    }

    function formatearPrecio(n) {
        return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    async function cargar() {
        contenedor.innerHTML = `<p style="text-align:center; padding:3rem 0;">Cargando...</p>`;
        try {
            const f = await api(`/facturas/${encodeURIComponent(id)}`);
            render(f);
        } catch (err) {
            contenedor.innerHTML = `
        <p style="text-align:center; color:#ef4444; padding:3rem 0;">${escapeHTML(err.message || 'No se encontró la factura.')}</p>
        <p style="text-align:center;"><a href="facturas.html" class="btn btn-outline">&#8592; Mis facturas</a></p>`;
        }
    }

    function render(f) {
        contenedor.innerHTML = `
      <div class="fx-top fx-actions">
        <a href="facturas.html" class="btn btn-outline">&#8592; Mis facturas</a>
        <button type="button" class="btn btn-outline" onclick="window.print()">Imprimir</button>
      </div>

      <div class="fx-card">
        <div class="fx-head">
          <div>
            <h1 class="fx-title">Factura</h1>
            <p class="fx-id-full">N.° ${escapeHTML(f.id)}</p>
          </div>
          <div class="fx-date">${new Date(f.creada_en).toLocaleString('es-ES')}</div>
        </div>

        <div class="fx-meta">
          <div class="fx-meta-item">
            <span class="fx-meta-label">Cliente</span>
            <span class="fx-meta-value">${escapeHTML(f.cliente)}</span>
          </div>
          <div class="fx-meta-item">
            <span class="fx-meta-label">Correo</span>
            <span class="fx-meta-value">${escapeHTML(f.cliente_email)}</span>
          </div>
        </div>

        <table class="fx-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cant.</th>
              <th>Precio unit.</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${f.detalle.map(d => `
              <tr>
                <td>${escapeHTML(d.nombre)}</td>
                <td>${escapeHTML(d.cantidad)}</td>
                <td>${formatearPrecio(d.precio_unitario)}</td>
                <td>${formatearPrecio(Number(d.precio_unitario) * d.cantidad)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="fx-totals">
          <div class="fx-total-row"><span>Subtotal</span><span>${formatearPrecio(f.subtotal)}</span></div>
          <div class="fx-total-row"><span>IVA 13%</span><span>${formatearPrecio(f.iva)}</span></div>
          <div class="fx-total-row final"><span>Total</span><span>${formatearPrecio(f.total)}</span></div>
        </div>
      </div>
    `;
    }

    cargar();
}