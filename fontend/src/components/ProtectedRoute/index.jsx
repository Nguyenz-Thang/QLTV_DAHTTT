// src/components/RequireAuth.jsx
import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function RequireAuth() {
  const { token } = useContext(AuthContext);
  // Nếu không có token thì redirect tới /login
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  // Nếu có token, cho tiếp vào route con
  return <Outlet />;
}
