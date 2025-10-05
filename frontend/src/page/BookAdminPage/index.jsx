import { useEffect, useState } from "react";
import {
  getMeta,
  listSach,
  createSach,
  updateSach,
  deleteSach,
} from "../../api/sachApi";
import styles from "./BookAdminPage.module.scss";

export default function BookAdminPage() {
  const [list, setList] = useState([]);
  const [meta, setMeta] = useState({ theLoai: [], tacGia: [], nhaXuatBan: [] });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const [m, ds] = await Promise.all([getMeta(), listSach()]);
    setMeta({ theLoai: m.theLoai, tacGia: m.tacGia, nhaXuatBan: m.nhaXuatBan });
    setList(ds.data);
  };

  useEffect(() => {
    load();
  }, []);

  const startCreate = () => setEditing({});
  const startEdit = (row) => setEditing(row);

  const onSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target); // KHÔNG đặt headers Content-Type
    setLoading(true);
    try {
      if (editing?.maSach) await updateSach(editing.maSach, fd);
      else await createSach(fd);
      setEditing(null);
      await load();
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  };

  const onDelete = async (id) => {
    if (!window.confirm("Xóa sách này?")) return;
    try {
      await deleteSach(id);
      await load();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2>Quản lý sách</h2>
        <button className={styles.primary} onClick={startCreate}>
          Thêm sách
        </button>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Mã</th>
            <th>Tiêu đề</th>
            <th>Thể loại</th>
            <th>Tác giả</th>
            <th>NXB</th>
            <th>SL</th>
            <th>Tài liệu</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {list.map((r) => (
            <tr key={r.maSach}>
              <td>{r.maSach}</td>
              <td>{r.tieuDe}</td>
              <td>{r.tenTL}</td>
              <td>{r.tenTG}</td>
              <td>{r.tenNXB}</td>
              <td>{r.soLuong}</td>
              <td>
                {r.taiLieuOnl ? (
                  <a
                    href={`http://localhost:5000${r.taiLieuOnl}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Tải
                  </a>
                ) : (
                  "—"
                )}
              </td>
              <td className={styles.actions}>
                <button onClick={() => startEdit(r)}>Sửa</button>
                <button onClick={() => onDelete(r.maSach)}>Xóa</button>
              </td>
            </tr>
          ))}
          {list.length === 0 && (
            <tr>
              <td colSpan="8">Chưa có sách</td>
            </tr>
          )}
        </tbody>
      </table>

      {editing && (
        <form className={styles.form} onSubmit={onSubmit}>
          <h3>{editing.maSach ? "Sửa sách" : "Thêm sách"}</h3>

          <label>Tiêu đề</label>
          <input name="tieuDe" defaultValue={editing.tieuDe || ""} required />

          <label>Tóm tắt</label>
          <textarea
            name="tomTat"
            rows="3"
            defaultValue={editing.tomTat || ""}
          />

          <div className={styles.row}>
            <div>
              <label>Thể loại</label>
              <select name="maTL" defaultValue={editing.maTL || ""}>
                <option value="">-- Chọn --</option>
                {meta.theLoai.map((t) => (
                  <option key={t.maTL} value={t.maTL}>
                    {t.tenTL}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Tác giả</label>
              <select name="maTG" defaultValue={editing.maTG || ""}>
                <option value="">-- Chọn --</option>
                {meta.tacGia.map((t) => (
                  <option key={t.maTG} value={t.maTG}>
                    {t.tenTG}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div>
              <label>Nhà XB</label>
              <select name="maNXB" defaultValue={editing.maNXB || ""}>
                <option value="">-- Chọn --</option>
                {meta.nhaXuatBan.map((n) => (
                  <option key={n.maNXB} value={n.maNXB}>
                    {n.tenNXB}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Số lượng</label>
              <input
                name="soLuong"
                type="number"
                min="0"
                defaultValue={editing.soLuong || 0}
              />
            </div>
          </div>

          <label>Tài liệu online (PDF/DOC/EPUB)</label>
          <input name="taiLieuOnl" type="file" accept=".pdf,.doc,.docx,.epub" />

          {editing.taiLieuOnl && (
            <div className={styles.current}>
              File hiện tại:{" "}
              <a
                href={`http://localhost:5000${editing.taiLieuOnl}`}
                target="_blank"
                rel="noreferrer"
              >
                Tải
              </a>
            </div>
          )}

          <div className={styles.actions}>
            <button type="button" onClick={() => setEditing(null)}>
              Hủy
            </button>
            <button className={styles.primary} disabled={loading}>
              {loading ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
