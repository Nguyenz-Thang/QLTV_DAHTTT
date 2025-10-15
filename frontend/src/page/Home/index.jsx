import styles from "./Home.module.scss";

function Home() {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.img}></div>

        <div className={styles.text}>
          <h1>Chào mừng đến Thư viện UTT</h1>
          <p>
            Chào mừng bạn đến với Trang web Thư viện số UTT – nơi hội tụ tri
            thức và công nghệ! Thư viện số của Đại học Công nghệ Giao thông Vận
            tải (UTT) tự hào mang đến cho bạn một kho tàng tài liệu phong phú,
            từ sách điện tử, bài báo khoa học, đến các tài nguyên học thuật đa
            dạng. Với giao diện thân thiện, dễ sử dụng và khả năng truy cập mọi
            lúc, mọi nơi, chúng tôi cam kết hỗ trợ bạn tối đa trong hành trình
            học tập và nghiên cứu. Hãy khám phá, tra cứu và tận hưởng những tiện
            ích tuyệt vời mà Thư viện số UTT mang lại. Chúc bạn có những trải
            nghiệm tuyệt vời!
          </p>
          {/* <a href="/sach" className={styles.cta}>Khám phá sách</a> */}
        </div>
      </div>
    </section>
  );
}

export default Home;
