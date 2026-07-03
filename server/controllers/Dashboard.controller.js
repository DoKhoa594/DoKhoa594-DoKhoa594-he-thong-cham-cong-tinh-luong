import connection from "../config/db.js";

// GET /api/dashboard?date=2026-06-12&month=6&year=2026
export const getDashboard = async (req, res) => {
  try {
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
    });

    const currentMonth = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Ho_Chi_Minh",
      month: "numeric",
    });

    const currentYear = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
    });

    const date = req.query.date || today;
    const month = Number(req.query.month || currentMonth);
    const year = Number(req.query.year || currentYear);

    // Tổng nhân viên
    const [employeeRows] = await connection.promise().query(`
      SELECT COUNT(*) AS total_employees
      FROM employees
    `);

    const totalEmployees = Number(employeeRows[0].total_employees || 0);

    // Tổng quan chấm công trong ngày
    const [attendanceRows] = await connection.promise().query(
      `
      SELECT
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present,
        SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) AS late,
        SUM(CASE WHEN a.status = 'leave' AND a.leave_status = 'approved' THEN 1 ELSE 0 END) AS leave_days,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent,
        SUM(a.total_hours) AS total_hours
      FROM attendance a
      WHERE DATE(a.work_date) = DATE(?)
      `,
      [date],
    );

    const att = attendanceRows[0] || {};

    const present = Number(att.present || 0);
    const late = Number(att.late || 0);
    const leaveDays = Number(att.leave_days || 0);

    // Nếu không có dòng absent trong attendance thì vắng = tổng NV - có đi làm/nghỉ phép
    const absent =
      Number(att.absent || 0) > 0
        ? Number(att.absent || 0)
        : Math.max(0, totalEmployees - present - late - leaveDays);

    const totalHours = Number(att.total_hours || 0);

    // Danh sách chấm công trong ngày
    const [todayAttendance] = await connection.promise().query(
      `
      SELECT
        e.id AS employee_id,
        e.code,
        e.name,
        d.name AS department,
        p.name AS position,
        a.work_date,
        a.check_in,
        a.check_out,
        a.status,
        a.leave_status,
        a.total_hours,
        a.reason,
        CASE
          WHEN a.id IS NULL THEN 'absent'
          ELSE a.status
        END AS final_status
      FROM employees e
      LEFT JOIN attendance a 
        ON e.id = a.employee_id
        AND DATE(a.work_date) = DATE(?)
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
      ORDER BY e.id DESC
      `,
      [date],
    );

    // Tổng quan bảng lương trong tháng
    const [payrollRows] = await connection.promise().query(
      `
      SELECT
        COUNT(*) AS payroll_count,
        SUM(basic_salary) AS total_basic_salary,
        SUM(allowance) AS total_allowance,
        SUM(bonus) AS total_bonus,
        SUM(ot_salary) AS total_ot_salary,
        SUM(deduction) AS total_deduction,
        SUM(final_salary) AS total_final_salary,
        SUM(total_hours) AS payroll_total_hours
      FROM payrolls
      WHERE payroll_month = ?
      AND payroll_year = ?
      `,
      [month, year],
    );

    const payroll = payrollRows[0] || {};

    // Top 5 bảng lương mới nhất/thực nhận cao
    const [payrollList] = await connection.promise().query(
      `
      SELECT
        pr.id,
        e.code,
        e.name,
        d.name AS department,
        p.name AS position,
        pr.total_hours,
        pr.basic_salary,
        pr.allowance,
        pr.bonus,
        pr.ot_hours,
        pr.ot_salary,
        pr.deduction,
        pr.final_salary
      FROM payrolls pr
      LEFT JOIN employees e ON pr.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
      WHERE pr.payroll_month = ?
      AND pr.payroll_year = ?
      ORDER BY pr.final_salary DESC
      LIMIT 5
      `,
      [month, year],
    );

    return res.json({
      date,
      month,
      year,

      employee: {
        total: totalEmployees,
      },

      attendance: {
        present,
        late,
        leave: leaveDays,
        absent,
        total_hours: totalHours,
      },

      payroll: {
        count: Number(payroll.payroll_count || 0),
        total_basic_salary: Number(payroll.total_basic_salary || 0),
        total_allowance: Number(payroll.total_allowance || 0),
        total_bonus: Number(payroll.total_bonus || 0),
        total_ot_salary: Number(payroll.total_ot_salary || 0),
        total_deduction: Number(payroll.total_deduction || 0),
        total_final_salary: Number(payroll.total_final_salary || 0),
        total_hours: Number(payroll.payroll_total_hours || 0),
      },

      today_attendance: todayAttendance,
      payroll_top: payrollList,
    });
  } catch (error) {
    console.log("DASHBOARD ERROR:", error);

    return res.status(500).json({
      message: "Lỗi lấy dữ liệu dashboard",
      error: error.message,
    });
  }
};
