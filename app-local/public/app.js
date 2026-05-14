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
  currentUserLabel: document.querySelector('#currentUserLabel'),
  activeStoreControl: document.querySelector('#activeStoreControl'),
  activeStoreSelect: document.querySelector('#activeStoreSelect'),
  loginOverlay: document.querySelector('#loginOverlay'),
  loginForm: document.querySelector('#loginForm'),
  loginUsername: document.querySelector('#loginUsername'),
  loginPassword: document.querySelector('#loginPassword'),
  storeForm: document.querySelector('#storeForm'),
  storeName: document.querySelector('#storeName'),
  storesList: document.querySelector('#storesList'),
  userForm: document.querySelector('#userForm'),
  userName: document.querySelector('#userName'),
  userUsername: document.querySelector('#userUsername'),
  userPassword: document.querySelector('#userPassword'),
  userStore: document.querySelector('#userStore'),
  userRole: document.querySelector('#userRole'),
  usersList: document.querySelector('#usersList'),
  productDialog: document.querySelector('#productDialog'),
  productForm: document.querySelector('#productForm'),
  productDialogTitle: document.querySelector('#productDialogTitle'),
  productId: document.querySelector('#productId'),
  productImageValue: document.querySelector('#productImageValue'),
  productImagePreview: document.querySelector('#productImagePreview'),
  productImageInput: document.querySelector('#productImageInput'),
  mobileCameraInput: document.querySelector('#mobileCameraInput'),
  openCameraButton: document.querySelector('#openCameraButton'),
  removeProductImage: document.querySelector('#removeProductImage'),
  productName: document.querySelector('#productName'),
  productBarcode: document.querySelector('#productBarcode'),
  barcodeScanHint: document.querySelector('#barcodeScanHint'),
  productSku: document.querySelector('#productSku'),
  productSalePrice: document.querySelector('#productSalePrice'),
  productCostPrice: document.querySelector('#productCostPrice'),
  productStock: document.querySelector('#productStock'),
  productMinStock: document.querySelector('#productMinStock'),
  productDescription: document.querySelector('#productDescription'),
  productActive: document.querySelector('#productActive'),
  newProductButton: document.querySelector('#newProductButton'),
  scanNewProductButton: document.querySelector('#scanNewProductButton'),
  focusBarcodeButton: document.querySelector('#focusBarcodeButton'),
  closeProductDialog: document.querySelector('#closeProductDialog'),
  receiptDialog: document.querySelector('#receiptDialog'),
  receiptContent: document.querySelector('#receiptContent'),
  printReceiptButton: document.querySelector('#printReceiptButton'),
  closeReceiptButton: document.querySelector('#closeReceiptButton'),
  paymentDialog: document.querySelector('#paymentDialog'),
  paymentForm: document.querySelector('#paymentForm'),
  closePaymentDialog: document.querySelector('#closePaymentDialog'),
  paymentTotal: document.querySelector('#paymentTotal'),
  cashFields: document.querySelector('#cashFields'),
  qrFields: document.querySelector('#qrFields'),
  cashReceived: document.querySelector('#cashReceived'),
  cashChange: document.querySelector('#cashChange'),
  qrTransactionCode: document.querySelector('#qrTransactionCode'),
  confirmPaymentButton: document.querySelector('#confirmPaymentButton'),
  imageDialog: document.querySelector('#imageDialog'),
  expandedImage: document.querySelector('#expandedImage'),
  closeImageDialog: document.querySelector('#closeImageDialog'),
  cameraDialog: document.querySelector('#cameraDialog'),
  closeCameraDialog: document.querySelector('#closeCameraDialog'),
  cameraVideo: document.querySelector('#cameraVideo'),
  cameraCanvas: document.querySelector('#cameraCanvas'),
  cameraPreview: document.querySelector('#cameraPreview'),
  capturePhotoButton: document.querySelector('#capturePhotoButton'),
  retakePhotoButton: document.querySelector('#retakePhotoButton'),
  confirmPhotoButton: document.querySelector('#confirmPhotoButton'),
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
  chartsStatus: document.querySelector('#chartsStatus'),
  salesTrendChart: document.querySelector('#salesTrendChart'),
  productsChart: document.querySelector('#productsChart'),
  paymentsChart: document.querySelector('#paymentsChart'),
  stockChart: document.querySelector('#stockChart'),
  toast: document.querySelector('#toast')
};

