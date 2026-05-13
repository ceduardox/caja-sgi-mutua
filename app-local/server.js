const { createServer } = require('node:http');
const { readFileSync, existsSync, mkdirSync } = require('node:fs');
const { join, extname } = require('node:path');
const { randomUUID } = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;
const PUBLIC_DIR = join(ROOT, 'public');
const DATA_DIR = join(ROOT, 'data');
const DB_PATH = join(DATA_DIR, 'sgi-market-caja.sqlite');
const STORE_ID = 'local-store';
const DEVICE_ID = 'local-device';
const USER_ID = 'admin-local';

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec(readFileSync(join(ROOT, 'sqlite_schema.sql'), 'utf8'));
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
    sendJson(res, 500, { error: error.message || 'Error interno' });
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
  `).run(STORE_ID, 'Mutualista', 'trial');

  db.prepare(`
    INSERT OR IGNORE INTO devices (id, store_id, name)
    VALUES (?, ?, ?)
  `).run(DEVICE_ID, STORE_ID, 'Caja principal');

  db.prepare(`
    INSERT OR IGNORE INTO users (id, store_id, name, username, password_hash, role)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(USER_ID, STORE_ID, 'Administrador', 'admin', 'local-demo', 'admin');

  db.prepare(`
    INSERT OR IGNORE INTO categories (id, store_id, name)
    VALUES (?, ?, ?)
  `).run('cat-general', STORE_ID, 'General');

  const count = db.prepare('SELECT COUNT(*) AS count FROM products WHERE store_id = ?').get(STORE_ID).count;
  if (count === 0) {
    const insert = db.prepare(`
      INSERT INTO products (
        id, store_id, category_id, barcode, sku, name, cost_price, sale_price,
        stock, min_stock, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    insert.run(randomUUID(), STORE_ID, 'cat-general', '7750001000012', 'PROD-001', 'Agua mineral 600 ml', 2.5, 5, 24, 5);
    insert.run(randomUUID(), STORE_ID, 'cat-general', '7750001000029', 'PROD-002', 'Galletas vainilla', 3, 6, 18, 6);
    insert.run(randomUUID(), STORE_ID, 'cat-general', '7750001000036', 'PROD-003', 'Jugo personal', 4, 8, 12, 4);
  }
}

async function handleApi(req, res, url) {
  const method = req.method || 'GET';

  if (method === 'GET' && url.pathname === '/api/health') {
    sendJson(res, 200, {
      ok: true,
      mode: 'local',
      storeId: STORE_ID,
      deviceId: DEVICE_ID,
      now: new Date().toISOString()
    });
    return;
  }

  if (method === 'GET' && url.pathname === '/api/products') {
    const q = (url.searchParams.get('q') || '').trim();
    const products = listProducts(q);
    sendJson(res, 200, { products });
    return;
  }

  if (method === 'POST' && url.pathname === '/api/products') {
    const body = await readJson(req);
    const product = createProduct(body);
    enqueueSync('product', product.id, 'create', product);
    sendJson(res, 201, { product });
    return;
  }

  const productMatch = url.pathname.match(/^\/api\/products\/([^/]+)$/);
  if (productMatch && method === 'PUT') {
    const body = await readJson(req);
    const product = updateProduct(productMatch[1], body);
    enqueueSync('product', product.id, 'update', product);
    sendJson(res, 200, { product });
    return;
  }

  if (method === 'POST' && url.pathname === '/api/sales') {
    const body = await readJson(req);
    const sale = createSale(body);
    enqueueSync('sale', sale.id, 'create', sale);
    sendJson(res, 201, { sale });
    return;
  }

  if (method === 'GET' && url.pathname === '/api/sales') {
    sendJson(res, 200, { sales: listSales() });
    return;
  }

  if (method === 'GET' && url.pathname === '/api/summary') {
    sendJson(res, 200, getSummary());
    return;
  }

  sendJson(res, 404, { error: 'Ruta no encontrada' });
}

function listProducts(q = '') {
  if (!q) {
    return db.prepare(`
      SELECT id, barcode, sku, name, cost_price, sale_price, stock, min_stock, active, updated_at
      FROM products
      WHERE store_id = ?
      ORDER BY active DESC, name ASC
      LIMIT 500
    `).all(STORE_ID);
  }

  const needle = `%${q}%`;
  return db.prepare(`
    SELECT id, barcode, sku, name, cost_price, sale_price, stock, min_stock, active, updated_at
    FROM products
    WHERE store_id = ?
      AND (name LIKE ? OR barcode LIKE ? OR sku LIKE ?)
    ORDER BY active DESC, name ASC
    LIMIT 100
  `).all(STORE_ID, needle, needle, needle);
}

function createProduct(input) {
  const product = normalizeProduct(input);
  product.id = randomUUID();

  db.prepare(`
    INSERT INTO products (
      id, store_id, category_id, barcode, sku, name, description, cost_price,
      sale_price, stock, min_stock, active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    product.id,
    STORE_ID,
    'cat-general',
    product.barcode,
    product.sku,
    product.name,
    product.description,
    product.cost_price,
    product.sale_price,
    product.stock,
    product.min_stock,
    product.active
  );

  return getProduct(product.id);
}

function updateProduct(id, input) {
  const current = getProduct(id);
  if (!current) throw new Error('Producto no encontrado');

  const product = normalizeProduct({ ...current, ...input });
  db.prepare(`
    UPDATE products
    SET barcode = ?, sku = ?, name = ?, description = ?, cost_price = ?,
        sale_price = ?, stock = ?, min_stock = ?, active = ?, updated_at = CURRENT_TIMESTAMP
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
    product.active,
    id,
    STORE_ID
  );

  return getProduct(id);
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
    active: input.active === false || input.active === 0 ? 0 : 1
  };
}

function getProduct(id) {
  return db.prepare(`
    SELECT id, barcode, sku, name, description, cost_price, sale_price, stock, min_stock, active, updated_at
    FROM products
    WHERE id = ? AND store_id = ?
  `).get(id, STORE_ID);
}

function createSale(input) {
  const items = Array.isArray(input.items) ? input.items : [];
  if (items.length === 0) throw new Error('La venta no tiene productos');

  const openSession = ensureCashSession();
  const saleId = randomUUID();
  const now = new Date().toISOString();
  const paymentMethod = cleanOptional(input.payment_method ?? input.paymentMethod) || 'cash';

  db.exec('BEGIN IMMEDIATE');
  try {
    let subtotal = 0;
    const preparedItems = items.map((item) => {
      const product = db.prepare(`
        SELECT id, barcode, name, sale_price, stock
        FROM products
        WHERE id = ? AND store_id = ? AND active = 1
      `).get(item.product_id ?? item.productId, STORE_ID);

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

    db.prepare(`
      INSERT INTO sales (
        id, store_id, device_id, cash_session_id, user_id, subtotal, total,
        payment_method, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)
    `).run(saleId, STORE_ID, DEVICE_ID, openSession.id, USER_ID, normalizeMoney(subtotal), total, paymentMethod, now);

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
      updateStock.run(item.quantity, item.product.id, STORE_ID);
      insertMovement.run(
        randomUUID(),
        STORE_ID,
        item.product.id,
        -item.quantity,
        item.product.stock,
        newStock,
        'Venta local',
        saleId,
        USER_ID
      );
    }

    db.exec('COMMIT');
    return getSale(saleId);
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function ensureCashSession() {
  const open = db.prepare(`
    SELECT id FROM cash_sessions
    WHERE store_id = ? AND device_id = ? AND status = 'open'
    ORDER BY opened_at DESC
    LIMIT 1
  `).get(STORE_ID, DEVICE_ID);
  if (open) return open;

  const id = randomUUID();
  db.prepare(`
    INSERT INTO cash_sessions (id, store_id, device_id, opened_by, opening_amount, status)
    VALUES (?, ?, ?, ?, 0, 'open')
  `).run(id, STORE_ID, DEVICE_ID, USER_ID);
  return { id };
}

function getSale(id) {
  const sale = db.prepare(`
    SELECT id, subtotal, discount_total, total, payment_method, status, created_at
    FROM sales
    WHERE id = ? AND store_id = ?
  `).get(id, STORE_ID);
  if (!sale) return null;

  sale.items = db.prepare(`
    SELECT product_id, product_name, barcode, quantity, unit_price, line_total
    FROM sale_items
    WHERE sale_id = ?
    ORDER BY created_at ASC
  `).all(id);

  return sale;
}

function listSales() {
  return db.prepare(`
    SELECT id, total, payment_method, status, created_at
    FROM sales
    WHERE store_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `).all(STORE_ID);
}

function getSummary() {
  const today = new Date().toISOString().slice(0, 10);
  const sales = db.prepare(`
    SELECT COUNT(*) AS count, COALESCE(SUM(total), 0) AS total
    FROM sales
    WHERE store_id = ? AND status = 'completed' AND substr(created_at, 1, 10) = ?
  `).get(STORE_ID, today);
  const lowStock = db.prepare(`
    SELECT COUNT(*) AS count
    FROM products
    WHERE store_id = ? AND active = 1 AND stock <= min_stock
  `).get(STORE_ID);
  const pendingSync = db.prepare(`
    SELECT COUNT(*) AS count
    FROM sync_queue
    WHERE store_id = ? AND status IN ('pending', 'failed', 'conflict')
  `).get(STORE_ID);

  return {
    today,
    sales_count: sales.count,
    sales_total: normalizeMoney(sales.total),
    low_stock_count: lowStock.count,
    pending_sync_count: pendingSync.count
  };
}

function enqueueSync(entityType, entityId, action, payload) {
  db.prepare(`
    INSERT INTO sync_queue (
      id, store_id, device_id, entity_type, entity_id, action, payload_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(randomUUID(), STORE_ID, DEVICE_ID, entityType, entityId, action, JSON.stringify(payload));
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

function normalizeMoney(value) {
  const number = Number(value || 0);
  return Math.round(number * 100) / 100;
}
