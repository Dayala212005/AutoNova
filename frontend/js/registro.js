function initRegister() {
  const registerForm = document.getElementById('register-form');

  if (!registerForm) return;

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const fullName = document.getElementById('fullname').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!fullName || !email || !password) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    submitBtn.disabled = true;
    const textoOriginal = submitBtn.textContent;
    submitBtn.textContent = 'Creando cuenta...';

    try {
      await api('/auth/register', {
        method: 'POST',
        body: { nombre: fullName, email, password },
      });

      alert(`¡Cuenta creada con éxito, ${fullName}! Ahora inicia sesión.`);
      window.location.href = 'login.html';
    } catch (err) {
      alert(err.message || 'No se pudo crear la cuenta.');
      submitBtn.disabled = false;
      submitBtn.textContent = textoOriginal;
    }
  });
}