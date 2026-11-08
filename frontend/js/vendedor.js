function initDashboard() {
  const productForm = document.getElementById('product-form');
  const productsList = document.querySelector('.products-list');

  if (!productForm || !productsList) return;

  const myProducts = [
    { name: "Sedán compacto", price: "$18,500", stock: 4, color: "#fee2e2" },
    { name: "SUV familiar", price: "$26,900", stock: 2, color: "#ccfbf1" },
    { name: "Pickup 4x4", price: "$31,200", stock: 3, color: "#e0e7ff" },
    { name: "Pickup 4x4", price: "$31,200", stock: 3, color: "#e0e7ff" },
    { name: "Pickup 4x4", price: "$31,200", stock: 3, color: "#e0e7ff" },
    { name: "Pickup 4x4", price: "$31,200", stock: 3, color: "#e0e7ff" },
    { name: "Pickup 4x4", price: "$31,200", stock: 3, color: "#e0e7ff" }
  ];

  function renderProducts() {
    productsList.innerHTML = myProducts.map(prod => `
      <div class="product-item">
        <div class="product-item-info">
          <div class="product-item-thumb" style="background-color: ${prod.color};"></div>
          <div>
            <h4>${prod.name}</h4>
            <span>${prod.price} · Stock ${prod.stock}</span>
          </div>
        </div>
        <span class="badge-active">Activo</span>
      </div>
    `).join('');
  }

 
  renderProducts();

  productForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('prod-name').value.trim();
    const priceInput = document.getElementById('prod-price').value.trim();
    const stockInput = document.getElementById('prod-stock').value.trim();

    if (!nameInput || !priceInput || !stockInput) {
      alert('Por favor, completa los campos requeridos.');
      return;
    }

    const formattedPrice = priceInput.startsWith('$') ? priceInput : `$${priceInput}`;

    const colors = ["#e0e7ff", "#fee2e2", "#ccfbf1", "#fef3c7", "#f3e8ff"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newProduct = {
      name: nameInput,
      price: formattedPrice,
      stock: parseInt(stockInput),
      color: randomColor
    };

    myProducts.unshift(newProduct);
    renderProducts();

    productForm.reset();
    alert('¡Vehículo publicado y agregado al inventario con éxito!');
  });
}