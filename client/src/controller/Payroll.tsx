import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

type User = {
  username: string;
  role: string;
};

type Payroll = {
  id: number;

  employee_id: number;
  employee_name: string;

  payroll_month: number;
  payroll_year: number;

  present_days: number;
  late_days: number;
  leave_days: number;
  absent_days: number;

  basic_salary: number;
  deduction: number;
  final_salary: number;
};

export default function PayrollPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);

  const [openEmployeeMenu, setOpenEmployeeMenu] = useState(false);

  const [loading, setLoading] = useState(false);

  const [payrolls, setPayrolls] = useState<Payroll[]>([]);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // =====================================
  // CHECK LOGIN
  // =====================================

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

  // =====================================
  // FETCH PAYROLLS
  // =====================================

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);

      const res = await axios.get("http://localhost:5000/api/payrolls");

      setPayrolls(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // GENERATE PAYROLL
  // =====================================

  const generatePayroll = async (employee_id: number) => {
    try {
      await axios.post("http://localhost:5000/api/payroll/generate", {
        employee_id,
        payroll_month: selectedMonth,
        payroll_year: selectedYear,
      });

      fetchPayrolls();
    } catch (err) {
      console.log(err);
    }
  };

  // =====================================
  // LOGOUT
  // =====================================

  const handleLogout = () => {
    localStorage.removeItem("user");

    localStorage.removeItem("token");

    navigate("/");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* SIDEBAR */}
      <div className="w-64 bg-blue-700 text-white p-5 flex flex-col">
        <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>

        {/* USER */}
        <div className="flex items-center gap-3 mb-6 p-2 rounded bg-blue-600">
          <div className="w-10 h-10 bg-white text-blue-700 flex items-center justify-center rounded-full font-bold">
            {user?.username?.charAt(0)?.toUpperCase() || "?"}
          </div>

          <div>
            <p className="font-semibold">{user?.username}</p>

            <p className="text-xs text-blue-200">Administrator</p>
          </div>
        </div>

        {/* MENU */}
        <nav className="flex flex-col gap-2">
          <button
            onClick={() => navigate("/admin")}
            className="text-left p-2 hover:bg-blue-600 rounded"
          >
            Tổng quan
          </button>

          <button
            onClick={() => navigate("/admin/attendance")}
            className="text-left p-2 hover:bg-blue-600 rounded"
          >
            Chấm công
          </button>

          {/* EMPLOYEE */}
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
            className="text-left p-2 bg-blue-600 rounded"
          >
            Bảng lương
          </button>
        </nav>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          className="mt-auto bg-red-500 py-2 rounded"
        >
          Đăng xuất
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 p-6 overflow-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Quản lý Lương</h1>

            <p className="text-gray-500 mt-1">Quản lý bảng lương nhân viên</p>
          </div>

          <div className="flex gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="border px-4 py-2 rounded-xl shadow-sm"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i} value={i + 1}>
                  Tháng {i + 1}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="border px-4 py-2 rounded-xl shadow-sm w-32"
            />
          </div>
        </div>

        {/* SUMMARY */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <SummaryCard
            title="Tổng Lương"
            value={payrolls.length}
            color="bg-blue-500"
          />

          <SummaryCard
            title="Đi làm"
            value={payrolls.reduce((sum, item) => sum + item.present_days, 0)}
            color="bg-green-500"
          />

          <SummaryCard
            title="Đi trễ"
            value={payrolls.reduce((sum, item) => sum + item.late_days, 0)}
            color="bg-yellow-500"
          />

          <SummaryCard
            title="Nghỉ KP"
            value={payrolls.reduce((sum, item) => sum + item.absent_days, 0)}
            color="bg-red-500"
          />
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="p-5 border-b flex items-center justify-between">
            <h2 className="text-xl font-semibold">Danh sách Payroll</h2>
          </div>

          {loading ? (
            <div className="p-10 text-center">Đang tải dữ liệu...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="p-4 text-left">ID</th>

                  <th className="p-4 text-left">Nhân viên</th>

                  <th className="p-4 text-center">Kỳ lương</th>

                  <th className="p-4 text-center">Đi làm</th>

                  <th className="p-4 text-center">Đi trễ</th>

                  <th className="p-4 text-center">Nghỉ phép</th>

                  <th className="p-4 text-center">Nghỉ KP</th>

                  <th className="p-4 text-center">Lương cơ bản</th>

                  <th className="p-4 text-center">Khấu trừ</th>

                  <th className="p-4 text-center">Thực lãnh</th>

                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {payrolls.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center p-10 text-gray-400">
                      Chưa có payroll
                    </td>
                  </tr>
                ) : (
                  payrolls.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">{item.id}</td>

                      <td className="p-4 font-semibold">
                        {item.employee_name}
                      </td>

                      <td className="p-4 text-center">
                        {item.payroll_month}/{item.payroll_year}
                      </td>

                      <td className="p-4 text-center text-green-600 font-bold">
                        {item.present_days}
                      </td>

                      <td className="p-4 text-center text-yellow-600 font-bold">
                        {item.late_days}
                      </td>

                      <td className="p-4 text-center text-cyan-600 font-bold">
                        {item.leave_days}
                      </td>

                      <td className="p-4 text-center text-red-600 font-bold">
                        {item.absent_days}
                      </td>

                      <td className="p-4 text-center">
                        {Number(item.basic_salary).toLocaleString()} đ
                      </td>

                      <td className="p-4 text-center text-red-500 font-semibold">
                        {Number(item.deduction).toLocaleString()} đ
                      </td>

                      <td className="p-4 text-center text-emerald-600 font-bold">
                        {Number(item.final_salary).toLocaleString()} đ
                      </td>

                      <td className="p-4 text-center">
                        <button
                          onClick={() => generatePayroll(item.employee_id)}
                          className="bg-blue-500 text-white px-3 py-1 rounded"
                        >
                          Generate
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
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
