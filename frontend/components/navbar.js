function renderNavbar(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const usuario = (typeof obtenerUsuario === 'function') ? obtenerUsuario() : null;

  const paneles = {
    comprador: 'comprador.html',
    vendedor: 'vendedor.html',
    admin: 'admin.html',
  };

  const accionesSesion = usuario
    ? `
      <a href="${paneles[usuario.rol] || 'index.html'}" class="btn-nav btn-login">Hola, ${usuario.nombre}</a>
      <a href="#" class="btn-nav btn-register" id="nav-logout">Cerrar sesión</a>
    `
    : `
      <a href="login.html" class="btn-nav btn-login">Iniciar sesión</a>
      <a href="registro.html" class="btn-nav btn-register">Registrarse</a>
    `;

  container.innerHTML = `
    <nav class="navbar">
      <div class="navbar-brand">
        <a href="index.html" style="color: white; text-decoration: none;">🟡 AutoNova</a>
      </div>
      <ul class="navbar-nav">
        <li><a href="index.html">Inicio</a></li>
        <li><a href="index.html#catalog">Catálogo</a></li>
        <li><a href="#contacto">Contacto</a></li>
      </ul>
      <div class="navbar-actions">
        ${accionesSesion}
      </div>
    </nav>
  `;

  const logoutBtn = document.getElementById('nav-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      cerrarSesion();
    });
  }
}