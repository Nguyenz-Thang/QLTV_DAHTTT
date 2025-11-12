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

  const handleLogin = (e) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    // Giả lập quá trình đăng nhập thành công
    setTimeout(() => {
      setLoading(false);
      // login giả (nếu bạn có context login thì có thể gọi login giả)
      // login({ tenDangNhap: username });
      nav("/home"); // chuyển sang trang home ngay
    }, 300);
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
          <a className={styles.forgotPassword} href="/forgot-password">
            Quên mật khẩu
          </a>
          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? "Đang..." : "ĐĂNG NHẬP"}
          </button>
        </form>
        <div className={styles.footer}>
          {/* <a className={styles.xongsexoa} href="/register">
            Đăng ký
          </a> */}
        </div>
      </div>
    </div>
  );
}
