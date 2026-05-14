const state = {
  user: null,
  tenants: [],
  stores: [],
  users: [],
  sales: [],
  products: [],
  cart: [],
  deferredInstallPrompt: null
};

const els = {
  loginView: document.querySelector('#loginView'),
  dashboardView: document.querySelector('#dashboardView'),
  loginForm: document.querySelector('#loginForm'),
  username: document.querySelector('#username'),
  password: document.querySelector('#password'),
  logoutButton: document.querySelector('#logoutButton'),
  installButton: document.querySelector('#installButton'),
  activeStore: document.querySelector('#activeStore'),
  tenantCount: document.querySelector('#tenantCount'),
  storeCount: document.querySelector('#storeCount'),
  userCount: document.querySelector('#userCount'),
  todayTotal: document.querySelector('#todayTotal'),
  saleForm: document.querySelector('#saleForm'),
  productSearch: document.querySelector('#productSearch'),
  productResults: document.querySelector('#productResults'),
  cartList: document.querySelector('#cartList'),
  cartTotal: document.querySelector('#cartTotal'),
  paymentMethod: document.querySelector('#paymentMethod'),
  cashReceived: document.querySelector('#cashReceived'),
  cashReceivedLabel: document.querySelector('#cashReceivedLabel'),
  qrCodeLabel: document.querySelector('#qrCodeLabel'),
  qrTransactionCode: document.querySelector('#qrTransactionCode'),
  productForm: document.querySelector('#productForm'),
  productId: document.querySelector('#productId'),
  productName: document.querySelector('#productName'),
  productBarcode: document.querySelector('#productBarcode'),
  productSku: document.querySelector('#productSku'),
  productSalePrice: document.querySelector('#productSalePrice'),
  productCostPrice: document.querySelector('#productCostPrice'),
  productStock: document.querySelector('#productStock'),
  productMinStock: document.querySelector('#productMinStock'),
  tenantForm: document.querySelector('#tenantForm'),
  tenantBusinessName: document.querySelector('#tenantBusinessName'),
  tenantOwnerName: document.querySelector('#tenantOwnerName'),
  tenantOwnerEmail: document.querySelector('#tenantOwnerEmail'),
  storeForm: document.querySelector('#storeForm'),
  storeTenant: document.querySelector('#storeTenant'),
  storeName: document.querySelector('#storeName'),
  storeAddress: document.querySelector('#storeAddress'),
  userForm: document.querySelector('#userForm'),
  userName: document.querySelector('#userName'),
  userUsername: document.querySelector('#userUsername'),
  userEmail: document.querySelector('#userEmail'),
  userPassword: document.querySelector('#userPassword'),
  userTenant: document.querySelector('#userTenant'),
  userStoreLabel: document.querySelector('#userStoreLabel'),
  userStore: document.querySelector('#userStore'),
  userRole: document.querySelector('#userRole'),
  tenantsList: document.querySelector('#tenantsList'),
  storesList: document.querySelector('#storesList'),
  usersList: document.querySelector('#usersList'),
  salesList: document.querySelector('#salesList'),
  productsList: document.querySelector('#productsList'),
  toast: document.querySelector('#toast')
};

boot();

function boot() {
  els.loginForm.addEventListener('submit', login);
  els.logoutButton.addEventListener('click', logout);
  els.installButton?.addEventListener('click', installPwa);
  els.activeStore.addEventListener('change', refreshStoreData);
  els.tenantForm.addEventListener('submit', saveTenant);
  els.storeForm.addEventListener('submit', saveStore);
  els.userForm.addEventListener('submit', saveUser);
  els.usersList.addEventListener('click', handleUserListClick);
  els.productsList.addEventListener('click', handleProductsListClick);
  els.productResults.addEventListener('click', handleProductResultsClick);
  els.cartList.addEventListener('click', handleCartClick);
  els.productSearch.addEventListener('input', renderProductResults);
  els.saleForm.addEventListener('submit', saveSale);
  els.paymentMethod.addEventListener('change', updatePaymentFields);
  els.productForm.addEventListener('submit', saveProduct);
  els.userTenant.addEventListener('change', renderStoreOptions);
  els.userRole.addEventListener('change', updateUserStoreVisibility);
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    state.deferredInstallPrompt = event;
    els.installButton.hidden = false;
  });
  initializeSession();
}

async function initializeSession() {
  try {
    const data = await api('/api/session');
    applySession(data.user);
    await refreshAll();
  } catch {
    showLogin();
  }
}

async function login(event) {
  event.preventDefault();
  try {
    const data = await api('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username: els.username.value, password: els.password.value })
    });
    applySession(data.user);
    await refreshAll();
  } catch (error) {
    showToast(error.message);
  }
}

