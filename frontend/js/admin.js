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

function initAdmin() {
  if (!exigirRol('admin')) return;

  const userForm = document.getElementById('user-form');
  const usersList = document.getElementById('users-list');
  const productsList = document.getElementById('admin-products-list');

  const editCard = document.getElementById('product-edit-card');
  const editForm = document.getElementById('product-edit-form');
  const editCancel = document.getElementById('edit-cancel');
  const editImage = document.getElementById('edit-image');

  let productos = [];
  let editandoId = null;

  function formatearPrecio(n) {
    return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  async function cargarUsuarios() {
    try {
      const usuarios = await api('/usuarios');
      if (!usuarios.length) {
        usersList.innerHTML = `<p style="color:#94a3b8;">No hay usuarios.</p>`;
        return;
      }
      usersList.innerHTML = usuarios.map(u => `
        <div class="product-item">
          <div class="product-item-info">
            <div>
              <h4>${escapeHTML(u.nombre)}</h4>
              <span>${escapeHTML(u.email)} · ${escapeHTML(u.rol)}</span>
            </div>
          </div>
          <button class="btn btn-outline" onclick="eliminarUsuario(${Number(u.id)})">Eliminar</button>
        </div>
      `).join('');
    } catch (err) {
      usersList.innerHTML = `<p style="color:#ef4444;">No se pudieron cargar los usuarios.</p>`;
    }
  }

  window.eliminarUsuario = async function (id) {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
      await api(`/usuarios/${id}`, { method: 'DELETE' });
      cargarUsuarios();
    } catch (err) {
      alert(err.message || 'No se pudo eliminar el usuario.');
    }
  };

  userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = userForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      await api('/usuarios', {
        method: 'POST',
        body: {
          nombre: document.getElementById('user-name').value.trim(),
          email: document.getElementById('user-email').value.trim(),
          password: document.getElementById('user-password').value,
          rol: document.getElementById('user-role').value,
        },
      });
      userForm.reset();
      alert('Usuario creado con éxito.');
      cargarUsuarios();
    } catch (err) {
      alert(err.message || 'No se pudo crear el usuario.');
    } finally {
      submitBtn.disabled = false;
    }
  });

  function renderProductos() {
    if (!productos.length) {
      productsList.innerHTML = `<p style="color:#94a3b8;">No hay productos.</p>`;
      return;
    }
    productsList.innerHTML = productos.map(p => `
      <div class="product-item">
        <div class="product-item-info">
          <div>
            <h4>${escapeHTML(p.nombre)}</h4>
            <span>${formatearPrecio(p.precio)} · Stock ${escapeHTML(p.stock)}</span>
          </div>
        </div>
        <div class="product-item-actions">
          <button type="button" class="btn-mini" data-action="editar" data-id="${escapeHTML(p.id)}">Editar</button>
          <button type="button" class="btn-mini danger" data-action="eliminar" data-id="${escapeHTML(p.id)}">Eliminar</button>
        </div>
      </div>
    `).join('');
  }

  async function cargarProductos() {
    try {
      productos = await api('/productos');
      renderProductos();
    } catch (err) {
      productsList.innerHTML = `<p style="color:#ef4444;">No se pudieron cargar los productos.</p>`;
    }
  }

  function cerrarEdicion() {
    editandoId = null;
    editForm.reset();
    editCard.style.display = 'none';
  }

  function abrirEdicion(p) {
    editandoId = p.id;
    document.getElementById('edit-name').value = p.nombre;
    document.getElementById('edit-desc').value = p.descripcion || '';
    document.getElementById('edit-price').value = p.precio;
    document.getElementById('edit-stock').value = p.stock;
    if (editImage) editImage.value = '';
    editCard.style.display = 'block';
    editCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  productsList.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = Number(btn.dataset.id);

    if (btn.dataset.action === 'editar') {
      const p = productos.find(x => x.id === id);
      if (p) abrirEdicion(p);
    }

    if (btn.dataset.action === 'eliminar') {
      if (!confirm('¿Eliminar este producto?')) return;
      try {
        await api(`/productos/${id}`, { method: 'DELETE' });
        if (editandoId === id) cerrarEdicion();
        cargarProductos();
      } catch (err) {
        alert(err.message || 'No se pudo eliminar el producto.');
      }
    }
  });

  editCancel.addEventListener('click', cerrarEdicion);

  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (editandoId === null) return;

    const submitBtn = editForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    const textoOriginal = submitBtn.textContent;
    submitBtn.textContent = 'Guardando...';

    try {
      const formData = new FormData();
      formData.append('nombre', document.getElementById('edit-name').value.trim());
      formData.append('descripcion', document.getElementById('edit-desc').value.trim());
      formData.append('precio', document.getElementById('edit-price').value.trim());
      formData.append('stock', document.getElementById('edit-stock').value.trim());
      if (editImage && editImage.files[0]) {
        formData.append('imagen', editImage.files[0]);
      }

      await api(`/productos/${editandoId}`, { method: 'PUT', formData });

      cerrarEdicion();
      alert('Producto actualizado con éxito.');
      cargarProductos();
    } catch (err) {
      alert(err.message || 'No se pudo actualizar el producto.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = textoOriginal;
    }
  });

  cargarUsuarios();
  cargarProductos();
}