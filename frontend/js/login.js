function initLogin() {
  const loginForm = document.getElementById('login-form');
  const roleCards = document.querySelectorAll('.role-card');
  const submitBtn = document.getElementById('submit-btn');

  if (!loginForm) return;

  // Manejar interactividad visual de las tarjetas de rol
  roleCards.forEach(card => {
    card.addEventListener('click', () => {
      roleCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      
      const radio = card.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
        // Cambiar texto del botón según el rol seleccionado
        if (radio.value === 'vendedor') {
          submitBtn.textContent = 'Ingresar como vendedor';
        } else {
          submitBtn.textContent = 'Ingresar como comprador';
        }
      }
    });
  });

  // Manejar envío del formulario
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const selectedRole = document.querySelector('input[name="role"]:checked').value;
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      alert('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    console.log('Iniciando sesión:', { role: selectedRole, email });
    alert(`¡Bienvenido de nuevo! Has iniciado sesión como ${selectedRole.toUpperCase()}.`);
    
    // Redirección al index o panel correspondiente
    window.location.href = 'index.html';
  });
}