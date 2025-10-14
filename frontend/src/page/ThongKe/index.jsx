import { useContext, useEffect, useMemo, useState } from "react";
import styles from "./ThongKe.module.scss";
import { AuthContext } from "../../context/AuthContext";
import {
  Search,
  TrendingUp,
  BookOpen,
  Clock,
  AlertTriangle,
} from "lucide-react";

const API = "http://localhost:5000/api/thongke";

export default function ThongKe() {
  const { token } = useContext(AuthContext) ?? {};
  const [data, setData] = useState(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

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
        if (!ignore) setData(json.data || json);
      } catch (e) {
        if (!ignore) setErr(e.message || "Lỗi tải thống kê");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => (ignore = true);
  }, [token]);

  const monthly = data?.monthly || [];
  const topBooks = data?.topBooks || [];
  const overdue = data?.overdue || [];
  const overview = data?.overview || {
    tongDauSach: 0,
    soBanDangMuon: 0,
    soPhieuQuaHan: 0,
  };

  // Tìm nhanh trong bảng top sách
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

  return (
    <div className={styles.page}>
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
              icon={<AlertTriangle />}
              title="Phiếu quá hạn"
              value={overview.soPhieuQuaHan}
            />
          </div>

          {/* Biểu đồ mượn theo tháng (mini bar chart CSS) */}
          <section className={styles.block}>
            <div className={styles.blockHead}>
              <div className={styles.blockTitle}>
                <TrendingUp /> Mượn theo tháng (số bản)
              </div>
            </div>
            <MiniBarChart data={monthly} />
          </section>

          {/* Top sách mượn nhiều */}
          <section className={styles.block}>
            <div className={styles.blockHead}>
              <div className={styles.blockTitle}>
                <BookOpen /> Top sách mượn nhiều
              </div>
            </div>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 120 }}>Mã sách</th>
                  <th>Tiêu đề</th>
                  <th style={{ width: 140, textAlign: "right" }}>Tổng mượn</th>
                </tr>
              </thead>
              <tbody>
                {filteredTop.map((r) => (
                  <tr key={r.maSach}>
                    <td>{r.maSach}</td>
                    <td className={styles.titleCell}>{r.tieuDe}</td>
                    <td style={{ textAlign: "right" }}>{r.soLanMuon}</td>
                  </tr>
                ))}
                {filteredTop.length === 0 && (
                  <tr>
                    <td
                      colSpan="3"
                      style={{ textAlign: "center", padding: 16 }}
                    >
                      Không có dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {/* Phiếu quá hạn gần nhất */}
          <section className={styles.block}>
            <div className={styles.blockHead}>
              <div className={styles.blockTitle}>
                <AlertTriangle /> Phiếu mượn quá hạn (gần nhất)
              </div>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: 120 }}>Mã PM</th>
                  <th>Độc giả</th>
                  <th style={{ width: 140 }}>Ngày mượn</th>
                  <th style={{ width: 140 }}>Hẹn trả</th>
                </tr>
              </thead>
              <tbody>
                {(overdue || []).map((r) => (
                  <tr key={r.maPM}>
                    <td>{r.maPM}</td>
                    <td className={styles.titleCell}>{r.hoTen || "—"}</td>
                    <td>
                      {r.ngayMuon
                        ? new Date(r.ngayMuon).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className={styles.overdue}>
                      {r.ngayHenTra
                        ? new Date(r.ngayHenTra).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
                {(!overdue || overdue.length === 0) && (
                  <tr>
                    <td
                      colSpan="4"
                      style={{ textAlign: "center", padding: 16 }}
                    >
                      Không có phiếu quá hạn.
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

// Biểu đồ cột mini bằng CSS (không dùng lib)
function MiniBarChart({ data }) {
  // data: [{ ym: '2025-01', soPhieu, tongSach }]
  const max = Math.max(1, ...data.map((d) => Number(d.tongSach || 0)));
  return (
    <div className={styles.chartWrap}>
      {data.map((d) => {
        const h = Math.round((Number(d.tongSach || 0) / max) * 100);
        return (
          <div
            className={styles.chartCol}
            key={d.ym}
            title={`${d.ym}: ${d.tongSach}`}
          >
            <div className={styles.chartBar} style={{ height: `${h}%` }} />
            <div className={styles.chartLabel}>{d.ym.slice(5)}</div>
          </div>
        );
      })}
      {data.length === 0 && (
        <div className={styles.emptyChart}>Không có dữ liệu.</div>
      )}
    </div>
  );
}
