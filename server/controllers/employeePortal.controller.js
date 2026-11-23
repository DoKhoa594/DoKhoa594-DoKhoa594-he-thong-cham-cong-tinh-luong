import { hashEmployeePassword, matchesEmployeePassword, passwordDigest, validEmployeePassword } from "./employeePassword.js";
import { invalidateEmployeeSessions } from "./session.controller.js";
import { readFile } from "node:fs/promises";
import connection from "../config/db.js";

const db = connection.promise();
const fields = { name: 150, email: 254, phone: 32, address: 255, avatar: 699100 };
const migration = new URL("../migrations/profile_requests.sql", import.meta.url);
let schema;
function ensureSchema() {
  schema ??= prepareSchema().catch(error => {
    schema = undefined;
    throw error;
  });
  return schema;
}

async function prepareSchema() {
  await db.query(await readFile(migration, "utf8"));
  const [columns] = await db.query("SHOW COLUMNS FROM employee_profile_requests");
  const column = columns.find(item => item.Field === "status");
  if (!columns.some(item => item.Field === "password_hash")) {
    await db.query(`ALTER TABLE employee_profile_requests ADD password_hash VARCHAR(60) NULL,
      ADD password_base_digest CHAR(64) NULL`);
  }
  if (!column.Type.includes("'withdrawn'")) {
    await db.query(`ALTER TABLE employee_profile_requests
      MODIFY status ENUM('pending', 'approved', 'rejected', 'withdrawn') NOT NULL DEFAULT 'pending'`);
  }
}

const endpoint = (handler) => async (req, res) => {
  try {
    await ensureSchema();
    return await handler(req, res);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Bạn đang có một yêu cầu chờ duyệt." });
    }
    console.error(error);
    return res.status(500).json({ message: "Không thể xử lý dữ liệu hồ sơ." });
  }
};

function normalize(rows) {
  return rows.map(row => {
    const { password, ...changes } = typeof row.changes === "string" ? JSON.parse(row.changes) : row.changes;
    return { ...row, changes, password_change: password === true };
  });
}

export async function myIdentity(req, res) {
  try {
    const [[identity]] = await db.execute("SELECT name, avatar FROM employees WHERE id = ?", [req.user.id]);
    if (!identity) return res.status(404).json({ message: "Không tìm thấy hồ sơ." });
    return res.json(identity);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Không tải được thông tin nhân viên." });
  }
}

function isAvatar(value) {
  const match = value.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match || match[2].length % 4 !== 0) return false;
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length > 512 * 1024) return false;
  if (match[1] === "png") return bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a";
  if (match[1] === "jpeg") return bytes.subarray(0, 3).toString("hex") === "ffd8ff";
  return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
}

export const myProfile = endpoint(async (req, res) => {
  const [[profile]] = await db.execute(
    `SELECT e.code, e.name, e.email, e.phone, e.address, e.avatar, d.name AS department, p.name AS position
     FROM employees e LEFT JOIN departments d ON d.id = e.department_id
     LEFT JOIN positions p ON p.id = e.position_id WHERE e.id = ?`,
    [req.user.id],
  );
  if (!profile) return res.status(404).json({ message: "Không tìm thấy hồ sơ." });
  const [rows] = await db.execute(
    "SELECT id, changes, status, created_at, reviewed_at FROM employee_profile_requests WHERE employee_id = ? ORDER BY id DESC",
    [req.user.id],
  );
  return res.json({ profile, requests: normalize(rows) });
});

