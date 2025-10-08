import { useEffect, useState } from "react";
import styles from "./NXB.module.scss";
import { useNxbApi } from "../../api/nxbApi";
import Modal from "../../components/Modal";
import { Plus, Search, Pencil, Trash2, Save, ChevronRight } from "lucide-react";

export default function NXB() {
  const api = useNxbApi();
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
      setErr(e.message || "Lỗi tải NXB");
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

  const startCreate = () => setEditing({});
  const startEdit = (row) => setEditing(row);

  const onSubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const payload = {
      tenNXB: f.get("tenNXB")?.trim(),
      diaChi: f.get("diaChi")?.trim() || null,
      SDT: f.get("SDT")?.trim() || null,
      email: f.get("email")?.trim() || null,
    };
    if (!payload.tenNXB) return alert("Vui lòng nhập tên NXB");
    if (payload.email && !/^\S+@\S+\.\S+$/.test(payload.email))
      return alert("Email không hợp lệ");

    setSaving(true);
    try {
      if (editing?.maNXB) await api.update(editing.maNXB, payload);
      else await api.create(payload);
      setEditing(null);
      await load();
    } catch (e2) {
      alert(e2.message || "Lỗi lưu NXB");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (row) => {
    if (!window.confirm(`Xoá NXB "${row.tenNXB}"?`)) return;
    try {
      await api.remove(row.maNXB);
      await load();
    } catch (e) {
      alert(
        e.message || "Không thể xoá (có thể đang được tham chiếu bởi sách)."
      );
    }
  };

  return (
    <>
      <div className={styles.tab}>
        <div className={styles.nd}>
          <span className={styles.item}>Quản lý sách</span>
          <ChevronRight className={styles.icon} />
          <span className={styles.ct}>Nhà xuất bản</span>
        </div>
      </div>
      <div className={styles.page}>
        <div className={styles.header}>
          <h2>Quản lý nhà xuất bản</h2>
          <div className={styles.tools}>
            <div className={styles.searchBox}>
              <Search className={styles.searchIcon} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo tên, email, SĐT, địa chỉ…"
              />
              {q && (
                <button className={styles.clear} onClick={() => setQ("")}>
                  ×
                </button>
              )}
            </div>
            <button className={styles.primary} onClick={startCreate}>
              <Plus size={18} /> Thêm NXB
            </button>
          </div>
        </div>

        {loading && <div className={styles.loading}>Đang tải…</div>}
        {err && !loading && <div className={styles.error}>{err}</div>}

        {!loading && !err && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã NXB</th>
                <th>Tên NXB</th>
                <th>Địa chỉ</th>
                <th>SĐT</th>
                <th>Email</th>
                <th style={{ width: 120 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.maNXB}>
                  <td>{r.maNXB}</td>
                  <td>{r.tenNXB}</td>
                  <td>{r.diaChi || "—"}</td>
                  <td>{r.SDT || "—"}</td>
                  <td>{r.email || "—"}</td>
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
            <h3>{editing.maNXB ? "Sửa NXB" : "Thêm NXB"}</h3>

            <label>Tên NXB</label>
            <input name="tenNXB" defaultValue={editing.tenNXB || ""} required />

            <div className={styles.grid2}>
              <div>
                <label>SĐT</label>
                <input name="SDT" defaultValue={editing.SDT || ""} />
              </div>
              <div>
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={editing.email || ""}
                />
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
