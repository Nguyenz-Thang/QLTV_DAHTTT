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
} from "lucide-react";
import styles from "./Sidebar.module.scss";
import { AuthContext } from "../../../../context/AuthContext"; // chỉnh path nếu khác

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useContext(AuthContext) ?? {};
  const displayName = user?.hoTen || "Khách";
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    displayName
  )}&background=random&size=128`;

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      {/* Brand + toggle */}
      <div className={styles.brand}>
        <span
          className={styles.toggle}
          onClick={() => setCollapsed((v) => !v)}
          aria-label="Toggle sidebar"
        >
          <Logs />
        </span>

        <span className={styles.brandText}></span>
        {/* <button
          className={styles.toggle}
          onClick={() => setCollapsed((v) => !v)}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </button> */}
      </div>

      {/* Menu chính */}
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
        {["Quản lý", "Thủ thư", "Độc giả"].includes(user.vaiTro) && (
          <NavLink
            to="/sach"
            className={({ isActive }) =>
              `${styles.item} ${isActive ? styles.active : ""}`
            }
          >
            <BookOpen className={styles.icon} />
            <span className={styles.label}>Sách</span>
          </NavLink>
        )}
        {/* Quản lý tài khoản — chỉ Quản lý */}
        {user?.vaiTro === "Quản lý" && (
          <NavLink
            to="/admin/accounts"
            className={({ isActive }) =>
              `${styles.item} ${isActive ? styles.active : ""}`
            }
          >
            <UserCog className={styles.icon} />
            <span className={styles.label}>Quản lý tài khoản</span>
          </NavLink>
        )}

        {/* Quản lý sách — Quản lý & Thủ thư */}
        {["Quản lý", "Thủ thư"].includes(user?.vaiTro) && (
          <NavLink
            to="/admin/books"
            className={({ isActive }) =>
              `${styles.item} ${isActive ? styles.active : ""}`
            }
          >
            <BookOpen className={styles.icon} />
            <span className={styles.label}>Quản lý sách</span>
          </NavLink>
        )}

        {/* Quản lý phiếu mượn trả — Quản lý & Thủ thư */}
        {["Quản lý", "Thủ thư"].includes(user?.vaiTro) && (
          <NavLink
            to="/admin/loans"
            className={({ isActive }) =>
              `${styles.item} ${isActive ? styles.active : ""}`
            }
          >
            <ClipboardList className={styles.icon} />
            <span className={styles.label}>Quản lý mượn trả</span>
          </NavLink>
        )}

        {/* Quản lý thủ thư — chỉ Quản lý */}
        {user?.vaiTro === "Quản lý" && (
          <NavLink
            to="/admin/librarians"
            className={({ isActive }) =>
              `${styles.item} ${isActive ? styles.active : ""}`
            }
          >
            <UserCheck className={styles.icon} />
            <span className={styles.label}>Quản lý thủ thư</span>
          </NavLink>
        )}

        {/* Quản lý độc giả — chỉ Quản lý */}
        {["Quản lý", "Thủ thư"].includes(user?.vaiTro) && (
          <NavLink
            to="/admin/readers"
            className={({ isActive }) =>
              `${styles.item} ${isActive ? styles.active : ""}`
            }
          >
            <Users className={styles.icon} />
            <span className={styles.label}>Quản lý độc giả</span>
          </NavLink>
        )}
      </nav>

      <div className={styles.line1} />

      {/* Khu vực user */}
      <div className={styles.user}>
        <img className={styles.avatar} src={avatarUrl} alt={displayName} />
        <div className={styles.userInfo}>
          <div className={styles.name}>{displayName}</div>
          <div className={styles.role}>{user?.vaiTro || "Độc giả"}</div>
        </div>
      </div>

      {/* Menu dưới */}
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
