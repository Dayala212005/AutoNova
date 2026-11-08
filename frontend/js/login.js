function initLogin() {
  const loginForm = document.getElementById('login-form');
  const roleCards = document.querySelectorAll('.role-card');
  const submitBtn = document.getElementById('submit-btn');

  if (!loginForm) return;

  roleCards.forEach(card => {
    card.addEventListener('click', () => {
      roleCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      
      const radio = card.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
        if (radio.value === 'vendedor') {
          submitBtn.textContent = 'Ingresar como vendedor';
        } else {
          submitBtn.textContent = 'Ingresar como comprador';
        }
      }
    });
  });

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const selectedRole = document.querySelector('input[name="role"]:checked').value;
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      alert('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    if (selectedRole === 'vendedor') {
      window.location.href = 'vendedor.html';
    } else {
      window.location.href = 'index.html';
    }
  });
}