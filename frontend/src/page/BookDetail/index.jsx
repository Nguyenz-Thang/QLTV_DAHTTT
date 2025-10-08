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
          <div className={styles.cover}>
            <BookOpen />
          </div>
          <div className={styles.info}>
            <h1 className={styles.title}>{book.tieuDe}</h1>
            {book.tomTat && <p className={styles.desc}>{book.tomTat}</p>}
            <div className={styles.meta}>
              {book.tenTG && (
                <span className={styles.pill}>Tác giả: {book.tenTG}</span>
              )}
              {(book.tenTL || book.theLoai) && (
                <span className={styles.pill}>
                  Thể loại: {book.tenTL || book.theLoai}
                </span>
              )}
              {book.tenNXB && (
                <span className={styles.pill}>NXB: {book.tenNXB}</span>
              )}
            </div>
            {book.taiLieuOnl && (
              <a
                className={styles.download}
                href={`http://localhost:5000${book.taiLieuOnl}`}
                target="_blank"
                rel="noreferrer"
              >
                <Download />
              </a>
            )}
          </div>
        </section>

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
