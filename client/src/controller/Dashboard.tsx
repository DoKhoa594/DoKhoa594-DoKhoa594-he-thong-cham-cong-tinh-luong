import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiCalendar, FiClock, FiDollarSign, FiRefreshCw, FiUsers,
} from "react-icons/fi";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import AdminSidebar, { adminLayout, adminMain, adminPanel as panel } from "./AdminSidebar";

type EmployeeRow = { employee_id: number; code?: string; name?: string };
type AttendanceRow = EmployeeRow & { check_in?: string; final_status: string };
type PayrollRow = Partial<EmployeeRow> & {
  id?: number;
  total_hours: number | string;
  daily_salary?: number | string;
  final_salary?: number | string;
};
type DashboardData = {
  date: string;
  month: number;
  year: number;
  employee: { total: number };
  attendance: Record<"present" | "late" | "leave" | "absent" | "total_hours", number>;
  payroll: Record<"count" | "total_basic_salary" | "total_allowance" | "total_bonus" |
    "total_ot_salary" | "total_deduction" | "total_final_salary" | "total_hours", number>;
  today_attendance: AttendanceRow[];
  daily_payroll?: PayrollRow[];
  payroll_top?: PayrollRow[];
};

const statuses = [
  { key: "present", name: "Đi làm", color: "#24786e" },
  { key: "late", name: "Đi trễ", color: "#a96a13" },
  { key: "leave", name: "Nghỉ phép", color: "#58779a" },
  { key: "absent", name: "Vắng", color: "#ad5665" },
] as const;
const field = "block h-10 max-w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800";
const money = (value: number | string) => Number(value).toLocaleString("vi-VN") + " ₫";
const compact = new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 });
const hours = (value: number | string) => {
  const minutes = Math.round(Number(value) * 60);
  return `${Math.floor(minutes / 60)} giờ ${minutes % 60} phút`;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [user] = useState<{ username: string; role: string } | null>(() => {
    const value = localStorage.getItem("user");
    return value ? JSON.parse(value) : null;
  });
  const [initialDate] = useState(() => new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10));
  const [date, setDate] = useState(initialDate);
  const [period, setPeriod] = useState(initialDate.slice(0, 7));
  const [filters, setFilters] = useState({ date, period });
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (user?.role !== "admin") navigate(user ? "/user" : "/", { replace: true });
  }, [navigate, user]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    const request = new AbortController();
    const [year, month] = filters.period.split("-").map(Number);

    axios.get<DashboardData>("http://localhost:5000/api/dashboard", {
      params: { date: filters.date, month, year },
      signal: request.signal,
    }).then(({ data }) => setDashboard(data))
      .catch(() => { if (!request.signal.aborted) setError(true); })
      .finally(() => { if (!request.signal.aborted) setLoading(false); });

    return () => request.abort();
  }, [filters, user]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(false);
    setFilters({ date, period });
  }

  function logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  }

  if (user?.role !== "admin") return null;

  const attendance = statuses.map(status => ({
    ...status, value: dashboard?.attendance[status.key] ?? 0,
  }));
  const attendanceTotal = attendance.reduce((sum, item) => sum + item.value, 0);
  const payroll = dashboard?.payroll;
  const components = [
    { name: "Lương cơ bản", value: payroll?.total_basic_salary ?? 0, color: "#315770" },
    { name: "Phụ cấp", value: payroll?.total_allowance ?? 0, color: "#24786e" },
    { name: "Thưởng", value: payroll?.total_bonus ?? 0, color: "#24786e" },
    { name: "Tăng ca", value: payroll?.total_ot_salary ?? 0, color: "#24786e" },
    { name: "Khấu trừ", value: -(payroll?.total_deduction ?? 0), color: "#ad5665" },
  ];
  const payrollRows = dashboard?.daily_payroll ?? dashboard?.payroll_top ?? [];
  const shownDate = dashboard?.date.slice(0, 10).split("-").reverse().join("/");
  const shownPeriod = dashboard && `${dashboard.month}/${dashboard.year}`;

  return (
    <div className={adminLayout}>
      <AdminSidebar username={user.username} onLogout={logout} />

      <main className={adminMain}>
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Tổng quan nhân sự</h1>
            <p className="mt-1 text-sm text-slate-600">Theo dõi chấm công và chi phí lương</p>
          </div>
          <form onSubmit={applyFilters} className="flex flex-wrap items-end gap-3">
            <label className="text-xs font-medium text-slate-600">Ngày chấm công
              <input className={`${field} mt-1`} type="date" required value={date} onChange={event => setDate(event.target.value)} />
            </label>
            <label className="text-xs font-medium text-slate-600">Kỳ lương
              <input className={`${field} mt-1`} type="month" required value={period} onChange={event => setPeriod(event.target.value)} />
            </label>
            <button disabled={loading} className="flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
              <FiRefreshCw className={loading ? "animate-spin" : ""} /> Áp dụng
            </button>
          </form>
        </header>

        {loading && <p role="status" className={`${panel} p-6 text-slate-600`}>Đang tải dữ liệu…</p>}
        {error && <p role="alert" className={`${panel} p-6 text-rose-800`}>Không tải được dữ liệu. Bấm Áp dụng để thử lại.</p>}

        {dashboard && !loading && !error && <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Tổng nhân viên", value: dashboard.employee.total, detail: "Toàn công ty", Icon: FiUsers },
              { label: "Giờ làm trong ngày", value: hours(dashboard.attendance.total_hours), detail: shownDate, Icon: FiClock },
              { label: "Giờ công tháng", value: hours(dashboard.payroll.total_hours), detail: shownPeriod, Icon: FiCalendar },
              { label: "Tổng lương thực nhận", value: money(dashboard.payroll.total_final_salary), detail: `${shownPeriod} · ${dashboard.payroll.count} bảng lương`, Icon: FiDollarSign },
            ].map(({ label, value, detail, Icon }) => (
              <section key={label} className={`${panel} p-4`}>
                <div className="flex items-center justify-between gap-2 text-sm text-slate-600">
                  <h2>{label}</h2><Icon className="shrink-0 text-brand" />
                </div>
                <p className="mt-2 break-words text-2xl font-semibold tabular-nums">{value}</p>
                <p className="mt-1 text-xs text-slate-600">{detail}</p>
              </section>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)]">
            <section className={`${panel} p-4 sm:p-5`}>
              <h2 className="font-semibold">Trạng thái chấm công</h2>
              <p className="mt-1 text-sm text-slate-600">{shownDate}</p>
              <div className="mt-3 grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="relative h-44">
                  {attendanceTotal > 0 ? <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={attendance} dataKey="value" nameKey="name" innerRadius="59%" outerRadius="83%" paddingAngle={2}>
                          {attendance.map(item => <Cell key={item.key} fill={item.color} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <span className="pointer-events-none absolute inset-0 grid place-items-center text-2xl font-semibold">{attendanceTotal}</span>
                  </> : <p className="grid h-full place-items-center text-center text-sm text-slate-600">Chưa có dữ liệu chấm công</p>}
                </div>
                <ul className="space-y-2 text-sm">
                  {attendance.map(item => (
                    <li key={item.key} className="flex items-center gap-2">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: item.color }} />
                      {item.name}<span className="ml-auto font-semibold tabular-nums">{item.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className={`${panel} p-4 sm:p-5`}>
              <h2 className="font-semibold">Cơ cấu lương tháng</h2>
              <p className="mt-1 text-sm text-slate-600">{shownPeriod} · Đơn vị VNĐ</p>
              <div className="mt-3 h-44">
                {payroll?.count ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={components} layout="vertical" margin={{ right: 22 }}>
                      <CartesianGrid horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" tickFormatter={value => compact.format(value)} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={91} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip formatter={value => money(Number(value))} />
                      <Bar dataKey="value" name="Số tiền" maxBarSize={16}>
                        {components.map(item => <Cell key={item.name} fill={item.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="grid h-full place-items-center text-center text-sm text-slate-600">Chưa có bảng lương cho kỳ này</p>}
              </div>
              <ul className="mt-3 grid gap-2 border-t border-slate-100 pt-3 text-xs sm:grid-cols-2">
                {components.map(item => (
                  <li key={item.name} className="flex justify-between gap-2">
                    <span className="text-slate-600">{item.name}</span><span className="font-medium tabular-nums">{money(item.value)}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <DetailTable title="Chấm công trong ngày" period={shownDate} link="/admin/attendance"
              columns={["Mã NV", "Họ tên", "Giờ vào", "Trạng thái"]}
              rows={dashboard.today_attendance.slice(0, 8).map(item => ({
                key: item.employee_id,
                cells: [item.code || item.employee_id, item.name || "—", item.check_in || "—",
                  statuses.find(status => status.key === item.final_status)?.name ?? item.final_status],
              }))}
            />
            <DetailTable title={dashboard.daily_payroll ? "Lương tạm tính theo ngày" : "Lương thực nhận cao nhất"}
              period={dashboard.daily_payroll ? shownDate : shownPeriod} link="/admin/payroll"
              columns={["Mã NV", "Họ tên", "Tổng giờ", "Tiền lương"]}
              rows={payrollRows.slice(0, 8).map(item => ({
                key: item.employee_id ?? item.id ?? item.code ?? "",
                cells: [item.code ?? item.employee_id ?? "—", item.name || "—", hours(item.total_hours ?? 0),
                  money(item.daily_salary ?? item.final_salary ?? 0)],
              }))}
            />
          </div>
        </>}
      </main>
    </div>
  );
}

function DetailTable({ title, period, link, columns, rows }: {
  title: string;
  period?: string | null;
  link: string;
  columns: string[];
  rows: { key: string | number; cells: (string | number)[] }[];
}) {
  return (
    <section className={`${panel} overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-2 p-4 sm:p-5">
        <div><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm text-slate-600">{period}</p></div>
        <Link to={link} className="text-sm font-semibold text-brand hover:underline">Xem chi tiết</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full whitespace-nowrap text-left text-sm" aria-label={title}>
          <thead className="bg-slate-100 text-slate-700">
            <tr>{columns.map(column => <th scope="col" key={column} className="px-4 py-3 font-medium">{column}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length ? rows.map(row => (
              <tr key={row.key} className="border-t border-slate-100 hover:bg-slate-50">
                {row.cells.map((cell, index) => <td key={columns[index]} className="px-4 py-3 tabular-nums">{cell}</td>)}
              </tr>
            )) : <tr><td colSpan={columns.length} className="p-6 text-center text-slate-600">Chưa có dữ liệu</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
