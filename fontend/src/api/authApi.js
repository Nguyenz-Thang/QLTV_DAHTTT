const API = "http://localhost:5000/api/auth";

export async function login(username, password) {
  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenDangNhap: username, matKhau: password }),
  });
  return res.json();
}

export async function register(username, password, role = "Độc giả") {
  const res = await fetch(`${API}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenDangNhap: username,
      matKhau: password,
      vaiTro: role,
    }),
  });
  return res.json();
}
