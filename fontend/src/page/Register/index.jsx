import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../../api/authApi";
import styles from "./Register.module.scss";
export default function RegisterPage() {
  const [tenDangNhap, setTenDangNhap] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [confirm, setConfirm] = useState("");
  const [vaiTro, setVaiTro] = useState("Độc giả");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!tenDangNhap || !matKhau) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu.");
      return;
    }
    if (matKhau.length < 6) {
      setError("Mật khẩu phải từ 6 ký tự trở lên.");
      return;
    }
    if (matKhau !== confirm) {
      setError("Mật khẩu và xác nhận mật khẩu không khớp.");
      return;
    }

    try {
      setLoading(true);
      await register({ tenDangNhap, matKhau, vaiTro });
      setLoading(false);
      alert("Đăng ký thành công. Vui lòng đăng nhập.");
      nav("/login"); // chuyển về trang login ("/")
    } catch (err) {
      setLoading(false);
      // err có thể là object { message: '...' } hoặc lỗi fetch
      const msg = err?.message || err?.error || JSON.stringify(err);
      setError(msg);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <div className={styles.logoline1}></div>
        <div className={styles.logoline2}></div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <h2 className={styles.title}>Đăng ký tài khoản</h2>

          {error && <div className={styles.err}>{error}</div>}

          <label className={styles.label}>Tên đăng nhập</label>
          <input
            className={styles.input}
            value={tenDangNhap}
            onChange={(e) => {
              setTenDangNhap(e.target.value);
              console.log(e.target.value);
            }}
            placeholder="Tên đăng nhập"
          />

          <label className={styles.label}>Mật khẩu</label>
          <input
            className={styles.input}
            type="password"
            value={matKhau}
            onChange={(e) => {
              setMatKhau(e.target.value);
              console.log(e.target.value);
            }}
            placeholder="Mật khẩu"
          />

          <label className={styles.label}>Xác nhận mật khẩu</label>
          <input
            className={styles.input}
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Xác nhận mật khẩu"
          />

          <label className={styles.label}>Vai trò</label>
          <select
            value={vaiTro}
            onChange={(e) => setVaiTro(e.target.value)}
            className={styles.select}
          >
            <option>Độc giả</option>
            <option>Nhân viên</option>
          </select>

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? "Đang xử lý..." : "Đăng ký"}
          </button>

          <div className={styles.footer}>
            Đã có tài khoản? <a href="/login">Đăng nhập</a>
          </div>
        </form>
      </div>
    </div>
  );
}
