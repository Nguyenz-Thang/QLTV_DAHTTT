import styles from "./Home.module.scss";

function Home() {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.img}></div>

        <div className={styles.text}>
          <h1>Chào mừng đến Thư viện UTT</h1>
          <p>
            Kho học liệu số và sách in phục vụ học tập – nghiên cứu của sinh
            viên Trường Đại học Công nghệ Giao thông Vận tải. Bạn có thể tìm
            sách, tải tài liệu online, theo dõi tình trạng mượn trả và nhiều
            tiện ích khác.
          </p>
          {/* <a href="/sach" className={styles.cta}>Khám phá sách</a> */}
        </div>
      </div>
    </section>
  );
}

export default Home;
