const state = {
  products: [],
  categories: [],
  stores: [],
  users: [],
  sales: [],
  cashShift: null,
  cashShifts: [],
  stockMovements: [],
  settings: { sku_enabled: false },
  user: null,
  activeStore: null,
  cart: new Map(),
  lastSale: null,
  lastReport: null
};

const DEFAULT_CATEGORY_NAMES = [
  'Abarrotes',
  'Agua',
  'Alfombras',
  'Bebidas',
  'Carnes',
  'Cereales',
  'Condimentos',
  'Congelados',
  'Dulces',
  'Embutidos',
  'Enlatados',
  'Farmacia',
  'Frutas',
  'Galletas',
  'Granos',
  'Helados',
  'Higiene personal',
  'Lacteos',
  'Limpieza',
  'Mascotas',
  'Panaderia',
  'Papeleria',
  'Pastas',
  'Perfumeria',
  'Plasticos',
  'Reposteria',
  'Snacks',
  'Verduras',
  'Vinos y licores',
  'Desechables'
];

const ACTIVE_VIEW_KEY = 'sgi_market_active_view';

const els = {
  tabs: document.querySelectorAll('.tab'),
  views: document.querySelectorAll('.view'),
  scanInput: document.querySelector('#scanInput'),
  scanCameraButton: document.querySelector('#scanCameraButton'),
  searchResults: document.querySelector('#searchResults'),
  cartItems: document.querySelector('#cartItems'),
  cartTotal: document.querySelector('#cartTotal'),
  checkoutButton: document.querySelector('#checkoutButton'),
  clearCartButton: document.querySelector('#clearCartButton'),
  productList: document.querySelector('#productList'),
  productManagerList: document.querySelector('#productManagerList'),
  productSearchInput: document.querySelector('#productSearchInput'),
  productCategoryFilter: document.querySelector('#productCategoryFilter'),
  productStockFilter: document.querySelector('#productStockFilter'),
  productStatusFilter: document.querySelector('#productStatusFilter'),
  categoryForm: document.querySelector('#categoryForm'),
  newCategoryName: document.querySelector('#newCategoryName'),
  salesList: document.querySelector('#salesList'),
  todayTotal: document.querySelector('#todayTotal'),
  todayCount: document.querySelector('#todayCount'),
  lowStock: document.querySelector('#lowStock'),
  pendingSync: document.querySelector('#pendingSync'),
  cashShiftStatus: document.querySelector('#cashShiftStatus'),
  cashShiftActions: document.querySelector('#cashShiftActions'),
  connectionDot: document.querySelector('#connectionDot'),
  connectionText: document.querySelector('#connectionText'),
  currentUserLabel: document.querySelector('#currentUserLabel'),
  logoutButton: document.querySelector('#logoutButton'),
  activeStoreControl: document.querySelector('#activeStoreControl'),
  activeStoreSelect: document.querySelector('#activeStoreSelect'),
  loginOverlay: document.querySelector('#loginOverlay'),
  loginForm: document.querySelector('#loginForm'),
  loginUsername: document.querySelector('#loginUsername'),
  loginPassword: document.querySelector('#loginPassword'),
  toggleLoginPassword: document.querySelector('#toggleLoginPassword'),
  rememberSession: document.querySelector('#rememberSession'),
  loginMessage: document.querySelector('#loginMessage'),
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
  systemSettingsPanel: document.querySelector('#systemSettingsPanel'),
  skuEnabledToggle: document.querySelector('#skuEnabledToggle'),
  rolePermissionsList: document.querySelector('#rolePermissionsList'),
  productDialog: document.querySelector('#productDialog'),
  productForm: document.querySelector('#productForm'),
  productDialogTitle: document.querySelector('#productDialogTitle'),
  productQuickFlow: document.querySelector('#productQuickFlow'),
  productStepCounter: document.querySelector('#productStepCounter'),
  productStepTitle: document.querySelector('#productStepTitle'),
  productStepBar: document.querySelector('#productStepBar'),
  productFullFormButton: document.querySelector('#productFullFormButton'),
  productQuickActions: document.querySelector('#productQuickActions'),
  productPrevStepButton: document.querySelector('#productPrevStepButton'),
  productNextStepButton: document.querySelector('#productNextStepButton'),
  productId: document.querySelector('#productId'),
  productImageValue: document.querySelector('#productImageValue'),
  productImagePreview: document.querySelector('#productImagePreview'),
  productImageInput: document.querySelector('#productImageInput'),
  mobileCameraInput: document.querySelector('#mobileCameraInput'),
  openCameraButton: document.querySelector('#openCameraButton'),
  removeProductImage: document.querySelector('#removeProductImage'),
  productName: document.querySelector('#productName'),
  productBarcode: document.querySelector('#productBarcode'),
  productBarcodeCameraButton: document.querySelector('#productBarcodeCameraButton'),
  barcodeScanHint: document.querySelector('#barcodeScanHint'),
  productBarcodeError: document.querySelector('#productBarcodeError'),
  productSku: document.querySelector('#productSku'),
  productCategoryName: document.querySelector('#productCategoryName'),
  productCategoryOptions: document.querySelector('#productCategoryOptions'),
  productSalePrice: document.querySelector('#productSalePrice'),
  productCostPrice: document.querySelector('#productCostPrice'),
  productStock: document.querySelector('#productStock'),
  productMinStock: document.querySelector('#productMinStock'),
  productDescription: document.querySelector('#productDescription'),
  productActive: document.querySelector('#productActive'),
  productNameError: document.querySelector('#productNameError'),
  newProductButton: document.querySelector('#newProductButton'),
  scanNewProductButton: document.querySelector('#scanNewProductButton'),
  focusBarcodeButton: document.querySelector('#focusBarcodeButton'),
  closeProductDialog: document.querySelector('#closeProductDialog'),
  receiptDialog: document.querySelector('#receiptDialog'),
  receiptContent: document.querySelector('#receiptContent'),
  printReceiptButton: document.querySelector('#printReceiptButton'),
  closeReceiptButton: document.querySelector('#closeReceiptButton'),
  editPasswordDialog: document.querySelector('#editPasswordDialog'),
  editPasswordForm: document.querySelector('#editPasswordForm'),
  editPasswordUserId: document.querySelector('#editPasswordUserId'),
  editPasswordUserLabel: document.querySelector('#editPasswordUserLabel'),
  editPasswordNew: document.querySelector('#editPasswordNew'),
  editPasswordConfirm: document.querySelector('#editPasswordConfirm'),
  closeEditPasswordDialog: document.querySelector('#closeEditPasswordDialog'),
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
  barcodeCameraDialog: document.querySelector('#barcodeCameraDialog'),
  closeBarcodeCameraDialog: document.querySelector('#closeBarcodeCameraDialog'),
  barcodeCameraVideo: document.querySelector('#barcodeCameraVideo'),
  barcodeCameraCanvas: document.querySelector('#barcodeCameraCanvas'),
  barcodeCameraStatus: document.querySelector('#barcodeCameraStatus'),
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
  cashShiftList: document.querySelector('#cashShiftList'),
  stockMovementList: document.querySelector('#stockMovementList'),
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
let barcodeCameraStream;
let barcodeScannerMode = 'pos';
let barcodeDetector;
let barcodeScanTimer;
let zxingControls;
let zxingReader;
let waitingProductBarcodeScan = false;
let productBarcodeBuffer = '';
let productBarcodeTimer;
let chartsResizeObserver;
let mobileDevice = false;
let posSearchRequestId = 0;
let productQuickStep = 0;

const PRODUCT_QUICK_STEPS = [
  { title: 'Codigo de barras', focus: () => els.productBarcode },
  { title: 'Nombre', focus: () => els.productName },
  { title: 'Categoria', focus: () => state.settings.sku_enabled ? els.productSku : els.productCategoryName },
  { title: 'Precio y costo', focus: () => els.productSalePrice },
  { title: 'Stock', focus: () => els.productStock },
  { title: 'Foto y detalle', focus: () => null }
];

boot();

function boot() {
  configureDeviceUi();
  setDefaultReportDates();
  bindEvents();
  initializeSession();
  setInterval(() => {
    if (canSell(state.user?.role)) refreshSummary().catch(() => {});
  }, 15000);
  renderIcons();
}

function configureDeviceUi() {
  mobileDevice = isMobileDevice();
  document.body.classList.toggle('is-mobile-device', mobileDevice);
  document.body.classList.toggle('is-desktop-device', !mobileDevice);
}

function bindEvents() {
  els.tabs.forEach((tab) => {
    tab.addEventListener('click', () => showView(tab.dataset.view));
  });
  els.loginForm.addEventListener('submit', login);
  els.toggleLoginPassword.addEventListener('click', toggleLoginPassword);
  els.storeForm.addEventListener('submit', saveStore);
  els.storesList.addEventListener('click', handleStoreListClick);
  els.userForm.addEventListener('submit', saveUser);
  els.usersList.addEventListener('click', handleUsersListClick);
  els.userRole.addEventListener('change', updateUserFormPermissions);
  els.skuEnabledToggle.addEventListener('change', saveSettings);
  els.activeStoreSelect.addEventListener('change', changeActiveStore);
  els.salesList.addEventListener('click', handleSaleAction);
  els.reportSalesList.addEventListener('click', handleSaleAction);
  els.cashShiftActions.addEventListener('click', handleCashShiftAction);
  els.scanInput.addEventListener('input', handleSearch);
  els.scanInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addScannedProduct();
    }
  });
  els.scanCameraButton.addEventListener('click', () => openBarcodeCamera('pos'));
  els.productSearchInput.addEventListener('input', debounce(() => loadProducts(els.productSearchInput.value.trim(), { manager: true }), 180));
  [els.productCategoryFilter, els.productStockFilter, els.productStatusFilter].forEach((input) => {
    input.addEventListener('change', () => loadProducts(els.productSearchInput.value.trim(), { manager: true }));
  });
  els.categoryForm.addEventListener('submit', saveCategory);
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
  els.productBarcodeCameraButton.addEventListener('click', () => openBarcodeCamera('product'));
  els.productBarcode.addEventListener('input', handleProductBarcodeInput);
  els.productName.addEventListener('input', () => validateProductNameDuplicate({ silent: true }));
  els.productBarcode.addEventListener('input', () => validateProductBarcodeDuplicate({ silent: true }));
  els.productBarcode.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      finishProductBarcodeScan();
    }
  });
  document.addEventListener('keydown', handleGlobalBarcodeScan, true);
  els.closeProductDialog.addEventListener('click', () => els.productDialog.close());
  els.productForm.addEventListener('submit', saveProduct);
  els.productFullFormButton.addEventListener('click', showFullProductForm);
  els.productPrevStepButton.addEventListener('click', previousProductStep);
  els.productNextStepButton.addEventListener('click', nextProductStep);
  els.productForm.addEventListener('keydown', handleProductFormKeydown);
  els.productImageInput.addEventListener('change', handleImageInput);
  els.mobileCameraInput.addEventListener('change', handleImageInput);
  els.openCameraButton.addEventListener('click', openCameraCapture);
  els.closeCameraDialog.addEventListener('click', closeCameraCapture);
  els.cameraDialog.addEventListener('close', stopCameraStream);
  els.closeBarcodeCameraDialog.addEventListener('click', closeBarcodeCamera);
  els.barcodeCameraDialog.addEventListener('close', stopBarcodeCamera);
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
  els.editPasswordForm.addEventListener('submit', saveEditedPassword);
  els.closeEditPasswordDialog.addEventListener('click', () => els.editPasswordDialog.close());
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
  els.logoutButton.addEventListener('click', logout);
  window.addEventListener('resize', debounce(resizeCharts, 120));
  if (window.ResizeObserver) {
    chartsResizeObserver = new ResizeObserver(() => resizeCharts());
    [els.salesTrendChart, els.productsChart, els.paymentsChart, els.stockChart].forEach((element) => {
      if (element) chartsResizeObserver.observe(element);
    });
  }
}

