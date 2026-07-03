import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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
  payroll_top: any[];
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
    if (status === "present") return "bg-green-500";
    if (status === "late") return "bg-yellow-500";
    if (status === "leave") return "bg-purple-500";
    return "bg-red-500";
  };

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
    } finally {
      setLoading(false);
    }
  };

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

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-blue-700 text-white p-5 flex flex-col">
        <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>

        <div className="flex items-center gap-3 mb-6 p-2 rounded bg-blue-600">
          <div className="w-10 h-10 bg-white text-blue-700 flex items-center justify-center rounded-full font-bold">
            {user?.username?.charAt(0)?.toUpperCase() || "?"}
          </div>

          <div>
            <p className="font-semibold">{user?.username}</p>
            <p className="text-xs text-blue-200">Administrator</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          <button
            onClick={() => navigate("/admin")}
            className="text-left p-2 bg-blue-600 rounded"
          >
            Tổng quan
          </button>

          <button
            onClick={() => navigate("/admin/attendance")}
            className="text-left p-2 hover:bg-blue-600 rounded"
          >
            Chấm công
          </button>

          <div>
            <button
              onClick={() => setOpenEmployeeMenu(!openEmployeeMenu)}
              className="text-left p-2 hover:bg-blue-600 rounded w-full"
            >
              Nhân viên ▾
            </button>

            {openEmployeeMenu && (
              <div className="ml-4 mt-2 flex flex-col gap-2">
                <button
                  onClick={() => navigate("/admin/employees/add")}
                  className="text-left p-2 bg-blue-600 rounded text-sm"
                >
                  ➕ Thêm nhân viên
                </button>

                <button
                  onClick={() => navigate("/admin/employees/list")}
                  className="text-left p-2 bg-blue-600 rounded text-sm"
                >
                  📋 Danh sách nhân viên
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate("/admin/payroll")}
            className="text-left p-2 hover:bg-blue-600 rounded"
          >
            Bảng lương
          </button>
        </nav>

        <button
          onClick={handleLogout}
          className="mt-auto bg-red-500 py-2 rounded"
        >
          Đăng xuất
        </button>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Tổng quan</h1>
            <p className="text-gray-500 mt-1">
              Theo dõi chấm công và bảng lương
            </p>
          </div>

          <div className="flex gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border px-4 py-2 rounded-xl shadow-sm"
            />

            <input
              type="number"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="border px-4 py-2 rounded-xl shadow-sm w-24"
              placeholder="Tháng"
            />

            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border px-4 py-2 rounded-xl shadow-sm w-28"
              placeholder="Năm"
            />

            <button
              onClick={fetchDashboard}
              className="bg-blue-600 text-white px-5 py-2 rounded-xl shadow"
            >
              Xem
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            Đang tải dữ liệu...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-5 gap-4 mb-6">
              <SummaryCard
                title="Tổng nhân viên"
                value={dashboard?.employee.total || 0}
                color="bg-blue-500"
              />
              <SummaryCard
                title="Đi làm"
                value={dashboard?.attendance.present || 0}
                color="bg-green-500"
              />
              <SummaryCard
                title="Đi trễ"
                value={dashboard?.attendance.late || 0}
                color="bg-yellow-500"
              />
              <SummaryCard
                title="Nghỉ phép"
                value={dashboard?.attendance.leave || 0}
                color="bg-purple-500"
              />
              <SummaryCard
                title="Vắng"
                value={dashboard?.attendance.absent || 0}
                color="bg-red-500"
              />
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <MoneyCard
                title="Tổng lương cơ bản"
                value={formatMoney(dashboard?.payroll.total_basic_salary || 0)}
              />
              <MoneyCard
                title="Tổng phụ cấp cả tháng"
                value={formatMoney(dashboard?.payroll.total_allowance || 0)}
              />
              <MoneyCard
                title="Tổng thưởng cả tháng"
                value={formatMoney(dashboard?.payroll.total_bonus || 0)}
              />
              <MoneyCard
                title="Tổng thực nhận cả tháng"
                value={formatMoney(dashboard?.payroll.total_final_salary || 0)}
              />
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-2xl shadow p-5">
                <h2 className="text-xl font-semibold mb-2">
                  Tổng giờ làm trong ngày
                </h2>
                <p className="text-4xl font-bold text-blue-600">
                  {formatHours(dashboard?.attendance.total_hours || 0)}
                </p>
                <p className="text-gray-500 mt-2">Ngày {dashboard?.date}</p>
              </div>

              <div className="bg-white rounded-2xl shadow p-5">
                <h2 className="text-xl font-semibold mb-2">
                  Tổng giờ công tháng
                </h2>
                <p className="text-4xl font-bold text-green-600">
                  {formatHours(dashboard?.payroll.total_hours || 0)}
                </p>
                <p className="text-gray-500 mt-2">
                  Tháng {dashboard?.month}/{dashboard?.year}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="p-5 border-b">
                  <h2 className="text-xl font-semibold">
                    Chấm công trong ngày
                  </h2>
                </div>

                <div className="overflow-auto">
                  <table className="w-full">
                    <thead className="bg-blue-600 text-white">
                      <tr>
                        <th className="p-3 text-left">Mã NV</th>
                        <th className="p-3 text-left">Họ tên</th>
                        <th className="p-3 text-center">Check in</th>
                        <th className="p-3 text-center">Trạng thái</th>
                      </tr>
                    </thead>

                    <tbody>
                      {dashboard?.today_attendance?.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="text-center p-8 text-gray-400"
                          >
                            Không có dữ liệu
                          </td>
                        </tr>
                      ) : (
                        dashboard?.today_attendance?.slice(0, 8).map((item) => (
                          <tr
                            key={item.employee_id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="p-3">{item.code}</td>
                            <td className="p-3">{item.name}</td>
                            <td className="p-3 text-center">
                              {item.check_in || "--"}
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`${getStatusClass(
                                  item.final_status,
                                )} text-white px-3 py-1 rounded-full text-sm`}
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

              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="p-5 border-b">
                  <h2 className="text-xl font-semibold">Top lương tháng</h2>
                </div>

                <div className="overflow-auto">
                  <table className="w-full">
                    <thead className="bg-blue-600 text-white">
                      <tr>
                        <th className="p-3 text-left">Mã NV</th>
                        <th className="p-3 text-left">Họ tên</th>
                        <th className="p-3 text-center">Tổng giờ</th>
                        <th className="p-3 text-center">Thực nhận</th>
                      </tr>
                    </thead>

                    <tbody>
                      {dashboard?.payroll_top?.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="text-center p-8 text-gray-400"
                          >
                            Chưa có dữ liệu bảng lương
                          </td>
                        </tr>
                      ) : (
                        dashboard?.payroll_top?.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="p-3">{item.code}</td>
                            <td className="p-3">{item.name}</td>
                            <td className="p-3 text-center">
                              {formatHours(Number(item.total_hours || 0))}
                            </td>
                            <td className="p-3 text-center font-bold text-green-600">
                              {formatMoney(item.final_salary)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, value, color }: any) {
  return (
    <div
      className={`${color} text-white rounded-2xl p-5 shadow hover:scale-105 transition`}
    >
      <p className="text-sm opacity-90">{title}</p>
      <h2 className="text-4xl font-bold mt-2">{value}</h2>
    </div>
  );
}

function MoneyCard({ title, value }: any) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow">
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="text-2xl font-bold mt-2 text-gray-800">{value}</h2>
    </div>
  );
}
