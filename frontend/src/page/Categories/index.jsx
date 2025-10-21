import { useEffect, useMemo, useState } from "react";
import styles from "./Categories.module.scss";
import { useTheLoaiApi } from "../../api/theLoaiApi";
import { Search, Plus, Pencil, Trash2, ChevronRight } from "lucide-react";
import Modal from "../../components/Modal";

export default function Categories() {
  const api = useTheLoaiApi();
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(null); // null | {} (create) | row (edit)
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      const data = q.trim() ? await api.search(q.trim()) : await api.list();
      setList(data.data || data || []);
    } catch (e) {
      setErr(e.message || "Lỗi tải thể loại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, []);
  useEffect(() => {
    const t = setTimeout(load, 300); // debounce tìm kiếm
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [q]);

  const filtered = useMemo(() => list, [list]);

  const startCreate = () => setEditing({});
  const startEdit = (row) => setEditing(row);

  const onSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const payload = {
      tenTL: form.get("tenTL")?.trim(),
      moTa: form.get("moTa")?.trim(),
    };
    if (!payload.tenTL) return alert("Vui lòng nhập tên thể loại");
    setSaving(true);
    try {
      if (editing?.maTL) await api.update(editing.maTL, payload);
      else await api.create(payload);
      setEditing(null);
      await load();
    } catch (e2) {
      alert(e2.message || "Lỗi lưu thể loại");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (row) => {
    if (!window.confirm(`Xóa thể loại "${row.tenTL}"?`)) return;
    try {
      await api.remove(row.maTL);
      await load();
    } catch (e) {
      alert(e.message || "Không thể xóa. Có thể đang được dùng bởi Sách.");
    }
  };

  return (
    <>
      <div className={styles.tab}>
        <div className={styles.nd}>
          <span className={styles.item}>Quản lý sách</span>
          <ChevronRight className={styles.icon} />
          <span className={styles.ct}>Thể loại</span>
        </div>
      </div>
      <div className={styles.page}>
        <div className={styles.header}>
          <h2>Quản lý thể loại</h2>
          <div className={styles.tools}>
            <div className={styles.searchBox}>
              <Search className={styles.searchIcon} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm thể loại theo tên thể loại…"
              />
              {q && (
                <button
                  className={styles.clear}
                  onClick={() => setQ("")}
                  aria-label="Xóa tìm"
                >
                  ×
                </button>
              )}
            </div>
            <button className={styles.primary} onClick={startCreate}>
              <Plus size={18} /> Thêm thể loại
            </button>
          </div>
        </div>

        {loading && <div className={styles.loading}>Đang tải…</div>}
        {err && !loading && <div className={styles.error}>{err}</div>}

        {!loading && !err && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 160 }}>Mã TL</th>
                <th>Tên thể loại</th>
                <th style={{ width: "40%" }}>Mô tả</th>
                <th style={{ width: 140 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.maTL}>
                  <td>{r.maTL}</td>
                  <td>{r.tenTL}</td>
                  <td className={styles.descCell}>{r.moTa || "—"}</td>
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
                  <td colSpan="4" style={{ textAlign: "center", padding: 16 }}>
                    Không có dữ liệu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        <Modal
          isOpen={!!editing}
          onRequestClose={() => setEditing(null)}
          bodyOpenClassName="modal-custom-body"
        >
          {editing && (
            <form className={styles.form} onSubmit={onSubmit}>
              <h3>{editing.maTL ? "Sửa thể loại" : "Thêm thể loại"}</h3>

              {editing.maTL && (
                <>
                  <label>Mã TL</label>
                  <input value={editing.maTL} disabled />
                </>
              )}

              <label>Tên thể loại</label>
              <input name="tenTL" defaultValue={editing.tenTL || ""} required />

              <label>Mô tả</label>
              <textarea
                name="moTa"
                rows="3"
                defaultValue={editing.moTa || ""}
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
                  {saving ? "Đang lưu…" : "Lưu"}
                </button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </>
  );
}
