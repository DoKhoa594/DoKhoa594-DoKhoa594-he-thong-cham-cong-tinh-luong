SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS employee_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE employee_db;

CREATE TABLE IF NOT EXISTS departments (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_departments_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS positions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_positions_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS employees (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(64) NOT NULL,
  dob DATE DEFAULT NULL,
  age SMALLINT NOT NULL DEFAULT 0,
  gender VARCHAR(32) DEFAULT NULL,
  position_id INT UNSIGNED DEFAULT NULL,
  department_id INT UNSIGNED DEFAULT NULL,
  email VARCHAR(254) DEFAULT NULL,
  idCard VARCHAR(32) DEFAULT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(32) DEFAULT NULL,
  birthPlace VARCHAR(255) DEFAULT NULL,
  avatar MEDIUMTEXT NULL,
  address VARCHAR(255) DEFAULT NULL,
  emergency_contact_name VARCHAR(150) DEFAULT NULL,
  emergency_contact_phone VARCHAR(11) DEFAULT NULL,
  ethnicity VARCHAR(80) DEFAULT NULL,
  nationality VARCHAR(80) DEFAULT NULL,
  basic_salary DECIMAL(18,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_employees_code (code),
  CONSTRAINT fk_employees_position FOREIGN KEY (position_id) REFERENCES positions (id),
  CONSTRAINT fk_employees_department FOREIGN KEY (department_id) REFERENCES departments (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The employee delete endpoint hard-deletes employees. Retain the historical IDs
-- in attendance and payroll without cascading deletions.
CREATE TABLE IF NOT EXISTS attendance (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  employee_id INT UNSIGNED NOT NULL,
  work_date DATE NOT NULL,
  check_in TIME DEFAULT NULL,
  check_out TIME DEFAULT NULL,
  status ENUM('present', 'late', 'leave', 'absent') NOT NULL DEFAULT 'present',
  reason TEXT DEFAULT NULL,
  leave_status ENUM('pending', 'approved', 'rejected') DEFAULT NULL,
  total_hours DECIMAL(8,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_attendance_employee_date (employee_id, work_date),
  KEY idx_attendance_work_date (work_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payrolls (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  employee_id INT UNSIGNED NOT NULL,
  payroll_month TINYINT UNSIGNED NOT NULL,
  payroll_year SMALLINT UNSIGNED NOT NULL,
  present_days SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  late_days SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  leave_days SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  absent_days SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  basic_salary DECIMAL(18,2) NOT NULL DEFAULT 0,
  allowance DECIMAL(18,2) NOT NULL DEFAULT 0,
  allowance_reason VARCHAR(255) DEFAULT NULL,
  bonus DECIMAL(18,2) NOT NULL DEFAULT 0,
  bonus_reason VARCHAR(255) DEFAULT NULL,
  deduction DECIMAL(18,2) NOT NULL DEFAULT 0,
  final_salary DECIMAL(18,2) NOT NULL DEFAULT 0,
  note VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
  salary_per_hour DECIMAL(18,4) NOT NULL DEFAULT 0,
  ot_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
  ot_hours_reason VARCHAR(255) DEFAULT NULL,
  ot_salary DECIMAL(18,2) NOT NULL DEFAULT 0,
  advance_salary DECIMAL(18,2) NOT NULL DEFAULT 0,
  advance_salary_reason VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payrolls_employee_period (employee_id, payroll_year, payroll_month),
  KEY idx_payrolls_period (payroll_year, payroll_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- IDs match the options in client/src/controller/EditEmployees.tsx.
INSERT INTO departments (id, name) VALUES
  (1, 'CNTT'),
  (5, 'Kinh doanh'),
  (6, 'Marketing'),
  (7, 'Tài chính - Kế toán'),
  (8, 'Sản xuất')
ON DUPLICATE KEY UPDATE id = departments.id;

INSERT INTO positions (id, name) VALUES
  (1, 'Giám đốc'),
  (2, 'Phó giám đốc'),
  (3, 'Trưởng phòng'),
  (4, 'Nhân viên'),
  (5, 'Thực tập sinh')
ON DUPLICATE KEY UPDATE id = positions.id;

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
