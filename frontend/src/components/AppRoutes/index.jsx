import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { useContext } from "react";

import Login from "../../page/Login";
import Register from "../../page/Register";
import BookList from "../../page/BookList";
import { AuthContext } from "../../context/AuthContext";
import DefaultLayout from "../../Layouts/DefaultLayout";
import ForgotPassword from "../../page/ForgotPassword";
import ChangePassword from "../../page/ChangePassword";
import Home from "../../page/Home";
import Settings from "../../page/Settings";
import MainContent from "../../page/MainContent";
import BookAdminPage from "../../page/BookAdminPage";
import NXB from "../../page/NXB";
import Categories from "../../page/Categories";
import Authors from "../../page/Authors";
import PhieuMuon from "../../page/PhieuMuon";
import PhieuTra from "../../page/PhieuTra";
import ThuThu from "../../page/ThuThu";
import DocGia from "../../page/DocGia";
import Accounts from "../../page/Accounts";
import BookDetail from "../../page/BookDetail";
// import UseState from "@/pages/UseState";

function AppRoutes() {
  const { token } = useContext(AuthContext);
  return (
    <BrowserRouter>
      <div className="container">
        <Routes>
          <Route
            path="/"
            element={token ? <Navigate to="/home" /> : <Navigate to="/login" />}
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/change-password" element={<ChangePassword />} />
          {/* <Route
            path="/sach"
            element={token ? <BookList /> : <Navigate to="/login" />}
          /> */}
          <Route element={token ? <DefaultLayout /> : <Navigate to="/login" />}>
            <Route element={<MainContent />}>
              <Route path="/home" element={<Home />} />
              <Route path="/sach" element={<BookList />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin/books" element={<BookAdminPage />} />
              <Route path="/admin/nxb" element={<NXB />} />
              <Route path="/admin/categories" element={<Categories />} />
              <Route path="/admin/authors" element={<Authors />} />
              <Route path="/admin/phieu-muon" element={<PhieuMuon />} />
              <Route path="/admin/phieu-tra" element={<PhieuTra />} />
              <Route path="/admin/thuthu" element={<ThuThu />} />
              <Route path="/admin/docgia" element={<DocGia />} />
              <Route path="/admin/accounts" element={<Accounts />} />
              <Route path="/sach/:maSach" element={<BookDetail />} />
            </Route>
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}
export default AppRoutes;
