import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
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

function Payroll() {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [openEmployeeMenu, setOpenEmployeeMenu] = useState(false);

  const [month, setMonth] = useState(6);
  const [year, setYear] = useState(2026);
  const [payrolls, setPayrolls] = useState<PayrollItem[]>([]);
  const [extra, setExtra] = useState<Record<string, ExtraInput>>({});
  const [loading, setLoading] = useState(false);

  const formatMoney = (value: number) => {
    return Number(value || 0).toLocaleString("vi-VN") + " ₫";
  };

  const formatMoneyInput = (value: string | number) => {
    if (value === undefined || value === null || value === "") return "";
    return Number(String(value).replace(/,/g, "")).toLocaleString("en-US");
  };

  const parseMoneyInput = (value: string) => {
    return Number(value.replace(/,/g, "") || 0);
  };

  const formatHours = (value: number) => {
    if (!value) return "--";

    const hours = Math.floor(Number(value || 0));
    const minutes = Math.round((Number(value || 0) - hours) * 60);

    return `${hours} giờ ${minutes} phút`;
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

  const loadPayrolls = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `http://localhost:5000/api/payrolls?month=${month}&year=${year}`,
      );

      setPayrolls(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExtraChange = (
    employeeId: number,
    field: keyof ExtraInput,
    value: string,
  ) => {
    const amount =
      field === "ot_hours" ? Number(value || 0) : parseMoneyInput(value);

    setExtra((prev) => ({
      ...prev,
      [employeeId]: {
        allowance: prev[employeeId]?.allowance || 0,
        bonus: prev[employeeId]?.bonus || 0,
        advance_salary: prev[employeeId]?.advance_salary || 0,
        ot_hours: prev[employeeId]?.ot_hours || 0,
        overtime_rate: prev[employeeId]?.overtime_rate || 0,
        deduction: prev[employeeId]?.deduction || 0,
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
      toast.success("Tính lương thành công");
    } catch (error) {
      console.log(error);
      toast.error("Lỗi tính lương");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayrolls();
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
            <h1 className="text-3xl font-bold text-gray-800">Bảng lương</h1>
            <p className="text-gray-500 mt-1">
              Tính lương tự động theo giờ công
            </p>
          </div>

          <div className="flex gap-3">
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
              onClick={loadPayrolls}
              className="bg-gray-500 text-white px-4 py-2 rounded-xl"
            >
              Xem
            </button>

            <button
              onClick={generatePayroll}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl"
            >
              Tính lương
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="p-5 border-b">
            <h2 className="text-xl font-semibold">Danh sách bảng lương</h2>
          </div>

          {loading ? (
            <div className="p-10 text-center">Đang tải dữ liệu...</div>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-[1900px] w-full">
                <thead className="bg-blue-600 text-white">
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
                    <th className="p-4 text-center">Đơn giá giờ OT</th>

                    <th className="p-4 text-center">Khấu trừ</th>
                    <th className="p-4 text-center">Thực nhận</th>
                  </tr>
                </thead>

                <tbody>
                  {payrolls.length === 0 ? (
                    <tr>
                      <td
                        colSpan={18}
                        className="text-center p-10 text-gray-400"
                      >
                        Chưa có dữ liệu bảng lương
                      </td>
                    </tr>
                  ) : (
                    payrolls.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">{item.code}</td>
                        <td className="p-4">{item.name}</td>
                        <td className="p-4 text-center">
                          {item.department || "--"}
                        </td>
                        <td className="p-4 text-center">
                          {item.position || "--"}
                        </td>

                        <td className="p-4 text-center">{item.present_days}</td>
                        <td className="p-4 text-center">{item.late_days}</td>
                        <td className="p-4 text-center">{item.leave_days}</td>
                        <td className="p-4 text-center">{item.absent_days}</td>

                        <td className="p-4 text-center">
                          {formatHours(Number(item.total_hours || 0))}
                        </td>

                        <td className="p-4 text-center">
                          {formatMoney(item.basic_salary)}
                        </td>

                        <td className="p-4 text-center">
                          <input
                            type="text"
                            value={formatMoneyInput(
                              extra[item.employee_id]?.allowance ??
                                item.allowance ??
                                0,
                            )}
                            onChange={(e) =>
                              handleExtraChange(
                                item.employee_id,
                                "allowance",
                                e.target.value,
                              )
                            }
                            className="border px-2 py-1 rounded w-32"
                          />
                        </td>

                        <td className="p-4 text-center">
                          <input
                            type="text"
                            value={formatMoneyInput(
                              extra[item.employee_id]?.bonus ?? item.bonus ?? 0,
                            )}
                            onChange={(e) =>
                              handleExtraChange(
                                item.employee_id,
                                "bonus",
                                e.target.value,
                              )
                            }
                            className="border px-2 py-1 rounded w-32"
                          />
                        </td>

                        <td className="p-4 text-center">
                          <input
                            type="text"
                            value={formatMoneyInput(
                              extra[item.employee_id]?.advance_salary ??
                                item.advance_salary ??
                                0,
                            )}
                            onChange={(e) =>
                              handleExtraChange(
                                item.employee_id,
                                "advance_salary",
                                e.target.value,
                              )
                            }
                            className="border px-2 py-1 rounded w-32"
                          />
                        </td>

                        <td className="p-4 text-center">
                          <input
                            type="number"
                            value={
                              extra[item.employee_id]?.ot_hours ??
                              item.ot_hours ??
                              0
                            }
                            onChange={(e) =>
                              handleExtraChange(
                                item.employee_id,
                                "ot_hours",
                                e.target.value,
                              )
                            }
                            className="border px-2 py-1 rounded w-24"
                          />
                        </td>

                        <td className="p-4 text-center">
                          <input
                            type="text"
                            value={formatMoneyInput(
                              extra[item.employee_id]?.overtime_rate ??
                                item.overtime_rate ??
                                0,
                            )}
                            onChange={(e) =>
                              handleExtraChange(
                                item.employee_id,
                                "overtime_rate",
                                e.target.value,
                              )
                            }
                            className="border px-2 py-1 rounded w-32"
                          />
                        </td>

                        <td className="p-4 text-center">
                          <input
                            type="text"
                            value={formatMoneyInput(
                              extra[item.employee_id]?.deduction ??
                                item.deduction ??
                                0,
                            )}
                            onChange={(e) =>
                              handleExtraChange(
                                item.employee_id,
                                "deduction" as any,
                                e.target.value,
                              )
                            }
                            className="border px-2 py-1 rounded w-32 text-red-600"
                          />
                        </td>

                        <td className="p-4 text-center font-bold text-green-600">
                          {formatMoney(item.final_salary)}
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
    </div>
  );
}

export default Payroll;