async function logout() {
  await api('/api/logout', { method: 'POST' });
  state.user = null;
  state.cart = [];
  showLogin();
}

function applySession(user) {
  state.user = user;
  els.loginView.hidden = true;
  els.dashboardView.hidden = false;
  els.logoutButton.hidden = false;
  document.body.dataset.role = user.role;
  document.querySelectorAll('.master-only').forEach((element) => {
    element.hidden = user.role !== 'master_admin';
  });
  document.querySelectorAll('.product-panel').forEach((element) => {
    element.hidden = user.role === 'cashier';
  });
  document.querySelectorAll('.sale-panel').forEach((element) => {
    element.hidden = user.role === 'master_admin';
  });
  els.storeForm.closest('.card').hidden = !['master_admin', 'tenant_owner'].includes(user.role);
  els.userForm.closest('.card').hidden = !canManageUsers();
  els.usersList.closest('.card').hidden = !canManageUsers();
  renderRoleOptions();
}

function showLogin() {
  els.loginView.hidden = false;
  els.dashboardView.hidden = true;
  els.logoutButton.hidden = true;
}

async function refreshAll() {
  const baseRequests = [api('/api/dashboard'), api('/api/stores'), api('/api/sales'), api('/api/products')];
  const adminRequests = canManageUsers() ? [api('/api/users')] : [Promise.resolve({ users: [] })];
  const tenantRequests = state.user.role === 'master_admin' ? [api('/api/tenants')] : [Promise.resolve({ tenants: [] })];
  const [dashboard, storesData, salesData, productsData, usersData, tenantsData] = await Promise.all([
    ...baseRequests,
    ...adminRequests,
    ...tenantRequests
  ]);
  state.stores = storesData.stores;
  state.sales = salesData.sales;
  state.products = productsData.products;
  state.users = usersData.users;
  state.tenants = tenantsData.tenants;
  renderDashboard(dashboard);
  renderTenantOptions();
  renderActiveStores();
  renderStoreOptions();
  renderLists();
  renderProductResults();
  renderCart();
}

async function refreshStoreData() {
  const qs = activeStoreId() ? `?store_id=${encodeURIComponent(activeStoreId())}` : '';
  const [productsData, salesData] = await Promise.all([api(`/api/products${qs}`), api('/api/sales')]);
  state.products = productsData.products;
  state.sales = salesData.sales;
  state.cart = [];
  renderLists();
  renderProductResults();
  renderCart();
}

function renderDashboard(data) {
  els.tenantCount.textContent = data.tenants;
  els.storeCount.textContent = data.stores;
  els.userCount.textContent = data.users;
  els.todayTotal.textContent = money(data.today_total);
}

function renderActiveStores() {
  els.activeStore.innerHTML = state.stores.map((store) => `<option value="${store.id}">${escapeHtml(store.business_name ? `${store.business_name} - ${store.name}` : store.name)}</option>`).join('');
  if (state.user.store_id) els.activeStore.value = state.user.store_id;
}

function renderTenantOptions() {
  const options = state.tenants.map((tenant) => `<option value="${tenant.id}">${escapeHtml(tenant.business_name)}</option>`).join('');
  els.storeTenant.innerHTML = options;
  els.userTenant.innerHTML = options;
}

function renderStoreOptions() {
  const tenantId = state.user.role === 'master_admin' ? els.userTenant.value : null;
  const stores = tenantId ? state.stores.filter((store) => store.tenant_id === tenantId) : state.stores;
  els.userStore.innerHTML = stores.map((store) => `<option value="${store.id}">${escapeHtml(store.name)}</option>`).join('');
}

function renderRoleOptions() {
  const roles = state.user.role === 'master_admin'
    ? [['tenant_owner', 'Dueno tienda'], ['branch_admin', 'Admin sucursal'], ['editor', 'Editor'], ['cashier', 'Cajera']]
    : state.user.role === 'tenant_owner'
      ? [['branch_admin', 'Admin sucursal'], ['editor', 'Editor'], ['cashier', 'Cajera']]
      : [['editor', 'Editor'], ['cashier', 'Cajera']];
  els.userRole.innerHTML = roles.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
  updateUserStoreVisibility();
}

function updateUserStoreVisibility() {
  const tenantOwner = els.userRole.value === 'tenant_owner';
  els.userStoreLabel.hidden = tenantOwner;
  els.userStore.disabled = tenantOwner;
}

