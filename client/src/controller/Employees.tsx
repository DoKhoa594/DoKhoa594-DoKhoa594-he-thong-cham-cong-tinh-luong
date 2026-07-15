import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiBriefcase,
  FiCalendar,
  FiChevronDown,
  FiDollarSign,
  FiHome,
  FiList,
  FiLogOut,
  FiSave,
  FiUser,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";

type FormType = {
  name: string;
  code: string;
  dob: string;
  gender: string;
  position: string;
  department: string;
  idCard: string;
  password: string;
  phone: string;
  birthPlace: string;
  ethnicity: string;
  nationality: string;
  email: string;
  basic_salary: string;
};

type User = {
  username: string;
  role: string;
};

export default function AddEmployee() {
  const navigate = useNavigate();

  const [openEmployeeMenu, setOpenEmployeeMenu] = useState(true);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const positions = [
    "Giám đốc",
    "Phó giám đốc",
    "Trưởng phòng",
    "Nhân viên",
    "Thực tập sinh",
  ];

  const departments = [
    "CNTT",
    "Kinh doanh",
    "Marketing",
    "Tài chính - Kế toán",
    "Sản xuất",
  ];

  const [form, setForm] = useState<FormType>({
    name: "",
    code: "",
    dob: "",
    gender: "Nam",
    position: "",
    department: "",
    idCard: "",
    password: "",
    phone: "",
    birthPlace: "",
    ethnicity: "",
    nationality: "",
    email: "",
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

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const calculateAge = (dob: string) => {
    if (!dob) return "";

    const birth = new Date(dob);
    const ageDif = Date.now() - birth.getTime();
    const ageDate = new Date(ageDif);

    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const formatSalary = (value: string) => {
    if (!value) return "";
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const validate = () => {
    if (!form.name.trim()) return "Vui lòng nhập tên";
    if (!form.code.trim()) return "Vui lòng nhập mã nhân viên";
    if (!form.password.trim()) return "Vui lòng nhập mật khẩu";
    if (!form.position) return "Vui lòng chọn chức vụ";
    if (!form.department) return "Vui lòng chọn phòng ban";
    if (!form.basic_salary) return "Vui lòng nhập lương cơ bản";

    if (!/^[0-9]{9,11}$/.test(form.phone)) {
      return "Số điện thoại không hợp lệ";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return "Email không hợp lệ";
    }

    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) return toast.error(error);

    const newEmployee = {
      ...form,
      age: calculateAge(form.dob),
    };

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/api/create-employee",
        newEmployee,
      );

      toast.success(res.data.message || "Thêm nhân viên thành công");

      setForm({
        name: "",
        code: "",
        dob: "",
        gender: "Nam",
        position: "",
        department: "",
        idCard: "",
        password: "",
        phone: "",
        birthPlace: "",
        ethnicity: "",
        nationality: "",
        email: "",
        basic_salary: "",
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi thêm nhân viên");
    } finally {
      setLoading(false);
    }
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
                  className="px-4 py-2 bg-white text-blue-700 rounded-xl text-sm text-left font-semibold flex items-center gap-2"
                >
                  <FiUserPlus /> Thêm nhân viên
                </button>

                <button
                  onClick={() => navigate("/admin/employees/list")}
                  className="px-4 py-2 hover:bg-white/10 rounded-xl text-sm text-left flex items-center gap-2"
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
              Thêm nhân viên
            </h1>
            <p className="text-slate-500 mt-1">
              Tạo hồ sơ nhân viên mới trong hệ thống
            </p>
          </div>

          <button
            onClick={() => navigate("/admin/employees/list")}
            className="bg-slate-600 hover:bg-slate-700 text-white px-5 py-3 rounded-2xl shadow flex items-center gap-2 font-semibold transition"
          >
            <FiArrowLeft /> Danh sách
          </button>
        </div>

        <div className="h-[calc(100vh-120px)] overflow-auto pr-1">
          {/* FORM HEADER */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl shadow-sm border overflow-hidden mb-6">
            <div className="p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white text-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow">
                  <FiUserPlus />
                </div>

                <div>
                  <h2 className="text-2xl font-bold">Thông tin nhân viên</h2>
                  <p className="text-blue-100 mt-1">
                    Nhập đầy đủ thông tin để tạo tài khoản nhân viên
                  </p>
                </div>
              </div>

              <div className="hidden md:block bg-white/10 border border-white/10 rounded-2xl px-5 py-3">
                <p className="text-xs text-blue-100">Tuổi</p>
                <p className="font-bold text-xl">
                  {calculateAge(form.dob) || "--"}
                </p>
              </div>
            </div>
          </div>

          {/* FORM */}
          <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FiUser /> Hồ sơ nhân viên
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Điền thông tin cá nhân, công việc và lương cơ bản
              </p>
            </div>

            <div className="p-6 bg-slate-50">
              <SectionTitle title="Thông tin cơ bản" icon={<FiUser />} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                <Field
                  label="Họ và tên"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                />

                <Field
                  label="Mã nhân viên"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
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
                  type="email"
                />

                <Field
                  label="Ngày sinh"
                  name="dob"
                  value={form.dob}
                  onChange={handleChange}
                  type="date"
                />

                <SelectField
                  label="Giới tính"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  options={["Nam", "Nữ"]}
                />

                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                  <p className="text-sm text-slate-500">Tuổi</p>
                  <h3 className="text-2xl font-bold text-blue-600 mt-1">
                    {calculateAge(form.dob) || "--"}
                  </h3>
                </div>
              </div>

              <SectionTitle
                title="Thông tin công việc"
                icon={<FiBriefcase />}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                <SelectField
                  label="Phòng ban"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  options={departments}
                  placeholder="-- Chọn phòng ban --"
                />

                <SelectField
                  label="Chức vụ"
                  name="position"
                  value={form.position}
                  onChange={handleChange}
                  options={positions}
                  placeholder="-- Chọn chức vụ --"
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
                  label="Mật khẩu"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  type="password"
                />
              </div>

              <SectionTitle title="Thông tin thêm" icon={<FiUsers />} />

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

              {/* ACTION */}
              <div className="flex flex-col md:flex-row gap-4">
                <button
                  onClick={() => navigate(-1)}
                  className="flex-1 bg-slate-500 hover:bg-slate-600 text-white py-3 rounded-2xl transition font-semibold"
                >
                  Hủy
                </button>

                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl transition disabled:bg-slate-400 flex items-center justify-center gap-2 font-semibold"
                >
                  <FiSave />
                  {loading ? "Đang lưu..." : "Lưu nhân viên"}
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

function Field({ label, name, value, onChange, type = "text" }: any) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-600">{label}</label>

      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        className="w-full mt-2 border bg-white p-3 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
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

        {options.map((item: string) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}
