import { useEffect, useState } from "react";
import styles from "./ThuThu.module.scss";
import Modal from "../../components/Modal";
import { useThuThuApi } from "../../api/thuThuApi";
import { Plus, Search, Pencil, Trash2, Save } from "lucide-react";

export default function ThuThu() {
  const api = useThuThuApi();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [editing, setEditing] = useState(null); // null | {} | row
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      const data = q.trim() ? await api.search(q.trim()) : await api.list();
      setRows(data.data || data || []);
    } catch (e) {
      setErr(e.message || "Lỗi tải dữ liệu");
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

  const startCreate = () => setEditing({});
  const startEdit = (r) => setEditing(r);

  const onSubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const payload = {
      tenTT: f.get("tenTT")?.trim(),
      ngaySinh: f.get("ngaySinh") || null,
      SDT: f.get("SDT")?.trim() || null,
      cccd: f.get("cccd")?.trim() || null,
      email: f.get("email")?.trim() || null,
      diaChi: f.get("diaChi")?.trim() || null,
      chucVu: f.get("chucVu")?.trim() || null,
    };
    if (!payload.tenTT) return alert("Vui lòng nhập tên thủ thư");
    if (payload.email && !/^\S+@\S+\.\S+$/.test(payload.email))
      return alert("Email không hợp lệ");

    setSaving(true);
    try {
      if (editing?.maTT) await api.update(editing.maTT, payload);
      else await api.create(payload);
      setEditing(null);
      await load();
    } catch (e2) {
      alert(e2.message || "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (r) => {
    if (!window.confirm(`Xoá thủ thư "${r.tenTT}"?`)) return;
    try {
      await api.remove(r.maTT);
      await load();
    } catch (e) {
      alert(
        e.message || "Không thể xoá (có thể đang được liên kết tài khoản)."
      );
    }
  };

  return (
    <>
      <div className={styles.tab}></div>
      <div className={styles.page}>
        <div className={styles.header}>
          <h2>Quản lý thủ thư</h2>
          <div className={styles.tools}>
            <div className={styles.searchBox}>
              <Search className={styles.searchIcon} />
              <input
                placeholder="Tìm theo tên, email, SĐT, CCCD…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {q && (
                <button className={styles.clear} onClick={() => setQ("")}>
                  ×
                </button>
              )}
            </div>
            <button className={styles.primary} onClick={startCreate}>
              <Plus size={18} /> Thêm thủ thư
            </button>
          </div>
        </div>

        {loading && <div className={styles.loading}>Đang tải…</div>}
        {err && !loading && <div className={styles.error}>{err}</div>}

        {!loading && !err && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã TT</th>
                <th>Tên</th>
                <th>Ngày sinh</th>
                <th>SĐT</th>
                <th>CCCD</th>
                <th>Email</th>
                <th>Địa chỉ</th>
                <th>Chức vụ</th>
                <th style={{ width: 120 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.maTT}>
                  <td>{r.maTT}</td>
                  <td>{r.tenTT}</td>
                  <td>
                    {r.ngaySinh
                      ? new Date(r.ngaySinh).toLocaleDateString()
                      : "—"}
                  </td>
                  <td>{r.SDT || "—"}</td>
                  <td>{r.cccd || "—"}</td>
                  <td>{r.email || "—"}</td>
                  <td>{r.diaChi || "—"}</td>
                  <td>{r.chucVu || "—"}</td>
                  <td className={styles.actions}>
                    <button
                      className={styles.edit}
                      onClick={() => startEdit(r)}
                      title="Sửa"
                    >
                      <Pencil />
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
                  <td colSpan="9" style={{ textAlign: "center", padding: 16 }}>
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
            <h3>{editing.maTT ? "Sửa thủ thư" : "Thêm thủ thư"}</h3>

            <label>Họ tên</label>
            <input name="tenTT" defaultValue={editing.tenTT || ""} required />

            <div className={styles.grid3}>
              <div>
                <label>Ngày sinh</label>
                <input
                  type="date"
                  name="ngaySinh"
                  defaultValue={
                    editing.ngaySinh ? editing.ngaySinh.substring(0, 10) : ""
                  }
                />
              </div>
              <div>
                <label>SĐT</label>
                <input name="SDT" defaultValue={editing.SDT || ""} />
              </div>
              <div>
                <label>CCCD</label>
                <input name="cccd" defaultValue={editing.cccd || ""} />
              </div>
            </div>

            <div className={styles.grid2}>
              <div>
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={editing.email || ""}
                />
              </div>
              <div>
                <label>Chức vụ</label>
                <input name="chucVu" defaultValue={editing.chucVu || ""} />
              </div>
            </div>

            <label>Địa chỉ</label>
            <textarea
              name="diaChi"
              rows="2"
              defaultValue={editing.diaChi || ""}
            />

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
