# SW-Vista IAM System Documentation

## 1. System Overview

The SW-Vista Identity and Access Management (IAM) system implements a comprehensive role-based access control (RBAC) model with support for entity-specific permissions. This system ensures that users can only access resources and perform actions that they are authorized for.

### Key Components

- **Users**: Individual accounts with authentication credentials
- **Roles**: System-wide roles assigned to users (e.g., user, admin, godmode)
- **Permissions**: Actions that can be performed (e.g., view, create, update, delete, manage)
- **Resources**: System resources that permissions apply to (e.g., users, roles, entities)
- **Entities**: Organizational units (e.g., clubs, departments) with their own permission structure
- **Entity Types**: Categories of entities (e.g., club, security, director)
- **Entity Roles**: Roles specific to an entity type (e.g., member, admin, owner)

### System Architecture

The IAM system is built on a hierarchical permission model:

1. **System Roles**: Each user is assigned exactly one system role
2. **Role Permissions**: Each role can be mapped to multiple permissions on specific resources
3. **Entity Roles**: Users can be assigned roles within specific entities
4. **Entity Role Permissions**: Entity roles can be mapped to permissions on specific resources

This architecture allows for flexible and granular access control, where permissions can be granted at both the system level and the entity level.

## 2. Database Schema

### Core IAM Tables

#### Users
```prisma
model Users {
  id            Int                     @id @default(autoincrement())
  username      String                  @unique
  email         String                  @unique
  password_hash String
  role_id       Int
  created_at    DateTime                @default(now())
  
  // Relationships
  role          Roles                   @relation(fields: [role_id], references: [id])
  // Other relationships...
}
```

#### Roles
```prisma
model Roles {
  id            Int               @id @default(autoincrement())
  name          String            @unique
  description   String?
  is_system_role Boolean          @default(false)
  created_at    DateTime          @default(now())
  
  // Relationships
  users         Users[]
  rolePermissions RolePermissions[]
}
```

#### Permissions
```prisma
model Permissions {
  id            Int                    @id @default(autoincrement())
  name          String                 @unique
  description   String?
  action        String                 // view, create, update, delete, manage
  created_at    DateTime               @default(now())
  
  // Relationships
  rolePermissions      RolePermissions[]
  entityRolePermissions EntityRolePermissions[]
}
```

#### Resources
```prisma
model Resources {
  id            Int                    @id @default(autoincrement())
  name          String                 @unique
  path          String                 @unique
  description   String?
  created_at    DateTime               @default(now())
  
  // Relationships
  rolePermissions      RolePermissions[]
  entityRolePermissions EntityRolePermissions[]
}
```

#### RolePermissions
```prisma
model RolePermissions {
  id            Int          @id @default(autoincrement())
  role_id       Int
  permission_id Int
  resource_id   Int
  created_at    DateTime     @default(now())
  
  // Relationships
  role          Roles        @relation(fields: [role_id], references: [id], onDelete: Cascade)
  permission    Permissions  @relation(fields: [permission_id], references: [id], onDelete: Cascade)
  resource      Resources    @relation(fields: [resource_id], references: [id], onDelete: Cascade)
  
  // Unique constraint to prevent duplicates
  @@unique([role_id, permission_id, resource_id])
}
```

### Entity-specific Tables

#### EntityTypes
```prisma
model EntityTypes {
  id            Int            @id @default(autoincrement())
  name          String         @unique
  description   String?
  created_at    DateTime       @default(now())
  
  // Relationships
  entities      Entities[]
  entityRoles   EntityRoles[]
}
```

#### Entities
```prisma
model Entities {
  id              Int             @id @default(autoincrement())
  entity_type_id  Int
  name            String
  description     String?
  created_at      DateTime        @default(now())
  
  // Relationships
  entityType      EntityTypes     @relation(fields: [entity_type_id], references: [id])
  entityMembers   EntityMembers[]
  
  // Unique constraint for name within an entity type
  @@unique([entity_type_id, name])
}
```

