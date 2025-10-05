const BASE = "http://localhost:5000/api/sach";

function authHeaders() {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}
async function json(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Server error");
  return data;
}

export const getMeta = async () => json(await fetch(`${BASE}/meta`));
export const listSach = async () => json(await fetch(`${BASE}`));

export const createSach = async (formData) =>
  json(
    await fetch(`${BASE}`, {
      method: "POST",
      headers: { ...authHeaders() },
      body: formData,
    })
  );

export const updateSach = async (maSach, formData) =>
  json(
    await fetch(`${BASE}/${maSach}`, {
      method: "PUT",
      headers: { ...authHeaders() },
      body: formData,
    })
  );

export const deleteSach = async (maSach) =>
  json(
    await fetch(`${BASE}/${maSach}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeaders() },
    })
  );
