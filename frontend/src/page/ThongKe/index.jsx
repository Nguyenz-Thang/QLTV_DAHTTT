import { useContext, useEffect, useMemo, useState } from "react";
import styles from "./ThongKe.module.scss";
import { AuthContext } from "../../context/AuthContext";
import { Search, BookOpen, Clock } from "lucide-react";

const API = "http://localhost:5000/api/thongke";
const FILE_HOST = import.meta.env.VITE_FILE_HOST || "http://localhost:5000";

/** Fallback ảnh bìa: dùng PNG trong suốt 1x1*/
function svgCoverFallback() {
  // 1x1 transparent PNG (base64)
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";
}

/** Lựa URL ảnh bìa khả dụng (tự ghép FILE_HOST nếu là path tương đối) */
function resolveCoverURL(book) {
  const raw = book?.anhBia || book?.hinhAnh || book?.image || "";
  if (!raw) return "";
  const url = String(raw);
  if (/^https?:\/\//i.test(url)) return url;
  return `${FILE_HOST}${url.startsWith("/") ? "" : "/"}${url}`;
}

/* ------------ Subcomponent: Top 3 sách --------------- */
function TopBooks({ data = [] }) {
  if (!data?.length) {
    return <div className={styles.muted}>Không có dữ liệu top sách.</div>;
  }
  return (
    <div className={styles.topBooksGrid}>
      {data.slice(0, 3).map((item, i) => {
        const primaryURL = resolveCoverURL(item);
        const fallbackURL = svgCoverFallback(item.tieuDe);
        const src = primaryURL || fallbackURL;

        return (
          <div key={i} className={styles.topBookCard}>
            <img
              src={src}
              alt={item.tieuDe}
              className={styles.topBookImage}
              onError={(e) =>
                (e.currentTarget.src = svgCoverFallback(item.tieuDe))
              }
            />
            <div className={styles.topBookInfo}>
              <h4 title={item.tieuDe}>{item.tieuDe}</h4>
              <p>Tác giả: {item.tacGia || "Chưa rõ"}</p>
              {typeof item.soLanMuon !== "undefined" && (
                <p className="muted">Lượt mượn: {item.soLanMuon}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------- Trang Thống kê ------------------- */
export default function ThongKe() {
  const { token } = useContext(AuthContext) ?? {};
  const [data, setData] = useState(null);
  const [search, setSearch] = useState(""); // tìm trong bảng chi tiết
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [details, setDetails] = useState([]);

  // NEW: trạng thái cho bộ lọc rỗng
  const [hasFiltered, setHasFiltered] = useState(false); // NEW
  const [dateErr, setDateErr] = useState(""); // NEW

  const validateRange = (f, t) => {
    // NEW
    if (!f || !t) return "";
    return f > t ? "Từ ngày không được lớn hơn Đến ngày." : "";
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(API, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
        if (!ignore) {
          setData(json.data || json);
          setDetails((json.data && json.data.details) || []);
        }
      } catch (e) {
        if (!ignore) setErr(e.message || "Lỗi tải thống kê");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => (ignore = true);
  }, [token]);

  const overview = data?.overview || {
    tongDauSach: 0,
    soBanDangMuon: 0,
    soPhieuQuaHan: 0,
  };
  const topBooks = (data?.topBooks || []).slice(0, 3);

  // Lọc bảng "Danh sách chi tiết mượn sách"
  const filteredDetails = useMemo(() => {
    const k = (search || "").trim().toLowerCase();
    if (!k) return details;
    return details.filter((r) => {
      return (
        String(r.maPM || "")
          .toLowerCase()
          .includes(k) ||
        String(r.maSach || "")
          .toLowerCase()
          .includes(k) ||
        String(r.tenSach || "")
          .toLowerCase()
          .includes(k) ||
        String(r.tenThuThu || "")
          .toLowerCase()
          .includes(k) ||
        String(r.tenDocGia || "")
          .toLowerCase()
          .includes(k)
      );
    });
  }, [details, search]);

  async function handleFilter() {
    // validate khoảng ngày
    const message = validateRange(from, to);
    if (message) {
      setDateErr(message);
      return;
    }
    if (!from || !to) {
      setHasFiltered(true); // vẫn coi là đã bấm lọc để hiện khung & thông báo
      setDetails([]); // CHANGED: làm trống dữ liệu
      return;
    }

    try {
      setLoading(true);
      setErr("");
      setHasFiltered(true); // NEW
      const url = new URL(API);
      url.searchParams.append("from", from);
      url.searchParams.append("to", to);
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
      const nextDetails = (json.data && json.data.details) || [];
      setDetails(nextDetails);
    } catch (e) {
      setErr(e.message || "Lỗi tải dữ liệu thống kê theo ngày");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h2>Thống kê thư viện</h2>
      </div>

      {loading && <div className={styles.loading}>Đang tải…</div>}
      {err && !loading && <div className={styles.error}>{err}</div>}

      {!loading && !err && (
        <>
          {/* Cards tổng quan */}
          <div className={styles.cards}>
            <Card
              icon={<BookOpen />}
              title="Tổng đầu sách"
              value={overview.tongDauSach}
            />
            <Card
              icon={<Clock />}
              title="Sách đang mượn"
              value={overview.soBanDangMuon}
            />
            <Card
              icon={<Clock />}
              title="Phiếu quá hạn"
              value={overview.soPhieuQuaHan}
            />
          </div>

          {/* Top 3 sách */}
          <section className={styles.block}>
            <div className={styles.blockHead}>
              <div className={styles.blockTitle}>
                <BookOpen /> Top 3 sách được mượn nhiều nhất
              </div>
            </div>
            <TopBooks data={topBooks} />
          </section>

          {/* Bảng chi tiết mượn — luôn hiển thị KHÔNG phụ thuộc details.length */}
          <section className={styles.block}>
            <div className={styles.blockHead}>
              <div className={styles.blockTitle}>
                <BookOpen /> Danh sách chi tiết mượn sách
              </div>
            </div>

            {/* Bộ lọc theo ngày */}
            <div className={styles.dateRange}>
              <label>
                Từ:
                <input
                  type="date"
                  value={from}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFrom(v);
                    setDateErr(validateRange(v, to));
                  }}
                  max={to || undefined}
                />
              </label>
              <label>
                Đến:
                <input
                  type="date"
                  value={to}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTo(v);
                    setDateErr(validateRange(from, v));
                  }}
                  min={from || undefined}
                />
              </label>
              <button onClick={handleFilter} disabled={!!dateErr}>
                Lọc
              </button>

              {/* Lỗi khoảng ngày */}
              {dateErr && <div className={styles.error}>{dateErr}</div>}

              {/* Thanh tìm kiếm luôn hiển thị */}
              <div className={styles.searchBox}>
                <Search className={styles.searchIcon} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm trong danh sách mượn: mã PM / mã sách / tiêu đề / thủ thư / độc giả…"
                />
                {search && (
                  <button
                    className={styles.clear}
                    onClick={() => setSearch("")}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Bảng — luôn xuất hiện; nếu không có dòng thì hiển thị hàng “không có bản ghi” */}
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Mã sách</th>
                  <th>Tên sách</th>
                  <th>Tên thủ thư</th>
                  <th>Tên độc giả</th>
                  <th>Ngày mượn</th>
                  <th>Ngày trả</th>
                  <th style={{ textAlign: "right" }}>Số lượng</th>
                </tr>
              </thead>
              <tbody>
                {filteredDetails.map((r, i) => (
                  <tr key={i}>
                    <td>{r.maSach}</td>
                    <td>{r.tenSach}</td>
                    <td>{r.tenThuThu || "—"}</td>
                    <td>{r.tenDocGia || "—"}</td>
                    <td>
                      {r.ngayMuon
                        ? new Date(r.ngayMuon).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      {r.ngayHenTra
                        ? new Date(r.ngayHenTra).toLocaleDateString()
                        : "—"}
                    </td>
                    <td style={{ textAlign: "right" }}>{r.soLuong}</td>
                  </tr>
                ))}
                {filteredDetails.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      style={{ textAlign: "center", padding: 22 }}
                    >
                      Không có dữ liệu trong khoảng ngày đã chọn.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}

/* Card tổng quan */
function Card({ icon, title, value }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardIcon}>{icon}</div>
      <div className={styles.cardInfo}>
        <div className={styles.cardTitle}>{title}</div>
        <div className={styles.cardValue}>{value}</div>
      </div>
    </div>
  );
}
