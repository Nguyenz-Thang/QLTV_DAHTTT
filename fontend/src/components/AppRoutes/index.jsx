import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { useContext } from "react";

import Login from "../../page/Login";
import Register from "../../page/Register";
import BookList from "../../page/BookList";
import { AuthContext } from "../../context/AuthContext";

// import UseState from "@/pages/UseState";

function AppRoutes() {
  const { token } = useContext(AuthContext);
  return (
    <BrowserRouter>
      <div className="container">
        <Routes>
          <Route
            path="/"
            element={token ? <Navigate to="/sach" /> : <Navigate to="/login" />}
          />
          <Route path="/login" element={<Login />} />
          <Route
            path="/sach"
            element={token ? <BookList /> : <Navigate to="/login" />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
export default AppRoutes;
