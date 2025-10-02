import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import styles from "./BookList.module.scss";
export default function BookListPage() {
  const { token, logout } = useContext(AuthContext);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    async function fetchBooks() {
      setLoading(true);
      setErr(null);
      setTimeout(async () => {
        try {
          const res = await fetch("http://localhost:5000/api/sach", {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          });
          if (res.status === 401 || res.status === 403) {
            // token invalid/expired -> logout and redirect to login
            logout();
            nav("/login");
            return;
          }
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Lấy sách thất bại");
          setBooks(data.data || []);
          console.log(data.data);
        } catch (error) {
          if (error.name !== "AbortError") setErr(error.message);
        } finally {
          setLoading(false);
        }
      }, 3000);
    }
    fetchBooks();
    return () => controller.abort();
  }, [token, logout, nav]);

  return (
    <div style={{ padding: 20 }} className={styles.body}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>Danh sách sách</h2>
        <div>
          <button
            onClick={() => {
              logout();
              nav("/login");
            }}
            style={{ marginRight: 8 }}
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles["spinner-follow-the-leader-line"]}>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      ) : null}
      {err && <div style={{ color: "crimson" }}>{err}</div>}

      {!loading && books.length === 0 && <p>Không có sách nào.</p>}

      <ul>
        {books.map((b) => (
          <li
            key={b.maSach}
            style={{ padding: 8, borderBottom: "1px solid #eee" }}
          >
            <strong>{b.tieuDe}</strong>{" "}
            <div style={{ fontSize: 13, color: "#666" }}>
              Số lượng: {b.soLuong} | Đang mượn: {b.soLuongMuon}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
