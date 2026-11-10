function initLogin() {
  const loginForm = document.getElementById('login-form');
  const roleCards = document.querySelectorAll('.role-card');
  const submitBtn = document.getElementById('submit-btn');

  if (!loginForm) return;

  // true si entraron por el enlace "¿Eres administrador? Entra aquí"
  let modoAdmin = window.location.hash === '#admin';

  function actualizarBotonAdmin() {
    if (modoAdmin) {
      submitBtn.textContent = 'Ingresar como administrador';
      roleCards.forEach(c => c.classList.remove('active'));
    }
  }
  actualizarBotonAdmin();

  // Manejar interactividad visual de las tarjetas de rol
  roleCards.forEach(card => {
    card.addEventListener('click', () => {
      modoAdmin = false; // si elige una tarjeta, ya no es modo admin
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

  window.addEventListener('hashchange', () => {
    modoAdmin = window.location.hash === '#admin';
    actualizarBotonAdmin();
  });

  // Manejar envío del formulario
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const rolSeleccionado = modoAdmin
      ? 'admin'
      : document.querySelector('input[name="role"]:checked').value;
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      alert('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    submitBtn.disabled = true;
    const textoOriginal = submitBtn.textContent;
    submitBtn.textContent = 'Ingresando...';

    try {
      const datos = await api('/auth/login', {
        method: 'POST',
        body: { email, password, rol: rolSeleccionado },
      });

      guardarSesion(datos.token, datos.usuario);

      const paginas = {
        comprador: 'comprador.html',
        vendedor: 'vendedor.html',
        admin: 'admin.html',
      };
      window.location.href = paginas[datos.usuario.rol] || 'index.html';
    } catch (err) {
      alert(err.message || 'No se pudo iniciar sesión.');
      submitBtn.disabled = false;
      submitBtn.textContent = textoOriginal;
    }
  });
}