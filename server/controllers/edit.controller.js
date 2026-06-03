import connection from "../config/db.js";
import bcrypt from "bcrypt";

// =========================
// GET DETAIL
// =========================

export const getDepartments = async (req, res) => {
  try {
    const data = await db.Department.findAll();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: "Error departments" });
  }
};
const getEmployeeByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const [rows] = await connection.promise().query(
      `
      SELECT 
        e.id,
        e.name,
        e.code,
        e.dob,
        e.gender,
        e.birthPlace,
        e.ethnicity,
        e.nationality,
        e.idCard,
        e.phone,
        e.email,
        e.department_id,
        e.position_id,
        d.name AS department,
        p.name AS position
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
      WHERE e.code = ?
      LIMIT 1
      `,
      [code],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy nhân viên",
      });
    }

    const employee = rows[0];

    return res.json({
      id: employee.id,
      name: employee.name,
      code: employee.code,
      dob: employee.dob
        ? new Date(employee.dob).toISOString().split("T")[0]
        : "",
      gender: employee.gender,
      birthPlace: employee.birthPlace,
      ethnicity: employee.ethnicity,
      nationality: employee.nationality,
      idCard: employee.idCard,
      phone: employee.phone,
      email: employee.email,

      department_id: employee.department_id,
      position_id: employee.position_id,

      department: employee.department || "",
      position: employee.position || "",

      password: "",
    });
  } catch (error) {
    console.log("GET EMPLOYEE ERROR:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// =========================
// UPDATE
// =========================
const updateEmployee = async (req, res) => {
  try {
    const { code } = req.params;
    const { department_id, position_id } = req.body;

    console.log("UPDATE INPUT:", { code, department_id, position_id });

    if (!department_id || !position_id) {
      return res.status(400).json({
        message: "Thiếu department_id hoặc position_id",
      });
    }

    const deptId = Number(department_id);
    const posId = Number(position_id);

    if (isNaN(deptId) || isNaN(posId)) {
      return res.status(400).json({
        message: "ID không hợp lệ",
      });
    }

    const [result] = await connection.promise().query(
      `
      UPDATE employees
      SET department_id=?, position_id=?
      WHERE code=?
      `,
      [deptId, posId, code],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Không tìm thấy employee",
      });
    }

    return res.json({
      message: "Update OK",
      affectedRows: result.affectedRows,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// =========================
// RESET PASSWORD
// =========================
const resetPassword = async (req, res) => {
  try {
    const { code } = req.params;

    const hashPassword = await bcrypt.hash("123456", 10);

    const [result] = await connection
      .promise()
      .query("UPDATE employees SET password = ? WHERE code = ?", [
        hashPassword,
        code,
      ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Không tìm thấy nhân viên",
      });
    }

    return res.json({
      message: "Reset mật khẩu thành công",
    });
  } catch (error) {
    console.log("RESET PASSWORD ERROR:", error);
    return res.status(500).json({ message: "Lỗi reset password" });
  }
};
// =========================
// DELETE EMPLOYEE
// =========================
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await connection
      .promise()
      .query("DELETE FROM employees WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Không tìm thấy nhân viên",
      });
    }

    return res.json({
      message: "Xóa nhân viên thành công",
    });
  } catch (error) {
    console.log("DELETE EMPLOYEE ERROR:", error);

    return res.status(500).json({
      message: "Lỗi xóa nhân viên",
    });
  }
};
export default {
  getEmployeeByCode,
  updateEmployee,
  resetPassword,
  deleteEmployee,
};
