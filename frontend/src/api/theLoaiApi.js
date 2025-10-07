import { useCallback, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const BASE = "http://localhost:5000/theloai";

async function toJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

export function useTheLoaiApi() {
  const { token, logout } = useContext(AuthContext);

  const authedFetch = useCallback(
    async (url, options = {}) => {
      const headers = {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(url, { ...options, headers });
      if (res.status === 401) {
        logout?.();
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }
      if (res.status === 403) {
        const e = new Error("Bạn không có quyền thực hiện thao tác này.");
        e.status = 403;
        throw e;
      }
      return res;
    },
    [token, logout]
  );

  const list = useCallback(
    async () => toJson(await authedFetch(`${BASE}`)),
    [authedFetch]
  );
  const search = useCallback(
    async (q) =>
      toJson(
        await authedFetch(`${BASE}/search?q=${encodeURIComponent(q || "")}`)
      ),
    [authedFetch]
  );
  const create = useCallback(
    async (payload) =>
      toJson(
        await authedFetch(`${BASE}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      ),
    [authedFetch]
  );
  const update = useCallback(
    async (id, payload) =>
      toJson(
        await authedFetch(`${BASE}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      ),
    [authedFetch]
  );
  const remove = useCallback(
    async (id) =>
      toJson(await authedFetch(`${BASE}/${id}`, { method: "DELETE" })),
    [authedFetch]
  );

  return { list, search, create, update, remove };
}