async function refreshAll() {
  await loadSettings();
  if (canManageAdmin(state.user?.role)) await loadAdminData();
  const tasks = [loadCategories(), loadProducts('', { manager: state.user?.role === 'editor' }), checkHealth()];
  if (canSell(state.user?.role)) tasks.push(refreshSummary(), loadSales(), loadOpenCashShift());
  if (canViewReports(state.user?.role)) tasks.push(loadReports(), loadCashShifts(), loadStockMovements());
  await Promise.all(tasks);
}

async function initializeSession() {
  try {
    const data = await api('/api/session');
    applySession(data.user, data.store);
    await refreshAll();
    restoreSavedView();
  } catch {
    els.loginOverlay.classList.add('active');
    renderIcons();
  }
}

async function login(event) {
  event.preventDefault();
  setLoginMessage('Validando acceso...', 'info');
  const submitButton = els.loginForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    const data = await api('/api/login', {
      method: 'POST',
      body: JSON.stringify({
        username: els.loginUsername.value,
        password: els.loginPassword.value,
        remember: els.rememberSession.checked
      })
    });
    applySession(data.user, data.store);
    setLoginMessage('', 'info');
    els.loginOverlay.classList.remove('active');
    await refreshAll();
    restoreSavedView();
  } catch (error) {
    setLoginMessage(error.message, 'error');
    showToast(error.message);
  } finally {
    submitButton.disabled = false;
  }
}

function toggleLoginPassword() {
  const visible = els.loginPassword.type === 'text';
  els.loginPassword.type = visible ? 'password' : 'text';
  els.toggleLoginPassword.setAttribute('aria-label', visible ? 'Mostrar contrasena' : 'Ocultar contrasena');
  els.toggleLoginPassword.innerHTML = `<i data-lucide="${visible ? 'eye' : 'eye-off'}"></i>`;
  renderIcons();
  els.loginPassword.focus();
}

function applySession(user, store) {
  state.user = user;
  state.activeStore = store || null;
  els.currentUserLabel.textContent = isGlobalAdmin(user.role)
    ? `${user.name} - Administrador general`
    : `${user.name} - ${store?.name || user.store_name || 'Sin sucursal'}`;
  els.activeStoreControl.hidden = !isGlobalAdmin(user.role);
  els.logoutButton.hidden = false;
  if (isGlobalAdmin(user.role) && store) {
    els.activeStoreSelect.dataset.currentStore = store.id;
  }
  document.body.dataset.role = user.role;
  document.querySelectorAll('.tab').forEach((tab) => {
    const view = tab.dataset.view;
    const allowed = canAccessView(user.role, view);
    tab.hidden = !allowed;
  });
  const currentView = document.querySelector('.view.active')?.id || 'posView';
  if (!canAccessView(user.role, currentView)) {
    showView(defaultViewForRole(user.role));
  }
  renderIcons();
}

async function logout() {
  try {
    await api('/api/logout', { method: 'POST' });
  } catch {
    // La salida local igual debe limpiar la pantalla aunque el servidor no responda.
  }
  state.user = null;
  state.activeStore = null;
  state.cart.clear();
  els.logoutButton.hidden = true;
  els.loginOverlay.classList.add('active');
  setLoginMessage('', 'info');
  renderCart();
}

async function loadAdminData() {
  if (!canManageAdmin(state.user?.role)) return;
  const [storesData, usersData] = await Promise.all([api('/api/stores'), api('/api/users')]);
  state.stores = storesData.stores || [];
  state.users = usersData.users || [];
  renderStores(state.stores);
  renderUsers(state.users);
  renderRolePermissions();
  updateUserFormPermissions();
}

async function loadSettings() {
  const data = await api('/api/settings');
  state.settings = { sku_enabled: false, ...(data.settings || {}) };
  applySettingsUi();
}

