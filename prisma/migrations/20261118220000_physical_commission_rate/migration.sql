-- Taux de commission (%) sur les billets physiques, réglable par l'admin.
ALTER TABLE "PlatformSettings" ADD COLUMN "physicalCommissionRate" DOUBLE PRECISION NOT NULL DEFAULT 3;