let salesTrendChart;
let productsBarChart;
let paymentsChart;
let stockChart;
let cameraStream;
let capturedCameraImage;
let waitingProductBarcodeScan = false;
let productBarcodeBuffer = '';
let productBarcodeTimer;
let chartsResizeObserver;

boot();

function boot() {
  setDefaultReportDates();
  bindEvents();
  initializeSession();
  setInterval(refreshSummary, 15000);
  renderIcons();
}

function bindEvents() {
  els.tabs.forEach((tab) => {
    tab.addEventListener('click', () => showView(tab.dataset.view));
  });
  els.loginForm.addEventListener('submit', login);
  els.storeForm.addEventListener('submit', saveStore);
  els.storesList.addEventListener('click', handleStoreListClick);
  els.userForm.addEventListener('submit', saveUser);
  els.userRole.addEventListener('change', updateUserFormPermissions);
  els.activeStoreSelect.addEventListener('change', changeActiveStore);
  els.scanInput.addEventListener('input', debounce(handleSearch, 140));
  els.scanInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addScannedProduct();
    }
  });
  els.productSearchInput.addEventListener('input', debounce(() => loadProducts(els.productSearchInput.value.trim()), 180));
  els.checkoutButton.addEventListener('click', openPaymentDialog);
  els.paymentForm.addEventListener('submit', checkout);
  els.closePaymentDialog.addEventListener('click', () => els.paymentDialog.close());
  document.querySelectorAll('input[name="paymentMethod"]').forEach((input) => {
    input.addEventListener('change', updatePaymentMethodUi);
  });
  els.cashReceived.addEventListener('input', updateCashChange);
  els.clearCartButton.addEventListener('click', () => {
    state.cart.clear();
    renderCart();
    els.scanInput.focus();
  });
  els.newProductButton.addEventListener('click', () => openProductDialog());
  els.scanNewProductButton.addEventListener('click', () => openProductDialog(null, { focusBarcode: true }));
  els.focusBarcodeButton.addEventListener('click', startProductBarcodeScan);
  els.productBarcode.addEventListener('input', handleProductBarcodeInput);
  els.productBarcode.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      finishProductBarcodeScan();
    }
  });
  document.addEventListener('keydown', handleGlobalBarcodeScan, true);
  els.closeProductDialog.addEventListener('click', () => els.productDialog.close());
  els.productForm.addEventListener('submit', saveProduct);
  els.productImageInput.addEventListener('change', handleImageInput);
  els.mobileCameraInput.addEventListener('change', handleImageInput);
  els.openCameraButton.addEventListener('click', openCameraCapture);
  els.closeCameraDialog.addEventListener('click', closeCameraCapture);
  els.cameraDialog.addEventListener('close', stopCameraStream);
  els.capturePhotoButton.addEventListener('click', captureCameraFrame);
  els.retakePhotoButton.addEventListener('click', retakeCameraPhoto);
  els.confirmPhotoButton.addEventListener('click', confirmCameraPhoto);
  els.removeProductImage.addEventListener('click', () => setProductImage(null));
  els.productImagePreview.addEventListener('click', () => {
    if (els.productImageValue.value) openImageViewer(els.productImageValue.value);
  });
  els.printReceiptButton.addEventListener('click', () => window.print());
  els.closeReceiptButton.addEventListener('click', () => {
    els.receiptDialog.close();
    els.scanInput.focus();
  });
  els.closeImageDialog.addEventListener('click', () => els.imageDialog.close());
  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-image-view], [data-product-image]');
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    const src = target.dataset.imageView || findProductImage(target.dataset.productImage);
    if (src) openImageViewer(src);
  }, true);
  els.loadReportsButton.addEventListener('click', loadReports);
  els.exportSalesButton.addEventListener('click', exportReportSales);
  window.addEventListener('resize', debounce(resizeCharts, 120));
  if (window.ResizeObserver) {
    chartsResizeObserver = new ResizeObserver(() => resizeCharts());
    [els.salesTrendChart, els.productsChart, els.paymentsChart, els.stockChart].forEach((element) => {
      if (element) chartsResizeObserver.observe(element);
    });
  }
}

