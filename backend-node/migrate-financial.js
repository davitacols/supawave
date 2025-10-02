const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrateFinancial() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting financial management migration...');
    
    // Create expense categories table
    const createExpenseCategoriesTable = `
      CREATE TABLE IF NOT EXISTS finance_expensecategory (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id BIGINT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await client.query(createExpenseCategoriesTable);
    console.log('✅ Created expense categories table');
    
    // Create expenses table
    const createExpensesTable = `
      CREATE TABLE IF NOT EXISTS finance_expense (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id BIGINT NOT NULL,
        category_id UUID REFERENCES finance_expensecategory(id),
        amount DECIMAL(10,2) NOT NULL,
        description TEXT NOT NULL,
        expense_date DATE NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'cash',
        receipt_number VARCHAR(100),
        vendor_name VARCHAR(255),
        is_recurring BOOLEAN DEFAULT false,
        recurring_frequency VARCHAR(20),
        tags TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await client.query(createExpensesTable);
    console.log('✅ Created expenses table');
    
    // Create budgets table
    const createBudgetsTable = `
      CREATE TABLE IF NOT EXISTS finance_budget (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id BIGINT NOT NULL,
        category_id UUID REFERENCES finance_expensecategory(id),
        name VARCHAR(255) NOT NULL,
        budgeted_amount DECIMAL(10,2) NOT NULL,
        period_type VARCHAR(20) NOT NULL DEFAULT 'monthly',
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await client.query(createBudgetsTable);
    console.log('✅ Created budgets table');
    
    // Create financial accounts table
    const createAccountsTable = `
      CREATE TABLE IF NOT EXISTS finance_account (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id BIGINT NOT NULL,
        name VARCHAR(255) NOT NULL,
        account_type VARCHAR(50) NOT NULL,
        balance DECIMAL(10,2) DEFAULT 0,
        bank_name VARCHAR(255),
        account_number VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await client.query(createAccountsTable);
    console.log('✅ Created accounts table');
    
    // Create transactions table
    const createTransactionsTable = `
      CREATE TABLE IF NOT EXISTS finance_transaction (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id BIGINT NOT NULL,
        account_id UUID REFERENCES finance_account(id),
        type VARCHAR(20) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT NOT NULL,
        reference_id UUID,
        reference_type VARCHAR(50),
        transaction_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    await client.query(createTransactionsTable);
    console.log('✅ Created transactions table');
    
    // Insert default expense categories
    const insertDefaultCategories = `
      INSERT INTO finance_expensecategory (business_id, name, description) 
      SELECT 1, 'Rent & Utilities', 'Store rent, electricity, water, internet'
      WHERE NOT EXISTS (SELECT 1 FROM finance_expensecategory WHERE name = 'Rent & Utilities');
      
      INSERT INTO finance_expensecategory (business_id, name, description) 
      SELECT 1, 'Inventory Purchase', 'Cost of goods purchased for resale'
      WHERE NOT EXISTS (SELECT 1 FROM finance_expensecategory WHERE name = 'Inventory Purchase');
      
      INSERT INTO finance_expensecategory (business_id, name, description) 
      SELECT 1, 'Marketing', 'Advertising, promotions, social media'
      WHERE NOT EXISTS (SELECT 1 FROM finance_expensecategory WHERE name = 'Marketing');
      
      INSERT INTO finance_expensecategory (business_id, name, description) 
      SELECT 1, 'Staff Salaries', 'Employee wages and benefits'
      WHERE NOT EXISTS (SELECT 1 FROM finance_expensecategory WHERE name = 'Staff Salaries');
      
      INSERT INTO finance_expensecategory (business_id, name, description) 
      SELECT 1, 'Transportation', 'Delivery, fuel, vehicle maintenance'
      WHERE NOT EXISTS (SELECT 1 FROM finance_expensecategory WHERE name = 'Transportation');
    `;
    
    await client.query(insertDefaultCategories);
    console.log('✅ Inserted default expense categories');
    
    // Create indexes
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_expenses_business_date ON finance_expense(business_id, expense_date);
      CREATE INDEX IF NOT EXISTS idx_expenses_category ON finance_expense(category_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_account ON finance_transaction(account_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON finance_transaction(business_id, transaction_date);
    `;
    
    await client.query(createIndexes);
    console.log('✅ Created financial indexes');
    
    console.log('🎉 Financial management migration completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateFinancial().catch(console.error);