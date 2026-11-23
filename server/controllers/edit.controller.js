import connection from "../config/db.js";
import { isEmployeeAvatar } from "./employeeAvatar.js";

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
        e.avatar,
        e.address,
        e.emergency_contact_name,
        e.emergency_contact_phone,
        e.ethnicity,
        e.nationality,
        e.idCard,
        e.phone,
        e.email,
        e.department_id,
        e.position_id,
        e.basic_salary,
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
      avatar: employee.avatar,
      address: employee.address,
      emergency_contact_name: employee.emergency_contact_name,
      emergency_contact_phone: employee.emergency_contact_phone,
      ethnicity: employee.ethnicity,
      nationality: employee.nationality,
      idCard: employee.idCard,
      phone: employee.phone,
      email: employee.email,

      department_id: employee.department_id,
      position_id: employee.position_id,

      department: employee.department || "",
      position: employee.position || "",

      basic_salary: employee.basic_salary || "",

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
const profileFields = {
  birthPlace: 255,
  ethnicity: 80,
  nationality: 80,
  address: 255,
  emergency_contact_name: 150,
  emergency_contact_phone: 11,
};

const updateEmployee = async (req, res) => {
  try {
    const { code } = req.params;
    const body = req.body ?? {};
    const { department_id, position_id, basic_salary } = body;

    const deptId = department_id === "" || department_id === null ? null : Number(department_id);
    const posId = position_id === "" || position_id === null ? null : Number(position_id);
    const salary = Number(basic_salary);

    const validId = id => id === null || (Number.isInteger(id) && id > 0 && id <= 4294967295);
    if (!validId(deptId) || !validId(posId) || !Number.isFinite(salary)) {
      return res.status(400).json({
        message: "Dữ liệu không hợp lệ",
      });
    }

    const assignments = ["department_id = ?", "position_id = ?", "basic_salary = ?"];
    const values = [deptId, posId, salary];
    const profile = {};

    if (Object.hasOwn(body, "avatar")) {
      if (!isEmployeeAvatar(body.avatar)) {
        return res.status(400).json({ message: "Ảnh phải là JPG, PNG hoặc WebP và tối đa 1 MB" });
      }
      assignments.push("avatar = ?");
      values.push(body.avatar);
    }

    for (const [field, limit] of Object.entries(profileFields)) {
      if (!Object.hasOwn(body, field)) continue;
      const value = body[field];
      if (value !== null && (typeof value !== "string" || [...value.trim()].length > limit)) {
        return res.status(400).json({ message: "Thông tin bổ sung không hợp lệ" });
      }
      profile[field] = value?.trim() || null;
      assignments.push(`${field} = ?`);
      values.push(profile[field]);
    }

    if (Object.hasOwn(profile, "emergency_contact_name") || Object.hasOwn(profile, "emergency_contact_phone")) {
      const { emergency_contact_name: name, emergency_contact_phone: phone } = profile;
      if (!Object.hasOwn(profile, "emergency_contact_name") ||
          !Object.hasOwn(profile, "emergency_contact_phone") ||
          Boolean(name) !== Boolean(phone) || (phone && !/^\d{9,11}$/.test(phone))) {
        return res.status(400).json({ message: "Hãy nhập cả tên và số điện thoại liên hệ khẩn cấp hợp lệ, hoặc để trống cả hai." });
      }
    }

    const [result] = await connection.promise().query(
      `UPDATE employees SET ${assignments.join(", ")} WHERE code = ?`,
      [...values, code],
    );

    if (!result.affectedRows) return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    return res.json({
      message: "Update OK",
      affectedRows: result.affectedRows,
    });
  } catch (err) {
    console.log("UPDATE EMPLOYEE ERROR:", err);
    return res.status(500).json({ message: "Server error" });
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
  deleteEmployee,
};
