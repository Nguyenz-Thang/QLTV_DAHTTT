// src/api/sachApi.js
import { useContext, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";

const BASE = "http://localhost:5000/api/sach";

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

export function useSachApi() {
  const { token, logout } = useContext(AuthContext);

  const authedFetch = useCallback(
    async (url, options = {}) => {
      const headers = {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(url, { ...options, headers });
      if (res.status === 401 || res.status === 403) {
        logout?.();
        throw new Error("Phiên đăng nhập đã hết hạn");
      }
      return res;
    },
    [token, logout]
  );

  const getMeta = useCallback(
    async () => toJson(await authedFetch(`${BASE}/meta`)),
    [authedFetch]
  );
  const listSach = useCallback(
    async () => toJson(await authedFetch(`${BASE}`)),
    [authedFetch]
  );
  const createSach = useCallback(
    async (formData) =>
      toJson(await authedFetch(`${BASE}`, { method: "POST", body: formData })),
    [authedFetch]
  );
  const updateSach = useCallback(
    async (maSach, formData) =>
      toJson(
        await authedFetch(`${BASE}/${maSach}`, {
          method: "PUT",
          body: formData,
        })
      ),
    [authedFetch]
  );
  const deleteSach = useCallback(
    async (maSach) =>
      toJson(await authedFetch(`${BASE}/${maSach}`, { method: "DELETE" })),
    [authedFetch]
  );

  return { getMeta, listSach, createSach, updateSach, deleteSach };
}
