-- Create System EntityType
INSERT INTO "EntityTypes" ("name", "description", "created_at")
VALUES ('System', 'System-wide administration', CURRENT_TIMESTAMP);

-- Get the System EntityType ID
DO $$
DECLARE
    system_type_id INTEGER;
BEGIN
    SELECT id INTO system_type_id FROM "EntityTypes" WHERE name = 'System';

    -- Create System Entity
    INSERT INTO "Entities" ("name", "description", "entity_type_id", "created_at")
    VALUES ('System', 'System administration entity', system_type_id, CURRENT_TIMESTAMP);

    -- Get the System Entity ID
    WITH system_entity AS (
        SELECT id FROM "Entities" WHERE name = 'System' AND entity_type_id = system_type_id
    )
    
    -- Create System Admin Role
    INSERT INTO "EntityRoles" ("name", "description", "entity_type_id", "entity_id", "is_default", "created_at")
    SELECT 
        'System Admin',
        'Full system administration privileges',
        system_type_id,
        system_entity.id,
        false,
        CURRENT_TIMESTAMP
    FROM system_entity;

    -- Get the System Admin Role ID and copy permissions from godmode role
    WITH system_admin_role AS (
        SELECT er.id 
        FROM "EntityRoles" er
        JOIN "Entities" e ON er.entity_id = e.id
        WHERE e.name = 'System' AND er.name = 'System Admin'
    ),
    godmode_role AS (
        SELECT id FROM "Roles" WHERE name = 'godmode'
    ),
    godmode_permissions AS (
        SELECT DISTINCT permission_id, resource_id
        FROM "RolePermissions"
        WHERE role_id = (SELECT id FROM godmode_role)
    )
    INSERT INTO "EntityRolePermissions" ("entity_role_id", "permission_id", "resource_id", "created_at")
    SELECT 
        (SELECT id FROM system_admin_role),
        permission_id,
        resource_id,
        CURRENT_TIMESTAMP
    FROM godmode_permissions;

    -- Migrate godmode users to System Admin role
    WITH system_admin_role AS (
        SELECT er.id 
        FROM "EntityRoles" er
        JOIN "Entities" e ON er.entity_id = e.id
        WHERE e.name = 'System' AND er.name = 'System Admin'
    ),
    system_entity AS (
        SELECT id FROM "Entities" WHERE name = 'System'
    ),
    godmode_users AS (
        SELECT u.id
        FROM "Users" u
        JOIN "Roles" r ON u.role_id = r.id
        WHERE r.name = 'godmode'
    )
    INSERT INTO "EntityMembers" ("entity_id", "user_id", "entity_role_id", "created_at")
    SELECT 
        (SELECT id FROM system_entity),
        godmode_users.id,
        (SELECT id FROM system_admin_role),
        CURRENT_TIMESTAMP
    FROM godmode_users;
END $$;
