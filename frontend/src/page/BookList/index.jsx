import React, { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import styles from "./BookList.module.scss";
import { Search, BookOpen } from "lucide-react";

const API = "http://localhost:5000/api/sach";
const META_API = "http://localhost:5000/api/sach/meta";

export default function BookListPage() {
  const { token, logout } = useContext(AuthContext) ?? {};
  const [books, setBooks] = useState([]);
  const [theLoai, setTheLoai] = useState([]); // [{maTL, tenTL}]
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [maTL, setMaTL] = useState(""); // chọn thể loại
  const nav = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        // lấy sách + meta song song
        const [resBooks, resMeta] = await Promise.all([
          fetch(API, { headers, signal: controller.signal }),
          fetch(META_API, { headers, signal: controller.signal }),
        ]);

        if (resBooks.status === 401 || resMeta.status === 401) {
          logout?.();
          nav("/login", { replace: true });
          return;
        }
        if (resBooks.status === 403 || resMeta.status === 403) {
          setErr("Bạn không có quyền xem danh sách sách.");
          setBooks([]);
          setTheLoai([]);
          return;
        }

        const dataBooks = await resBooks.json();
        const dataMeta = await resMeta.json();

        if (!resBooks.ok)
          throw new Error(dataBooks.message || "Lấy sách thất bại");
        if (!resMeta.ok)
          throw new Error(dataMeta.message || "Lấy thể loại thất bại");

        setBooks(dataBooks.data || []);
        setTheLoai(dataMeta.theLoai || []);
      } catch (e) {
        if (e.name !== "AbortError") setErr(e.message || "Lỗi mạng");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [token, logout, nav]);

  const mapTL = useMemo(
    () =>
      Object.fromEntries((theLoai || []).map((t) => [String(t.maTL), t.tenTL])),
    [theLoai]
  );

  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase();
    let arr = books;

    // lọc theo thể loại (ưu tiên so theo maTL; fallback theo tenTL)
    if (maTL) {
      const tenTL = mapTL[String(maTL)] || "";
      arr = arr.filter(
        (b) =>
          (b.maTL && String(b.maTL) === String(maTL)) ||
          (b.tenTL || "").toLowerCase() === tenTL.toLowerCase()
      );
    }

    if (key) {
      arr = arr.filter(
        (b) =>
          (b.tieuDe || "").toLowerCase().includes(key) ||
          (b.tenTG || "").toLowerCase().includes(key) ||
          (b.tenTL || "").toLowerCase().includes(key)
      );
    }
    return arr;
  }, [q, maTL, books, mapTL]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2>Thư viện sách</h2>

        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <Search className={styles.searchIcon} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tiêu đề, tác giả, thể loại…"
            />
            {q && (
              <button
                className={styles.clear}
                onClick={() => setQ("")}
                aria-label="Xóa tìm kiếm"
              >
                ×
              </button>
            )}
          </div>

          <select
            className={styles.select}
            value={maTL}
            onChange={(e) => setMaTL(e.target.value)}
          >
            <option value="">Tất cả thể loại</option>
            {theLoai.map((t) => (
              <option key={t.maTL} value={t.maTL}>
                {t.tenTL}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className={styles.loading}>Đang tải danh sách…</div>}
      {err && !loading && <div className={styles.error}>{err}</div>}
      {!loading && !err && filtered.length === 0 && (
        <div className={styles.empty}>Không tìm thấy sách phù hợp.</div>
      )}

      {!loading && !err && filtered.length > 0 && (
        <div className={styles.grid}>
          {filtered.map((b) => (
            <article
              key={b.maSach}
              className={styles.card}
              onClick={() => nav(`/sach/${b.maSach}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && nav(`/sach/${b.maSach}`)}
            >
              <div className={styles.cover}>
                <BookOpen />
              </div>

              <div className={styles.info}>
                <h3 className={styles.title} title={b.tieuDe}>
                  {b.tieuDe}
                </h3>
                <div className={styles.meta}>
                  {b.tenTG && (
                    <span className={styles.pill}>Tác giả: {b.tenTG}</span>
                  )}
                  {(b.tenTL || mapTL[b.maTL]) && (
                    <span className={styles.pill}>
                      Thể loại: {b.tenTL || mapTL[b.maTL]}
                    </span>
                  )}
                  {b.tenNXB && (
                    <span className={styles.pill}>NXB: {b.tenNXB}</span>
                  )}
                </div>
                {/* <div className={styles.stock}>
                  SL: <b>{b.soLuong ?? 0}</b>
                </div> */}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
