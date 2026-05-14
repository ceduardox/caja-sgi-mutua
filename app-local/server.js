const { createServer } = require('node:http');
const { readFileSync, existsSync, mkdirSync } = require('node:fs');
const { join, extname } = require('node:path');
const { randomUUID, randomBytes, scryptSync, timingSafeEqual } = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;
const PUBLIC_DIR = join(ROOT, 'public');
const DATA_DIR = join(ROOT, 'data');
const DB_PATH = join(DATA_DIR, 'sgi-market-caja.sqlite');
const DEFAULT_STORE_ID = 'local-store';
const DEVICE_ID = 'local-device';
const DEFAULT_USER_ID = 'admin-local';
const sessions = new Map();

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec(readFileSync(join(ROOT, 'sqlite_schema.sql'), 'utf8'));
migrateLocalDatabase();
seedLocalData();

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url);
      return;
    }

    serveStatic(res, url.pathname);
  } catch (error) {
    sendJson(res, error.status || 500, { error: error.message || 'Error interno' });
  }
});

server.listen(PORT, () => {
  console.log(`SGI Market Caja local: http://localhost:${PORT}`);
  console.log(`Base local SQLite: ${DB_PATH}`);
});

function seedLocalData() {
  db.prepare(`
    INSERT OR IGNORE INTO stores (id, name, license_status)
    VALUES (?, ?, ?)
  `).run(DEFAULT_STORE_ID, 'Sucursal Principal', 'trial');

  db.prepare(`
    INSERT OR IGNORE INTO devices (id, store_id, name)
    VALUES (?, ?, ?)
  `).run(DEVICE_ID, DEFAULT_STORE_ID, 'Caja principal');

  const existingAdmin = db.prepare('SELECT id, password_hash FROM users WHERE username = ?').get('admin');
  if (!existingAdmin) {
    db.prepare(`
      INSERT INTO users (id, store_id, name, username, password_hash, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(DEFAULT_USER_ID, DEFAULT_STORE_ID, 'Administrador', 'admin', hashPassword('admin123'), 'admin');
  } else if (existingAdmin.password_hash === 'local-demo') {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword('admin123'), existingAdmin.id);
  }

  db.prepare(`
    INSERT OR IGNORE INTO categories (id, store_id, name)
    VALUES (?, ?, ?)
  `).run('cat-general', DEFAULT_STORE_ID, 'General');

  const count = db.prepare('SELECT COUNT(*) AS count FROM products WHERE store_id = ?').get(DEFAULT_STORE_ID).count;
  if (count === 0) {
    const insert = db.prepare(`
      INSERT INTO products (
        id, store_id, category_id, barcode, sku, name, cost_price, sale_price,
        stock, min_stock, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    insert.run(randomUUID(), DEFAULT_STORE_ID, 'cat-general', '7750001000012', 'PROD-001', 'Agua mineral 600 ml', 2.5, 5, 24, 5);
    insert.run(randomUUID(), DEFAULT_STORE_ID, 'cat-general', '7750001000029', 'PROD-002', 'Galletas vainilla', 3, 6, 18, 6);
    insert.run(randomUUID(), DEFAULT_STORE_ID, 'cat-general', '7750001000036', 'PROD-003', 'Jugo personal', 4, 8, 12, 4);
  }
}

function migrateLocalDatabase() {
  const columns = db.prepare('PRAGMA table_info(sales)').all().map((column) => column.name);
  if (!columns.includes('cash_received')) db.exec('ALTER TABLE sales ADD COLUMN cash_received REAL');
  if (!columns.includes('cash_change')) db.exec('ALTER TABLE sales ADD COLUMN cash_change REAL');
  if (!columns.includes('qr_transaction_code')) db.exec('ALTER TABLE sales ADD COLUMN qr_transaction_code TEXT');
  const usersSql = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'").get()?.sql || '';
  if (usersSql && !usersSql.includes("'editor'")) {
    db.exec('PRAGMA foreign_keys = OFF');
    db.exec('ALTER TABLE users RENAME TO users_old_role');
    db.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL,
        name TEXT NOT NULL,
        username TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'cashier')),
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (store_id, username),
        FOREIGN KEY (store_id) REFERENCES stores(id)
      )
    `);
    db.exec(`
      INSERT INTO users (id, store_id, name, username, password_hash, role, active, created_at, updated_at)
      SELECT id, store_id, name, username, password_hash, role, active, created_at, updated_at
      FROM users_old_role
    `);
    db.exec('DROP TABLE users_old_role');
    db.exec('PRAGMA foreign_keys = ON');
  }
}

async function handleApi(req, res, url) {
  const method = req.method || 'GET';

  if (method === 'GET' && url.pathname === '/api/health') {
    sendJson(res, 200, {
      ok: true,
      mode: 'local',
      storeId: DEFAULT_STORE_ID,
      deviceId: DEVICE_ID,
      now: new Date().toISOString()
    });
    return;
  }

  if (method === 'POST' && url.pathname === '/api/login') {
    const body = await readJson(req);
    const user = loginUser(body.username, body.password);
    const token = randomUUID();
    sessions.set(token, { userId: user.id, storeId: user.store_id, createdAt: Date.now() });
    res.setHeader('Set-Cookie', `sgi_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);
    sendJson(res, 200, { user });
    return;
  }

  if (method === 'POST' && url.pathname === '/api/logout') {
    const token = getSessionToken(req);
    if (token) sessions.delete(token);
    res.setHeader('Set-Cookie', 'sgi_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    sendJson(res, 200, { ok: true });
    return;
  }

  const ctx = getRequestContext(req);

  if (method === 'GET' && url.pathname === '/api/session') {
    sendJson(res, 200, { user: ctx.user, store: ctx.store });
    return;
  }

  if (method === 'GET' && url.pathname === '/api/stores') {
    requireRole(ctx, ['admin', 'editor']);
    sendJson(res, 200, { stores: listStores() });
    return;
  }

  if (method === 'POST' && url.pathname === '/api/stores') {
    requireRole(ctx, ['admin', 'editor']);
    const store = createStore(await readJson(req));
    sendJson(res, 201, { store });
    return;
  }

  if (method === 'GET' && url.pathname === '/api/users') {
    requireRole(ctx, ['admin']);
    sendJson(res, 200, { users: listUsers() });
    return;
  }

  if (method === 'POST' && url.pathname === '/api/users') {
    requireRole(ctx, ['admin']);
    const user = createUser(await readJson(req));
    sendJson(res, 201, { user });
    return;
  }

  if (method === 'GET' && url.pathname === '/api/products') {
    const q = (url.searchParams.get('q') || '').trim();
    const products = listProducts(ctx, q);
    sendJson(res, 200, { products });
    return;
  }

  if (method === 'POST' && url.pathname === '/api/products') {
    requireRole(ctx, ['admin']);
    const body = await readJson(req);
    const product = createProduct(ctx, body);
    enqueueSync(ctx, 'product', product.id, 'create', product);
    sendJson(res, 201, { product });
    return;
  }

  const productMatch = url.pathname.match(/^\/api\/products\/([^/]+)$/);
  if (productMatch && method === 'PUT') {
    requireRole(ctx, ['admin']);
    const body = await readJson(req);
    const product = updateProduct(ctx, productMatch[1], body);
    enqueueSync(ctx, 'product', product.id, 'update', product);
    sendJson(res, 200, { product });
    return;
  }

  if (method === 'POST' && url.pathname === '/api/sales') {
    const body = await readJson(req);
    const sale = createSale(ctx, body);
    enqueueSync(ctx, 'sale', sale.id, 'create', sale);
    sendJson(res, 201, { sale });
    return;
  }

  if (method === 'GET' && url.pathname === '/api/sales') {
    sendJson(res, 200, { sales: listSales(ctx) });
    return;
  }

  if (method === 'GET' && url.pathname === '/api/summary') {
    sendJson(res, 200, getSummary(ctx));
    return;
  }

  if (method === 'GET' && url.pathname === '/api/reports') {
    sendJson(res, 200, getReports(ctx, url.searchParams));
    return;
  }

  sendJson(res, 404, { error: 'Ruta no encontrada' });
}

