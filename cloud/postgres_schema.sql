-- SGI Market Caja - esquema cloud PostgreSQL
-- La nube centraliza clientes, sucursales, usuarios, dispositivos y sincronizacion.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  owner_name TEXT,
  owner_phone TEXT,
  owner_email TEXT,
  status TEXT NOT NULL DEFAULT 'trial',
  plan_code TEXT NOT NULL DEFAULT 'starter',
  trial_until TIMESTAMPTZ,
  paid_until TIMESTAMPTZ,
  grace_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cloud_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  email TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('master_admin', 'tenant_owner', 'branch_admin', 'editor', 'cashier')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cloud_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES cloud_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  install_fingerprint TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cloud_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, name)
);

CREATE TABLE IF NOT EXISTS cloud_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category_id UUID REFERENCES cloud_categories(id) ON DELETE SET NULL,
  barcode TEXT,
  sku TEXT,
  name TEXT NOT NULL,
  cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock NUMERIC(12,2) NOT NULL DEFAULT 0,
  min_stock NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'unidad',
  description TEXT,
  image_data TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, barcode),
  UNIQUE (store_id, sku)
);

CREATE TABLE IF NOT EXISTS cloud_sales (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  device_id TEXT,
  cashier_user_id UUID REFERENCES cloud_users(id) ON DELETE SET NULL,
  cash_shift_id UUID,
  local_created_at TIMESTAMPTZ NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  cash_received NUMERIC(12,2),
  cash_change NUMERIC(12,2),
  qr_transaction_code TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  void_reason TEXT,
  voided_by UUID REFERENCES cloud_users(id) ON DELETE SET NULL,
  voided_at TIMESTAMPTZ,
  payload_json JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, id)
);

ALTER TABLE cloud_sales ADD COLUMN IF NOT EXISTS cashier_user_id UUID REFERENCES cloud_users(id) ON DELETE SET NULL;
ALTER TABLE cloud_sales ADD COLUMN IF NOT EXISTS cash_shift_id UUID;
ALTER TABLE cloud_sales ADD COLUMN IF NOT EXISTS cash_received NUMERIC(12,2);
ALTER TABLE cloud_sales ADD COLUMN IF NOT EXISTS cash_change NUMERIC(12,2);
ALTER TABLE cloud_sales ADD COLUMN IF NOT EXISTS qr_transaction_code TEXT;
ALTER TABLE cloud_sales ADD COLUMN IF NOT EXISTS void_reason TEXT;
ALTER TABLE cloud_sales ADD COLUMN IF NOT EXISTS voided_by UUID REFERENCES cloud_users(id) ON DELETE SET NULL;
ALTER TABLE cloud_sales ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS cloud_sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES cloud_sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES cloud_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  barcode TEXT,
  quantity NUMERIC(12,2) NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  total NUMERIC(12,2) NOT NULL
);

ALTER TABLE cloud_products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE cloud_products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES cloud_categories(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS cloud_cash_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES cloud_users(id) ON DELETE CASCADE,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opening_cash NUMERIC(12,2) NOT NULL DEFAULT 0,
  closed_at TIMESTAMPTZ,
  closing_cash NUMERIC(12,2),
  expected_cash NUMERIC(12,2),
  cash_difference NUMERIC(12,2),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cloud_cash_shifts_one_open ON cloud_cash_shifts(user_id) WHERE status = 'open';

CREATE TABLE IF NOT EXISTS cloud_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES cloud_products(id) ON DELETE SET NULL,
  user_id UUID REFERENCES cloud_users(id) ON DELETE SET NULL,
  movement_type TEXT NOT NULL,
  quantity NUMERIC(12,2) NOT NULL,
  previous_stock NUMERIC(12,2),
  new_stock NUMERIC(12,2),
  reason TEXT,
  reference_type TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cloud_sale_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES cloud_sales(id) ON DELETE CASCADE,
  user_id UUID REFERENCES cloud_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  reason TEXT,
  before_json JSONB,
  after_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sync_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  device_id TEXT,
  local_event_id TEXT,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'received',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  UNIQUE (store_id, local_event_id)
);

CREATE INDEX IF NOT EXISTS idx_cloud_users_role ON cloud_users(role);
CREATE INDEX IF NOT EXISTS idx_cloud_sessions_user ON cloud_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cloud_sessions_expires ON cloud_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_stores_tenant ON stores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cloud_products_store_name ON cloud_products(store_id, name);
CREATE INDEX IF NOT EXISTS idx_cloud_products_store_barcode ON cloud_products(store_id, barcode);
CREATE INDEX IF NOT EXISTS idx_cloud_sales_store_date ON cloud_sales(store_id, local_created_at);
CREATE INDEX IF NOT EXISTS idx_cloud_cash_shifts_store_date ON cloud_cash_shifts(store_id, opened_at);
CREATE INDEX IF NOT EXISTS idx_cloud_stock_movements_product_date ON cloud_stock_movements(store_id, product_id, created_at);
CREATE INDEX IF NOT EXISTS idx_cloud_sale_audit_sale ON cloud_sale_audit_logs(store_id, sale_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sync_events_status ON sync_events(status, created_at);
