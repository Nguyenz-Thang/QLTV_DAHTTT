import { useCallback, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const BASE = "http://localhost:5000/api/phieutra";
const PM_BASE = "http://localhost:5000/api/phieumuon";
async function asJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

export function usePhieuTraApi() {
  const { token, logout } = useContext(AuthContext);

  const authed = useCallback(
    async (url, opt = {}) => {
      const headers = {
        ...(opt.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(url, { ...opt, headers });
      if (res.status === 401) {
        logout?.();
        throw new Error("Phiên đăng nhập đã hết hạn.");
      }
      if (res.status === 403) {
        throw new Error("Bạn không có quyền thực hiện thao tác này.");
      }
      return res;
    },
    [token, logout]
  );

  const list = useCallback(
    async () => asJson(await authed(`${BASE}`)),
    [authed]
  );
  const detail = useCallback(
    async (maPT) => asJson(await authed(`${BASE}/${maPT}`)),
    [authed]
  );
  const create = useCallback(
    async (payload) =>
      asJson(
        await authed(`${BASE}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      ),
    [authed]
  );
  const remove = useCallback(
    async (maPT) =>
      asJson(await authed(`${BASE}/${maPT}`, { method: "DELETE" })),
    [authed]
  );

  // NEW: gợi ý phiếu mượn theo q (maPM / MSSV / tên)
  const pmSuggest = useCallback(
    async (q) =>
      asJson(await authed(`${PM_BASE}/suggest?q=${encodeURIComponent(q)}`)),
    [authed]
  );

  // NEW: danh sách sách còn nợ của 1 PM
  const pmRemaining = useCallback(
    async (maPM) => asJson(await authed(`${PM_BASE}/${maPM}/remaining`)),
    [authed]
  );

  return { list, detail, create, remove, pmSuggest, pmRemaining };
}
