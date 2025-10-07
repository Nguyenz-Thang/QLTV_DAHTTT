import { useEffect, useState } from "react";
import styles from "./Accounts.module.scss";
import { useAccountsApi } from "../../api/accountsApi";
import Modal from "../../components/Modal";
import { Plus, Search, Pencil, Trash2, KeyRound, Save } from "lucide-react";

const ROLES = ["Độc giả", "Thủ thư", "Quản lý"];

export default function Accounts() {
  const api = useAccountsApi();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  const [editing, setEditing] = useState(null); // null | {} | row
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      const data = q.trim() ? await api.search(q.trim()) : await api.list();
      setRows(data.data || data || []);
    } catch (e) {
      setErr(e.message || "Lỗi tải tài khoản");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, []);
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t); /* eslint-disable-next-line */
  }, [q]);

  const startCreate = () => setEditing({ vaiTro: "Độc giả" });
  const startEdit = (row) => setEditing(row);

  const onSubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const payload = {
      tenDangNhap: f.get("tenDangNhap")?.trim(),
      vaiTro: f.get("vaiTro"),
      maDG: f.get("maDG")?.trim() || null,
      maTT: f.get("maTT")?.trim() || null,
      matKhau: f.get("matKhau")?.trim() || null, // chỉ dùng khi tạo mới
    };

    if (!payload.tenDangNhap) return alert("Nhập tên đăng nhập");
    if (!editing?.maTK && (!payload.matKhau || payload.matKhau.length < 6))
      return alert("Mật khẩu tối thiểu 6 ký tự");
    if (payload.vaiTro === "Độc giả" && !payload.maDG)
      return alert("Chọn/nhập mã độc giả (maDG)");
    if (payload.vaiTro === "Thủ thư" && !payload.maTT)
      return alert("Chọn/nhập mã thủ thư (maTT)");
    if (payload.vaiTro === "Quản lý") {
      payload.maDG = null;
      payload.maTT = null;
    }

    setSaving(true);
    try {
      if (editing?.maTK) {
        delete payload.matKhau;
        await api.update(editing.maTK, payload);
      } else {
        await api.create(payload);
      }
      setEditing(null);
      await load();
    } catch (e2) {
      alert(e2.message || "Lưu tài khoản thất bại");
    } finally {
      setSaving(false);
    }
  };

  const onResetPass = async (row) => {
    const p = window.prompt(`Nhập mật khẩu mới cho ${row.tenDangNhap}:`);
    if (!p) return;
    if (p.length < 6) return alert("Mật khẩu tối thiểu 6 ký tự");
    try {
      await api.resetPassword(row.maTK, p);
      alert("Đặt lại mật khẩu thành công");
    } catch (e) {
      alert(e.message || "Không thể đặt lại mật khẩu");
    }
  };

  const onDelete = async (row) => {
    if (!window.confirm(`Xoá tài khoản "${row.tenDangNhap}"?`)) return;
    try {
      await api.remove(row.maTK);
      await load();
    } catch (e) {
      alert(e.message || "Không thể xoá");
    }
  };

  const vRole = editing?.vaiTro || "Độc giả";

  return (
    <>
      <div className={styles.tab}></div>
      <div className={styles.page}>
        <div className={styles.header}>
          <h2>Quản lý tài khoản</h2>
          <div className={styles.tools}>
            <div className={styles.searchBox}>
              <Search className={styles.searchIcon} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo tên đăng nhập, vai trò, họ tên liên kết…"
              />
              {q && (
                <button className={styles.clear} onClick={() => setQ("")}>
                  ×
                </button>
              )}
            </div>
            <button className={styles.primary} onClick={startCreate}>
              <Plus size={18} /> Thêm tài khoản
            </button>
          </div>
        </div>

        {loading && <div className={styles.loading}>Đang tải…</div>}
        {err && !loading && <div className={styles.error}>{err}</div>}

        {!loading && !err && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã TK</th>
                <th>Tên đăng nhập</th>
                <th>Vai trò</th>
                <th>Liên kết</th>
                <th>Ngày tạo</th>
                <th style={{ width: 160 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.maTK}>
                  <td>{r.maTK}</td>
                  <td>{r.tenDangNhap}</td>
                  <td>{r.vaiTro}</td>
                  <td>
                    {r.vaiTro === "Độc giả" && (r.tenDG || r.maDG || "—")}
                    {r.vaiTro === "Thủ thư" && (r.tenTT || r.maTT || "—")}
                    {r.vaiTro === "Quản lý" && "—"}
                  </td>
                  <td>
                    {r.ngayTao ? new Date(r.ngayTao).toLocaleString() : "—"}
                  </td>
                  <td className={styles.actions}>
                    <button
                      className={styles.edit}
                      onClick={() => startEdit(r)}
                      title="Sửa"
                    >
                      <Pencil />
                    </button>
                    <button
                      className={styles.reset}
                      onClick={() => onResetPass(r)}
                      title="Đặt lại mật khẩu"
                    >
                      <KeyRound />
                    </button>
                    <button
                      className={styles.delete}
                      onClick={() => onDelete(r)}
                      title="Xoá"
                    >
                      <Trash2 />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: 16 }}>
                    Không có dữ liệu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={!!editing}
        onRequestClose={() => setEditing(null)}
        bodyOpenClassName="modal-custom-body"
      >
        {editing && (
          <form className={styles.form} onSubmit={onSubmit}>
            <h3>{editing.maTK ? "Sửa tài khoản" : "Thêm tài khoản"}</h3>

            <label>Tên đăng nhập</label>
            <input
              name="tenDangNhap"
              defaultValue={editing.tenDangNhap || ""}
              required
            />

            {!editing?.maTK && (
              <>
                <label>Mật khẩu</label>
                <input
                  name="matKhau"
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                />
              </>
            )}

            <label>Vai trò</label>
            <select
              name="vaiTro"
              defaultValue={editing.vaiTro || "Độc giả"}
              onChange={(e) =>
                setEditing((ed) => ({ ...ed, vaiTro: e.target.value }))
              }
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {vRole === "Độc giả" && (
              <>
                <label>Mã độc giả (maDG)</label>
                <input
                  name="maDG"
                  defaultValue={editing.maDG || ""}
                  placeholder="VD: DG001"
                />
              </>
            )}
            {vRole === "Thủ thư" && (
              <>
                <label>Mã thủ thư (maTT)</label>
                <input
                  name="maTT"
                  defaultValue={editing.maTT || ""}
                  placeholder="VD: TT001"
                />
              </>
            )}

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.ghost}
                onClick={() => setEditing(null)}
              >
                Hủy
              </button>
              <button className={styles.primary} disabled={saving}>
                <Save size={16} /> {saving ? "Đang lưu…" : "Lưu"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
