import { useCallback, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const BASE = "http://localhost:5000/api/tacgia";

async function toJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new Error(data.message || `HTTP ${res.status}`);
    e.status = res.status;
    e.body = data;
    throw e;
  }
  return data;
}

export function useTacGiaApi() {
  const { token, logout } = useContext(AuthContext);

  const af = useCallback(
    async (url, opt = {}) => {
      const headers = {
        ...(opt.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(url, { ...opt, headers });
      if (res.status === 401) {
        logout?.();
        throw new Error("Phiên đăng nhập đã hết hạn");
      }
      if (res.status === 403) throw new Error("Bạn không có quyền");
      return res;
    },
    [token, logout]
  );

  const list = useCallback(
    async (q = "") => toJson(await af(`${BASE}?q=${encodeURIComponent(q)}`)),
    [af]
  );
  const create = useCallback(
    async (payload) =>
      toJson(
        await af(BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      ),
    [af]
  );
  const update = useCallback(
    async (id, payload) =>
      toJson(
        await af(`${BASE}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      ),
    [af]
  );
  const remove = useCallback(
    async (id) => toJson(await af(`${BASE}/${id}`, { method: "DELETE" })),
    [af]
  );

  return { list, create, update, remove };
}
