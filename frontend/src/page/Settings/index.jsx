import { useState } from "react";
import styles from "./Settings.module.scss";
import { Eye, EyeOff } from "lucide-react";
import { changePassword } from "../../api/authApi";

export default function Settings() {
  return (
    <>
      <div className={styles.tab}></div>
      <div className={styles.page}>
        <div className={styles.header}>
          <h2>Cài đặt</h2>
        </div>

        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Đổi mật khẩu</h3>
          <ChangePasswordCard />
        </section>
      </div>
    </>
  );
}

function ChangePasswordCard() {
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setOk("");
    setErr("");

    if (!oldPwd || !newPwd || !confirm)
      return setErr("Vui lòng nhập đủ các trường.");
    if (newPwd.length < 6) return setErr("Mật khẩu mới phải từ 6 ký tự.");
    if (newPwd === oldPwd) return setErr("Mật khẩu mới phải khác mật khẩu cũ.");
    if (newPwd !== confirm) return setErr("Xác nhận mật khẩu không khớp.");

    try {
      setLoading(true);
      await changePassword({ oldPassword: oldPwd, newPassword: newPwd });
      setOk("Đổi mật khẩu thành công.");
      setOldPwd("");
      setNewPwd("");
      setConfirm("");
    } catch (e2) {
      setErr(e2.message || "Không thể đổi mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      {err && <div className={styles.err}>{err}</div>}
      {ok && <div className={styles.ok}>{ok}</div>}

      <label>Mật khẩu hiện tại</label>
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
        >
          {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <label>Mật khẩu mới</label>
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
        >
          {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <label>Xác nhận mật khẩu mới</label>
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
        >
          {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <div className={styles.actions}>
        <button className={styles.primary} disabled={loading}>
          {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
        </button>
      </div>
    </form>
  );
}
