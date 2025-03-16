/*
  Warnings:

  - You are about to drop the column `role` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the `UserRoles` table. If the table is not empty, all the data it contains will be lost.

*/
-- Step 1: Create the Roles table first
CREATE TABLE "Roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system_role" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Roles_pkey" PRIMARY KEY ("id")
);

-- Step 2: Insert default roles
INSERT INTO "Roles" ("name", "description", "is_system_role") 
VALUES 
('user', 'Regular user with basic permissions', true),
('admin', 'Administrator with elevated permissions', true),
('godmode', 'Super administrator with all permissions', true);

-- Step 3: Add role_id column to Users with a default value (will be updated)
ALTER TABLE "Users" ADD COLUMN "role_id" INTEGER;

-- Step 4: Update existing users to have appropriate role_id values
UPDATE "Users" SET "role_id" = (SELECT id FROM "Roles" WHERE "name" = "Users"."role");

-- Step 5: Make role_id NOT NULL after setting values
ALTER TABLE "Users" ALTER COLUMN "role_id" SET NOT NULL;

-- Step 6: Drop the role column
ALTER TABLE "Users" DROP COLUMN "role";

-- Step 7: Add foreign key constraint
ALTER TABLE "Users" ADD CONSTRAINT "Users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 8: Drop the UserRoles table
DROP TABLE IF EXISTS "UserRoles";

-- Create the rest of the tables

-- CreateTable
CREATE TABLE "Permissions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "action" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resources" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermissions" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,
    "resource_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityTypes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntityTypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entities" (
    "id" SERIAL NOT NULL,
    "entity_type_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityRoles" (
    "id" SERIAL NOT NULL,
    "entity_type_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntityRoles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityRolePermissions" (
    "id" SERIAL NOT NULL,
    "entity_role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,
    "resource_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntityRolePermissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityMembers" (
    "id" SERIAL NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "entity_role_id" INTEGER NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntityMembers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Roles_name_key" ON "Roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permissions_name_key" ON "Permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Resources_name_key" ON "Resources"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Resources_path_key" ON "Resources"("path");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermissions_role_id_permission_id_resource_id_key" ON "RolePermissions"("role_id", "permission_id", "resource_id");

-- CreateIndex
CREATE UNIQUE INDEX "EntityTypes_name_key" ON "EntityTypes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Entities_entity_type_id_name_key" ON "Entities"("entity_type_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "EntityRoles_entity_type_id_name_key" ON "EntityRoles"("entity_type_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "EntityRolePermissions_entity_role_id_permission_id_resource_key" ON "EntityRolePermissions"("entity_role_id", "permission_id", "resource_id");

-- CreateIndex
CREATE UNIQUE INDEX "EntityMembers_entity_id_user_id_key" ON "EntityMembers"("entity_id", "user_id");

-- AddForeignKey
ALTER TABLE "RolePermissions" ADD CONSTRAINT "RolePermissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermissions" ADD CONSTRAINT "RolePermissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "Permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermissions" ADD CONSTRAINT "RolePermissions_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "Resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entities" ADD CONSTRAINT "Entities_entity_type_id_fkey" FOREIGN KEY ("entity_type_id") REFERENCES "EntityTypes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityRoles" ADD CONSTRAINT "EntityRoles_entity_type_id_fkey" FOREIGN KEY ("entity_type_id") REFERENCES "EntityTypes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityRolePermissions" ADD CONSTRAINT "EntityRolePermissions_entity_role_id_fkey" FOREIGN KEY ("entity_role_id") REFERENCES "EntityRoles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityRolePermissions" ADD CONSTRAINT "EntityRolePermissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "Permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityRolePermissions" ADD CONSTRAINT "EntityRolePermissions_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "Resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityMembers" ADD CONSTRAINT "EntityMembers_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "Entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityMembers" ADD CONSTRAINT "EntityMembers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntityMembers" ADD CONSTRAINT "EntityMembers_entity_role_id_fkey" FOREIGN KEY ("entity_role_id") REFERENCES "EntityRoles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