function applySettingsUi() {
  const enabled = Boolean(state.settings.sku_enabled);
  document.body.classList.toggle('sku-enabled', enabled);
  document.body.classList.toggle('sku-disabled', !enabled);
  els.systemSettingsPanel.hidden = state.user?.role !== 'master_admin';
  els.skuEnabledToggle.checked = enabled;
  els.scanInput.placeholder = enabled ? 'Codigo de barras, SKU o nombre' : 'Codigo de barras o nombre';
  els.productSearchInput.placeholder = enabled ? 'Nombre, codigo de barras o SKU' : 'Nombre o codigo de barras';
}

async function saveSettings() {
  try {
    const data = await api('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ sku_enabled: els.skuEnabledToggle.checked })
    });
    state.settings = data.settings;
    applySettingsUi();
    renderProducts();
    renderProductManager();
    showToast('Configuracion actualizada');
  } catch (error) {
    els.skuEnabledToggle.checked = Boolean(state.settings.sku_enabled);
    showToast(error.message);
  }
}

function renderStores(stores) {
  els.userStore.innerHTML = stores.map((store) => `<option value="${store.id}">${escapeHtml(store.name)}</option>`).join('');
  if (isGlobalAdmin(state.user?.role)) {
    const currentStoreId = els.activeStoreSelect.dataset.currentStore || state.activeStore?.id || stores[0]?.id || '';
    els.activeStoreSelect.innerHTML = stores.map((store) => `<option value="${store.id}">${escapeHtml(store.name)}</option>`).join('');
    els.activeStoreSelect.value = currentStoreId;
  }
  els.storeForm.hidden = !isGlobalAdmin(state.user?.role);
  els.storesList.innerHTML = stores.map((store) => `
    <div class="data-row">
      <span class="row-icon"><i data-lucide="store"></i></span>
      <div>
        <strong>${escapeHtml(store.name)}</strong>
        <div class="meta">${store.license_status || 'trial'}</div>
      </div>
      ${isGlobalAdmin(state.user?.role) ? `<button class="secondary" data-rename-store="${store.id}" data-store-name="${escapeHtml(store.name)}"><i data-lucide="pencil"></i>Renombrar</button>` : ''}
    </div>
  `).join('') || '<div class="empty">Sin sucursales.</div>';
  renderIcons();
}

async function changeActiveStore() {
  if (!isGlobalAdmin(state.user?.role)) return;
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
    await Promise.all([loadCategories(), loadProducts('', { manager: document.querySelector('#productsView')?.classList.contains('active') }), refreshSummary(), loadSales(), loadReports()]);
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
    <div class="data-row user-row">
      <span class="row-icon"><i data-lucide="${isGlobalAdmin(user.role) || user.role === 'branch_admin' ? 'shield-check' : 'badge'}"></i></span>
      <div>
        <strong>${escapeHtml(user.name)}</strong>
        <div class="meta">${escapeHtml(user.username)} - ${roleLabel(user.role)} - ${escapeHtml(user.store_name || 'Todas las sucursales')}</div>
      </div>
      <div class="user-actions">
        <span class="pill">${user.active ? 'Activo' : 'Inactivo'}</span>
        ${canChangeUserPassword(user) ? `<button class="secondary mini-button" type="button" data-change-password="${user.id}"><i data-lucide="key-round"></i>Clave</button>` : ''}
      </div>
    </div>
  `).join('') || '<div class="empty">Sin usuarios.</div>';
  renderIcons();
}

function renderRolePermissions() {
  if (!els.rolePermissionsList) return;
  const permissions = [
    { role: 'master_admin', name: 'Admin maestro', items: ['Todas las sucursales', 'Vender', 'Reportes', 'Productos', 'Usuarios', 'Correcciones'] },
    { role: 'tenant_owner', name: 'Admin general', items: ['Su negocio', 'Vender', 'Reportes', 'Productos', 'Usuarios', 'Correcciones'] },
    { role: 'branch_admin', name: 'Admin sucursal', items: ['Su sucursal', 'Vender', 'Reportes', 'Productos', 'Cajeras/Editores', 'Correcciones'] },
    { role: 'editor', name: 'Editor', items: ['Solo productos', 'Crear productos', 'Editar productos', 'Imagenes', 'Categorias'] },
    { role: 'cashier', name: 'Cajera', items: ['Solo caja', 'Vender', 'Imprimir recibos', 'Buscar productos'] }
  ];
  els.rolePermissionsList.innerHTML = permissions.map((role) => `
    <div class="permission-card">
      <div>
        <span class="row-icon"><i data-lucide="${role.role === 'cashier' ? 'badge' : role.role === 'editor' ? 'package' : 'shield-check'}"></i></span>
        <strong>${role.name}</strong>
      </div>
      <div class="permission-tags">
        ${role.items.map((item) => `<span>${item}</span>`).join('')}
      </div>
    </div>
  `).join('');
  renderIcons();
}

function handleUsersListClick(event) {
  const button = event.target.closest('[data-change-password]');
  if (!button) return;
  openEditPasswordDialog(button.dataset.changePassword);
}

function openEditPasswordDialog(userId) {
  const user = state.users.find((item) => item.id === userId);
  if (!user) {
    showToast('Usuario no encontrado. Actualiza la pagina e intenta de nuevo.');
    return;
  }
  if (!canChangeUserPassword(user)) {
    showToast('No tienes permiso para cambiar la contrasena de este usuario');
    return;
  }
  clearFieldErrors(els.editPasswordForm);
  els.editPasswordForm.reset();
  els.editPasswordUserId.value = user.id;
  els.editPasswordUserLabel.value = `${user.name} (${user.username})`;
  els.editPasswordDialog.showModal();
  setTimeout(() => els.editPasswordNew.focus(), 50);
}

async function saveEditedPassword(event) {
  event.preventDefault();
  clearFieldErrors(els.editPasswordForm);
  const userId = els.editPasswordUserId.value;
  if (!requireField(els.editPasswordNew, 'Escribe la nueva contrasena')) return;
  if (els.editPasswordNew.value.trim().length < 4) {
    markFieldError(els.editPasswordNew, 'La contrasena debe tener al menos 4 caracteres');
    return;
  }
  if (!requireField(els.editPasswordConfirm, 'Confirma la nueva contrasena')) return;
  if (els.editPasswordNew.value !== els.editPasswordConfirm.value) {
    markFieldError(els.editPasswordConfirm, 'Las contrasenas no coinciden');
    return;
  }
  try {
    await api(`/api/users/${userId}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ password: els.editPasswordNew.value })
    });
    els.editPasswordDialog.close();
    els.editPasswordForm.reset();
    await loadAdminData();
    showToast('Contrasena actualizada');
  } catch (error) {
    handleFormError(error, { password: els.editPasswordNew });
  }
}

function updateUserFormPermissions() {
  const isOwner = isGlobalAdmin(state.user?.role);
  const options = state.user?.role === 'master_admin'
    ? [
      ['cashier', 'Cajera'],
      ['editor', 'Editor'],
      ['branch_admin', 'Admin sucursal'],
      ['tenant_owner', 'Dueno tienda']
    ]
    : isOwner
    ? [
      ['cashier', 'Cajera'],
      ['editor', 'Editor'],
      ['branch_admin', 'Admin sucursal']
    ]
    : [
      ['cashier', 'Cajera'],
      ['editor', 'Editor']
    ];
  const currentRole = options.some(([value]) => value === els.userRole.value) ? els.userRole.value : options[0][0];
  els.userRole.innerHTML = options.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
  els.userRole.value = currentRole;
  const ownerTarget = ['owner', 'tenant_owner'].includes(els.userRole.value);
  els.userStore.disabled = ownerTarget || !isOwner;
  els.userStore.required = !ownerTarget;
}