async function refreshAll() {
  if (state.user?.role === 'owner') await loadAdminData();
  await Promise.all([loadProducts(), refreshSummary(), loadSales(), checkHealth(), loadReports(), state.user?.role === 'owner' ? Promise.resolve() : loadAdminData()]);
}

async function initializeSession() {
  try {
    const data = await api('/api/session');
    applySession(data.user, data.store);
    await refreshAll();
    els.scanInput.focus();
  } catch {
    els.loginOverlay.classList.add('active');
    renderIcons();
  }
}

async function login(event) {
  event.preventDefault();
  try {
    const data = await api('/api/login', {
      method: 'POST',
      body: JSON.stringify({
        username: els.loginUsername.value,
        password: els.loginPassword.value
      })
    });
    applySession(data.user, data.store);
    els.loginOverlay.classList.remove('active');
    await refreshAll();
    els.scanInput.focus();
  } catch (error) {
    showToast(error.message);
  }
}

function applySession(user, store) {
  state.user = user;
  state.activeStore = store || null;
  els.currentUserLabel.textContent = user.role === 'owner'
    ? `${user.name} - Administrador general`
    : `${user.name} - ${user.store_name || 'Sin sucursal'}`;
  els.activeStoreControl.hidden = user.role !== 'owner';
  if (user.role === 'owner' && store) {
    els.activeStoreSelect.dataset.currentStore = store.id;
  }
  document.body.dataset.role = user.role;
  document.querySelectorAll('.tab').forEach((tab) => {
    const view = tab.dataset.view;
    const allowed = canAccessView(user.role, view);
    tab.hidden = !allowed;
  });
  if (!canAccessView(user.role, document.querySelector('.view.active')?.id || 'posView')) {
    showView('posView');
  }
  renderIcons();
}

async function loadAdminData() {
  if (!canManageAdmin(state.user?.role)) return;
  const [storesData, usersData] = await Promise.all([api('/api/stores'), api('/api/users')]);
  renderStores(storesData.stores);
  renderUsers(usersData.users);
  updateUserFormPermissions();
}

function renderStores(stores) {
  els.userStore.innerHTML = stores.map((store) => `<option value="${store.id}">${escapeHtml(store.name)}</option>`).join('');
  if (state.user?.role === 'owner') {
    const currentStoreId = els.activeStoreSelect.dataset.currentStore || state.activeStore?.id || stores[0]?.id || '';
    els.activeStoreSelect.innerHTML = stores.map((store) => `<option value="${store.id}">${escapeHtml(store.name)}</option>`).join('');
    els.activeStoreSelect.value = currentStoreId;
  }
  els.storeForm.hidden = state.user?.role !== 'owner';
  els.storesList.innerHTML = stores.map((store) => `
    <div class="data-row">
      <span class="row-icon"><i data-lucide="store"></i></span>
      <div>
        <strong>${escapeHtml(store.name)}</strong>
        <div class="meta">${store.license_status || 'trial'}</div>
      </div>
      ${state.user?.role === 'owner' ? `<button class="secondary" data-rename-store="${store.id}" data-store-name="${escapeHtml(store.name)}"><i data-lucide="pencil"></i>Renombrar</button>` : ''}
    </div>
  `).join('') || '<div class="empty">Sin sucursales.</div>';
  renderIcons();
}

async function changeActiveStore() {
  if (state.user?.role !== 'owner') return;
  const storeId = els.activeStoreSelect.value;
  try {
    const data = await api('/api/active-store', {
      method: 'PUT',
      body: JSON.stringify({ store_id: storeId })
    });
    state.activeStore = data.store;
    els.activeStoreSelect.dataset.currentStore = data.store.id;
    state.cart.clear();
    renderCart();
    await Promise.all([loadProducts(), refreshSummary(), loadSales(), loadReports()]);
    showToast(`Sucursal activa: ${data.store.name}`);
  } catch (error) {
    showToast(error.message);
  }
}

async function handleStoreListClick(event) {
  const button = event.target.closest('[data-rename-store]');
  if (!button) return;
  const currentName = button.dataset.storeName || '';
  const name = window.prompt('Nuevo nombre de la sucursal:', currentName);
  if (name === null) return;
  const cleanName = name.trim();
  if (!cleanName) {
    showToast('El nombre de la sucursal es obligatorio');
    return;
  }
  try {
    await api(`/api/stores/${button.dataset.renameStore}`, {
      method: 'PUT',
      body: JSON.stringify({ name: cleanName })
    });
    await loadAdminData();
    showToast('Sucursal renombrada');
  } catch (error) {
    showToast(error.message);
  }
}

