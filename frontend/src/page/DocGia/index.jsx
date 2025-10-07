import { useEffect, useMemo, useState } from "react";
import styles from "./DocGia.module.scss";
import { useDocGiaApi } from "../../api/docGiaApi";
import Modal from "../../components/Modal";
import { Search, Plus, Pencil, Trash2, Save } from "lucide-react";

export default function DocGia() {
  const api = useDocGiaApi();
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
      setErr(e.message || "Lỗi tải độc giả");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, []);
  useEffect(() => {
    const t = setTimeout(load, 300); // debounce search
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [q]);

  const filtered = useMemo(() => rows, [rows]);

  const startCreate = () => setEditing({});
  const startEdit = (row) => setEditing(row);

  const onSubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const payload = {
      MSV: f.get("MSV")?.trim() || null,
      hoTen: f.get("hoTen")?.trim(),
      gioiTinh: f.get("gioiTinh") || null,
      ngaySinh: f.get("ngaySinh") || null,
      lop: f.get("lop")?.trim() || null,
      khoa: f.get("khoa")?.trim() || null,
      email: f.get("email")?.trim() || null,
      SDT: f.get("SDT")?.trim() || null,
      diaChi: f.get("diaChi")?.trim() || null,
    };
    if (!payload.hoTen) return alert("Vui lòng nhập họ tên");
    if (payload.email && !/^\S+@\S+\.\S+$/.test(payload.email))
      return alert("Email không hợp lệ");

    setSaving(true);
    try {
      if (editing?.maDG) await api.update(editing.maDG, payload);
      else await api.create(payload);
      setEditing(null);
      await load();
    } catch (e2) {
      alert(e2.message || "Lỗi lưu độc giả");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (row) => {
    if (!window.confirm(`Xóa độc giả "${row.hoTen}"?`)) return;
    try {
      await api.remove(row.maDG);
      await load();
    } catch (e) {
      alert(
        e.message ||
          "Không thể xóa (có thể đang được tham chiếu bởi phiếu mượn/tài khoản)."
      );
    }
  };

  return (
    <>
      <div className={styles.tab}></div>
      <div className={styles.page}>
        <div className={styles.header}>
          <h2>Quản lý độc giả</h2>
          <div className={styles.tools}>
            <div className={styles.searchBox}>
              <Search className={styles.searchIcon} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo họ tên, MSV, email, khoa, lớp, SĐT…"
              />
              {q && (
                <button className={styles.clear} onClick={() => setQ("")}>
                  ×
                </button>
              )}
            </div>
            <button className={styles.primary} onClick={startCreate}>
              <Plus size={18} /> Thêm độc giả
            </button>
          </div>
        </div>

        {loading && <div className={styles.loading}>Đang tải…</div>}
        {err && !loading && <div className={styles.error}>{err}</div>}

        {!loading && !err && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã DG</th>
                <th>Họ tên</th>
                <th>MSV</th>
                <th>Khoa</th>
                <th>Lớp</th>
                <th>Email</th>
                <th>SDT</th>
                <th style={{ width: 120 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.maDG}>
                  <td>{r.maDG}</td>
                  <td>{r.hoTen}</td>
                  <td>{r.MSV || "—"}</td>
                  <td>{r.khoa || "—"}</td>
                  <td>{r.lop || "—"}</td>
                  <td>{r.email || "—"}</td>
                  <td>{r.SDT || "—"}</td>
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
                      title="Xóa"
                    >
                      <Trash2 />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: 16 }}>
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
            <h3>{editing.maDG ? "Sửa độc giả" : "Thêm độc giả"}</h3>

            <div className={styles.grid2}>
              <div>
                <label>Họ tên</label>
                <input
                  name="hoTen"
                  defaultValue={editing.hoTen || ""}
                  required
                />
              </div>
              <div>
                <label>MSV</label>
                <input
                  name="MSV"
                  defaultValue={editing.MSV || ""}
                  placeholder="Mã sinh viên (nếu có)"
                />
              </div>
            </div>

            <div className={styles.grid3}>
              <div>
                <label>Giới tính</label>
                <select name="gioiTinh" defaultValue={editing.gioiTinh || ""}>
                  <option value="">-- Chọn --</option>
                  <option>Nam</option>
                  <option>Nữ</option>
                  <option>Khác</option>
                </select>
              </div>
              <div>
                <label>Ngày sinh</label>
                <input
                  type="date"
                  name="ngaySinh"
                  defaultValue={
                    editing.ngaySinh
                      ? String(editing.ngaySinh).slice(0, 10)
                      : ""
                  }
                />
              </div>
              <div>
                <label>SĐT</label>
                <input name="SDT" defaultValue={editing.SDT || ""} />
              </div>
            </div>

            <div className={styles.grid2}>
              <div>
                <label>Khoa</label>
                <input name="khoa" defaultValue={editing.khoa || ""} />
              </div>
              <div>
                <label>Lớp</label>
                <input name="lop" defaultValue={editing.lop || ""} />
              </div>
            </div>

            <label>Email</label>
            <input
              name="email"
              type="email"
              defaultValue={editing.email || ""}
            />

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
