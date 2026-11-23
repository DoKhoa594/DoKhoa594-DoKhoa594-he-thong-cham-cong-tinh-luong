export const portalApi = "http://localhost:5000/api";
export const profileLabels = {
  name: "Họ và tên",
  email: "Email",
  phone: "Số điện thoại",
  address: "Địa chỉ",
};
export type ProfileField = keyof typeof profileLabels;
export type ProfileChangeField = ProfileField | "avatar";
export const profileFields = Object.keys(profileLabels) as ProfileField[];
export const requestLabels = { pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Đã từ chối", withdrawn: "Đã rút" };
export type ProfileRequest = {
  id: number;
  employee_id?: number;
  name?: string | null;
  code?: string | null;
  status: keyof typeof requestLabels;
  password_change?: boolean;
  changes: Partial<Record<ProfileChangeField, { from: string | null; to: string }>>;
  created_at: string;
  reviewed_at: string | null;
};
export const portalPanel = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
export const portalButton = "rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50";
