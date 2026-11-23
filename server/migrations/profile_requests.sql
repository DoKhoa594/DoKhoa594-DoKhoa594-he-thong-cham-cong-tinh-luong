CREATE TABLE IF NOT EXISTS employee_profile_requests (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  employee_id INT UNSIGNED NOT NULL,
  changes JSON NOT NULL,
  password_hash VARCHAR(60) NULL,
  password_base_digest CHAR(64) NULL,
  status ENUM('pending', 'approved', 'rejected', 'withdrawn') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL,
  pending_employee_id INT UNSIGNED GENERATED ALWAYS AS
    (CASE WHEN status = 'pending' THEN employee_id ELSE NULL END) STORED,
  UNIQUE KEY uq_profile_request_pending (pending_employee_id),
  KEY idx_profile_request_employee (employee_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