async function saveStore(event) {
  event.preventDefault();
  clearFieldErrors(els.storeForm);
  if (!requireField(els.storeName, 'Escribe el nombre de la sucursal')) return;
  try {
    const activeStore = (state.stores || []).find((store) => store.id === (els.activeStoreSelect.value || state.activeStore?.id));
    await api('/api/stores', {
      method: 'POST',
      body: JSON.stringify({ name: els.storeName.value, tenant_id: activeStore?.tenant_id })
    });
    els.storeName.value = '';
    await loadAdminData();
    showToast('Sucursal creada');
  } catch (error) {
    handleFormError(error, { name: els.storeName, tenant_id: els.activeStoreSelect });
  }
}

async function saveUser(event) {
  event.preventDefault();
  clearFieldErrors(els.userForm);
  if (!requireField(els.userName, 'Escribe el nombre completo')) return;
  if (!requireField(els.userUsername, 'Escribe el usuario de acceso')) return;
  if (!requireField(els.userPassword, 'Escribe una contrasena temporal')) return;
  if (els.userPassword.value.trim().length < 4) {
    markFieldError(els.userPassword, 'La contrasena debe tener al menos 4 caracteres');
    return;
  }
  const roleNeedsStore = !['owner', 'tenant_owner'].includes(els.userRole.value);
  if (roleNeedsStore && !requireField(els.userStore, 'Selecciona la sucursal del usuario')) return;
  try {
    const selectedStore = (state.stores || []).find((store) => store.id === els.userStore.value);
    if (roleNeedsStore && !selectedStore) {
      markFieldError(els.userStore, 'La sucursal seleccionada no esta cargada. Actualiza la pagina e intenta de nuevo.');
      return;
    }
    await api('/api/users', {
      method: 'POST',
      body: JSON.stringify({
        name: els.userName.value,
        username: els.userUsername.value,
        password: els.userPassword.value,
        tenant_id: selectedStore?.tenant_id || state.user?.tenant_id,
        store_id: ['owner', 'tenant_owner'].includes(els.userRole.value) ? null : els.userStore.value,
        role: els.userRole.value
      })
    });
    els.userForm.reset();
    await loadAdminData();
    showToast('Usuario creado');
  } catch (error) {
    handleFormError(error, {
      name: els.userName,
      username: els.userUsername,
      password: els.userPassword,
      store_id: els.userStore,
      tenant_id: els.userStore,
      role: els.userRole
    });
  }
}

function showView(viewId) {
  if (!canAccessView(state.user?.role, viewId)) {
    showToast('No tienes permiso para abrir este modulo');
    viewId = defaultViewForRole(state.user?.role);
  }
  saveActiveView(viewId);
  els.tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.view === viewId));
  els.views.forEach((view) => view.classList.toggle('active', view.id === viewId));
  if (viewId === 'productsView') {
    document.querySelector('.tab[data-view="productsView"]')?.classList.remove('attention');
    loadProducts(els.productSearchInput.value.trim(), { manager: true }).catch((error) => showToast(error.message));
  }
  if (viewId === 'posView') {
    loadProducts('', { manager: false }).catch((error) => showToast(error.message));
    els.scanInput.focus();
  }
  if (viewId === 'productsView') els.productSearchInput.focus();
  if (viewId === 'reportsView') {
    loadReports().then(() => window.setTimeout(resizeCharts, 80));
    loadCashShifts().catch((error) => showToast(error.message));
    loadStockMovements().catch((error) => showToast(error.message));
  }
}

function saveActiveView(viewId) {
  try {
    window.localStorage.setItem(ACTIVE_VIEW_KEY, viewId);
  } catch {
    // Si el navegador bloquea localStorage, la navegacion sigue funcionando.
  }
}

function restoreSavedView() {
  let savedView = '';
  try {
    savedView = window.localStorage.getItem(ACTIVE_VIEW_KEY) || '';
  } catch {
    savedView = '';
  }
  showView(canAccessView(state.user?.role, savedView) ? savedView : defaultViewForRole(state.user?.role));
}

async function checkHealth() {
  try {
    await api('/api/health');
    els.connectionDot.style.background = '#33c481';
    els.connectionText.textContent = 'Online activo';
  } catch {
    els.connectionDot.style.background = '#b73535';
    els.connectionText.textContent = 'Sin conexion';
  }
}

async function loadCategories() {
  if (state.user?.role === 'cashier') return;
  const params = new URLSearchParams();
  const storeId = activeStoreId();
  if (storeId) params.set('store_id', storeId);
  const data = await api(`/api/categories${params.toString() ? `?${params}` : ''}`);
  state.categories = data.categories || [];
  renderCategoryControls();
}