function renderLists() {
  els.tenantsList.innerHTML = state.tenants.map((tenant) => `
    <div class="row"><strong>${escapeHtml(tenant.business_name)}</strong><div class="meta">${escapeHtml(tenant.owner_email || tenant.status)}</div></div>
  `).join('') || '<div class="meta">Sin clientes.</div>';

  els.storesList.innerHTML = state.stores.map((store) => `
    <div class="row"><strong>${escapeHtml(store.name)}</strong><div class="meta">${escapeHtml(store.business_name || '')}</div></div>
  `).join('') || '<div class="meta">Sin sucursales.</div>';

  els.usersList.innerHTML = state.users.map((user) => `
    <div class="row action-row">
      <div>
        <strong>${escapeHtml(user.name)}</strong>
        <div class="meta">${escapeHtml(user.username)} - ${roleLabel(user.role)} - ${escapeHtml(user.store_name || user.business_name || 'Global')}</div>
      </div>
      <button class="secondary mini" data-reset-password="${user.id}" data-username="${escapeHtml(user.username)}">Clave</button>
    </div>
  `).join('') || '<div class="meta">Sin usuarios.</div>';

  els.salesList.innerHTML = state.sales.map((sale) => `
    <div class="row">
      <strong>${money(sale.total)}</strong>
      <div class="meta">${escapeHtml(sale.store_name)} - ${paymentLabel(sale.payment_method)} - ${escapeHtml(sale.cashier_name || '')} ${formatDate(sale.local_created_at)}</div>
    </div>
  `).join('') || '<div class="meta">Sin ventas.</div>';

  els.productsList.innerHTML = state.products.map((product) => `
    <div class="row action-row">
      <div>
        <strong>${escapeHtml(product.name)}</strong>
        <div class="meta">${escapeHtml(product.barcode || product.sku || 'Sin codigo')} - ${money(product.sale_price)} - Stock ${number(product.stock)}</div>
      </div>
      ${canEditProducts() ? `<button class="secondary mini" data-edit-product="${product.id}">Editar</button>` : ''}
    </div>
  `).join('') || '<div class="meta">Sin productos.</div>';
}

function renderProductResults() {
  const term = els.productSearch.value.trim().toLowerCase();
  const products = state.products
    .filter((product) => !term || [product.name, product.barcode, product.sku].some((value) => String(value || '').toLowerCase().includes(term)))
    .slice(0, 8);
  els.productResults.innerHTML = products.map((product) => `
    <button type="button" class="row product-result" data-add-product="${product.id}">
      <span>${escapeHtml(product.name)}</span>
      <small>${money(product.sale_price)} - Stock ${number(product.stock)}</small>
    </button>
  `).join('');
}

function handleProductResultsClick(event) {
  const button = event.target.closest('[data-add-product]');
  if (!button) return;
  const product = state.products.find((item) => item.id === button.dataset.addProduct);
  if (!product) return;
  const existing = state.cart.find((item) => item.product_id === product.id);
  if (existing) existing.quantity += 1;
  else state.cart.push({ product_id: product.id, name: product.name, quantity: 1, sale_price: Number(product.sale_price || 0) });
  renderCart();
}

function renderCart() {
  els.cartList.innerHTML = state.cart.map((item) => `
    <div class="row action-row">
      <div><strong>${escapeHtml(item.name)}</strong><div class="meta">${number(item.quantity)} x ${money(item.sale_price)}</div></div>
      <div class="qty-actions">
        <button type="button" class="secondary mini" data-cart-minus="${item.product_id}">-</button>
        <button type="button" class="secondary mini" data-cart-plus="${item.product_id}">+</button>
      </div>
    </div>
  `).join('') || '<div class="meta">Carrito vacio.</div>';
  els.cartTotal.textContent = money(cartTotal());
  if (els.paymentMethod.value === 'cash') els.cashReceived.value = cartTotal() || '';
}

function handleCartClick(event) {
  const plus = event.target.closest('[data-cart-plus]');
  const minus = event.target.closest('[data-cart-minus]');
  const id = plus?.dataset.cartPlus || minus?.dataset.cartMinus;
  if (!id) return;
  const item = state.cart.find((cartItem) => cartItem.product_id === id);
  if (!item) return;
  item.quantity += plus ? 1 : -1;
  state.cart = state.cart.filter((cartItem) => cartItem.quantity > 0);
  renderCart();
}

async function saveSale(event) {
  event.preventDefault();
  try {
    const data = await api('/api/sales', {
      method: 'POST',
      body: JSON.stringify({
        store_id: activeStoreId(),
        items: state.cart,
        payment_method: els.paymentMethod.value,
        cash_received: els.cashReceived.value,
        qr_transaction_code: els.qrTransactionCode.value
      })
    });
    state.cart = [];
    els.saleForm.reset();
    updatePaymentFields();
    await refreshAll();
    showToast(`Venta guardada ${money(data.sale.total)}`);
  } catch (error) {
    showToast(error.message);
  }
}

