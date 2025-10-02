-- Inventory Transfer System Migration

-- Create inventory_transfers table
CREATE TABLE IF NOT EXISTS inventory_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id BIGINT NOT NULL,
  from_store_id UUID NOT NULL,
  to_store_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  created_by BIGINT NOT NULL,
  approved_by BIGINT,
  completed_by BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  completed_at TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES accounts_business(id),
  FOREIGN KEY (from_store_id) REFERENCES stores(id),
  FOREIGN KEY (to_store_id) REFERENCES stores(id),
  FOREIGN KEY (created_by) REFERENCES accounts_user(id),
  FOREIGN KEY (approved_by) REFERENCES accounts_user(id),
  FOREIGN KEY (completed_by) REFERENCES accounts_user(id)
);

-- Create transfer_items table
CREATE TABLE IF NOT EXISTS transfer_items (
  id SERIAL PRIMARY KEY,
  transfer_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10,2),
  notes TEXT,
  FOREIGN KEY (transfer_id) REFERENCES inventory_transfers(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES inventory_product(id)
);

-- Create store_inventory table for store-specific stock
CREATE TABLE IF NOT EXISTS store_inventory (
  id SERIAL PRIMARY KEY,
  store_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity INTEGER DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES inventory_product(id) ON DELETE CASCADE,
  UNIQUE(store_id, product_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_business_id ON inventory_transfers(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_status ON inventory_transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfer_items_transfer_id ON transfer_items(transfer_id);
CREATE INDEX IF NOT EXISTS idx_store_inventory_store_id ON store_inventory(store_id);
CREATE INDEX IF NOT EXISTS idx_store_inventory_product_id ON store_inventory(product_id);