#### EntityRoles
```prisma
model EntityRoles {
  id              Int                     @id @default(autoincrement())
  entity_type_id  Int
  name            String
  description     String?
  created_at      DateTime                @default(now())
  
  // Relationships
  entityType      EntityTypes             @relation(fields: [entity_type_id], references: [id])
  entityMembers   EntityMembers[]
  entityRolePermissions EntityRolePermissions[]
  
  // Unique constraint for name within an entity type
  @@unique([entity_type_id, name])
}
```

#### EntityRolePermissions
```prisma
model EntityRolePermissions {
  id              Int           @id @default(autoincrement())
  entity_role_id  Int
  permission_id   Int
  resource_id     Int
  created_at      DateTime      @default(now())
  
  // Relationships
  entityRole      EntityRoles   @relation(fields: [entity_role_id], references: [id], onDelete: Cascade)
  permission      Permissions   @relation(fields: [permission_id], references: [id], onDelete: Cascade)
  resource        Resources     @relation(fields: [resource_id], references: [id], onDelete: Cascade)
  
  // Unique constraint to prevent duplicates
  @@unique([entity_role_id, permission_id, resource_id])
}
```

#### EntityMembers
```prisma
model EntityMembers {
  id              Int           @id @default(autoincrement())
  entity_id       Int
  user_id         Int
  entity_role_id  Int
  joined_at       DateTime      @default(now())
  
  // Relationships
  entity          Entities      @relation(fields: [entity_id], references: [id], onDelete: Cascade)
  user            Users         @relation(fields: [user_id], references: [id], onDelete: Cascade)
  entityRole      EntityRoles   @relation(fields: [entity_role_id], references: [id], onDelete: Cascade)
  
  // Unique constraint to prevent duplicates
  @@unique([entity_id, user_id])
}
```

## 3. Authentication and Authorization

### Authentication Flow

1. User submits username and password to the login endpoint
2. System verifies credentials against the database
3. If valid, a JWT token is generated containing user ID, username, and role ID
4. Token is returned to the client and stored for subsequent requests
5. For protected endpoints, the token is included in the Authorization header
6. Middleware verifies the token and checks if the user has the required permissions

### Authorization Middleware

The system provides three types of authorization middleware:

1. **requireRole**: Checks if the user has a specific system role
   ```typescript
   // Example: Require godmode role
   const authResult = await requireRole('godmode')(request);
   ```

2. **requirePermission**: Checks if the user has a specific permission on a resource
   ```typescript
   // Example: Require view permission on users resource
   const authResult = await requirePermission('view', '/api/users')(request);
   ```

3. **requireEntityMembership**: Checks if the user is a member of an entity with a specific role
   ```typescript
   // Example: Require admin role in the entity
   const authResult = await requireEntityMembership('entityId', 'admin')(request);
   ```

### Permission Checking

The system uses a hierarchical approach to check permissions:

1. If the user has the godmode role, all permissions are granted
2. Otherwise, check if the user's system role has the required permission on the resource
3. If not, check if the user has an entity role with the required permission on the resource

## 4. API Endpoints

### User Management

- `GET /api/users`: Get all users
- `POST /api/users`: Create a new user
- `GET /api/users/:id`: Get a specific user
- `PUT /api/users/:id`: Update a user
- `DELETE /api/users/:id`: Delete a user

### Role Management

- `GET /api/roles`: Get all roles
- `POST /api/roles`: Create a new role
- `GET /api/roles/:id`: Get a specific role
- `PUT /api/roles/:id`: Update a role
- `DELETE /api/roles/:id`: Delete a role

### Permission Management

- `GET /api/permissions`: Get all permissions
- `POST /api/permissions`: Create a new permission
- `GET /api/permissions/:id`: Get a specific permission
- `PUT /api/permissions/:id`: Update a permission
- `DELETE /api/permissions/:id`: Delete a permission

### Resource Management

- `GET /api/resources`: Get all resources
- `POST /api/resources`: Create a new resource
- `GET /api/resources/:id`: Get a specific resource
- `PUT /api/resources/:id`: Update a resource
- `DELETE /api/resources/:id`: Delete a resource

