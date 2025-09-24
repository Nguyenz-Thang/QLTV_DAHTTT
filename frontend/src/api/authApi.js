const API = "http://localhost:5000/api/auth";

export async function login(username, password) {
  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenDangNhap: username, matKhau: password }),
  });
  return res.json();
}

export async function register(payload) {
  const res = await fetch(`${API}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || "Server error");
    err.body = data;
    throw err;
  }
  return data;
}
