import EmployeeLayout from "./EmployeeLayout";
import { FiClock, FiLogIn, FiLogOut } from "react-icons/fi";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { attendanceApi, attendanceError, leaveLabels, todayVN, type LeaveRequest } from "./attendanceData";

type AttendanceRecord = {
  check_in: string | null;
  check_out: string | null;
  status: "present" | "late" | "leave" | "absent";
  leave_status: LeaveRequest["leave_status"] | null;
};

const panel = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const primary = "rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60";
const secondary = "rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-soft disabled:opacity-60";
const field = "rounded-lg border border-slate-300 px-3 py-2 text-sm";
const attendanceLabels = { present: "Đi làm", late: "Đi trễ", leave: "Nghỉ phép", absent: "Vắng" };

export default function Attendance() {
  const [employee] = useState<{ id: number; username: string; role: string } | null>(() => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  });
  const employeeId = employee?.id;
  const today = todayVN();
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [history, setHistory] = useState<{ date: string; record: AttendanceRecord | null } | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [leaveDate, setLeaveDate] = useState(today);
  const [reason, setReason] = useState("");
  const [showLeave, setShowLeave] = useState(false);
  const [showLateReason, setShowLateReason] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const refresh = useCallback(async () => {
    if (!employeeId || employee?.role !== "user") return;
    const [{ data: current }, { data: leaves }] = await Promise.all([
      axios.get<AttendanceRecord | null>(`${attendanceApi}/my/${employeeId}`),
      axios.get<LeaveRequest[]>(`${attendanceApi}/leave/my/${employeeId}`),
    ]);
    setRecord(current);
    setRequests(leaves);
    setReady(true);
    setLoadFailed(false);
  }, [employeeId, employee?.role]);

  useEffect(() => {
    refresh().catch(() => setLoadFailed(true));
  }, [refresh]);

  useEffect(() => {
    if (!employeeId || employee?.role !== "user") return;
    const request = new AbortController();
    axios.get<AttendanceRecord | null>(`${attendanceApi}/history/${employeeId}`, {
      params: { date: selectedDate }, signal: request.signal,
    }).then(({ data }) => setHistory({ date: selectedDate, record: data }))
      .catch(() => {
        if (!request.signal.aborted) toast.error("Không tải được lịch sử chấm công.");
      });
    return () => request.abort();
  }, [employeeId, employee?.role, selectedDate, historyVersion]);

  if (!employee) return <Navigate to="/" replace />;
  if (employee.role === "admin") return <Navigate to="/admin" replace />;

  const historyRecord = history?.date === selectedDate ? history.record : null;
  const completedShift = Boolean(record?.check_out);
  const activeShift = Boolean(record?.check_in) && !completedShift;
  const canRequestLeave = ready;
  const leaveBlocksToday = record?.status === "leave" && record.leave_status !== "rejected";
  const canCheckIn = !record?.check_in && !completedShift && !leaveBlocksToday;
  const earliestLeaveDate = record?.check_in || completedShift || leaveBlocksToday
    ? todayVN(Date.now() + 86400000)
    : today;
  const status = record?.status === "leave" && record.leave_status
    ? leaveLabels[record.leave_status]
    : record?.status ? attendanceLabels[record.status] : "Chưa vào ca";

  async function submit(action: "checkin" | "checkout" | "leave") {
    setBusy(true);
    try {
      const { data } = await axios.post<{ time?: string }>(`${attendanceApi}/${action}`, {
        employee_id: employeeId,
        ...(action === "leave" ? { date: leaveDate, reason } : {}),
        ...(action === "checkin" && showLateReason ? { reason } : {}),
      });
      if (action === "checkout" && data.time) {
        const checkOut = data.time;
        setRecord(current => current && { ...current, check_out: checkOut });
      }
      setHistoryVersion(version => version + 1);
      if (action !== "checkout") {
        setShowLeave(false);
        setReason("");
      }
      setShowLateReason(false);
      toast.success({ checkin: "Đã chấm vào ca.", checkout: "Đã chấm tan ca.", leave: "Đã gửi đơn nghỉ phép." }[action]);
      await refresh().catch(() => {
        if (action !== "checkout") setReady(false);
        setLoadFailed(true);
        toast.error("Không tải lại được dữ liệu chấm công.");
      });
    } catch (error) {
      toast.error(attendanceError(error));
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        await refresh().catch(() => setReady(false));
      }
    } finally {
      setBusy(false);
    }
  }

  function requestCheckIn() {
    const time = new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Ho_Chi_Minh" });
    if (time > "08:00:00") {
      setReason("");
      setShowLeave(false);
      setShowLateReason(true);
    } else {
      void submit("checkin");
    }
  }

  function openLeave() {
    setShowLateReason(false);
    setReason("");
    setLeaveDate(earliestLeaveDate);
    setShowLeave(true);
  }

  function submitReason(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reason.trim()) return;
    if (showLeave && (!canRequestLeave || leaveDate < earliestLeaveDate)) return;
    void submit(showLeave ? "leave" : "checkin");
  }

  return (
    <EmployeeLayout title="Chấm công">
      <section className="rounded-2xl bg-brand-navy p-5 text-white shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-200">{today.split("-").reverse().join("/")}</p>
            <h2 className="mt-1 text-2xl font-semibold">{employee.username}</h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm"><FiClock /> {ready ? status : "Đang tải ca làm"}</span>
        </div>
        <dl className="my-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/10 p-4"><dt className="text-sm text-slate-200">Giờ vào ca</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{record?.check_in ?? "—"}</dd></div>
          <div className="rounded-xl bg-white/10 p-4"><dt className="text-sm text-slate-200">Giờ tan ca</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{record?.check_out ?? "—"}</dd></div>
        </dl>
        {!ready && (loadFailed ? <button className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand" onClick={() => refresh().catch(() => toast.error("Không tải được dữ liệu."))}>Tải lại chấm công</button> : <p role="status" className="text-sm">Đang tải chấm công…</p>)}
        {ready && activeShift && <button className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-brand hover:bg-brand-soft disabled:opacity-60" disabled={busy} onClick={() => void submit("checkout")}><FiLogOut /> Chấm tan ca</button>}
        {ready && canCheckIn && !showLateReason && <button className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-brand hover:bg-brand-soft disabled:opacity-60" disabled={busy} onClick={requestCheckIn}><FiLogIn /> Chấm vào ca</button>}
        {ready && completedShift && <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-slate-200">Đã hoàn tất ca làm hôm nay.</p>
          {!busy && <a href="#leave-request" onClick={openLeave} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-soft">Xin nghỉ từ ngày mai</a>}
        </div>}
        {showLateReason && canCheckIn && <form onSubmit={submitReason} className="grid max-w-xl gap-3 rounded-xl bg-white p-4 text-slate-900">
          <label className="grid gap-1 text-sm font-medium">Lý do đi trễ
            <textarea value={reason} onChange={event => setReason(event.target.value)} className={field} rows={2} maxLength={1000} required autoFocus />
          </label>
          <div className="flex flex-wrap gap-2">
            <button className={primary} disabled={busy || !reason.trim()}>Xác nhận vào ca</button>
            <button type="button" className={secondary} disabled={busy} onClick={() => setShowLateReason(false)}>Hủy</button>
          </div>
        </form>}
      </section>
      <section id="leave-request" className={panel}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Đơn nghỉ phép</h2>
          {canRequestLeave && <button className={secondary} disabled={busy || showLeave} onClick={openLeave}>{earliestLeaveDate === today ? "Xin nghỉ phép" : "Xin nghỉ từ ngày mai"}</button>}
        </div>
        {showLeave && canRequestLeave && (
          <form onSubmit={submitReason} className="my-4 grid gap-3 rounded-lg bg-slate-50 p-4">
            <label className="grid gap-1 text-sm font-medium">Ngày nghỉ
              <input type="date" className={field} min={earliestLeaveDate} value={leaveDate} onChange={event => setLeaveDate(event.target.value)} required />
            </label>
            <label className="grid gap-1 text-sm font-medium">Lý do nghỉ phép
              <textarea value={reason} onChange={event => setReason(event.target.value)} className={field} rows={3} maxLength={1000} required />
            </label>
            <div className="flex gap-2">
              <button className={primary} disabled={busy || !reason.trim()}>Gửi đơn</button>
              <button type="button" className={secondary} disabled={busy} onClick={() => { setShowLeave(false); setShowLateReason(false); }}>Hủy</button>
            </div>
          </form>
        )}
        {requests.length ? <ul className="mt-3 divide-y divide-slate-100">
          {requests.map(item => <li key={item.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
            <div><time dateTime={item.date} className="font-semibold">{item.date.split("-").reverse().join("/")}</time><p className="mt-1 break-words text-slate-600">{item.reason}</p></div>
            <span className="font-medium text-brand">{leaveLabels[item.leave_status]}</span>
          </li>)}
        </ul> : ready && <p className="mt-3 text-sm text-slate-600">Chưa có đơn nghỉ phép.</p>}
      </section>

      <section className={panel}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Lịch sử chấm công</h2>
          <input aria-label="Ngày xem lịch sử" type="date" value={selectedDate} className={field} onChange={event => { if (event.target.value) setSelectedDate(event.target.value); }} />
        </div>
        <p className="mt-3 text-sm text-slate-600">{historyRecord
          ? `${attendanceLabels[historyRecord.status]} · Vào ca ${historyRecord.check_in ?? "—"} · Tan ca ${historyRecord.check_out ?? "—"}`
          : "Chưa có dữ liệu cho ngày này."}</p>
      </section>
    </EmployeeLayout>
  );
}
