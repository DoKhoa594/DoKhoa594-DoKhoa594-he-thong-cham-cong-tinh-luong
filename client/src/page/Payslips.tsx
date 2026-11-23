import { useEffect, useState } from "react";
import axios from "axios";
import { Navigate } from "react-router-dom";
import EmployeeLayout from "./EmployeeLayout";
import { portalApi, portalPanel } from "./portalData";

const amounts = {
  basic_salary: "Lương cơ bản",
  allowance: "Phụ cấp",
  bonus: "Thưởng",
  ot_salary: "Lương tăng ca",
  deduction: "Khấu trừ",
  advance_salary: "Tạm ứng",
};
type Payslip = Record<keyof typeof amounts | "final_salary" | "total_hours", number | string> & {
  id: number;
  payroll_month: number;
  payroll_year: number;
  sent_at: string;
  allowance_reason?: string | null;
  bonus_reason?: string | null;
  advance_salary_reason?: string | null;
  ot_hours_reason?: string | null;
  ot_hours?: number | string;
};
const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
const reasonByAmount = {
  allowance: "allowance_reason",
  bonus: "bonus_reason",
  advance_salary: "advance_salary_reason",
  ot_salary: "ot_hours_reason",
} as const;

export default function Payslips() {
  const storedUser = localStorage.getItem("user");
  const role = storedUser ? JSON.parse(storedUser).role : undefined;
  const [slips, setSlips] = useState<Payslip[]>([]);
  const [selection, setSelection] = useState<number>();
  const [state, setState] = useState<"loading" | "error" | "ready">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (role !== "user") return;
    const request = new AbortController();
    axios.get<Payslip[]>(portalApi + "/me/payslips", { signal: request.signal })
      .then(({ data }) => { setSlips(data); setState("ready"); })
      .catch(() => { if (!request.signal.aborted) setState("error"); });
    return () => request.abort();
  }, [attempt, role]);

  if (role !== "user") return <Navigate to={role === "admin" ? "/admin" : "/"} replace />;

  function reload() {
    setState("loading");
    setAttempt(value => value + 1);
  }

  const slip = slips.find(item => item.id === selection) ?? slips[0];
  return (
    <EmployeeLayout title="Phiếu lương">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-700">Phiếu lương do quản trị viên gửi đến tài khoản của bạn.</p>
        <button type="button" disabled={state === "loading"} onClick={reload} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-brand disabled:opacity-60">Tải lại</button>
      </div>
      {state === "loading" && <p role="status" className={portalPanel}>Đang tải phiếu lương…</p>}
      {state === "error" && <p role="alert" className={portalPanel}>Không tải được phiếu lương. Bấm Tải lại để thử lại.</p>}
      {state === "ready" && (slip ? (
        <section className={portalPanel}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <label className="grid gap-1 text-sm font-medium">Kỳ lương
              <select value={slip.id} onChange={event => setSelection(Number(event.target.value))} className="rounded-lg border border-slate-300 bg-white px-3 py-2">
                {slips.map(item => <option key={item.id} value={item.id}>Tháng {item.payroll_month}/{item.payroll_year}</option>)}
              </select>
            </label>
            <div className="rounded-xl bg-brand-soft px-4 py-3">
              <p className="text-sm font-medium text-brand">Thực nhận</p>
              <p className="text-2xl font-semibold tabular-nums text-brand-dark">{currency.format(Number(slip.final_salary))}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-600">Đã nhận {new Date(slip.sent_at).toLocaleString("vi-VN")}</p>
          <dl className="mt-4 divide-y divide-slate-100 text-sm">
            <div className="flex justify-between py-3"><dt className="text-slate-600">Giờ công</dt><dd className="font-medium">{Number(slip.total_hours).toLocaleString("vi-VN")} giờ</dd></div>
            {(Object.keys(amounts) as (keyof typeof amounts)[]).map(key => {
              const amount = Number(slip[key]);
              const reasonField = key in reasonByAmount ? reasonByAmount[key as keyof typeof reasonByAmount] : undefined;
              const reason = reasonField && slip[reasonField];
              const overtimeHours = key === "ot_salary" ? Number(slip.ot_hours ?? 0) : 0;
              return <div className="flex items-start justify-between gap-4 py-3" key={key}>
                <dt className="min-w-0 text-slate-600">
                  {amounts[key]}
                  {overtimeHours > 0 && <span className="ml-2 text-slate-600">· {overtimeHours.toLocaleString("vi-VN")} giờ</span>}
                  {(amount > 0 || overtimeHours > 0) && reason && <span className="mt-1 block whitespace-pre-wrap break-words text-slate-800">Lý do: {reason}</span>}
                </dt>
                <dd className="shrink-0 font-medium tabular-nums">{currency.format(amount)}</dd>
              </div>;
            })}
          </dl>
        </section>
      ) : <p className={portalPanel}>Chưa có phiếu lương nào được gửi đến tài khoản của bạn.</p>)}
    </EmployeeLayout>
  );
}
