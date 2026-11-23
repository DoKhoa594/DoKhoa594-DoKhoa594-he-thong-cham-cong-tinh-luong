import connection from "../config/db.js";
import { ensurePayrollDeliveries } from "./payrollDelivery.controller.js";
import { ensurePayrollReasons, readPayrollReasons } from "./payrollReasons.js";

const STANDARD_WORK_HOURS = 208; // 26 ngày * 8 giờ
const LATE_PENALTY = 50000;
const OT_RATE = 1.5;

export const generatePayroll = async (req, res) => {
  try {
    const { month, year, extra = {} } = req.body;

    if (!month || !year) {
      return res.status(400).json({
        message: "Thiếu month hoặc year",
      });
    }

    const payrollMonth = Number(month);
    const payrollYear = Number(year);

    if (
      isNaN(payrollMonth) ||
      isNaN(payrollYear) ||
      payrollMonth < 1 ||
      payrollMonth > 12
    ) {
      return res.status(400).json({
        message: "Tháng hoặc năm không hợp lệ",
      });
    }

    const [employees] = await connection.promise().query(`
      SELECT 
        e.id,
        e.code,
        e.name,
        e.basic_salary,
        d.name AS department,
        p.name AS position
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
    `);

    const reasonsByEmployee = new Map();
    for (const employee of employees) {
      const reasons = readPayrollReasons(extra?.[employee.id]);
      if (reasons.error) {
        return res.status(400).json({ message: `${employee.name} (${employee.code}). ${reasons.error}` });
      }
      reasonsByEmployee.set(employee.id, reasons);
    }

    await ensurePayrollReasons();
    const results = [];

    for (const emp of employees) {
      const [attRows] = await connection.promise().query(
        `
        SELECT
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present_days,
          SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) AS late_days,
          SUM(CASE WHEN status = 'leave' AND leave_status = 'approved' THEN 1 ELSE 0 END) AS leave_days,
          SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) AS absent_days,
          SUM(total_hours) AS total_hours
        FROM attendance
        WHERE employee_id = ?
        AND MONTH(work_date) = ?
        AND YEAR(work_date) = ?
        `,
        [emp.id, payrollMonth, payrollYear],
      );

      const att = attRows[0] || {};

      const presentDays = Number(att.present_days || 0);
      const lateDays = Number(att.late_days || 0);
      const leaveDays = Number(att.leave_days || 0);
      const absentDays = Number(att.absent_days || 0);
      const totalHours = Number(att.total_hours || 0);

      const empExtra = extra?.[emp.id] || {};
      const {
        allowance: allowanceReason,
        bonus: bonusReason,
        advance_salary: advanceReason,
        ot_hours: overtimeReason,
      } = reasonsByEmployee.get(emp.id);

      const allowance = Number(empExtra.allowance || 0);
      const bonus = Number(empExtra.bonus || 0);
      const advanceSalary = Number(empExtra.advance_salary || 0);
      const otHours = Number(empExtra.ot_hours || 0);
      const overtimeRate = Number(empExtra.overtime_rate || 0);
      const deductionInput = Number(empExtra.deduction || 0);

      const basicSalary = Number(emp.basic_salary || 0);
      const salaryPerHour = basicSalary / STANDARD_WORK_HOURS;

      const otSalary = otHours * overtimeRate;

      const deduction = advanceSalary + deductionInput;

      const finalSalary = Math.max(
        0,
        Math.round(basicSalary + allowance + bonus + otSalary - deduction),
      );

      const [existing] = await connection.promise().query(
        `
        SELECT id FROM payrolls
        WHERE employee_id = ?
        AND payroll_month = ?
        AND payroll_year = ?
        LIMIT 1
        `,
        [emp.id, payrollMonth, payrollYear],
      );

      if (existing.length > 0) {
        await connection.promise().query(
          `
          UPDATE payrolls
          SET
            present_days = ?,
            late_days = ?,
            leave_days = ?,
            absent_days = ?,
            basic_salary = ?,
            allowance = ?,
            allowance_reason = ?,
            bonus = ?,
            bonus_reason = ?,
            deduction = ?,
            final_salary = ?,
            note = ?,
            total_hours = ?,
            salary_per_hour = ?,
            ot_hours = ?,
            ot_hours_reason = ?,
            ot_salary = ?,
            advance_salary = ?,
            advance_salary_reason = ?
          WHERE id = ?
          `,
          [
            presentDays,
            lateDays,
            leaveDays,
            absentDays,
            basicSalary,
            allowance,
            allowanceReason,
            bonus,
            bonusReason,
            deduction,
            finalSalary,
            "Auto calculated",
            totalHours,
            salaryPerHour,
            otHours,
            overtimeReason,
            otSalary,
            advanceSalary,
            advanceReason,
            existing[0].id,
          ],
        );
      } else {
        await connection.promise().query(
          `
          INSERT INTO payrolls (
            employee_id,
            payroll_month,
            payroll_year,
            present_days,
            late_days,
            leave_days,
            absent_days,
            basic_salary,
            allowance,
            allowance_reason,
            bonus,
            bonus_reason,
            deduction,
            final_salary,
            note,
            created_at,
            total_hours,
            salary_per_hour,
            ot_hours,
            ot_hours_reason,
            ot_salary,
            advance_salary,
            advance_salary_reason
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            emp.id,
            payrollMonth,
            payrollYear,
            presentDays,
            lateDays,
            leaveDays,
            absentDays,
            basicSalary,
            allowance,
            allowanceReason,
            bonus,
            bonusReason,
            deduction,
            finalSalary,
            "Auto calculated",
            totalHours,
            salaryPerHour,
            otHours,
            overtimeReason,
            otSalary,
            advanceSalary,
            advanceReason,
          ],
        );
      }

      results.push({
        employee_id: emp.id,
        code: emp.code,
        name: emp.name,
        department: emp.department || "",
        position: emp.position || "",
        present_days: presentDays,
        late_days: lateDays,
        leave_days: leaveDays,
        absent_days: absentDays,
        total_hours: totalHours,
        basic_salary: basicSalary,
        salary_per_hour: Math.round(salaryPerHour),
        allowance,
        allowance_reason: allowanceReason,
        bonus,
        bonus_reason: bonusReason,
        ot_hours: otHours,
        ot_hours_reason: overtimeReason,
        ot_salary: Math.round(otSalary),
        advance_salary: advanceSalary,
        advance_salary_reason: advanceReason,
        deduction,
        final_salary: finalSalary,
        overtime_rate: overtimeRate,
        deduction_input: deductionInput,
      });
    }

    return res.json({
      message: "Tính lương thành công",
      month: payrollMonth,
      year: payrollYear,
      data: results,
    });
  } catch (error) {
    console.log("GENERATE PAYROLL ERROR:", error);

    return res.status(500).json({
      message: "Lỗi tính lương",
      error: error.message,
    });
  }
};

// GET /api/payrolls?month=6&year=2026
export const getPayrolls = async (req, res) => {
  try {
    const { month, year } = req.query;
    await Promise.all([ensurePayrollDeliveries(), ensurePayrollReasons()]);

    let sql = `
      SELECT
        p.*,
        s.sent_at,
        e.code,
        e.name,
        d.name AS department,
        po.name AS position
      FROM payrolls p
      LEFT JOIN payroll_deliveries s ON s.payroll_id = p.id
      LEFT JOIN employees e ON p.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions po ON e.position_id = po.id
      WHERE 1 = 1
    `;

    const params = [];

    if (month) {
      sql += ` AND p.payroll_month = ?`;
      params.push(Number(month));
    }

    if (year) {
      sql += ` AND p.payroll_year = ?`;
      params.push(Number(year));
    }

    sql += ` ORDER BY p.id DESC`;

    const [rows] = await connection.promise().query(sql, params);

    res.set("Cache-Control", "no-store");
    return res.json(rows);
  } catch (error) {
    console.log("GET PAYROLL ERROR:", error);

    return res.status(500).json({
      message: "Lỗi lấy bảng lương",
      error: error.message,
    });
  }
};
