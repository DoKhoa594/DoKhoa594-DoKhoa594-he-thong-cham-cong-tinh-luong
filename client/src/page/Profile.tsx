import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import EmployeeAvatar from "./EmployeeAvatar";
import EmployeeLayout from "./EmployeeLayout";
import ProfileChanges from "./ProfileChanges";
import { portalApi, portalButton, portalPanel, profileFields, profileLabels, requestLabels, type ProfileField, type ProfileChangeField, type ProfileRequest } from "./portalData";

type Profile = Record<ProfileField, string | null> & { code: string; avatar: string | null; department: string | null; position: string | null };
type ProfileData = { profile: Profile; requests: ProfileRequest[] };
const limits = { name: 150, email: 254, phone: 32, address: 255 };

export default function Profile() {
  const storedUser = localStorage.getItem("user");
  const user: { role: string } | null = storedUser ? JSON.parse(storedUser) : null;
  const role = user?.role;
  const [data, setData] = useState<ProfileData | null>(null);
  const [draft, setDraft] = useState<Record<ProfileField, string> | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [readingAvatar, setReadingAvatar] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const load = useCallback(async () => {
    try {
      const { data: result } = await axios.get<ProfileData>(portalApi + "/me/profile");
      setData(result);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => { if (role === "user") void load(); }, [load, role]);

  if (role !== "user") return <Navigate to={role === "admin" ? "/admin" : "/"} replace />;

  const profile = data?.profile;
  const pending = data?.requests.find(item => item.status === "pending");
  const changes: Partial<Record<ProfileChangeField, string>> = Object.fromEntries(profileFields
    .filter(field => draft && draft[field].trim() !== (profile?.[field] ?? ""))
    .map(field => [field, draft?.[field].trim()]));
  if (draft && avatar && avatar !== profile?.avatar) changes.avatar = avatar;

  function resetPasswordDraft() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmation("");
  }

  function openDraft(password: boolean) {
    if (!profile) return;
    setChangePassword(password);
    resetPasswordDraft();
    setDraft({
      name: profile.name ?? "", email: profile.email ?? "", phone: profile.phone ?? "", address: profile.address ?? "",
    });
  }

  const passwordsMatch = !changePassword ||
    Boolean(currentPassword && newPassword.trim() && newPassword === confirmation && newPassword !== currentPassword);
  const canSubmit = passwordsMatch && (changePassword || Object.keys(changes).length > 0);

  function chooseAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size === 0 || file.size > 512 * 1024) {
      toast.error("Chọn ảnh JPG, PNG hoặc WebP tối đa 512 KB.");
      return;
    }
    setReadingAvatar(true);
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") setAvatar(reader.result); };
    reader.onerror = () => toast.error("Không đọc được ảnh đã chọn.");
    reader.onloadend = () => setReadingAvatar(false);
    reader.readAsDataURL(file);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      await axios.post(portalApi + "/me/profile/requests", {
        changes,
        ...(changePassword ? { password_change: { current_password: currentPassword, new_password: newPassword } } : {}),
      });
      toast.success("Đã gửi yêu cầu cập nhật hồ sơ.");
      setDraft(null);
      setAvatar(null);
      resetPasswordDraft();
      await load();
    } catch (error) {
      toast.error(axios.isAxiosError(error) ? error.response?.data?.message ?? "Không gửi được yêu cầu." : "Không gửi được yêu cầu.");
      if (axios.isAxiosError(error) && error.response?.status === 409) await load();
    } finally {
      setBusy(false);
    }
  }

  async function withdraw(id: number) {
    setBusy(true);
    try {
      await axios.put(portalApi + "/me/profile/requests/" + id + "/withdraw");
      setData(current => current && {
        ...current,
        requests: current.requests.map(item => item.id === id ? { ...item, status: "withdrawn" } : item),
      });
      toast.success("Đã rút yêu cầu. Bạn có thể tạo yêu cầu mới.");
    } catch (error) {
      toast.error(axios.isAxiosError(error) ? error.response?.data?.message ?? "Không rút được yêu cầu." : "Không rút được yêu cầu.");
      if (axios.isAxiosError(error) && error.response?.status === 409) await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <EmployeeLayout title="Hồ sơ cá nhân">
      {error ? <p role="alert" className={portalPanel}>Không tải được hồ sơ. <button onClick={() => void load()} className="font-semibold text-brand underline">Tải lại</button></p> :
        !profile || !data ? <p role="status" className={portalPanel}>Đang tải hồ sơ…</p> : <>
          <section className={portalPanel}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <EmployeeAvatar src={profile.avatar} className="size-14 text-xl" label="Ảnh đại diện" />
                <div className="min-w-0"><h2 className="break-words text-lg font-semibold">{profile.name}</h2><p className="mt-1 text-sm text-slate-600">{[profile.code, profile.department, profile.position].filter(Boolean).join(" · ")}</p></div>
              </div>
              {!draft && !pending && <div className="flex flex-wrap gap-2">
                <button type="button" className={portalButton} disabled={busy} onClick={() => openDraft(false)}>Yêu cầu chỉnh sửa</button>
                <button type="button" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-brand" disabled={busy} onClick={() => openDraft(true)}>Yêu cầu đổi mật khẩu</button>
              </div>}
            </div>
            {pending && <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              <p>Yêu cầu đang chờ admin duyệt.</p>
              <button type="button" disabled={busy} onClick={() => void withdraw(pending.id)} className="rounded-lg border border-amber-300 bg-white px-3 py-2 font-semibold hover:bg-amber-100 disabled:opacity-50">
                {busy ? "Đang xử lý…" : "Rút yêu cầu"}
              </button>
            </div>}
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {profileFields.map(field => <div key={field} className="rounded-lg bg-slate-50 p-3 text-sm"><dt className="text-slate-600">{profileLabels[field]}</dt><dd className="mt-1 break-words font-medium">{profile[field] || "—"}</dd></div>)}
            </dl>
            {draft && !pending && <form onSubmit={submit} className="mt-5 border-t border-slate-200 pt-4">
              <h3 className="mb-3 font-semibold">Thông tin đề xuất</h3>
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 p-3">
                <EmployeeAvatar src={avatar ?? profile.avatar} className="size-14 text-xl" label="Ảnh đại diện xem trước" />
                <label className="grid min-w-0 gap-1 text-sm font-medium">
                  Chọn ảnh đại diện
                  <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy || readingAvatar} onChange={chooseAvatar} className="w-full max-w-xs text-sm file:mr-2 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:font-semibold file:text-brand" />
                  <span className="text-xs text-slate-600">JPG, PNG hoặc WebP, tối đa 512 KB.</span>
                </label>
                {avatar && <button type="button" disabled={busy || readingAvatar} onClick={() => setAvatar(null)} className="text-sm font-semibold text-brand underline">Bỏ ảnh đã chọn</button>}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {profileFields.map(field => <label key={field} className="grid gap-1 text-sm font-medium">
                  {profileLabels[field]}
                  <input type={field === "email" ? "email" : field === "phone" ? "tel" : "text"} required={field === "name"} maxLength={limits[field]} value={draft[field]} onChange={event => setDraft({ ...draft, [field]: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2.5" />
                </label>)}
              </div>
              <fieldset className="mt-4 space-y-3 rounded-lg bg-slate-50 p-3">
                <legend className="px-1 text-sm font-semibold">Mật khẩu đăng nhập</legend>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={changePassword} onChange={event => { setChangePassword(event.target.checked); resetPasswordDraft(); }} />
                  Gửi yêu cầu đổi mật khẩu
                </label>
                {changePassword && <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { label: "Mật khẩu hiện tại", value: currentPassword, set: setCurrentPassword, autoComplete: "current-password" },
                      { label: "Mật khẩu mới", value: newPassword, set: setNewPassword, autoComplete: "new-password" },
                      { label: "Nhập lại mật khẩu mới", value: confirmation, set: setConfirmation, autoComplete: "new-password" },
                    ].map(field => <label key={field.label} className="grid min-w-0 gap-1 text-sm font-medium">{field.label}
                      <input type="password" autoComplete={field.autoComplete} required maxLength={72} value={field.value} onChange={event => field.set(event.target.value)} className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5" />
                    </label>)}
                  </div>
                  {confirmation && newPassword !== confirmation && <p className="text-sm text-rose-700">Hai mật khẩu mới chưa khớp.</p>}
                  {currentPassword && currentPassword === newPassword && <p className="text-sm text-rose-700">Mật khẩu mới phải khác mật khẩu hiện tại.</p>}
                  <p className="text-sm text-slate-600">Mật khẩu mới có hiệu lực sau khi admin duyệt.</p>
                </>}
              </fieldset>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className={portalButton} disabled={busy || readingAvatar || !canSubmit}>{busy ? "Đang gửi…" : "Gửi admin duyệt"}</button>
                <button type="button" disabled={busy || readingAvatar} className="rounded-lg border border-slate-300 px-4 py-2 text-sm" onClick={() => { setDraft(null); setAvatar(null); resetPasswordDraft(); }}>Hủy</button>
              </div>
            </form>}
          </section>
          <section className={portalPanel}>
            <div className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold">Lịch sử yêu cầu</h2><button type="button" onClick={() => void load()} disabled={busy} className="text-sm font-semibold text-brand disabled:opacity-50">Tải lại</button></div>
            {data.requests.length ? <ul className="mt-2 divide-y divide-slate-100">
              {data.requests.map(item => <li key={item.id} className="py-3"><p className="mb-2 text-sm font-semibold text-brand">{requestLabels[item.status]} · {new Date(item.created_at).toLocaleDateString("vi-VN")}</p><ProfileChanges changes={item.changes} passwordChange={item.password_change} /></li>)}
            </ul> : <p className="mt-2 text-sm text-slate-600">Chưa có yêu cầu chỉnh sửa.</p>}
          </section>
        </>}
    </EmployeeLayout>
  );
}
