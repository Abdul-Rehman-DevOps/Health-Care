-- Users for login
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- Patient detail fields
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "emergency_contact" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "cnic" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "allergies" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "notes" TEXT;
