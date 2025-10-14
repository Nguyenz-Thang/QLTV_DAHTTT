// src/api/lichsuApi.js
import { useCallback, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const BASE = "http://localhost:5000/api/lichsu";

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

function toQuery(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") q.set(k, v);
  });
  return q.toString();
}

export function useLichSuApi() {
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
        throw new Error("Phiên đăng nhập đã hết hạn.");
      }
      if (res.status === 403) throw new Error("Bạn không có quyền.");
      return res;
    },
    [token, logout]
  );

  // Lịch sử của chính tài khoản đang đăng nhập
  const getMine = useCallback(
    async (params = {}) => {
      const qs = toQuery(params);
      return toJson(await af(`${BASE}/me${qs ? `?${qs}` : ""}`));
    },
    [af]
  );

  // Lịch sử theo một tài khoản cụ thể (cho admin/thủ thư)
  const getByAccount = useCallback(
    async (maTK, params = {}) => {
      const qs = toQuery(params);
      return toJson(
        await af(`${BASE}/${encodeURIComponent(maTK)}${qs ? `?${qs}` : ""}`)
      );
    },
    [af]
  );

  // (Tuỳ chọn) tải CSV nếu có endpoint hỗ trợ ?format=csv
  const downloadCSV = useCallback(
    async (maTK, params = {}) => {
      const qs = toQuery({ ...params, format: "csv" });
      const url = maTK
        ? `${BASE}/${encodeURIComponent(maTK)}?${qs}`
        : `${BASE}/me?${qs}`;
      const res = await af(url);
      if (!res.ok) throw new Error("Không xuất được CSV");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "lich_su_muon.csv";
      a.click();
      URL.revokeObjectURL(a.href);
    },
    [af]
  );
  const cancelPending = useCallback(
    async (maPM) => {
      return toJson(
        await af(`${BASE}/cancel/${encodeURIComponent(maPM)}`, {
          method: "POST",
        })
      );
    },
    [af]
  );

  return { getMine, getByAccount, downloadCSV, cancelPending };
}
