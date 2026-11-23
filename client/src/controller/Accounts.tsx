import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import AdminSidebar, { adminLayout, adminMain } from "./AdminSidebar";
import { portalApi, portalButton, portalPanel } from "../page/portalData";

type Account = { id: number; code: string; name: string; department: string | null };
type Accounts = { accounts: Account[]; hasMore: boolean };

export default function Accounts() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get("code") ?? "");
  const [filter, setFilter] = useState({ keyword: search, page: 1 });
  const [data, setData] = useState<Accounts>();
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<Account>();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const stored = localStorage.getItem("user");
  const user: { username: string; role: string } | null = stored ? JSON.parse(stored) : null;
  const role = user?.role;

  useEffect(() => {
    if (role !== "admin") return;
    const abort = new AbortController();
    axios.get<Accounts>(portalApi + "/admin/accounts", { params: filter, signal: abort.signal })
      .then(({ data }) => setData(data))
      .catch(() => { if (!abort.signal.aborted) setError(true); });
    return () => abort.abort();
  }, [filter, role]);

  if (user?.role !== "admin") return <Navigate to={user ? "/user" : "/"} replace />;

  function load(keyword: string, page: number) {
    setError(false);
    setData(undefined);
    setFilter({ keyword, page });
  }

  function searchAccounts(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    load(search.trim(), 1);
  }

  async function changePassword(account: Account, reset: boolean) {
    if (reset && !window.confirm(`Đặt mật khẩu của ${account.name} về 1?`)) return;
    setBusy(true);
    try {
      const code = encodeURIComponent(account.code);
      if (reset) await axios.put(portalApi + "/reset-password/" + code);
      else await axios.put(portalApi + "/admin/accounts/" + code + "/password", { password });
      toast.success(reset ? "Đã đặt lại mật khẩu về 1." : "Đã đặt mật khẩu mới.");
      setSelected(undefined);
      setPassword("");
    } catch (error) {
      toast.error(axios.isAxiosError(error) ? error.response?.data?.message ?? "Không đổi được mật khẩu." : "Không đổi được mật khẩu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={adminLayout}>
      <AdminSidebar username={user.username} onLogout={() => navigate("/", { replace: true })} />
      <main className={adminMain}>
        <header className="border-b border-slate-200 pb-4">
          <h1 className="text-3xl font-semibold tracking-tight">Tài khoản nhân viên</h1>
          <p className="mt-1 text-sm text-slate-600">Tên đăng nhập là mã nhân viên. Mật khẩu ban đầu là <strong>1</strong>.</p>
        </header>
        <form onSubmit={searchAccounts} className="flex flex-wrap items-end gap-2">
          <label className="grid min-w-0 gap-1 text-sm font-medium">Tìm theo mã hoặc tên
            <input value={search} onChange={event => setSearch(event.target.value)} maxLength={150} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5" />
          </label>
          <button className={portalButton}>Tìm</button>
        </form>
        {selected && <form className={portalPanel} onSubmit={event => { event.preventDefault(); void changePassword(selected, false); }}>
          <h2 className="mb-3 font-semibold">Đặt mật khẩu cho {selected.name} · {selected.code}</h2>
          <label className="grid max-w-sm gap-1 text-sm font-medium">Mật khẩu mới
            <input type="password" autoComplete="new-password" required maxLength={72} value={password} onChange={event => setPassword(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <div className="mt-3 flex gap-2">
            <button className={portalButton} disabled={busy || !password.trim()}>Lưu mật khẩu</button>
            <button type="button" disabled={busy} className="rounded-lg border border-slate-300 px-4 py-2 text-sm" onClick={() => { setSelected(undefined); setPassword(""); }}>Hủy</button>
          </div>
        </form>}
        {error ? <p role="alert" className={portalPanel}>Không tải được tài khoản. <button onClick={() => load(filter.keyword, filter.page)} className="text-brand underline">Tải lại</button></p> :
          !data ? <p role="status" className={portalPanel}>Đang tải tài khoản…</p> :
          <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100"><tr>{["Mã đăng nhập", "Nhân viên", "Phòng ban", "Thao tác"].map(label => <th scope="col" key={label} className="px-4 py-3">{label}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data.accounts.map(account => <tr key={account.id}>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold">{account.code}</td>
                  <td className="px-4 py-3">{account.name}</td>
                  <td className="px-4 py-3">{account.department ?? "—"}</td>
                  <td className="px-4 py-3"><div className="flex flex-wrap gap-2">
                    <button disabled={busy} type="button" onClick={() => { setSelected(account); setPassword(""); }} className="whitespace-nowrap rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-brand">Đặt mật khẩu</button>
                    <button disabled={busy} type="button" onClick={() => void changePassword(account, true)} className="whitespace-nowrap rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700">Đặt lại về 1</button>
                  </div></td>
                </tr>)}
                {!data.accounts.length && <tr><td colSpan={4} className="p-5 text-center text-slate-600">Không tìm thấy tài khoản.</td></tr>}
              </tbody>
            </table>
            {(filter.page > 1 || data.hasMore) && <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-4 py-3 text-sm">
              <button disabled={filter.page === 1} onClick={() => load(filter.keyword, filter.page - 1)} className="font-semibold text-brand disabled:opacity-40">Trang trước</button>
              <span>Trang {filter.page}</span>
              <button disabled={!data.hasMore} onClick={() => load(filter.keyword, filter.page + 1)} className="font-semibold text-brand disabled:opacity-40">Trang sau</button>
            </div>}
          </section>}
      </main>
    </div>
  );
}