function renderUsers(users) {
  els.usersList.innerHTML = users.map((user) => `
    <div class="data-row">
      <span class="row-icon"><i data-lucide="${user.role === 'owner' || user.role === 'branch_admin' ? 'shield-check' : 'badge'}"></i></span>
      <div>
        <strong>${escapeHtml(user.name)}</strong>
        <div class="meta">${escapeHtml(user.username)} - ${roleLabel(user.role)} - ${escapeHtml(user.store_name || 'Todas las sucursales')}</div>
      </div>
      <span class="pill">${user.active ? 'Activo' : 'Inactivo'}</span>
    </div>
  `).join('') || '<div class="empty">Sin usuarios.</div>';
  renderIcons();
}

function updateUserFormPermissions() {
  const isOwner = state.user?.role === 'owner';
  const options = isOwner
    ? [
      ['cashier', 'Cajera'],
      ['editor', 'Editor'],
      ['branch_admin', 'Admin sucursal'],
      ['owner', 'Admin general']
    ]
    : [
      ['cashier', 'Cajera'],
      ['editor', 'Editor']
    ];
  const currentRole = options.some(([value]) => value === els.userRole.value) ? els.userRole.value : options[0][0];
  els.userRole.innerHTML = options.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
  els.userRole.value = currentRole;
  const ownerTarget = els.userRole.value === 'owner';
  els.userStore.disabled = ownerTarget || !isOwner;
  els.userStore.required = !ownerTarget;
}

async function saveStore(event) {
  event.preventDefault();
  try {
    await api('/api/stores', {
      method: 'POST',
      body: JSON.stringify({ name: els.storeName.value })
    });
    els.storeName.value = '';
    await loadAdminData();
    showToast('Sucursal creada');
  } catch (error) {
    showToast(error.message);
  }
}

async function saveUser(event) {
  event.preventDefault();
  try {
    await api('/api/users', {
      method: 'POST',
      body: JSON.stringify({
        name: els.userName.value,
        username: els.userUsername.value,
        password: els.userPassword.value,
        store_id: els.userRole.value === 'owner' ? null : els.userStore.value,
        role: els.userRole.value
      })
    });
    els.userForm.reset();
    await loadAdminData();
    showToast('Usuario creado');
  } catch (error) {
    showToast(error.message);
  }
}

function showView(viewId) {
  els.tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.view === viewId));
  els.views.forEach((view) => view.classList.toggle('active', view.id === viewId));
  if (viewId === 'productsView') {
    document.querySelector('.tab[data-view="productsView"]')?.classList.remove('attention');
  }
  if (viewId === 'posView') els.scanInput.focus();
  if (viewId === 'reportsView') {
    loadReports().then(() => window.setTimeout(resizeCharts, 80));
  }
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
        <span class="row-icon"><i data-lucide="receipt-text"></i></span>
        <strong>${money(sale.total)}</strong>
        <div class="meta">${formatDate(sale.created_at)} - ${paymentLabel(sale.payment_method)}</div>
      </div>
      <span class="pill"><i data-lucide="check"></i>${sale.status}</span>
    </div>
  `).join('') || '<div class="empty">Sin ventas registradas.</div>';
  renderIcons();
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
  renderIcons();

  renderReportCharts(data);
}

async function handleSearch() {
  const query = els.scanInput.value.trim();
  if (!query) {
    renderSearchResults([]);
    return;
  }
  await loadProducts(query);
}

function addScannedProduct() {
  const query = els.scanInput.value.trim().toLowerCase();
  if (!query) return;

  const exact = state.products.find((product) =>
    [product.barcode, product.sku].filter(Boolean).some((value) => String(value).toLowerCase() === query)
  );
  if (exact) {
    addToCart(exact);
    return;
  }

  if (state.products.length === 1) {
    addToCart(state.products[0]);
    return;
  }

  const activeTab = document.querySelector('.tab[data-view="productsView"]');
  showToast('Producto no encontrado. Puedes crearlo desde Productos.');
  els.scanInput.select();
  if (activeTab) activeTab.classList.add('attention');
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
        <button class="secondary" data-edit-product="${product.id}"><i data-lucide="pencil"></i>Editar</button>
      </div>
    `;
  }).join('');

  els.productList.querySelectorAll('[data-edit-product]').forEach((button) => {
    button.addEventListener('click', () => openProductById(button.dataset.editProduct));
  });
  renderIcons();
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
        <button class="secondary" data-edit-product="${product.id}"><i data-lucide="pencil"></i>Editar</button>
      </div>
    `;
  }).join('') || '<div class="empty">No hay productos.</div>';

  els.productManagerList.querySelectorAll('[data-edit-product]').forEach((button) => {
    button.addEventListener('click', () => openProductById(button.dataset.editProduct));
  });
  renderIcons();
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
  `).join('') || '<div class="cart-empty"><span><i data-lucide="shopping-cart"></i></span><strong>Carrito vacio.</strong></div>';

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
  renderIcons();
}

