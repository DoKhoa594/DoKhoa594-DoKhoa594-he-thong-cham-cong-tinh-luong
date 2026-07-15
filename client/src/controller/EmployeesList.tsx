import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiEye,
  FiEyeOff,
  FiSearch,
  FiUsers,
  FiUserPlus,
  FiEdit3,
  FiKey,
  FiLogOut,
  FiBriefcase,
  FiPhone,
  FiMail,
} from "react-icons/fi";
import toast from "react-hot-toast";

type Employee = {
  name: string;
  code: string;

  dob: string;
  age: number;
  gender: string;

  birthPlace: string;
  ethnicity: string;
  nationality: string;

  idCard: string;

  phone: string;
  email: string;

  department: string;
  position: string;

  password: string;
};

type User = {
  username: string;
  role: string;
};

export default function EmployeesList() {
  const navigate = useNavigate();

  const [openEmployeeMenu, setOpenEmployeeMenu] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState<Employee | null>(null);

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ================= AUTH =================
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

  // ================= LOAD EMPLOYEES =================
  useEffect(() => {
    const timer = setTimeout(() => {
      const fetchEmployees = async () => {
        try {
          setLoading(true);

          const res = await axios.get(
            "http://localhost:5000/api/get-employees",
            {
              params: {
                keyword,
                page: 1,
                limit: 50,
              },
            },
          );

          const data = res.data.data || res.data || [];
          setEmployees(data);

          if (!selected && data.length > 0) {
            setSelected(data[0]);
          }
        } catch (err) {
          console.error("Load employees error:", err);
          toast.error("Không tải được danh sách nhân viên");
        } finally {
          setLoading(false);
        }
      };

      fetchEmployees();
    }, 400);

    return () => clearTimeout(timer);
  }, [keyword]);

  const handleResetPassword = async () => {
    if (!selected) return;

    const ok = window.confirm(
      `Bạn có chắc muốn reset mật khẩu của ${selected.name} về mặc định không?`,
    );

    if (!ok) return;

    try {
      await axios.put(
        `http://localhost:5000/api/reset-password/${selected.code}`,
      );

      setSelected({
        ...selected,
        password: "123456",
      });

      toast.success(
        `Đã reset mật khẩu cho ${selected.name}. Mật khẩu mới: 123456`,
        {
          duration: 4000,
        },
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Reset mật khẩu thất bại");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  const getInitial = (name?: string) => {
    return name?.charAt(0)?.toUpperCase() || "?";
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
            className="px-4 py-3 hover:bg-white/10 rounded-xl text-left transition"
          >
            Tổng quan
          </button>

          <button
            onClick={() => navigate("/admin/attendance")}
            className="px-4 py-3 hover:bg-white/10 rounded-xl text-left transition"
          >
            Chấm công
          </button>

          <div>
            <button
              onClick={() => setOpenEmployeeMenu(!openEmployeeMenu)}
              className="px-4 py-3 bg-white/10 rounded-xl w-full text-left transition"
            >
              Nhân viên ▾
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
                  <FiUsers /> Danh sách nhân viên
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate("/admin/payroll")}
            className="px-4 py-3 hover:bg-white/10 rounded-xl text-left transition"
          >
            Bảng lương
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
              Danh sách nhân viên
            </h1>
            <p className="text-slate-500 mt-1">
              Tra cứu, xem hồ sơ và quản lý thông tin nhân viên
            </p>
          </div>

          <button
            onClick={() => navigate("/admin/employees/add")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 font-semibold transition"
          >
            <FiUserPlus /> Thêm nhân viên
          </button>
        </div>

        {/* SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border">
            <p className="text-sm text-slate-500">Tổng nhân viên</p>
            <h2 className="text-3xl font-bold text-blue-600 mt-1">
              {employees.length}
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border">
            <p className="text-sm text-slate-500">Đang chọn</p>
            <h2 className="text-xl font-bold text-slate-800 mt-2">
              {selected?.name || "Chưa chọn"}
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border">
            <p className="text-sm text-slate-500">Trạng thái</p>
            <h2 className="text-xl font-bold text-green-600 mt-2">
              {loading ? "Đang tải..." : "Sẵn sàng"}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-230px)] min-h-0">
          {/* LEFT LIST */}
          <section className="bg-white rounded-3xl shadow-sm border h-full flex flex-col min-h-0 overflow-hidden">
            <div className="p-5 border-b">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-slate-800">Nhân viên</h2>

                <span className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-semibold">
                  {employees.length}
                </span>
              </div>

              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Tìm tên, mã NV, phòng ban..."
                  className="w-full pl-11 pr-4 py-3 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
              {loading && (
                <div className="p-5 text-center text-slate-400">
                  Đang tải dữ liệu...
                </div>
              )}

              {!loading && employees.length === 0 && (
                <div className="p-6 text-center text-slate-400">
                  Không có nhân viên nào
                </div>
              )}

              {!loading &&
                employees.map((e) => (
                  <div
                    key={e.code}
                    onClick={() => {
                      setSelected(e);
                      setShowPassword(false);
                    }}
                    className={`p-4 rounded-2xl mb-3 cursor-pointer border transition hover:shadow-md hover:-translate-y-0.5
                    ${
                      selected?.code === e.code
                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                        : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center font-bold
                        ${
                          selected?.code === e.code
                            ? "bg-white text-blue-600"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {getInitial(e.name)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{e.name}</p>

                        <p
                          className={`text-xs mt-1 truncate ${
                            selected?.code === e.code
                              ? "text-blue-100"
                              : "text-slate-500"
                          }`}
                        >
                          {e.code} • {e.department || "Chưa có phòng ban"}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`mt-3 flex items-center gap-2 text-xs ${
                        selected?.code === e.code
                          ? "text-blue-100"
                          : "text-slate-400"
                      }`}
                    >
                      <FiBriefcase />
                      <span>{e.position || "Chưa có chức vụ"}</span>
                    </div>
                  </div>
                ))}
            </div>
          </section>

          {/* RIGHT DETAIL */}
          <section className="xl:col-span-2 bg-white rounded-3xl shadow-sm border h-full overflow-hidden flex flex-col min-h-0">
            {selected ? (
              <>
                <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white text-blue-600 rounded-2xl flex items-center justify-center text-2xl font-bold shadow">
                        {getInitial(selected.name)}
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold">{selected.name}</h2>
                        <p className="text-blue-100 mt-1">
                          {selected.code} •{" "}
                          {selected.department || "Chưa có phòng ban"}
                        </p>

                        <div className="flex flex-wrap gap-3 mt-3 text-sm text-blue-100">
                          <span className="flex items-center gap-1">
                            <FiPhone /> {selected.phone || "Chưa có SĐT"}
                          </span>

                          <span className="flex items-center gap-1">
                            <FiMail /> {selected.email || "Chưa có email"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleResetPassword}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl shadow flex items-center gap-2 transition"
                      >
                        <FiKey /> Reset
                      </button>

                      <button
                        onClick={() =>
                          navigate(`/admin/employees/edit/${selected.code}`)
                        }
                        className="bg-white text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl shadow flex items-center gap-2 font-semibold transition"
                      >
                        <FiEdit3 /> Sửa hồ sơ
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">
                    Thông tin cá nhân
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Info label="Họ tên" value={selected.name} />
                    <Info label="Mã nhân viên" value={selected.code} />
                    <Info label="Ngày sinh" value={selected.dob} />
                    <Info label="Tuổi" value={selected.age} />
                    <Info label="Giới tính" value={selected.gender} />
                    <Info label="Nơi sinh" value={selected.birthPlace} />
                    <Info label="Dân tộc" value={selected.ethnicity} />
                    <Info label="Quốc tịch" value={selected.nationality} />
                    <Info label="CMND/CCCD" value={selected.idCard} />
                    <Info label="Số điện thoại" value={selected.phone} />
                    <Info label="Email" value={selected.email} />
                    <Info label="Phòng ban" value={selected.department} />
                    <Info label="Chức vụ" value={selected.position} />

                    <div className="p-5 bg-white rounded-2xl border shadow-sm">
                      <p className="text-xs text-slate-500 mb-2">
                        Password hiện tại
                      </p>

                      <div className="flex items-center justify-between gap-3">
                        <p className="font-bold text-slate-800 break-words">
                          {user.role === "admin"
                            ? showPassword
                              ? selected.password || "Chưa có dữ liệu"
                              : "••••••••"
                            : "Không có quyền"}
                        </p>

                        {user.role === "admin" && (
                          <button
                            onClick={() => setShowPassword(!showPassword)}
                            className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition"
                          >
                            {showPassword ? (
                              <FiEyeOff size={20} />
                            ) : (
                              <FiEye size={20} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                <FiUsers size={60} />
                <p className="mt-4 text-lg font-semibold">
                  Chọn nhân viên để xem chi tiết
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="p-5 bg-white rounded-2xl border shadow-sm hover:shadow-md transition">
      <p className="text-xs text-slate-500 mb-2">{label}</p>

      <p className="font-bold text-slate-800 break-words">
        {value || "Chưa có dữ liệu"}
      </p>
    </div>
  );
}
