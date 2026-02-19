-- Migration: Add customer_email and description to transactions table
-- Required for Match Triad (IP, Device, Email) and "First 6" billing descriptor rule

ALTER TABLE transactions 
  ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Add index for customer_email lookups
CREATE INDEX IF NOT EXISTS idx_transactions_customer_email ON transactions(customer_email);










