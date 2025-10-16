import React from "react";

export default function TopBooks({ data = [] }) {
  if (!data?.length) return null;

  return (
    <div className="top-books grid grid-cols-1 sm:grid-cols-3 gap-4">
      {data.slice(0, 3).map((item) => (
        <div key={item.maSach} className="card rounded-xl p-4 shadow bg-white">
          <div className="h-28 flex items-center justify-center overflow-hidden rounded-lg bg-gray-50">
            <img
              src={item.anhBia ?? "/images/no-cover.png"}
              alt={item.tieuDe}
              className="max-h-28 object-contain"
              onError={(e) => (e.currentTarget.src = "/images/no-cover.png")}
            />
          </div>

          <div className="mt-3 text-base font-semibold line-clamp-2">
            {item.tieuDe}
          </div>
          <div className="mt-1 text-sm text-gray-500">
            Tác giả: {item.tacGia ?? "Chưa rõ"}
          </div>

          <div className="mt-2 text-xs text-gray-400">
            Lượt mượn: {item.soLanMuon}
          </div>
        </div>
      ))}
    </div>
  );
}
