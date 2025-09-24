import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import styles from "./Login.module.scss";
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
    <div className={styles.container}>
      <div className={styles.box}>
        <div className={styles.logoline1}></div>
        <div className={styles.logoline2}></div>
        <h2 className={styles.title}>ĐĂNG NHẬP</h2>
        {err && <div style={{ color: "red", marginBottom: "10px" }}>{err}</div>}
        <form onSubmit={handleLogin}>
          <label>
            <input
              className={styles.input}
              placeholder="Tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <div className={styles.key}></div>
          </label>

          <input
            className={styles.input}
            placeholder="Nhập mật khẩu"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? "Đang..." : "ĐĂNG NHẬP"}
          </button>
        </form>
        <div className={styles.footer}>
          Chưa có tài khoản? <a href="/register">Đăng ký</a>
        </div>
      </div>
    </div>
  );
}