function openPaymentDialog() {
  const items = [...state.cart.values()];
  if (items.length === 0) {
    showToast('Agrega productos antes de cobrar');
    return;
  }

  const total = getCartTotal();
  els.paymentTotal.textContent = money(total);
  els.cashReceived.value = total.toFixed(2);
  els.qrTransactionCode.value = '';
  document.querySelector('input[name="paymentMethod"][value="cash"]').checked = true;
  updatePaymentMethodUi();
  updateCashChange();
  els.paymentDialog.showModal();
  els.cashReceived.focus();
  els.cashReceived.select();
}

async function checkout(event) {
  event.preventDefault();
  const items = [...state.cart.values()];
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
  const total = getCartTotal();
  const cashReceived = Number(els.cashReceived.value || 0);

  if (paymentMethod === 'cash' && cashReceived < total) {
    showToast('El efectivo recibido no cubre el total');
    els.cashReceived.focus();
    return;
  }

  try {
    const data = await api('/api/sales', {
      method: 'POST',
      body: JSON.stringify({
        payment_method: paymentMethod,
        cash_received: paymentMethod === 'cash' ? cashReceived : null,
        qr_transaction_code: paymentMethod === 'qr' ? els.qrTransactionCode.value.trim() : null,
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity
        }))
      })
    });
    state.lastSale = data.sale;
    state.cart.clear();
    renderCart();
    els.paymentDialog.close();
    await refreshAll();
    showReceipt(data.sale);
  } catch (error) {
    showToast(error.message);
  }
}

function updatePaymentMethodUi() {
  const method = document.querySelector('input[name="paymentMethod"]:checked').value;
  document.querySelectorAll('.method-card').forEach((card) => {
    const input = card.querySelector('input');
    card.classList.toggle('active', input.checked);
  });
  els.cashFields.hidden = method !== 'cash';
  els.qrFields.hidden = method !== 'qr';
  if (method === 'cash') {
    els.confirmPaymentButton.textContent = 'Confirmar venta en efectivo';
    updateCashChange();
  } else {
    els.confirmPaymentButton.textContent = 'Confirmar venta por QR';
  }
}

function updateCashChange() {
  const total = getCartTotal();
  const received = Number(els.cashReceived.value || 0);
  const change = Math.max(0, received - total);
  els.cashChange.textContent = money(change);
}

function getCartTotal() {
  return [...state.cart.values()].reduce((sum, item) => sum + item.product.sale_price * item.quantity, 0);
}

function openProductById(id) {
  const product = state.products.find((item) => item.id === id);
  openProductDialog(product);
}

function openProductDialog(product = null, options = {}) {
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
  if (options.focusBarcode) {
    startProductBarcodeScan();
  } else {
    setBarcodeScanState(false);
    els.productName.focus();
  }
}

function startProductBarcodeScan() {
  waitingProductBarcodeScan = true;
  productBarcodeBuffer = '';
  els.productBarcode.value = '';
  setBarcodeScanState(true);
  els.productBarcode.focus();
  showToast('Escanea ahora el codigo de barras');
}

function handleProductBarcodeInput() {
  if (!waitingProductBarcodeScan) return;
  els.barcodeScanHint.textContent = `Codigo detectado: ${els.productBarcode.value}`;
}

function finishProductBarcodeScan() {
  const code = (els.productBarcode.value || productBarcodeBuffer).trim();
  if (!code) {
    startProductBarcodeScan();
    return;
  }
  els.productBarcode.value = code;
  waitingProductBarcodeScan = false;
  productBarcodeBuffer = '';
  setBarcodeScanState(false);
  const next = els.productName.value.trim() ? els.productSalePrice : els.productName;
  next.focus();
  next.select?.();
  showToast(`Codigo capturado: ${code}`);
}

