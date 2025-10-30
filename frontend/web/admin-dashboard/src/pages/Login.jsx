import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authAPI from "../api/authAPI";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await authAPI.login(form);
      // Chuẩn: backend trả về { token: string }
      localStorage.setItem("access_token", res.data.token);
      navigate("/overview");
    } catch (err) {
      console.error(err);
      setError("Sai tài khoản hoặc mật khẩu!");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-ev-deep/5">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-md w-96 space-y-4"
      >
        <h1 className="text-2xl font-semibold text-ev-gunmetal text-center">
          Admin Login
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full border p-2 rounded-lg"
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full border p-2 rounded-lg"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          className="w-full bg-ev-teal text-white font-medium py-2 rounded-lg hover:bg-ev-deep"
        >
          Đăng nhập
        </button>
      </form>
    </div>
  );
}

export default Login;
