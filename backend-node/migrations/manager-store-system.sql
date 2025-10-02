-- Manager-Store Assignment System Migration

-- Add manager_id column to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS manager_id BIGINT;
ALTER TABLE stores ADD CONSTRAINT fk_stores_manager 
  FOREIGN KEY (manager_id) REFERENCES accounts_user(id) ON DELETE SET NULL;

-- Create store_staff table for staff assignments to stores
CREATE TABLE IF NOT EXISTS store_staff (
  id SERIAL PRIMARY KEY,
  store_id UUID NOT NULL,
  staff_id BIGINT NOT NULL,
  assigned_by BIGINT NOT NULL,
  assigned_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES accounts_user(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES accounts_user(id) ON DELETE CASCADE,
  UNIQUE(store_id, staff_id)
);

-- Create manager_permissions table
CREATE TABLE IF NOT EXISTS manager_permissions (
  id SERIAL PRIMARY KEY,
  manager_id BIGINT NOT NULL,
  store_id UUID NOT NULL,
  can_manage_inventory BOOLEAN DEFAULT true,
  can_manage_sales BOOLEAN DEFAULT true,
  can_manage_staff BOOLEAN DEFAULT true,
  can_view_reports BOOLEAN DEFAULT true,
  granted_by BIGINT NOT NULL,
  granted_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (manager_id) REFERENCES accounts_user(id) ON DELETE CASCADE,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES accounts_user(id) ON DELETE CASCADE,
  UNIQUE(manager_id, store_id)
);

-- Add current_store_id to accounts_user for active store context
ALTER TABLE accounts_user ADD COLUMN IF NOT EXISTS current_store_id UUID;
ALTER TABLE accounts_user ADD CONSTRAINT fk_user_current_store 
  FOREIGN KEY (current_store_id) REFERENCES stores(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stores_manager_id ON stores(manager_id);
CREATE INDEX IF NOT EXISTS idx_store_staff_store_id ON store_staff(store_id);
CREATE INDEX IF NOT EXISTS idx_store_staff_staff_id ON store_staff(staff_id);
CREATE INDEX IF NOT EXISTS idx_manager_permissions_manager_id ON manager_permissions(manager_id);
CREATE INDEX IF NOT EXISTS idx_manager_permissions_store_id ON manager_permissions(store_id);