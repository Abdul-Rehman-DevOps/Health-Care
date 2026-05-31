-- Health Care Hospital Management System - Initial migration

CREATE TABLE "hospital_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "hospital_name" TEXT NOT NULL DEFAULT 'Health Care',
    "contact" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "tagline" TEXT DEFAULT 'Caring for Life',
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hospital_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "departments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#0D9488',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");
CREATE INDEX "departments_is_active_idx" ON "departments"("is_active");

CREATE TABLE "doctors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "qualification" TEXT,
    "specialization" TEXT,
    "department_id" UUID,
    "contact" TEXT,
    "email" TEXT,
    "fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "doctors_department_id_idx" ON "doctors"("department_id");
CREATE INDEX "doctors_is_active_idx" ON "doctors"("is_active");

CREATE TABLE "patients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "father_name" TEXT,
    "age" INTEGER,
    "age_unit" TEXT NOT NULL DEFAULT 'Years',
    "gender" TEXT,
    "contact" TEXT,
    "address" TEXT,
    "blood_group" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "patients_patient_id_key" ON "patients"("patient_id");
CREATE INDEX "patients_name_idx" ON "patients"("name");
CREATE INDEX "patients_created_at_idx" ON "patients"("created_at");

CREATE TABLE "appointments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" UUID NOT NULL,
    "doctor_id" UUID,
    "department_id" UUID,
    "appointment_date" DATE NOT NULL,
    "appointment_time" TEXT,
    "token_number" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'Scheduled',
    "type" TEXT NOT NULL DEFAULT 'OPD',
    "fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "appointments_appointment_date_idx" ON "appointments"("appointment_date");
CREATE INDEX "appointments_status_idx" ON "appointments"("status");
CREATE INDEX "appointments_patient_id_idx" ON "appointments"("patient_id");

CREATE TABLE "drugs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "generic_name" TEXT,
    "brand" TEXT,
    "category" TEXT,
    "form" TEXT NOT NULL DEFAULT 'Tablet',
    "strength" TEXT,
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "reorder_level" INTEGER NOT NULL DEFAULT 10,
    "sale_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drugs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "drugs_name_idx" ON "drugs"("name");
CREATE INDEX "drugs_category_idx" ON "drugs"("category");
CREATE INDEX "drugs_is_active_idx" ON "drugs"("is_active");

CREATE TABLE "lab_tests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "normal_range" TEXT,
    "unit" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_tests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lab_tests_code_key" ON "lab_tests"("code");
CREATE INDEX "lab_tests_category_idx" ON "lab_tests"("category");

CREATE TABLE "system_counters" (
    "name" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 1000,

    CONSTRAINT "system_counters_pkey" PRIMARY KEY ("name")
);

ALTER TABLE "doctors" ADD CONSTRAINT "doctors_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
