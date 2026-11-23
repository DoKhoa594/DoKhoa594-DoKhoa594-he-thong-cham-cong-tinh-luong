import { readFile } from "node:fs/promises";
import connection from "../config/db.js";
import { ensurePayrollReasons } from "./payrollReasons.js";

const db = connection.promise();
const migration = new URL("../migrations/payroll_deliveries.sql", import.meta.url);
let schema;

export function ensurePayrollDeliveries() {
  schema ??= readFile(migration, "utf8").then(sql => db.query(sql)).catch(error => {
    schema = undefined;
    throw error;
  });
  return schema;
}

export async function sendPayroll(req, res) {
  const payrollId = Number(req.params.id);
  const employeeId = Number(req.body?.employee_id);
  if (!Number.isSafeInteger(payrollId) || payrollId < 1 ||
      !Number.isSafeInteger(employeeId) || employeeId < 1) {
    return res.status(400).json({ message: "Phiếu lương hoặc người nhận không hợp lệ." });
  }

  try {
    await Promise.all([ensurePayrollDeliveries(), ensurePayrollReasons()]);
    const [result] = await db.execute(
      `INSERT INTO payroll_deliveries (payroll_id, employee_id, payroll_month, payroll_year, payload)
       SELECT p.id, p.employee_id, p.payroll_month, p.payroll_year, JSON_OBJECT(
         'total_hours', p.total_hours, 'basic_salary', p.basic_salary, 'allowance', p.allowance,
         'allowance_reason', p.allowance_reason, 'bonus', p.bonus, 'bonus_reason', p.bonus_reason,
         'ot_salary', p.ot_salary, 'ot_hours', p.ot_hours, 'ot_hours_reason', p.ot_hours_reason,
         'deduction', p.deduction, 'advance_salary', p.advance_salary,
         'advance_salary_reason', p.advance_salary_reason, 'final_salary', p.final_salary
       )
       FROM payrolls p JOIN employees e ON e.id = p.employee_id
       WHERE p.id = ? AND p.employee_id = ?
         AND (p.allowance = 0 OR NULLIF(TRIM(p.allowance_reason), '') IS NOT NULL)
         AND (p.bonus = 0 OR NULLIF(TRIM(p.bonus_reason), '') IS NOT NULL)
         AND (p.advance_salary = 0 OR NULLIF(TRIM(p.advance_salary_reason), '') IS NOT NULL)
         AND (p.ot_hours = 0 OR NULLIF(TRIM(p.ot_hours_reason), '') IS NOT NULL)
       ON DUPLICATE KEY UPDATE payload = VALUES(payload), sent_at = CURRENT_TIMESTAMP(6)`,
      [payrollId, employeeId],
    );
    if (!result.affectedRows) {
      const [[payroll]] = await db.execute(
        "SELECT p.id FROM payrolls p JOIN employees e ON e.id = p.employee_id WHERE p.id = ? AND p.employee_id = ?",
        [payrollId, employeeId],
      );
      if (payroll) return res.status(409).json({ message: "Bổ sung và lưu lý do cho các khoản có phát sinh trước khi gửi." });
      return res.status(404).json({ message: "Không tìm thấy phiếu lương của người nhận này." });
    }
    return res.json({
      message: "Đã gửi phiếu lương vào cổng nhân viên.",
      sent_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("SEND PAYROLL ERROR:", error);
    return res.status(500).json({ message: "Không gửi được phiếu lương." });
  }
}

export async function myPayslips(req, res) {
  try {
    await ensurePayrollDeliveries();
    const [rows] = await db.execute(
      `SELECT d.payroll_id AS id, d.payroll_month, d.payroll_year, d.payload, d.sent_at
       FROM payroll_deliveries d JOIN employees e ON e.id = d.employee_id
       WHERE d.employee_id = ? ORDER BY d.payroll_year DESC, d.payroll_month DESC`,
      [req.user.id],
    );
    res.set("Cache-Control", "no-store");
    return res.json(rows.map(({ payload, ...row }) => ({
      ...row,
      ...(typeof payload === "string" ? JSON.parse(payload) : payload),
    })));
  } catch (error) {
    console.error("LOAD PAYSLIPS ERROR:", error);
    return res.status(500).json({ message: "Không thể tải phiếu lương." });
  }
}
