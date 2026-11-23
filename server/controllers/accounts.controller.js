import connection from "../config/db.js";
import { defaultEmployeePassword, hashEmployeePassword, validEmployeePassword } from "./employeePassword.js";
import { invalidateEmployeeSessions } from "./session.controller.js";

const db = connection.promise();

export async function listAccounts(req, res) {
  const keyword = typeof req.query.keyword === "string" ? req.query.keyword.trim().slice(0, 150) : "";
  const page = Math.min(100000, Math.max(1, Number.parseInt(req.query.page, 10) || 1));
  const limit = 25;
  try {
    const term = `%${keyword}%`;
    const [rows] = await db.execute(
      `SELECT e.id, e.code, e.name, d.name AS department
       FROM employees e LEFT JOIN departments d ON d.id = e.department_id
       WHERE e.code LIKE ? OR e.name LIKE ? ORDER BY e.id DESC LIMIT ? OFFSET ?`,
      [term, term, limit + 1, (page - 1) * limit],
    );
    return res.json({ accounts: rows.slice(0, limit), hasMore: rows.length > limit });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Không tải được danh sách tài khoản." });
  }
}

async function updatePassword(code, password, res) {
  if (!validEmployeePassword(password)) {
    return res.status(400).json({ message: "Nhập mật khẩu có nội dung và tối đa 72 byte." });
  }
  try {
    const [[employee]] = await db.execute("SELECT id FROM employees WHERE code = ?", [code]);
    if (!employee) return res.status(404).json({ message: "Không tìm thấy nhân viên." });
    const [result] = await db.execute("UPDATE employees SET password = ? WHERE id = ? AND code = ?",
      [await hashEmployeePassword(password), employee.id, code]);
    if (!result.affectedRows) return res.status(404).json({ message: "Không tìm thấy nhân viên." });
    invalidateEmployeeSessions(employee.id);
    return res.json({ message: "Đã cập nhật mật khẩu." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Không cập nhật được mật khẩu." });
  }
}

export const setAccountPassword = (req, res) => updatePassword(req.params.code, req.body?.password, res);
export const resetAccountPassword = (req, res) => updatePassword(req.params.code, defaultEmployeePassword, res);
