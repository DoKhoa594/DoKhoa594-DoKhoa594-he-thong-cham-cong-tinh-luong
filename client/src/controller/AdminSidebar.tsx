import { signOut } from "../session";
import { NavLink, useMatch } from "react-router-dom";
import { FiCalendar, FiDollarSign, FiFileText, FiHome, FiKey, FiLogOut, FiSettings, FiUserCheck, FiUsers } from "react-icons/fi";

export const adminLayout = "min-h-screen bg-slate-50 text-slate-900 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]";
export const adminMain = "mx-auto w-full max-w-[96rem] space-y-5 p-4 sm:p-7 xl:p-9";
export const adminPanel = "min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm";

const navItem = "flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/10";
const navLink = ({ isActive }: { isActive: boolean }) =>
  `${navItem}${isActive ? " bg-white/15 text-white" : ""}`;
const employeeLink = (state: { isActive: boolean }) => `${navLink(state)} pl-10`;

export default function AdminSidebar({ username, onLogout, employeesOpen = false }: {
  username: string;
  onLogout: () => void;
  employeesOpen?: boolean;
}) {
  const configurationActive = useMatch("/admin/configuration");
  return (
    <aside className="flex flex-col gap-5 bg-brand-navy p-5 text-slate-200 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
      <div className="flex items-center gap-3 text-white">
        <span className="grid size-9 place-items-center rounded-lg bg-brand-teal"><FiUsers /></span>
        <span className="font-semibold">Quản lý nhân sự</span>
      </div>
      <nav aria-label="Quản trị" className="grid gap-1 text-sm">
        <NavLink to="/admin" end className={navLink}><FiHome /> Tổng quan</NavLink>
        <NavLink to="/admin/attendance" className={navLink}><FiCalendar /> Chấm công</NavLink>
        <NavLink to="/admin/leave" className={navLink}><FiFileText /> Đơn nghỉ phép</NavLink>
        <NavLink to="/admin/accounts" className={navLink}><FiKey /> Tài khoản</NavLink>
        <NavLink to="/admin/profile-requests" className={navLink}><FiUserCheck /> Duyệt sửa hồ sơ</NavLink>
        <details open={employeesOpen}>
          <summary className={`${navItem} cursor-pointer list-none`}><FiUsers /> Nhân viên <span className="ml-auto">⌄</span></summary>
          <NavLink to="/admin/employees/add" className={employeeLink}>Thêm nhân viên</NavLink>
          <NavLink to="/admin/employees/list" className={employeeLink}>Danh sách nhân viên</NavLink>
        </details>
        <NavLink to="/admin/payroll" className={navLink}><FiDollarSign /> Bảng lương</NavLink>
        <details open={Boolean(configurationActive)}>
          <summary className={`${navItem} cursor-pointer list-none`}><FiSettings /> Quản trị <span className="ml-auto">⌄</span></summary>
          <NavLink to="/admin/configuration" className={employeeLink}>Cấu hình</NavLink>
        </details>
      </nav>
      <div className="mt-auto border-t border-white/15 pt-4 text-sm">
        <p className="truncate px-3 font-semibold text-white">{username}</p>
        <button type="button" onClick={() => void signOut().catch(() => undefined).finally(onLogout)} className={`${navItem} mt-1 w-full`}><FiLogOut /> Đăng xuất</button>
      </div>
    </aside>
  );
}
