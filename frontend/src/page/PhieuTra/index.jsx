import { useEffect, useMemo, useState } from "react";
import styles from "./PhieuTra.module.scss";
import { usePhieuTraApi } from "../../api/phieuTraApi";
import Modal from "../../components/Modal";
import { Plus, Search, Eye, Trash2, X, Save, Calendar } from "lucide-react";

export default function PhieuTra() {
  const api = usePhieuTraApi();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  const [viewing, setViewing] = useState(null); // dữ liệu phiếu xem chi tiết
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    maPM: "",
    ngayTra: todayStr(),
    items: [{ maSach: "", soLuong: 1, tinhTrang: "" }],
  });
  const [saving, setSaving] = useState(false);

  function todayStr() {
    const s = new Date().toISOString();
    return s.slice(0, 10);
  }

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      const data = await api.list();
      setRows(data.data || data || []);
    } catch (e) {
      setErr(e.message || "Lỗi tải phiếu trả");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, []);

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return rows;
    return rows.filter(
      (r) =>
        String(r.maPT).toLowerCase().includes(k) ||
        String(r.maPM).toLowerCase().includes(k)
    );
  }, [rows, q]);

  const openCreate = () => {
    setForm({
      maPM: "",
      ngayTra: todayStr(),
      items: [{ maSach: "", soLuong: 1, tinhTrang: "" }],
    });
    setCreating(true);
  };

  const addItem = () =>
    setForm((f) => ({
      ...f,
      items: [...f.items, { maSach: "", soLuong: 1, tinhTrang: "" }],
    }));
  const removeItem = (i) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const changeItem = (i, key, val) => {
    setForm((f) => {
      const items = f.items.slice();
      items[i] = { ...items[i], [key]: val };
      return { ...f, items };
    });
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    // lọc bỏ dòng trống
    const clean = form.items
      .map((x) => ({ ...x, soLuong: Number(x.soLuong || 0) }))
      .filter((x) => x.maSach && x.soLuong > 0);

    if (!form.maPM) return alert("Nhập mã phiếu mượn");
    if (clean.length === 0) return alert("Thêm ít nhất 1 dòng sách hợp lệ");

    setSaving(true);
    try {
      await api.create({
        maPM: form.maPM.trim(),
        ngayTra: form.ngayTra,
        items: clean,
      });
      setCreating(false);
      await load();
    } catch (e2) {
      alert(e2.message || "Tạo phiếu trả thất bại");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (maPT) => {
    if (!window.confirm(`Xóa phiếu trả ${maPT}?`)) return;
    try {
      await api.remove(maPT);
      await load();
    } catch (e) {
      alert(e.message || "Không thể xóa");
    }
  };

  const openDetail = async (maPT) => {
    try {
      const data = await api.detail(maPT);
      setViewing(data.data || data);
    } catch (e) {
      alert(e.message || "Lỗi lấy chi tiết");
    }
  };

  return (
    <>
      <div className={styles.tab}></div>
      <div className={styles.page}>
        <div className={styles.header}>
          <h2>Quản lý phiếu trả</h2>

          <div className={styles.tools}>
            <div className={styles.searchBox}>
              <Search className={styles.searchIcon} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo mã phiếu trả / phiếu mượn…"
              />
              {q && (
                <button
                  className={styles.clear}
                  onClick={() => setQ("")}
                  aria-label="Xóa"
                >
                  ×
                </button>
              )}
            </div>

            <button className={styles.primary} onClick={openCreate}>
              <Plus size={18} /> Tạo phiếu trả
            </button>
          </div>
        </div>

        {loading && <div className={styles.loading}>Đang tải…</div>}
        {err && !loading && <div className={styles.error}>{err}</div>}

        {!loading && !err && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã PT</th>
                <th>Mã PM</th>
                <th>Ngày trả</th>
                <th>Số đầu sách</th>
                <th>Tổng SL</th>
                <th style={{ width: 140 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.maPT}>
                  <td>{r.maPT}</td>
                  <td>{r.maPM}</td>
                  <td>{new Date(r.ngayTra).toLocaleDateString()}</td>
                  <td>{r.soDauSach}</td>
                  <td>{r.tongSoLuong}</td>
                  <td className={styles.actions}>
                    <button
                      className={styles.view}
                      onClick={() => openDetail(r.maPT)}
                      title="Xem chi tiết"
                    >
                      <Eye />
                    </button>
                    <button
                      className={styles.delete}
                      onClick={() => onDelete(r.maPT)}
                      title="Xóa"
                    >
                      <Trash2 />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
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

      {/* Modal tạo phiếu trả */}
      <Modal
        isOpen={creating}
        onRequestClose={() => setCreating(false)}
        bodyOpenClassName="modal-custom-body"
      >
        <form className={styles.form} onSubmit={submitCreate}>
          <h3>Tạo phiếu trả</h3>

          <div className={styles.row2}>
            <div>
              <label>Mã phiếu mượn (maPM)</label>
              <input
                value={form.maPM}
                onChange={(e) =>
                  setForm((f) => ({ ...f, maPM: e.target.value }))
                }
                placeholder="VD: PM0001"
              />
            </div>
            <div>
              <label>Ngày trả</label>
              <div className={styles.inputIcon}>
                <Calendar className={styles.inputIcon__icon} />
                <input
                  type="date"
                  value={form.ngayTra}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ngayTra: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          <div className={styles.subTable}>
            <div className={styles.subHead}>
              <span>Sách trả</span>
              <button type="button" className={styles.ghost} onClick={addItem}>
                + Thêm dòng
              </button>
            </div>

            <div className={styles.subRows}>
              <div className={styles.subRowHead}>
                <div>Mã sách</div>
                <div>Số lượng</div>
                <div>Tình trạng</div>
                <div></div>
              </div>

              {form.items.map((it, idx) => (
                <div className={styles.subRow} key={idx}>
                  <div>
                    <input
                      value={it.maSach}
                      onChange={(e) =>
                        changeItem(idx, "maSach", e.target.value)
                      }
                      placeholder="VD: S001"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min="1"
                      value={it.soLuong}
                      onChange={(e) =>
                        changeItem(idx, "soLuong", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <input
                      value={it.tinhTrang}
                      onChange={(e) =>
                        changeItem(idx, "tinhTrang", e.target.value)
                      }
                      placeholder="Bình thường / Rách ..."
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      className={styles.rowDel}
                      onClick={() => removeItem(idx)}
                    >
                      <X />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.ghost}
              onClick={() => setCreating(false)}
            >
              Hủy
            </button>
            <button className={styles.primary} disabled={saving}>
              <Save size={16} /> {saving ? "Đang lưu…" : "Lưu"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal chi tiết */}
      <Modal
        isOpen={!!viewing}
        onRequestClose={() => setViewing(null)}
        bodyOpenClassName="modal-custom-body"
      >
        {viewing && (
          <div className={styles.detail}>
            <h3>Phiếu trả: {viewing.maPT}</h3>
            <div className={styles.meta}>
              <div>
                <strong>Mã PM:</strong> {viewing.maPM}
              </div>
              <div>
                <strong>Ngày trả:</strong>{" "}
                {new Date(viewing.ngayTra).toLocaleString()}
              </div>
              <div>
                <strong>Thủ thư:</strong> {viewing.maTT || "—"}
              </div>
            </div>

            <table className={styles.tableMini}>
              <thead>
                <tr>
                  <th>Mã sách</th>
                  <th>Tiêu đề</th>
                  <th>Số lượng</th>
                  <th>Tình trạng</th>
                </tr>
              </thead>
              <tbody>
                {(viewing.items || []).map((it) => (
                  <tr key={it.maCTPT}>
                    <td>{it.maSach}</td>
                    <td>{it.tieuDe || "—"}</td>
                    <td>{it.soLuong}</td>
                    <td>{it.tinhTrang || "—"}</td>
                  </tr>
                ))}
                {(!viewing.items || viewing.items.length === 0) && (
                  <tr>
                    <td
                      colSpan="4"
                      style={{ textAlign: "center", padding: 12 }}
                    >
                      Không có dòng nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </>
  );
}
