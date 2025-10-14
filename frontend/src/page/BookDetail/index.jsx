import { useContext, useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import styles from "./BookDetail.module.scss";
import {
  BookOpen,
  Download,
  Send,
  Edit2,
  Trash2,
  CornerDownRight,
  Ellipsis,
} from "lucide-react";

const API = "http://localhost:5000/api/sach";
const CMT_API = "http://localhost:5000/api/binhluan";
const QUICK_BORROW_API = "http://localhost:5000/api/phieumuon/quick";
const FILE_HOST = import.meta.env.VITE_FILE_HOST || "http://localhost:5000";

export default function BookDetail() {
  const { maSach } = useParams();
  const { token, user, logout } = useContext(AuthContext) ?? {};
  const nav = useNavigate();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [comments, setComments] = useState([]);
  const [cLoading, setCLoading] = useState(true);
  const [newText, setNewText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");

  // ===== LOAD BOOK =====
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API}/${maSach}`, {
          headers,
          signal: controller.signal,
        });
        if (res.status === 401) {
          logout?.();
          nav("/login", { replace: true });
          return;
        }
        if (res.status === 403) {
          setErr("Bạn không có quyền xem sách này.");
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Lỗi lấy chi tiết sách");
        setBook(data.data || data);
      } catch (e) {
        if (e.name !== "AbortError") setErr(e.message || "Lỗi mạng");
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [maSach, token, logout, nav]);

  // ===== LOAD COMMENTS =====
  const loadComments = async () => {
    setCLoading(true);
    try {
      const res = await fetch(
        `${CMT_API}?sachId=${encodeURIComponent(maSach)}`
      );
      const data = await res.json();
      // data.data là mảng [{id, maBL, maSach, maTK, maBLCha, noiDung, ngayBL, hoTen}]
      setComments(Array.isArray(data.data) ? data.data : []);
    } finally {
      setCLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [maSach]);

  // build tree
  // build tree
  const tree = useMemo(() => {
    const byParent = new Map();
    comments.forEach((c) => {
      const k = c.maBLCha ?? "root"; // <<< đổi từ binhLuanChaId -> maBLCha
      if (!byParent.has(k)) byParent.set(k, []);
      byParent.get(k).push(c);
    });
    return byParent;
  }, [comments]);

  const childrenOf = (pid) => tree.get(pid ?? "root") || [];

  // ===== CRUD =====
  async function addComment(parentId) {
    const text = parentId ? editText : newText;
    if (!text.trim()) return;
    const res = await fetch(CMT_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        maSach,
        noiDung: text.trim(),
        maBLCha: parentId ?? null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return alert(data.message || "Không thêm được bình luận");
    await loadComments();
    parentId ? setEditText("") : setNewText("");
    setReplyTo(null);
  }

  async function updateComment(id) {
    if (!editText.trim()) return;
    const res = await fetch(`${CMT_API}/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ noiDung: editText.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return alert(data.message || "Không sửa được bình luận");
    await loadComments();
    setEditId(null);
    setEditText("");
  }

  // xóa cả thread
  async function deleteThread(id) {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này?")) return;
    const res = await fetch(`${CMT_API}/${id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return alert(data.message || "Không xoá được");
    await loadComments();
  }
  const [qty, setQty] = useState(1);
  const [due, setDue] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [borrowing, setBorrowing] = useState(false);

  const available = Math.max(
    0,
    Number(book?.soLuong || 0) - Number(book?.soLuongMuon || 0)
  );

  async function quickBorrow() {
    if (!token) {
      return nav("/login", { replace: true });
    }
    if (available <= 0) {
      return alert("Sách tạm hết bản để mượn.");
    }
    if (qty < 1 || qty > available) {
      return alert(`Số lượng phải từ 1 đến ${available}.`);
    }
    const ok = window.confirm(
      `Xác nhận mượn "${book.tieuDe}" với số lượng ${qty}?`
    );
    if (!ok) return;
    setBorrowing(true);

    try {
      const res = await fetch(QUICK_BORROW_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          maSach,
          soLuong: qty,
          ngayHenTra: due, // optional; backend có thể mặc định +7 ngày
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Mượn sách thất bại.");
      alert("Đã tạo phiếu mượn thành công!");
      // reload sách (để cập nhật soLuongMuon)
      const r2 = await fetch(`${API}/${maSach}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const d2 = await r2.json();
      setBook(d2.data || d2);
    } catch (e) {
      alert(e.message || "Không thể mượn sách.");
    } finally {
      setBorrowing(false);
    }
  }
  // ===== UI =====
  if (loading) return <div className={styles.page}>Đang tải…</div>;
  if (err)
    return (
      <div className={styles.page}>
        <div className={styles.error}>{err}</div>
      </div>
    );
  if (!book) return <div className={styles.page}>Không tìm thấy sách.</div>;

  return (
    <>
      <div className={styles.tab}>
        <div className={styles.nd}>
          <NavLink to="/sach" className={styles.item}>
            <span>Sách </span>
          </NavLink>
          <span className={styles.ct}>- Chi tiết sách</span>
        </div>
      </div>
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.coverWrap}>
            {book.anhBia ? (
              <img src={`${FILE_HOST}${book.anhBia}`} alt={book.tieuDe} />
            ) : (
              <BookOpen />
            )}
          </div>

          <div className={styles.metaWrap}>
            <h1 className={styles.title}>{book.tieuDe}</h1>
            {book.tomTat && <p className={styles.subtitle}>{book.tomTat}</p>}

            <div className={styles.chips}>
              {book.tenTG && (
                <span className={styles.chip}>Tác giả: {book.tenTG}</span>
              )}
              {book.tenTL && (
                <span className={styles.chip}>Thể loại: {book.tenTL}</span>
              )}
              {book.tenNXB && (
                <span className={styles.chip}>NXB: {book.tenNXB}</span>
              )}
            </div>

            {/* Nút tải tài liệu ONLINE – giữ nguyên class .download cũ */}
            {book.taiLieuOnl && (
              <a
                className={styles.download}
                href={`${FILE_HOST}${book.taiLieuOnl}`}
                target="_blank"
                rel="noreferrer"
              >
                <Download style={{ marginRight: 1 }} />
              </a>
            )}
          </div>
        </section>
        <div className={styles.borrowBox}>
          <div className={styles.borrowRow}>
            <div className={styles.avail}>
              Còn lại: <b>{available}</b> bản
            </div>
            <div className={styles.qty}>
              SL mượn:
              <input
                type="number"
                min={1}
                max={available || 1}
                value={qty}
                onChange={(e) =>
                  setQty(
                    Math.max(
                      1,
                      Math.min(available || 1, Number(e.target.value || 1))
                    )
                  )
                }
                disabled={available <= 0 || borrowing}
                readOnly
              />
            </div>
            <div className={styles.due}>
              Hẹn trả:
              <input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                disabled={borrowing}
              />
            </div>
            <button
              className={styles.primary}
              onClick={quickBorrow}
              disabled={available <= 0 || borrowing}
            >
              {borrowing ? "Đang mượn…" : "Mượn sách"}
            </button>
          </div>
          {available <= 0 && (
            <div className={styles.note}>
              Sách tạm hết, vui lòng quay lại sau.
            </div>
          )}
        </div>

        <section className={styles.comments}>
          <h2>Bình luận</h2>

          <div className={styles.editor}>
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Chia sẻ cảm nhận của bạn…"
              rows={3}
            />
            <button onClick={() => addComment(null)} className={styles.primary}>
              <Send size={18} /> Gửi
            </button>
          </div>

          {cLoading ? (
            <div className={styles.loading}>Đang tải bình luận…</div>
          ) : (
            <div className={styles.list}>
              {childrenOf(null).map((c) => (
                <CommentItem
                  key={c.id}
                  c={c}
                  depth={0}
                  childrenOf={childrenOf}
                  onReply={(id) => {
                    setReplyTo(id);
                    setEditId(null);
                    setEditText("");
                  }}
                  onEdit={(id, text) => {
                    setEditId(id);
                    setReplyTo(null);
                    setEditText(text);
                  }}
                  onDelete={deleteThread}
                  replyTo={replyTo}
                  editId={editId}
                  editText={editText}
                  setEditText={setEditText}
                  addReply={() => addComment(replyTo)}
                  update={() => updateComment(editId)}
                  currentUser={user}
                />
              ))}
              {childrenOf(null).length === 0 && (
                <div className={styles.empty}>Chưa có bình luận nào.</div>
              )}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function CommentItem({
  c,
  depth,
  childrenOf,
  onReply,
  onEdit,
  onDelete,
  replyTo,
  editId,
  editText,
  setEditText,
  addReply,
  update,
  currentUser,
}) {
  const child = childrenOf(c.id);
  const isReplying = replyTo === c.id;
  const isEditing = editId === c.id;
  const [menuOpen, setMenuOpen] = useState(false);

  // tên để render avatar
  const displayName =
    (currentUser?.maTK && currentUser?.maTK === c.maTK && currentUser?.hoTen) ||
    c.hoTen ||
    String(c.maTK || "User"); // <<< đổi taiKhoanId -> maTK

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    displayName
  )}&background=random`;

  return (
    <div className={styles.item} style={{ marginLeft: depth ? 20 : 0 }}>
      <div className={styles.row}>
        <img className={styles.avatarImg} src={avatarUrl} alt={displayName} />
        <div className={styles.body}>
          <div className={styles.head}>
            <span className={styles.author}>{displayName}</span>
            <span className={styles.time}>
              {new Date(c.ngayBL).toLocaleString()}
            </span>

            {/* menu ba chấm */}
            <div className={styles.menuWrap}>
              <button
                className={styles.menuBtn}
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Tùy chọn"
              >
                <Ellipsis size={18} />
              </button>
              {menuOpen && (
                <div className={styles.menu}>
                  <button
                    className={styles.menuItem}
                    onClick={() => {
                      onEdit(c.id, c.noiDung);
                      setMenuOpen(false);
                    }}
                  >
                    <Edit2 size={14} /> Sửa
                  </button>
                  <button
                    className={styles.menuItemDanger}
                    onClick={() => {
                      onDelete(c.id);
                      setMenuOpen(false);
                    }}
                  >
                    <Trash2 size={14} /> Xóa
                  </button>
                </div>
              )}
            </div>
          </div>
          {menuOpen && (
            <div
              className={styles.menuBackdrop}
              onClick={() => setMenuOpen(false)}
            />
          )}
          {!isEditing ? (
            <p className={styles.content}>{c.noiDung}</p>
          ) : (
            <div className={styles.inlineEditor}>
              <textarea
                rows={3}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
              />
              <div className={styles.actions}>
                <button onClick={update} className={styles.primary}>
                  <Edit2 size={16} /> Lưu
                </button>
                <button
                  onClick={() => setEditText("")}
                  className={styles.ghost}
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          {!isEditing && (
            <div className={styles.actions}>
              <button onClick={() => onReply(c.id)} className={styles.ghost}>
                <CornerDownRight size={14} /> Trả lời
              </button>
            </div>
          )}

          {isReplying && (
            <div className={styles.inlineEditor}>
              <textarea
                rows={3}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="Trả lời bình luận…"
              />
              <div className={styles.actions}>
                <button onClick={addReply} className={styles.primary}>
                  <Send size={16} /> Gửi
                </button>
                <button
                  onClick={() => setEditText("")}
                  className={styles.ghost}
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          {child.length > 0 &&
            child.map((x) => (
              <CommentItem
                key={x.id}
                c={x}
                depth={depth + 1}
                childrenOf={childrenOf}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                replyTo={replyTo}
                editId={editId}
                editText={editText}
                setEditText={setEditText}
                addReply={addReply}
                update={update}
                currentUser={currentUser}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
