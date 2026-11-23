import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import AdminSidebar, { adminLayout, adminMain, adminPanel } from "./AdminSidebar";
import { catalogUrl, useEmployeeCatalog, type CatalogItem, type CatalogKind } from "./useEmployeeCatalog";

const sections = [
  { kind: "departments", title: "Phòng ban", label: "Tên phòng ban" },
  { kind: "positions", title: "Chức vụ", label: "Tên chức vụ" },
] as const;
const primaryButton = "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60";
const secondaryButton = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-100 disabled:opacity-60";

export default function Configuration() {
  const navigate = useNavigate();
  const [user] = useState<{ username: string; role: string } | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("user") ?? "null");
    } catch {
      return null;
    }
  });
  const { catalog, error, reload, setCatalog } = useEmployeeCatalog(user?.role === "admin");

  useEffect(() => {
    if (user?.role !== "admin") navigate(user ? "/user" : "/", { replace: true });
  }, [navigate, user]);

  if (user?.role !== "admin") return null;

  function logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  }

  return (
    <div className={adminLayout}>
      <AdminSidebar username={user.username} onLogout={logout} />
      <main className={adminMain}>
        <header className="border-b border-slate-200 pb-5">
          <h1 className="text-3xl font-semibold tracking-tight">Cấu hình</h1>
          <p className="mt-1 text-sm text-slate-600">Quản lý phòng ban và chức vụ dùng trong hồ sơ nhân viên.</p>
        </header>
        {error && <div role="alert" className={`${adminPanel} flex flex-wrap items-center gap-3 p-4 text-sm`}>
          Không tải được danh mục.
          <button type="button" onClick={reload} className={secondaryButton}>Thử lại</button>
        </div>}
        {!catalog && !error && <p role="status" className="text-sm text-slate-600">Đang tải danh mục…</p>}
        {catalog && <div className="grid items-start gap-4 xl:grid-cols-2">
          {sections.map(section => (
            <CatalogSection key={section.kind} {...section} items={catalog[section.kind]}
              onChange={change => setCatalog(current => current && ({
                ...current,
                [section.kind]: change(current[section.kind]),
              }))}
            />
          ))}
        </div>}
      </main>
    </div>
  );
}

function CatalogSection({ kind, title, label, items, onChange }: {
  kind: CatalogKind;
  title: string;
  label: string;
  items: CatalogItem[];
  onChange: (change: (items: CatalogItem[]) => CatalogItem[]) => void;
}) {
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const url = `${catalogUrl}/${kind}`;
  const sortedItems = [...items].sort((a, b) => a.name.localeCompare(b.name, "vi") || a.id - b.id);

  function reset() {
    setName("");
    setEditing(null);
    setError("");
  }

  function showError(error: unknown) {
    setError(axios.isAxiosError(error) ? error.response?.data?.message || "Không cập nhật được danh mục" : "Không cập nhật được danh mục");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const payload = { name: name.trim() };
      const { data } = editing === null
        ? await axios.post<CatalogItem>(url, payload)
        : await axios.put<CatalogItem>(`${url}/${editing}`, payload);
      onChange(current => [...current.filter(item => item.id !== data.id), data]);
      toast.success(editing === null ? "Đã thêm vào danh mục" : "Đã cập nhật danh mục");
      reset();
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: CatalogItem) {
    if (busy || !window.confirm(`Xóa “${item.name}” khỏi danh mục?`)) return;
    setBusy(true);
    setError("");
    try {
      await axios.delete(`${url}/${item.id}`);
      onChange(current => current.filter(entry => entry.id !== item.id));
      if (editing === item.id) reset();
      toast.success("Đã xóa khỏi danh mục");
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`${adminPanel} overflow-hidden`}>
      <div className="space-y-3 p-4 sm:p-5">
        <h2 className="font-semibold">{title}</h2>
        <form onSubmit={save} className="flex flex-wrap items-end gap-2">
          <label className="min-w-40 flex-1 text-sm font-medium text-slate-700">
            {label}
            <input value={name} onChange={event => setName(event.target.value)} maxLength={100}
              required disabled={busy} className="mt-1 block h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
          </label>
          <button disabled={busy || !name.trim()} className={primaryButton}>
            {editing === null ? <><FiPlus /> Thêm</> : "Lưu thay đổi"}
          </button>
          {editing !== null && <button type="button" disabled={busy} onClick={reset} className={secondaryButton}>Hủy</button>}
        </form>
        {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      </div>
      <table className="w-full table-fixed text-left text-sm">
        <thead className="bg-slate-100 text-slate-700">
          <tr><th scope="col" className="px-4 py-3 font-medium">{label}</th><th scope="col" className="w-28 px-4 py-3 text-right font-medium">Thao tác</th></tr>
        </thead>
        <tbody>
          {sortedItems.map(item => (
            <tr key={item.id} className="border-t border-slate-100">
              <th scope="row" className="break-words px-4 py-2 font-medium">{item.name}</th>
              <td className="px-4 py-2">
                <div className="flex justify-end gap-1">
                  <button type="button" disabled={busy} aria-label={`Sửa ${item.name}`}
                    onClick={() => { setEditing(item.id); setName(item.name); setError(""); }}
                    className="rounded-lg p-2 text-brand hover:bg-brand-soft disabled:opacity-60"><FiEdit2 /></button>
                  <button type="button" disabled={busy} aria-label={`Xóa ${item.name}`} onClick={() => remove(item)}
                    className="rounded-lg p-2 text-rose-700 hover:bg-rose-50 disabled:opacity-60"><FiTrash2 /></button>
                </div>
              </td>
            </tr>
          ))}
          {!items.length && <tr><td colSpan={2} className="p-5 text-center text-slate-600">Danh mục chưa có mục nào</td></tr>}
        </tbody>
      </table>
    </section>
  );
}