function listProducts(ctx, q = '') {
  if (!q) {
    return db.prepare(`
      SELECT id, barcode, sku, name, cost_price, sale_price, stock, min_stock, image_path, active, updated_at
      FROM products
      WHERE store_id = ?
      ORDER BY active DESC, name ASC
      LIMIT 500
    `).all(ctx.storeId);
  }

  const needle = `%${q}%`;
  return db.prepare(`
    SELECT id, barcode, sku, name, cost_price, sale_price, stock, min_stock, image_path, active, updated_at
    FROM products
    WHERE store_id = ?
      AND (name LIKE ? OR barcode LIKE ? OR sku LIKE ?)
    ORDER BY active DESC, name ASC
    LIMIT 100
  `).all(ctx.storeId, needle, needle, needle);
}

function createProduct(ctx, input) {
  const product = normalizeProduct(input);
  product.id = randomUUID();

  db.prepare(`
    INSERT INTO products (
      id, store_id, category_id, barcode, sku, name, description, cost_price,
      sale_price, stock, min_stock, image_path, active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    product.id,
    ctx.storeId,
    'cat-general',
    product.barcode,
    product.sku,
    product.name,
    product.description,
    product.cost_price,
    product.sale_price,
    product.stock,
    product.min_stock,
    product.image_path,
    product.active
  );

  return getProduct(ctx, product.id);
}

function updateProduct(ctx, id, input) {
  const current = getProduct(ctx, id);
  if (!current) throw new Error('Producto no encontrado');

  const product = normalizeProduct({ ...current, ...input });
  db.prepare(`
    UPDATE products
    SET barcode = ?, sku = ?, name = ?, description = ?, cost_price = ?,
        sale_price = ?, stock = ?, min_stock = ?, image_path = ?, active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND store_id = ?
  `).run(
    product.barcode,
    product.sku,
    product.name,
    product.description,
    product.cost_price,
    product.sale_price,
    product.stock,
    product.min_stock,
    product.image_path,
    product.active,
    id,
    ctx.storeId
  );

  return getProduct(ctx, id);
}

function normalizeProduct(input) {
  const name = String(input.name || '').trim();
  if (!name) throw new Error('El nombre del producto es obligatorio');

  const salePrice = Number(input.sale_price ?? input.salePrice);
  if (!Number.isFinite(salePrice) || salePrice < 0) throw new Error('Precio de venta invalido');

  const stock = Number.parseInt(input.stock ?? 0, 10);
  if (!Number.isInteger(stock) || stock < 0) throw new Error('Stock invalido');

  return {
    barcode: cleanOptional(input.barcode),
    sku: cleanOptional(input.sku),
    name,
    description: cleanOptional(input.description),
    cost_price: normalizeMoney(input.cost_price ?? input.costPrice ?? 0),
    sale_price: normalizeMoney(salePrice),
    stock,
    min_stock: Math.max(0, Number.parseInt(input.min_stock ?? input.minStock ?? 0, 10) || 0),
    image_path: normalizeImage(input.image_path ?? input.imagePath),
    active: input.active === false || input.active === 0 ? 0 : 1
  };
}

function getProduct(ctx, id) {
  return db.prepare(`
    SELECT id, barcode, sku, name, description, cost_price, sale_price, stock, min_stock, image_path, active, updated_at
    FROM products
    WHERE id = ? AND store_id = ?
  `).get(id, ctx.storeId);
}

function createSale(ctx, input) {
  const items = Array.isArray(input.items) ? input.items : [];
  if (items.length === 0) throw new Error('La venta no tiene productos');

  const openSession = ensureCashSession(ctx);
  const saleId = randomUUID();
  const now = new Date().toISOString();
  const paymentMethod = normalizePaymentMethod(input.payment_method ?? input.paymentMethod);
  const cashReceived = input.cash_received ?? input.cashReceived;
  const qrTransactionCode = cleanOptional(input.qr_transaction_code ?? input.qrTransactionCode);

  db.exec('BEGIN IMMEDIATE');
  try {
    let subtotal = 0;
    const preparedItems = items.map((item) => {
      const product = db.prepare(`
        SELECT id, barcode, name, cost_price, sale_price, stock
        FROM products
        WHERE id = ? AND store_id = ? AND active = 1
      `).get(item.product_id ?? item.productId, ctx.storeId);

      if (!product) throw new Error('Producto no encontrado o inactivo');

      const quantity = Number.parseInt(item.quantity, 10);
      if (!Number.isInteger(quantity) || quantity <= 0) throw new Error(`Cantidad invalida para ${product.name}`);
      if (product.stock < quantity) throw new Error(`Stock insuficiente para ${product.name}`);

      const unitPrice = normalizeMoney(product.sale_price);
      const lineTotal = normalizeMoney(unitPrice * quantity);
      subtotal += lineTotal;

      return { product, quantity, unitPrice, lineTotal };
    });

    const total = normalizeMoney(subtotal);
    const payment = normalizePaymentDetails(paymentMethod, total, cashReceived, qrTransactionCode);

    db.prepare(`
      INSERT INTO sales (
        id, store_id, device_id, cash_session_id, user_id, subtotal, total,
        payment_method, cash_received, cash_change, qr_transaction_code, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)
    `).run(
      saleId,
      ctx.storeId,
      DEVICE_ID,
      openSession.id,
      ctx.user.id,
      normalizeMoney(subtotal),
      total,
      paymentMethod,
      payment.cash_received,
      payment.cash_change,
      payment.qr_transaction_code,
      now
    );

    const insertItem = db.prepare(`
      INSERT INTO sale_items (
        id, sale_id, product_id, product_name, barcode, quantity, unit_price, line_total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const updateStock = db.prepare(`
      UPDATE products
      SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND store_id = ?
    `);
    const insertMovement = db.prepare(`
      INSERT INTO inventory_movements (
        id, store_id, product_id, movement_type, quantity, previous_stock,
        new_stock, reason, related_sale_id, user_id
      ) VALUES (?, ?, ?, 'sale', ?, ?, ?, ?, ?, ?)
    `);

    for (const item of preparedItems) {
      const newStock = item.product.stock - item.quantity;
      insertItem.run(
        randomUUID(),
        saleId,
        item.product.id,
        item.product.name,
        item.product.barcode,
        item.quantity,
        item.unitPrice,
        item.lineTotal
      );
      updateStock.run(item.quantity, item.product.id, ctx.storeId);
      insertMovement.run(
        randomUUID(),
        ctx.storeId,
        item.product.id,
        -item.quantity,
        item.product.stock,
        newStock,
        'Venta local',
        saleId,
        ctx.user.id
      );
    }

    db.exec('COMMIT');
    return getSale(ctx, saleId);
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function ensureCashSession(ctx) {
  const open = db.prepare(`
    SELECT id FROM cash_sessions
    WHERE store_id = ? AND device_id = ? AND status = 'open'
    ORDER BY opened_at DESC
    LIMIT 1
  `).get(ctx.storeId, DEVICE_ID);
  if (open) return open;

  const id = randomUUID();
  db.prepare(`
    INSERT INTO cash_sessions (id, store_id, device_id, opened_by, opening_amount, status)
    VALUES (?, ?, ?, ?, 0, 'open')
  `).run(id, ctx.storeId, DEVICE_ID, ctx.user.id);
  return { id };
}

function getSale(ctx, id) {
  const sale = db.prepare(`
    SELECT id, subtotal, discount_total, total, payment_method, cash_received, cash_change, qr_transaction_code, status, created_at
    FROM sales
    WHERE id = ? AND store_id = ?
  `).get(id, ctx.storeId);
  if (!sale) return null;

  sale.items = db.prepare(`
    SELECT product_id, product_name, barcode, quantity, unit_price, line_total
    FROM sale_items
    WHERE sale_id = ?
    ORDER BY created_at ASC
  `).all(id);

  return sale;
}

function listSales(ctx) {
  return db.prepare(`
    SELECT id, total, payment_method, cash_received, cash_change, qr_transaction_code, status, created_at
    FROM sales
    WHERE store_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `).all(ctx.storeId);
}

function getSummary(ctx) {
  const today = new Date().toISOString().slice(0, 10);
  const sales = db.prepare(`
    SELECT COUNT(*) AS count, COALESCE(SUM(total), 0) AS total
    FROM sales
    WHERE store_id = ? AND status = 'completed' AND substr(created_at, 1, 10) = ?
  `).get(ctx.storeId, today);
  const lowStock = db.prepare(`
    SELECT COUNT(*) AS count
    FROM products
    WHERE store_id = ? AND active = 1 AND stock <= min_stock
  `).get(ctx.storeId);
  const pendingSync = db.prepare(`
    SELECT COUNT(*) AS count
    FROM sync_queue
    WHERE store_id = ? AND status IN ('pending', 'failed', 'conflict')
  `).get(ctx.storeId);

  return {
    today,
    sales_count: sales.count,
    sales_total: normalizeMoney(sales.total),
    low_stock_count: lowStock.count,
    pending_sync_count: pendingSync.count
  };
}

function getReports(ctx, params) {
  const today = new Date().toISOString().slice(0, 10);
  const from = cleanDate(params.get('from')) || today;
  const to = cleanDate(params.get('to')) || today;
  const fromStamp = `${from}T00:00:00`;
  const toStamp = `${to}T23:59:59`;

  const totals = db.prepare(`
    SELECT
      COUNT(DISTINCT s.id) AS sales_count,
      COALESCE(SUM(si.quantity), 0) AS units_sold,
      COALESCE(SUM(si.line_total), 0) AS revenue,
      COALESCE(SUM((si.unit_price - COALESCE(p.cost_price, 0)) * si.quantity), 0) AS gross_profit
    FROM sales s
    JOIN sale_items si ON si.sale_id = s.id
    LEFT JOIN products p ON p.id = si.product_id
    WHERE s.store_id = ?
      AND s.status = 'completed'
      AND s.created_at BETWEEN ? AND ?
  `).get(ctx.storeId, fromStamp, toStamp);

  const byDay = db.prepare(`
    SELECT substr(s.created_at, 1, 10) AS day, COUNT(*) AS sales_count, COALESCE(SUM(s.total), 0) AS total
    FROM sales s
    WHERE s.store_id = ? AND s.status = 'completed' AND s.created_at BETWEEN ? AND ?
    GROUP BY substr(s.created_at, 1, 10)
    ORDER BY day ASC
  `).all(ctx.storeId, fromStamp, toStamp);

  const bestSellers = db.prepare(`
    SELECT
      si.product_id,
      si.product_name,
      COALESCE(SUM(si.quantity), 0) AS quantity,
      COALESCE(SUM(si.line_total), 0) AS total,
      COALESCE(SUM((si.unit_price - COALESCE(p.cost_price, 0)) * si.quantity), 0) AS gross_profit
    FROM sales s
    JOIN sale_items si ON si.sale_id = s.id
    LEFT JOIN products p ON p.id = si.product_id
    WHERE s.store_id = ? AND s.status = 'completed' AND s.created_at BETWEEN ? AND ?
    GROUP BY si.product_id, si.product_name
    ORDER BY quantity DESC, total DESC
    LIMIT 10
  `).all(ctx.storeId, fromStamp, toStamp);

  const lowStock = db.prepare(`
    SELECT id, name, barcode, sku, stock, min_stock, sale_price, image_path
    FROM products
    WHERE store_id = ? AND active = 1 AND stock <= min_stock
    ORDER BY stock ASC, name ASC
    LIMIT 50
  `).all(ctx.storeId);

  const paymentMethods = db.prepare(`
    SELECT payment_method, COUNT(*) AS sales_count, COALESCE(SUM(total), 0) AS total
    FROM sales
    WHERE store_id = ? AND status = 'completed' AND created_at BETWEEN ? AND ?
    GROUP BY payment_method
    ORDER BY total DESC
  `).all(ctx.storeId, fromStamp, toStamp);

  const sales = db.prepare(`
    SELECT id, total, payment_method, cash_received, cash_change, qr_transaction_code, status, created_at
    FROM sales
    WHERE store_id = ? AND created_at BETWEEN ? AND ?
    ORDER BY created_at DESC
    LIMIT 100
  `).all(ctx.storeId, fromStamp, toStamp);

  return {
    from,
    to,
    totals: {
      sales_count: totals.sales_count,
      units_sold: totals.units_sold,
      revenue: normalizeMoney(totals.revenue),
      gross_profit: normalizeMoney(totals.gross_profit),
      margin_percent: totals.revenue > 0 ? normalizeMoney((totals.gross_profit / totals.revenue) * 100) : 0
    },
    by_day: byDay.map((row) => ({ ...row, total: normalizeMoney(row.total) })),
    best_sellers: bestSellers.map((row) => ({
      ...row,
      total: normalizeMoney(row.total),
      gross_profit: normalizeMoney(row.gross_profit)
    })),
    payment_methods: paymentMethods.map((row) => ({ ...row, total: normalizeMoney(row.total) })),
    low_stock: lowStock,
    sales
  };
}

function enqueueSync(ctx, entityType, entityId, action, payload) {
  db.prepare(`
    INSERT INTO sync_queue (
      id, store_id, device_id, entity_type, entity_id, action, payload_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(randomUUID(), ctx.storeId, DEVICE_ID, entityType, entityId, action, JSON.stringify(payload));
}

function loginUser(username, password) {
  const cleanUsername = String(username || '').trim();
  const user = db.prepare(`
    SELECT u.id, u.store_id, u.name, u.username, u.password_hash, u.role, u.active, s.name AS store_name
    FROM users u
    JOIN stores s ON s.id = u.store_id
    WHERE u.username = ?
  `).get(cleanUsername);
  if (!user || !user.active || !verifyPassword(password, user.password_hash)) {
    throw new Error('Usuario o contrasena incorrectos');
  }
  return publicUser(user);
}

function getRequestContext(req) {
  const token = getSessionToken(req);
  const session = token ? sessions.get(token) : null;
  if (!session) {
    const error = new Error('Sesion requerida');
    error.status = 401;
    throw error;
  }
  const user = db.prepare(`
    SELECT u.id, u.store_id, u.name, u.username, u.role, u.active, s.name AS store_name
    FROM users u
    JOIN stores s ON s.id = u.store_id
    WHERE u.id = ?
  `).get(session.userId);
  if (!user || !user.active) {
    sessions.delete(token);
    const error = new Error('Sesion invalida');
    error.status = 401;
    throw error;
  }
  return {
    user: publicUser(user),
    storeId: user.store_id,
    store: { id: user.store_id, name: user.store_name }
  };
}

function requireRole(ctx, roles) {
  if (!roles.includes(ctx.user.role)) {
    const error = new Error('No tienes permiso para esta accion');
    error.status = 403;
    throw error;
  }
}

function listStores() {
  return db.prepare(`
    SELECT id, name, license_status, grace_until, created_at, updated_at
    FROM stores
    ORDER BY name ASC
  `).all();
}

function createStore(input) {
  const name = String(input.name || '').trim();
  if (!name) throw new Error('El nombre de la sucursal es obligatorio');
  const id = randomUUID();
  db.prepare(`
    INSERT INTO stores (id, name, license_status)
    VALUES (?, ?, 'trial')
  `).run(id, name);
  db.prepare(`
    INSERT INTO categories (id, store_id, name)
    VALUES (?, ?, ?)
  `).run(randomUUID(), id, 'General');
  return db.prepare('SELECT id, name, license_status, created_at, updated_at FROM stores WHERE id = ?').get(id);
}

function listUsers() {
  return db.prepare(`
    SELECT u.id, u.store_id, s.name AS store_name, u.name, u.username, u.role, u.active, u.created_at, u.updated_at
    FROM users u
    JOIN stores s ON s.id = u.store_id
    ORDER BY s.name ASC, u.name ASC
  `).all();
}

function createUser(input) {
  const name = String(input.name || '').trim();
  const username = String(input.username || '').trim();
  const password = String(input.password || '').trim();
  const role = String(input.role || 'cashier').trim();
  const storeId = String(input.store_id || input.storeId || '').trim();
  if (!name) throw new Error('El nombre es obligatorio');
  if (!username) throw new Error('El usuario es obligatorio');
  if (password.length < 4) throw new Error('La contrasena debe tener al menos 4 caracteres');
  if (!['admin', 'editor', 'cashier'].includes(role)) throw new Error('Rol invalido');
  const store = db.prepare('SELECT id FROM stores WHERE id = ?').get(storeId);
  if (!store) throw new Error('Sucursal no encontrada');
  const id = randomUUID();
  db.prepare(`
    INSERT INTO users (id, store_id, name, username, password_hash, role, active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(id, storeId, name, username, hashPassword(password), role);
  return listUsers().find((user) => user.id === id);
}

function publicUser(user) {
  return {
    id: user.id,
    store_id: user.store_id,
    store_name: user.store_name,
    name: user.name,
    username: user.username,
    role: user.role,
    active: user.active
  };
}

function getSessionToken(req) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/(?:^|;\s*)sgi_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(String(password || ''), salt, 32).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.startsWith('scrypt$')) return false;
  const [, salt, hash] = stored.split('$');
  const candidate = scryptSync(String(password || ''), salt, 32);
  const expected = Buffer.from(hash, 'hex');
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

function serveStatic(res, pathname) {
  const file = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = join(PUBLIC_DIR, file);
  if (!filePath.startsWith(PUBLIC_DIR) || !existsSync(filePath)) {
    sendText(res, 404, 'No encontrado');
    return;
  }

  const ext = extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  res.end(readFileSync(filePath));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error('Solicitud demasiado grande'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('JSON invalido'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function sendText(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(body);
}

function cleanOptional(value) {
  const text = String(value ?? '').trim();
  return text || null;
}

function normalizeImage(value) {
  const text = cleanOptional(value);
  if (!text) return null;
  if (!text.startsWith('data:image/')) throw new Error('La imagen debe ser JPG, PNG o WEBP');
  if (text.length > 1_300_000) throw new Error('La imagen optimizada sigue siendo demasiado pesada');
  return text;
}

function normalizePaymentMethod(value) {
  const method = String(value || 'cash').trim();
  if (!['cash', 'qr'].includes(method)) throw new Error('Metodo de pago invalido');
  return method;
}

function normalizePaymentDetails(method, total, cashReceived, qrTransactionCode) {
  if (method === 'cash') {
    const received = normalizeMoney(cashReceived);
    if (!Number.isFinite(received) || received < total) throw new Error('El efectivo recibido no cubre el total');
    return {
      cash_received: received,
      cash_change: normalizeMoney(received - total),
      qr_transaction_code: null
    };
  }

  return {
    cash_received: null,
    cash_change: null,
    qr_transaction_code: qrTransactionCode
  };
}

function cleanDate(value) {
  const text = String(value || '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function normalizeMoney(value) {
  const number = Number(value || 0);
  return Math.round(number * 100) / 100;
}
