function initRegister() {
  const registerForm = document.getElementById('register-form');

  if (!registerForm) return;

  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const fullName = document.getElementById('fullname').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!fullName || !email || !password) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    // Simulación de registro exitoso 
    console.log('Registrando usuario:', { fullName, email });
    alert(`¡Cuenta creada con éxito, ${fullName}! Redirigiendo al inicio de sesión...`);
    
    window.location.href = 'login.html';
  });
}