export const submitProfileRequest = endpoint(async (req, res) => {
  const input = req.body?.changes ?? {};
  const credentials = req.body?.password_change;
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return res.status(400).json({ message: "Chọn thông tin cần thay đổi." });
  }

  const [[profile]] = await db.execute("SELECT name, email, phone, address, avatar, password FROM employees WHERE id = ?", [req.user.id]);
  if (!profile) return res.status(404).json({ message: "Không tìm thấy hồ sơ." });
  const changes = {};
  for (const [key, raw] of Object.entries(input)) {
    if (!Object.hasOwn(fields, key) || typeof raw !== "string") {
      return res.status(400).json({ message: "Trường thông tin không hợp lệ." });
    }
    const value = raw.trim();
    if (value.length > fields[key] || (key === "name" && !value) ||
        (key === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) {
      return res.status(400).json({ message: "Kiểm tra họ tên, email và độ dài thông tin." });
    }
    if (key === "avatar" && !isAvatar(value)) {
      return res.status(400).json({ message: "Chọn ảnh JPG, PNG hoặc WebP tối đa 512 KB." });
    }
    if ((profile[key] ?? "") !== value) changes[key] = { from: profile[key], to: value };
  }
  let passwordHash = null;
  let baseDigest = null;
  if (credentials !== undefined) {
    if (!validEmployeePassword(credentials?.new_password) ||
        !(await matchesEmployeePassword(credentials?.current_password, profile.password))) {
      return res.status(400).json({ message: "Kiểm tra mật khẩu hiện tại và nhập mật khẩu mới tối đa 72 byte." });
    }
    if (credentials.current_password === credentials.new_password) {
      return res.status(400).json({ message: "Mật khẩu mới phải khác mật khẩu hiện tại." });
    }
    passwordHash = await hashEmployeePassword(credentials.new_password);
    baseDigest = passwordDigest(profile.password);
    changes.password = true;
  }
  if (!Object.keys(changes).length) return res.status(400).json({ message: "Chưa có thông tin thay đổi." });

  const [result] = await db.execute(
    "INSERT INTO employee_profile_requests (employee_id, changes, password_hash, password_base_digest) VALUES (?, ?, ?, ?)",
    [req.user.id, JSON.stringify(changes), passwordHash, baseDigest],
  );
  return res.status(201).json({ id: result.insertId });
});

export const withdrawProfileRequest = endpoint(async (req, res) => {
  const [result] = await db.execute(
    `UPDATE employee_profile_requests SET status = 'withdrawn', password_hash = NULL, password_base_digest = NULL
     WHERE id = ? AND employee_id = ? AND status = 'pending'`,
    [req.params.id, req.user.id],
  );
  if (!result.affectedRows) {
    return res.status(409).json({ message: "Yêu cầu này không còn chờ duyệt hoặc không thuộc hồ sơ của bạn." });
  }
  return res.json({ status: "withdrawn" });
});

export const listProfileRequests = endpoint(async (_req, res) => {
  const [rows] = await db.execute(
    `SELECT r.id, r.employee_id, r.changes, r.status, r.created_at, r.reviewed_at, e.name, e.code
     FROM employee_profile_requests r LEFT JOIN employees e ON e.id = r.employee_id
     ORDER BY (r.status = 'pending') DESC, r.id DESC`,
  );
  return res.json(normalize(rows));
});

export const decideProfileRequest = endpoint(async (req, res) => {
  const status = req.body?.status;
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Trạng thái duyệt không hợp lệ." });
  }
  const id = req.params.id;
  let result;
  let passwordRequest;
  if (status === "rejected") {
    [result] = await db.execute(
      "UPDATE employee_profile_requests SET status = 'rejected', reviewed_at = CURRENT_TIMESTAMP, password_hash = NULL, password_base_digest = NULL WHERE id = ? AND status = 'pending'",
      [id],
    );
  } else {
    [[passwordRequest]] = await db.execute(
      "SELECT employee_id FROM employee_profile_requests WHERE id = ? AND status = 'pending' AND password_hash IS NOT NULL", [id],
    );
    // Field names are fixed by the server. Update the profile and review status atomically.
    const assignments = Object.keys(fields).map(key =>
      `e.${key} = COALESCE(JSON_UNQUOTE(JSON_EXTRACT(r.changes, '$.${key}.to')), e.${key})`,
    );
    [result] = await db.execute(
      `UPDATE employee_profile_requests r JOIN employees e ON e.id = r.employee_id
       SET ${assignments.join(", ")}, e.password = COALESCE(r.password_hash, e.password), r.status = 'approved', r.reviewed_at = CURRENT_TIMESTAMP
       WHERE r.id = ? AND r.status = 'pending'
         AND (r.password_hash IS NULL OR r.password_base_digest = SHA2(e.password, 256))`,
      [id],
    );
  }
  if (!result.affectedRows) {
    return res.status(409).json({ message: "Yêu cầu đã được xử lý, hồ sơ không còn tồn tại hoặc mật khẩu hiện tại đã thay đổi." });
  }
  if (passwordRequest) {
    invalidateEmployeeSessions(passwordRequest.employee_id);
    await db.execute(
      "UPDATE employee_profile_requests SET password_hash = NULL, password_base_digest = NULL WHERE id = ?",
      [id],
    ).catch(error => console.error("Không xóa được dữ liệu duyệt mật khẩu:", error));
  }
  return res.json({ status });
});
