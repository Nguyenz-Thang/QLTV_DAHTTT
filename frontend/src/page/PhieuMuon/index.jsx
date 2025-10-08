import { useEffect, useState, useContext } from "react";
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
  ChevronRight,
} from "lucide-react";
import { AuthContext } from "../../context/AuthContext";

export default function PhieuMuon() {
  const api = usePhieuMuonApi();
  const { user } = useContext(AuthContext);

  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [editing, setEditing] = useState(null); // null | {} | row (kèm items)
  const [saving, setSaving] = useState(false);
  const [meta, setMeta] = useState({ docGia: [], thuThu: [], sach: [] });

  // chọn độc giả bằng 1 trong 2 cách: msv OR select
  const [msv, setMsv] = useState("");
  const [dgSelect, setDgSelect] = useState("");

  const todayStr = new Date().toISOString().slice(0, 10);

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
          msv: d.MSV || d.msv || "", // cần field MSV từ API độc giả
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

  const startCreate = () =>
    setEditing({
      maDG: "",
      maTT: user?.maTT || "", // auto thủ thư đăng nhập
      ngayMuon: todayStr, // auto ngày hiện tại
      ngayHenTra: "",
      items: [{ maSach: "", soLuong: 1 }],
    });

  const startEdit = (row) => {
    setEditing({
      ...row,
      items: row.items?.length ? row.items : [{ maSach: "", soLuong: 1 }],
    });
  };

  // đồng bộ ô chọn Độc giả khi mở modal
  useEffect(() => {
    if (editing) {
      setMsv("");
      setDgSelect(editing.maDG || "");
    }
  }, [editing]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);

    // --- resolve maDG theo ưu tiên MSV ---
    let maDGSubmit = dgSelect || "";
    const msvInput = (msv || "").trim();
    if (msvInput) {
      const found = meta.docGia.find((d) => String(d.msv) === msvInput);
      if (!found) {
        alert("Không tìm thấy độc giả với MSV đã nhập.");
        return;
      }
      maDGSubmit = found.id;
    }
    if (!maDGSubmit) return alert("Chọn độc giả hoặc nhập MSV hợp lệ.");

    // --- thủ thư: tự set theo user đang đăng nhập ---
    const maTTSubmit = user?.maTT || editing?.maTT || "";

    // --- ngày mượn: mặc định hôm nay & bị disable nên không submit từ form ---
    const ngayMuonSubmit = editing?.ngayMuon
      ? editing.ngayMuon.length > 10
        ? editing.ngayMuon
        : `${editing.ngayMuon}T00:00:00.000Z`
      : new Date().toISOString();

    const payload = {
      maDG: maDGSubmit,
      maTT: maTTSubmit,
      ngayMuon: ngayMuonSubmit,
      ngayHenTra: f.get("ngayHenTra") || null,
      items: (editing.items || [])
        .map((it, idx) => ({
          maSach: f.getAll("maSach")[idx],
          soLuong: Number(f.getAll("soLuong")[idx] || 0) || 1,
          trangThai: it.trangThai || "Đang mượn",
        }))
        .filter((x) => x.maSach),
    };

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
      <div className={styles.tab}>
        <div className={styles.nd}>
          <span className={styles.item}>Quản lý phiếu mượn trả</span>
          <ChevronRight className={styles.icon} />
          <span className={styles.ct}>Phiếu mượn</span>
        </div>
      </div>
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

            {/* Chọn độc giả: MSV OR dropdown */}
            <div className={styles.grid2}>
              <div>
                <label>MSV (tìm nhanh)</label>
                <input
                  name="msv"
                  value={msv}
                  onChange={(e) => setMsv(e.target.value)}
                  placeholder="Nhập MSV để chọn độc giả"
                  disabled={!!dgSelect}
                />
                {/* <div className={styles.help}>
                  Nhập MSV sẽ tự chọn độc giả và khóa dropdown.
                </div> */}
              </div>
              <div>
                <label>Độc giả</label>
                <select
                  name="maDG"
                  value={dgSelect}
                  onChange={(e) => setDgSelect(e.target.value)}
                  disabled={!!msv}
                >
                  <option value="">-- Chọn độc giả --</option>
                  {meta.docGia.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.msv ? `(${d.msv})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Thủ thư & ngày mượn (tự set + disable) */}
            <div className={styles.grid2}>
              <div>
                <label>Thủ thư</label>
                <select value={user?.maTT || editing.maTT || ""} disabled>
                  <option value="">
                    {user?.maTT
                      ? `${user.maTT} — (Tự động)`
                      : editing.maTT || "-- Không có --"}
                  </option>
                </select>
                {/* vẫn gửi về server */}
                <input
                  type="hidden"
                  name="maTT"
                  value={user?.maTT || editing.maTT || ""}
                />
              </div>
              <div>
                <label>Ngày mượn</label>
                <input
                  type="date"
                  value={editing.ngayMuon?.substring(0, 10) || todayStr}
                  disabled
                  readOnly
                />
                {/* vẫn gửi về server */}
                <input
                  type="hidden"
                  name="ngayMuon"
                  value={editing.ngayMuon?.substring(0, 10) || todayStr}
                />
              </div>
            </div>

            <div className={styles.grid2}>
              <div>
                <label>Ngày hẹn trả</label>
                <input
                  type="date"
                  name="ngayHenTra"
                  defaultValue={editing.ngayHenTra?.substring(0, 10) || ""}
                />
              </div>
              <div></div>
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
                  <span
                    className={styles.state}
                    style={{
                      color: d.trangThai === "Đã trả" ? "#00CC00" : "#CC6600",
                      marginLeft: "10px",
                      fontWeight: "700",
                    }}
                  >
                    {d.trangThai}
                  </span>
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
