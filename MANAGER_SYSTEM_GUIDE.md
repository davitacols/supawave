# Manager Assignment & Login System Guide

## Overview
This system allows business owners to assign managers to stores and enables managers to login and manage their assigned stores and staff.

## Database Structure

### Key Tables
- `accounts_user` - Users with roles (owner, manager, cashier)
- `stores` - Stores with optional manager assignment
- `store_staff` - Staff assignments to specific stores
- `manager_permissions` - Manager permissions for stores

### User Roles
- **Owner**: Can create stores, assign managers, manage all staff
- **Manager**: Can manage assigned stores and create/manage cashiers
- **Cashier**: Can access assigned stores for POS operations

## Setup Instructions

### 1. Run Database Migration
```bash
cd backend-node
node run-manager-migration.js
```

### 2. Create Manager Users
Owners can create manager accounts through:
- Staff Management page
- API endpoint: `POST /auth/staff`

### 3. Assign Managers to Stores
- Go to Store Management page
- Click the user icon next to any store
- Select a manager from the dropdown
- Manager gets full permissions for that store

## How It Works

### Manager Assignment Process
1. **Owner creates manager account**
   - Role: 'manager'
   - Gets login credentials
   - Added to business staff

2. **Owner assigns manager to store**
   - Updates `stores.manager_id`
   - Creates entry in `manager_permissions`
   - Manager can now access store

3. **Manager logs in**
   - Gets list of assigned stores
   - Can switch between stores
   - Current store context saved

### Manager Login Flow
1. Manager enters email/password
2. System checks `accounts_user` table
3. Fetches accessible stores based on `stores.manager_id`
4. Sets default store (main store or first available)
5. Returns user data with store context

### Store Context Switching
- Managers see store selector in header
- Can switch between assigned stores
- Current store saved in `accounts_user.current_store_id`
- All operations scoped to current store

## Manager Capabilities

### What Managers Can Do
- **Store Management**: View assigned store details
- **Staff Management**: Create and manage cashiers for their stores
- **Inventory**: Manage products in assigned stores
- **Sales**: Process sales and view reports for their stores
- **POS**: Full POS access for assigned stores

### What Managers Cannot Do
- Create other managers
- Access stores not assigned to them
- Delete staff (only owners can)
- Modify business settings

## API Endpoints

### Store Management
```javascript
// Assign manager to store
POST /stores/:id/assign-manager
{ "manager_id": "123" }

// Get available managers
GET /stores/available-managers

// Switch current store
POST /stores/switch-store/:id
```

### Staff Management
```javascript
// Managers can create cashiers
POST /staff
{
  "role": "cashier",
  "store_id": "store-uuid",
  // other staff details
}
```

### Authentication
```javascript
// Login returns store context
POST /auth/login
// Response includes accessible_stores array

// Get current user context
GET /auth/me
// Returns user with current store and accessible stores
```

## Frontend Components

### StoreSelector Component
- Shows in header for managers/staff
- Allows switching between assigned stores
- Updates user context globally

### ManagerAssignment Component
- Modal for assigning managers to stores
- Fetches available managers
- Updates store assignments

## Usage Examples

### 1. Creating a Manager
```javascript
// Owner creates manager account
const managerData = {
  username: 'john_manager',
  email: 'john@example.com',
  password: 'secure123',
  first_name: 'John',
  last_name: 'Doe',
  role: 'manager',
  phone_number: '+234...'
};

await authAPI.createStaff(managerData);
```

### 2. Assigning Manager to Store
```javascript
// Owner assigns manager to store
await storesAPI.assignManager(storeId, managerId);
```

### 3. Manager Login
```javascript
// Manager logs in
const response = await authAPI.login({
  email: 'john@example.com',
  password: 'secure123'
});

// Response includes:
// - user data with role: 'manager'
// - accessible_stores array
// - current_store_id
```

### 4. Manager Creates Cashier
```javascript
// Manager creates cashier for their store
const cashierData = {
  username: 'jane_cashier',
  email: 'jane@example.com',
  password: 'temp123',
  first_name: 'Jane',
  last_name: 'Smith',
  role: 'cashier',
  store_id: currentStoreId
};

await staffAPI.create(cashierData);
```

## Security Features

### Role-Based Access Control
- API endpoints check user roles
- Managers can only access assigned stores
- Staff operations scoped to authorized stores

### Store Context Validation
- All store operations validate user access
- Current store context maintained in session
- Automatic store switching on login

### Permission Inheritance
- Managers inherit permissions for assigned stores
- Staff inherit permissions through store assignments
- Owners have global access

## Troubleshooting

### Common Issues
1. **Manager can't see stores**: Check `stores.manager_id` assignment
2. **Store selector not showing**: Verify user has multiple store access
3. **Permission denied**: Check role and store assignments
4. **Login fails**: Verify user exists and has correct role

### Debug Queries
```sql
-- Check manager assignments
SELECT s.name, u.first_name, u.last_name 
FROM stores s 
LEFT JOIN accounts_user u ON s.manager_id = u.id;

-- Check store staff assignments
SELECT s.name, u.first_name, u.last_name, u.role
FROM store_staff ss
JOIN stores s ON ss.store_id = s.id
JOIN accounts_user u ON ss.staff_id = u.id
WHERE ss.is_active = true;
```

## Best Practices

### For Owners
1. Create managers before assigning to stores
2. Use meaningful usernames and strong passwords
3. Regularly review manager assignments
4. Train managers on their capabilities

### For Managers
1. Switch to correct store before operations
2. Create cashiers only for assigned stores
3. Monitor store performance regularly
4. Report issues to business owner

### For Development
1. Always validate store access in API endpoints
2. Include store context in all operations
3. Handle store switching gracefully
4. Test with different user roles