import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ roles }) {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  if (roles?.length && !roles.includes(user.vaiTro)) {
    return <Navigate to="/403" replace />;
  }
  return <Outlet />;
}
