import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function Attendance() {
  const [checkIn, setCheckIn] = useState<string | null>(null);

  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<any>(null);

  // modal reason
  const [showReasonModal, setShowReasonModal] = useState(false);

  const [reasonType, setReasonType] = useState<"late" | "leave" | null>(null);

  const [reason, setReason] = useState("");

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [historyAttendance, setHistoryAttendance] = useState<any>(null);
  // lấy user login
  const employee = {
    id: 33,
    username: "Khoa Test",
  };
  const fetchAttendanceByDate = async (date: string) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/attendance/history/${employee.id}?date=${date}`,
      );

      setHistoryAttendance(res.data);
    } catch (err) {
      console.log(err);
    }
  };
  React.useEffect(() => {
    fetchAttendanceByDate(selectedDate);
  }, [selectedDate]);
  // =========================
  // GET MY ATTENDANCE
  // =========================

  const fetchMyAttendance = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/attendance/my/${employee.id}`,
      );

      setAttendanceStatus(res.data);
    } catch (err) {
      console.log(err);
    }
  };
  React.useEffect(() => {
    fetchMyAttendance();
  }, []);
  // =========================
  // CHECK IN
  // =========================
  const handleCheckIn = async () => {
    try {
      const currentTime = new Date().toTimeString().split(" ")[0];

      // đi trễ => mở modal nhập lý do
      if (currentTime > "17:00:00") {
        setReasonType("late");

        setShowReasonModal(true);

        return;
      }

      const res = await axios.post(
        "http://localhost:5000/api/attendance/checkin",
        {
          employee_id: employee.id || 11,
          status: "present",
          reason: "",
        },
      );

      setCheckIn(res.data.time);
      fetchMyAttendance();

      toast.success("Check in thành công 🎉");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Check in thất bại");
    }
  };

  // =========================
  // CHECK OUT
  // =========================
  const handleCheckOut = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/attendance/checkout",
        {
          employee_id: employee.id || 11,
        },
      );

      setCheckOut(res.data.time);
      fetchMyAttendance();

      toast.success("Check out thành công 👋");
    } catch (err) {
      console.log(err);

      toast.error("Check out thất bại");
    }
  };

  // =========================
  // LEAVE
  // =========================
  const handleLeave = async () => {
    setReasonType("leave");

    setShowReasonModal(true);
  };

  // =========================
  // SUBMIT REASON
  // =========================
  const submitReason = async () => {
    try {
      if (!reason.trim()) {
        toast.error("Vui lòng nhập lý do");

        return;
      }

      // đi trễ
      if (reasonType === "late") {
        const res = await axios.post(
          "http://localhost:5000/api/attendance/checkin",
          {
            employee_id: employee.id || 11,
            status: "late",
            reason,
          },
        );

        setCheckIn(res.data.time);

        toast.success("Check in thành công 🎉");
      }

      // nghỉ phép
      if (reasonType === "leave") {
        await axios.post("http://localhost:5000/api/attendance/checkin", {
          employee_id: employee.id || 11,
          status: "leave",
          reason,
        });

        toast.success("Đã gửi đơn nghỉ phép 📝");
        fetchMyAttendance();
      }

      setReason("");

      setShowReasonModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* HEADER */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                {employee.username.charAt(0)}
              </div>

              <div>
                <h1 className="text-3xl font-bold text-slate-800">
                  Xin chào 👋
                </h1>

                <p className="text-slate-500 mt-1 text-lg">
                  {employee.username}
                </p>

                <p className="text-slate-400 text-sm mt-1">
                  Employee ID: #{employee.id}
                </p>
              </div>
            </div>

            <div className="bg-cyan-50 border border-cyan-100 px-6 py-4 rounded-2xl">
              <p className="text-slate-500 text-sm">Hôm nay</p>

              <h2 className="text-xl font-bold text-cyan-700">
                {new Date().toLocaleDateString("vi-VN")}
              </h2>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="grid md:grid-cols-3 gap-6">
          <button
            onClick={handleCheckIn}
            className="bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-3xl p-8 shadow-lg hover:scale-105 transition-all text-left"
          >
            <div className="text-5xl mb-5">✅</div>

            <h2 className="text-2xl font-bold text-white mb-2">Check In</h2>

            <p className="text-emerald-50">Bắt đầu ngày làm việc</p>
          </button>

          <button
            onClick={handleCheckOut}
            className="bg-gradient-to-br from-rose-400 to-red-500 rounded-3xl p-8 shadow-lg hover:scale-105 transition-all text-left"
          >
            <div className="text-5xl mb-5">👋</div>

            <h2 className="text-2xl font-bold text-white mb-2">Check Out</h2>

            <p className="text-rose-50">Kết thúc ca làm việc</p>
          </button>

          <button
            onClick={handleLeave}
            className="bg-gradient-to-br from-amber-300 to-orange-400 rounded-3xl p-8 shadow-lg hover:scale-105 transition-all text-left"
          >
            <div className="text-5xl mb-5">📝</div>

            <h2 className="text-2xl font-bold text-white mb-2">Xin Nghỉ</h2>

            <p className="text-amber-50">Gửi yêu cầu nghỉ phép</p>
          </button>
        </div>

        {/* STATUS */}
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100">
            <p className="text-slate-400 mb-2">Giờ Check In</p>

            <h2 className="text-3xl font-bold text-emerald-500">
              {checkIn || "--:--:--"}
            </h2>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100">
            <p className="text-slate-400 mb-2">Giờ Check Out</p>

            <h2 className="text-3xl font-bold text-rose-500">
              {checkOut || "--:--:--"}
            </h2>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100">
            <p className="text-slate-400 mb-2">Trạng thái</p>

            <div
              className={`inline-flex px-5 py-2 rounded-2xl text-lg font-bold ${
                attendanceStatus?.status === "present"
                  ? "bg-emerald-100 text-emerald-600"
                  : attendanceStatus?.status === "late"
                    ? "bg-yellow-100 text-yellow-700"
                    : attendanceStatus?.status === "leave"
                      ? "bg-rose-100 text-rose-600"
                      : "bg-slate-100 text-slate-500"
              }`}
            >
              {attendanceStatus?.status || "Chưa check in"}
            </div>
          </div>
        </div>
        <div className="mt-6 bg-white rounded-3xl shadow-md border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-bold text-slate-800">
              Lịch sử chấm công
            </h2>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-2"
            />
          </div>

          {historyAttendance ? (
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-slate-400 text-sm">Check In</p>

                <h2 className="text-xl font-bold text-emerald-500 mt-2">
                  {historyAttendance.check_in || "--:--"}
                </h2>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-slate-400 text-sm">Check Out</p>

                <h2 className="text-xl font-bold text-rose-500 mt-2">
                  {historyAttendance.check_out || "--:--"}
                </h2>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-slate-400 text-sm">Trạng thái</p>

                <h2 className="text-xl font-bold text-cyan-600 mt-2">
                  {historyAttendance.status || "Không có"}
                </h2>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-slate-400 text-sm">Lý do</p>

                <h2 className="text-lg font-semibold text-slate-700 mt-2">
                  {historyAttendance.reason || "Không có"}
                </h2>
              </div>
            </div>
          ) : (
            <div className="text-slate-400">Không có dữ liệu</div>
          )}
        </div>
        {/* LEAVE STATUS */}
        {attendanceStatus?.status === "leave" && (
          <div className="mt-6 bg-white rounded-3xl shadow-md border border-slate-100 p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Trạng thái đơn nghỉ
            </h2>

            {attendanceStatus.leave_status === "pending" && (
              <div className="bg-yellow-100 text-yellow-700 px-5 py-4 rounded-2xl font-semibold">
                ⏳ Đơn nghỉ đang chờ duyệt
              </div>
            )}

            {attendanceStatus.leave_status === "approved" && (
              <div className="bg-emerald-100 text-emerald-700 px-5 py-4 rounded-2xl font-semibold">
                ✅ Đơn nghỉ đã được duyệt
              </div>
            )}

            {attendanceStatus.leave_status === "rejected" && (
              <div className="bg-rose-100 text-rose-700 px-5 py-4 rounded-2xl font-semibold">
                ❌ Đơn nghỉ bị từ chối
              </div>
            )}

            {attendanceStatus.reason && (
              <div className="mt-4 text-slate-600">
                <span className="font-semibold">Lý do:</span>{" "}
                {attendanceStatus.reason}
              </div>
            )}
          </div>
        )}

        {/* MODAL */}
        {showReasonModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">
                {reasonType === "late" ? "Lý do đi trễ" : "Đơn xin nghỉ phép"}
              </h2>

              <p className="text-slate-500 mb-6">Vui lòng nhập lý do của bạn</p>

              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập lý do..."
                className="w-full h-40 border border-slate-200 rounded-2xl p-5 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => {
                    setShowReasonModal(false);
                    setReason("");
                  }}
                  className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 transition"
                >
                  Hủy
                </button>

                <button
                  onClick={submitReason}
                  className="px-6 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
