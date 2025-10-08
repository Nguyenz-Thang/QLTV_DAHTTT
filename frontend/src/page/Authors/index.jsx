import { useEffect, useMemo, useState } from "react";
import styles from "./Authors.module.scss";
import Modal from "../../components/Modal";
import { useTacGiaApi } from "../../api/tacGiaApi";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Save,
  X,
  ChevronRight,
} from "lucide-react";

export default function Authors() {
  const api = useTacGiaApi();
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
      const data = await api.list(q);
      setRows(data.data || data || []);
    } catch (e) {
      setErr(e.message || "Không tải được danh sách tác giả");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, []);
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [q]);

  const startCreate = () => setEditing({});
  const startEdit = (row) => setEditing(row);

  const onDelete = async (id) => {
    if (!window.confirm("Xóa tác giả này?")) return;
    try {
      await api.remove(id);
      await load();
    } catch (e) {
      alert(e.message || "Không thể xóa");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const payload = {
      tenTG: f.get("tenTG")?.trim(),
      thongTin: f.get("thongTin")?.trim() || null,
    };
    if (!payload.tenTG) return alert("Vui lòng nhập tên tác giả.");

    setSaving(true);
    try {
      if (editing?.maTG) await api.update(editing.maTG, payload);
      else await api.create(payload);
      setEditing(null);
      await load();
    } catch (e2) {
      alert(e2.message || "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className={styles.tab}>
        <div className={styles.nd}>
          <span className={styles.item}>Quản lý sách</span>
          <ChevronRight className={styles.icon} />
          <span className={styles.ct}>Tác giả</span>
        </div>
      </div>

      <div className={styles.page}>
        <div className={styles.header}>
          <h2>Quản lý tác giả</h2>
          <div className={styles.tools}>
            <div className={styles.searchBox}>
              <Search className={styles.searchIcon} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo mã/ tên tác giả…"
              />
              {q && (
                <button className={styles.clear} onClick={() => setQ("")}>
                  ×
                </button>
              )}
            </div>
            <button className={styles.primary} onClick={startCreate}>
              <Plus size={18} /> Thêm tác giả
            </button>
          </div>
        </div>

        {loading && <div className={styles.loading}>Đang tải…</div>}
        {err && !loading && <div className={styles.error}>{err}</div>}

        {!loading && !err && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 160 }}>Mã TG</th>
                <th>Tên tác giả</th>
                <th>Thông tin</th>
                <th style={{ width: 140 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.maTG}>
                  <td>{r.maTG}</td>
                  <td>{r.tenTG}</td>
                  <td className={styles.noteCell}>
                    {r.thongTin ? (
                      r.thongTin
                    ) : (
                      <span className={styles.muted}>—</span>
                    )}
                  </td>
                  <td className={styles.actions}>
                    <button
                      className={styles.edit}
                      onClick={() => startEdit(r)}
                    >
                      <Pencil />
                    </button>
                    <button
                      className={styles.delete}
                      onClick={() => onDelete(r.maTG)}
                    >
                      <Trash2 />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: 16 }}>
                    Chưa có tác giả
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
            <h3>{editing.maTG ? "Sửa tác giả" : "Thêm tác giả"}</h3>

            <label>Tên tác giả</label>
            <input name="tenTG" defaultValue={editing.tenTG || ""} required />

            <label>Thông tin</label>
            <textarea
              name="thongTin"
              rows="4"
              defaultValue={editing.thongTin || ""}
            />

            <div className={styles.actionsBar}>
              <button
                type="button"
                className={styles.ghost}
                onClick={() => setEditing(null)}
              >
                <X size={16} /> Hủy
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
