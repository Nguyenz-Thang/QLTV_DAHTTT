import { useEffect, useMemo, useState } from "react";
import { useLichSuApi } from "../../api/lichsuApi";
import styles from "./HistoryPage.module.scss";

const FILE_HOST = import.meta.env.VITE_FILE_HOST || "http://localhost:5000";

export default function HistoryPage({ maTK }) {
  // nếu xem của người khác, truyền maTK; còn lại dùng của mình
  const { getMine, getByAccount } = useLichSuApi();
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
    fetchData(1); /* eslint-disable-next-line*/
  }, []);

  const onFilter = (e) => {
    const { name, value } = e.target;
    setQ((s) => ({ ...s, [name]: value }));
  };

  const applyFilters = (e) => {
    e.preventDefault();
    fetchData(1);
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
            <option value="partial">Đang mượn (trả thiếu)</option>
            <option value="returned">Đã trả</option>
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
            <th>Ngày trả</th>
            <th>Tình trạng</th>
            {/* <th>TL online</th> */}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.maPM}-${r.maSach}-${i}`}>
              <td>{new Date(r.ngayMuon).toLocaleDateString()}</td>
              <td>
                <div className={styles.bookCell}>
                  {r.anhBia ? (
                    <img src={`${FILE_HOST}${r.anhBia}`} alt="" />
                  ) : (
                    <div className={styles.noCover} />
                  )}
                  <div>
                    <div className={styles.bookTitle}>{r.tieuDe}</div>
                    <div className={styles.sub}>Mã PM: {r.maPM}</div>
                  </div>
                </div>
              </td>
              <td>{r.soLuongMuon}</td>
              <td>{r.soLuongTra}</td>
              <td>
                {r.ngayTra ? new Date(r.ngayTra).toLocaleDateString() : "—"}
              </td>
              <td>
                <span
                  className={
                    r.trangThai.startsWith("Đã")
                      ? styles.badgeOk
                      : r.trangThai.includes("thiếu")
                      ? styles.badgeWarn
                      : styles.badge
                  }
                >
                  {r.trangThai}
                </span>
              </td>
              {/* <td>
                {r.taiLieuOnl ? (
                  <a
                    href={`${FILE_HOST}${r.taiLieuOnl}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Tải
                  </a>
                ) : (
                  "—"
                )}
              </td> */}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan="7">Chưa có lịch sử</td>
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
