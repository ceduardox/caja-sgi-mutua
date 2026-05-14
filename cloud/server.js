const { createServer } = require('node:http');
const { readFileSync, existsSync } = require('node:fs');
const { join, extname } = require('node:path');
const { randomBytes, scryptSync, timingSafeEqual } = require('node:crypto');
const { Pool } = require('pg');

loadEnv();

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const PUBLIC_DIR = join(ROOT, 'public');
const SCHEMA_PATH = join(ROOT, 'postgres_schema.sql');
const COOKIE_NAME = process.env.COOKIE_NAME || 'sgi_market_session';
const sessions = new Map();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL es obligatorio para el backend cloud.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined
});

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

bootstrap().then(() => {
  createServer(handleRequest).listen(PORT, () => {
    console.log(`SGI Market Cloud: http://localhost:${PORT}`);
  });
}).catch((error) => {
  console.error(error);
  process.exit(1);
});

async function bootstrap() {
  await pool.query(readFileSync(SCHEMA_PATH, 'utf8'));
  await seedMasterAdmin();
}

async function handleRequest(req, res) {
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
}

async function handleApi(req, res, url) {
  const method = req.method || 'GET';

  if (method === 'GET' && url.pathname === '/api/health') {
    const dbTime = await pool.query('SELECT now() AS now');
    sendJson(res, 200, { ok: true, mode: 'cloud', now: dbTime.rows[0].now });
    return;
  }

  if (method === 'POST' && url.pathname === '/api/login') {
    const body = await readJson(req);
    const user = await loginUser(body.username, body.password);
    const token = randomToken();
    sessions.set(token, { userId: user.id, createdAt: Date.now() });
    setSessionCookie(res, token);
    sendJson(res, 200, { user });
    return;
  }

  if (method === 'POST' && url.pathname === '/api/logout') {
    const token = getSessionToken(req);
    if (token) sessions.delete(token);
    clearSessionCookie(res);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (method === 'POST' && url.pathname === '/api/sync/push') {
    const body = await readJson(req);
    await ensureSyncDevice(body);
    await handleSyncPush(body, res);
    return;
  }

  if (method === 'POST' && url.pathname === '/api/bootstrap/login') {
    await handleBootstrapLogin(req, res);
    return;
  }

  const ctx = await getRequestContext(req);

  if (method === 'GET' && url.pathname === '/api/session') {
    sendJson(res, 200, { user: ctx.user });
    return;
  }

  if (method === 'GET' && url.pathname === '/api/dashboard') {
    requireRole(ctx, ['master_admin', 'tenant_owner', 'branch_admin']);
    sendJson(res, 200, await getDashboard(ctx));
    return;
  }

  if (method === 'GET' && url.pathname === '/api/tenants') {
    requireRole(ctx, ['master_admin']);
    sendJson(res, 200, { tenants: await listTenants() });
    return;
  }

  if (method === 'POST' && url.pathname === '/api/tenants') {
    requireRole(ctx, ['master_admin']);
    const tenant = await createTenant(await readJson(req));
    sendJson(res, 201, { tenant });
    return;
  }

  if (method === 'GET' && url.pathname === '/api/stores') {
    requireRole(ctx, ['master_admin', 'tenant_owner', 'branch_admin']);
    sendJson(res, 200, { stores: await listStores(ctx) });
    return;
  }

  if (method === 'POST' && url.pathname === '/api/stores') {
    requireRole(ctx, ['master_admin', 'tenant_owner']);
    const store = await createStore(ctx, await readJson(req));
    sendJson(res, 201, { store });
    return;
  }

  if (method === 'GET' && url.pathname === '/api/users') {
    requireRole(ctx, ['master_admin', 'tenant_owner', 'branch_admin']);
    sendJson(res, 200, { users: await listUsers(ctx) });
    return;
  }

  if (method === 'POST' && url.pathname === '/api/users') {
    requireRole(ctx, ['master_admin', 'tenant_owner', 'branch_admin']);
    const user = await createUser(ctx, await readJson(req));
    sendJson(res, 201, { user });
    return;
  }

  if (method === 'GET' && url.pathname === '/api/sales') {
    requireRole(ctx, ['master_admin', 'tenant_owner', 'branch_admin']);
    sendJson(res, 200, { sales: await listSales(ctx) });
    return;
  }

  sendJson(res, 404, { error: 'Ruta no encontrada' });
}

async function seedMasterAdmin() {
  const username = cleanRequired(process.env.MASTER_ADMIN_USERNAME, 'MASTER_ADMIN_USERNAME');
  const password = cleanRequired(process.env.MASTER_ADMIN_PASSWORD, 'MASTER_ADMIN_PASSWORD');
  const name = process.env.MASTER_ADMIN_NAME || 'Administrador Maestro';
  const email = cleanOptional(process.env.MASTER_ADMIN_EMAIL);
  const existing = await pool.query('SELECT id FROM cloud_users WHERE username = $1', [username]);
  if (existing.rowCount > 0) return;
  await pool.query(`
    INSERT INTO cloud_users (name, username, email, password_hash, role)
    VALUES ($1, $2, $3, $4, 'master_admin')
  `, [name, username, email, hashPassword(password)]);
}

async function loginUser(username, password) {
  const cleanUsername = String(username || '').trim();
  const result = await pool.query(`
    SELECT id, tenant_id, store_id, name, username, email, password_hash, role, active
    FROM cloud_users
    WHERE username = $1
  `, [cleanUsername]);
  const user = result.rows[0];
  if (!user || !user.active || !verifyPassword(password, user.password_hash)) {
    throw new HttpError(401, 'Usuario o contrasena incorrectos');
  }
  return publicUser(user);
}

async function handleBootstrapLogin(req, res) {
  const body = await readJson(req);
  const user = await loginUser(body.username, body.password);
  if (user.role === 'master_admin') throw new HttpError(403, 'El admin maestro no instala cajas locales');
  const stores = await getBootstrapStores(user);
  if (stores.length === 0) throw new HttpError(403, 'El usuario no tiene sucursal asignada');
  sendJson(res, 200, { user, stores });
}

async function getBootstrapStores(user) {
  if (user.role === 'tenant_owner') {
    const result = await pool.query(`
      SELECT id, tenant_id, name, address, active
      FROM stores
      WHERE tenant_id = $1 AND active = TRUE
      ORDER BY name ASC
    `, [user.tenant_id]);
    return result.rows;
  }
  const result = await pool.query(`
    SELECT id, tenant_id, name, address, active
    FROM stores
    WHERE id = $1 AND active = TRUE
  `, [user.store_id]);
  return result.rows;
}

async function getRequestContext(req) {
  const token = getSessionToken(req);
  const session = token ? sessions.get(token) : null;
  if (!session) throw new HttpError(401, 'Sesion requerida');
  const result = await pool.query(`
    SELECT id, tenant_id, store_id, name, username, email, role, active
    FROM cloud_users
    WHERE id = $1
  `, [session.userId]);
  const user = result.rows[0];
  if (!user || !user.active) {
    sessions.delete(token);
    throw new HttpError(401, 'Sesion invalida');
  }
  return { user: publicUser(user) };
}

function requireRole(ctx, roles) {
  if (!roles.includes(ctx.user.role)) throw new HttpError(403, 'No tienes permiso');
}

async function getDashboard(ctx) {
  const storeScope = storeScopeFilter(ctx, 's');
  const saleScope = saleScopeFilter(ctx, 's');
  const [tenants, stores, users, sales, today] = await Promise.all([
    ctx.user.role === 'master_admin' ? pool.query('SELECT COUNT(*)::int AS count FROM tenants') : { rows: [{ count: 0 }] },
    pool.query(`SELECT COUNT(*)::int AS count FROM stores s ${storeScope.where}`, storeScope.values),
    pool.query(`SELECT COUNT(*)::int AS count FROM cloud_users u ${userScopeWhere(ctx)}`, userScopeValues(ctx)),
    pool.query(`SELECT COUNT(*)::int AS count, COALESCE(SUM(total), 0)::float AS total FROM cloud_sales s ${saleScope.join} ${saleScope.where}`, saleScope.values),
    pool.query(`
      SELECT COUNT(*)::int AS count, COALESCE(SUM(total), 0)::float AS total
      FROM cloud_sales s
      ${saleScope.join}
      ${saleScope.where ? `${saleScope.where} AND` : 'WHERE'} s.local_created_at::date = CURRENT_DATE
    `, saleScope.values)
  ]);
  return {
    tenants: tenants.rows[0].count,
    stores: stores.rows[0].count,
    users: users.rows[0].count,
    sales_count: sales.rows[0].count,
    sales_total: Number(sales.rows[0].total || 0),
    today_count: today.rows[0].count,
    today_total: Number(today.rows[0].total || 0)
  };
}

async function listTenants() {
  const result = await pool.query(`
    SELECT id, business_name, owner_name, owner_email, status, plan_code, created_at
    FROM tenants
    ORDER BY created_at DESC
    LIMIT 100
  `);
  return result.rows;
}

async function createTenant(input) {
  const businessName = cleanRequired(input.business_name || input.businessName, 'Nombre de negocio');
  const ownerName = cleanOptional(input.owner_name || input.ownerName);
  const ownerEmail = cleanOptional(input.owner_email || input.ownerEmail);
  const result = await pool.query(`
    INSERT INTO tenants (business_name, owner_name, owner_email)
    VALUES ($1, $2, $3)
    RETURNING id, business_name, owner_name, owner_email, status, plan_code, created_at
  `, [businessName, ownerName, ownerEmail]);
  return result.rows[0];
}

async function listStores(ctx) {
  const filter = storeScopeFilter(ctx, 's');
  const result = await pool.query(`
    SELECT s.id, s.tenant_id, t.business_name, s.name, s.address, s.active, s.created_at
    FROM stores s
    JOIN tenants t ON t.id = s.tenant_id
    ${filter.where}
    ORDER BY t.business_name ASC, s.name ASC
  `, filter.values);
  return result.rows;
}

async function createStore(ctx, input) {
  const tenantId = ctx.user.role === 'master_admin'
    ? cleanRequired(input.tenant_id || input.tenantId, 'Cliente')
    : ctx.user.tenant_id;
  const name = cleanRequired(input.name, 'Nombre de sucursal');
  const address = cleanOptional(input.address);
  const result = await pool.query(`
    INSERT INTO stores (tenant_id, name, address)
    VALUES ($1, $2, $3)
    RETURNING id, tenant_id, name, address, active, created_at
  `, [tenantId, name, address]);
  return result.rows[0];
}

async function listUsers(ctx) {
  const result = await pool.query(`
    SELECT u.id, u.tenant_id, u.store_id, t.business_name, s.name AS store_name,
      u.name, u.username, u.email, u.role, u.active, u.created_at
    FROM cloud_users u
    LEFT JOIN tenants t ON t.id = u.tenant_id
    LEFT JOIN stores s ON s.id = u.store_id
    ${userScopeWhere(ctx)}
    ORDER BY u.created_at DESC
    LIMIT 100
  `, userScopeValues(ctx));
  return result.rows;
}

async function createUser(ctx, input) {
  const name = cleanRequired(input.name, 'Nombre');
  const username = cleanRequired(input.username, 'Usuario');
  const password = cleanRequired(input.password, 'Contrasena');
  const email = cleanOptional(input.email);
  let role = cleanRequired(input.role, 'Rol');
  let tenantId = cleanOptional(input.tenant_id || input.tenantId);
  let storeId = cleanOptional(input.store_id || input.storeId);

  if (!['tenant_owner', 'branch_admin', 'editor', 'cashier'].includes(role)) {
    throw new HttpError(400, 'Rol invalido');
  }
  if (ctx.user.role === 'tenant_owner') {
    tenantId = ctx.user.tenant_id;
    if (!['branch_admin', 'editor', 'cashier'].includes(role)) throw new HttpError(403, 'Rol no permitido');
  }
  if (ctx.user.role === 'branch_admin') {
    tenantId = ctx.user.tenant_id;
    storeId = ctx.user.store_id;
    if (!['editor', 'cashier'].includes(role)) throw new HttpError(403, 'Rol no permitido');
  }
  if (role !== 'tenant_owner' && !storeId) throw new HttpError(400, 'Sucursal requerida');
  if (!tenantId) throw new HttpError(400, 'Cliente requerido');

  const result = await pool.query(`
    INSERT INTO cloud_users (tenant_id, store_id, name, username, email, password_hash, role)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, tenant_id, store_id, name, username, email, role, active, created_at
  `, [tenantId, storeId, name, username, email, hashPassword(password), role]);
  return result.rows[0];
}

async function listSales(ctx) {
  const filter = saleScopeFilter(ctx, 's');
  const result = await pool.query(`
    SELECT s.id, s.store_id, st.name AS store_name, t.business_name, s.total,
      s.payment_method, s.status, s.local_created_at, s.received_at
    FROM cloud_sales s
    JOIN stores st ON st.id = s.store_id
    JOIN tenants t ON t.id = st.tenant_id
    ${filter.join}
    ${filter.where}
    ORDER BY s.local_created_at DESC
    LIMIT 100
  `, filter.values);
  return result.rows;
}

async function handleSyncPush(body, res) {
  const storeId = cleanRequired(body.store_id || body.storeId, 'store_id');
  const deviceId = cleanOptional(body.device_id || body.deviceId);
  const events = Array.isArray(body.events) ? body.events : [];
  if (events.length === 0) throw new HttpError(400, 'No hay eventos para sincronizar');
  if (events.length > Number(process.env.SYNC_BATCH_SIZE || 100)) throw new HttpError(400, 'Lote demasiado grande');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const processed = [];
    for (const event of events) {
      const localEventId = String(event.id || event.local_event_id || '').trim() || null;
      const entityType = cleanRequired(event.entity_type || event.entityType, 'entity_type');
      const entityId = cleanRequired(event.entity_id || event.entityId, 'entity_id');
      const action = cleanRequired(event.action, 'action');
      const payload = event.payload || event.payload_json || {};
      const inserted = await client.query(`
        INSERT INTO sync_events (store_id, device_id, local_event_id, entity_type, entity_id, action, payload_json)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (store_id, local_event_id) DO NOTHING
        RETURNING id
      `, [storeId, deviceId, localEventId, entityType, entityId, action, payload]);

      if (entityType === 'sale' && inserted.rowCount > 0) {
        await upsertCloudSale(client, storeId, deviceId, entityId, action, payload);
      }
      processed.push({ local_event_id: localEventId, entity_type: entityType, entity_id: entityId, accepted: true });
    }
    await client.query('COMMIT');
    sendJson(res, 200, { ok: true, processed });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function ensureSyncDevice(body) {
  const storeId = cleanOptional(body.store_id || body.storeId);
  const deviceId = cleanOptional(body.device_id || body.deviceId);
  if (!storeId || !deviceId) return;
  await pool.query(`
    INSERT INTO devices (id, store_id, name, last_seen_at)
    VALUES ($1, $2, $3, now())
    ON CONFLICT (id) DO UPDATE SET
      store_id = excluded.store_id,
      last_seen_at = now()
  `, [deviceId, storeId, `Caja ${deviceId.slice(0, 8)}`]);
}

async function upsertCloudSale(client, storeId, deviceId, entityId, action, payload) {
  const sale = payload || {};
  const status = action === 'void' ? 'void' : (sale.status || 'completed');
  await client.query(`
    INSERT INTO cloud_sales (
      id, store_id, device_id, local_created_at, subtotal, discount_total,
      total, payment_method, status, payload_json
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (store_id, id) DO UPDATE SET
      total = EXCLUDED.total,
      payment_method = EXCLUDED.payment_method,
      status = EXCLUDED.status,
      payload_json = EXCLUDED.payload_json
  `, [
    entityId,
    storeId,
    deviceId,
    sale.created_at || sale.local_created_at || new Date().toISOString(),
    Number(sale.subtotal || sale.total || 0),
    Number(sale.discount_total || 0),
    Number(sale.total || 0),
    sale.payment_method || 'cash',
    status,
    sale
  ]);
}

function storeScopeFilter(ctx, alias) {
  if (ctx.user.role === 'master_admin') return { join: '', where: '', values: [] };
  if (ctx.user.role === 'tenant_owner') {
    return { join: '', where: `WHERE ${alias}.tenant_id = $1`, values: [ctx.user.tenant_id] };
  }
  return { join: '', where: `WHERE ${alias}.id = $1`, values: [ctx.user.store_id] };
}

function saleScopeFilter(ctx, alias) {
  if (ctx.user.role === 'master_admin') return { join: '', where: '', values: [] };
  if (ctx.user.role === 'tenant_owner') {
    return { join: `JOIN stores scoped_store ON scoped_store.id = ${alias}.store_id`, where: 'WHERE scoped_store.tenant_id = $1', values: [ctx.user.tenant_id] };
  }
  return { join: '', where: `WHERE ${alias}.store_id = $1`, values: [ctx.user.store_id] };
}

function userScopeWhere(ctx) {
  if (ctx.user.role === 'master_admin') return '';
  if (ctx.user.role === 'tenant_owner') return 'WHERE u.tenant_id = $1';
  return 'WHERE u.store_id = $1';
}

function userScopeValues(ctx) {
  if (ctx.user.role === 'master_admin') return [];
  if (ctx.user.role === 'tenant_owner') return [ctx.user.tenant_id];
  return [ctx.user.store_id];
}

function publicUser(user) {
  return {
    id: user.id,
    tenant_id: user.tenant_id,
    store_id: user.store_id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    active: user.active
  };
}

function serveStatic(res, pathname) {
  const cleanPath = pathname === '/' ? '/index.html' : pathname;
  const filePath = join(PUBLIC_DIR, cleanPath.replace(/^\/+/, ''));
  if (!filePath.startsWith(PUBLIC_DIR) || !existsSync(filePath)) {
    sendText(res, 404, 'No encontrado');
    return;
  }
  res.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream' });
  res.end(readFileSync(filePath));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function sendText(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(body);
}

function setSessionCookie(res, token) {
  const secure = String(process.env.COOKIE_SECURE || '').toLowerCase() === 'true' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secure}`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

function getSessionToken(req) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
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
  const actual = scryptSync(String(password || ''), salt, 32);
  const expected = Buffer.from(hash, 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function randomToken() {
  return randomBytes(32).toString('hex');
}

function cleanRequired(value, label) {
  const text = String(value || '').trim();
  if (!text) throw new HttpError(400, `${label} es obligatorio`);
  return text;
}

function cleanOptional(value) {
  const text = String(value || '').trim();
  return text || null;
}

function loadEnv() {
  const envPath = join(__dirname, '..', '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const clean = line.trim();
    if (!clean || clean.startsWith('#') || !clean.includes('=')) continue;
    const index = clean.indexOf('=');
    const key = clean.slice(0, index).trim();
    let value = clean.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
