import { useEffect, useMemo, useState } from "react";
import styles from "./PhieuMuon.module.scss";
import Modal from "../../components/Modal";
import { usePhieuMuonApi } from "../../api/phieuMuonApi";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Save,
  X,
  BookPlus,
  Minus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function PhieuMuon() {
  const api = usePhieuMuonApi();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [editing, setEditing] = useState(null); // null | {} | row (kèm items)
  const [saving, setSaving] = useState(false);
  const [meta, setMeta] = useState({ docGia: [], thuThu: [], sach: [] });

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      const [pm, dg, tt, s] = await Promise.all([
        api.list(q),
        api.listDocGia(),
        api.listThuThu(),
        api.searchSach(),
      ]);
      setRows(pm.data || []);
      setMeta({
        docGia: (dg.data || dg || []).map((d) => ({
          id: d.maDG,
          name: d.hoTen,
        })),
        thuThu: (tt.data || tt || []).map((t) => ({
          id: t.maTT,
          name: t.tenTT,
        })),
        sach: (s.data || s || []).map((x) => ({
          id: x.maSach,
          name: x.tieuDe,
          soLuong: x.soLuong,
        })),
      });
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

  const startCreate = () => setEditing({ items: [{ maSach: "", soLuong: 1 }] });
  const startEdit = (row) => {
    // mở kèm chi tiết
    setEditing({
      ...row,
      items: row.items?.length ? row.items : [{ maSach: "", soLuong: 1 }],
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const payload = {
      maDG: f.get("maDG"),
      maTT: f.get("maTT"),
      ngayMuon: f.get("ngayMuon") || null,
      ngayHenTra: f.get("ngayHenTra") || null,
      items: (editing.items || [])
        .map((it, idx) => ({
          maSach: f.getAll("maSach")[idx],
          soLuong: Number(f.getAll("soLuong")[idx] || 0) || 1,
          trangThai: it.trangThai || "Đang mượn",
        }))
        .filter((x) => x.maSach),
    };
    if (!payload.maDG) return alert("Chọn độc giả");
    if (!payload.maTT) return alert("Chọn thủ thư");
    if (!payload.items.length) return alert("Thêm ít nhất 1 sách");

    setSaving(true);
    try {
      if (editing?.maPM) await api.update(editing.maPM, payload);
      else await api.create(payload);
      setEditing(null);
      await load();
    } catch (e2) {
      alert(e2.message || "Lưu phiếu mượn thất bại");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (r) => {
    if (!window.confirm(`Xoá phiếu mượn ${r.maPM}?`)) return;
    try {
      await api.remove(r.maPM);
      await load();
    } catch (e) {
      alert(e.message || "Không thể xoá");
    }
  };

  return (
    <>
      <div className={styles.tab}></div>
      <div className={styles.page}>
        <div className={styles.header}>
          <h2>Quản lý phiếu mượn</h2>
          <div className={styles.tools}>
            <div className={styles.searchBox}>
              <Search className={styles.searchIcon} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm mã phiếu, độc giả, thủ thư…"
              />
              {q && (
                <button className={styles.clear} onClick={() => setQ("")}>
                  ×
                </button>
              )}
            </div>
            <button className={styles.primary} onClick={startCreate}>
              <Plus size={18} /> Thêm phiếu
            </button>
          </div>
        </div>

        {loading && <div className={styles.loading}>Đang tải…</div>}
        {err && !loading && <div className={styles.error}>{err}</div>}

        {!loading && !err && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã PM</th>
                <th>Độc giả</th>
                <th>Thủ thư</th>
                <th>Ngày mượn</th>
                <th>Hẹn trả</th>
                <th>Số sách</th>
                <th style={{ width: 140 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <Row
                  key={r.maPM}
                  row={r}
                  onEdit={() => startEdit(r)}
                  onDelete={() => onDelete(r)}
                />
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: 16 }}>
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
            <h3>{editing.maPM ? "Sửa phiếu mượn" : "Thêm phiếu mượn"}</h3>

            <div className={styles.grid2}>
              <div>
                <label>Độc giả</label>
                <select name="maDG" defaultValue={editing.maDG || ""} required>
                  <option value="">-- Chọn độc giả --</option>
                  {meta.docGia.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Thủ thư</label>
                <select name="maTT" defaultValue={editing.maTT || ""} required>
                  <option value="">-- Chọn thủ thư --</option>
                  {meta.thuThu.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.grid2}>
              <div>
                <label>Ngày mượn</label>
                <input
                  type="date"
                  name="ngayMuon"
                  defaultValue={editing.ngayMuon?.substring(0, 10) || ""}
                />
              </div>
              <div>
                <label>Ngày hẹn trả</label>
                <input
                  type="date"
                  name="ngayHenTra"
                  defaultValue={editing.ngayHenTra?.substring(0, 10) || ""}
                />
              </div>
            </div>

            <div className={styles.itemsHead}>
              <h4>Chi tiết mượn</h4>
              <button
                type="button"
                className={styles.addLine}
                onClick={() =>
                  setEditing((ed) => ({
                    ...ed,
                    items: [...ed.items, { maSach: "", soLuong: 1 }],
                  }))
                }
              >
                <BookPlus size={16} /> Thêm dòng
              </button>
            </div>

            <div className={styles.itemsBox}>
              {editing.items?.map((it, idx) => (
                <div key={idx} className={styles.itemRow}>
                  <select
                    name="maSach"
                    defaultValue={it.maSach || ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEditing((ed) => {
                        const items = [...ed.items];
                        items[idx] = { ...items[idx], maSach: v };
                        return { ...ed, items };
                      });
                    }}
                  >
                    <option value="">-- Chọn sách --</option>
                    {meta.sach.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <input
                    name="soLuong"
                    type="number"
                    min="1"
                    defaultValue={it.soLuong || 1}
                    onChange={(e) => {
                      const v = Number(e.target.value || 1);
                      setEditing((ed) => {
                        const items = [...ed.items];
                        items[idx] = { ...items[idx], soLuong: v };
                        return { ...ed, items };
                      });
                    }}
                  />
                  <button
                    type="button"
                    className={styles.removeLine}
                    onClick={() =>
                      setEditing((ed) => ({
                        ...ed,
                        items: ed.items.filter((_, i) => i !== idx),
                      }))
                    }
                  >
                    <Minus size={16} /> Bỏ
                  </button>
                </div>
              ))}
              {(!editing.items || editing.items.length === 0) && (
                <div className={styles.emptyItems}>Chưa có sách.</div>
              )}
            </div>

            <div className={styles.formActions}>
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

function Row({ row, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const nItems = row.items?.length || 0;
  return (
    <>
      <tr>
        <td>{row.maPM}</td>
        <td>{row.tenDG || row.maDG}</td>
        <td>{row.tenTT || row.maTT}</td>
        <td>
          {row.ngayMuon ? new Date(row.ngayMuon).toLocaleDateString() : "—"}
        </td>
        <td>
          {row.ngayHenTra ? new Date(row.ngayHenTra).toLocaleDateString() : "—"}
        </td>
        <td>
          <button className={styles.link} onClick={() => setOpen((v) => !v)}>
            {nItems} sách{" "}
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </td>
        <td className={styles.actions}>
          <button className={styles.edit} onClick={onEdit}>
            <Pencil />
          </button>
          <button className={styles.delete} onClick={onDelete}>
            <Trash2 />
          </button>
        </td>
      </tr>
      {open && (
        <tr className={styles.detailRow}>
          <td colSpan="7">
            <ul className={styles.ctList}>
              {(row.items || []).map((d, i) => (
                <li key={i}>
                  <span>{d.tieuDe || d.maSach}</span>
                  <span className={styles.dot}></span>
                  <span>SL: {d.soLuong}</span>
                  <span className={styles.state}>{d.trangThai}</span>
                </li>
              ))}
              {(row.items || []).length === 0 && <li>Không có chi tiết.</li>}
            </ul>
          </td>
        </tr>
      )}
    </>
  );
}
