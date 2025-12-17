-- Migration: allow alphanumeric style codes in products.style_no
-- Safe to run multiple times.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'products'
      AND column_name = 'style_no'
      AND data_type <> 'text'
  ) THEN
    ALTER TABLE products
      ALTER COLUMN style_no TYPE TEXT
      USING style_no::text;
  END IF;
END $$;

