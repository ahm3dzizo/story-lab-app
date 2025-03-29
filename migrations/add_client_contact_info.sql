-- Add contact information columns to clients table
ALTER TABLE clients
ADD COLUMN email VARCHAR(100),
ADD COLUMN website VARCHAR(255),
ADD COLUMN tax_id VARCHAR(50);

-- Add indexes for improved query performance
CREATE INDEX idx_clients_email ON clients(email); 