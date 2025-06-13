# Role-Based Access Control (RBAC) Implementation

This document outlines the comprehensive role-based access control system implemented in the FxD Partner ERP application.

## Overview

The RBAC system provides granular access control with four distinct user roles, each with specific permissions and access levels. The system includes user management capabilities accessible only to administrators.

## Role Hierarchy

### 1. Viewer (Level 1)
- **Permissions**: `dashboard:read`, `inventory:read`
- **Access**: Read-only access to dashboard and inventory
- **Use Case**: External stakeholders, auditors, or read-only users

### 2. Staff (Level 2)
- **Permissions**: All Viewer permissions + `vehicle_arrival:read/write`, `purchase_records:read/write`, `sales:read/write`
- **Access**: Basic operations including vehicle arrival, purchase records, and sales
- **Use Case**: Operational staff, data entry personnel

### 3. Manager (Level 3)
- **Permissions**: All Staff permissions + `partners:read/write`, `dispatch:read/write`, `payments:read/write`
- **Access**: Department management including partners, dispatch, and payments
- **Use Case**: Department heads, supervisors

### 4. Admin (Level 4)
- **Permissions**: All Manager permissions + `settings:read/write`, `users:read/write`
- **Access**: Full system access including user management and settings
- **Use Case**: System administrators, IT personnel

## Database Schema

### Tables Created

#### `roles` Table
```sql
- id (TEXT, PRIMARY KEY)
- name (TEXT, NOT NULL)
- description (TEXT)
- permissions (JSONB, NOT NULL)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `users` Table
```sql
- id (UUID, PRIMARY KEY, REFERENCES auth.users)
- email (TEXT, NOT NULL, UNIQUE)
- full_name (TEXT, NOT NULL)
- role_id (TEXT, REFERENCES roles.id)
- status (TEXT, CHECK: active/inactive/pending)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- last_login (TIMESTAMP)
```

#### `user_details` View
Combines user and role information for easy querying.

### Security Features

#### Row Level Security (RLS)
- Users can view their own profile
- Admins can view/modify all users
- Users cannot change their own roles
- Role-based data access policies

#### Functions
- `handle_new_user()`: Automatically creates user profile on auth signup
- `user_has_permission(permission_name)`: Checks user permissions
- `update_updated_at_column()`: Maintains timestamp updates

## Frontend Implementation

### Context Providers

#### `AuthContext`
- Manages user authentication state
- Integrates with Supabase Auth
- Fallback to localStorage for demo mode
- Auto-seeds demo users for testing

#### `RoleContext`
- Manages user roles and permissions
- Provides permission checking functions
- Handles role hierarchy validation

### Permission Checking Hooks

```typescript
const { hasPermission, hasRole, hasMinRole } = useRole();

// Check specific permission
if (hasPermission('users:write')) {
  // Show admin features
}

// Check minimum role level
if (hasMinRole('manager')) {
  // Show manager+ features
}
```

### Navigation Protection

The sidebar automatically filters navigation items based on user permissions:

```typescript
<NavItem 
  to="/settings" 
  icon={<Settings />} 
  label="Settings" 
  permission="settings:read" 
/>
```

### User Management Interface

#### Features (Admin Only)
- **User List**: View all system users with filtering and search
- **Add Users**: Create new users with role assignment
- **Edit Users**: Modify user details, roles, and status
- **Role Management**: Assign roles with automatic permission inheritance
- **Status Control**: Activate/deactivate user accounts

#### User Interface Components
- Search and filter functionality
- Role-based status badges
- Modal forms for user creation/editing
- Responsive table design
- Real-time updates

## Demo System

### Demo Users
The system automatically creates demo users for testing:

```
demo@fruitshop.com (Admin) - password: password
manager@fruitshop.com (Manager)
staff@fruitshop.com (Staff)
viewer@fruitshop.com (Viewer)
inactive@fruitshop.com (Inactive User)
```

### Testing Different Roles
1. Login with demo credentials
2. Navigate to Settings > User Management (Admin only)
3. View different navigation items based on role
4. Test permission-based feature access

## Security Considerations

### Database Level
- RLS policies prevent unauthorized data access
- Foreign key constraints maintain data integrity
- Audit trails with created/updated timestamps
- Secure password handling via Supabase Auth

### Application Level
- Permission checks on all protected routes
- Role validation before rendering components
- Secure API calls with user context
- Session management and automatic logout

### Best Practices Implemented
- Principle of least privilege
- Role-based rather than user-based permissions
- Hierarchical role structure
- Centralized permission management
- Audit logging capabilities

## Usage Examples

### Protecting Routes
```typescript
// In component
const { hasPermission } = useRole();

if (!hasPermission('users:read')) {
  return <AccessDenied />;
}
```

### Conditional Rendering
```typescript
{hasRole('admin') && (
  <UserManagementTab />
)}
```

### Navigation Filtering
```typescript
<NavItem 
  permission="partners:read"
  // Only shows if user has permission
/>
```

## Migration and Deployment

### Database Migration
Run the migration file: `20250613091000_create_user_management_system.sql`

### Environment Setup
1. Ensure Supabase connection is configured
2. Run database migrations
3. Seed initial roles and demo users
4. Configure RLS policies

### Production Considerations
- Remove demo user seeding in production
- Implement proper user invitation system
- Set up email notifications for user management
- Configure backup and recovery procedures
- Monitor user access patterns

## Future Enhancements

### Planned Features
- **Permission Groups**: Organize permissions into logical groups
- **Temporary Access**: Time-limited role assignments
- **Audit Logging**: Comprehensive user action tracking
- **API Keys**: Service account management
- **Multi-tenancy**: Organization-based access control

### Scalability
- Role caching for performance
- Permission inheritance optimization
- Bulk user operations
- Advanced filtering and search
- Integration with external identity providers

## Troubleshooting

### Common Issues
1. **Permission Denied**: Check user role and permissions
2. **Navigation Missing**: Verify permission requirements
3. **Database Errors**: Ensure RLS policies are correct
4. **Demo Users**: Run seeding functions if missing

### Debug Tools
- Browser console for permission checks
- Supabase dashboard for database inspection
- Network tab for API call verification
- Role context debugging hooks

## Conclusion

This RBAC implementation provides a robust, scalable foundation for access control in the ERP system. The hierarchical role structure, comprehensive permission system, and user-friendly management interface ensure both security and usability.

The system is designed to grow with the application, supporting additional roles, permissions, and features as needed while maintaining security best practices and user experience standards.
