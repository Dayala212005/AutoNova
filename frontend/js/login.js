function initLogin() {
  const loginForm = document.getElementById('login-form');
  const roleCards = document.querySelectorAll('.role-card');
  const submitBtn = document.getElementById('submit-btn');
  const sublink = document.querySelector('.auth-footer-sublink');

  if (!loginForm) return;

  let modoAdmin = window.location.hash === '#admin';

  function textoBotonNormal() {
    const seleccionado = document.querySelector('input[name="role"]:checked');
    return seleccionado && seleccionado.value === 'vendedor'
      ? 'Ingresar como vendedor'
      : 'Ingresar como comprador';
  }

  function actualizarModo() {
    roleCards.forEach(card => {
      const radio = card.querySelector('input[type="radio"]');
      card.classList.toggle('disabled', modoAdmin);
      if (radio) radio.disabled = modoAdmin;
      card.classList.toggle('active', !modoAdmin && !!radio && radio.checked);
    });

    submitBtn.textContent = modoAdmin ? 'Ingresar como administrador' : textoBotonNormal();

    if (sublink) {
      sublink.innerHTML = modoAdmin
        ? '¿No eres administrador? <a href="#">Volver</a>'
        : '¿Eres administrador? <a href="#admin">Entra aquí</a>';
    }
  }
  actualizarModo();

  roleCards.forEach(card => {
    card.addEventListener('click', () => {
      if (modoAdmin) return;

      roleCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      const radio = card.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
        submitBtn.textContent = radio.value === 'vendedor'
          ? 'Ingresar como vendedor'
          : 'Ingresar como comprador';
      }
    });
  });

  window.addEventListener('hashchange', () => {
    modoAdmin = window.location.hash === '#admin';
    actualizarModo();
  });

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