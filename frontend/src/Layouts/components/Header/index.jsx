import { useContext, useState } from "react";
import { AuthContext } from "../../../context/AuthContext";
import styles from "./Header.module.scss";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Key, LogOut } from "lucide-react";
import Modal from "../../../components/Modal";
function Header() {
  const { logout } = useContext(AuthContext);
  const { user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const nav = useNavigate();
  return (
    <>
      <header className={styles.header}>
        <div className={styles.content} onClick={() => setIsOpen(true)}>
          {/* {user && (
            <img
              id={styles.avt}
              src={`https://ui-avatars.com/api/?name=${user.hoTen}&background=random`}
              alt={user.hoTen}
            />
          )}

          {user ? `${user.hoTen}` : "Xin chào, Khách"}
          <ChevronDown /> */}
        </div>
      </header>
      <Modal
        isOpen={isOpen}
        onRequestClose={() => setIsOpen(false)}
        bodyOpenClassName="modal-custom-body"
        // closeTimeoutMS={3000}
      >
        <div className={styles.user}>
          {user && (
            <img
              id={styles.avt2}
              src={`https://ui-avatars.com/api/?name=${user.hoTen}&background=random`}
              alt={user.hoTen}
            />
          )}
          <div className={styles.username}></div>
          {user ? `${user.hoTen}` : "Xin chào, Khách"}
        </div>
        <div
          className={styles.changePassword}
          onClick={() => {
            nav("/change-password");
          }}
        >
          <Key /> Thay đổi mật khẩu
        </div>
        <div
          className={styles.logOut}
          onClick={() => {
            logout();
            nav("/login");
          }}
        >
          <LogOut /> Đăng xuất
        </div>
      </Modal>
    </>
  );
}

export default Header;
