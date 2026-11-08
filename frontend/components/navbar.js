function renderNavbar(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

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
        <a href="login.html" class="btn-nav btn-login">Iniciar sesión</a>
        <a href="registro.html" class="btn-nav btn-register">Registrarse</a>
      </div>
    </nav>
  `;
}