function renderCategoryControls() {
  const selected = els.productCategoryFilter.value;
  const options = state.categories.map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`).join('');
  els.productCategoryFilter.innerHTML = `<option value="">Todas</option>${options}`;
  if (state.categories.some((category) => category.id === selected)) els.productCategoryFilter.value = selected;
  const names = [...new Set([
    ...state.categories.map((category) => category.name),
    ...DEFAULT_CATEGORY_NAMES
  ].filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  els.productCategoryOptions.innerHTML = names.map((name) => `<option value="${escapeHtml(name)}"></option>`).join('');
}

async function saveCategory(event) {
  event.preventDefault();
  clearFieldErrors(els.categoryForm);
  if (!requireField(els.newCategoryName, 'Escribe el nombre de la categoria')) return;
  try {
    await api('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name: els.newCategoryName.value, store_id: activeStoreId() })
    });
    els.newCategoryName.value = '';
    await loadCategories();
    showToast('Categoria agregada');
  } catch (error) {
    handleFormError(error, { name: els.newCategoryName });
  }
}

async function loadProducts(query = '', options = {}) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  const storeId = activeStoreId();
  if (storeId) params.set('store_id', storeId);
  if (options.manager) {
    params.set('status', els.productStatusFilter.value || 'all');
    if (els.productCategoryFilter.value) params.set('category_id', els.productCategoryFilter.value);
    if (els.productStockFilter.value) params.set('stock', els.productStockFilter.value);
  } else {
    params.set('status', 'active');
  }
  const data = await api(`/api/products${params.toString() ? `?${params}` : ''}`);
  if (options.posSearchRequestId && options.posSearchRequestId !== posSearchRequestId) return;
  state.products = data.products;
  renderProducts();
  renderProductManager();
  renderSearchResults(query && document.activeElement === els.scanInput ? filterPosProducts(query, data.products) : []);
}

async function loadSales() {
  const storeId = activeStoreId();
  const data = await api(`/api/sales${storeId ? `?store_id=${encodeURIComponent(storeId)}` : ''}`);
  state.sales = data.sales;
  els.salesList.innerHTML = data.sales.map((sale) => `
    <div class="sale-row">
      <div>
        <span class="row-icon"><i data-lucide="receipt-text"></i></span>
        <strong>${money(sale.total)}</strong>
        <div class="meta">${formatDate(sale.created_at)} - ${paymentLabel(sale.payment_method)}${sale.cashier_name ? ` - ${escapeHtml(sale.cashier_name)}` : ''}${sale.status === 'void' ? ` - Anulada: ${escapeHtml(sale.void_reason || '')}` : ''}</div>
      </div>
      <div class="sale-side">
        <span class="pill ${sale.status === 'void' ? 'void' : ''}"><i data-lucide="${sale.status === 'void' ? 'ban' : 'check'}"></i>${sale.status === 'void' ? 'Anulada' : 'Completada'}</span>
        ${renderSaleActions(sale)}
      </div>
    </div>
  `).join('') || '<div class="empty">Sin ventas registradas.</div>';
  renderIcons();
}

async function loadOpenCashShift() {
  if (!canSell(state.user?.role)) return;
  const data = await api('/api/cash-shifts/open');
  state.cashShift = data.shift || null;
  renderCashShiftStatus();
}

function renderCashShiftStatus() {
  if (!els.cashShiftStatus || !els.cashShiftActions) return;
  if (!state.cashShift) {
    els.cashShiftStatus.innerHTML = '<div class="empty compact">Sin turno abierto.</div>';
    els.cashShiftActions.innerHTML = '<button class="secondary" type="button" data-open-shift><i data-lucide="unlock-keyhole"></i>Abrir turno</button>';
    renderIcons();
    return;
  }
  els.cashShiftStatus.innerHTML = `
    <div class="shift-card">
      <span>Abierto</span>
      <strong>${formatDate(state.cashShift.opened_at)}</strong>
      <small>Inicial ${money(state.cashShift.opening_cash || 0)}</small>
    </div>
  `;
  els.cashShiftActions.innerHTML = '<button class="primary small" type="button" data-close-shift><i data-lucide="lock-keyhole"></i>Cerrar caja</button>';
  renderIcons();
}

async function handleCashShiftAction(event) {
  const openButton = event.target.closest('[data-open-shift]');
  const closeButton = event.target.closest('[data-close-shift]');
  if (!openButton && !closeButton) return;
  try {
    if (openButton) await openCashShift();
    if (closeButton) await closeCashShift();
    await Promise.all([loadOpenCashShift(), loadCashShifts()]);
  } catch (error) {
    showToast(error.message);
  }
}

async function openCashShift() {
  const amount = window.prompt('Efectivo inicial en caja:', '0');
  if (amount === null) return;
  await api('/api/cash-shifts/open', {
    method: 'POST',
    body: JSON.stringify({ opening_cash: parseNumber(amount), store_id: activeStoreId() })
  });
  showToast('Turno abierto');
}

async function closeCashShift() {
  if (!state.cashShift) return;
  const amount = window.prompt('Efectivo contado al cerrar:', '0');
  if (amount === null) return;
  const notes = window.prompt('Nota del cierre (opcional):', '') ?? '';
  const data = await api(`/api/cash-shifts/${state.cashShift.id}/close`, {
    method: 'POST',
    body: JSON.stringify({ closing_cash: parseNumber(amount), notes })
  });
  showToast(`Caja cerrada. Diferencia ${money(data.shift.cash_difference || 0)}`);
}

async function loadCashShifts() {
  if (!canViewReports(state.user?.role) && state.user?.role !== 'cashier') return;
  const storeId = activeStoreId();
  const data = await api(`/api/cash-shifts${storeId ? `?store_id=${encodeURIComponent(storeId)}` : ''}`);
  state.cashShifts = data.shifts || [];
  renderCashShifts();
}

function renderCashShifts() {
  if (!els.cashShiftList) return;
  els.cashShiftList.innerHTML = state.cashShifts.slice(0, 12).map((shift) => `
    <div class="data-row">
      <span class="row-icon"><i data-lucide="${shift.status === 'open' ? 'unlock-keyhole' : 'lock-keyhole'}"></i></span>
      <div>
        <strong>${escapeHtml(shift.user_name || '')}</strong>
        <div class="meta">${escapeHtml(shift.store_name || '')} - ${formatDate(shift.opened_at)}</div>
        <div class="meta">Inicial ${money(shift.opening_cash || 0)}${shift.status === 'closed' ? ` - Contado ${money(shift.closing_cash || 0)} - Dif. ${money(shift.cash_difference || 0)}` : ''}</div>
      </div>
      <span class="pill ${shift.status === 'open' ? '' : 'void'}">${shift.status === 'open' ? 'Abierto' : 'Cerrado'}</span>
    </div>
  `).join('') || '<div class="empty">Sin cierres registrados.</div>';
  renderIcons();
}

async function loadStockMovements() {
  if (!canViewReports(state.user?.role) && state.user?.role !== 'editor') return;
  const storeId = activeStoreId();
  if (!storeId) return;
  const data = await api(`/api/stock-movements?store_id=${encodeURIComponent(storeId)}`);
  state.stockMovements = data.movements || [];
  renderStockMovements();
}

function renderStockMovements() {
  if (!els.stockMovementList) return;
  els.stockMovementList.innerHTML = state.stockMovements.slice(0, 14).map((movement) => `
    <div class="data-row">
      <span class="row-icon"><i data-lucide="layers-3"></i></span>
      <div>
        <strong>${escapeHtml(movement.product_name || 'Producto eliminado')}</strong>
        <div class="meta">${stockMovementLabel(movement.movement_type)} - ${movement.quantity} unidades - ${formatDate(movement.created_at)}</div>
        <div class="meta">${movement.previous_stock ?? ''} -> ${movement.new_stock ?? ''}${movement.user_name ? ` - ${escapeHtml(movement.user_name)}` : ''}</div>
      </div>
    </div>
  `).join('') || '<div class="empty">Sin movimientos de stock.</div>';
  renderIcons();
}

async function refreshSummary() {
  const storeId = activeStoreId();
  const summary = await api(`/api/summary${storeId ? `?store_id=${encodeURIComponent(storeId)}` : ''}`);
  els.todayTotal.textContent = money(summary.sales_total);
  els.todayCount.textContent = summary.sales_count;
  els.lowStock.textContent = summary.low_stock_count;
  els.pendingSync.textContent = summary.pending_sync_count;
}

async function loadReports() {
  const params = new URLSearchParams({ from: els.reportFrom.value, to: els.reportTo.value });
  const storeId = activeStoreId();
  if (storeId) params.set('store_id', storeId);
  const data = await api(`/api/reports?${params}`);
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
    <div class="table-row sales-report-row">
      <span>${formatDate(sale.created_at)}</span>
      <span>${shortId(sale.id)}</span>
      <span>${paymentLabel(sale.payment_method)}${sale.status === 'void' ? ' / Anulada' : ''}</span>
      <strong>${money(sale.total)}</strong>
      <span>${renderSaleActions(sale)}</span>
    </div>
  `).join('') || '<div class="empty">Sin ventas en este periodo.</div>';
  renderIcons();

  renderReportCharts(data);
}

async function handleSaleAction(event) {
  const voidButton = event.target.closest('[data-void-sale]');
  const paymentButton = event.target.closest('[data-edit-payment]');
  const cashButton = event.target.closest('[data-edit-cash]');
  const printButton = event.target.closest('[data-print-sale]');
  if (!voidButton && !paymentButton && !cashButton && !printButton) return;
  const actionButton = voidButton || paymentButton || cashButton || printButton;
  const saleId = actionButton.dataset.voidSale
    || actionButton.dataset.editPayment
    || actionButton.dataset.editCash
    || actionButton.dataset.printSale;
  const sale = findSale(saleId);
  if (!sale) return showToast('Venta no encontrada en pantalla');
  try {
    if (printButton) {
      await printSaleReceipt(sale);
      return;
    }
    if (voidButton) await voidSale(sale);
    if (paymentButton) await editSalePayment(sale);
    if (cashButton) await editCashReceived(sale);
    await Promise.all([loadSales(), refreshSummary(), loadReports(), loadProducts()]);
  } catch (error) {
    showToast(error.message);
  }
}

async function voidSale(sale) {
  const reason = window.prompt(`Motivo para anular la venta ${shortId(sale.id)}:`);
  if (reason === null) return;
  if (!reason.trim()) throw new Error('El motivo de anulacion es obligatorio');
  if (!window.confirm(`Anular ${money(sale.total)} y devolver stock?`)) return;
  await api(`/api/sales/${sale.id}/void`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason.trim() })
  });
  showToast('Venta anulada y stock devuelto');
}

