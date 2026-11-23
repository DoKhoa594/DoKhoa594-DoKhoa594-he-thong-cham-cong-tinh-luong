import axios from "axios";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post("http://localhost:5000/api/session", { username, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate(data.user.role === "admin" ? "/admin" : "/user");
    } catch (error) {
      setError(axios.isAxiosError(error) ? error.response?.data?.message ?? "Không thể đăng nhập." : "Không thể đăng nhập.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-brand-navy p-4">
      <form onSubmit={handleLogin} className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-brand">Quản lý nhân sự</p>
        <h1 className="mb-6 mt-2 text-3xl font-semibold tracking-tight">Đăng nhập</h1>

        <label className="mb-4 block text-sm font-medium">
          Mã nhân viên hoặc tên quản trị
          <input
            type="text" required maxLength={64}
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5"
          />
        </label>

        <label className="mb-6 block text-sm font-medium">
          Mật khẩu
          <input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5" />
        </label>

        {error && <p role="alert" className="mb-3 text-sm text-rose-700">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
          {loading ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
        <p className="mt-4 text-sm text-slate-600">Bản local · Dùng <strong>user</strong> hoặc <strong>admin</strong> với mật khẩu trống để xem thử.</p>
      </form>
    </main>
  );
}
