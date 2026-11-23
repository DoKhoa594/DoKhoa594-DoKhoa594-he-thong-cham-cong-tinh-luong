USE employee_db;

-- Run on an existing MariaDB database. Existing employee records are retained.
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS avatar MEDIUMTEXT NULL,
  ADD COLUMN IF NOT EXISTS address VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(150) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(11) DEFAULT NULL;
