function renderFooter(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const year = new Date().getFullYear();

  container.innerHTML = `
    <footer class="site-footer" id="contacto">
      <div class="footer-main">
        <div class="footer-brand">
          <div class="footer-brand-name">Auto<span>Nova</span></div>
          <p class="footer-brand-desc">Vehículos seleccionados, financiamiento flexible y una experiencia de compra sin complicaciones.</p>
          <div class="footer-social">
            <a href="#" aria-label="Facebook">f</a>
            <a href="#" aria-label="Instagram">ig</a>
            <a href="#" aria-label="X">x</a>
          </div>
        </div>

        <div class="footer-col">
          <h4>Empresa</h4>
          <a href="index.html">Inicio</a>
          <a href="catalogo.html">Catálogo</a>
          <a href="#contacto">Contacto</a>
        </div>

        <div class="footer-col">
          <h4>Cuenta</h4>
          <a href="login.html">Iniciar sesión</a>
          <a href="registro.html">Registrarse</a>
          <a href="login.html#admin">Acceso administrador</a>
        </div>

        <div class="footer-col">
          <h4>Contacto</h4>
          <span>autonovasv@gmail.com</span>
          <span>+503 2200-0000</span>
          <span>San Salvador, El Salvador</span>
        </div>
      </div>

      <div class="footer-bottom">
        <span>© ${year} AutoNova · Sistema de Gestión Automotriz</span>
        <div class="footer-legal">
          <a href="#">Política de privacidad</a>
          <a href="#">Términos de uso</a>
        </div>
      </div>
    </footer>
  `;
}