import connection from "../config/db.js";

const db = connection.promise();
const amounts = {
  allowance: "phụ cấp",
  bonus: "thưởng",
  advance_salary: "tạm ứng",
  ot_hours: "tăng ca",
};
let schema;

export function ensurePayrollReasons() {
  schema ??= Promise.all(Object.keys(amounts).map(async amount => {
    const field = `${amount}_reason`;
    const [columns] = await db.query("SHOW COLUMNS FROM payrolls WHERE Field = ?", [field]);
    if (columns.length) return;
    try {
      await db.query(`ALTER TABLE payrolls ADD COLUMN ${field} VARCHAR(255) DEFAULT NULL`);
    } catch (error) {
      if (error.code !== "ER_DUP_FIELDNAME") throw error;
    }
  })).catch(error => {
    schema = undefined;
    throw error;
  });
  return schema;
}

export function readPayrollReasons(extra) {
  const reasons = {};
  for (const [field, label] of Object.entries(amounts)) {
    const amount = Number(extra?.[field] ?? 0);
    const reason = extra?.[`${field}_reason`];
    if (!Number.isFinite(amount) || amount < 0) {
      return { error: `${field === "ot_hours" ? "Số giờ" : "Số tiền"} ${label} không hợp lệ.` };
    }
    if (amount === 0) {
      reasons[field] = null;
      continue;
    }
    if (typeof reason !== "string" || !reason.trim() || [...reason.trim()].length > 255) {
      return { error: `Nhập lý do ${label} từ 1 đến 255 ký tự.` };
    }
    reasons[field] = reason.trim();
  }
  return reasons;
}
