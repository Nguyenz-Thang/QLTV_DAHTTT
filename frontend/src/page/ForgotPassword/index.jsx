import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ForgotPassword.module.scss";

export default function ChangePasswordPage() {
  const [step, setStep] = useState(1); // 1: nhập email -> gửi mã, 2: nhập mã + mật khẩu mới
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0); // đếm ngược gửi lại mã
  const nav = useNavigate();

  // Đếm ngược resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email) return setError("Vui lòng nhập email.");
    // TODO: gọi API gửi mã: await authApi.sendResetCode({ email });
    setStep(2);
    setCooldown(60); // 60s cho gửi lại
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError(null);
    if (!code) return setError("Vui lòng nhập mã xác nhận.");
    if (newPwd.length < 6)
      return setError("Mật khẩu mới phải từ 6 ký tự trở lên.");
    if (newPwd !== confirm) return setError("Mật khẩu xác nhận không khớp.");

    try {
      setLoading(true);
      // TODO: gọi API đổi mật khẩu:
      // await authApi.resetPassword({ email, code, newPassword: newPwd });
      setLoading(false);
      alert("Đổi mật khẩu thành công. Vui lòng đăng nhập.");
      nav("/login", { replace: true });
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

        <form
          onSubmit={step === 1 ? handleSendCode : handleReset}
          className={styles.form}
        >
          <h2 className={styles.title}>Thay đổi mật khẩu</h2>
          <img className={styles.imgForgotPass} alt="" />
          {error && <div className={styles.err}>{error}</div>}

          {/* Bước 1: Nhập email để nhận mã */}
          {step === 1 && (
            <>
              <label className={styles.label}>Email</label>
              <input
                className={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email đã đăng ký"
              />

              <button type="submit" className={styles.btn}>
                Gửi mã xác nhận
              </button>

              <div className={styles.footer}>
                Nhớ mật khẩu? <a href="/login">Đăng nhập</a>
              </div>
            </>
          )}

          {/* Bước 2: Nhập mã + mật khẩu mới */}
          {step === 2 && (
            <>
              <label className={styles.label}>Email</label>
              <input
                className={styles.input}
                type="email"
                value={email}
                readOnly
              />

              <label className={styles.label}>Mã xác nhận</label>
              <div className={styles.codeRow}>
                <input
                  className={styles.input}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Nhập mã gồm 6 chữ số"
                />
                <button
                  type="button"
                  className={styles.btnSecondary}
                  disabled={cooldown > 0}
                  onClick={() => setCooldown(60)} // TODO: gọi lại API send code
                  title={
                    cooldown > 0 ? `Gửi lại sau ${cooldown}s` : "Gửi lại mã"
                  }
                >
                  {cooldown > 0 ? `Gửi lại (${cooldown})` : "Gửi lại mã"}
                </button>
              </div>

              <label className={styles.label}>Mật khẩu mới</label>
              <input
                className={styles.input}
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="Nhập mật khẩu mới"
              />

              <label className={styles.label}>Xác nhận mật khẩu mới</label>
              <input
                className={styles.input}
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
              />

              <button type="submit" className={styles.btn} disabled={loading}>
                {loading ? "Đang xử lý..." : "Xác nhận đổi mật khẩu"}
              </button>

              <div className={styles.footer}>
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={() => setStep(1)}
                >
                  ← Quay lại nhập email
                </button>
                <span> · </span>
                <a href="/login">Đăng nhập</a>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
