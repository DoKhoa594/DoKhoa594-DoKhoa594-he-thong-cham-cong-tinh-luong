import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiAlertCircle,
  FiBriefcase,
  FiCalendar,
  FiChevronDown,
  FiClock,
  FiDollarSign,
  FiHome,
  FiList,
  FiLogOut,
  FiRefreshCw,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";

type User = {
  username: string;
  role: string;
};

type DashboardData = {
  date: string;
  month: number;
  year: number;

  employee: {
    total: number;
  };

  attendance: {
    present: number;
    late: number;
    leave: number;
    absent: number;
    total_hours: number;
  };

  payroll: {
    count: number;
    total_basic_salary: number;
    total_allowance: number;
    total_bonus: number;
    total_ot_salary: number;
    total_deduction: number;
    total_final_salary: number;
    total_hours: number;
  };

  today_attendance: any[];

  // hỗ trợ cả backend cũ và backend mới
  payroll_top?: any[];
  daily_payroll?: any[];
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [openEmployeeMenu, setOpenEmployeeMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  const getVNDate = () => {
    const now = new Date();
    const vn = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    return vn.toISOString().split("T")[0];
  };

  const [selectedDate, setSelectedDate] = useState(getVNDate());
  const [month, setMonth] = useState(6);
  const [year, setYear] = useState(2026);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  useEffect(() => {
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
  }, [navigate]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const res = await axios.get("http://localhost:5000/api/dashboard", {
        params: {
          date: selectedDate,
          month,
          year,
        },
      });

      setDashboard(res.data);
    } catch (error) {
      console.log(error);
      toast.error("Không tải được dữ liệu tổng quan");
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (value: number) => {
    return Number(value || 0).toLocaleString("vi-VN") + " ₫";
  };

  const formatHours = (value: number) => {
    if (!value) return "--";

    const hours = Math.floor(Number(value || 0));
    const minutes = Math.round((Number(value || 0) - hours) * 60);

    return `${hours} giờ ${minutes} phút`;
  };

  const getStatusText = (status: string) => {
    if (status === "present") return "Đi làm";
    if (status === "late") return "Đi trễ";
    if (status === "leave") return "Nghỉ phép";
    return "Vắng";
  };

  const getStatusClass = (status: string) => {
    if (status === "present") return "bg-green-100 text-green-700";
    if (status === "late") return "bg-yellow-100 text-yellow-700";
    if (status === "leave") return "bg-purple-100 text-purple-700";
    return "bg-red-100 text-red-700";
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  const dailyPayroll = dashboard?.daily_payroll || dashboard?.payroll_top || [];

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
            className="px-4 py-3 bg-white text-blue-700 rounded-xl text-left font-semibold transition flex items-center gap-2 shadow"
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
              className="px-4 py-3 hover:bg-white/10 rounded-xl w-full text-left transition flex items-center justify-between"
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
            <h1 className="text-3xl font-bold text-slate-800">Tổng quan</h1>
            <p className="text-slate-500 mt-1">
              Theo dõi chấm công, nhân viên và bảng lương
            </p>
          </div>

          <div className="flex gap-3">
            <div className="relative">
              <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-11 pr-4 py-3 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>

            <input
              type="number"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="border px-4 py-3 rounded-2xl shadow-sm w-24 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tháng"
            />

            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border px-4 py-3 rounded-2xl shadow-sm w-28 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Năm"
            />

            <button
              onClick={fetchDashboard}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 font-semibold transition"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
              Xem
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl shadow-sm border p-12 text-center text-slate-400">
            Đang tải dữ liệu...
          </div>
        ) : (
          <div className="h-[calc(100vh-120px)] overflow-auto pr-1">
            {/* SUMMARY */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <SummaryCard
                title="Tổng nhân viên"
                value={dashboard?.employee.total || 0}
                icon={<FiUsers />}
                color="from-blue-500 to-blue-700"
              />

              <SummaryCard
                title="Đi làm"
                value={dashboard?.attendance.present || 0}
                icon={<FiUsers />}
                color="from-green-500 to-emerald-600"
              />

              <SummaryCard
                title="Đi trễ"
                value={dashboard?.attendance.late || 0}
                icon={<FiClock />}
                color="from-yellow-500 to-orange-500"
              />

              <SummaryCard
                title="Nghỉ phép"
                value={dashboard?.attendance.leave || 0}
                icon={<FiBriefcase />}
                color="from-purple-500 to-indigo-600"
              />

              <SummaryCard
                title="Vắng"
                value={dashboard?.attendance.absent || 0}
                icon={<FiAlertCircle />}
                color="from-red-500 to-rose-600"
              />
            </div>

            {/* PAYROLL MONEY */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <MoneyCard
                title="Tổng lương cơ bản"
                value={formatMoney(dashboard?.payroll.total_basic_salary || 0)}
              />

              <MoneyCard
                title="Tổng phụ cấp tháng"
                value={formatMoney(dashboard?.payroll.total_allowance || 0)}
              />

              <MoneyCard
                title="Tổng thưởng tháng"
                value={formatMoney(dashboard?.payroll.total_bonus || 0)}
              />

              <MoneyCard
                title="Tổng thực nhận tháng"
                value={formatMoney(dashboard?.payroll.total_final_salary || 0)}
                highlight
              />
            </div>

            {/* HOURS */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-3xl shadow-sm border p-6">
                <p className="text-sm text-slate-500">
                  Tổng giờ làm trong ngày
                </p>

                <h2 className="text-4xl font-bold text-blue-600 mt-3">
                  {formatHours(dashboard?.attendance.total_hours || 0)}
                </h2>

                <p className="text-slate-400 mt-2">Ngày {dashboard?.date}</p>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border p-6">
                <p className="text-sm text-slate-500">Tổng giờ công tháng</p>

                <h2 className="text-4xl font-bold text-green-600 mt-3">
                  {formatHours(dashboard?.payroll.total_hours || 0)}
                </h2>

                <p className="text-slate-400 mt-2">
                  Tháng {dashboard?.month}/{dashboard?.year}
                </p>
              </div>
            </div>

            {/* TABLES */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* ATTENDANCE TABLE */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-5 border-b">
                  <h2 className="text-xl font-bold text-slate-800">
                    Chấm công trong ngày
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    Danh sách trạng thái nhân viên theo ngày đã chọn
                  </p>
                </div>

                <div className="overflow-auto">
                  <table className="w-full">
                    <thead className="bg-blue-600 text-white">
                      <tr>
                        <th className="p-4 text-left">Mã NV</th>
                        <th className="p-4 text-left">Họ tên</th>
                        <th className="p-4 text-center">Check in</th>
                        <th className="p-4 text-center">Trạng thái</th>
                      </tr>
                    </thead>

                    <tbody>
                      {dashboard?.today_attendance?.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="text-center p-10 text-slate-400"
                          >
                            Không có dữ liệu
                          </td>
                        </tr>
                      ) : (
                        dashboard?.today_attendance?.slice(0, 8).map((item) => (
                          <tr
                            key={item.employee_id}
                            className="border-b hover:bg-slate-50 transition"
                          >
                            <td className="p-4 font-semibold">
                              {item.code || item.employee_id}
                            </td>

                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                  {item.name?.charAt(0)?.toUpperCase() || "?"}
                                </div>

                                <span className="font-bold text-slate-800">
                                  {item.name || "NO NAME"}
                                </span>
                              </div>
                            </td>

                            <td className="p-4 text-center font-semibold text-slate-700">
                              {item.check_in || "--"}
                            </td>

                            <td className="p-4 text-center">
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusClass(
                                  item.final_status,
                                )}`}
                              >
                                {getStatusText(item.final_status)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* DAILY PAYROLL TABLE */}
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-5 border-b">
                  <h2 className="text-xl font-bold text-slate-800">
                    Bảng lương trong ngày
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    Lương tạm tính theo ngày hoặc dữ liệu bảng lương hiện có
                  </p>
                </div>

                <div className="overflow-auto">
                  <table className="w-full">
                    <thead className="bg-blue-600 text-white">
                      <tr>
                        <th className="p-4 text-left">Mã NV</th>
                        <th className="p-4 text-left">Họ tên</th>
                        <th className="p-4 text-center">Tổng giờ</th>
                        <th className="p-4 text-center">Lương</th>
                      </tr>
                    </thead>

                    <tbody>
                      {dailyPayroll.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="text-center p-10 text-slate-400"
                          >
                            Chưa có dữ liệu bảng lương
                          </td>
                        </tr>
                      ) : (
                        dailyPayroll.slice(0, 8).map((item: any) => (
                          <tr
                            key={item.employee_id || item.id}
                            className="border-b hover:bg-slate-50 transition"
                          >
                            <td className="p-4 font-semibold">
                              {item.code || item.employee_id}
                            </td>

                            <td className="p-4 font-bold text-slate-800">
                              {item.name || "NO NAME"}
                            </td>

                            <td className="p-4 text-center font-semibold text-blue-600">
                              {formatHours(Number(item.total_hours || 0))}
                            </td>

                            <td className="p-4 text-center font-bold text-green-600">
                              {formatMoney(
                                Number(
                                  item.daily_salary || item.final_salary || 0,
                                ),
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SummaryCard({ title, value, icon, color }: any) {
  return (
    <div
      className={`bg-gradient-to-r ${color} text-white rounded-3xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90">{title}</p>
          <h2 className="text-4xl font-bold mt-2">{value}</h2>
        </div>

        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

function MoneyCard({ title, value, highlight }: any) {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border hover:shadow-md transition">
      <p className="text-sm text-slate-500">{title}</p>

      <h2
        className={`text-2xl font-bold mt-2 ${
          highlight ? "text-green-600" : "text-slate-800"
        }`}
      >
        {value}
      </h2>
    </div>
  );
}
