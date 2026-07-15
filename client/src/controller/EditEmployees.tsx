import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiBriefcase,
  FiCalendar,
  FiChevronDown,
  FiDollarSign,
  FiEdit3,
  FiHome,
  FiList,
  FiLogOut,
  FiSave,
  FiTrash2,
  FiUser,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";

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

type User = {
  username: string;
  role: string;
};

export default function EditEmployee() {
  const navigate = useNavigate();
  const { code } = useParams();

  const [loading, setLoading] = useState(false);
  const [openEmployeeMenu, setOpenEmployeeMenu] = useState(true);
  const [user, setUser] = useState<User | null>(null);

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

  useEffect(() => {
    try {
      const data = localStorage.getItem("user");

      if (!data) {
        navigate("/");
        return;
      }

      const parsed: User = JSON.parse(data);

      if (parsed.role !== "admin") {
        navigate("/user");
        return;
      }

      setUser(parsed);
    } catch {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);

        const res = await axios.get(
          `http://localhost:5000/api/get-employee-by-code/${code}`,
        );

        const emp = res.data;

        setForm({
          ...emp,
          dob: emp.dob ? String(emp.dob).slice(0, 10) : "",
          department_id: emp.department_id ? String(emp.department_id) : "",
          position_id: emp.position_id ? String(emp.position_id) : "",
          basic_salary: emp.basic_salary ? String(emp.basic_salary) : "",
        });
      } catch (err) {
        console.error(err);
        toast.error("Không tải được hồ sơ nhân viên");
      } finally {
        setLoading(false);
      }
    };

    if (code) fetchEmployee();
  }, [code]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const calculateAge = (dob: string) => {
    if (!dob) return "";

    const birth = new Date(dob);
    const diff = Date.now() - birth.getTime();

    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  const formatSalary = (value: string) => {
    if (!value) return "";
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);

      await axios.put(
        `http://localhost:5000/api/update-employee/${code}`,
        form,
      );

      toast.success("Cập nhật nhân viên thành công");
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
          className={`bg-white shadow-2xl rounded-2xl border border-slate-100 p-5 w-[380px] transition-all duration-300 ${
            t.visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl shrink-0">
              <FiTrash2 />
            </div>

            <div className="flex-1">
              <h3 className="text-base font-bold text-slate-900">
                Xóa nhân viên?
              </h3>

              <p className="text-sm text-slate-500 mt-1 leading-5">
                Bạn có chắc muốn xóa nhân viên{" "}
                <span className="font-semibold text-slate-800">
                  {form.name || form.code}
                </span>{" "}
                không?
              </p>

              <p className="text-xs text-red-500 mt-2">
                Hành động này không thể hoàn tác.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-5">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition"
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
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-sm transition"
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

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-slate-100">
      {/* SIDEBAR */}
      <aside className="w-72 bg-gradient-to-b from-blue-700 to-blue-900 text-white p-5 flex flex-col shadow-2xl">
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-wide">Admin Panel</h2>
          <p className="text-sm text-blue-200 mt-1">Quản lý nhân sự</p>
        </div>

        <div className="flex items-center gap-3 mb-7 p-3 rounded-2xl bg-white/10 border border-white/10">
          <div className="w-11 h-11 bg-white text-blue-700 flex items-center justify-center rounded-full font-bold text-lg">
            {user.username?.charAt(0)?.toUpperCase() || "?"}
          </div>

          <div>
            <p className="font-semibold">{user.username}</p>
            <p className="text-xs text-blue-200">Administrator</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          <button
            onClick={() => navigate("/admin")}
            className="px-4 py-3 hover:bg-white/10 rounded-xl text-left transition flex items-center gap-2"
          >
            <FiHome /> Tổng quan
          </button>

          <button
            onClick={() => navigate("/admin/attendance")}
            className="px-4 py-3 hover:bg-white/10 rounded-xl text-left transition flex items-center gap-2"
          >
            <FiCalendar /> Chấm công
          </button>

          <div>
            <button
              onClick={() => setOpenEmployeeMenu(!openEmployeeMenu)}
              className="px-4 py-3 bg-white/10 rounded-xl w-full text-left transition flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <FiUsers /> Nhân viên
              </span>

              <FiChevronDown />
            </button>

            {openEmployeeMenu && (
              <div className="ml-4 mt-2 flex flex-col gap-2">
                <button
                  onClick={() => navigate("/admin/employees/add")}
                  className="px-4 py-2 hover:bg-white/10 rounded-xl text-sm text-left flex items-center gap-2"
                >
                  <FiUserPlus /> Thêm nhân viên
                </button>

                <button
                  onClick={() => navigate("/admin/employees/list")}
                  className="px-4 py-2 bg-white text-blue-700 rounded-xl text-sm text-left font-semibold flex items-center gap-2"
                >
                  <FiList /> Danh sách nhân viên
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate("/admin/payroll")}
            className="px-4 py-3 hover:bg-white/10 rounded-xl text-left transition flex items-center gap-2"
          >
            <FiDollarSign /> Bảng lương
          </button>
        </nav>

        <button
          onClick={handleLogout}
          className="mt-auto bg-red-500 hover:bg-red-600 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold transition"
        >
          <FiLogOut /> Đăng xuất
        </button>
      </aside>

      {/* CONTENT */}
      <main className="flex-1 p-6 overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Chỉnh sửa nhân viên
            </h1>
            <p className="text-slate-500 mt-1">
              Cập nhật thông tin cá nhân, công việc và lương cơ bản
            </p>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="bg-slate-600 hover:bg-slate-700 text-white px-5 py-3 rounded-2xl shadow flex items-center gap-2 font-semibold transition"
          >
            <FiArrowLeft /> Quay lại
          </button>
        </div>

        <div className="h-[calc(100vh-120px)] overflow-auto pr-1">
          {/* PROFILE HEADER */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl shadow-sm border overflow-hidden mb-6">
            <div className="p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white text-blue-600 rounded-2xl flex items-center justify-center text-3xl font-bold shadow">
                  {form.name?.charAt(0)?.toUpperCase() || "?"}
                </div>

                <div>
                  <h2 className="text-2xl font-bold">
                    {form.name || "Đang tải..."}
                  </h2>

                  <p className="text-blue-100 mt-1">
                    {form.code || "--"} •{" "}
                    {form.department || "Chưa có phòng ban"}
                  </p>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-3">
                <div className="bg-white/10 border border-white/10 rounded-2xl px-5 py-3">
                  <p className="text-xs text-blue-100">Tuổi</p>
                  <p className="font-bold text-xl">
                    {calculateAge(form.dob) || "--"}
                  </p>
                </div>

                <div className="bg-white/10 border border-white/10 rounded-2xl px-5 py-3">
                  <p className="text-xs text-blue-100">Lương cơ bản</p>
                  <p className="font-bold text-xl">
                    {formatSalary(form.basic_salary) || "--"} ₫
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FORM */}
          <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FiEdit3 /> Hồ sơ nhân viên
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Thay đổi thông tin rồi bấm cập nhật để lưu
              </p>
            </div>

            <div className="p-6 bg-slate-50">
              <SectionTitle title="Thông tin cá nhân" icon={<FiUser />} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                <Field
                  label="Họ tên"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                />

                <Field
                  label="Mã nhân viên"
                  name="code"
                  value={form.code}
                  disabled
                />

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

                <Field
                  label="Ngày sinh"
                  name="dob"
                  type="date"
                  value={form.dob}
                  onChange={handleChange}
                />

                <SelectField
                  label="Giới tính"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  options={[
                    { value: "Nam", label: "Nam" },
                    { value: "Nữ", label: "Nữ" },
                  ]}
                />

                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                  <p className="text-sm text-slate-500">Tuổi</p>
                  <h3 className="text-2xl font-bold text-blue-600 mt-1">
                    {calculateAge(form.dob) || "--"}
                  </h3>
                </div>
              </div>

              <SectionTitle title="Thông tin bổ sung" icon={<FiUsers />} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
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
              </div>

              <SectionTitle
                title="Thông tin công việc"
                icon={<FiBriefcase />}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                <SelectField
                  label="Phòng ban"
                  name="department_id"
                  value={form.department_id}
                  onChange={handleChange}
                  placeholder="-- Chọn phòng ban --"
                  options={departments.map((d) => ({
                    value: String(d.id),
                    label: d.name,
                  }))}
                />

                <SelectField
                  label="Chức vụ"
                  name="position_id"
                  value={form.position_id}
                  onChange={handleChange}
                  placeholder="-- Chọn chức vụ --"
                  options={positions.map((p) => ({
                    value: String(p.id),
                    label: p.name,
                  }))}
                />

                <div>
                  <label className="text-sm font-semibold text-slate-600">
                    Lương cơ bản
                  </label>

                  <input
                    type="text"
                    name="basic_salary"
                    value={formatSalary(form.basic_salary)}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/\D/g, "");

                      setForm({
                        ...form,
                        basic_salary: rawValue,
                      });
                    }}
                    className="w-full mt-2 border bg-white p-3 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10.000.000"
                  />
                </div>

                <Field
                  label="Password hiện tại"
                  name="password"
                  value="••••••••"
                  disabled
                  type="password"
                />
              </div>

              {/* ACTION */}
              <div className="flex flex-col md:flex-row gap-4">
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl transition disabled:bg-slate-400 flex items-center justify-center gap-2 font-semibold"
                >
                  <FiTrash2 /> Xóa
                </button>

                <button
                  onClick={() => navigate(-1)}
                  className="flex-1 bg-slate-500 hover:bg-slate-600 text-white py-3 rounded-2xl transition font-semibold"
                >
                  Hủy
                </button>

                <button
                  onClick={handleUpdate}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl transition disabled:bg-slate-400 flex items-center justify-center gap-2 font-semibold"
                >
                  <FiSave />
                  {loading ? "Đang lưu..." : "Cập nhật nhân viên"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SectionTitle({ title, icon }: any) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
        {icon}
      </div>

      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  disabled = false,
}: any) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-600">{label}</label>

      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        className={`w-full mt-2 border p-3 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 ${
          disabled
            ? "bg-slate-100 text-slate-500 cursor-not-allowed"
            : "bg-white"
        }`}
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
}: any) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-600">{label}</label>

      <select
        name={name}
        value={value || ""}
        onChange={onChange}
        className="w-full mt-2 border bg-white p-3 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
      >
        {placeholder && <option value="">{placeholder}</option>}

        {options.map((item: any) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}
