import Header from "../components/Header";
import Footer from "./components/Footer";
import Navigation from "../../layouts/components/Navigation";
import { Outlet } from "react-router";
import Sidebar from "./components/Sidebar";
import styles from "./DefaultLayout.module.scss";
function DefaultLayout() {
  return (
    <div>
      <Header />

      <div className={styles.container}>
        <Sidebar />
        <div className={styles.content}>
          {" "}
          {/* <Navigation /> */}
          <Outlet />
        </div>
      </div>
      <Footer />
    </div>
  );
}
export default DefaultLayout;
