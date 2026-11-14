function renderNavbar(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const usuario = (typeof obtenerUsuario === 'function') ? obtenerUsuario() : null;

  const paneles = { comprador: 'comprador.html', vendedor: 'vendedor.html', admin: 'admin.html' };
  const nombresPanel = { comprador: 'Mi carrito', vendedor: 'Vendedor', admin: 'Administrador' };

    const logoHtml = `
    <img src="assets/img/logo.png" alt="AutoNova" class="navbar-logo-icon">
    <div class="navbar-brand-text">
      <span class="brand-name">Auto<span>Nova</span></span>
      <span class="brand-tag">Agencia de Automóviles</span>
    </div>
  `;

  let enlacesMenu;
  let acciones;

  if (usuario) {
    enlacesMenu = `<li><a href="${paneles[usuario.rol] || 'index.html'}">${nombresPanel[usuario.rol] || 'Mi panel'}</a></li>`;
    acciones = `
      <span class="btn-nav btn-register" style="cursor:default; border-color: rgba(255,255,255,0.2);">Hola, ${usuario.nombre}</span>
      <a href="#" class="btn-nav btn-login" id="nav-logout">Cerrar sesión</a>
    `;
  } else {
    enlacesMenu = `
      <li><a href="index.html">Inicio</a></li>
      <li><a href="catalogo.html">Catálogo</a></li>
      <li><a href="#contacto">Contacto</a></li>
    `;
    acciones = `
      <a href="login.html" class="btn-nav btn-login">Iniciar sesión</a>
      <a href="registro.html" class="btn-nav btn-register">Registrarse</a>
    `;
  }

  container.innerHTML = `
    <nav class="navbar">
      <div class="navbar-brand">
        <a href="${usuario ? (paneles[usuario.rol] || 'index.html') : 'index.html'}">${logoHtml}</a>
      </div>
      <ul class="navbar-nav">${enlacesMenu}</ul>
      <div class="navbar-actions">${acciones}</div>
    </nav>
  `;

  const logoutBtn = document.getElementById('nav-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof vaciarCarrito === 'function') vaciarCarrito();
      cerrarSesion();
    });
  }
}