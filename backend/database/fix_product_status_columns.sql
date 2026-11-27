-- Run this against ecommerce_db in phpMyAdmin or MySQL Workbench.
-- MariaDB supports IF NOT EXISTS, so it is safe to run more than once.
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'VISIBLE';
