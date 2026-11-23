import { todayVN } from "../page/attendanceData";
import AdminSidebar, { adminLayout, adminMain } from "./AdminSidebar";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiDollarSign,
  FiRefreshCw,
  FiSave,
  FiSend,
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
  allowance_reason?: string | null;
  bonus: number;
  bonus_reason?: string | null;
  ot_hours: number;
  ot_hours_reason?: string | null;
  overtime_rate: number;
  ot_salary: number;
  advance_salary: number;
  advance_salary_reason?: string | null;
  deduction: number;
  final_salary: number;
  payroll_month: number;
  payroll_year: number;
  sent_at: string | null;
};

type ExtraInput = {
  allowance: number;
  allowance_reason: string;
  bonus: number;
  bonus_reason: string;
  advance_salary: number;
  advance_salary_reason: string;
  ot_hours: number;
  ot_hours_reason: string;
  overtime_rate: number;
  deduction: number;
};

type AmountField = Exclude<keyof ExtraInput, `${string}_reason`>;
const reasonFields = [
  { amount: "allowance", reason: "allowance_reason", label: "phụ cấp" },
  { amount: "bonus", reason: "bonus_reason", label: "thưởng" },
  { amount: "advance_salary", reason: "advance_salary_reason", label: "tạm ứng" },
  { amount: "ot_hours", reason: "ot_hours_reason", label: "tăng ca" },
] as const;

const savedExtras = (item: PayrollItem): ExtraInput => ({
  allowance: Number(item.allowance || 0),
  allowance_reason: item.allowance_reason ?? "",
  bonus: Number(item.bonus || 0),
  bonus_reason: item.bonus_reason ?? "",
  advance_salary: Number(item.advance_salary || 0),
  advance_salary_reason: item.advance_salary_reason ?? "",
  ot_hours: Number(item.ot_hours || 0),
  ot_hours_reason: item.ot_hours_reason ?? "",
  overtime_rate: Number(item.overtime_rate) ||
    (Number(item.ot_hours) ? Number(item.ot_salary) / Number(item.ot_hours) : 0),
  deduction: Math.max(Number(item.deduction || 0) - Number(item.advance_salary || 0), 0),
});

