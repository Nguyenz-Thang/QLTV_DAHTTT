import { useEffect, useMemo, useRef, useState } from "react";
import { useSachApi } from "../../api/sachApi";
import styles from "./BookAdminPage.module.scss";
import {
  Download,
  TextSearch,
  SquarePen,
  Trash2,
  ChevronRight,
} from "lucide-react";
import Modal from "../../components/Modal";

const FILE_HOST = import.meta.env.VITE_FILE_HOST || "http://localhost:5000";

export default function BookAdminPage() {
  const { getMeta, listSach, createSach, updateSach, deleteSach } =
    useSachApi();

  const [list, setList] = useState([]);
  const [meta, setMeta] = useState({ theLoai: [], tacGia: [], nhaXuatBan: [] });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Tìm kiếm
  const [q, setQ] = useState("");
  const searchRef = useRef(null);

  // Preview ảnh bìa khi thêm/sửa
  const [coverPreview, setCoverPreview] = useState("");
  const onPickAnhBia = (e) => {
    const f = e.target.files?.[0];
    if (!f) {
      setCoverPreview(editing?.anhBia ? FILE_HOST + editing.anhBia : "");
      return;
    }
    setCoverPreview(URL.createObjectURL(f));
  };

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      const [m, ds] = await Promise.all([getMeta(), listSach()]);
      setMeta({
        theLoai: m.theLoai,
        tacGia: m.tacGia,
        nhaXuatBan: m.nhaXuatBan,
      });
      setList(ds.data || []);
    } catch (e) {
      setErr(e.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // đồng bộ preview khi mở form
  useEffect(() => {
    if (editing?.anhBia) setCoverPreview(FILE_HOST + editing.anhBia);
    else setCoverPreview("");
  }, [editing]);

  const startCreate = () => setEditing({});
  const startEdit = (row) => setEditing(row);

  const onSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);

    // giữ ảnh cũ nếu không chọn mới
    const fileAnh = e.target.elements["anhBia"]?.files?.[0];
    if (editing?.maSach && !fileAnh && editing?.anhBia) {
      fd.append("anhBiaOld", editing.anhBia);
    }

    // giữ tài liệu cũ nếu không chọn mới
    const fileTL = e.target.elements["taiLieuOnl"]?.files?.[0];
    if (editing?.maSach && !fileTL && editing?.taiLieuOnl) {
      fd.append("taiLieuOnlOld", editing.taiLieuOnl);
    }

    setLoading(true);
    try {
      if (editing?.maSach) await updateSach(editing.maSach, fd);
      else await createSach(fd);
      setEditing(null);
      await load();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
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

  // ====== TÌM KIẾM (không phân biệt hoa/thường & dấu) ======
  const unaccent = (s = "") =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const filtered = useMemo(() => {
    if (!q) return list;
    const key = unaccent(q);
    return list.filter((r) => {
      const haystack = [r.maSach, r.tieuDe, r.tenTG, r.tenTL, r.tenNXB]
        .filter(Boolean)
        .map(unaccent)
        .join(" | ");
      return haystack.includes(key);
    });
  }, [q, list]);

  return (
    <>
      <div className={styles.tab}>
        <div className={styles.nd}>
          <span className={styles.item}>Quản lý sách</span>
          <ChevronRight className={styles.icon} />
          <span className={styles.ct}>Sách</span>
        </div>
      </div>

      <div className={styles.page}>
        <div className={styles.header}>
          <h2>Quản lý sách</h2>
          <div className={styles.headerRight}>
            {/* Ô tìm kiếm */}
            <div className={styles.searchBox}>
              <TextSearch className={styles.searchIcon} />
              <input
                ref={searchRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm kiếm sách theo mã, tiêu đề, tác giả, thể loại, NXB…"
              />
              {!!q && (
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => {
                    setQ("");
                    searchRef.current?.focus();
                  }}
                  aria-label="Xóa tìm kiếm"
                  title="Xóa tìm kiếm"
                >
                  ×
                </button>
              )}
            </div>

            <button className={styles.primary} onClick={startCreate}>
              Thêm sách
            </button>
          </div>
        </div>

        {err && <div className={styles.error}>{err}</div>}

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mã</th>
              <th>Ảnh</th>
              <th>Tiêu đề</th>
              <th>Thể loại</th>
              <th>Tác giả</th>
              <th>NXB</th>
              <th>SL</th>
              <th>SL đang mượn</th>
              <th>Tài liệu</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.maSach}>
                <td>{r.maSach}</td>
                <td>
                  {r.anhBia ? (
                    <img
                      className={styles.thumb}
                      src={
                        /^https?:\/\//.test(r.anhBia)
                          ? r.anhBia
                          : `${FILE_HOST}${r.anhBia}`
                      }
                      alt={r.tieuDe || "Ảnh bìa"}
                      loading="lazy"
                    />
                  ) : (
                    <div className={styles.noThumb}>—</div>
                  )}
                </td>
                <td>{r.tieuDe}</td>
                <td>{r.tenTL}</td>
                <td>{r.tenTG}</td>
                <td>{r.tenNXB}</td>
                <td>{r.soLuong}</td>
                <td className={styles.quantity}>{r.soLuongMuon}</td>
                <td>
                  {r.taiLieuOnl ? (
                    <a
                      href={`${FILE_HOST}${r.taiLieuOnl}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Tải tài liệu"
                    >
                      <Download />
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className={styles.actions}>
                  <button
                    onClick={() => startEdit(r)}
                    className={styles.edit}
                    title="Sửa"
                  >
                    <SquarePen />
                  </button>
                  <button
                    onClick={() => onDelete(r.maSach)}
                    className={styles.delete}
                    title="Xóa"
                  >
                    <Trash2 />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10}>Không tìm thấy sách phù hợp</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* MODAL: form thêm/sửa */}
        <Modal
          isOpen={!!editing}
          onRequestClose={() => setEditing(null)}
          bodyOpenClassName="modal-custom-body"
          className={styles.modal}
          overlayClassName={styles.modalOverlay}
        >
          {editing && (
            <form className={styles.form} onSubmit={onSubmit}>
              <h3>{editing.maSach ? "Sửa sách" : "Thêm sách"}</h3>

              <label>Tiêu đề</label>
              <input
                name="tieuDe"
                defaultValue={editing.tieuDe || ""}
                required
              />

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

              <label>Ảnh bìa (JPG/PNG/WEBP/GIF)</label>
              <input
                name="anhBia"
                type="file"
                accept="image/*"
                onChange={onPickAnhBia}
              />

              <div className={styles.coverPreview}>
                {coverPreview ? (
                  <img src={coverPreview} alt="Preview ảnh bìa" />
                ) : editing?.anhBia ? (
                  <img
                    src={FILE_HOST + editing.anhBia}
                    alt="Ảnh bìa hiện tại"
                  />
                ) : (
                  <div className={styles.noCover}>Chưa chọn ảnh</div>
                )}
              </div>

              <label>Tài liệu online (PDF/DOC/EPUB)</label>
              <input
                name="taiLieuOnl"
                type="file"
                accept=".pdf,.doc,.docx,.epub"
              />

              {editing?.taiLieuOnl && (
                <div className={styles.current}>
                  File hiện tại:{" "}
                  <a
                    href={`${FILE_HOST}${editing.taiLieuOnl}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Tải
                  </a>
                </div>
              )}

              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className={styles.cancel}
                >
                  Hủy
                </button>
                <button className={styles.primary} disabled={loading}>
                  {loading ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          )}
        </Modal>

        {loading && <div className={styles.loadingOverlay}>Đang tải...</div>}
      </div>
    </>
  );
}
