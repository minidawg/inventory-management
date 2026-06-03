-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 0009: Denormalize tenant_id onto all tables
--
-- SAFE: No data is deleted. Adds columns, backfills from existing FK chains,
-- then replaces join-chain RLS policies with simple direct checks.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Drop the dead set_tenant_id function (from audit fix) ────────────────
DROP FUNCTION IF EXISTS public.set_tenant_id(text);

-- ─── 2. Fix current_tenant_id() — remove 'default' fallback (fail-closed) ───
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (auth.jwt()->'app_metadata'->>'tenant_id'),
    current_setting('app.tenant_id', true)
  );
$$ LANGUAGE SQL STABLE;

-- ─── 3. Add tenant_id columns (nullable first, with default for new inserts) ─
ALTER TABLE collections ADD COLUMN IF NOT EXISTS tenant_id text
  DEFAULT (auth.jwt()->'app_metadata'->>'tenant_id');

ALTER TABLE articles ADD COLUMN IF NOT EXISTS tenant_id text
  DEFAULT (auth.jwt()->'app_metadata'->>'tenant_id');

ALTER TABLE skus ADD COLUMN IF NOT EXISTS tenant_id text
  DEFAULT (auth.jwt()->'app_metadata'->>'tenant_id');

ALTER TABLE purchases ADD COLUMN IF NOT EXISTS tenant_id text
  DEFAULT (auth.jwt()->'app_metadata'->>'tenant_id');

ALTER TABLE sales ADD COLUMN IF NOT EXISTS tenant_id text
  DEFAULT (auth.jwt()->'app_metadata'->>'tenant_id');

-- ─── 4. Backfill tenant_id from existing FK chains ──────────────────────────
-- collections → brands.tenant_id
UPDATE collections c
SET tenant_id = b.tenant_id
FROM brands b
WHERE c.brand_id = b.id
  AND c.tenant_id IS NULL;

-- articles → collections → brands
UPDATE articles a
SET tenant_id = b.tenant_id
FROM collections c
JOIN brands b ON c.brand_id = b.id
WHERE a.collection_id = c.id
  AND a.tenant_id IS NULL;

-- skus → articles → collections → brands
UPDATE skus s
SET tenant_id = b.tenant_id
FROM articles a
JOIN collections c ON a.collection_id = c.id
JOIN brands b ON c.brand_id = b.id
WHERE s.article_id = a.id
  AND s.tenant_id IS NULL;

-- purchases → skus (already backfilled)
UPDATE purchases p
SET tenant_id = s.tenant_id
FROM skus s
WHERE p.sku_id = s.id
  AND p.tenant_id IS NULL;

-- sales → skus (already backfilled)
UPDATE sales sa
SET tenant_id = s.tenant_id
FROM skus s
WHERE sa.sku_id = s.id
  AND sa.tenant_id IS NULL;

-- ─── 5. Set NOT NULL now that all rows are backfilled ────────────────────────
ALTER TABLE collections ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE articles     ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE skus         ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE purchases    ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE sales        ALTER COLUMN tenant_id SET NOT NULL;