function updatePaymentFields() {
  const cash = els.paymentMethod.value === 'cash';
  els.cashReceivedLabel.hidden = !cash;
  els.qrCodeLabel.hidden = cash;
  renderCart();
}

async function saveProduct(event) {
  event.preventDefault();
  try {
    const payload = {
      store_id: activeStoreId(),
      name: els.productName.value,
      barcode: els.productBarcode.value,
      sku: els.productSku.value,
      sale_price: els.productSalePrice.value,
      cost_price: els.productCostPrice.value,
      stock: els.productStock.value,
      min_stock: els.productMinStock.value
    };
    const id = els.productId.value;
    await api(id ? `/api/products/${id}` : '/api/products', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(payload)
    });
    els.productForm.reset();
    els.productId.value = '';
    await refreshAll();
    showToast('Producto guardado');
  } catch (error) {
    showToast(error.message);
  }
}

function handleProductsListClick(event) {
  const button = event.target.closest('[data-edit-product]');
  if (!button) return;
  const product = state.products.find((item) => item.id === button.dataset.editProduct);
  if (!product) return;
  els.productId.value = product.id;
  els.productName.value = product.name || '';
  els.productBarcode.value = product.barcode || '';
  els.productSku.value = product.sku || '';
  els.productSalePrice.value = product.sale_price || 0;
  els.productCostPrice.value = product.cost_price || 0;
  els.productStock.value = product.stock || 0;
  els.productMinStock.value = product.min_stock || 0;
}

async function saveTenant(event) {
  event.preventDefault();
  try {
    await api('/api/tenants', {
      method: 'POST',
      body: JSON.stringify({
        business_name: els.tenantBusinessName.value,
        owner_name: els.tenantOwnerName.value,
        owner_email: els.tenantOwnerEmail.value
      })
    });
    els.tenantForm.reset();
    await refreshAll();
    showToast('Cliente creado');
  } catch (error) {
    showToast(error.message);
  }
}

async function saveStore(event) {
  event.preventDefault();
  try {
    await api('/api/stores', {
      method: 'POST',
      body: JSON.stringify({
        tenant_id: els.storeTenant.value,
        name: els.storeName.value,
        address: els.storeAddress.value
      })
    });
    els.storeForm.reset();
    await refreshAll();
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
        tenant_id: els.userTenant.value,
        store_id: els.userRole.value === 'tenant_owner' ? null : els.userStore.value,
        name: els.userName.value,
        username: els.userUsername.value,
        email: els.userEmail.value,
        password: els.userPassword.value,
        role: els.userRole.value
      })
    });
    els.userForm.reset();
    await refreshAll();
    showToast('Usuario creado');
  } catch (error) {
    showToast(error.message);
  }
}

async function handleUserListClick(event) {
  const button = event.target.closest('[data-reset-password]');
  if (!button) return;
  const password = window.prompt(`Nueva contrasena para ${button.dataset.username}:`);
  if (password === null) return;
  if (password.trim().length < 4) return showToast('La contrasena debe tener al menos 4 caracteres');
  try {
    await api(`/api/users/${button.dataset.resetPassword}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password: password.trim() })
    });
    showToast('Contrasena actualizada');
  } catch (error) {
    showToast(error.message);
  }
}

async function installPwa() {
  if (!state.deferredInstallPrompt) return;
  state.deferredInstallPrompt.prompt();
  await state.deferredInstallPrompt.userChoice.catch(() => {});
  state.deferredInstallPrompt = null;
  els.installButton.hidden = true;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    credentials: 'same-origin',
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Error de servidor');
  return data;
}

function activeStoreId() {
  return els.activeStore.value || state.user?.store_id || state.stores[0]?.id || '';
}

function cartTotal() {
  return state.cart.reduce((sum, item) => sum + Number(item.sale_price || 0) * Number(item.quantity || 0), 0);
}

function canManageUsers() {
  return ['master_admin', 'tenant_owner', 'branch_admin'].includes(state.user?.role);
}

function canEditProducts() {
  return ['master_admin', 'tenant_owner', 'branch_admin', 'editor'].includes(state.user?.role);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    els.toast.hidden = true;
  }, 3200);
}

function money(value) {
  return `Bs ${Number(value || 0).toFixed(2)}`;
}

function number(value) {
  return Number(value || 0).toLocaleString('es-BO', { maximumFractionDigits: 2 });
}

function paymentLabel(value) {
  return { cash: 'Efectivo', qr: 'QR' }[value] || value || 'Pago';
}

function roleLabel(value) {
  return {
    master_admin: 'Admin maestro',
    tenant_owner: 'Dueno tienda',
    branch_admin: 'Admin sucursal',
    editor: 'Editor',
    cashier: 'Cajera'
  }[value] || value;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString('es-BO') : '';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}