function setBarcodeScanState(active) {
  els.focusBarcodeButton.textContent = active ? 'Esperando...' : 'Escanear';
  els.focusBarcodeButton.classList.toggle('scan-active', active);
  els.productBarcode.classList.toggle('scan-active', active);
  els.barcodeScanHint.textContent = active
    ? 'Apunta el lector al codigo de barras. Se rellenara aqui automaticamente.'
    : 'Presiona Escanear y lee el codigo del producto.';
}

function handleGlobalBarcodeScan(event) {
  if (!waitingProductBarcodeScan) return;
  if (event.ctrlKey || event.altKey || event.metaKey) return;

  if (event.key === 'Enter') {
    event.preventDefault();
    finishProductBarcodeScan();
    return;
  }

  if (event.key === 'Backspace') {
    productBarcodeBuffer = productBarcodeBuffer.slice(0, -1);
    els.productBarcode.value = productBarcodeBuffer;
    handleProductBarcodeInput();
    return;
  }

  if (event.key.length !== 1) return;

  const activeIsBarcode = document.activeElement === els.productBarcode;
  if (!activeIsBarcode) {
    event.preventDefault();
    productBarcodeBuffer += event.key;
    els.productBarcode.value = productBarcodeBuffer;
    els.productBarcode.focus();
    handleProductBarcodeInput();
  } else {
    window.clearTimeout(productBarcodeTimer);
    productBarcodeTimer = window.setTimeout(() => {
      productBarcodeBuffer = els.productBarcode.value;
      handleProductBarcodeInput();
    }, 20);
  }
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

async function handleImageInput(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    showToast('Usa una imagen JPG, PNG o WEBP');
    return;
  }
  if (file.size > 12_000_000) {
    showToast('La imagen es muy pesada. Usa una menor a 12 MB');
    return;
  }
  try {
    showToast('Optimizando imagen...');
    const image = await compressImageFile(file);
    setProductImage(image);
    showToast('Imagen optimizada y lista');
  } catch (error) {
    showToast(error.message || 'No se pudo procesar la imagen');
  }
}

function setProductImage(value) {
  els.productImageValue.value = value || '';
  if (value) {
    els.productImagePreview.classList.remove('empty');
    els.productImagePreview.innerHTML = `<img src="${value}" alt="">`;
    els.productImagePreview.title = 'Clic para ampliar';
  } else {
    els.productImagePreview.classList.add('empty');
    els.productImagePreview.textContent = 'Sin imagen';
    els.productImagePreview.title = '';
  }
}

async function compressImageFile(file) {
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(sourceUrl);
    const maxSide = 1200;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);

    for (const quality of [0.82, 0.72, 0.62, 0.52]) {
      const dataUrl = await canvasToWebp(canvas, quality);
      if (dataUrl.length <= 1_200_000 || quality === 0.52) return dataUrl;
    }
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
  throw new Error('No se pudo optimizar la imagen');
}

async function openCameraCapture() {
  if (!navigator.mediaDevices?.getUserMedia) {
    showToast('Este navegador no permite abrir camara directa. Usa Camara movil.');
    return;
  }

  try {
    capturedCameraImage = null;
    els.cameraPreview.hidden = true;
    els.cameraVideo.hidden = false;
    els.capturePhotoButton.hidden = false;
    els.retakePhotoButton.hidden = true;
    els.confirmPhotoButton.hidden = true;
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 960 } },
      audio: false
    });
    els.cameraVideo.srcObject = cameraStream;
    els.cameraDialog.showModal();
  } catch {
    showToast('No se pudo abrir la camara. Revisa permisos o usa Camara movil.');
  }
}

async function captureCameraFrame() {
  const video = els.cameraVideo;
  if (!video.videoWidth || !video.videoHeight) {
    showToast('La camara aun no esta lista');
    return;
  }

  const canvas = els.cameraCanvas;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  capturedCameraImage = await compressCanvasToWebp(canvas);
  els.cameraPreview.src = capturedCameraImage;
  els.cameraPreview.hidden = false;
  els.cameraVideo.hidden = true;
  els.capturePhotoButton.hidden = true;
  els.retakePhotoButton.hidden = false;
  els.confirmPhotoButton.hidden = false;
}