-- ─── 6. Add indexes for RLS performance ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_collections_tenant_id ON collections (tenant_id);
CREATE INDEX IF NOT EXISTS idx_articles_tenant_id    ON articles (tenant_id);
CREATE INDEX IF NOT EXISTS idx_skus_tenant_id        ON skus (tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchases_tenant_id   ON purchases (tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_id       ON sales (tenant_id);

-- ─── 7. Replace complex join-chain RLS policies with simple direct checks ────

-- collections
DROP POLICY IF EXISTS "tenant_isolation" ON collections;
CREATE POLICY "tenant_isolation" ON collections
  FOR ALL TO authenticated
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- articles
DROP POLICY IF EXISTS "tenant_isolation" ON articles;
CREATE POLICY "tenant_isolation" ON articles
  FOR ALL TO authenticated
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- skus
DROP POLICY IF EXISTS "tenant_isolation" ON skus;
CREATE POLICY "tenant_isolation" ON skus
  FOR ALL TO authenticated
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- purchases
DROP POLICY IF EXISTS "tenant_isolation" ON purchases;
CREATE POLICY "tenant_isolation" ON purchases
  FOR ALL TO authenticated
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- sales
DROP POLICY IF EXISTS "tenant_isolation" ON sales;
CREATE POLICY "tenant_isolation" ON sales
  FOR ALL TO authenticated
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- ─── 8. Update SECURITY DEFINER RPCs — use direct tenant_id checks ──────────

-- record_sale_atomic: simplified tenant guard
CREATE OR REPLACE FUNCTION record_sale_atomic(
  p_sku_id UUID,
  p_quantity INT,
  p_selling_price NUMERIC,
  p_cost_pkr NUMERIC,
  p_exchange_rate NUMERIC,
  p_channel TEXT DEFAULT NULL,
  p_client_name TEXT DEFAULT NULL,
  p_payment_method TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_sale_id   UUID;
  v_remaining INT;
  v_tenant    TEXT := current_tenant_id();
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM skus WHERE id = p_sku_id AND tenant_id = v_tenant
  ) THEN
    RETURN json_build_object('error', 'SKU not found or access denied');
  END IF;

  UPDATE skus SET quantity = quantity - p_quantity
  WHERE id = p_sku_id AND tenant_id = v_tenant AND quantity >= p_quantity
  RETURNING quantity INTO v_remaining;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Insufficient stock');
  END IF;

  INSERT INTO sales (
    sku_id, quantity, selling_price, cost_pkr_at_sale,
    exchange_rate_at_sale, channel, client_name, payment_method, tenant_id
  ) VALUES (
    p_sku_id, p_quantity, p_selling_price, p_cost_pkr,
    p_exchange_rate, p_channel, p_client_name, p_payment_method, v_tenant
  ) RETURNING id INTO v_sale_id;

  RETURN json_build_object('id', v_sale_id, 'remaining', v_remaining);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- record_multi_sale: simplified tenant guard
CREATE OR REPLACE FUNCTION record_multi_sale(
  p_items JSONB,
  p_channel TEXT DEFAULT NULL,
  p_client_name TEXT DEFAULT NULL,
  p_payment_method TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  item     JSONB;
  v_sku_id UUID;
  v_qty    INT;
  v_tenant TEXT := current_tenant_id();
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_sku_id := (item->>'sku_id')::UUID;
    v_qty    := (item->>'quantity')::INT;

    IF NOT EXISTS (
      SELECT 1 FROM skus WHERE id = v_sku_id AND tenant_id = v_tenant
    ) THEN
      RAISE EXCEPTION 'SKU % not found or access denied', v_sku_id;
    END IF;

    UPDATE skus SET quantity = quantity - v_qty
    WHERE id = v_sku_id AND tenant_id = v_tenant AND quantity >= v_qty;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient stock for SKU %', v_sku_id;
    END IF;

    INSERT INTO sales (
      sku_id, quantity, selling_price, cost_pkr_at_sale,
      exchange_rate_at_sale, channel, client_name, payment_method, tenant_id
    ) VALUES (
      v_sku_id, v_qty,
      (item->>'selling_price')::NUMERIC,
      (item->>'cost_pkr')::NUMERIC,
      (item->>'exchange_rate')::NUMERIC,
      p_channel, p_client_name, p_payment_method, v_tenant
    );
  END LOOP;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- delete_sale_atomic: simplified tenant guard
CREATE OR REPLACE FUNCTION delete_sale_atomic(p_sale_id UUID)
RETURNS JSON AS $$
DECLARE
  v_sku_id UUID;
  v_qty    INT;
  v_tenant TEXT := current_tenant_id();
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM sales WHERE id = p_sale_id AND tenant_id = v_tenant
  ) THEN
    RETURN json_build_object('error', 'Sale not found or access denied');
  END IF;

  DELETE FROM sales WHERE id = p_sale_id AND tenant_id = v_tenant
  RETURNING sku_id, quantity INTO v_sku_id, v_qty;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Sale not found');
  END IF;

  UPDATE skus SET quantity = quantity + v_qty
  WHERE id = v_sku_id AND tenant_id = v_tenant;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- delete_purchase_atomic: simplified tenant guard
CREATE OR REPLACE FUNCTION delete_purchase_atomic(p_purchase_id UUID)
RETURNS JSON AS $$
DECLARE
  v_sku_id UUID;
  v_qty    INT;
  v_tenant TEXT := current_tenant_id();
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM purchases WHERE id = p_purchase_id AND tenant_id = v_tenant
  ) THEN
    RETURN json_build_object('error', 'Purchase not found or access denied');
  END IF;

  DELETE FROM purchases WHERE id = p_purchase_id AND tenant_id = v_tenant
  RETURNING sku_id, quantity INTO v_sku_id, v_qty;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Purchase not found');
  END IF;

  UPDATE skus SET quantity = GREATEST(0, quantity - v_qty)
  WHERE id = v_sku_id AND tenant_id = v_tenant;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- stock_in_sku: simplified tenant guard
CREATE OR REPLACE FUNCTION stock_in_sku(
  p_sku_id              UUID,
  p_quantity            INT,
  p_total_cost_per_unit NUMERIC,
  p_exchange_rate       NUMERIC
) RETURNS VOID AS $$
DECLARE
  v_tenant TEXT := current_tenant_id();
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM skus WHERE id = p_sku_id AND tenant_id = v_tenant
  ) THEN
    RAISE EXCEPTION 'SKU not found or access denied';
  END IF;

  UPDATE skus SET
    avg_cost_pkr = CASE
      WHEN quantity + p_quantity = 0 THEN 0
      ELSE (avg_cost_pkr * quantity + p_total_cost_per_unit * p_quantity)
           / (quantity + p_quantity)
    END,
    avg_exchange_rate = CASE
      WHEN quantity + p_quantity = 0 THEN 0
      ELSE (avg_exchange_rate * quantity + p_exchange_rate * p_quantity)
           / (quantity + p_quantity)
    END,
    quantity = quantity + p_quantity
  WHERE id = p_sku_id AND tenant_id = v_tenant;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
