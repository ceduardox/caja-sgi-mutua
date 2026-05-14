const state = {
  user: null,
  tenants: [],
  stores: [],
  users: [],
  sales: []
};

const els = {
  loginView: document.querySelector('#loginView'),
  dashboardView: document.querySelector('#dashboardView'),
  loginForm: document.querySelector('#loginForm'),
  username: document.querySelector('#username'),
  password: document.querySelector('#password'),
  logoutButton: document.querySelector('#logoutButton'),
  tenantCount: document.querySelector('#tenantCount'),
  storeCount: document.querySelector('#storeCount'),
  userCount: document.querySelector('#userCount'),
  todayTotal: document.querySelector('#todayTotal'),
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
  toast: document.querySelector('#toast')
};

boot();

function boot() {
  els.loginForm.addEventListener('submit', login);
  els.logoutButton.addEventListener('click', logout);
  els.tenantForm.addEventListener('submit', saveTenant);
  els.storeForm.addEventListener('submit', saveStore);
  els.userForm.addEventListener('submit', saveUser);
  els.userTenant.addEventListener('change', renderStoreOptions);
  els.userRole.addEventListener('change', updateUserStoreVisibility);
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
  renderRoleOptions();
}

function showLogin() {
  els.loginView.hidden = false;
  els.dashboardView.hidden = true;
  els.logoutButton.hidden = true;
}

async function refreshAll() {
  const requests = [api('/api/dashboard'), api('/api/stores'), api('/api/users'), api('/api/sales')];
  if (state.user.role === 'master_admin') requests.push(api('/api/tenants'));
  const [dashboard, storesData, usersData, salesData, tenantsData] = await Promise.all(requests);
  state.stores = storesData.stores;
  state.users = usersData.users;
  state.sales = salesData.sales;
  state.tenants = tenantsData?.tenants || [];
  renderDashboard(dashboard);
  renderTenantOptions();
  renderStoreOptions();
  renderLists();
}

function renderDashboard(data) {
  els.tenantCount.textContent = data.tenants;
  els.storeCount.textContent = data.stores;
  els.userCount.textContent = data.users;
  els.todayTotal.textContent = money(data.today_total);
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
    <div class="row"><strong>${escapeHtml(user.name)}</strong><div class="meta">${escapeHtml(user.username)} - ${roleLabel(user.role)} - ${escapeHtml(user.store_name || user.business_name || 'Global')}</div></div>
  `).join('') || '<div class="meta">Sin usuarios.</div>';

  els.salesList.innerHTML = state.sales.map((sale) => `
    <div class="row"><strong>${money(sale.total)}</strong><div class="meta">${escapeHtml(sale.store_name)} - ${paymentLabel(sale.payment_method)} - ${formatDate(sale.local_created_at)}</div></div>
  `).join('') || '<div class="meta">Sin ventas sincronizadas.</div>';
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
