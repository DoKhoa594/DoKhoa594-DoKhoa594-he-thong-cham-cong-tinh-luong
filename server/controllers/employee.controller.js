import { defaultEmployeePassword, hashEmployeePassword } from "./employeePassword.js";
import { isEmployeeAvatar } from "./employeeAvatar.js";
import connection from "../config/db.js";
import { randomInt } from "node:crypto";

const findAvailableCode = async () => {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = String(randomInt(100000000, 1000000000));
    const [rows] = await connection.promise().query(
      "SELECT id FROM employees WHERE code = ? LIMIT 1",
      [code],
    );
    if (!rows.length) return code;
  }
  throw new Error("Unable to generate an employee code");
};

const getNextEmployeeCode = async (_req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    return res.json({ code: await findAvailableCode() });
  } catch (error) {
    console.error("GENERATE EMPLOYEE CODE ERROR:", error);
    return res.status(500).json({ message: "Không tạo được mã nhân viên" });
  }
};

// ================= CREATE =================
const createEmployee = async (req, res) => {
  const data = req.body ?? {};
  const { avatar, address, emergency_contact_name, emergency_contact_phone } = data;

  if ([data.department_id, data.position_id].some(id =>
    id != null && (
      (typeof id !== "number" && typeof id !== "string") ||
      !/^\d{1,10}$/.test(String(id)) || Number(id) < 1 || Number(id) > 4294967295
    ),
  )) {
    return res.status(400).json({ message: "Mã phòng ban hoặc chức vụ không hợp lệ" });
  }

  if (
    (address != null && (typeof address !== "string" || address.length > 255)) ||
    (emergency_contact_name != null &&
      (typeof emergency_contact_name !== "string" || emergency_contact_name.length > 150)) ||
    (emergency_contact_phone &&
      (typeof emergency_contact_phone !== "string" || !/^\d{9,11}$/.test(emergency_contact_phone))) ||
    Boolean(emergency_contact_name?.trim()) !== Boolean(emergency_contact_phone)
  ) {
    return res.status(400).json({ message: "Địa chỉ hoặc thông tin liên hệ khẩn cấp không hợp lệ" });
  }

  if (avatar != null && !isEmployeeAvatar(avatar)) {
    return res.status(400).json({ message: "Ảnh phải là JPG, PNG hoặc WebP và tối đa 1 MB" });
  }

  try {
    const getPositionId = () => {
      return new Promise((resolve, reject) => {
        connection.query(
          data.position_id == null ? "SELECT id FROM positions WHERE name=?" : "SELECT id FROM positions WHERE id=?",
          [data.position_id ?? data.position],
          (err, results) => {
            if (err) return reject(err);

            if (!results.length) {
              return reject(new Error("Không tìm thấy chức vụ", { cause: "CATALOG_CHANGED" }));
            }

            resolve(results[0].id);
          },
        );
      });
    };

    const getDepartmentId = () => {
      return new Promise((resolve, reject) => {
        connection.query(
          data.department_id == null ? "SELECT id FROM departments WHERE name=?" : "SELECT id FROM departments WHERE id=?",
          [data.department_id ?? data.department],
          (err, results) => {
            if (err) return reject(err);

            if (!results.length) {
              return reject(new Error("Không tìm thấy phòng ban", { cause: "CATALOG_CHANGED" }));
            }

            resolve(results[0].id);
          },
        );
      });
    };

    const position_id = await getPositionId();
    const department_id = await getDepartmentId();

    const sql = `
      INSERT INTO employees
      (
        name,
        code,
        dob,
        age,
        gender,
        position_id,
        department_id,
        email,
        idCard,
        password,
        phone,
        birthPlace,
        ethnicity,
        nationality,
        basic_salary,
        avatar,
        address,
        emergency_contact_name,
        emergency_contact_phone
      )
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `;

    const autoCode = data.auto_code === true;
    let code = autoCode && !/^\d{9}$/.test(data.code)
      ? await findAvailableCode()
      : String(data.code ?? "").trim();
    if (!code || code.toLowerCase() === "admin") {
      return res.status(400).json({ message: "Mã nhân viên không hợp lệ." });
    }
    const values = [
      data.name,
      code,
      data.dob || null,
      data.age || 0,
      data.gender,
      position_id,
      department_id,
      data.email,
      data.idCard,
      await hashEmployeePassword(defaultEmployeePassword),
      data.phone,
      data.birthPlace,
      data.ethnicity,
      data.nationality,
      Number(data.basic_salary || 0),
      avatar ?? null,
      address?.trim() || null,
      emergency_contact_name?.trim() || null,
      emergency_contact_phone || null,
    ];
    for (let attempt = 0; attempt < 10; attempt++) {
      values[1] = code;
      try {
        await connection.promise().query(sql, values);
        return res.json({ message: "Thêm nhân viên thành công", code });
      } catch (error) {
        if (error.code !== "ER_DUP_ENTRY" ||
            !/for key ['`]?(?:employees\.)?(?:uq_employees_code|code)['`]?$/i.test(error.message)) {
          throw error;
        }
        if (!autoCode) return res.status(400).json({ message: "Mã nhân viên đã tồn tại" });
        if (attempt < 9) code = await findAvailableCode();
      }
    }
    return res.status(503).json({ message: "Chưa cấp được mã nhân viên. Vui lòng lưu lại." });
  } catch (error) {
    if (error.cause === "CATALOG_CHANGED" || error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(409).json({ message: "Phòng ban hoặc chức vụ đã thay đổi. Vui lòng chọn lại." });
    }
    console.log(error);

    res.status(500).json({
      message: "Lỗi xử lý",
    });
  }
};

// ================= DETAIL =================
const getEmployeeByCode = (req, res) => {
  const { code } = req.params;

  connection.query(
    "SELECT * FROM employees WHERE code=?",
    [code],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Lỗi server",
        });
      }

      if (!result.length) {
        return res.status(404).json({
          message: "Không tìm thấy nhân viên",
        });
      }

      res.json(result[0]);
    },
  );
};

// ================= UPDATE =================
const updateEmployee = (req, res) => {
  const { code } = req.params;
  const data = req.body;

  const sql = `
    UPDATE employees
    SET
      name=?,
      dob=?,
      gender=?,
      birthPlace=?,
      ethnicity=?,
      nationality=?,
      idCard=?,
      phone=?,
      email=?,
      basic_salary=?
    WHERE code=?
  `;

  connection.query(
    sql,
    [
      data.name,
      data.dob,
      data.gender,
      data.birthPlace,
      data.ethnicity,
      data.nationality,
      data.idCard,
      data.phone,
      data.email,
      Number(data.basic_salary || 0),
      code,
    ],
    (err) => {
      if (err) {
        console.log("UPDATE ERROR:", err);

        return res.status(500).json({
          message: "Update lỗi",
        });
      }

      res.json({
        message: "Cập nhật thành công",
      });
    },
  );
};

export default {
  createEmployee,
  getNextEmployeeCode,
  getEmployeeByCode,
  updateEmployee,
};
