CREATE TABLE IF NOT EXISTS payroll_deliveries (
  payroll_id INT UNSIGNED NOT NULL,
  employee_id INT UNSIGNED NOT NULL,
  payroll_month TINYINT UNSIGNED NOT NULL,
  payroll_year SMALLINT UNSIGNED NOT NULL,
  payload JSON NOT NULL,
  sent_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (payroll_id),
  KEY idx_payroll_delivery_recipient (employee_id, payroll_year, payroll_month),
  CONSTRAINT fk_payroll_delivery_payroll FOREIGN KEY (payroll_id) REFERENCES payrolls (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
