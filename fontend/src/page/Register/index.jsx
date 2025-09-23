import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../../api/authApi";

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
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2>Đăng ký tài khoản</h2>

        {error && <div style={styles.err}>{error}</div>}

        <label style={styles.label}>Tên đăng nhập</label>
        <input
          style={styles.input}
          value={tenDangNhap}
          onChange={(e) => {
            setTenDangNhap(e.target.value);
            console.log(e.target.value);
          }}
          placeholder="Tên đăng nhập"
        />

        <label style={styles.label}>Mật khẩu</label>
        <input
          style={styles.input}
          type="password"
          value={matKhau}
          onChange={(e) => {
            setMatKhau(e.target.value);
            console.log(e.target.value);
          }}
          placeholder="Mật khẩu"
        />

        <label style={styles.label}>Xác nhận mật khẩu</label>
        <input
          style={styles.input}
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Xác nhận mật khẩu"
        />

        <label style={styles.label}>Vai trò</label>
        <select
          value={vaiTro}
          onChange={(e) => setVaiTro(e.target.value)}
          style={styles.select}
        >
          <option>Độc giả</option>
          <option>Nhân viên</option>
        </select>

        <button type="submit" style={styles.btn} disabled={loading}>
          {loading ? "Đang xử lý..." : "Đăng ký"}
        </button>

        <div style={styles.note}>
          Đã có tài khoản? <a href="/login">Đăng nhập</a>
        </div>
      </form>
    </div>
  );
}

const styles = {
  //   container: {
  //     display: "flex",
  //     justifyContent: "center",
  //     alignItems: "center",
  //     minHeight: "70vh",
  //   },
  //   form: {
  //     width: 360,
  //     padding: 20,
  //     boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  //     borderRadius: 8,
  //     background: "#fff",
  //   },
  //   label: { display: "block", marginTop: 12, marginBottom: 6, fontSize: 14 },
  //   input: {
  //     width: "100%",
  //     padding: 10,
  //     borderRadius: 6,
  //     border: "1px solid #ddd",
  //     boxSizing: "border-box",
  //   },
  //   select: {
  //     width: "100%",
  //     padding: 10,
  //     borderRadius: 6,
  //     border: "1px solid #ddd",
  //     boxSizing: "border-box",
  //   },
  //   btn: {
  //     marginTop: 16,
  //     width: "100%",
  //     padding: "10px 12px",
  //     borderRadius: 6,
  //     background: "#1976d2",
  //     color: "#fff",
  //     border: "none",
  //     cursor: "pointer",
  //   },
  //   err: {
  //     background: "#ffe6e6",
  //     color: "#cc0000",
  //     padding: 10,
  //     borderRadius: 6,
  //     marginBottom: 10,
  //   },
  //   note: { marginTop: 12, fontSize: 13, textAlign: "center" },
};
