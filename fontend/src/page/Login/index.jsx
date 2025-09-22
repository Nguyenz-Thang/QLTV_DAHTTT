import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      // gọi backend login
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenDangNhap: username, matKhau: password }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        setErr(data.message || "Đăng nhập thất bại");
        return;
      }
      // lưu vào context + localStorage
      login(data);
      // chuyển sang trang sách
      nav("/sach");
    } catch (error) {
      setLoading(false);
      setErr(error.message || "Lỗi mạng");
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <h2>Đăng nhập</h2>
      {err && <div style={{ color: "crimson", marginBottom: 10 }}>{err}</div>}
      <form onSubmit={handleLogin}>
        <input
          placeholder="Tên đăng nhập"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 8 }}
        />
        <input
          placeholder="Mật khẩu"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 8 }}
        />
        <button type="submit" disabled={loading} style={{ padding: 10 }}>
          {loading ? "Đang..." : "Đăng nhập"}
        </button>
      </form>
      <div style={{ marginTop: 12 }}>
        Chưa có tài khoản? <a href="/register">Đăng ký</a>
      </div>
    </div>
  );
}
