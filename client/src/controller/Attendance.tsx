import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiLogOut,
  FiRefreshCw,
  FiSearch,
  FiUserPlus,
  FiUsers,
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
  const [openEmployeeMenu, setOpenEmployeeMenu] = useState(false);
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

  const approveLeave = async (id: number) => {
    try {
      await axios.put(`http://localhost:5000/api/attendance/approve/${id}`);
      toast.success("Đã duyệt nghỉ phép");
      fetchAttendance();
    } catch (err) {
      console.log(err);
      toast.error("Duyệt nghỉ phép thất bại");
    }
  };

  const rejectLeave = async (id: number) => {
    try {
      await axios.put(`http://localhost:5000/api/attendance/reject/${id}`);
      toast.success("Đã từ chối nghỉ phép");
      fetchAttendance();
    } catch (err) {
      console.log(err);
      toast.error("Từ chối nghỉ phép thất bại");
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
            className="px-4 py-3 bg-white text-blue-700 rounded-xl text-left font-semibold transition flex items-center gap-2"
          >
            <FiCalendar /> Chấm công
          </button>

          <div>
            <button
              onClick={() => setOpenEmployeeMenu(!openEmployeeMenu)}
              className="px-4 py-3 hover:bg-white/10 rounded-xl w-full text-left transition"
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
                  className="px-4 py-2 hover:bg-white/10 rounded-xl text-sm text-left flex items-center gap-2"
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
                className="pl-11 pr-4 py-3 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              />
            </div>

            <button
              onClick={fetchAttendance}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 font-semibold transition"
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
            color="from-green-500 to-emerald-600"
            active={filterStatus === "present"}
            onClick={() => setFilterStatus("present")}
          />

          <SummaryCard
            title="Đi trễ"
            value={summary.late}
            total={attendanceList.length}
            icon={<FiClock />}
            color="from-yellow-500 to-orange-500"
            active={filterStatus === "late"}
            onClick={() => setFilterStatus("late")}
          />

          <SummaryCard
            title="Vắng"
            value={summary.absent}
            total={attendanceList.length}
            icon={<FiXCircle />}
            color="from-red-500 to-rose-600"
            active={filterStatus === "absent"}
            onClick={() => setFilterStatus("absent")}
          />

          <SummaryCard
            title="Nghỉ phép"
            value={summary.leave}
            total={attendanceList.length}
            icon={<FiBriefcase />}
            color="from-purple-500 to-indigo-600"
            active={filterStatus === "leave"}
            onClick={() => setFilterStatus("leave")}
          />
        </div>

        {/* FILTER BAR */}
        <div className="bg-white rounded-3xl shadow-sm border p-5 mb-6">
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
                  className="w-full md:w-72 pl-11 pr-4 py-3 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <button
                onClick={() => setFilterStatus("all")}
                className={`px-5 py-3 rounded-2xl font-semibold transition ${
                  filterStatus === "all"
                    ? "bg-blue-600 text-white shadow"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Tất cả
              </button>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-3xl shadow-sm border overflow-hidden h-[calc(100vh-365px)] flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <FiRefreshCw size={42} className="animate-spin mb-3" />
              <p className="font-semibold">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <div className="overflow-auto flex-1">
              <table className="w-full min-w-[1200px]">
                <thead className="bg-blue-600 text-white sticky top-0 z-10">
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
                              <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
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
                            {status === "leave" &&
                            item.leave_status === "pending" ? (
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() =>
                                    approveLeave(item.attendance_id)
                                  }
                                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-xl text-sm font-semibold transition"
                                >
                                  Duyệt
                                </button>

                                <button
                                  onClick={() =>
                                    rejectLeave(item.attendance_id)
                                  }
                                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-xl text-sm font-semibold transition"
                                >
                                  Từ chối
                                </button>
                              </div>
                            ) : status === "leave" ? (
                              <div className="flex gap-2 justify-center items-center">
                                {item.leave_status === "approved" ? (
                                  <>
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                                      Đã duyệt
                                    </span>

                                    <button
                                      onClick={() =>
                                        rejectLeave(item.attendance_id)
                                      }
                                      className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-xl text-sm font-semibold transition"
                                    >
                                      Đổi từ chối
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                                      Đã từ chối
                                    </span>

                                    <button
                                      onClick={() =>
                                        approveLeave(item.attendance_id)
                                      }
                                      className="bg-green-50 hover:bg-green-100 text-green-600 px-3 py-2 rounded-xl text-sm font-semibold transition"
                                    >
                                      Đổi duyệt
                                    </button>
                                  </>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">--</span>
                            )}
                          </td>

                          <td className="p-4 text-center font-bold text-blue-600">
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
      className={`cursor-pointer bg-gradient-to-r ${color} text-white rounded-3xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition border-2 ${
        active ? "border-slate-800" : "border-transparent"
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

        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">
          {icon}
        </div>
      </div>
    </div>
  );
}
