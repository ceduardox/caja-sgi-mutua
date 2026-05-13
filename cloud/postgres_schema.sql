-- SGI Market Caja - esquema inicial cloud PostgreSQL
-- La nube centraliza tiendas, licencias, reportes y sincronizacion.

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY,
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
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  address TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id),
  name TEXT NOT NULL,
  install_fingerprint TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cloud_sales (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id),
  device_id UUID NOT NULL REFERENCES devices(id),
  local_created_at TIMESTAMPTZ NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL,
  discount_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  payload_json JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, device_id, id)
);

CREATE TABLE IF NOT EXISTS sync_events (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id),
  device_id UUID NOT NULL REFERENCES devices(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'received',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  UNIQUE (store_id, device_id, id)
);

CREATE INDEX IF NOT EXISTS idx_cloud_sales_store_date ON cloud_sales(store_id, local_created_at);
CREATE INDEX IF NOT EXISTS idx_sync_events_status ON sync_events(status, created_at);

