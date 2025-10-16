import { useContext, useEffect, useMemo, useState } from "react";
import styles from "./ThongKe.module.scss";
import { AuthContext } from "../../context/AuthContext";
import { Search, BookOpen, Clock } from "lucide-react";

const API = "http://localhost:5000/api/thongke";

/** SVG fallback bìa sách (tạo ảnh với chữ cái đầu) */
function svgCoverFallback(title = "", w = 180, h = 240) {
  const t = (title || "").trim();
  const initial = t ? t[0].toUpperCase() : "S";
  const seed = t.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const c1 = 180 + (seed % 60);
  const c2 = 140 + ((seed >> 1) % 70);

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="hsl(${c1},60%,75%)"/>
        <stop offset="100%" stop-color="hsl(${c2},60%,65%)"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" rx="12" fill="url(#g)"/>
    <text x="50%" y="56%" text-anchor="middle" font-family="Inter,Segoe UI,Roboto,sans-serif"
          font-size="${Math.floor(
            w * 0.45
          )}" fill="rgba(0,0,0,0.65)" font-weight="700" dominant-baseline="middle">
      ${initial}
    </text>
  </svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

/** Lựa URL ảnh bìa khả dụng */
function resolveCoverURL(book) {
  const cands = [
    book?.anhBia,
    book?.hinhAnh,
    book?.image,
    book?.taiLieuOnl,
    `/covers/${book?.maSach}.jpg`,
    `/covers/${book?.maSach}.png`,
    `/images/books/${book?.maSach}.jpg`,
    `/images/books/${book?.maSach}.png`,
  ].filter(Boolean);
  return cands[0] || "";
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
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [details, setDetails] = useState([]);

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

  const filteredTop = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return topBooks;
    return topBooks.filter(
      (x) =>
        String(x.maSach).toLowerCase().includes(k) ||
        String(x.tieuDe || "")
          .toLowerCase()
          .includes(k)
    );
  }, [q, topBooks]);

  async function handleFilter() {
    if (!from || !to) {
      alert("Vui lòng chọn đủ Từ ngày và Đến ngày");
      return;
    }
    try {
      setLoading(true);
      setErr("");
      const url = new URL(API);
      url.searchParams.append("from", from);
      url.searchParams.append("to", to);
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
      setDetails((json.data && json.data.details) || []);
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

        <div className={styles.searchBox}>
          <Search className={styles.searchIcon} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm top sách theo mã/tiêu đề…"
          />
          {q && (
            <button className={styles.clear} onClick={() => setQ("")}>
              ×
            </button>
          )}
        </div>
      </div>

      {/* Bộ lọc theo ngày */}
      <div className={styles.dateRange}>
        <label>
          Từ:
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          Đến:
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <button onClick={handleFilter}>Lọc</button>
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
            <TopBooks data={filteredTop} />
          </section>

          {/* Bảng chi tiết mượn */}
          {details.length > 0 && (
            <section className={styles.block}>
              <div className={styles.blockHead}>
                <div className={styles.blockTitle}>
                  <BookOpen /> Danh sách chi tiết mượn sách
                </div>
              </div>
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
                  {details.map((r, i) => (
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
                </tbody>
              </table>
            </section>
          )}
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
