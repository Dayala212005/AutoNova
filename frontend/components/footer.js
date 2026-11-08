function renderFooter(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <footer class="footer" id="contacto">
      <div>AutoNova - Ventas de automóviles</div>
      <div>Contacto: contacto@autonova.com | +503 2200-0000</div>
    </footer>
  `;
}