export default function Payroll() {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);

  const [yearToday, monthToday] = todayVN().split("-").map(Number);
  const [month, setMonth] = useState(monthToday);
  const [year, setYear] = useState(yearToday);

  const [payrolls, setPayrolls] = useState<PayrollItem[]>([]);
  const [extra, setExtra] = useState<Record<string, ExtraInput>>({});
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadedPeriod, setLoadedPeriod] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const period = `${year}-${month}`;

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
      setLoadedPeriod(period);
      setEmployeeId(current => list.some(item => String(item.employee_id) === current) ? current : "");

      const initExtra: Record<string, ExtraInput> = {};

      list.forEach((item) => {
        initExtra[String(item.employee_id)] = savedExtras(item);
      });

      setExtra(initExtra);
    } catch (error) {
      console.log(error);
      toast.error("Không tải được bảng lương");
    } finally {
      setLoading(false);
    }
  };

  const draftFor = (item: PayrollItem) => extra[item.employee_id] ?? savedExtras(item);
  const getInputValue = (item: PayrollItem, field: AmountField) => draftFor(item)[field];
  const missingReason = (item: PayrollItem) => {
    const draft = draftFor(item);
    return reasonFields.find(({ amount, reason }) => draft[amount] > 0 && !draft[reason].trim());
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
    item: PayrollItem,
    field: AmountField,
    value: string,
  ) => {
    const amount =
      field === "ot_hours" ? Number(value || 0) : parseMoneyInput(value);

    setExtra((prev) => ({
      ...prev,
      [item.employee_id]: { ...savedExtras(item), ...prev[item.employee_id], [field]: amount },
    }));
  };

  const generatePayroll = async () => {
    if (loadedPeriod !== period) return;
    const incomplete = payrolls.find(item => item.code && missingReason(item));
    if (incomplete) {
      setEmployeeId(String(incomplete.employee_id));
      toast.error(`Nhập lý do ${missingReason(incomplete)?.label} cho ${incomplete.name}.`);
      return;
    }
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

  const periodRows = loadedPeriod === period ? payrolls : [];
  const selected = periodRows.find(item => String(item.employee_id) === employeeId);
  const visibleRows = selected ? [selected] : periodRows;
  const saved = selected && savedExtras(selected);
  const dirty = selected && saved && (Object.keys(saved) as (keyof ExtraInput)[])
    .some(field => draftFor(selected)[field] !== saved[field]);
  const selectedMissingReason = selected && missingReason(selected);

  const sendSelected = async () => {
    if (!selected?.code || selectedMissingReason || dirty || loading || sending) return;
    const recipient = `${selected.name} (${selected.code})`;
    if (!window.confirm(`Gửi phiếu lương tháng ${selected.payroll_month}/${selected.payroll_year} cho ${recipient}?`)) return;
    setSending(true);
    try {
      const { data } = await axios.post<{ sent_at: string }>(
        `http://localhost:5000/api/payrolls/${selected.id}/send`,
        { employee_id: selected.employee_id },
      );
      setPayrolls(rows => rows.map(row => row.id === selected.id ? { ...row, sent_at: data.sent_at } : row));
      toast.success(`Đã gửi phiếu lương cho ${recipient}`);
    } catch (error) {
      toast.error(axios.isAxiosError(error) ? error.response?.data?.message ?? "Không gửi được phiếu lương." : "Không gửi được phiếu lương.");
    } finally {
      setSending(false);
    }
  };

  const totalBasicSalary = visibleRows.reduce(
    (sum, item) => sum + Number(item.basic_salary || 0),
    0,
  );

  const totalHours = visibleRows.reduce(
    (sum, item) => sum + Number(item.total_hours || 0),
    0,
  );

  const totalFinalSalary = visibleRows.reduce(
    (sum, item) => sum + getEstimatedFinal(item),
    0,
  );

  if (!user) return null;

  return (
    <div className={adminLayout}>
      <AdminSidebar username={user.username} onLogout={handleLogout} />

      <main className={adminMain}>
        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Bảng lương</h1>
            <p className="text-slate-500 mt-1">
              Tính lương tự động theo tháng, giờ công và phụ cấp
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <input
              type="number"
              aria-label="Tháng"
              disabled={loading || sending}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="border px-4 py-3 rounded-2xl shadow-sm w-24 outline-none focus:ring-2 focus:ring-brand-teal"
              placeholder="Tháng"
            />

            <input
              type="number"
              aria-label="Năm"
              disabled={loading || sending}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border px-4 py-3 rounded-2xl shadow-sm w-28 outline-none focus:ring-2 focus:ring-brand-teal"
              placeholder="Năm"
            />

            <button
              onClick={loadPayrolls}
              disabled={loading || sending}
              className="bg-slate-600 hover:bg-slate-700 text-white px-5 py-3 rounded-2xl shadow flex items-center gap-2 font-semibold transition"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
              Xem
            </button>

            <button
              onClick={generatePayroll}
              disabled={loading || sending || loadedPeriod !== period}
              className="bg-brand hover:bg-brand-dark text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 font-semibold transition"
            >
              <FiSave />
              Tính lương
            </button>
          </div>
        </div>

        <div className="min-w-0">
          <section className="mb-4 flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4">
            <label className="grid gap-1 text-sm font-semibold">
              Phạm vi bảng lương
              <select value={selected ? employeeId : ""} onChange={event => setEmployeeId(event.target.value)}
                disabled={loading || sending} className="min-w-48 rounded-lg border border-slate-300 bg-white px-3 py-2">
                <option value="">Toàn công ty</option>
                {periodRows.filter(item => item.code).map(item => (
                  <option key={item.employee_id} value={item.employee_id}>{item.name} · {item.code}</option>
                ))}
              </select>
            </label>
            {!selected && periodRows.length > 0 && <p className="text-sm text-slate-600">Chọn nhân viên để gửi phiếu lương.</p>}
            {selected?.code && <div className="space-y-2 text-sm">
              <p>{selected.sent_at ? `Gửi gần nhất ${new Date(selected.sent_at).toLocaleString("vi-VN")}` : "Chưa gửi phiếu lương"}</p>
              <button type="button" onClick={sendSelected} disabled={sending || loading || Boolean(dirty || selectedMissingReason)}
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
                <FiSend /> {sending ? "Đang gửi…" : selected.sent_at ? "Gửi lại phiếu lương" : "Gửi phiếu lương"}
              </button>
              {selectedMissingReason ? <p className="text-slate-600">Bổ sung lý do {selectedMissingReason.label} trước khi gửi.</p>
                : dirty && <p className="text-slate-600">Bấm Tính lương để lưu thay đổi trước khi gửi.</p>}
            </div>}
          </section>
          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard title="Số bảng lương" value={visibleRows.length} />
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
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {selected ? `Bảng lương của ${selected.name}` : "Bảng lương toàn công ty"}
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Tháng {month}/{year} • {visibleRows.length} nhân viên
                </p>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-brand-soft text-brand flex items-center justify-center text-2xl">
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
                  <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10">
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
                    {visibleRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={18}
                          className="text-center p-14 text-slate-400"
                        >
                          {loadedPeriod === period ? "Chưa có dữ liệu. Bấm Tính lương để tạo bảng lương tháng này." : "Bấm Xem để tải bảng lương của kỳ đã chọn."}
                        </td>
                      </tr>
                    ) : (
                      visibleRows.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b hover:bg-slate-50 transition"
                        >
                          <td className="p-4 font-semibold text-slate-700">
                            {item.code}
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-full bg-brand-soft text-brand flex items-center justify-center font-bold">
                                {item.name?.charAt(0)?.toUpperCase() || "?"}
                              </div>

                              <div>
                                {item.code && !selected ? (
                                  <button type="button" onClick={() => setEmployeeId(String(item.employee_id))}
                                    className="text-left font-semibold text-brand hover:underline">{item.name}</button>
                                ) : <p className="font-bold text-slate-800">{item.name || "Hồ sơ đã xóa"}</p>}

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

                          <td className="p-4 text-center font-semibold text-brand">
                            {formatHours(Number(item.total_hours || 0))}
                          </td>

                          <td className="p-4 text-center font-semibold">
                            {formatMoney(item.basic_salary)}
                          </td>

                          {reasonFields.map(({ amount, reason, label }) => (
                            <td key={amount} className="p-4 text-center align-top">
                              {amount === "ot_hours" ? (
                                <input type="number" min={0} step="0.01" value={getInputValue(item, amount)}
                                  aria-label={`Số giờ tăng ca của ${item.name}`}
                                  onChange={event => handleExtraChange(item, amount, event.target.value)}
                                  className="w-24 rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-teal" />
                              ) : (
                                <MoneyInput value={formatMoneyInput(getInputValue(item, amount))}
                                  onChange={(value: string) => handleExtraChange(item, amount, value)} />
                              )}
                              {getInputValue(item, amount) > 0 && (
                                <textarea aria-label={`Lý do ${label} của ${item.name}`} placeholder={`Lý do ${label} *`}
                                  rows={2} maxLength={255} value={draftFor(item)[reason]}
                                  onChange={event => {
                                    const value = event.target.value;
                                    setExtra(current => ({
                                      ...current,
                                      [item.employee_id]: { ...savedExtras(item), ...current[item.employee_id], [reason]: value },
                                    }));
                                  }}
                                  className="mt-2 block w-full min-w-36 resize-y rounded-lg border border-slate-300 px-2 py-1.5 text-left text-sm"
                                />
                              )}
                            </td>
                          ))}

                          <td className="p-4 text-center">
                            <MoneyInput
                              value={formatMoneyInput(
                                getInputValue(item, "overtime_rate"),
                              )}
                              onChange={(value: string) =>
                                handleExtraChange(
                                  item,
                                  "overtime_rate",
                                  value,
                                )
                              }
                            />
                          </td>

                          <td className="p-4 text-center font-bold text-brand">
                            {formatMoney(getEstimatedOt(item))}
                          </td>

                          <td className="p-4 text-center">
                            <MoneyInput
                              value={formatMoneyInput(
                                getInputValue(item, "deduction"),
                              )}
                              onChange={(value: string) =>
                                handleExtraChange(
                                  item,
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
      className={`border px-3 py-2 rounded-xl w-32 outline-none focus:ring-2 focus:ring-brand-teal ${
        danger ? "text-red-600 font-semibold" : ""
      }`}
    />
  );
}
