const state = {
  products: [],
  cart: new Map(),
  lastSale: null,
  lastReport: null
};

const els = {
  tabs: document.querySelectorAll('.tab'),
  views: document.querySelectorAll('.view'),
  scanInput: document.querySelector('#scanInput'),
  searchResults: document.querySelector('#searchResults'),
  cartItems: document.querySelector('#cartItems'),
  cartTotal: document.querySelector('#cartTotal'),
  checkoutButton: document.querySelector('#checkoutButton'),
  clearCartButton: document.querySelector('#clearCartButton'),
  productList: document.querySelector('#productList'),
  productManagerList: document.querySelector('#productManagerList'),
  productSearchInput: document.querySelector('#productSearchInput'),
  salesList: document.querySelector('#salesList'),
  todayTotal: document.querySelector('#todayTotal'),
  todayCount: document.querySelector('#todayCount'),
  lowStock: document.querySelector('#lowStock'),
  pendingSync: document.querySelector('#pendingSync'),
  connectionDot: document.querySelector('#connectionDot'),
  connectionText: document.querySelector('#connectionText'),
  productDialog: document.querySelector('#productDialog'),
  productForm: document.querySelector('#productForm'),
  productDialogTitle: document.querySelector('#productDialogTitle'),
  productId: document.querySelector('#productId'),
  productImageValue: document.querySelector('#productImageValue'),
  productImagePreview: document.querySelector('#productImagePreview'),
  productImageInput: document.querySelector('#productImageInput'),
  removeProductImage: document.querySelector('#removeProductImage'),
  productName: document.querySelector('#productName'),
  productBarcode: document.querySelector('#productBarcode'),
  productSku: document.querySelector('#productSku'),
  productSalePrice: document.querySelector('#productSalePrice'),
  productCostPrice: document.querySelector('#productCostPrice'),
  productStock: document.querySelector('#productStock'),
  productMinStock: document.querySelector('#productMinStock'),
  productDescription: document.querySelector('#productDescription'),
  productActive: document.querySelector('#productActive'),
  newProductButton: document.querySelector('#newProductButton'),
  closeProductDialog: document.querySelector('#closeProductDialog'),
  receiptDialog: document.querySelector('#receiptDialog'),
  receiptContent: document.querySelector('#receiptContent'),
  printReceiptButton: document.querySelector('#printReceiptButton'),
  closeReceiptButton: document.querySelector('#closeReceiptButton'),
  reportFrom: document.querySelector('#reportFrom'),
  reportTo: document.querySelector('#reportTo'),
  loadReportsButton: document.querySelector('#loadReportsButton'),
  exportSalesButton: document.querySelector('#exportSalesButton'),
  reportRevenue: document.querySelector('#reportRevenue'),
  reportProfit: document.querySelector('#reportProfit'),
  reportMargin: document.querySelector('#reportMargin'),
  reportUnits: document.querySelector('#reportUnits'),
  bestSellersList: document.querySelector('#bestSellersList'),
  lowStockList: document.querySelector('#lowStockList'),
  reportSalesList: document.querySelector('#reportSalesList'),
  toast: document.querySelector('#toast')
};

boot();

function boot() {
  setDefaultReportDates();
  bindEvents();
  refreshAll();
  setInterval(refreshSummary, 15000);
  els.scanInput.focus();
}

function bindEvents() {
  els.tabs.forEach((tab) => {
    tab.addEventListener('click', () => showView(tab.dataset.view));
  });
  els.scanInput.addEventListener('input', debounce(handleSearch, 140));
  els.scanInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addBestMatch();
    }
  });
  els.productSearchInput.addEventListener('input', debounce(() => loadProducts(els.productSearchInput.value.trim()), 180));
  els.checkoutButton.addEventListener('click', checkout);
  els.clearCartButton.addEventListener('click', () => {
    state.cart.clear();
    renderCart();
    els.scanInput.focus();
  });
  els.newProductButton.addEventListener('click', () => openProductDialog());
  els.closeProductDialog.addEventListener('click', () => els.productDialog.close());
  els.productForm.addEventListener('submit', saveProduct);
  els.productImageInput.addEventListener('change', handleImageInput);
  els.removeProductImage.addEventListener('click', () => setProductImage(null));
  els.printReceiptButton.addEventListener('click', () => window.print());
  els.closeReceiptButton.addEventListener('click', () => {
    els.receiptDialog.close();
    els.scanInput.focus();
  });
  els.loadReportsButton.addEventListener('click', loadReports);
  els.exportSalesButton.addEventListener('click', exportReportSales);
}

