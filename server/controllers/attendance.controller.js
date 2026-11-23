import connection from "../config/db.js";

// =====================================
// TIME HELPERS (VN +7)
// =====================================

const getVNDate = () => {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
};

const getVNTime = () => {
  return new Date().toLocaleTimeString("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour12: false,
  });
};

// =====================================
// GET ATTENDANCES
// =====================================

export const getAttendances = async (req, res) => {
  try {
    const { date } = req.query;

    const sql = `
      SELECT
        employees.id AS employee_id,
        employees.name AS employee_name,

        attendance.id AS attendance_id,
        attendance.work_date,
        attendance.check_in,
        attendance.check_out,
        attendance.reason,
        attendance.leave_status,
        attendance.total_hours,
        CASE
          WHEN attendance.id IS NULL THEN 'absent'
          ELSE attendance.status
        END AS status

      FROM employees
      LEFT JOIN attendance
        ON employees.id = attendance.employee_id
        AND DATE(attendance.work_date) = DATE(?)

      ORDER BY employees.id DESC
    `;

    connection.query(sql, [date], (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          message: "Lỗi lấy attendance",
        });
      }

      const present = results.filter((r) => r.status === "present").length;
      const late = results.filter((r) => r.status === "late").length;
      const leave = results.filter((r) => r.status === "leave").length;
      const absent = results.filter((r) => r.status === "absent").length;

      return res.json({
        attendance: results,
        summary: { present, late, leave, absent },
      });
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// =====================================
// GET MY ATTENDANCE TODAY
// =====================================

export const getMyAttendance = (req, res) => {
  try {
    const { employee_id } = req.params;
    const today = getVNDate();

    const sql = `
      SELECT *
      FROM attendance
      WHERE employee_id = ?
      AND work_date = ?
      LIMIT 1
    `;

    connection.query(sql, [employee_id, today], (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          message: "Lỗi lấy attendance",
        });
      }

      if (results.length === 0) {
        return res.json(null);
      }

      return res.json(results[0]);
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Server Error",
    });
  }
};

const db = connection.promise();

function handleWriteError(res, error) {
  if (error.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ message: "Ngày này đã có dữ liệu chấm công hoặc đơn nghỉ." });
  }
  console.error(error);
  return res.status(500).json({ message: "Không thể cập nhật dữ liệu chấm công." });
}

export const getAttendanceByDate = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM attendance WHERE employee_id = ? AND work_date = ?",
      [req.params.employee_id, req.query.date ?? getVNDate()],
    );
    return res.json(rows[0] ?? null);
  } catch (error) {
    return handleWriteError(res, error);
  }
};

export const checkIn = async (req, res) => {
  const { employee_id, status = "present", reason = null } = req.body;
  if (!["present", "late"].includes(status)) {
    return res.status(400).json({ message: "Vui lòng dùng chức năng xin nghỉ phép." });
  }

  const date = getVNDate();
  const time = getVNTime();
  const finalStatus = time > "08:00:00" ? "late" : "present";
  try {
    const [updated] = await db.execute(
      `UPDATE attendance a JOIN employees e ON e.id = a.employee_id
       SET a.check_in = ?, a.status = ?,
           a.reason = CASE WHEN a.leave_status = 'rejected' THEN a.reason ELSE ? END
       WHERE a.employee_id = ? AND a.work_date = ? AND a.check_in IS NULL AND a.check_out IS NULL
         AND (a.status = 'absent' OR (a.status = 'leave' AND a.leave_status = 'rejected'))`,
      [time, finalStatus, reason, employee_id ?? null, date],
    );
    if (!updated.affectedRows) {
      const [inserted] = await db.execute(
        `INSERT INTO attendance (employee_id, work_date, check_in, status, reason)
         SELECT id, ?, ?, ?, ? FROM employees WHERE id = ?`,
        [date, time, finalStatus, reason, employee_id ?? null],
      );
      if (!inserted.affectedRows) return res.status(404).json({ message: "Không tìm thấy nhân viên." });
    }
    return res.json({ time, date, status: finalStatus });
  } catch (error) {
    return handleWriteError(res, error);
  }
};

