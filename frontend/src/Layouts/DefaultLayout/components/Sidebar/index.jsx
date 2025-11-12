import { useContext, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Logs,
  Home,
  BookOpen,
  Settings,
  LogOut,
  ClipboardList,
  Users,
  UserCheck,
  UserCog,
  Building2,
  Tags,
  PenLine,
  ChevronRight,
  ChevronDown,
  FilePlus2,
  Undo2,
  ChartColumn,
} from "lucide-react";
import styles from "./Sidebar.module.scss";
import { AuthContext } from "../../../../context/AuthContext";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);
  const { user, logout } = useContext(AuthContext) ?? {};
  const displayName = user?.hoTen || "Khách";
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    displayName
  )}&background=random&size=128`;

  const toggleGroup = (key) =>
    setOpenGroup((prev) => (prev === key ? null : key));

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.brand}>
        <span
          className={styles.toggle}
          onClick={() => setCollapsed((v) => !v)}
          aria-label="Toggle sidebar"
        >
          <Logs />
        </span>
        <span className={styles.brandText}></span>
      </div>

      <nav className={styles.menu}>
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `${styles.item} ${isActive ? styles.active : ""}`
          }
        >
          <Home className={styles.icon} />
          <span className={styles.label}>Home</span>
        </NavLink>

        <NavLink
          to="/sach"
          className={({ isActive }) =>
            `${styles.item} ${isActive ? styles.active : ""}`
          }
        >
          <BookOpen className={styles.icon} />
          <span className={styles.label}>Sách</span>
        </NavLink>

        <NavLink
          to="/history"
          className={({ isActive }) =>
            `${styles.item} ${isActive ? styles.active : ""}`
          }
        >
          <ClipboardList className={styles.icon} />
          <span className={styles.label}>Lịch sử mượn trả</span>
        </NavLink>

        <NavLink
          to="/admin/thong-ke"
          className={({ isActive }) =>
            `${styles.item} ${isActive ? styles.active : ""}`
          }
        >
          <ChartColumn className={styles.icon} />
          <span className={styles.label}>Thống kê</span>
        </NavLink>

        <NavLink
          to="/admin/accounts"
          className={({ isActive }) =>
            `${styles.item} ${isActive ? styles.active : ""}`
          }
        >
          <UserCog className={styles.icon} />
          <span className={styles.label}>Quản lý tài khoản</span>
        </NavLink>

        {/* ====== NHÓM: Quản lý sách ====== */}
        <div className={styles.group}>
          <button
            type="button"
            className={`${styles.item} ${styles.groupHeader} ${
              openGroup === "books" ? styles.expanded : ""
            }`}
            onClick={() => toggleGroup("books")}
          >
            <BookOpen className={styles.icon} />
            <span className={styles.label}>Quản lý sách</span>
            <span className={styles.chev}>
              {openGroup === "books" ? <ChevronDown /> : <ChevronRight />}
            </span>
          </button>

          <div
            className={`${styles.sub} ${
              openGroup === "books" ? styles.subOpen : ""
            } ${collapsed ? styles.subCollapsed : ""}`}
          >
            <NavLink
              to="/admin/books"
              className={({ isActive }) =>
                `${styles.subItem} ${isActive ? styles.active : ""}`
              }
            >
              <BookOpen className={styles.iconSm} />
              <span>Sách</span>
            </NavLink>

            <NavLink
              to="/admin/nxb"
              className={({ isActive }) =>
                `${styles.subItem} ${isActive ? styles.active : ""}`
              }
            >
              <Building2 className={styles.iconSm} />
              <span>NXB</span>
            </NavLink>

            <NavLink
              to="/admin/categories"
              className={({ isActive }) =>
                `${styles.subItem} ${isActive ? styles.active : ""}`
              }
            >
              <Tags className={styles.iconSm} />
              <span>Thể loại</span>
            </NavLink>

            <NavLink
              to="/admin/authors"
              className={({ isActive }) =>
                `${styles.subItem} ${isActive ? styles.active : ""}`
              }
            >
              <PenLine className={styles.iconSm} />
              <span>Tác giả</span>
            </NavLink>
          </div>
        </div>

        {/* ====== NHÓM: Quản lý mượn trả ====== */}
        <div className={styles.group}>
          <button
            type="button"
            className={`${styles.item} ${styles.groupHeader} ${
              openGroup === "loans" ? styles.expanded : ""
            }`}
            onClick={() => toggleGroup("loans")}
          >
            <ClipboardList className={styles.icon} />
            <span className={styles.label}>Quản lý mượn trả</span>
            <span className={styles.chev}>
              {openGroup === "loans" ? <ChevronDown /> : <ChevronRight />}
            </span>
          </button>

          <div
            className={`${styles.sub} ${
              openGroup === "loans" ? styles.subOpen : ""
            } ${collapsed ? styles.subCollapsed : ""}`}
          >
            <NavLink
              to="/admin/phieu-muon"
              className={({ isActive }) =>
                `${styles.subItem} ${isActive ? styles.active : ""}`
              }
            >
              <FilePlus2 className={styles.iconSm} />
              <span>Phiếu mượn</span>
            </NavLink>

            <NavLink
              to="/admin/phieu-tra"
              className={({ isActive }) =>
                `${styles.subItem} ${isActive ? styles.active : ""}`
              }
            >
              <Undo2 className={styles.iconSm} />
              <span>Phiếu trả</span>
            </NavLink>
          </div>
        </div>

        <NavLink
          to="/admin/thuthu"
          className={({ isActive }) =>
            `${styles.item} ${isActive ? styles.active : ""}`
          }
        >
          <UserCheck className={styles.icon} />
          <span className={styles.label}>Quản lý thủ thư</span>
        </NavLink>

        <NavLink
          to="/admin/docgia"
          className={({ isActive }) =>
            `${styles.item} ${isActive ? styles.active : ""}`
          }
        >
          <Users className={styles.icon} />
          <span className={styles.label}>Quản lý độc giả</span>
        </NavLink>
      </nav>

      <div className={styles.line1} />

      <div className={styles.user}>
        <img className={styles.avatar} src={avatarUrl} alt={displayName} />
        <div className={styles.userInfo}>
          <div className={styles.name}>{displayName}</div>
          <div className={styles.role}>Người dùng</div>
        </div>
      </div>

      <div className={styles.bottom}>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `${styles.item} ${isActive ? styles.active : ""}`
          }
        >
          <Settings className={styles.icon} />
          <span className={styles.label}>Cài đặt</span>
        </NavLink>
        <button
          className={`${styles.item} ${styles.asButton}`}
          onClick={logout}
        >
          <LogOut className={styles.icon} />
          <span className={styles.label}>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
