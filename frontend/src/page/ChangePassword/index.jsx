import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ChangePassword.module.scss";
import { changePassword } from "../../api/authApi"; // thêm ở dưới
import { Eye, EyeOff } from "lucide-react";

export default function ChangePasswordPage() {
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  const nav = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");

    if (!oldPwd || !newPwd || !confirm) {
      return setError("Vui lòng nhập đủ các trường.");
    }
    if (newPwd.length < 6) {
      return setError("Mật khẩu mới phải từ 6 ký tự trở lên.");
    }
    if (newPwd === oldPwd) {
      return setError("Mật khẩu mới phải khác mật khẩu cũ.");
    }
    if (newPwd !== confirm) {
      return setError("Xác nhận mật khẩu không khớp.");
    }

    try {
      setLoading(true);
      await changePassword({ oldPassword: oldPwd, newPassword: newPwd }); // POST /auth/change-password
      setLoading(false);
      setOk("Đổi mật khẩu thành công.");
      setOldPwd("");
      setNewPwd("");
      setConfirm("");
      // Nếu muốn ép đăng nhập lại:
      // localStorage.removeItem("token");
      // nav("/login", { replace: true });
    } catch (err) {
      setLoading(false);
      setError(err?.message || "Không thể đổi mật khẩu. Vui lòng thử lại.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <div className={styles.logoline1}></div>
        <div className={styles.logoline2}></div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <h2 className={styles.title}>Đổi mật khẩu</h2>

          {error && <div className={styles.err}>{error}</div>}
          {ok && <div className={styles.ok}>{ok}</div>}

          <label className={styles.label}>Mật khẩu hiện tại</label>
          <div className={styles.inputWrap}>
            <input
              className={styles.input}
              type={showOld ? "text" : "password"}
              value={oldPwd}
              onChange={(e) => setOldPwd(e.target.value)}
              placeholder="Nhập mật khẩu hiện tại"
            />
            <button
              type="button"
              className={styles.eye}
              onClick={() => setShowOld((v) => !v)}
              aria-label="Toggle mật khẩu hiện tại"
            >
              {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <label className={styles.label}>Mật khẩu mới</label>
          <div className={styles.inputWrap}>
            <input
              className={styles.input}
              type={showNew ? "text" : "password"}
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder="Ít nhất 6 ký tự"
            />
            <button
              type="button"
              className={styles.eye}
              onClick={() => setShowNew((v) => !v)}
              aria-label="Toggle mật khẩu mới"
            >
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <label className={styles.label}>Xác nhận mật khẩu mới</label>
          <div className={styles.inputWrap}>
            <input
              className={styles.input}
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
            />
            <button
              type="button"
              className={styles.eye}
              onClick={() => setShowConfirm((v) => !v)}
              aria-label="Toggle xác nhận mật khẩu"
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
          </button>

          <div className={styles.footer}>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                nav(-1);
              }}
            >
              ← Quay lại
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
