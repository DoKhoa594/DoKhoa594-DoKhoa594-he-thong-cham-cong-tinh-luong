import axios from "axios";

export const attendanceApi = "http://localhost:5000/api/attendance";
export const todayVN = (time = Date.now()) => new Date(time + 7 * 3600000).toISOString().slice(0, 10);

export const leaveLabels = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Đã từ chối",
};

export type LeaveRequest = {
  id: number;
  employee_id: number;
  date: string;
  reason: string | null;
  leave_status: keyof typeof leaveLabels;
  code: string | null;
  name: string | null;
};

export function attendanceError(error: unknown) {
  return axios.isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message ?? "Không thể cập nhật chấm công."
    : "Không thể cập nhật chấm công.";
}