export const checkOut = async (req, res) => {
  const { employee_id } = req.body;
  const date = getVNDate();
  const time = getVNTime();
  try {
    const [result] = await db.execute(
      `UPDATE attendance
       SET check_out = ?, total_hours = ROUND((TIME_TO_SEC(?) - TIME_TO_SEC(check_in)) / 3600, 2)
       WHERE employee_id = ? AND work_date = ? AND check_in IS NOT NULL
         AND check_out IS NULL AND status IN ('present', 'late') AND check_in <= ?`,
      [time, time, employee_id ?? null, date, time],
    );
    if (!result.affectedRows) {
      return res.status(409).json({ message: "Chưa vào ca hoặc ca làm đã kết thúc." });
    }
    return res.json({ time, date });
  } catch (error) {
    return handleWriteError(res, error);
  }
};

export const requestLeave = async (req, res) => {
  const { employee_id, date, reason } = req.body;
  const parsed = typeof date === "string" ? new Date(date + "T00:00:00Z") : new Date(NaN);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "") || Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== date || date < getVNDate()) {
    return res.status(400).json({ message: "Chọn ngày nghỉ từ hôm nay trở đi." });
  }
  if (typeof reason !== "string" || !reason.trim() || reason.trim().length > 1000) {
    return res.status(400).json({ message: "Nhập lý do nghỉ phép từ 1 đến 1000 ký tự." });
  }

  try {
    const [updated] = await db.execute(
      `UPDATE attendance a JOIN employees e ON e.id = a.employee_id
       SET a.status = 'leave', a.reason = ?, a.leave_status = 'pending'
       WHERE a.employee_id = ? AND a.work_date = ? AND a.status = 'absent'
         AND a.check_in IS NULL AND a.check_out IS NULL AND a.leave_status IS NULL`,
      [reason.trim(), employee_id ?? null, date],
    );
    if (!updated.affectedRows) {
      const [inserted] = await db.execute(
        `INSERT INTO attendance (employee_id, work_date, status, reason, leave_status)
         SELECT id, ?, 'leave', ?, 'pending' FROM employees WHERE id = ?`,
        [date, reason.trim(), employee_id ?? null],
      );
      if (!inserted.affectedRows) return res.status(404).json({ message: "Không tìm thấy nhân viên." });
    }
    return res.status(201).json({ date, leave_status: "pending" });
  } catch (error) {
    return handleWriteError(res, error);
  }
};

export const getLeaveRequests = async (req, res) => {
  const employeeId = req.params.employee_id;
  try {
    const [rows] = await db.execute(
      `SELECT a.id, a.employee_id, DATE_FORMAT(a.work_date, '%Y-%m-%d') AS date,
              a.reason, a.leave_status, e.code, e.name
       FROM attendance a LEFT JOIN employees e ON e.id = a.employee_id
       WHERE a.leave_status IS NOT NULL ${employeeId === undefined ? "" : "AND a.employee_id = ?"}
       ORDER BY (a.leave_status = 'pending') DESC, a.work_date DESC, a.id DESC`,
      employeeId === undefined ? [] : [employeeId],
    );
    return res.json(rows);
  } catch (error) {
    return handleWriteError(res, error);
  }
};

const decideLeave = (status) => async (req, res) => {
  try {
    const [result] = await db.execute(
      `UPDATE attendance SET leave_status = ?
       WHERE id = ? AND status = 'leave' AND leave_status = 'pending'
         AND check_in IS NULL AND check_out IS NULL`,
      [status, req.params.id],
    );
    if (!result.affectedRows) {
      return res.status(409).json({ message: "Đơn không còn ở trạng thái chờ duyệt." });
    }
    return res.json({ leave_status: status });
  } catch (error) {
    return handleWriteError(res, error);
  }
};

export const approveLeave = decideLeave("approved");
export const rejectLeave = decideLeave("rejected");
