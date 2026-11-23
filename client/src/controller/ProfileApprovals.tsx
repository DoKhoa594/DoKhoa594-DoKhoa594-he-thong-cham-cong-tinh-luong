import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Navigate, useNavigate } from "react-router-dom";
import AdminSidebar, { adminLayout, adminMain } from "./AdminSidebar";
import ProfileChanges from "../page/ProfileChanges";
import { portalApi, portalButton, portalPanel, requestLabels, type ProfileRequest } from "../page/portalData";

const url = portalApi + "/admin/profile-requests";

export default function ProfileApprovals() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const user: { username: string; role: string } | null = storedUser ? JSON.parse(storedUser) : null;
  const role = user?.role;
  const [items, setItems] = useState<ProfileRequest[]>([]);
  const [filter, setFilter] = useState("pending");
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<"loading" | "error" | "ready">("loading");

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get<ProfileRequest[]>(url);
      setItems(data);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => { if (role === "admin") void load(); }, [load, role]);

  if (user?.role !== "admin") return <Navigate to={user ? "/user" : "/"} replace />;

  const visible = items.filter(item => filter === "all" || filter === item.status);
  async function decide(id: number, status: "approved" | "rejected") {
    setBusy(true);
    try {
      await axios.put(`${url}/${id}`, { status });
      toast.success(requestLabels[status]);
    } catch (error) {
      toast.error(axios.isAxiosError(error) ? error.response?.data?.message ?? "Không xử lý được yêu cầu." : "Không xử lý được yêu cầu.");
    } finally {
      await load();
      setBusy(false);
    }
  }

  function logout() {
    navigate("/", { replace: true });
  }

  return (
    <div className={adminLayout}>
      <AdminSidebar username={user.username} onLogout={logout} />
      <main className={adminMain}>
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4">
          <h1 className="text-3xl font-semibold tracking-tight">Duyệt sửa hồ sơ</h1>
          <div className="flex flex-wrap items-end gap-2">
            <label className="grid gap-1 text-sm font-medium">Trạng thái
              <select value={filter} onChange={event => setFilter(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2">
                <option value="all">Tất cả</option>
                {Object.entries(requestLabels).map(([status, label]) => <option value={status} key={status}>{label}</option>)}
              </select>
            </label>
            <button type="button" disabled={busy} onClick={() => void load()} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-brand">Tải lại</button>
          </div>
        </header>
        {state === "loading" && <p className={portalPanel} role="status">Đang tải yêu cầu…</p>}
        {state === "error" && <p className={portalPanel} role="alert">Không tải được yêu cầu. Bấm Tải lại để thử lại.</p>}
        {state === "ready" && (!visible.length ? <p className={portalPanel}>Chưa có yêu cầu ở trạng thái này.</p> :
          visible.map(item => (
            <article className={portalPanel} key={item.id}>
              <div className="mb-3 flex flex-wrap justify-between gap-2">
                <div><h2 className="font-semibold">{item.name ?? "Nhân viên đã xóa"}</h2><p className="mt-1 text-sm text-slate-600">{item.code ?? item.employee_id} · {new Date(item.created_at).toLocaleDateString("vi-VN")}</p></div>
                <p className="text-sm font-semibold text-brand">{requestLabels[item.status]}</p>
              </div>
              <ProfileChanges changes={item.changes} passwordChange={item.password_change} />
              {item.status === "pending" && <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className={portalButton} disabled={busy} onClick={() => void decide(item.id, "approved")}>Duyệt cập nhật</button>
                <button type="button" className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-800 disabled:opacity-50" disabled={busy} onClick={() => void decide(item.id, "rejected")}>Từ chối</button>
              </div>}
            </article>
          )))}
      </main>
    </div>
  );
}
