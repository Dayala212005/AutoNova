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
  window.location.href = 'index.html';
}

async function api(ruta, { method = 'GET', body, formData } = {}) {
  const headers = {};
  const token = obtenerToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let cuerpo;
  if (formData) {
    cuerpo = formData; 
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    cuerpo = JSON.stringify(body);
  }

  const resp = await fetch(API + ruta, { method, headers, body: cuerpo });
  if (resp.status === 204) return null;

  const datos = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    if (resp.status === 401 && token && !ruta.startsWith('/auth/login')) cerrarSesion();
    throw new Error(datos.error || `Error ${resp.status}`);
  }
  return datos;
}
function exigirRol(...roles) {
  const u = obtenerUsuario();
  if (!obtenerToken() || !u || !roles.includes(u.rol)) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}


function obtenerCarrito() {
  try {
    return JSON.parse(localStorage.getItem('carrito')) || [];
  } catch (e) {
    return [];
  }
}

function guardarCarrito(carrito) {
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

function agregarAlCarrito(producto, cantidad = 1) {
  const carrito = obtenerCarrito();
  const existente = carrito.find(item => item.id === producto.id);

  if (existente) {
    existente.cantidad = Math.min(existente.cantidad + cantidad, producto.stock);
  } else {
    carrito.push({ ...producto, cantidad: Math.min(cantidad, producto.stock) });
  }

  guardarCarrito(carrito);
  return carrito;
}

function quitarDelCarrito(id) {
  const carrito = obtenerCarrito().filter(item => item.id !== id);
  guardarCarrito(carrito);
  return carrito;
}

function vaciarCarrito() {
  localStorage.removeItem('carrito');
}