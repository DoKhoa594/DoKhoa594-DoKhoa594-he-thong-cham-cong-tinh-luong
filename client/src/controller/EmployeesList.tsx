import AdminSidebar, { adminLayout, adminMain } from "./AdminSidebar";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiSearch,
  FiUsers,
  FiUserPlus,
  FiEdit3,
  FiKey,
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

};

type User = {
  username: string;
  role: string;
};

export default function EmployeesList() {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState<Employee | null>(null);

  const [loading, setLoading] = useState(false);

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
    <div className={adminLayout}>
      <AdminSidebar username={user.username} onLogout={handleLogout} employeesOpen />

      <main className={adminMain}>
        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
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
            className="bg-brand hover:bg-brand-dark text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 font-semibold transition"
          >
            <FiUserPlus /> Thêm nhân viên
          </button>
        </div>

        {/* SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border">
            <p className="text-sm text-slate-500">Tổng nhân viên</p>
            <h2 className="text-3xl font-bold text-brand mt-1">
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

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 min-w-0">
          {/* LEFT LIST */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col min-h-0 overflow-hidden">
            <div className="p-5 border-b">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-slate-800">Nhân viên</h2>

                <span className="text-sm bg-brand-soft text-brand px-3 py-1 rounded-full font-semibold">
                  {employees.length}
                </span>
              </div>

              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Tìm tên, mã NV, phòng ban..."
                  className="w-full pl-11 pr-4 py-3 border rounded-2xl outline-none focus:ring-2 focus:ring-brand-teal focus:border-brand-teal transition"
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
                    }}
                    className={`p-4 rounded-2xl mb-3 cursor-pointer border transition hover:shadow-md hover:-translate-y-0.5
                    ${
                      selected?.code === e.code
                        ? "bg-brand text-white border-brand shadow-md"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center font-bold
                        ${
                          selected?.code === e.code
                            ? "bg-white text-brand"
                            : "bg-brand-soft text-brand"
                        }`}
                      >
                        {getInitial(e.name)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{e.name}</p>

                        <p
                          className={`text-xs mt-1 truncate ${
                            selected?.code === e.code
                              ? "text-brand-soft"
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
                          ? "text-brand-soft"
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
          <section className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 h-full overflow-hidden flex flex-col min-h-0">
            {selected ? (
              <>
                <div className="p-6 border-b bg-brand-navy text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white text-brand rounded-2xl flex items-center justify-center text-2xl font-bold shadow">
                        {getInitial(selected.name)}
                      </div>

                      <div>
                        <h2 className="text-2xl font-bold">{selected.name}</h2>
                        <p className="text-brand-soft mt-1">
                          {selected.code} •{" "}
                          {selected.department || "Chưa có phòng ban"}
                        </p>

                        <div className="flex flex-wrap gap-3 mt-3 text-sm text-brand-soft">
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
                        onClick={() => navigate(`/admin/accounts?code=${encodeURIComponent(selected.code)}`)}
                        className="flex items-center gap-2 rounded-xl border border-white/30 px-4 py-2 font-semibold text-white hover:bg-white/10"
                      >
                        <FiKey /> Tài khoản
                      </button>

                      <button
                        onClick={() =>
                          navigate(`/admin/employees/edit/${selected.code}`)
                        }
                        className="bg-white text-brand-dark hover:bg-brand-soft px-4 py-2 rounded-xl shadow flex items-center gap-2 font-semibold transition"
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