function retakeCameraPhoto() {
  capturedCameraImage = null;
  els.cameraPreview.hidden = true;
  els.cameraVideo.hidden = false;
  els.capturePhotoButton.hidden = false;
  els.retakePhotoButton.hidden = true;
  els.confirmPhotoButton.hidden = true;
}

function confirmCameraPhoto() {
  if (!capturedCameraImage) {
    showToast('Primero toma una foto');
    return;
  }
  setProductImage(capturedCameraImage);
  closeCameraCapture();
  showToast('Foto confirmada');
}

function closeCameraCapture() {
  els.cameraDialog.close();
  stopCameraStream();
}

function stopCameraStream() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }
  els.cameraVideo.srcObject = null;
}

async function compressCanvasToWebp(sourceCanvas) {
  const maxSide = 1200;
  const scale = Math.min(1, maxSide / Math.max(sourceCanvas.width, sourceCanvas.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sourceCanvas.width * scale));
  canvas.height = Math.max(1, Math.round(sourceCanvas.height * scale));
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height);
  for (const quality of [0.82, 0.72, 0.62, 0.52]) {
    const dataUrl = await canvasToWebp(canvas, quality);
    if (dataUrl.length <= 1_200_000 || quality === 0.52) return dataUrl;
  }
  throw new Error('No se pudo optimizar la foto');
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('No se pudo leer la imagen'));
    image.src = src;
  });
}

function canvasToWebp(canvas, quality) {
  return new Promise((resolve) => {
    resolve(canvas.toDataURL('image/webp', quality));
  });
}

function openImageViewer(src) {
  els.expandedImage.src = src;
  els.imageDialog.showModal();
}

