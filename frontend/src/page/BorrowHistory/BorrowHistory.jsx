import { useEffect, useMemo, useState } from "react";
import { getMyBorrows, cancelBorrowDetail } from "../api/borrowApi";
import { useAuth } from "../context/AuthContext"; // bạn đã có AuthContext

export default function BorrowHistory() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const totalPages = useMemo(
    () => Math.max(Math.ceil(total / limit), 1),
    [total, limit]
  );

  const load = async () => {
    setLoading(true);
    try {
      const res = await getMyBorrows({ page, limit, token });
      setRows(res.data || []);
      setTotal(res.total || 0);
    } catch (e) {
      console.error(e);
      alert("Không tải được lịch sử mượn.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [page]);

  const canCancel = (trangThai) =>
    trangThai === "Chờ lấy" || trangThai === "Chờ lấy"; // phòng case nhập dấu

  const onCancel = async (maCTM) => {
    if (!window.confirm("Xác nhận hủy yêu cầu mượn này?")) return;
    try {
      await cancelBorrowDetail({ maCTM, token });
      await load();
    } catch (e) {
      console.error(e);
      alert("Hủy không thành công!");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Lịch sử mượn sách</h2>

      <div className="overflow-auto rounded border">
        <table className="min-w-[900px] w-full">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-3">Mã PM</th>
              <th className="p-3">Mã CTM</th>
              <th className="p-3">Sách</th>
              <th className="p-3">SL</th>
              <th className="p-3">Ngày mượn</th>
              <th className="p-3">Hẹn trả</th>
              <th className="p-3">Ngày trả</th>
              <th className="p-3">Tình trạng</th>
              <th className="p-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3" colSpan={9}>
                  Đang tải…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="p-3" colSpan={9}>
                  Chưa có dữ liệu.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.maCTM} className="border-t">
                  <td className="p-3">{r.maPM}</td>
                  <td className="p-3">{r.maCTM}</td>
                  <td className="p-3">{r.tieuDe}</td>
                  <td className="p-3">{r.soLuong}</td>
                  <td className="p-3">{r.ngayMuon?.slice(0, 10)}</td>
                  <td className="p-3">{r.ngayHenTra?.slice(0, 10)}</td>
                  <td className="p-3">
                    {r.ngayTra ? String(r.ngayTra).slice(0, 10) : "-"}
                  </td>
                  <td className="p-3">
                    <span
                      className={
                        "px-2 py-1 rounded text-sm " +
                        (r.trangThai === "Đã trả"
                          ? "bg-green-100"
                          : r.trangThai === "Quá hạn"
                          ? "bg-red-100"
                          : r.trangThai === "Chờ lấy"
                          ? "bg-yellow-100"
                          : r.trangThai === "Đã hủy"
                          ? "bg-gray-200"
                          : "bg-blue-100")
                      }
                    >
                      {r.trangThai}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      className="px-3 py-1 rounded bg-red-500 text-white disabled:opacity-40"
                      disabled={!canCancel(r.trangThai)}
                      onClick={() => onCancel(r.maCTM)}
                      title={
                        canCancel(r.trangThai)
                          ? "Hủy yêu cầu"
                          : "Chỉ hủy khi 'Chờ lấy'"
                      }
                    >
                      Hủy
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center gap-2 mt-4">
        <button
          className="px-3 py-1 border rounded"
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page <= 1}
        >
          ← Trước
        </button>
        <span>
          Trang {page}/{totalPages}
        </span>
        <button
          className="px-3 py-1 border rounded"
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          disabled={page >= totalPages}
        >
          Sau →
        </button>
      </div>
    </div>
  );
}