async function refreshAll() {
  await Promise.all([loadProducts(), refreshSummary(), loadSales(), checkHealth(), loadReports()]);
}

function showView(viewId) {
  els.tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.view === viewId));
  els.views.forEach((view) => view.classList.toggle('active', view.id === viewId));
  if (viewId === 'posView') els.scanInput.focus();
  if (viewId === 'reportsView') loadReports();
}

async function checkHealth() {
  try {
    await api('/api/health');
    els.connectionDot.style.background = '#33c481';
    els.connectionText.textContent = 'Local activo';
  } catch {
    els.connectionDot.style.background = '#b73535';
    els.connectionText.textContent = 'Sin servidor local';
  }
}

async function loadProducts(query = '') {
  const data = await api(`/api/products${query ? `?q=${encodeURIComponent(query)}` : ''}`);
  state.products = data.products;
  renderProducts();
  renderProductManager();
  renderSearchResults(query && document.activeElement === els.scanInput ? data.products : []);
}

async function loadSales() {
  const data = await api('/api/sales');
  els.salesList.innerHTML = data.sales.map((sale) => `
    <div class="sale-row">
      <div>
        <strong>${money(sale.total)}</strong>
        <div class="meta">${formatDate(sale.created_at)} - ${paymentLabel(sale.payment_method)}</div>
      </div>
      <span class="pill">${sale.status}</span>
    </div>
  `).join('') || '<div class="empty">Sin ventas registradas.</div>';
}

async function refreshSummary() {
  const summary = await api('/api/summary');
  els.todayTotal.textContent = money(summary.sales_total);
  els.todayCount.textContent = summary.sales_count;
  els.lowStock.textContent = summary.low_stock_count;
  els.pendingSync.textContent = summary.pending_sync_count;
}

async function loadReports() {
  const data = await api(`/api/reports?from=${els.reportFrom.value}&to=${els.reportTo.value}`);
  state.lastReport = data;
  els.reportRevenue.textContent = money(data.totals.revenue);
  els.reportProfit.textContent = money(data.totals.gross_profit);
  els.reportMargin.textContent = `${Number(data.totals.margin_percent || 0).toFixed(1)}%`;
  els.reportUnits.textContent = data.totals.units_sold;

  els.bestSellersList.innerHTML = data.best_sellers.map((item) => `
    <div class="data-row">
      <span class="thumb placeholder">#</span>
      <div>
        <strong>${escapeHtml(item.product_name)}</strong>
        <div class="meta">${item.quantity} unidades - ganancia ${money(item.gross_profit)}</div>
      </div>
      <strong>${money(item.total)}</strong>
    </div>
  `).join('') || '<div class="empty">Sin ventas en este periodo.</div>';

  els.lowStockList.innerHTML = data.low_stock.map((product) => `
    <div class="data-row">
      ${productThumb(product)}
      <div>
        <strong>${escapeHtml(product.name)}</strong>
        <div class="meta">${escapeHtml(product.barcode || product.sku || 'Sin codigo')}</div>
      </div>
      <strong class="stock-low">${product.stock}/${product.min_stock}</strong>
    </div>
  `).join('') || '<div class="empty">No hay productos con stock bajo.</div>';

  els.reportSalesList.innerHTML = data.sales.map((sale) => `
    <div class="table-row">
      <span>${formatDate(sale.created_at)}</span>
      <span>${sale.id.slice(0, 8)}</span>
      <span>${paymentLabel(sale.payment_method)}</span>
      <strong>${money(sale.total)}</strong>
    </div>
  `).join('') || '<div class="empty">Sin ventas en este periodo.</div>';
}

async function handleSearch() {
  const query = els.scanInput.value.trim();
  if (!query) {
    renderSearchResults([]);
    return;
  }
  await loadProducts(query);
}

function addBestMatch() {
  const query = els.scanInput.value.trim().toLowerCase();
  if (!query) return;

  const exact = state.products.find((product) =>
    [product.barcode, product.sku].filter(Boolean).some((value) => String(value).toLowerCase() === query)
  );
  const match = exact || state.products[0];
  if (match) addToCart(match);
}

function renderSearchResults(products) {
  els.searchResults.innerHTML = products.slice(0, 6).map((product) => `
    <button class="result" type="button" data-add-product="${product.id}">
      ${productThumb(product)}
      <span>
        <strong>${escapeHtml(product.name)}</strong>
        <span class="meta">${escapeHtml(product.barcode || product.sku || 'Sin codigo')} - Stock ${product.stock}</span>
      </span>
      <strong>${money(product.sale_price)}</strong>
    </button>
  `).join('');

  els.searchResults.querySelectorAll('[data-add-product]').forEach((button) => {
    button.addEventListener('click', () => {
      const product = products.find((item) => item.id === button.dataset.addProduct);
      addToCart(product);
    });
  });
}

