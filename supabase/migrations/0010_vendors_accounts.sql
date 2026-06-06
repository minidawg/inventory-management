-- Migration 0010: Vendors & Accounts Payable (shared across tenants)
-- Additive only — does NOT break existing data

-- 1. Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  tenant_id  text        NOT NULL DEFAULT (auth.jwt()->'app_metadata'->>'tenant_id'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON vendors FOR ALL TO authenticated
  USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());
CREATE INDEX IF NOT EXISTS idx_vendors_tenant_id ON vendors (tenant_id);

-- 2. Vendor payments table
CREATE TABLE IF NOT EXISTS vendor_payments (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id      uuid        NOT NULL REFERENCES vendors (id) ON DELETE CASCADE,
  amount         numeric     NOT NULL CHECK (amount > 0),
  payment_date   text        NOT NULL,
  notes          text,
  payment_method text,
  tenant_id      text        NOT NULL DEFAULT (auth.jwt()->'app_metadata'->>'tenant_id'),
  created_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE vendor_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON vendor_payments FOR ALL TO authenticated
  USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());
CREATE INDEX IF NOT EXISTS idx_vendor_payments_tenant_id ON vendor_payments (tenant_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_vendor_id ON vendor_payments (vendor_id);

-- 3. Add vendor columns to purchases
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES vendors (id) ON DELETE SET NULL;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS amount_paid_at_purchase numeric NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_purchases_vendor_id ON purchases (vendor_id);

-- 4. Add vendor_id to overheads
ALTER TABLE overheads ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES vendors (id) ON DELETE SET NULL;

-- 5. Add Vendor Payment to overhead categories (no constraint change needed — text column)
