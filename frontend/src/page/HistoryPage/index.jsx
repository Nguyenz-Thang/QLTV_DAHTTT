import { useEffect, useState } from "react";
import { useLichSuApi } from "../../api/lichsuApi";
import styles from "./HistoryPage.module.scss";
import { BookOpen } from "lucide-react";

const FILE_HOST = import.meta.env.VITE_FILE_HOST || "http://localhost:5000";

function fileUrl(p) {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  const base = FILE_HOST.replace(/\/+$/, "");
  const rel = String(p).startsWith("/") ? p : `/${p}`;
  return `${base}${rel}`;
}

export default function HistoryPage({ maTK }) {
  const { getMine, getByAccount, cancelPending } = useLichSuApi(); // 👈 thêm cancelPending
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pageSize: 20 });
  const [q, setQ] = useState({ status: "all", dateFrom: "", dateTo: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const fetchData = async (page = 1) => {
    setLoading(true);
    setErr("");
    try {
      const params = { ...q, page, pageSize: meta.pageSize };
      const data = maTK
        ? await getByAccount(maTK, params)
        : await getMine(params);
      setRows(data.data);
      setMeta({ total: data.total, page: data.page, pageSize: data.pageSize });
    } catch (e) {
      setErr(e.message || "Lỗi tải lịch sử");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1); // eslint-disable-next-line
  }, []);

  const onFilter = (e) => {
    const { name, value } = e.target;
    setQ((s) => ({ ...s, [name]: value }));
  };

  const applyFilters = (e) => {
    e.preventDefault();
    fetchData(1);
  };

  const onCancel = async (maPM) => {
    if (!window.confirm(`Hủy phiếu mượn ${maPM}?`)) return;
    try {
      await cancelPending(maPM);
      await fetchData(meta.page);
    } catch (e) {
      alert(e.message || "Không hủy được phiếu");
    }
  };

  return (
    <div className={styles.page}>
      <h2>Lịch sử mượn</h2>

      <form className={styles.filters} onSubmit={applyFilters}>
        <label>
          Trạng thái
          <select name="status" value={q.status} onChange={onFilter}>
            <option value="all">Tất cả</option>
            <option value="borrowing">Đang mượn</option>
            <option value="returned">Đã trả</option>
            <option value="pending">Chờ lấy</option> {/* 👈 mới */}
          </select>
        </label>
        <label>
          Từ ngày
          <input
            type="date"
            name="dateFrom"
            value={q.dateFrom}
            onChange={onFilter}
          />
        </label>
        <label>
          Đến ngày
          <input
            type="date"
            name="dateTo"
            value={q.dateTo}
            onChange={onFilter}
          />
        </label>
        <button className={styles.primary}>Áp dụng</button>
      </form>

      {err && <div className={styles.error}>{err}</div>}

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Ngày mượn</th>
            <th>Sách</th>
            <th>SL</th>
            <th>Đã trả</th>
            <th>Ngày hẹn trả</th>
            <th>Ngày trả</th>
            <th>Tình trạng</th>
            <th>Hành động</th> {/* 👈 thêm cột */}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.maPM}-${r.maSach}-${i}`}>
              <td>{new Date(r.ngayMuon).toLocaleDateString()}</td>
              <td>
                <div className={styles.bookCell}>
                  <div className={styles.cover}>
                    {r.anhBia ? (
                      <img src={fileUrl(r.anhBia)} alt={r.tieuDe || ""} />
                    ) : (
                      <BookOpen />
                    )}
                  </div>
                  <div className={styles.metaWrap}>
                    <div className={styles.bookTitle}>{r.tieuDe}</div>
                    <div className={styles.sub}>Mã PM: {r.maPM}</div>
                  </div>
                </div>
              </td>
              <td>{r.soLuongMuon}</td>
              <td>{r.soLuongTra}</td>
              <td>
                {r.ngayHenTra
                  ? new Date(r.ngayHenTra).toLocaleDateString()
                  : "—"}
              </td>
              <td>
                {r.ngayTra ? new Date(r.ngayTra).toLocaleDateString() : "—"}
              </td>
              <td>
                <span
                  className={
                    r.trangThai === "Chờ lấy"
                      ? styles.badgeInfo
                      : r.trangThai?.startsWith("Đã")
                      ? styles.badgeOk
                      : r.trangThai?.includes("thiếu")
                      ? styles.badgeWarn
                      : styles.badge
                  }
                >
                  {r.trangThai}
                </span>
              </td>
              <td>
                {r.trangThai === "Chờ lấy" ? (
                  <button
                    className={styles.danger}
                    onClick={() => onCancel(r.maPM)}
                  >
                    Hủy phiếu
                  </button>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan="8">Chưa có lịch sử</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className={styles.pagination}>
        <button
          disabled={meta.page <= 1}
          onClick={() => fetchData(meta.page - 1)}
        >
          ‹ Trước
        </button>
        <span>Trang {meta.page}</span>
        <button
          disabled={meta.page * meta.pageSize >= meta.total}
          onClick={() => fetchData(meta.page + 1)}
        >
          Sau ›
        </button>
      </div>

      {loading && <div className={styles.loading}>Đang tải…</div>}
    </div>
  );
}
