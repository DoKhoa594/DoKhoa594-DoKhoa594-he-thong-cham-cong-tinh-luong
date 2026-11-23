import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiBriefcase,
  FiSave,
  FiUser,
  FiUsers,
} from "react-icons/fi";

import AdminSidebar, { adminLayout, adminMain, adminPanel } from "./AdminSidebar";
import { useEmployeeCatalog, type CatalogItem } from "./useEmployeeCatalog";
import AvatarPicker from "./AvatarPicker";
import SuggestionField from "./SuggestionField";
import { birthPlaceOptions, ethnicityOptions, nationalities } from "./employeeLocations";

const fieldClass = "mt-1.5 block w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

type FormType = {
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  name: string;
  code: string;
  dob: string;
  gender: string;
  position_id: string;
  department_id: string;
  idCard: string;
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

const emptyForm: FormType = {
  name: "",
  code: "",
  dob: "",
  gender: "Nam",
  position_id: "",
  department_id: "",
  idCard: "",
  phone: "",
  birthPlace: "",
  ethnicity: "",
  nationality: "",
  email: "",
  basic_salary: "",
  address: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
};

export default function AddEmployee() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const { catalog, error: catalogError, reload: reloadCatalog } = useEmployeeCatalog(user?.role === "admin");

  const [form, setForm] = useState(emptyForm);
  const [codeRequest, setCodeRequest] = useState(0);
  const [codeError, setCodeError] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [readingAvatar, setReadingAvatar] = useState(false);

  useEffect(() => {
    if (!user) return;
    const request = new AbortController();
    axios.get<{ code: string }>("http://localhost:5000/api/employees/next-code", {
      signal: request.signal,
    }).then(({ data }) => {
      if (!request.signal.aborted) setForm(current => ({ ...current, code: data.code }));
    }).catch(() => {
      if (!request.signal.aborted) setCodeError(true);
    });
    return () => request.abort();
  }, [user, codeRequest]);

  const requestCode = () => {
    setCodeError(false);
    setCodeRequest(current => current + 1);
  };

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
    const { name, value } = e.target;
    setForm(current => ({ ...current, [name]: value }));
  };

  const calculateAge = (dob: string) => {
    if (!dob) return "";

    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
    });
    if (dob > today) return "";
    const years = Number(today.slice(0, 4)) - Number(dob.slice(0, 4));
    return years - Number(today.slice(5) < dob.slice(5));
  };

  const formatSalary = (value: string) => {
    if (!value) return "";
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const validate = () => {
    if (!form.name.trim()) return "Vui lòng nhập tên";
    if (!/^\d{9}$/.test(form.code)) return "Đang chờ mã nhân viên";
    if (form.dob && calculateAge(form.dob) === "") return "Ngày sinh không được ở tương lai";
    if (form.idCard.trim() && !/^(?:\d{9}|\d{12})$/.test(form.idCard.trim())) {
      return "CMND hoặc CCCD phải có 9 hoặc 12 chữ số";
    }
    if (form.emergency_contact_name.trim() || form.emergency_contact_phone.trim()) {
      if (!form.emergency_contact_name.trim() || !/^\d{9,11}$/.test(form.emergency_contact_phone.trim())) {
        return "Vui lòng nhập tên và số điện thoại liên hệ khẩn cấp hợp lệ";
      }
    }
    if (!catalog?.positions.some(item => String(item.id) === form.position_id)) return "Vui lòng chọn chức vụ";
    if (!catalog?.departments.some(item => String(item.id) === form.department_id)) return "Vui lòng chọn phòng ban";
    if (!form.basic_salary) return "Vui lòng nhập lương cơ bản";

    if (!/^[0-9]{9,11}$/.test(form.phone.trim())) {
      return "Số điện thoại không hợp lệ";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return "Email không hợp lệ";
    }

    return null;
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading || readingAvatar) return;
    const error = validate();
    if (error) return toast.error(error);

    const newEmployee = {
      ...Object.fromEntries(Object.entries(form).map(([key, value]) =>
        [key, value.trim()],
      )),
      avatar,
      auto_code: true,
      age: calculateAge(form.dob),
    };

    try {
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/api/create-employee",
        newEmployee,
      );

      toast.success(`Đã thêm nhân viên với mã ${res.data.code}`);

      setForm(emptyForm);
      setAvatar(null);
      requestCode();
    } catch (err: any) {
      if (err?.response?.status === 409) reloadCatalog();
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
    <div className={adminLayout}>
      <AdminSidebar username={user.username} onLogout={handleLogout} employeesOpen />
      <main className={adminMain}>
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Thêm nhân viên</h1>
            <p className="mt-1 text-sm text-slate-600">Tạo hồ sơ nhân viên mới</p>
          </div>
          <Link to="/admin/employees/list" className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold hover:bg-slate-100">
            <FiArrowLeft /> Danh sách nhân viên
          </Link>
        </header>

        <form onSubmit={handleSave} noValidate className="grid gap-4 xl:grid-cols-2">
          <section className={`${adminPanel} p-4 sm:p-5`}>
            <SectionTitle title="Thông tin cá nhân" icon={<FiUser />} />

            <AvatarPicker value={avatar} onChange={setAvatar} reading={readingAvatar}
              onReadingChange={setReadingAvatar} disabled={loading} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Họ và tên"
                name="name"
                maxLength={150}
                autoComplete="name"
                value={form.name}
                onChange={handleChange}
              />

              <div>
                <label htmlFor="code" className="text-sm font-semibold text-slate-600">Mã nhân viên</label>
                <input id="code" name="code" readOnly value={form.code}
                  aria-describedby="employee-code-help" placeholder="Đang tạo mã…"
                  className={`${fieldClass} bg-slate-50 tabular-nums`} />
                <div id="employee-code-help" className="mt-1 text-xs text-slate-600" aria-live="polite">
                  {codeError ? (
                    <button type="button" onClick={requestCode} className="font-semibold text-brand underline">
                      Chưa tạo được mã. Thử lại
                    </button>
                  ) : "Mã 9 chữ số do hệ thống cấp."}
                </div>
              </div>

              <Field
                label="CMND / CCCD"
                name="idCard"
                maxLength={12}
                value={form.idCard}
                onChange={handleChange}
              />

              <Field
                label="Số điện thoại"
                name="phone"
                type="tel"
                maxLength={11}
                autoComplete="tel"
                value={form.phone}
                onChange={handleChange}
              />

              <Field
                label="Email"
                name="email"
                maxLength={254}
                autoComplete="email"
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
              {form.dob && calculateAge(form.dob) !== "" && (
                <p className="text-sm text-slate-600 md:col-span-2">Tuổi {calculateAge(form.dob)}</p>
              )}

              <SelectField
                label="Giới tính"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                options={["Nam", "Nữ"]}
              />

              <Field label="Địa chỉ hiện tại" name="address" value={form.address}
                onChange={handleChange} maxLength={255} autoComplete="street-address" />
            </div>
          </section>
          <div className="grid content-start gap-4">
            <section className={`${adminPanel} p-4 sm:p-5`}>
              <SectionTitle
                title="Thông tin công việc"
                icon={<FiBriefcase />}
              />

              {catalogError ? (
                <p role="alert" className="mb-3 text-sm text-rose-800">
                  Không tải được phòng ban và chức vụ.{" "}
                  <button type="button" onClick={reloadCatalog} className="font-semibold underline">Thử lại</button>
                </p>
              ) : !catalog ? (
                <p role="status" className="mb-3 text-sm text-slate-600">Đang tải danh mục…</p>
              ) : (!catalog.departments.length || !catalog.positions.length) && (
                <p className="mb-3 text-sm text-slate-600">
                  Cần có ít nhất một phòng ban và một chức vụ.{" "}
                  <Link to="/admin/configuration" className="font-semibold text-brand underline">Mở Cấu hình</Link>
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                  label="Phòng ban"
                  name="department_id"
                  value={form.department_id}
                  onChange={handleChange}
                  options={catalog?.departments ?? []}
                  disabled={!catalog}
                  placeholder="-- Chọn phòng ban --"
                />

                <SelectField
                  label="Chức vụ"
                  name="position_id"
                  value={form.position_id}
                  onChange={handleChange}
                  options={catalog?.positions ?? []}
                  disabled={!catalog}
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

                      setForm(current => ({ ...current, basic_salary: rawValue }));
                    }}
                    className={fieldClass}
                    placeholder="10.000.000"
                  />
                </div>

                <p className="self-center text-sm text-slate-600">Tài khoản dùng mã nhân viên. Mật khẩu ban đầu là <strong>1</strong>.</p>
              </div>
            </section>
            <section className={`${adminPanel} p-4 sm:p-5`}>
              <SectionTitle title="Thông tin thêm" icon={<FiUsers />} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SuggestionField
                  label="Nơi sinh"
                  name="birthPlace"
                  value={form.birthPlace}
                  options={birthPlaceOptions}
                  maxLength={255}
                  onChange={value => setForm(current => ({ ...current, birthPlace: value }))}
                />

                <SuggestionField
                  label="Dân tộc"
                  name="ethnicity"
                  value={form.ethnicity}
                  options={ethnicityOptions}
                  onChange={value => setForm(current => ({ ...current, ethnicity: value }))}
                />

                <SuggestionField
                  label="Quốc tịch"
                  name="nationality"
                  value={form.nationality}
                  options={nationalities}
                  onChange={value => setForm(current => ({ ...current, nationality: value }))}
                />
              </div>
            </section>
            <section className={`${adminPanel} p-4 sm:p-5`}>
              <SectionTitle title="Liên hệ khẩn cấp" icon={<FiUsers />} />
              <p className="mb-3 text-sm text-slate-500">Không bắt buộc. Nếu điền, hãy nhập cả họ tên và số điện thoại.</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Họ tên người liên hệ" name="emergency_contact_name"
                  value={form.emergency_contact_name} onChange={handleChange} maxLength={150} />
                <Field label="Số điện thoại người liên hệ" name="emergency_contact_phone"
                  value={form.emergency_contact_phone} onChange={handleChange} type="tel" maxLength={11} />
              </div>
            </section>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4 xl:col-span-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold hover:bg-slate-100"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={loading || readingAvatar || !form.code || !catalog}
              className="flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              <FiSave />
              {loading ? "Đang lưu..." : "Lưu nhân viên"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function SectionTitle({ title, icon }: any) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="size-9 rounded-lg bg-brand-soft text-brand flex items-center justify-center">
        {icon}
      </div>

      <h3 className="font-semibold">{title}</h3>
    </div>
  );
}

function Field({ label, name, value, onChange, type = "text", maxLength, autoComplete }: any) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-semibold text-slate-600">{label}</label>

      <input
        type={type}
        maxLength={maxLength}
        autoComplete={autoComplete}
        id={name}
        name={name}
        value={value || ""}
        onChange={onChange}
        className={fieldClass}
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
  disabled,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  options: (string | CatalogItem)[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-semibold text-slate-600">{label}</label>

      <select
        disabled={disabled}
        id={name}
        name={name}
        value={value || ""}
        onChange={onChange}
        className={fieldClass}
      >
        {placeholder && <option value="">{placeholder}</option>}

        {options.map(item => {
          const value = typeof item === "string" ? item : String(item.id);
          const label = typeof item === "string" ? item : item.name;
          return <option key={value} value={value}>{label}</option>;
        })}
      </select>
    </div>
  );
}
