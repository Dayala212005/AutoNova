function initDashboard() {
  if (!exigirRol('vendedor', 'admin')) return;

  const productForm = document.getElementById('product-form');
  const productsList = document.querySelector('.products-list');
  const imageInput = document.getElementById('prod-image');
  const uploadText = document.getElementById('upload-text');

  if (!productForm || !productsList) return;

  const textoSubidaDefault = 'Arrastra una foto aquí o haz clic para elegir un archivo';
  const submitBtn = productForm.querySelector('button[type="submit"]');
  const textoGuardar = submitBtn.textContent;

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn btn-outline';
  cancelBtn.textContent = 'Cancelar edición';
  cancelBtn.style.cssText = 'display:none; width:100%; margin-top:0.75rem;';
  submitBtn.insertAdjacentElement('afterend', cancelBtn);

  let productos = [];
  let editandoId = null;

  const colores = ["#e0e7ff", "#fee2e2", "#ccfbf1", "#fef3c7", "#f3e8ff"];
  function colorPara(id) {
    return colores[id % colores.length];
  }

  function formatearPrecio(precio) {
    return Number(precio).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    });
  }

  function renderProducts() {
    if (!productos.length) {
      productsList.innerHTML = `<p style="color:#94a3b8;">Todavía no has publicado vehículos.</p>`;
      return;
    }
    productsList.innerHTML = productos.map(prod => `
      <div class="product-item">
        <div class="product-item-info">
          <div class="product-item-thumb" style="background-color: ${colorPara(prod.id)};${prod.imagen_url ? `background-image:url('${prod.imagen_url}');background-size:cover;background-position:center;` : ''}"></div>
          <div>
            <h4>${prod.nombre}</h4>
            <span>${formatearPrecio(prod.precio)} · Stock ${prod.stock}</span>
          </div>
        </div>
        <div class="product-item-actions">
          <span class="badge-active">Activo</span>
          <button type="button" class="btn-mini" data-action="editar" data-id="${prod.id}">Editar</button>
          <button type="button" class="btn-mini danger" data-action="eliminar" data-id="${prod.id}">Eliminar</button>
        </div>
      </div>
    `).join('');
  }

  async function cargarMisProductos() {
    try {
      productos = await api('/productos/mios');
      renderProducts();
    } catch (err) {
      productsList.innerHTML = `<p style="color:#ef4444;">No se pudieron cargar tus vehículos.</p>`;
    }
  }

  function salirDeEdicion() {
    editandoId = null;
    productForm.reset();
    if (uploadText) uploadText.textContent = textoSubidaDefault;
    submitBtn.textContent = textoGuardar;
    cancelBtn.style.display = 'none';
  }

  function entrarEnEdicion(prod) {
    editandoId = prod.id;
    document.getElementById('prod-name').value = prod.nombre;
    document.getElementById('prod-desc').value = prod.descripcion || '';
    document.getElementById('prod-price').value = prod.precio;
    document.getElementById('prod-stock').value = prod.stock;
    if (imageInput) imageInput.value = '';
    if (uploadText) uploadText.textContent = 'Elige una foto nueva solo si quieres cambiarla';
    submitBtn.textContent = 'Guardar cambios';
    cancelBtn.style.display = 'block';
    productForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  cancelBtn.addEventListener('click', salirDeEdicion);

  productsList.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = Number(btn.dataset.id);

    if (btn.dataset.action === 'editar') {
      const prod = productos.find(p => p.id === id);
      if (prod) entrarEnEdicion(prod);
    }

    if (btn.dataset.action === 'eliminar') {
      if (!confirm('¿Eliminar este vehículo?')) return;
      try {
        await api(`/productos/${id}`, { method: 'DELETE' });
        if (editandoId === id) salirDeEdicion();
        cargarMisProductos();
      } catch (err) {
        alert(err.message || 'No se pudo eliminar el vehículo.');
      }
    }
  });

  cargarMisProductos();

  if (imageInput && uploadText) {
    imageInput.addEventListener('change', () => {
      uploadText.textContent = imageInput.files[0]
        ? `✅ ${imageInput.files[0].name}`
        : (editandoId !== null ? 'Elige una foto nueva solo si quieres cambiarla' : textoSubidaDefault);
    });
  }

  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('prod-name').value.trim();
    const descripcion = document.getElementById('prod-desc').value.trim();
    const precio = document.getElementById('prod-price').value.trim();
    const stock = document.getElementById('prod-stock').value.trim();

    if (!nombre || !precio || !stock) {
      alert('Por favor, completa los campos requeridos.');
      return;
    }

    const esEdicion = editandoId !== null;
    submitBtn.disabled = true;
    const textoActual = submitBtn.textContent;
    submitBtn.textContent = 'Guardando...';

    try {
      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('descripcion', descripcion);
      formData.append('precio', precio);
      formData.append('stock', stock);
      if (imageInput && imageInput.files[0]) {
        formData.append('imagen', imageInput.files[0]);
      }

      if (esEdicion) {
        await api(`/productos/${editandoId}`, { method: 'PUT', formData });
      } else {
        await api('/productos', { method: 'POST', formData });
      }

      salirDeEdicion();
      alert(esEdicion
        ? '¡Vehículo actualizado con éxito!'
        : '¡Vehículo publicado y agregado al inventario con éxito!');
      cargarMisProductos();
    } catch (err) {
      alert(err.message || 'No se pudo guardar el vehículo.');
      submitBtn.textContent = textoActual;
    } finally {
      submitBtn.disabled = false;
    }
  });
}