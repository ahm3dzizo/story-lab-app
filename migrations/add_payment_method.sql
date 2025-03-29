-- Add payment_type and payment_method columns to client_payments table
ALTER TABLE client_payments
ADD COLUMN payment_type VARCHAR(50) NOT NULL DEFAULT 'subscription',
ADD COLUMN payment_method VARCHAR(50) NOT NULL DEFAULT 'cash';

-- Update existing records to have default values
UPDATE client_payments
SET 
  payment_type = 'subscription',
  payment_method = 'cash'
WHERE payment_type IS NULL OR payment_method IS NULL; 