async function editSalePayment(sale) {
  const method = window.prompt('Metodo de pago: efectivo o qr', sale.payment_method === 'qr' ? 'qr' : 'efectivo');
  if (method === null) return;
  const normalizedMethod = method.trim().toLowerCase();
  const paymentMethod = normalizedMethod === 'qr' ? 'qr' : 'cash';
  const payload = { payment_method: paymentMethod, reason: 'Correccion de metodo de pago' };
  if (paymentMethod === 'cash') {
    const received = window.prompt('Monto recibido en efectivo:', sale.cash_received || sale.total);
    if (received === null) return;
    payload.cash_received = parseNumber(received);
  } else {
    const code = window.prompt('Codigo de transaccion QR (opcional):', sale.qr_transaction_code || '');
    if (code === null) return;
    payload.qr_transaction_code = code.trim();
  }
  await api(`/api/sales/${sale.id}/payment`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  showToast('Pago corregido con auditoria');
}

async function editCashReceived(sale) {
  const received = window.prompt('Nuevo monto recibido:', sale.cash_received || sale.total);
  if (received === null) return;
  await api(`/api/sales/${sale.id}/payment`, {
    method: 'PATCH',
    body: JSON.stringify({
      payment_method: 'cash',
      cash_received: parseNumber(received),
      reason: 'Correccion de monto recibido'
    })
  });
  showToast('Monto recibido corregido');
}

function findSale(id) {
  return [...(state.sales || []), ...(state.lastReport?.sales || [])].find((sale) => sale.id === id);
}

function renderSaleActions(sale) {
  const adjustActions = canAdjustSales(state.user?.role) && sale.status !== 'void'
    ? `
      <button class="ghost mini" data-edit-payment="${sale.id}" title="Corregir metodo de pago"><i data-lucide="credit-card"></i></button>
      <button class="ghost mini" data-edit-cash="${sale.id}" title="Corregir monto recibido"><i data-lucide="banknote"></i></button>
      <button class="danger mini" data-void-sale="${sale.id}" title="Anular venta"><i data-lucide="ban"></i></button>
    `
    : '';
  return `
    <div class="sale-actions">
      <button class="ghost mini" data-print-sale="${sale.id}" title="Imprimir recibo"><i data-lucide="printer"></i></button>
      ${adjustActions}
    </div>
  `;
}

async function printSaleReceipt(sale) {
  const data = sale.items?.length ? { sale } : await api(`/api/sales/${sale.id}`);
  showReceipt(data.sale);
}

async function handleSearch() {
  const query = els.scanInput.value.trim();
  if (!query) {
    posSearchRequestId += 1;
    renderSearchResults([]);
    return;
  }
  renderSearchResults(filterPosProducts(query, state.products));
  const requestId = ++posSearchRequestId;
  await loadProducts(query, { posSearchRequestId: requestId });
}

function filterPosProducts(query, products = state.products) {
  const term = normalizeSearchText(query);
  if (!term) return [];
  const matches = (products || []).filter((product) => {
    const fields = [
      product.name,
      product.barcode,
      product.category_name,
      state.settings.sku_enabled ? product.sku : ''
    ];
    return fields.some((value) => normalizeSearchText(value).includes(term));
  });
  return matches.sort((first, second) => scoreProductMatch(first, term) - scoreProductMatch(second, term));
}

function scoreProductMatch(product, term) {
  const name = normalizeSearchText(product.name);
  const barcode = normalizeSearchText(product.barcode);
  const sku = state.settings.sku_enabled ? normalizeSearchText(product.sku) : '';
  if (barcode === term || sku === term) return 0;
  if (name === term) return 1;
  if (name.startsWith(term)) return 2;
  if (barcode.startsWith(term) || sku.startsWith(term)) return 3;
  if (name.includes(term)) return 4;
  return 5;
}

function addScannedProduct() {
  const query = els.scanInput.value.trim().toLowerCase();
  if (!query) return;

  const codeFields = state.settings.sku_enabled ? ['barcode', 'sku'] : ['barcode'];
  const exact = state.products.find((product) =>
    codeFields.map((field) => product[field]).filter(Boolean).some((value) => String(value).toLowerCase() === query)
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
        <span class="meta">${escapeHtml(productCodeLabel(product))} - Stock ${product.stock}</span>
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
          <div class="meta">${escapeHtml(productCodeLabel(product))} - ${escapeHtml(product.category_name || 'Sin categoria')} - ${money(product.sale_price)}</div>
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
          <div class="meta">${escapeHtml(productCodeLabel(product))} - ${escapeHtml(product.category_name || 'Sin categoria')}${product.active ? '' : ' - Inactivo'}</div>
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
        <div class="meta">${escapeHtml(productCodeLabel(product, ''))}</div>
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
  clearFieldErrors(els.paymentForm);
  const items = [...state.cart.values()];
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
  const total = getCartTotal();
  const cashReceived = Number(els.cashReceived.value || 0);

  if (paymentMethod === 'cash' && cashReceived < total) {
    markFieldError(els.cashReceived, 'El efectivo recibido no cubre el total');
    return;
  }

  try {
    const data = await api('/api/sales', {
      method: 'POST',
      body: JSON.stringify({
        store_id: activeStoreId(),
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
    handleFormError(error, {
      cash_received: els.cashReceived,
      qr_transaction_code: els.qrTransactionCode,
      store_id: els.activeStoreSelect
    });
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
  els.productSku.value = state.settings.sku_enabled ? (product?.sku || '') : '';
  els.productCategoryName.value = product?.category_name || '';
  els.productSalePrice.value = product?.sale_price ?? '';
  els.productCostPrice.value = product?.cost_price ?? '';
  els.productStock.value = product?.stock ?? 0;
  els.productMinStock.value = product?.min_stock ?? 0;
  els.productDescription.value = product?.description || '';
  els.productActive.checked = product ? Boolean(product.active) : true;
  els.productImageInput.value = '';
  clearProductDuplicateMessages();
  setProductImage(product?.image_path || null);
  productQuickStep = 0;
  setProductFormMode(mobileDevice);
  els.productDialog.showModal();
  if (options.focusBarcode) {
    startProductBarcodeScan();
  } else if (mobileDevice) {
    focusProductStepInput();
  } else {
    setBarcodeScanState(false);
    els.productName.focus();
  }
}

function setProductFormMode(quickMode) {
  els.productDialog.classList.toggle('quick-mode', Boolean(quickMode));
  els.productQuickFlow.hidden = !quickMode;
  els.productQuickActions.hidden = !quickMode;
  updateProductQuickStep();
}

function showFullProductForm() {
  setProductFormMode(false);
  setBarcodeScanState(false);
  renderIcons();
  window.setTimeout(() => els.productName.focus(), 60);
}

function updateProductQuickStep() {
  const total = PRODUCT_QUICK_STEPS.length;
  productQuickStep = Math.max(0, Math.min(productQuickStep, total - 1));
  document.querySelectorAll('#productDialog .product-step-field').forEach((field) => {
    field.classList.toggle('active-step', Number(field.dataset.productStep) === productQuickStep);
  });
  els.productStepCounter.textContent = `Paso ${productQuickStep + 1} de ${total}`;
  els.productStepTitle.textContent = PRODUCT_QUICK_STEPS[productQuickStep].title;
  els.productStepBar.style.width = `${((productQuickStep + 1) / total) * 100}%`;
  els.productPrevStepButton.disabled = productQuickStep === 0;
  els.productNextStepButton.innerHTML = productQuickStep === total - 1
    ? '<span>Guardar</span><i data-lucide="check"></i>'
    : '<span>Siguiente</span><i data-lucide="arrow-right"></i>';
  els.productNextStepButton.setAttribute('aria-label', productQuickStep === total - 1 ? 'Guardar producto' : 'Siguiente');
  renderIcons();
}

function focusProductStepInput() {
  if (!els.productDialog.classList.contains('quick-mode')) return;
  const input = PRODUCT_QUICK_STEPS[productQuickStep].focus?.();
  window.setTimeout(() => {
    input?.focus?.({ preventScroll: true });
    input?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    if (input?.select && input.value) input.select();
  }, 80);
}

function previousProductStep() {
  if (!els.productDialog.classList.contains('quick-mode')) return;
  productQuickStep -= 1;
  updateProductQuickStep();
  focusProductStepInput();
}

function nextProductStep() {
  if (!els.productDialog.classList.contains('quick-mode')) return;
  if (!validateProductQuickStep(productQuickStep)) return;
  if (productQuickStep >= PRODUCT_QUICK_STEPS.length - 1) {
    els.productForm.requestSubmit();
    return;
  }
  productQuickStep += 1;
  updateProductQuickStep();
  focusProductStepInput();
}

function handleProductFormKeydown(event) {
  if (!els.productDialog.classList.contains('quick-mode')) return;
  if (waitingProductBarcodeScan) return;
  if (event.key !== 'Enter') return;
  if (event.target?.tagName === 'TEXTAREA') return;
  const button = event.target?.closest?.('button');
  if (button) return;
  event.preventDefault();
  nextProductStep();
}

function validateProductQuickStep(step) {
  clearFieldErrors(els.productForm);
  if (step === 0) return validateProductBarcodeDuplicate();
  if (step === 1) {
    if (!requireField(els.productName, 'Escribe el nombre del producto')) return false;
    return validateProductNameDuplicate();
  }
  if (step === 3) {
    if (!requireField(els.productSalePrice, 'Escribe el precio de venta')) return false;
    if (Number(els.productSalePrice.value) < 0) {
      markFieldError(els.productSalePrice, 'El precio de venta no puede ser negativo');
      return false;
    }
  }
  if (step === 4) {
    if (!requireField(els.productStock, 'Escribe el stock inicial')) return false;
    if (Number(els.productStock.value) < 0) {
      markFieldError(els.productStock, 'El stock no puede ser negativo');
      return false;
    }
  }
  return true;
}

function validateProductBarcodeDuplicate(options = {}) {
  const barcode = els.productBarcode.value.trim();
  const existing = barcode ? findDuplicateProduct('barcode', barcode) : null;
  if (!existing) {
    setFieldMessage(els.productBarcodeError, '');
    els.productBarcode.classList.remove('field-error');
    return true;
  }
  const message = `Este codigo ya esta registrado: ${existing.name}`;
  setFieldMessage(els.productBarcodeError, message);
  if (options.silent) {
    els.productBarcode.classList.add('field-error');
  } else {
    markFieldError(els.productBarcode, message);
  }
  return false;
}

function validateProductNameDuplicate(options = {}) {
  const name = els.productName.value.trim();
  const existing = name ? findDuplicateProduct('name', name) : null;
  if (!existing) {
    setFieldMessage(els.productNameError, '');
    els.productName.classList.remove('field-error');
    return true;
  }
  const message = `Ya existe un producto con este nombre: ${existing.name}`;
  setFieldMessage(els.productNameError, message);
  if (options.silent) {
    els.productName.classList.add('field-error');
  } else {
    markFieldError(els.productName, message);
  }
  return false;
}

function findDuplicateProduct(field, value) {
  const currentId = els.productId.value;
  const cleanValue = field === 'name' ? normalizeSearchText(value) : String(value || '').trim();
  if (!cleanValue) return null;
  return state.products.find((product) => {
    if (product.id === currentId) return false;
    if (field === 'name') return normalizeSearchText(product.name) === cleanValue;
    return String(product.barcode || '').trim() === cleanValue;
  }) || null;
}

function clearProductDuplicateMessages() {
  setFieldMessage(els.productNameError, '');
  setFieldMessage(els.productBarcodeError, '');
}

function setFieldMessage(element, message) {
  if (!element) return;
  element.textContent = message || '';
  element.hidden = !message;
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
  if (els.productDialog.classList.contains('quick-mode')) {
    productQuickStep = 1;
    updateProductQuickStep();
    focusProductStepInput();
    showToast(`Codigo capturado: ${code}`);
    return;
  }
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
    : mobileDevice
      ? 'Presiona Escanear para usar la camara del movil.'
      : 'Presiona Escanear y lee el codigo con el lector USB.';
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

async function openBarcodeCamera(mode = 'pos') {
  if (!navigator.mediaDevices?.getUserMedia) {
    showToast('Este navegador no permite usar la camara');
    return;
  }
  barcodeScannerMode = mode;
  els.barcodeCameraStatus.textContent = 'Iniciando camara...';
  els.barcodeCameraDialog.showModal();
  try {
    if (window.ZXingBrowser?.BrowserMultiFormatReader) {
      await startZxingBarcodeCamera();
      return;
    }
    await startNativeBarcodeCamera();
  } catch (error) {
    closeBarcodeCamera();
    showToast(error.message || 'No se pudo abrir la camara');
  }
}

async function startZxingBarcodeCamera() {
  els.barcodeCameraStatus.textContent = 'Apunta la camara al codigo de barras.';
  zxingReader = zxingReader || new window.ZXingBrowser.BrowserMultiFormatReader();
  zxingControls = await zxingReader.decodeFromVideoDevice(undefined, els.barcodeCameraVideo, (result) => {
    const code = result?.getText?.() || result?.text || '';
    if (code) applyCameraBarcode(code);
  });
}

async function startNativeBarcodeCamera() {
  if (!('BarcodeDetector' in window)) {
    throw new Error('El lector por camara no esta disponible en este navegador. Prueba Chrome/Android o instala la PWA.');
  }
  barcodeDetector = barcodeDetector || new window.BarcodeDetector({
    formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf']
  });
  barcodeCameraStream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' } },
    audio: false
  });
  els.barcodeCameraVideo.srcObject = barcodeCameraStream;
  await els.barcodeCameraVideo.play();
  els.barcodeCameraStatus.textContent = 'Apunta la camara al codigo de barras.';
  scanBarcodeFrame();
}

async function scanBarcodeFrame() {
  if (!barcodeCameraStream || els.barcodeCameraDialog.open === false) return;
  try {
    const video = els.barcodeCameraVideo;
    if (video.readyState >= 2) {
      const canvas = els.barcodeCameraCanvas;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const codes = await barcodeDetector.detect(canvas);
      const code = codes?.[0]?.rawValue;
      if (code) {
        applyCameraBarcode(code);
        return;
      }
    }
  } catch {
    // Mantiene el escaneo activo aunque un frame falle.
  }
  barcodeScanTimer = window.setTimeout(scanBarcodeFrame, 220);
}

function applyCameraBarcode(value) {
  const code = String(value || '').trim();
  if (!code) return;
  closeBarcodeCamera();
  if (barcodeScannerMode === 'product') {
    els.productBarcode.value = code;
    waitingProductBarcodeScan = false;
    productBarcodeBuffer = '';
    setBarcodeScanState(false);
    els.barcodeScanHint.textContent = `Codigo detectado con camara: ${code}`;
    els.productBarcode.dispatchEvent(new Event('input', { bubbles: true }));
    if (els.productDialog.classList.contains('quick-mode')) {
      productQuickStep = 1;
      updateProductQuickStep();
      focusProductStepInput();
    }
    showToast('Codigo de barras agregado');
    return;
  }
  els.scanInput.value = code;
  showToast('Codigo detectado');
  handleCameraPosBarcode(code);
}

async function handleCameraPosBarcode(code) {
  try {
    await loadProducts(code);
    addScannedProduct();
  } catch (error) {
    showToast(error.message);
  }
}

function closeBarcodeCamera() {
  if (els.barcodeCameraDialog.open) els.barcodeCameraDialog.close();
  stopBarcodeCamera();
}

function stopBarcodeCamera() {
  window.clearTimeout(barcodeScanTimer);
  barcodeScanTimer = null;
  if (zxingControls?.stop) zxingControls.stop();
  zxingControls = null;
  if (barcodeCameraStream) {
    barcodeCameraStream.getTracks().forEach((track) => track.stop());
    barcodeCameraStream = null;
  }
  els.barcodeCameraVideo.srcObject = null;
}

async function saveProduct(event) {
  event.preventDefault();
  clearFieldErrors(els.productForm);
  clearProductDuplicateMessages();
  if (!requireField(els.productName, 'Escribe el nombre del producto')) return;
  if (!validateProductNameDuplicate()) return;
  if (!validateProductBarcodeDuplicate()) return;
  if (!requireField(els.productSalePrice, 'Escribe el precio de venta')) return;
  if (Number(els.productSalePrice.value) < 0) {
    markFieldError(els.productSalePrice, 'El precio de venta no puede ser negativo');
    return;
  }
  if (!requireField(els.productStock, 'Escribe el stock inicial')) return;
  if (Number(els.productStock.value) < 0) {
    markFieldError(els.productStock, 'El stock no puede ser negativo');
    return;
  }
  if (!activeStoreId()) {
    showToast('Selecciona una sucursal antes de guardar productos');
    return;
  }
  const id = els.productId.value;
  const payload = {
    store_id: activeStoreId(),
    name: els.productName.value,
    barcode: els.productBarcode.value,
    sku: state.settings.sku_enabled ? els.productSku.value : '',
    category_name: els.productCategoryName.value,
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
    if (els.productDialog.classList.contains('quick-mode')) {
      const step = productStepForField(error.field || guessErrorField(error.message));
      if (step !== null) {
        productQuickStep = step;
        updateProductQuickStep();
      }
    }
    handleFormError(error, {
      name: els.productName,
      barcode: els.productBarcode,
      sku: els.productSku,
      category_id: els.productCategoryName,
      category_name: els.productCategoryName,
      sale_price: els.productSalePrice,
      cost_price: els.productCostPrice,
      stock: els.productStock,
      min_stock: els.productMinStock,
      image_data: els.productImageInput
    });
  }
}

function productStepForField(field) {
  const steps = {
    barcode: 0,
    name: 1,
    sku: 2,
    category_id: 2,
    category_name: 2,
    sale_price: 3,
    cost_price: 3,
    stock: 4,
    min_stock: 4,
    image_data: 5,
    description: 5
  };
  return Object.prototype.hasOwnProperty.call(steps, field) ? steps[field] : null;
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
  const items = Array.isArray(sale.items) ? sale.items : [];
  const storeName = sale.store_name || state.activeStore?.name || '';
  const businessName = sale.business_name || state.activeStore?.business_name || 'SGI Market Caja';
  els.receiptContent.innerHTML = `
    <div class="receipt-head">
      <h2>${escapeHtml(businessName)}</h2>
      ${storeName ? `<p>${escapeHtml(storeName)}</p>` : ''}
      <p>Nota de venta</p>
    </div>
    <div class="receipt-meta">
      <span>Venta</span><strong>${shortId(sale.id)}</strong>
      <span>Fecha</span><strong>${formatDate(sale.created_at)}</strong>
      <span>Cajero</span><strong>${escapeHtml(sale.cashier_name || state.user?.name || '')}</strong>
      <span>Pago</span><strong>${paymentLabel(sale.payment_method)}</strong>
    </div>
    <div class="receipt-items">
    ${items.map((item) => `
      <div class="receipt-line">
        <span>${escapeHtml(item.product_name)}<small>${Number(item.quantity || 0)} x ${money(item.unit_price)}</small></span>
        <strong>${money(item.line_total ?? item.total)}</strong>
      </div>
    `).join('')}
    </div>
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
    <p class="receipt-thanks">Gracias por su compra.</p>
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
  if (!response.ok) {
    const error = new Error(data.error || 'Error de solicitud');
    error.field = data.field;
    throw error;
  }
  return data;
}

function productThumb(product) {
  if (product.image_path) {
    return `<span class="thumb image-click" data-product-image="${product.id}" title="Ampliar imagen"><img src="${product.image_path}" alt=""></span>`;
  }
  return `<span class="thumb placeholder">${initials(product.name)}</span>`;
}

function productCodeLabel(product, fallback = 'Sin codigo') {
  return product?.barcode || (state.settings.sku_enabled ? product?.sku : '') || fallback;
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

function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
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

function stockMovementLabel(value) {
  const labels = {
    initial: 'Stock inicial',
    adjustment: 'Ajuste manual',
    sale: 'Venta',
    void: 'Anulacion'
  };
  return labels[value] || value;
}

function roleLabel(value) {
  const labels = {
    master_admin: 'Admin maestro',
    tenant_owner: 'Dueno tienda',
    owner: 'Admin general',
    branch_admin: 'Admin sucursal',
    admin: 'Admin',
    editor: 'Editor',
    cashier: 'Cajera'
  };
  return labels[value] || value;
}

function canManageAdmin(role) {
  return isGlobalAdmin(role) || role === 'branch_admin';
}

function canAdjustSales(role) {
  return isGlobalAdmin(role) || role === 'branch_admin';
}

function canSell(role) {
  return ['master_admin', 'tenant_owner', 'owner', 'branch_admin', 'cashier'].includes(role);
}

function canViewReports(role) {
  return ['master_admin', 'tenant_owner', 'owner', 'branch_admin'].includes(role);
}

function canChangeUserPassword(user) {
  const role = state.user?.role;
  if (!user || !role) return false;
  if (role === 'master_admin') return user.role !== 'master_admin' || user.id === state.user.id;
  if (role === 'tenant_owner') return user.tenant_id === state.user.tenant_id && user.role !== 'master_admin';
  if (role === 'branch_admin') {
    return user.store_id === state.user.store_id && ['editor', 'cashier'].includes(user.role);
  }
  return false;
}

function canAccessView(role, viewId) {
  if (role === 'master_admin' && viewId === 'posView') return true;
  if (isGlobalAdmin(role) || role === 'branch_admin') return true;
  if (role === 'editor') return viewId === 'productsView';
  return viewId === 'posView';
}

function isGlobalAdmin(role) {
  return ['owner', 'tenant_owner', 'master_admin'].includes(role);
}

function defaultViewForRole(role) {
  return role === 'editor' ? 'productsView' : 'posView';
}

function focusDefaultView() {
  if (state.user?.role === 'editor') {
    showView('productsView');
    return;
  }
  showView('posView');
}

function isMobileDevice() {
  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches;
  const smallViewport = Math.min(window.innerWidth || 9999, screen.width || 9999) <= 820;
  const ua = navigator.userAgent || '';
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (coarsePointer && smallViewport);
}

function activeStoreId() {
  if (isGlobalAdmin(state.user?.role)) return els.activeStoreSelect?.value || state.activeStore?.id || '';
  return state.user?.store_id || state.activeStore?.id || '';
}

function parseNumber(value) {
  const number = Number(String(value || '').replace(',', '.'));
  if (!Number.isFinite(number)) throw new Error('Monto invalido');
  return number;
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

function clearFieldErrors(root = document) {
  root.querySelectorAll?.('.field-error').forEach((field) => field.classList.remove('field-error'));
}

function requireField(input, message) {
  if (String(input?.value || '').trim()) return true;
  markFieldError(input, message);
  return false;
}

function markFieldError(input, message) {
  if (!input) {
    showToast(message);
    return;
  }
  input.classList.add('field-error');
  setInlineFieldError(input, message);
  input.focus?.();
  input.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  showToast(message);
}

function setInlineFieldError(input, message) {
  if (input === els.productName) setFieldMessage(els.productNameError, message);
  if (input === els.productBarcode) setFieldMessage(els.productBarcodeError, message);
}

function handleFormError(error, fieldMap = {}) {
  const input = fieldMap[error.field] || fieldMap[guessErrorField(error.message)];
  if (input) {
    markFieldError(input, error.message);
    return;
  }
  showToast(error.message);
}

function guessErrorField(message = '') {
  const text = message.toLowerCase();
  if (text.includes('usuario')) return 'username';
  if (text.includes('contrasena')) return 'password';
  if (text.includes('sucursal')) return 'store_id';
  if (text.includes('cliente')) return 'tenant_id';
  if (text.includes('nombre')) return 'name';
  if (text.includes('codigo') || text.includes('barra')) return 'barcode';
  if (text.includes('sku')) return 'sku';
  if (text.includes('precio')) return 'sale_price';
  if (text.includes('stock')) return 'stock';
  if (text.includes('imagen')) return 'image_data';
  return '';
}

function shortId(value) {
  const text = String(value || '');
  return text ? text.slice(0, 8) : 'sin-id';
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

function setLoginMessage(message, type) {
  if (!els.loginMessage) return;
  els.loginMessage.textContent = message;
  els.loginMessage.dataset.type = type || 'info';
  els.loginMessage.hidden = !message;
}

function renderIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
