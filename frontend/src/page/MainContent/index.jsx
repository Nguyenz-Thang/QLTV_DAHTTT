import styles from "./MainContent.module.scss";
import { Outlet } from "react-router";
function MainContent() {
  return (
    <div className={styles.body}>
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}
export default MainContent;
