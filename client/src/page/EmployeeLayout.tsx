import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import axios from "axios";
import EmployeeAvatar from "./EmployeeAvatar";
import { portalApi } from "./portalData";
import { FiClock, FiFileText, FiLogOut, FiUser } from "react-icons/fi";
import { signOut } from "../session";

const links = [
  { to: "/user", label: "Chấm công", Icon: FiClock },
  { to: "/user/payslips", label: "Phiếu lương", Icon: FiFileText },
  { to: "/profile", label: "Hồ sơ", Icon: FiUser },
];

export default function EmployeeLayout({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate();
  const [fallbackName] = useState<string>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored).username ?? "" : "";
  });
  const [identity, setIdentity] = useState<{ name: string; avatar: string | null }>();
  useEffect(() => {
    const request = new AbortController();
    axios.get<{ name: string; avatar: string | null }>(portalApi + "/me/identity", { signal: request.signal })
      .then(({ data }) => setIdentity(data)).catch(() => undefined);
    return () => request.abort();
  }, []);
  const name = identity?.name || fallbackName;

  function logout() {
    void signOut().catch(() => undefined).finally(() => navigate("/", { replace: true }));
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-brand-navy text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <EmployeeAvatar src={identity?.avatar} className="size-11 text-lg" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-200">Cổng nhân viên</p>
              <p className="break-words font-semibold">{name ? `Xin chào, ${name}` : "Xin chào, nhân viên"}</p>
            </div>
          </div>
          <button type="button" onClick={logout} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-white/10"><FiLogOut /> Đăng xuất</button>
        </div>
        <nav aria-label="Nhân viên" className="mx-auto flex max-w-6xl flex-wrap gap-2 px-4 pb-3 sm:px-7">
          {links.map(({ to, label, Icon }) => (
            <NavLink end key={to} to={to} className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive ? "bg-white text-slate-900 font-semibold" : "text-white hover:bg-white/10"}`}>
              <Icon /> {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-7">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {children}
      </main>
    </div>
  );
}
