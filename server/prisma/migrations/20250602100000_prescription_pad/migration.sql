-- Doctor prescription pad + hospital logo
ALTER TABLE "doctors"
  ADD COLUMN IF NOT EXISTS "prescription_template" TEXT NOT NULL DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS "qualifications_extra" TEXT;

ALTER TABLE "hospital_settings"
  ADD COLUMN IF NOT EXISTS "logo_url" TEXT;