function renderProducts() {
  els.productList.innerHTML = state.products.slice(0, 8).map((product) => {
    const low = Number(product.stock) <= Number(product.min_stock);
    return `
      <div class="product-row">
        ${productThumb(product)}
        <div>
          <strong>${escapeHtml(product.name)}</strong>
          <div class="meta">${escapeHtml(product.barcode || product.sku || 'Sin codigo')} - ${money(product.sale_price)}</div>
          <div class="meta ${low ? 'stock-low' : ''}">Stock ${product.stock} / minimo ${product.min_stock}</div>
        </div>
        <button class="secondary" data-edit-product="${product.id}">Editar</button>
      </div>
    `;
  }).join('');

  els.productList.querySelectorAll('[data-edit-product]').forEach((button) => {
    button.addEventListener('click', () => openProductById(button.dataset.editProduct));
  });
}

function renderProductManager() {
  els.productManagerList.innerHTML = state.products.map((product) => {
    const low = Number(product.stock) <= Number(product.min_stock);
    const profit = Number(product.sale_price) - Number(product.cost_price || 0);
    return `
      <div class="manager-row">
        ${productThumb(product)}
        <div>
          <strong>${escapeHtml(product.name)}</strong>
          <div class="meta">${escapeHtml(product.barcode || product.sku || 'Sin codigo')}</div>
        </div>
        <div><span class="label">Precio</span><strong>${money(product.sale_price)}</strong></div>
        <div><span class="label">Ganancia/u</span><strong>${money(profit)}</strong></div>
        <div><span class="label">Stock</span><strong class="${low ? 'stock-low' : ''}">${product.stock}</strong></div>
        <button class="secondary" data-edit-product="${product.id}">Editar</button>
      </div>
    `;
  }).join('') || '<div class="empty">No hay productos.</div>';

  els.productManagerList.querySelectorAll('[data-edit-product]').forEach((button) => {
    button.addEventListener('click', () => openProductById(button.dataset.editProduct));
  });
}

function addToCart(product) {
  if (!product) return;
  const current = state.cart.get(product.id);
  const quantity = current ? current.quantity + 1 : 1;
  if (quantity > product.stock) {
    showToast(`Stock insuficiente para ${product.name}`);
    return;
  }
  state.cart.set(product.id, { product, quantity });
  els.scanInput.value = '';
  renderSearchResults([]);
  renderCart();
  els.scanInput.focus();
}

function renderCart() {
  const items = [...state.cart.values()];
  els.cartItems.innerHTML = items.map(({ product, quantity }) => `
    <div class="cart-item">
      <div>
        <strong>${escapeHtml(product.name)}</strong>
        <div class="meta">${escapeHtml(product.barcode || product.sku || '')}</div>
      </div>
      <input type="number" min="1" max="${product.stock}" value="${quantity}" data-cart-qty="${product.id}">
      <strong>${money(product.sale_price * quantity)}</strong>
      <button class="danger" data-remove-cart="${product.id}" title="Quitar">x</button>
    </div>
  `).join('') || '<div class="cart-item"><span class="empty">Carrito vacio.</span></div>';

  els.cartItems.querySelectorAll('[data-cart-qty]').forEach((input) => {
    input.addEventListener('change', () => {
      const item = state.cart.get(input.dataset.cartQty);
      const quantity = Math.max(1, Number.parseInt(input.value, 10) || 1);
      if (quantity > item.product.stock) {
        input.value = item.quantity;
        showToast('La cantidad supera el stock disponible');
        return;
      }
      item.quantity = quantity;
      renderCart();
    });
  });

  els.cartItems.querySelectorAll('[data-remove-cart]').forEach((button) => {
    button.addEventListener('click', () => {
      state.cart.delete(button.dataset.removeCart);
      renderCart();
    });
  });

  const total = items.reduce((sum, item) => sum + item.product.sale_price * item.quantity, 0);
  els.cartTotal.textContent = money(total);
}

async function checkout() {
  const items = [...state.cart.values()];
  if (items.length === 0) {
    showToast('Agrega productos antes de cobrar');
    return;
  }

  try {
    const data = await api('/api/sales', {
      method: 'POST',
      body: JSON.stringify({
        payment_method: 'cash',
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity
        }))
      })
    });
    state.lastSale = data.sale;
    state.cart.clear();
    renderCart();
    await refreshAll();
    showReceipt(data.sale);
  } catch (error) {
    showToast(error.message);
  }
}

