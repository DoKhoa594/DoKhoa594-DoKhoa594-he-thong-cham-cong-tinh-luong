import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import AdminSidebar, { adminLayout, adminMain, adminPanel } from "./AdminSidebar";
import { attendanceApi, attendanceError, leaveLabels, type LeaveRequest } from "../page/attendanceData";

export default function LeaveRequests() {
  const navigate = useNavigate();
  const [user] = useState<{ username: string; role: string } | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [filter, setFilter] = useState("pending");
  const [busy, setBusy] = useState<number | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const refresh = useCallback(async () => {
    try {
      const { data } = await axios.get<LeaveRequest[]>(`${attendanceApi}/leave`);
      setRequests(data);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    if (user?.role === "admin") void refresh();
  }, [refresh, user]);

  if (user?.role !== "admin") return <Navigate to={user ? "/user" : "/"} replace />;

  const visible = requests.filter(item => filter === "all" || item.leave_status === filter);

  async function decide(id: number, action: "approve" | "reject") {
    setBusy(id);
    try {
      await axios.put(`${attendanceApi}/${action}/${id}`);
      toast.success(action === "approve" ? "Đã duyệt đơn." : "Đã từ chối đơn.");
    } catch (error) {
      toast.error(attendanceError(error));
    } finally {
      await refresh();
      setBusy(null);
    }
  }

  function logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  }

  return (
    <div className={adminLayout}>
      <AdminSidebar username={user.username} onLogout={logout} />
      <main className={adminMain}>
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4">
          <h1 className="text-3xl font-semibold tracking-tight">Đơn nghỉ phép</h1>
          <div className="flex flex-wrap items-end gap-2">
            <label className="grid gap-1 text-sm font-medium">Trạng thái
              <select value={filter} onChange={event => setFilter(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                <option value="all">Tất cả</option>
                {Object.entries(leaveLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <button type="button" onClick={() => void refresh()} disabled={state === "loading" || busy !== null} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-brand">Tải lại</button>
          </div>
        </header>

        <div className={`${adminPanel} overflow-x-auto`}>
          {state === "ready" ? <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>{["Nhân viên", "Ngày nghỉ", "Lý do", "Trạng thái", "Thao tác"].map(label => <th scope="col" key={label} className="px-4 py-3">{label}</th>)}</tr>
            </thead>
            <tbody>
              {visible.map(item => <tr key={item.id} className="border-t border-slate-100 align-top">
                <td className="px-4 py-3"><p className="font-semibold">{item.name ?? "Nhân viên đã xóa"}</p><p className="text-slate-600">{item.code ?? item.employee_id}</p></td>
                <td className="whitespace-nowrap px-4 py-3"><time dateTime={item.date}>{item.date.split("-").reverse().join("/")}</time></td>
                <td className="min-w-44 whitespace-pre-wrap break-words px-4 py-3">{item.reason || "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 font-medium">{leaveLabels[item.leave_status]}</td>
                <td className="px-4 py-3">{item.leave_status === "pending" ? <div className="flex flex-wrap gap-2 whitespace-nowrap">
                  <button type="button" disabled={busy !== null} onClick={() => void decide(item.id, "approve")} className="rounded-lg bg-brand px-3 py-1.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-60">Duyệt</button>
                  <button type="button" disabled={busy !== null} onClick={() => void decide(item.id, "reject")} className="rounded-lg border border-rose-200 px-3 py-1.5 font-semibold text-rose-800 hover:bg-rose-50 disabled:opacity-60">Từ chối</button>
                </div> : "—"}</td>
              </tr>)}
              {!visible.length && <tr><td colSpan={5} className="p-6 text-center text-slate-600">Chưa có đơn ở trạng thái này.</td></tr>}
            </tbody>
          </table> : <p role={state === "error" ? "alert" : "status"} className="p-5 text-slate-600">{state === "error" ? "Không tải được đơn nghỉ phép. Bấm Tải lại để thử lại." : "Đang tải đơn nghỉ phép…"}</p>}
        </div>
      </main>
    </div>
  );
}
