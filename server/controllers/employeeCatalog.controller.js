import connection from "../config/db.js";

const db = connection.promise();
const tables = new Map([
  ["departments", "departments"],
  ["positions", "positions"],
]);

export async function getEmployeeCatalog(_req, res) {
  try {
    const [[departments], [positions]] = await Promise.all([
      db.query("SELECT id, name FROM departments ORDER BY name, id"),
      db.query("SELECT id, name FROM positions ORDER BY name, id"),
    ]);
    res.set("Cache-Control", "no-store");
    return res.json({ departments, positions });
  } catch (error) {
    console.error("LOAD EMPLOYEE CATALOG:", error);
    return res.status(500).json({ message: "Không tải được danh mục" });
  }
}

export async function updateEmployeeCatalog(req, res) {
  const table = tables.get(req.params.kind);
  if (!table) return res.status(404).json({ message: "Danh mục không tồn tại" });

  const creating = req.method === "POST";
  const deleting = req.method === "DELETE";
  const id = Number(req.params.id);
  if (!creating && (!Number.isInteger(id) || id < 1 || id > 4294967295)) {
    return res.status(400).json({ message: "Mã danh mục không hợp lệ" });
  }
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (!deleting && (!name || [...name].length > 100)) {
    return res.status(400).json({ message: "Tên phải có từ 1 đến 100 ký tự" });
  }

  try {
    if (creating) {
      const [result] = await db.query(`INSERT INTO ${table} (name) VALUES (?)`, [name]);
      return res.status(201).json({ id: result.insertId, name });
    }
    const [result] = deleting
      ? await db.query(`DELETE FROM ${table} WHERE id = ?`, [id])
      : await db.query(`UPDATE ${table} SET name = ? WHERE id = ?`, [name, id]);
    if (!result.affectedRows) return res.status(404).json({ message: "Mục này không còn tồn tại" });
    return deleting ? res.sendStatus(204) : res.json({ id, name });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Tên này đã tồn tại trong danh mục" });
    }
    if (error.code === "ER_ROW_IS_REFERENCED_2" || error.code === "ER_ROW_IS_REFERENCED") {
      return res.status(409).json({ message: "Mục này đang được gán cho nhân viên. Hãy chuyển nhân viên sang mục khác trước khi xóa." });
    }
    console.error("UPDATE EMPLOYEE CATALOG:", error);
    return res.status(500).json({ message: "Không cập nhật được danh mục" });
  }
}
