import connection from "../config/db.js";

// ======================================
// GENERATE PAYROLL
// ======================================

const generatePayroll = (req, res) => {
  const { employee_id, payroll_month, payroll_year } = req.body;

  // ======================================
  // GET EMPLOYEE
  // ======================================

  const employeeSql = `
    SELECT *
    FROM employees
    WHERE id = ?
  `;

  connection.query(employeeSql, [employee_id], (err, employeeResult) => {
    if (err) {
      return res.status(500).json(err);
    }

    if (employeeResult.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy nhân viên",
      });
    }

    const employee = employeeResult[0];

    const basicSalary = Number(employee.salary || 0);

    // ======================================
    // GET ATTENDANCE
    // ======================================

    const attendanceSql = `
    SELECT
  e.id AS employee_id,
  e.name AS employee_name,
  e.salary,

  p.id,
  p.payroll_month,
  p.payroll_year,
  p.present_days,
  p.late_days,
  p.leave_days,
  p.absent_days,
  p.basic_salary,
  p.deduction,
  p.final_salary

FROM employees e

LEFT JOIN payrolls p
ON e.id = p.employee_id
AND p.payroll_month = ?
AND p.payroll_year = ?`;

    connection.query(
      attendanceSql,
      [employee_id, payroll_month, payroll_year],
      (err, attendanceResult) => {
        if (err) {
          return res.status(500).json(err);
        }

        // ======================================
        // CALCULATE
        // ======================================

        let presentDays = 0;
        let lateDays = 0;
        let leaveDays = 0;
        let absentDays = 0;

        attendanceResult.forEach((item) => {
          // đi làm
          if (item.status === "present") {
            presentDays++;
          }

          // đi trễ
          if (item.status === "late") {
            lateDays++;
            presentDays++;
          }

          // nghỉ phép được duyệt
          if (item.status === "leave" && item.leave_status === "approved") {
            leaveDays++;
          }

          // nghỉ không phép
          if (item.status === "leave" && item.leave_status === "rejected") {
            absentDays++;
          }
        });

        // ======================================
        // SALARY LOGIC
        // ======================================

        const salaryPerDay = basicSalary / 26;

        const latePenalty = lateDays * 50000;

        const absentPenalty = absentDays * salaryPerDay;

        const deduction = latePenalty + absentPenalty;

        const finalSalary = basicSalary - deduction;

        // ======================================
        // INSERT PAYROLL
        // ======================================

        const insertSql = `
          INSERT INTO payrolls (
            employee_id,
            payroll_month,
            payroll_year,
            present_days,
            late_days,
            leave_days,
            absent_days,
            basic_salary,
            deduction,
            final_salary
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        connection.query(
          insertSql,
          [
            employee_id,
            payroll_month,
            payroll_year,
            presentDays,
            lateDays,
            leaveDays,
            absentDays,
            basicSalary,
            deduction,
            finalSalary,
          ],
          (err, result) => {
            if (err) {
              console.log(err);

              return res.status(500).json({
                message: "Tạo payroll thất bại",
              });
            }

            res.json({
              message: "Generate payroll success",
              payroll: {
                employee_id,
                payroll_month,
                payroll_year,
                presentDays,
                lateDays,
                leaveDays,
                absentDays,
                basicSalary,
                deduction,
                finalSalary,
              },
            });
          },
        );
      },
    );
  });
};

// ======================================
// GET PAYROLLS
// ======================================

const getPayrolls = (req, res) => {
  const sql = `
    SELECT
      payrolls.*,
      employees.name AS employee_name
    FROM payrolls
    JOIN employees
      ON payrolls.employee_id = employees.id
    ORDER BY payrolls.id DESC
  `;

  connection.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.json(result);
  });
};

export { generatePayroll, getPayrolls };
