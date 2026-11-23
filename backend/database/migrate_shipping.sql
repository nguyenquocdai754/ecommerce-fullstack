-- Run once after migrate_marketplace.sql to support checkout shipping options.
ALTER TABLE orders
  ADD COLUMN shipping_method VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
  ADD COLUMN shipping_fee DECIMAL(12,2) NOT NULL DEFAULT 0;
