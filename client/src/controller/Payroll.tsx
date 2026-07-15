import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiCalendar,
  FiChevronDown,
  FiDollarSign,
  FiHome,
  FiList,
  FiLogOut,
  FiRefreshCw,
  FiSave,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";

type User = {
  username: string;
  role: string;
};

type PayrollItem = {
  id: number;
  employee_id: number;
  code: string;
  name: string;
  department: string;
  position: string;
  present_days: number;
  late_days: number;
  leave_days: number;
  absent_days: number;
  total_hours: number;
  basic_salary: number;
  allowance: number;
  bonus: number;
  ot_hours: number;
  overtime_rate: number;
  ot_salary: number;
  advance_salary: number;
  deduction: number;
  final_salary: number;
};

type ExtraInput = {
  allowance: number;
  bonus: number;
  advance_salary: number;
  ot_hours: number;
  overtime_rate: number;
  deduction: number;
};

export default function Payroll() {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [openEmployeeMenu, setOpenEmployeeMenu] = useState(false);

  const [month, setMonth] = useState(6);
  const [year, setYear] = useState(2026);

  const [payrolls, setPayrolls] = useState<PayrollItem[]>([]);
  const [extra, setExtra] = useState<Record<string, ExtraInput>>({});
  const [loading, setLoading] = useState(false);

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
    loadPayrolls();
  }, []);

  const formatMoney = (value: number) => {
    return Number(value || 0).toLocaleString("vi-VN") + " ₫";
  };

  const formatMoneyInput = (value: string | number) => {
    if (value === undefined || value === null || value === "") return "";
    return Number(String(value).replace(/\D/g, "") || 0).toLocaleString(
      "en-US",
    );
  };

  const parseMoneyInput = (value: string) => {
    return Number(value.replace(/\D/g, "") || 0);
  };

  const formatHours = (value: number) => {
    if (!value) return "--";

    const hours = Math.floor(Number(value || 0));
    const minutes = Math.round((Number(value || 0) - hours) * 60);

    return `${hours} giờ ${minutes} phút`;
  };

  const loadPayrolls = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `http://localhost:5000/api/payrolls?month=${month}&year=${year}`,
      );

      const list: PayrollItem[] = res.data || [];

      setPayrolls(list);

      const initExtra: Record<string, ExtraInput> = {};

      list.forEach((item) => {
        initExtra[String(item.employee_id)] = {
          allowance: Number(item.allowance || 0),
          bonus: Number(item.bonus || 0),
          advance_salary: Number(item.advance_salary || 0),
          ot_hours: Number(item.ot_hours || 0),
          overtime_rate: Number(item.overtime_rate || 0),

          // deduction trong DB = tạm ứng + khấu trừ nhập tay
          deduction: Math.max(
            Number(item.deduction || 0) - Number(item.advance_salary || 0),
            0,
          ),
        };
      });

      setExtra(initExtra);
    } catch (error) {
      console.log(error);
      toast.error("Không tải được bảng lương");
    } finally {
      setLoading(false);
    }
  };

  const getInputValue = (item: PayrollItem, field: keyof ExtraInput) => {
    const id = String(item.employee_id);

    if (extra[id]?.[field] !== undefined) {
      return Number(extra[id][field] || 0);
    }

    if (field === "deduction") {
      return Math.max(
        Number(item.deduction || 0) - Number(item.advance_salary || 0),
        0,
      );
    }

    return Number((item as any)[field] || 0);
  };

  const getEstimatedOt = (item: PayrollItem) => {
    return (
      Number(getInputValue(item, "ot_hours") || 0) *
      Number(getInputValue(item, "overtime_rate") || 0)
    );
  };

  const getEstimatedFinal = (item: PayrollItem) => {
    const basicSalary = Number(item.basic_salary || 0);
    const allowance = getInputValue(item, "allowance");
    const bonus = getInputValue(item, "bonus");
    const advanceSalary = getInputValue(item, "advance_salary");
    const deduction = getInputValue(item, "deduction");
    const otSalary = getEstimatedOt(item);

    return Math.max(
      0,
      Math.round(
        basicSalary + allowance + bonus + otSalary - advanceSalary - deduction,
      ),
    );
  };

  const handleExtraChange = (
    employeeId: number,
    field: keyof ExtraInput,
    value: string,
  ) => {
    const amount =
      field === "ot_hours" ? Number(value || 0) : parseMoneyInput(value);

    const id = String(employeeId);

    setExtra((prev) => ({
      ...prev,
      [id]: {
        allowance: prev[id]?.allowance || 0,
        bonus: prev[id]?.bonus || 0,
        advance_salary: prev[id]?.advance_salary || 0,
        ot_hours: prev[id]?.ot_hours || 0,
        overtime_rate: prev[id]?.overtime_rate || 0,
        deduction: prev[id]?.deduction || 0,
        [field]: amount,
      },
    }));
  };

  const generatePayroll = async () => {
    try {
      setLoading(true);

      await axios.post("http://localhost:5000/api/payroll/generate", {
        month,
        year,
        extra,
      });

      await loadPayrolls();

      toast.success(`Đã tính lương tháng ${month}/${year}`);
    } catch (error: any) {
      console.log(error);
      toast.error(error?.response?.data?.message || "Lỗi tính lương");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  const totalBasicSalary = payrolls.reduce(
    (sum, item) => sum + Number(item.basic_salary || 0),
    0,
  );

  const totalHours = payrolls.reduce(
    (sum, item) => sum + Number(item.total_hours || 0),
    0,
  );

  const totalFinalSalary = payrolls.reduce(
    (sum, item) => sum + getEstimatedFinal(item),
    0,
  );

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
            className="px-4 py-3 bg-white text-blue-700 rounded-xl text-left font-semibold transition flex items-center gap-2 shadow"
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
            <h1 className="text-3xl font-bold text-slate-800">Bảng lương</h1>
            <p className="text-slate-500 mt-1">
              Tính lương tự động theo tháng, giờ công và phụ cấp
            </p>
          </div>

          <div className="flex gap-3">
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
              onClick={loadPayrolls}
              className="bg-slate-600 hover:bg-slate-700 text-white px-5 py-3 rounded-2xl shadow flex items-center gap-2 font-semibold transition"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
              Xem
            </button>

            <button
              onClick={generatePayroll}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 font-semibold transition"
            >
              <FiSave />
              Tính lương
            </button>
          </div>
        </div>

        <div className="h-[calc(100vh-120px)] overflow-hidden flex flex-col">
          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard title="Số bảng lương" value={payrolls.length} />
            <StatCard title="Tổng giờ công" value={formatHours(totalHours)} />
            <StatCard
              title="Tổng lương cơ bản"
              value={formatMoney(totalBasicSalary)}
            />
            <StatCard
              title="Tổng thực nhận"
              value={formatMoney(totalFinalSalary)}
              highlight
            />
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-3xl shadow-sm border overflow-hidden flex-1 flex flex-col">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Danh sách bảng lương
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Tháng {month}/{year} • {payrolls.length} nhân viên
                </p>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl">
                <FiDollarSign />
              </div>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <FiRefreshCw size={42} className="animate-spin mb-3" />
                <p className="font-semibold">Đang tải dữ liệu...</p>
              </div>
            ) : (
              <div className="overflow-auto flex-1">
                <table className="min-w-[2050px] w-full">
                  <thead className="bg-blue-600 text-white sticky top-0 z-10">
                    <tr>
                      <th className="p-4 text-left">Mã NV</th>
                      <th className="p-4 text-left">Họ tên</th>
                      <th className="p-4 text-center">Phòng ban</th>
                      <th className="p-4 text-center">Chức vụ</th>
                      <th className="p-4 text-center">Ngày công</th>
                      <th className="p-4 text-center">Đi trễ</th>
                      <th className="p-4 text-center">Nghỉ phép</th>
                      <th className="p-4 text-center">Vắng</th>
                      <th className="p-4 text-center">Tổng giờ</th>
                      <th className="p-4 text-center">Lương CB</th>
                      <th className="p-4 text-center">Phụ cấp</th>
                      <th className="p-4 text-center">Thưởng</th>
                      <th className="p-4 text-center">Tạm ứng</th>
                      <th className="p-4 text-center">OT giờ</th>
                      <th className="p-4 text-center">Đơn giá OT</th>
                      <th className="p-4 text-center">Tiền OT</th>
                      <th className="p-4 text-center">Khấu trừ</th>
                      <th className="p-4 text-center">Thực nhận</th>
                    </tr>
                  </thead>

                  <tbody>
                    {payrolls.length === 0 ? (
                      <tr>
                        <td
                          colSpan={18}
                          className="text-center p-14 text-slate-400"
                        >
                          Chưa có dữ liệu bảng lương. Bấm “Tính lương” để tạo
                          bảng lương tháng này.
                        </td>
                      </tr>
                    ) : (
                      payrolls.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b hover:bg-slate-50 transition"
                        >
                          <td className="p-4 font-semibold text-slate-700">
                            {item.code}
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                {item.name?.charAt(0)?.toUpperCase() || "?"}
                              </div>

                              <div>
                                <p className="font-bold text-slate-800">
                                  {item.name}
                                </p>

                                <p className="text-xs text-slate-400">
                                  ID: {item.employee_id}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="p-4 text-center">
                            {item.department || "--"}
                          </td>

                          <td className="p-4 text-center">
                            {item.position || "--"}
                          </td>

                          <td className="p-4 text-center">
                            {item.present_days}
                          </td>

                          <td className="p-4 text-center text-yellow-600 font-semibold">
                            {item.late_days}
                          </td>

                          <td className="p-4 text-center text-purple-600 font-semibold">
                            {item.leave_days}
                          </td>

                          <td className="p-4 text-center text-red-600 font-semibold">
                            {item.absent_days}
                          </td>

                          <td className="p-4 text-center font-semibold text-blue-600">
                            {formatHours(Number(item.total_hours || 0))}
                          </td>

                          <td className="p-4 text-center font-semibold">
                            {formatMoney(item.basic_salary)}
                          </td>

                          <td className="p-4 text-center">
                            <MoneyInput
                              value={formatMoneyInput(
                                getInputValue(item, "allowance"),
                              )}
                              onChange={(value: string) =>
                                handleExtraChange(
                                  item.employee_id,
                                  "allowance",
                                  value,
                                )
                              }
                            />
                          </td>

                          <td className="p-4 text-center">
                            <MoneyInput
                              value={formatMoneyInput(
                                getInputValue(item, "bonus"),
                              )}
                              onChange={(value: string) =>
                                handleExtraChange(
                                  item.employee_id,
                                  "bonus",
                                  value,
                                )
                              }
                            />
                          </td>

                          <td className="p-4 text-center">
                            <MoneyInput
                              value={formatMoneyInput(
                                getInputValue(item, "advance_salary"),
                              )}
                              onChange={(value: string) =>
                                handleExtraChange(
                                  item.employee_id,
                                  "advance_salary",
                                  value,
                                )
                              }
                            />
                          </td>

                          <td className="p-4 text-center">
                            <input
                              type="number"
                              value={getInputValue(item, "ot_hours")}
                              onChange={(e) =>
                                handleExtraChange(
                                  item.employee_id,
                                  "ot_hours",
                                  e.target.value,
                                )
                              }
                              className="border px-3 py-2 rounded-xl w-24 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>

                          <td className="p-4 text-center">
                            <MoneyInput
                              value={formatMoneyInput(
                                getInputValue(item, "overtime_rate"),
                              )}
                              onChange={(value: string) =>
                                handleExtraChange(
                                  item.employee_id,
                                  "overtime_rate",
                                  value,
                                )
                              }
                            />
                          </td>

                          <td className="p-4 text-center font-bold text-blue-600">
                            {formatMoney(getEstimatedOt(item))}
                          </td>

                          <td className="p-4 text-center">
                            <MoneyInput
                              value={formatMoneyInput(
                                getInputValue(item, "deduction"),
                              )}
                              onChange={(value: string) =>
                                handleExtraChange(
                                  item.employee_id,
                                  "deduction",
                                  value,
                                )
                              }
                              danger
                            />
                          </td>

                          <td className="p-4 text-center font-bold text-green-600">
                            {formatMoney(getEstimatedFinal(item))}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, highlight }: any) {
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

function MoneyInput({ value, onChange, danger = false }: any) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`border px-3 py-2 rounded-xl w-32 outline-none focus:ring-2 focus:ring-blue-500 ${
        danger ? "text-red-600 font-semibold" : ""
      }`}
    />
  );
}
