import styles from "./NotFound.module.scss";

export default function NotFound() {
  return (
    <div className={styles.wrap}>
      <div className={styles.box}>
        <div className={styles.code}>404</div>
        <p className={styles.msg}>Trang bạn tìm không tồn tại.</p>
        <a className={styles.home} href="/">
          Về trang chủ
        </a>
      </div>
    </div>
  );
}
