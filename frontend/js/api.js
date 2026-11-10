const API = '/api';

function guardarSesion(token, usuario) {
  localStorage.setItem('token', token);
  localStorage.setItem('usuario', JSON.stringify(usuario));
}

function obtenerToken() {
  return localStorage.getItem('token');
}

function obtenerUsuario() {
  try {
    return JSON.parse(localStorage.getItem('usuario'));
  } catch (e) {
    return null;
  }
}

function cerrarSesion() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = 'login.html';
}

async function api(ruta, { method = 'GET', body, formData } = {}) {
  const headers = {};
  const token = obtenerToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let cuerpo;
  if (formData) {
    cuerpo = formData; // el navegador pone el Content-Type correcto solo
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    cuerpo = JSON.stringify(body);
  }

  const resp = await fetch(API + ruta, { method, headers, body: cuerpo });
  if (resp.status === 204) return null;

  const datos = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    // token vencido o inválido: volver al login
    if (resp.status === 401 && token && !ruta.startsWith('/auth/login')) cerrarSesion();
    throw new Error(datos.error || `Error ${resp.status}`);
  }
  return datos;
}

// Protege una página: si no hay sesión o el rol no sirve, manda al login
function exigirRol(...roles) {
  const u = obtenerUsuario();
  if (!obtenerToken() || !u || !roles.includes(u.rol)) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}