import { useEffect, useState, useContext, useCallback } from "react";
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

/* ---------- utils ---------- */
const todayStr = new Date().toISOString().slice(0, 10);
const initialDraft = () => ({
  maDG: "",
  maTT: "",
  ngayMuon: todayStr,
  ngayHenTra: "",
  items: [{ maSach: "", soLuong: 1 }],
});

/** State dính theo key trong sessionStorage */
function useStickyState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw != null) return JSON.parse(raw);
    } catch {}
    return typeof initialValue === "function" ? initialValue() : initialValue;
  });
  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);

  const reset = useCallback(() => {
    const v =
      typeof initialValue === "function" ? initialValue() : initialValue;
    try {
      sessionStorage.removeItem(key);
    } catch {}
    setState(v);
  }, [key, initialValue]);

  return [state, setState, reset];
}

export default function PhieuMuon() {
  const api = usePhieuMuonApi();
  const { user } = useContext(AuthContext);

  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  /* 🔒 Bản nháp phiếu mượn dính qua re-render/đóng mở modal */
  const [editing, setEditing, resetEditing] = useStickyState(
    "phieumuon.draft",
    initialDraft
  );
  const [saving, setSaving] = useState(false);
  const [meta, setMeta] = useState({ docGia: [], thuThu: [], sach: [] });

  /* Nhập độc giả theo 2 cách — cũng dính session */
  const [msv, setMsv] = useStickyState("phieumuon.msv", "");
  const [dgSelect, setDgSelect] = useStickyState("phieumuon.dgSelect", "");

  const [modalOpen, setModalOpen] = useStickyState(
    "phieumuon.modalOpen",
    false
  );

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
          msv: d.MSV || d.msv || "",
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
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [q]);

  const startCreate = () => {
    setEditing((ed) => {
      // nếu đã có nháp thì giữ nguyên, nếu chưa thì khởi tạo
      const hasDraft = ed && (ed.maDG || (ed.items && ed.items.length > 0));
      return hasDraft
        ? { ...ed, maTT: user?.maTT || ed.maTT || "" }
        : { ...initialDraft(), maTT: user?.maTT || "" };
    });
    // đồng bộ bộ chọn độc giả với draft hiện tại
    setMsv("");
    setDgSelect((s) => s || "");
    setModalOpen(true);
  };

  const startEdit = (row) => {
    setEditing({
      ...row,
      // đảm bảo controlled values
      ngayMuon:
        row.ngayMuon?.length > 10 ? row.ngayMuon : row.ngayMuon || todayStr,
      ngayHenTra: row.ngayHenTra?.substring(0, 10) || "",
      items: row.items?.length ? row.items : [{ maSach: "", soLuong: 1 }],
    });
    setMsv("");
    setDgSelect(row.maDG || "");
    setModalOpen(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    /* resolve maDG theo ưu tiên MSV */
    let maDGSubmit = dgSelect || "";
    const msvInput = (msv || "").trim();
    if (msvInput) {
      const found = meta.docGia.find((d) => String(d.msv) === msvInput);
      if (!found) return alert("Không tìm thấy độc giả với MSV đã nhập.");
      maDGSubmit = found.id;
    }
    if (!maDGSubmit) return alert("Chọn độc giả hoặc nhập MSV hợp lệ.");

    const maTTSubmit = user?.maTT || editing?.maTT || "";

    const payload = {
      maDG: maDGSubmit,
      maTT: maTTSubmit,
      ngayMuon:
        editing?.ngayMuon?.length > 10
          ? editing.ngayMuon
          : `${editing?.ngayMuon || todayStr}T00:00:00.000Z`,
      ngayHenTra: editing?.ngayHenTra || null,
      items: (editing.items || [])
        .map((it) => ({
          maSach: it.maSach,
          soLuong: Number(it.soLuong || 1) || 1,
          trangThai: it.trangThai || "Đang mượn",
        }))
        .filter((x) => x.maSach),
    };
    if (!payload.items.length) return alert("Thêm ít nhất 1 sách.");

    setSaving(true);
    try {
      if (editing?.maPM) await api.update(editing.maPM, payload);
      else await api.create(payload);

      setModalOpen(false);
      resetEditing(); // xóa nháp sau khi lưu thành công
      setMsv("");
      setDgSelect("");
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

  /* các handler controlled cho form */
  const setNgayHenTra = (v) =>
    setEditing((ed) => ({ ...ed, ngayHenTra: v || "" }));

  const addLine = () =>
    setEditing((ed) => ({
      ...ed,
      items: [...(ed.items || []), { maSach: "", soLuong: 1 }],
    }));

  const changeItemSach = (idx, maSach) =>
    setEditing((ed) => {
      const items = [...(ed.items || [])];
      items[idx] = { ...items[idx], maSach };
      return { ...ed, items };
    });

  const changeItemQty = (idx, soLuong) =>
    setEditing((ed) => {
      const v = Math.max(1, Number(soLuong || 1));
      const items = [...(ed.items || [])];
      items[idx] = { ...items[idx], soLuong: v };
      return { ...ed, items };
    });

  const removeLine = (idx) =>
    setEditing((ed) => ({
      ...ed,
      items: (ed.items || []).filter((_, i) => i !== idx),
    }));

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
        isOpen={!!modalOpen}
        onRequestClose={() => setModalOpen(false)} // ❌ không xóa nháp khi đóng
        bodyOpenClassName="modal-custom-body"
      >
        {modalOpen && (
          <form className={styles.form} onSubmit={onSubmit}>
            <h3>{editing?.maPM ? "Sửa phiếu mượn" : "Thêm phiếu mượn"}</h3>

            {/* Chọn độc giả: MSV OR dropdown (dính session) */}
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

            {/* Thủ thư & ngày mượn */}
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
                  value={editing.ngayHenTra || ""}
                  onChange={(e) => setNgayHenTra(e.target.value)}
                />
              </div>
              <div />
            </div>

            <div className={styles.itemsHead}>
              <h4>Chi tiết mượn</h4>
              <button
                type="button"
                className={styles.addLine}
                onClick={addLine}
              >
                <BookPlus size={16} /> Thêm dòng
              </button>
            </div>

            <div className={styles.itemsBox}>
              {(editing.items || []).map((it, idx) => (
                <div key={idx} className={styles.itemRow}>
                  <select
                    name="maSach"
                    value={it.maSach || ""} // ✅ controlled
                    onChange={(e) => changeItemSach(idx, e.target.value)}
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
                    value={it.soLuong || 1} // ✅ controlled
                    onChange={(e) => changeItemQty(idx, e.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.removeLine}
                    onClick={() => removeLine(idx)}
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
                onClick={() => setModalOpen(false)} // ❌ không reset nháp
              >
                <X size={16} /> Đóng
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
                      color:
                        d.trangThai === "Đã trả"
                          ? "#00CC00"
                          : d.trangThai === "Chờ lấy"
                          ? "#131C9EFF"
                          : "#CC6600",
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
