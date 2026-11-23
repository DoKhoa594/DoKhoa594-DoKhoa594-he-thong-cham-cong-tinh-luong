import { randomBytes } from "node:crypto";
import { hashEmployeePassword, isPasswordHash, matchesEmployeePassword } from "./employeePassword.js";
import connection from "../config/db.js";

const sessions = new Map();
const duration = 12 * 60 * 60 * 1000;

export async function login(req, res) {
  const { username, password } = req.body ?? {};
  if (typeof username !== "string" || typeof password !== "string" ||
      username.length > 64 || Buffer.byteLength(password) > 72) {
    return res.status(400).json({ message: "Thông tin đăng nhập không hợp lệ." });
  }

  const code = username.trim();
  const loopback = ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress);
  const adminPassword = process.env.ATTENDANCE_ADMIN_PASSWORD;
  const demo = loopback && !adminPassword;
  try {
    let user;
    if (code === "admin") {
      if (adminPassword ? password === adminPassword : demo && password === "") {
        user = { username: "admin", role: "admin" };
      }
    } else if (code) {
      const [rows] = await connection.promise().execute(
        "SELECT id, code, name, password FROM employees WHERE code = ?",
        [demo && code === "user" && password === "" ? "DEMO-009" : code],
      );
      const employee = rows[0];
      const demoAccount = demo && code === "user" && password === "";
      const matched = employee && !demoAccount && await matchesEmployeePassword(password, employee.password);
      if (matched && !isPasswordHash(employee.password)) {
        const [updated] = await connection.promise().execute(
          "UPDATE employees SET password = ? WHERE id = ? AND BINARY password = ?",
          [await hashEmployeePassword(password), employee.id, employee.password],
        );
        if (!updated.affectedRows) return res.status(401).json({ message: "Mật khẩu vừa thay đổi. Vui lòng đăng nhập lại." });
      }
      if (employee && (demoAccount || matched)) {
        user = { id: employee.id, username: employee.name, code: employee.code, role: "user" };
      }
    }

    if (!user) return res.status(401).json({ message: "Mã nhân viên hoặc mật khẩu không đúng." });
    const now = Date.now();
    for (const [token, session] of sessions) {
      if (session.expires <= now) sessions.delete(token);
    }
    const token = randomBytes(32).toString("hex");
    sessions.set(token, { user, expires: now + duration });
    return res.json({ token, user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Không thể đăng nhập lúc này." });
  }
}

export const requireRole = role => (req, res, next) => {
  const token = req.get("Authorization")?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  const session = sessions.get(token);
  if (!session || session.expires <= Date.now()) {
    if (token) sessions.delete(token);
    return res.status(401).json({ message: "Vui lòng đăng nhập lại." });
  }
  if (session.user.role !== role) return res.status(403).json({ message: "Tài khoản không có quyền truy cập." });
  req.user = session.user;
  return next();
};

export function logout(req, res) {
  const token = req.get("Authorization")?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (token) sessions.delete(token);
  return res.sendStatus(204);
}

export function invalidateEmployeeSessions(id) {
  for (const [token, session] of sessions) {
    if (session.user.id === id) sessions.delete(token);
  }
}
