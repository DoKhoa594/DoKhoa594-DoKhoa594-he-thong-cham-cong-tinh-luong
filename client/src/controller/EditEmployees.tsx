import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

type FormType = {
  id: number | string;
  name: string;
  code: string;

  dob: string;
  gender: string;

  birthPlace: string;
  ethnicity: string;
  nationality: string;

  idCard: string;
  phone: string;
  email: string;

  department_id: string;
  position_id: string;
  department: string;
  position: string;
  password: string;
  basic_salary: string;
};

export default function EditEmployee() {
  const navigate = useNavigate();
  const { code } = useParams();

  const [loading, setLoading] = useState(false);

  const [openEmployeeMenu, setOpenEmployeeMenu] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") ?? "{}");
  const departments = [
    { id: 1, name: "CNTT" },
    { id: 5, name: "Kinh doanh" },
    { id: 6, name: "Marketing" },
    { id: 7, name: "Tài chính - Kế toán" },
    { id: 8, name: "Sản xuất" },
  ];

  const positions = [
    { id: 1, name: "Giám đốc" },
    { id: 2, name: "Phó giám đốc" },
    { id: 3, name: "Trưởng phòng" },
    { id: 4, name: "Nhân viên" },
    { id: 5, name: "Thực tập sinh" },
  ];

  const [form, setForm] = useState<FormType>({
    id: "",
    name: "",
    code: "",
    dob: "",
    gender: "Nam",

    birthPlace: "",
    ethnicity: "",
    nationality: "",

    idCard: "",
    phone: "",
    email: "",

    department: "",
    position: "",
    department_id: "",
    position_id: "",
    password: "",
    basic_salary: "",
  });
  // ================= INPUT CHANGE =================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ================= AGE =================
  const calculateAge = (dob: string) => {
    if (!dob) return "";

    const birth = new Date(dob);
    const diff = Date.now() - birth.getTime();

    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  // ================= LOAD DETAIL =================
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);

        const res = await axios.get(
          `http://localhost:5000/api/get-employee-by-code/${code}`,
        );

        setForm({
          ...res.data,
        });
      } catch (err) {
        console.error(err);

        toast.error("Không tải được hồ sơ nhân viên");
      } finally {
        setLoading(false);
      }
    };

    if (code) {
      fetchEmployee();
    }
  }, [code]);

  // ================= UPDATE =================
  const handleUpdate = async () => {
    try {
      setLoading(true);

      await axios.put(
        `http://localhost:5000/api/update-employee/${code}`,
        form,
      );

      toast.success("Cập nhật thành công");

      navigate("/admin/employees/list");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = () => {
    toast.custom(
      (t) => (
        <div
          className={`
          bg-white
          shadow-2xl
          rounded-2xl
          border
          border-gray-100
          p-5
          w-[360px]
          transition-all
          duration-300
          ${t.visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}
        `}
        >
          <div className="flex items-start gap-4">
            {/* ICON */}
            <div
              className="
              w-11
              h-11
              rounded-full
              bg-red-100
              text-red-600
              flex
              items-center
              justify-center
              text-xl
              shrink-0
            "
            >
              ⚠️
            </div>

            {/* CONTENT */}
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900">
                Xóa nhân viên?
              </h3>

              <p className="text-sm text-gray-500 mt-1 leading-5">
                Bạn có chắc muốn xóa nhân viên{" "}
                <span className="font-semibold text-gray-800">
                  {form.name || form.code}
                </span>{" "}
                không?
              </p>

              <p className="text-xs text-red-500 mt-2">
                Hành động này không thể hoàn tác.
              </p>
            </div>
          </div>

          {/* ACTION */}
          <div className="flex justify-end gap-3 mt-5">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="
              px-4
              py-2
              rounded-lg
              bg-gray-100
              hover:bg-gray-200
              text-gray-700
              text-sm
              font-medium
              transition
            "
            >
              Hủy
            </button>

            <button
              onClick={async () => {
                toast.dismiss(t.id);

                try {
                  setLoading(true);

                  await axios.delete(
                    `http://localhost:5000/api/delete-employee/${form.id}`,
                  );

                  toast.success("Xóa nhân viên thành công");

                  navigate("/admin/employees/list");
                } catch (err: any) {
                  toast.error(err?.response?.data?.message || "Xóa thất bại");
                } finally {
                  setLoading(false);
                }
              }}
              className="
              px-4
              py-2
              rounded-lg
              bg-red-600
              hover:bg-red-700
              text-white
              text-sm
              font-semibold
              shadow-sm
              transition
            "
            >
              Xóa nhân viên
            </button>
          </div>
        </div>
      ),
      {
        duration: 6000,
        position: "top-center",
      },
    );
  };
  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* SIDEBAR */}
      <div className="w-64 bg-blue-700 text-white p-5 flex flex-col">
        <h2 className="text-2xl font-bold mb-6 tracking-wide">Admin Panel</h2>

        {/* USER */}
        <div className="flex items-center gap-3 mb-6 p-2 rounded bg-blue-600">
          <div
            className="
              w-10
              h-10
              bg-white
              text-blue-700
              flex
              items-center
              justify-center
              rounded-full
              font-bold
            "
          >
            {user?.username?.charAt(0)?.toUpperCase() || "?"}
          </div>

          <div>
            <p className="font-semibold">{user?.username}</p>

            <p className="text-xs text-blue-200">Administrator</p>
          </div>
        </div>

        {/* MENU */}
        <nav className="flex flex-col gap-2">
          <button
            onClick={() => navigate("/admin")}
            className="
              p-2
              hover:bg-blue-600
              rounded
              text-left
            "
          >
            Tổng quan
          </button>

          <button
            className="
              p-2
              hover:bg-blue-600
              rounded
              text-left
            "
          >
            Chấm công
          </button>

          {/* EMPLOYEE MENU */}
          <div>
            <button
              onClick={() => setOpenEmployeeMenu(!openEmployeeMenu)}
              className="
                p-2
                hover:bg-blue-600
                rounded
                w-full
                text-left
              "
            >
              Nhân viên ▾
            </button>

            {openEmployeeMenu && (
              <div className="ml-4 mt-2 flex flex-col gap-2">
                <button
                  onClick={() => navigate("/admin/employees/add")}
                  className="
                    p-2
                    bg-blue-600
                    rounded
                    text-sm
                    text-left
                  "
                >
                  ➕ Thêm nhân viên
                </button>

                <button
                  onClick={() => navigate("/admin/employees/list")}
                  className="
                    p-2
                    bg-blue-600
                    rounded
                    text-sm
                    text-left
                  "
                >
                  📋 Danh sách nhân viên
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate("/admin/payroll")}
            className="text-left p-2 bg-blue-600 rounded"
          >
            Bảng lương
          </button>
        </nav>

        {/* LOGOUT */}
        <button
          className="
            mt-auto
            bg-red-500
            hover:bg-red-600
            py-2
            rounded
            transition
          "
        >
          Đăng xuất
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">✏ Chỉnh sửa nhân viên</h1>

          <button
            onClick={() => navigate(-1)}
            className="
              bg-gray-600
              hover:bg-gray-700
              text-white
              px-4
              py-2
              rounded
              transition
            "
          >
            ← Quay lại
          </button>
        </div>

        {/* FORM */}
        <div
          className="
            bg-white
            p-8
            rounded-2xl
            shadow-lg
            grid
            grid-cols-2
            gap-5
          "
        >
          {/* PERSONAL */}
          <h2 className="col-span-2 text-xl font-bold">Thông tin cá nhân</h2>

          <Field
            label="Họ tên"
            name="name"
            value={form.name}
            onChange={handleChange}
          />

          <div>
            <label className="text-sm font-medium">Mã nhân viên</label>

            <input
              value={form.code}
              disabled
              className="
                w-full
                border
                p-2
                rounded
                bg-gray-100
              "
            />
          </div>

          <Field
            label="CMND / CCCD"
            name="idCard"
            value={form.idCard}
            onChange={handleChange}
          />

          <Field
            label="Số điện thoại"
            name="phone"
            value={form.phone}
            onChange={handleChange}
          />

          <Field
            label="Email"
            name="email"
            value={form.email}
            onChange={handleChange}
          />

          <div>
            <label className="text-sm font-medium">Ngày sinh</label>

            <input
              type="date"
              name="dob"
              value={form.dob}
              onChange={handleChange}
              className="
                w-full
                border
                p-2
                rounded
              "
            />
          </div>

          <div>
            <label className="text-sm font-medium">Giới tính</label>

            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="
                w-full
                border
                p-2
                rounded
              "
            >
              <option value="Nam">Nam</option>

              <option value="Nữ">Nữ</option>
            </select>
          </div>

          <div className="col-span-2 bg-gray-100 p-3 rounded">
            👤 Tuổi:
            <b> {calculateAge(form.dob) || "--"}</b>
          </div>

          {/* EXTRA */}
          <h2 className="col-span-2 text-xl font-bold mt-4">
            Thông tin bổ sung
          </h2>

          <Field
            label="Nơi sinh"
            name="birthPlace"
            value={form.birthPlace}
            onChange={handleChange}
          />

          <Field
            label="Dân tộc"
            name="ethnicity"
            value={form.ethnicity}
            onChange={handleChange}
          />

          <Field
            label="Quốc tịch"
            name="nationality"
            value={form.nationality}
            onChange={handleChange}
          />

          <div>
            <label className="text-sm font-medium">Phòng ban</label>

            <select
              name="department_id"
              value={form.department_id}
              onChange={handleChange}
              className="
    w-full
    border
    p-2
    rounded
    focus:ring-2
    focus:ring-blue-500
    outline-none
  "
            >
              <option value="">-- Chọn phòng ban --</option>

              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Chức vụ</label>

            <select
              name="position_id"
              value={form.position_id}
              onChange={handleChange}
              className="
    w-full
    border
    p-2
    rounded
    focus:ring-2
    focus:ring-blue-500
    outline-none
  "
            >
              <option value="">-- Chọn chức vụ --</option>

              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Lương cơ bản</label>

            <input
              type="text"
              name="basic_salary"
              value={
                form.basic_salary
                  ? String(form.basic_salary).replace(
                      /\B(?=(\d{3})+(?!\d))/g,
                      ".",
                    )
                  : ""
              }
              onChange={(e) => {
                const rawValue = e.target.value.replace(/\D/g, "");

                setForm({
                  ...form,
                  basic_salary: rawValue,
                });
              }}
              className="
      w-full
      border
      p-2
      rounded
      focus:ring-2
      focus:ring-blue-500
      outline-none
    "
              placeholder="10.000.000"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Password hiện tại</label>

            <input
              type="password"
              value="••••••••"
              disabled
              className="
      w-full
      border
      p-2
      rounded
      bg-gray-100
      text-gray-500
      cursor-not-allowed
    "
            />
          </div>

          {/* ACTION */}
          <div className="col-span-2 flex gap-4 mt-6">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="
      bg-red-600
      hover:bg-red-700
      text-white
      px-6
      py-3
      rounded
      transition
      disabled:bg-gray-400
    "
            >
              🗑 Xóa
            </button>

            <button
              onClick={() => navigate(-1)}
              className="
      flex-1
      bg-gray-500
      hover:bg-gray-600
      text-white
      py-3
      rounded
      transition
    "
            >
              Huỷ
            </button>

            <button
              onClick={handleUpdate}
              disabled={loading}
              className="
      flex-1
      bg-blue-600
      hover:bg-blue-700
      text-white
      py-3
      rounded
      transition
      disabled:bg-gray-400
    "
            >
              {loading ? "Đang lưu..." : "💾 Cập nhật nhân viên"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange }: any) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>

      <input
        name={name}
        value={value}
        onChange={onChange}
        className="
          w-full
          border
          p-2
          rounded
          focus:ring-2
          focus:ring-blue-500
          outline-none
        "
      />
    </div>
  );
}
