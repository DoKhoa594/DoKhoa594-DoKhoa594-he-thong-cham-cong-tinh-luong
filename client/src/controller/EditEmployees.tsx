import { useEmployeeCatalog } from "./useEmployeeCatalog";
import SuggestionField from "./SuggestionField";
import AvatarPicker from "./AvatarPicker";
import { birthPlaceOptions, ethnicityOptions, nationalities } from "./employeeLocations";
import AdminSidebar, { adminLayout, adminMain } from "./AdminSidebar";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiBriefcase,
  FiEdit3,
  FiSave,
  FiTrash2,
  FiUser,
  FiUsers,
} from "react-icons/fi";

type FormType = {
  id: number | string;
  name: string;
  code: string;
  avatar: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;

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
  const [loadedCode, setLoadedCode] = useState<string>();
  const [avatarChange, setAvatarChange] = useState<string | null>();
  const [readingAvatar, setReadingAvatar] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const { catalog, error: catalogError, reload: reloadCatalog } = useEmployeeCatalog(user?.role === "admin");

  const [form, setForm] = useState<FormType>({
    id: "",
    name: "",
    code: "",
    avatar: null,
    address: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
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
    const request = new AbortController();
    const fetchEmployee = async () => {
      try {
        setLoading(true);

        const res = await axios.get(
          `http://localhost:5000/api/get-employee-by-code/${encodeURIComponent(code ?? "")}`,
          { signal: request.signal },
        );

        if (request.signal.aborted) return;
        const emp = res.data;

        setForm({
          ...emp,
          dob: emp.dob ? String(emp.dob).slice(0, 10) : "",
          department_id: emp.department_id ? String(emp.department_id) : "",
          position_id: emp.position_id ? String(emp.position_id) : "",
          basic_salary: emp.basic_salary ? String(emp.basic_salary) : "",
        });
        setAvatarChange(undefined);
        setLoadedCode(code);
      } catch (err) {
        if (request.signal.aborted) return;
        console.error(err);
        toast.error("Không tải được hồ sơ nhân viên");
      } finally {
        if (!request.signal.aborted) setLoading(false);
      }
    };

    if (code) fetchEmployee();
    return () => request.abort();
  }, [code]);

  const profileReady = Boolean(code && loadedCode === code);
  const previewAvatar = avatarChange === undefined ? form.avatar : avatarChange;

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
    if (!catalog || !profileReady || loading || readingAvatar) return;
    try {
      setLoading(true);

      await axios.put(
        `http://localhost:5000/api/update-employee/${encodeURIComponent(code ?? "")}`,
        {
          department_id: form.department_id,
          position_id: form.position_id,
          basic_salary: form.basic_salary,
          birthPlace: form.birthPlace,
          ethnicity: form.ethnicity,
          nationality: form.nationality,
          address: form.address,
          emergency_contact_name: form.emergency_contact_name,
          emergency_contact_phone: form.emergency_contact_phone,
          ...(avatarChange === undefined ? {} : { avatar: avatarChange }),
        },
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
    <div className={adminLayout}>
      <AdminSidebar username={user.username} onLogout={handleLogout} employeesOpen />

      <main className={adminMain}>
        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
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

        <div className="min-w-0">
          {/* PROFILE HEADER */}
          <div className="bg-brand-navy rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
            <div className="p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 shrink-0 overflow-hidden bg-white text-brand rounded-2xl flex items-center justify-center text-3xl font-bold shadow">
                  {previewAvatar ? (
                    <img src={previewAvatar} alt="Ảnh đại diện nhân viên" className="h-full w-full object-cover" />
                  ) : (
                    form.name?.charAt(0)?.toUpperCase() || "?"
                  )}
                </div>

                <div>
                  <h2 className="text-2xl font-bold">
                    {form.name || "Đang tải..."}
                  </h2>

                  <p className="text-brand-soft mt-1">
                    {form.code || "--"} •{" "}
                    {form.department || "Chưa có phòng ban"}
                  </p>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-3">
                <div className="bg-white/10 border border-white/10 rounded-2xl px-5 py-3">
                  <p className="text-xs text-brand-soft">Tuổi</p>
                  <p className="font-bold text-xl">
                    {calculateAge(form.dob) || "--"}
                  </p>
                </div>

                <div className="bg-white/10 border border-white/10 rounded-2xl px-5 py-3">
                  <p className="text-xs text-brand-soft">Lương cơ bản</p>
                  <p className="font-bold text-xl">
                    {formatSalary(form.basic_salary) || "--"} ₫
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FORM */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
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

              <AvatarPicker key={code} value={previewAvatar} onChange={setAvatarChange}
                reading={readingAvatar} onReadingChange={setReadingAvatar} disabled={loading || !profileReady} />

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

                <div className="bg-brand-soft border border-brand-soft rounded-2xl p-5">
                  <p className="text-sm text-slate-500">Tuổi</p>
                  <h3 className="text-2xl font-bold text-brand mt-1">
                    {calculateAge(form.dob) || "--"}
                  </h3>
                </div>
              </div>

              <SectionTitle title="Thông tin bổ sung" icon={<FiUsers />} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                <SuggestionField
                  label="Nơi sinh"
                  name="birthPlace"
                  value={form.birthPlace ?? ""}
                  options={birthPlaceOptions}
                  maxLength={255}
                  onChange={value => setForm(current => ({ ...current, birthPlace: value }))}
                />

                <SuggestionField
                  label="Dân tộc"
                  name="ethnicity"
                  value={form.ethnicity ?? ""}
                  options={ethnicityOptions}
                  onChange={value => setForm(current => ({ ...current, ethnicity: value }))}
                />

                <SuggestionField
                  label="Quốc tịch"
                  name="nationality"
                  value={form.nationality ?? ""}
                  options={nationalities}
                  onChange={value => setForm(current => ({ ...current, nationality: value }))}
                />
                <Field label="Địa chỉ hiện tại" name="address" value={form.address}
                  maxLength={255} onChange={handleChange} />
                <Field label="Người liên hệ khẩn cấp" name="emergency_contact_name"
                  value={form.emergency_contact_name} maxLength={150} onChange={handleChange} />
                <Field label="Điện thoại liên hệ khẩn cấp" name="emergency_contact_phone"
                  value={form.emergency_contact_phone} type="tel" maxLength={11}
                  onChange={handleChange}
                />
              </div>

              <SectionTitle
                title="Thông tin công việc"
                icon={<FiBriefcase />}
              />

              {catalogError ? (
                <p role="alert" className="mb-3 text-sm text-rose-800">
                  Không tải được phòng ban và chức vụ.{" "}
                  <button type="button" onClick={reloadCatalog} className="font-semibold underline">Thử lại</button>
                </p>
              ) : !catalog && (
                <p role="status" className="mb-3 text-sm text-slate-600">Đang tải danh mục…</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                <SelectField
                  label="Phòng ban"
                  name="department_id"
                  value={form.department_id}
                  onChange={handleChange}
                  placeholder="-- Chọn phòng ban --"
                  options={(catalog?.departments ?? []).map((d) => ({
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
                  options={(catalog?.positions ?? []).map((p) => ({
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
                    className="w-full mt-2 border bg-white p-3 rounded-2xl outline-none focus:ring-2 focus:ring-brand-teal"
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
                  disabled={loading || readingAvatar || !catalog || !profileReady}
                  className="flex-1 bg-brand hover:bg-brand-dark text-white py-3 rounded-2xl transition disabled:bg-slate-400 flex items-center justify-center gap-2 font-semibold"
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
      <div className="w-10 h-10 rounded-2xl bg-brand-soft text-brand flex items-center justify-center">
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
  maxLength,
}: any) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-semibold text-slate-600">{label}</label>

      <input
        type={type}
        id={name}
        name={name}
        maxLength={maxLength}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        className={`w-full mt-2 border p-3 rounded-2xl outline-none focus:ring-2 focus:ring-brand-teal ${
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
        className="w-full mt-2 border bg-white p-3 rounded-2xl outline-none focus:ring-2 focus:ring-brand-teal"
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