### Role Permission Management

- `GET /api/roles/:id/permissions`: Get permissions for a role
- `POST /api/roles/:id/permissions`: Add a permission to a role
- `DELETE /api/roles/:id/permissions`: Remove a permission from a role

### Entity Type Management

- `GET /api/entity-types`: Get all entity types
- `POST /api/entity-types`: Create a new entity type
- `GET /api/entity-types/:id`: Get a specific entity type
- `PUT /api/entity-types/:id`: Update an entity type
- `DELETE /api/entity-types/:id`: Delete an entity type

### Entity Management

- `GET /api/entities`: Get all entities
- `POST /api/entities`: Create a new entity
- `GET /api/entities/:id`: Get a specific entity
- `PUT /api/entities/:id`: Update an entity
- `DELETE /api/entities/:id`: Delete an entity

### Entity Role Management

- `GET /api/entity-roles`: Get all entity roles
- `POST /api/entity-roles`: Create a new entity role
- `GET /api/entity-roles/:id`: Get a specific entity role
- `PUT /api/entity-roles/:id`: Update an entity role
- `DELETE /api/entity-roles/:id`: Delete an entity role

### Entity Member Management

- `GET /api/entity-members`: Get all entity members
- `POST /api/entity-members`: Add a user to an entity
- `GET /api/entity-members/:id`: Get a specific entity member
- `PUT /api/entity-members/:id`: Update an entity member
- `DELETE /api/entity-members/:id`: Remove a user from an entity

### Entity Role Permission Management

- `GET /api/entity-role-permissions`: Get all entity role permissions
- `POST /api/entity-role-permissions`: Add a permission to an entity role
- `DELETE /api/entity-role-permissions`: Remove a permission from an entity role

## 5. Usage Examples

### Creating a New Entity Type

```typescript
// Create a new entity type
const response = await fetch('/api/entity-types', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'department',
    description: 'University department'
  })
});
```

### Creating a New Entity

```typescript
// Create a new entity
const response = await fetch('/api/entities', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    entity_type_id: 1, // department
    name: 'Computer Science',
    description: 'Computer Science Department'
  })
});
```

### Adding a User to an Entity

```typescript
// Add a user to an entity
const response = await fetch('/api/entity-members', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    entity_id: 1, // Computer Science
    user_id: 1,
    entity_role_id: 1 // member
  })
});
```

### Checking Permissions in Frontend

```typescript
// Check if user has permission to view users
const hasPermission = (permissions, resource, action) => {
  return permissions[resource]?.includes(action) || permissions[resource]?.includes('manage');
};

// Example usage
if (hasPermission(userPermissions, 'users', 'view')) {
  // Show users list
}
```

## 6. Best Practices

### Permission Naming

- Use clear, descriptive names for permissions
- Use consistent naming conventions (e.g., 'view', 'create', 'update', 'delete', 'manage')
- The 'manage' permission implies all other permissions

### Role Design

- Create roles based on job functions or responsibilities
- Follow the principle of least privilege
- Use the godmode role sparingly and only for system administrators

### Entity Role Design

- Create entity roles based on the specific needs of each entity type
- Consider the different levels of access needed within an entity
- Use consistent naming across entity types when possible

### Security Considerations

- Always validate user input
- Use HTTPS for all API requests
- Implement rate limiting to prevent brute force attacks
- Regularly audit permission assignments
- Log all permission changes

## 7. Troubleshooting

### Common Issues

1. **Permission Denied**: Check if the user has the required role or entity role with the necessary permissions.
2. **Token Expired**: The JWT token has expired. The user needs to log in again.
3. **Invalid Token**: The JWT token is invalid or has been tampered with.
4. **Entity Not Found**: The specified entity does not exist or has been deleted.
5. **Role Not Found**: The specified role does not exist or has been deleted.

### Debugging Tips

1. Check the audit logs for permission changes
2. Verify the user's role and entity memberships
3. Check the permissions assigned to the role or entity role
4. Verify that the resource exists and is correctly configured
5. Check the JWT token for expiration or corruption
