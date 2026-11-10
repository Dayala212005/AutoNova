function initDashboard() {
  if (!exigirRol('vendedor', 'admin')) return;

  const productForm = document.getElementById('product-form');
  const productsList = document.querySelector('.products-list');
  const imageInput = document.getElementById('prod-image');
  const uploadText = document.getElementById('upload-text');

  if (!productForm || !productsList) return;

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

  function renderProducts(productos) {
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
        <span class="badge-active">Activo</span>
      </div>
    `).join('');
  }

  async function cargarMisProductos() {
    try {
      const productos = await api('/productos/mios');
      renderProducts(productos);
    } catch (err) {
      productsList.innerHTML = `<p style="color:#ef4444;">No se pudieron cargar tus vehículos.</p>`;
    }
  }

  cargarMisProductos();

  // Mostrar el nombre del archivo elegido
  if (imageInput && uploadText) {
    imageInput.addEventListener('change', () => {
      uploadText.textContent = imageInput.files[0]
        ? `✅ ${imageInput.files[0].name}`
        : '📁 Arrastra una foto aquí o haz clic para elegir un archivo';
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

    const submitBtn = productForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    const textoOriginal = submitBtn.textContent;
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

      await api('/productos', { method: 'POST', formData });

      productForm.reset();
      if (uploadText) uploadText.textContent = '📁 Arrastra una foto aquí o haz clic para elegir un archivo';
      alert('¡Vehículo publicado y agregado al inventario con éxito!');
      cargarMisProductos();
    } catch (err) {
      alert(err.message || 'No se pudo publicar el vehículo.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = textoOriginal;
    }
  });
}