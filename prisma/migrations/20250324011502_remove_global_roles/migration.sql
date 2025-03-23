-- First remove foreign key constraints
ALTER TABLE "Users" DROP CONSTRAINT IF EXISTS "Users_role_id_fkey";

-- Drop role_id from Users table
ALTER TABLE "Users" DROP COLUMN "role_id";

-- Drop RolePermissions table
DROP TABLE IF EXISTS "RolePermissions";

-- Drop Roles table
DROP TABLE IF EXISTS "Roles";

-- Remove is_admin field from Users since we're using System Admin role
ALTER TABLE "Users" DROP COLUMN "is_admin";
