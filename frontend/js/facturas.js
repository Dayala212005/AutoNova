function initFacturas() {
    if (!exigirRol('comprador')) return;

    const lista = document.getElementById('facturas-lista');

    function formatearPrecio(n) {
        return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    async function cargar() {
        lista.innerHTML = `<p style="text-align:center; padding:2rem 0;">Cargando...</p>`;
        try {
            const facturas = await api('/facturas');

            if (!facturas.length) {
                lista.innerHTML = `<p style="text-align:center; color:#94a3b8; padding:2rem 0;">Aún no tienes facturas.</p>`;
                return;
            }

            lista.innerHTML = `
        <table class="fx-table">
          <thead>
            <tr>
              <th>N.°</th>
              <th>Fecha</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${facturas.map(f => `
              <tr>
                <td class="fx-id">${f.id.slice(0, 8)}</td>
                <td>${new Date(f.creada_en).toLocaleString('es-ES')}</td>
                <td><strong>${formatearPrecio(f.total)}</strong></td>
                <td><a href="factura.html?id=${f.id}" class="btn btn-outline">Ver detalle</a></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
        } catch (err) {
            lista.innerHTML = `<p style="text-align:center; color:#ef4444; padding:2rem 0;">No se pudieron cargar las facturas.</p>`;
        }
    }

    cargar();
}