function showReceipt(sale) {
  els.receiptContent.innerHTML = `
    <h2>SGI Market Caja</h2>
    <p><strong>Venta:</strong> ${sale.id.slice(0, 8)}</p>
    <p><strong>Fecha:</strong> ${formatDate(sale.created_at)}</p>
    <p><strong>Pago:</strong> ${paymentLabel(sale.payment_method)}</p>
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
    ${sale.payment_method === 'cash' ? `
      <div class="receipt-line"><span>Recibido</span><strong>${money(sale.cash_received)}</strong></div>
      <div class="receipt-line"><span>Cambio</span><strong>${money(sale.cash_change)}</strong></div>
    ` : ''}
    ${sale.payment_method === 'qr' && sale.qr_transaction_code ? `
      <p><strong>QR:</strong> ${escapeHtml(sale.qr_transaction_code)}</p>
    ` : ''}
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
    ['fecha', 'venta', 'metodo', 'efectivo_recibido', 'cambio', 'codigo_qr', 'estado', 'total'],
    ...rows.map((sale) => [
      sale.created_at,
      sale.id,
      sale.payment_method,
      sale.cash_received || '',
      sale.cash_change || '',
      sale.qr_transaction_code || '',
      sale.status,
      sale.total
    ])
  ].map((row) => row.map(csvCell).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ventas-${els.reportFrom.value}-${els.reportTo.value}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function renderReportCharts(data) {
  if (!window.echarts || !els.salesTrendChart || !els.productsChart) {
    els.chartsStatus.textContent = 'Graficos disponibles con internet';
    [els.salesTrendChart, els.productsChart, els.paymentsChart, els.stockChart].forEach((element) => {
      if (element) element.innerHTML = '<div class="empty">Sin libreria de graficos cargada.</div>';
    });
    return;
  }

  els.chartsStatus.textContent = 'Animado';
  [els.salesTrendChart, els.productsChart, els.paymentsChart, els.stockChart].forEach(ensureChartSize);
  salesTrendChart = salesTrendChart || echarts.init(els.salesTrendChart, null, { renderer: 'canvas' });
  productsBarChart = productsBarChart || echarts.init(els.productsChart, null, { renderer: 'canvas' });
  paymentsChart = paymentsChart || echarts.init(els.paymentsChart, null, { renderer: 'canvas' });
  stockChart = stockChart || echarts.init(els.stockChart, null, { renderer: 'canvas' });

  const dayLabels = data.by_day.length ? data.by_day.map((row) => row.day.slice(5)) : [data.from.slice(5)];
  const dayValues = data.by_day.length ? data.by_day.map((row) => Number(row.total || 0)) : [0];

  salesTrendChart.setOption({
    grid: { left: 48, right: 18, top: 26, bottom: 38 },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value) => money(value)
    },
    animation: true,
    animationDuration: 700,
    xAxis: {
      type: 'category',
      data: dayLabels,
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (value) => `Bs ${value}` }
    },
    series: [{
      name: 'Ventas',
      type: 'line',
      smooth: true,
      symbolSize: 8,
      areaStyle: { opacity: 0.18 },
      lineStyle: { width: 3 },
      itemStyle: { color: '#0e766f' },
      data: dayValues
    }]
  });

  const top = data.best_sellers.slice(0, 8);
  const productLabels = top.length ? top.map((item) => trimLabel(item.product_name)) : ['Sin ventas'];
  const productValues = top.length ? top.map((item) => Number(item.total || 0)) : [0];

  productsBarChart.setOption({
    grid: { left: 90, right: 22, top: 18, bottom: 28 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (value) => money(value)
    },
    animation: true,
    animationDuration: 700,
    xAxis: {
      type: 'value',
      axisLabel: { formatter: (value) => `Bs ${value}` }
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: productLabels
    },
    series: [{
      name: 'Vendido',
      type: 'bar',
      barMaxWidth: 24,
      itemStyle: { color: '#175cd3', borderRadius: [0, 4, 4, 0] },
      data: productValues
    }]
  });

  const paymentData = (data.payment_methods || []).map((item) => ({
    name: paymentLabel(item.payment_method),
    value: Number(item.total || 0)
  }));
  paymentsChart.setOption({
    tooltip: { trigger: 'item', valueFormatter: (value) => money(value) },
    legend: { bottom: 0 },
    animation: true,
    animationDuration: 700,
    series: [{
      name: 'Metodo',
      type: 'pie',
      radius: ['48%', '72%'],
      center: ['50%', '44%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
      data: paymentData.length ? paymentData : [{ name: 'Sin ventas', value: 0 }]
    }]
  });

  const stockItems = data.low_stock.slice(0, 8);
  stockChart.setOption({
    grid: { left: 92, right: 18, top: 16, bottom: 26 },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    animation: true,
    animationDuration: 700,
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      inverse: true,
      data: stockItems.length ? stockItems.map((item) => trimLabel(item.name)) : ['Sin stock bajo']
    },
    series: [{
      name: 'Stock',
      type: 'bar',
      barMaxWidth: 22,
      itemStyle: { color: '#b54708', borderRadius: [0, 4, 4, 0] },
      data: stockItems.length ? stockItems.map((item) => Number(item.stock || 0)) : [0]
    }]
  });

  window.requestAnimationFrame(() => {
    resizeCharts();
    window.setTimeout(resizeCharts, 160);
  });
}

function ensureChartSize(element) {
  const box = element.getBoundingClientRect();
  if (box.width < 80) {
    element.style.minWidth = '320px';
  }
}

function resizeCharts() {
  if (!document.querySelector('#reportsView')?.classList.contains('active')) return;
  salesTrendChart?.resize();
  productsBarChart?.resize();
  paymentsChart?.resize();
  stockChart?.resize();
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
    return `<span class="thumb image-click" data-product-image="${product.id}" title="Ampliar imagen"><img src="${product.image_path}" alt=""></span>`;
  }
  return `<span class="thumb placeholder">${initials(product.name)}</span>`;
}

function findProductImage(id) {
  const product = state.products.find((item) => item.id === id)
    || state.lastReport?.low_stock?.find((item) => item.id === id);
  return product?.image_path || null;
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

function roleLabel(value) {
  const labels = {
    owner: 'Admin general',
    branch_admin: 'Admin sucursal',
    admin: 'Admin',
    editor: 'Editor',
    cashier: 'Cajera'
  };
  return labels[value] || value;
}

function canManageAdmin(role) {
  return role === 'owner' || role === 'branch_admin';
}

function canAccessView(role, viewId) {
  if (role === 'owner' || role === 'branch_admin') return true;
  if (role === 'editor') return viewId !== 'adminView';
  return viewId === 'posView';
}

function trimLabel(value) {
  const text = String(value || '');
  return text.length > 16 ? `${text.slice(0, 15)}.` : text;
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

function renderIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
