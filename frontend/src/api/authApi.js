const API = "http://localhost:5000/api/auth";

// Helper: parse JSON + throw nếu !res.ok
async function json(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || "Server error");
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

// Helper: header có token
function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login(username, password) {
  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenDangNhap: username, matKhau: password }),
  });
  return json(res); // thống nhất cách xử lý lỗi
}

export async function register(payload) {
  const res = await fetch(`${API}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return json(res);
}

// 🔐 Đổi mật khẩu (nhập mật khẩu cũ & mới) – cần JWT
export async function changePassword({ oldPassword, newPassword }) {
  const res = await fetch(`${API}/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  return json(res);
}
