function initAdmin() {
  if (!exigirRol('admin')) return;

  const userForm = document.getElementById('user-form');
  const usersList = document.getElementById('users-list');
  const productsList = document.getElementById('admin-products-list');

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
              <h4>${u.nombre}</h4>
              <span>${u.email} · ${u.rol}</span>
            </div>
          </div>
          <button class="btn btn-outline" onclick="eliminarUsuario(${u.id})">Eliminar</button>
        </div>
      `).join('');
    } catch (err) {
      usersList.innerHTML = `<p style="color:#ef4444;">No se pudieron cargar los usuarios.</p>`;
    }
  }

  async function cargarProductos() {
    try {
      const productos = await api('/productos');
      if (!productos.length) {
        productsList.innerHTML = `<p style="color:#94a3b8;">No hay productos.</p>`;
        return;
      }
      productsList.innerHTML = productos.map(p => `
        <div class="product-item">
          <div class="product-item-info">
            <div>
              <h4>${p.nombre}</h4>
              <span>${formatearPrecio(p.precio)} · Stock ${p.stock}</span>
            </div>
          </div>
          <button class="btn btn-outline" onclick="eliminarProducto(${p.id})">Eliminar</button>
        </div>
      `).join('');
    } catch (err) {
      productsList.innerHTML = `<p style="color:#ef4444;">No se pudieron cargar los productos.</p>`;
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

  window.eliminarProducto = async function (id) {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await api(`/productos/${id}`, { method: 'DELETE' });
      cargarProductos();
    } catch (err) {
      alert(err.message || 'No se pudo eliminar el producto.');
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

  cargarUsuarios();
  cargarProductos();
}