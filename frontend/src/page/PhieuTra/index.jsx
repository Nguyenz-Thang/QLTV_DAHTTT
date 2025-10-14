// src/pages/PhieuTra/PhieuTra.jsx
import { useEffect, useMemo, useState, useContext } from "react";
import styles from "./PhieuTra.module.scss";
import { usePhieuTraApi } from "../../api/phieuTraApi";
import Modal from "../../components/Modal";
import {
  Plus,
  Search,
  Eye,
  Trash2,
  X,
  Save,
  Calendar,
  ChevronRight,
  CheckSquare,
  Square,
} from "lucide-react";
import { AuthContext } from "../../context/AuthContext";

export default function PhieuTra() {
  const api = usePhieuTraApi();
  const { user } = useContext(AuthContext);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  const [viewing, setViewing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    maPM: "",
    ngayTra: todayStr(),
    remain: [],
    pick: {},
    pmInfo: null,
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
    load();
  }, []);

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    return k
      ? rows.filter(
          (r) =>
            String(r.maPT).toLowerCase().includes(k) ||
            String(r.maPM).toLowerCase().includes(k)
        )
      : rows;
  }, [rows, q]);

  const openCreate = () => {
    setForm({
      maPM: "",
      ngayTra: todayStr(),
      remain: [],
      pick: {},
      pmInfo: null,
    });
    setCreating(true);
    setSuggestQ("");
    setSuggests([]);
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

  const [suggestQ, setSuggestQ] = useState("");
  const [suggests, setSuggests] = useState([]);
  const [sLoading, setSLoading] = useState(false);

  const traCuuPhieuMuon = async (text) => {
    if (!text.trim()) return;
    try {
      setSLoading(true);
      const data = await api.pmSuggest(text.trim());
      setSuggests(data.data || data || []);
    } catch (e) {
      setSuggests([]);
    } finally {
      setSLoading(false);
    }
  };

  const choosePM = async (pm) => {
    try {
      const remainRes = await api.pmRemaining(pm.maPM);
      const arr = remainRes.data || remainRes || [];
      // pick mặc định: check tất cả với số lượng = conNo
      const pickDefault = arr.reduce((m, it) => {
        m[it.maSach] = { checked: true, soLuong: it.conNo, tinhTrang: "" };
        return m;
      }, {});
      setForm({
        maPM: pm.maPM,
        pmInfo: pm,
        ngayTra: todayStr(),
        remain: arr,
        pick: pickDefault,
      });
      setSuggests([]);
      setSuggestQ(`${pm.maPM} - ${pm.hoTen}`);
    } catch (e) {
      alert(e.message || "Không load được danh sách còn nợ.");
    }
  };

  const toggleAll = (checked) => {
    setForm((f) => {
      const pick = { ...f.pick };
      for (const it of f.remain) {
        const cur = pick[it.maSach] || {};
        pick[it.maSach] = {
          checked,
          soLuong: Math.max(
            1,
            Math.min(Number(cur.soLuong || it.conNo), it.conNo)
          ),
          tinhTrang: cur.tinhTrang || "",
        };
      }
      return { ...f, pick };
    });
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    if (!form.maPM) return alert("Chọn phiếu mượn trước.");

    // map remain -> conNo để kiểm soát số lượng
    const remainMap = new Map(form.remain.map((it) => [String(it.maSach), it]));
    const items = Object.entries(form.pick)
      .filter(([, v]) => v && v.checked)
      .map(([maSach, v]) => {
        const it = remainMap.get(String(maSach));
        if (!it) return null; // sách không còn trong remain
        const qty = Math.max(1, Math.min(Number(v.soLuong || 0), it.conNo));
        if (!qty) return null;
        const obj = { maSach, soLuong: qty };
        if ((v.tinhTrang || "").trim()) obj.tinhTrang = v.tinhTrang.trim();
        return obj;
      })
      .filter(Boolean);

    if (items.length === 0) return alert("Chọn ít nhất 1 sách để trả.");

    setSaving(true);
    try {
      await api.create({
        maPM: form.maPM.trim(),
        ngayTra: form.ngayTra,
        // maTT: để backend tự lấy từ token; nếu backend yêu cầu thì gửi thêm:
        // maTT: user?.maTT
        items,
      });
      setCreating(false);
      await load();
    } catch (e2) {
      alert(e2.message || "Tạo phiếu trả thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className={styles.tab}>
        <div className={styles.nd}>
          <span className={styles.item}>Quản lý phiếu mượn trả</span>
          <ChevronRight className={styles.icon} />
          <span className={styles.ct}>Phiếu trả</span>
        </div>
      </div>

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
                      title="Xem"
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

          {/* TÌM PHIẾU MƯỢN */}
          <div className={styles.pmPicker}>
            <label>Tìm phiếu mượn (mã PM / MSSV / tên độc giả)</label>
            <div className={styles.suggestWrap}>
              <Search className={styles.suggestIcon} />
              <input
                value={suggestQ}
                onChange={(e) => setSuggestQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (suggestQ.trim()) traCuuPhieuMuon(suggestQ);
                  }
                }}
                placeholder="VD: PM0001 / 6920xxx / Nguyễn Văn A"
              />

              {suggestQ && (
                <button
                  className={styles.clear}
                  type="button"
                  onClick={() => setSuggestQ("")}
                >
                  ×
                </button>
              )}
            </div>

            {suggests.length > 0 && (
              <div className={styles.suggestList}>
                {sLoading && (
                  <div className={styles.suggestLoading}>Đang tìm…</div>
                )}
                {suggests.map((pm) => (
                  <button
                    key={pm.maPM}
                    type="button"
                    className={styles.suggestItem}
                    onClick={() => choosePM(pm)}
                  >
                    <div>
                      <strong>{pm.maPM}</strong> • {pm.hoTen}
                    </div>
                    <div className={styles.suggestMeta}>
                      {pm.maSV ? <>MSSV: {pm.maSV} • </> : null}
                      Ngày mượn: {pm.ngayMuon?.slice(0, 10) || "—"} • SL còn nợ:{" "}
                      {pm.tongNo}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* THÔNG TIN PM đã chọn */}
          {form.pmInfo && (
            <div className={styles.pmInfo}>
              <div>
                <b>PM:</b> {form.pmInfo.maPM}
              </div>
              <div>
                <b>Độc giả:</b> {form.pmInfo.hoTen}{" "}
                {form.pmInfo.maSV ? `(MSSV: ${form.pmInfo.maSV})` : ""}
              </div>
              <div>
                <b>Ngày mượn:</b> {form.pmInfo.ngayMuon?.slice(0, 10) || "—"}
              </div>
              <div>
                <b>Hẹn trả:</b> {form.pmInfo.ngayHenTra?.slice(0, 10) || "—"}
              </div>
            </div>
          )}

          {/* Ngày trả */}
          <div className={styles.row2}>
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
            <div>
              <label>Thủ thư</label>
              <input
                value={user?.hoTen || user?.tenTT || user?.tenDangNhap || "—"}
                disabled
              />
            </div>
          </div>

          {/* Danh sách sách còn nợ */}
          <div className={styles.remainBox}>
            <div className={styles.remainHead}>
              <span>Sách còn nợ</span>
              <div className={styles.remainToggles}>
                <button
                  type="button"
                  className={styles.ghost}
                  onClick={() => toggleAll(true)}
                >
                  <CheckSquare size={16} /> Chọn tất cả
                </button>
                <button
                  type="button"
                  className={styles.ghost}
                  onClick={() => toggleAll(false)}
                >
                  <Square size={16} /> Bỏ chọn
                </button>
              </div>
            </div>

            <div className={styles.remainRows}>
              <div className={styles.remainRowHead}>
                <div>Chọn</div>
                <div>Mã sách</div>
                <div>Tiêu đề</div>
                <div>Còn nợ</div>
                <div>Trả</div>
                <div>Tình trạng</div>
              </div>

              {form.remain.map((it) => {
                const p = form.pick[it.maSach] || {};
                return (
                  <div className={styles.remainRow} key={it.maSach}>
                    <div>
                      <input
                        type="checkbox"
                        checked={!!p.checked}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            pick: {
                              ...f.pick,
                              [it.maSach]: {
                                checked: e.target.checked,
                                soLuong: p.soLuong ?? it.conNo,
                                tinhTrang: p.tinhTrang || "",
                              },
                            },
                          }))
                        }
                      />
                    </div>
                    <div>{it.maSach}</div>
                    <div className={styles.titleCell}>{it.tieuDe}</div>
                    <div>{it.conNo}</div>
                    <div>
                      <input
                        type="number"
                        min={1}
                        max={it.conNo}
                        value={form.pick[it.maSach]?.soLuong ?? it.conNo}
                        disabled={!form.pick[it.maSach]?.checked}
                        onChange={(e) => {
                          const v = Math.max(
                            1,
                            Math.min(Number(e.target.value || 1), it.conNo)
                          );
                          setForm((f) => ({
                            ...f,
                            pick: {
                              ...f.pick,
                              [it.maSach]: {
                                ...(f.pick[it.maSach] || {
                                  checked: true,
                                  tinhTrang: "",
                                }),
                                checked: true,
                                soLuong: v,
                              },
                            },
                          }));
                        }}
                      />
                    </div>
                    <div>
                      <input
                        placeholder="Bình thường / Rách / ... "
                        value={p.tinhTrang || ""}
                        disabled={!p.checked}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            pick: {
                              ...f.pick,
                              [it.maSach]: {
                                ...p,
                                checked: true,
                                tinhTrang: e.target.value,
                              },
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                );
              })}

              {form.pmInfo && form.remain.length === 0 && (
                <div className={styles.emptyRemain}>
                  Phiếu mượn này không còn nợ.
                </div>
              )}
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.ghost}
              onClick={() => setCreating(false)}
            >
              <X size={16} /> Hủy
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

// --- helper: debounce ---
function debounce(fn, delay = 300) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}
