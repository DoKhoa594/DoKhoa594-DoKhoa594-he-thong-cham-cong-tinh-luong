import { leaveLabels } from "../page/attendanceData";
import AdminSidebar, { adminLayout, adminMain } from "./AdminSidebar";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiSearch,
  FiXCircle,
  FiBriefcase,
} from "react-icons/fi";

type User = {
  username: string;
  role: string;
};

type Attendance = {
  attendance_id: number;
  employee_id: number;
  employee_name: string;
  work_date: string;
  check_in: string;
  check_out: string;
  status: string;
  reason?: string;
  total_hours: number;
  leave_status?: "pending" | "approved" | "rejected" | null;
};

export default function AttendancePage() {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const [filterStatus, setFilterStatus] = useState("all");
  const [keyword, setKeyword] = useState("");

  const getVNDate = () => {
    const now = new Date();
    const vn = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    return vn.toISOString().split("T")[0];
  };

  const [selectedDate, setSelectedDate] = useState(getVNDate());
  const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);

  const [summary, setSummary] = useState({
    present: 0,
    late: 0,
    absent: 0,
    leave: 0,
  });

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
    fetchAttendance();
  }, [selectedDate]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);

      const res = await axios.get("http://localhost:5000/api/attendance", {
        params: { date: selectedDate },
      });

      setAttendanceList(
        Array.isArray(res.data.attendance) ? res.data.attendance : [],
      );

      setSummary({
        present: res.data.summary?.present || 0,
        late: res.data.summary?.late || 0,
        absent: res.data.summary?.absent || 0,
        leave: res.data.summary?.leave || 0,
      });
    } catch (err) {
      console.log(err);
      toast.error("Không tải được dữ liệu chấm công");
    } finally {
      setLoading(false);
    }
  };

  const filteredAttendance = attendanceList.filter((item) => {
    const status = item.status?.trim().toLowerCase() || "absent";

    const matchStatus = filterStatus === "all" || status === filterStatus;

    const kw = keyword.trim().toLowerCase();

    const matchKeyword =
      !kw ||
      item.employee_name?.toLowerCase().includes(kw) ||
      String(item.employee_id || "").includes(kw) ||
      String(item.attendance_id || "").includes(kw);

    return matchStatus && matchKeyword;
  });

  const formatHours = (value: number) => {
    if (!value) return "--";

    const hours = Math.floor(Number(value || 0));
    const minutes = Math.round((Number(value || 0) - hours) * 60);

    return `${hours} giờ ${minutes} phút`;
  };

  const formatDate = (date: string) => {
    if (!date) return "--";
    return date.slice(0, 10);
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

  if (!user) return null;

  return (
    <div className={adminLayout}>
      <AdminSidebar username={user.username} onLogout={handleLogout} />

      <main className={adminMain}>
        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Quản lý chấm công
            </h1>
            <p className="text-slate-500 mt-1">
              Theo dõi tình trạng đi làm, đi trễ và nghỉ phép của nhân viên
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-11 pr-4 py-3 border rounded-2xl outline-none focus:ring-2 focus:ring-brand-teal focus:border-brand-teal shadow-sm"
              />
            </div>

            <button
              onClick={fetchAttendance}
              className="bg-brand hover:bg-brand-dark text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 font-semibold transition"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
              Làm mới
            </button>
          </div>
        </div>

        {/* SUMMARY CARD */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <SummaryCard
            title="Đi làm"
            value={summary.present}
            total={attendanceList.length}
            icon={<FiCheckCircle />}
            color="text-brand"
            active={filterStatus === "present"}
            onClick={() => setFilterStatus("present")}
          />

          <SummaryCard
            title="Đi trễ"
            value={summary.late}
            total={attendanceList.length}
            icon={<FiClock />}
            color="text-amber-800"
            active={filterStatus === "late"}
            onClick={() => setFilterStatus("late")}
          />

          <SummaryCard
            title="Vắng"
            value={summary.absent}
            total={attendanceList.length}
            icon={<FiXCircle />}
            color="text-rose-800"
            active={filterStatus === "absent"}
            onClick={() => setFilterStatus("absent")}
          />

          <SummaryCard
            title="Nghỉ phép"
            value={summary.leave}
            total={attendanceList.length}
            icon={<FiBriefcase />}
            color="text-slate-700"
            active={filterStatus === "leave"}
            onClick={() => setFilterStatus("leave")}
          />
        </div>

        {/* FILTER BAR */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Danh sách chấm công
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Đang hiển thị {filteredAttendance.length}/
                {attendanceList.length} nhân viên
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Tìm tên hoặc mã nhân viên..."
                  className="w-full md:w-72 pl-11 pr-4 py-3 border rounded-2xl outline-none focus:ring-2 focus:ring-brand-teal focus:border-brand-teal transition"
                />
              </div>

              <button
                onClick={() => setFilterStatus("all")}
                className={`px-5 py-3 rounded-2xl font-semibold transition ${
                  filterStatus === "all"
                    ? "bg-brand text-white shadow"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Tất cả
              </button>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <FiRefreshCw size={42} className="animate-spin mb-3" />
              <p className="font-semibold">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <div className="overflow-auto flex-1">
              <table className="w-full min-w-[1200px]">
                <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10">
                  <tr>
                    <th className="p-4 text-left">ID</th>
                    <th className="p-4 text-left">Nhân viên</th>
                    <th className="p-4 text-center">Ngày</th>
                    <th className="p-4 text-center">Check In</th>
                    <th className="p-4 text-center">Check Out</th>
                    <th className="p-4 text-center">Trạng thái</th>
                    <th className="p-4 text-center">Lý do</th>
                    <th className="p-4 text-center">Duyệt nghỉ</th>
                    <th className="p-4 text-center">Tổng giờ</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="text-center p-14 text-slate-400"
                      >
                        Không có dữ liệu chấm công
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map((item) => {
                      const status = item.status || "absent";

                      return (
                        <tr
                          key={`${item.employee_id}-${item.attendance_id}`}
                          className="border-b hover:bg-slate-50 transition"
                        >
                          <td className="p-4 text-slate-500">
                            {item.attendance_id || "--"}
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-full bg-brand-soft text-brand flex items-center justify-center font-bold">
                                {item.employee_name?.charAt(0)?.toUpperCase() ||
                                  "?"}
                              </div>

                              <div>
                                <p className="font-bold text-slate-800">
                                  {item.employee_name || "NO NAME"}
                                </p>

                                <p className="text-xs text-slate-400">
                                  Mã NV: {item.employee_id}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="p-4 text-center text-slate-600">
                            {formatDate(item.work_date)}
                          </td>

                          <td className="p-4 text-center font-semibold text-slate-700">
                            {item.check_in || "--"}
                          </td>

                          <td className="p-4 text-center font-semibold text-slate-700">
                            {item.check_out || "--"}
                          </td>

                          <td className="p-4 text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusClass(
                                status,
                              )}`}
                            >
                              {getStatusText(status)}
                            </span>
                          </td>

                          <td className="p-4 text-center text-slate-500">
                            {item.reason || "--"}
                          </td>

                          <td className="p-4 text-center">
                            {item.leave_status ? (
                              <Link to="/admin/leave" className="font-semibold text-brand hover:underline">
                                {leaveLabels[item.leave_status]}
                              </Link>
                            ) : "—"}
                          </td>

                          <td className="p-4 text-center font-bold text-brand">
                            {formatHours(Number(item.total_hours || 0))}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  total,
  icon,
  color,
  active,
  onClick,
}: any) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer bg-white ${color} rounded-2xl p-5 shadow-sm hover:bg-slate-50 transition border-2 ${
        active ? "border-slate-800" : "border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90">{title}</p>

          <h2 className="text-4xl font-bold mt-2">{value}</h2>

          <p className="text-sm opacity-90 mt-1">
            {value}/{total || 0} nhân viên
          </p>
        </div>

        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl">
          {icon}
        </div>
      </div>
    </div>
  );
}