function openProductById(id) {
  const product = state.products.find((item) => item.id === id);
  openProductDialog(product);
}

function openProductDialog(product = null) {
  els.productDialogTitle.textContent = product ? 'Editar producto' : 'Nuevo producto';
  els.productId.value = product?.id || '';
  els.productName.value = product?.name || '';
  els.productBarcode.value = product?.barcode || '';
  els.productSku.value = product?.sku || '';
  els.productSalePrice.value = product?.sale_price ?? '';
  els.productCostPrice.value = product?.cost_price ?? '';
  els.productStock.value = product?.stock ?? 0;
  els.productMinStock.value = product?.min_stock ?? 0;
  els.productDescription.value = product?.description || '';
  els.productActive.checked = product ? Boolean(product.active) : true;
  els.productImageInput.value = '';
  setProductImage(product?.image_path || null);
  els.productDialog.showModal();
  els.productName.focus();
}

async function saveProduct(event) {
  event.preventDefault();
  const id = els.productId.value;
  const payload = {
    name: els.productName.value,
    barcode: els.productBarcode.value,
    sku: els.productSku.value,
    sale_price: Number(els.productSalePrice.value),
    cost_price: Number(els.productCostPrice.value || 0),
    stock: Number.parseInt(els.productStock.value, 10),
    min_stock: Number.parseInt(els.productMinStock.value || 0, 10),
    description: els.productDescription.value,
    image_path: els.productImageValue.value || null,
    active: els.productActive.checked
  };

  try {
    await api(id ? `/api/products/${id}` : '/api/products', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(payload)
    });
    els.productDialog.close();
    await refreshAll();
    showToast('Producto guardado');
  } catch (error) {
    showToast(error.message);
  }
}

function handleImageInput(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    showToast('Usa una imagen JPG, PNG o WEBP');
    return;
  }
  if (file.size > 700_000) {
    showToast('La imagen debe pesar menos de 700 KB');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => setProductImage(reader.result);
  reader.readAsDataURL(file);
}

function setProductImage(value) {
  els.productImageValue.value = value || '';
  if (value) {
    els.productImagePreview.classList.remove('empty');
    els.productImagePreview.innerHTML = `<img src="${value}" alt="">`;
  } else {
    els.productImagePreview.classList.add('empty');
    els.productImagePreview.textContent = 'Sin imagen';
  }
}

function showReceipt(sale) {
  els.receiptContent.innerHTML = `
    <h2>SGI Market Caja</h2>
    <p><strong>Venta:</strong> ${sale.id.slice(0, 8)}</p>
    <p><strong>Fecha:</strong> ${formatDate(sale.created_at)}</p>
    ${sale.items.map((item) => `
      <div class="receipt-line">
        <span>${escapeHtml(item.product_name)} x ${item.quantity}</span>
        <strong>${money(item.line_total)}</strong>
      </div>
    `).join('')}
    <div class="receipt-line">
      <span>Total</span>
      <strong>${money(sale.total)}</strong>
    </div>
    <p>Gracias por su compra.</p>
  `;
  els.receiptDialog.showModal();
}

function exportReportSales() {
  const rows = state.lastReport?.sales || [];
  if (!rows.length) {
    showToast('No hay ventas para exportar');
    return;
  }
  const csv = [
    ['fecha', 'venta', 'metodo', 'estado', 'total'],
    ...rows.map((sale) => [sale.created_at, sale.id, sale.payment_method, sale.status, sale.total])
  ].map((row) => row.map(csvCell).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ventas-${els.reportFrom.value}-${els.reportTo.value}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error de solicitud');
  return data;
}

function productThumb(product) {
  if (product.image_path) {
    return `<span class="thumb"><img src="${product.image_path}" alt=""></span>`;
  }
  return `<span class="thumb placeholder">${initials(product.name)}</span>`;
}

function setDefaultReportDates() {
  const today = new Date().toISOString().slice(0, 10);
  els.reportFrom.value = today;
  els.reportTo.value = today;
}

function debounce(fn, wait) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

function money(value) {
  return `Bs ${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  return new Date(value).toLocaleString('es-BO', {
    dateStyle: 'short',
    timeStyle: 'short'
  });
}

function paymentLabel(value) {
  const labels = { cash: 'Efectivo', card: 'Tarjeta', qr: 'QR', transfer: 'Transferencia' };
  return labels[value] || value;
}

function initials(value) {
  return String(value || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.hidden = false;
  setTimeout(() => {
    els.toast.hidden = true;
  }, 3200);
}
