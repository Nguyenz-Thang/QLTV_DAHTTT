/* ==========================================================
   SEED DỮ LIỆU THƯ VIỆN – UTT (SQL Server)
   Gồm: TheLoai, TacGia, NhaXuatBan, Sach, ThuThu, DocGia,
        (tùy chọn) TaiKhoan mẫu, PhieuMuon, ChiTietPhieuMuon,
        PhieuTra, ChiTietPhieuTra
   ========================================================== */

BEGIN TRY
BEGIN TRAN;

/* -------------------- THE LOAI -------------------- */
INSERT INTO TheLoai (maTL, tenTL, moTa) VALUES
('TL001', N'Giáo Trình Công Nghệ Thông Tin', N'CNTT, lập trình, hệ thống, mạng'),
('TL002', N'Giáo Trình Công Trình',          N'Xây dựng, cầu đường, công trình'),
('TL003', N'Giáo Trình Cơ Khí',              N'Chế tạo máy, cơ học, CAD/CAM'),
('TL004', N'Giáo Trình Cơ Sở Kỹ Thuật',      N'Cơ sở điện – điện tử – vật liệu'),
('TL005', N'Giáo Trình Khoa Học Cơ Bản',     N'Toán – Lý – Hóa – Xác suất'),
('TL006', N'Giáo Trình Kinh Tế',             N'Kinh tế, quản trị, tài chính'),
('TL007', N'Giáo Trình Lý Luận Chính Trị',   N'Chủ nghĩa Mác – Lênin, TTHCM');

/* -------------------- TAC GIA -------------------- */
INSERT INTO TacGia (maTG, tenTG, thongTin) VALUES
('TG001', N'PGS.TS. Nguyễn Văn An',      N'Giảng viên Khoa CNTT – UTT'),
('TG002', N'TS. Trần Thị Bình',          N'Giảng viên Khoa Cơ khí – UTT'),
('TG003', N'PGS.TS. Lê Quang Dũng',      N'Khoa Công trình – UTT'),
('TG004', N'TS. Phạm Thu Hà',            N'Khoa Kinh tế – UTT'),
('TG005', N'TS. Bùi Minh Khoa',          N'Khoa KH Cơ bản – UTT'),
('TG006', N'ThS. Nguyễn Đức Huy',        N'Giảng viên Lý luận chính trị'),
('TG007', N'TS. Hoàng Anh Tuấn',         N'Chuyên ngành Hệ thống giao thông');

/* -------------------- NHA XUAT BAN -------------------- */
INSERT INTO NhaXuatBan (maNXB, tenNXB, diaChi, SDT, email) VALUES
('NXB001', N'NXB Giao thông Vận tải', N'78 Đường Giải Phóng, Hà Nội', N'0918273642', N'contact@gtvt.vn'),
('NXB002', N'NXB Xây dựng',           N'37 Lê Đại Hành, Hà Nội',       N'0817283724', N'info@xaydung.vn'),
('NXB003', N'NXB Khoa học & Kỹ thuật',N'70 Trần Hưng Đạo, Hà Nội',     N'0918232412', N'khtt@publisher.vn'),
('NXB004', N'NXB Bách Khoa Hà Nội',   N'1 Đại Cồ Việt, Hà Nội',        N'0921734214', N'bk@publisher.vn'),
('NXB005', N'NXB Kinh tế Quốc dân',   N'207 Giải Phóng, Hà Nội',       N'0129431248', N'ktqd@publisher.vn');

/* -------------------- SACH -------------------- */
/* Mỗi sách tham chiếu: maTL + maNXB + maTG */
INSERT INTO Sach (maSach, tieuDe, tomTat, maTL, maNXB, soLuong, soLuongMuon, taiLieuOnl, maTG) VALUES
-- CNTT
('S001', N'Hệ thống thông tin giao thông', N'Khái quát các hệ thống ITS, thiết kế và triển khai tại VN', 'TL001','NXB001', 30, 5, NULL, 'TG007'),
('S002', N'Nhập môn Lập trình Python',     N'Giáo trình cơ bản cho sinh viên năm nhất CNTT',             'TL001','NXB004', 40, 3, NULL, 'TG001'),

-- Công trình
('S003', N'Cơ sở giao thông đô thị',       N'Quy hoạch & tổ chức giao thông đô thị',                      'TL002','NXB001', 25, 4, NULL, 'TG003'),
('S004', N'Kết cấu cầu đường',             N'Tính toán & thiết kế kết cấu cầu đường',                     'TL002','NXB002', 35, 2, NULL, 'TG003'),

-- Cơ khí
('S005', N'Nguyên lý máy',                 N'Các cơ cấu cơ khí, động học – động lực học',                 'TL003','NXB003', 28, 6, NULL, 'TG002'),
('S006', N'CAD/CAM cơ bản',                N'Thiết kế – gia công với CAD/CAM cho sinh viên',              'TL003','NXB004', 22, 1, NULL, 'TG002'),

-- Cơ sở kỹ thuật
('S007', N'Điện – Điện tử cơ bản',         N'Mạch điện, linh kiện, khuếch đại, số',                       'TL004','NXB003', 50, 8, NULL, 'TG005'),
('S008', N'Vật liệu kỹ thuật',             N'Tính chất – công nghệ vật liệu',                             'TL004','NXB003', 32, 0, NULL, 'TG005'),

-- Khoa học cơ bản
('S009', N'Giải tích 1',                    N'Giới hạn, đạo hàm, tích phân',                              'TL005','NXB004', 60, 10, NULL, 'TG005'),
('S010', N'Xác suất – Thống kê',            N'Xác suất, biến ngẫu nhiên, ước lượng, kiểm định',           'TL005','NXB004', 45, 7, NULL, 'TG005'),

-- Kinh tế
('S011', N'Kinh tế học đại cương',         N'Nguyên lý kinh tế, cung – cầu, thị trường',                  'TL006','NXB005', 38, 5, NULL, 'TG004'),
('S012', N'Quản trị dự án',                N'Lập kế hoạch, quản trị rủi ro, chi phí dự án',               'TL006','NXB005', 30, 3, NULL, 'TG004'),

-- Lý luận chính trị
('S013', N'Triết học Mác – Lênin',         N'Những vấn đề cơ bản về thế giới quan & phương pháp luận',    'TL007','NXB003', 55, 9, NULL, 'TG006'),
('S014', N'Tư tưởng Hồ Chí Minh',          N'Nội dung cốt lõi và vận dụng trong bối cảnh mới',            'TL007','NXB003', 50, 6, NULL, 'TG006');

/* -------------------- THU THU -------------------- */
INSERT INTO ThuThu (maTT, tenTT, ngaySinh, SDT, cccd, email, diaChi, chucVu) VALUES
('TT001', N'Nguyễn Thị Hạnh', '1990-05-12', N'0912146789', '012345678900', N'hanh@utt.edu.vn', N'Hà Nội', N'Thu thủ'),
('TT002', N'Lê Văn Cường',   '1989-08-21', N'0988879456', '012345678901', N'cuong@utt.edu.vn', N'Hà Nội', N'Phó phòng');

/* -------------------- DOC GIA -------------------- */
INSERT INTO DocGia (maDG, MSV, hoTen, gioiTinh, ngaySinh, lop, khoa, email, SDT, diaChi) VALUES
('DG001', '20001', N'Nguyễn Văn Khôi', N'Nam', '2003-02-17', N'CNTT-K18', N'CNTT',  N'thanh@sv.utt.edu.vn', N'0909273101', N'Hà Nội'),
('DG002', '20002', N'Lê Thanh Nghị',              N'Nam', '2003-06-01', N'CT-K18',   N'Công trình', N'thang@sv.utt.edu.vn', N'0992183102', N'Hà Nội'),
('DG003', '20003', N'Lê Quang Dũng',                 N'Nam', '2002-12-10', N'CK-K17',   N'Cơ khí',     N'dung@sv.utt.edu.vn',  N'0998128203', N'Hà Nội');

/* -------------------- (TÙY CHỌN) TAI KHOAN --------------------
   Lưu ý: hệ thống backend dùng bcrypt; nếu seed trực tiếp
   bằng SQL thì MẬT KHẨU NÊN LÀ HASH bcrypt.
   Ở đây mình để tạm '123456' để dễ nhìn; khi dùng thật
   hãy tạo qua API /auth/register để backend tự hash.
---------------------------------------------------------------- */
INSERT INTO TaiKhoan (maTK, tenDangNhap, matKhau, vaiTro, maDG, maTT)
VALUES
('TKDG001', N'dg', N'$2b$10$FBBjiDXzKucZvYM3DOaC7ey.wwFdb2K2D4lZ9gwpxrs6Y6NDJfkqG', N'Độc giả', 'DG001', NULL),
('TKDG002', N'dg2', N'$2b$10$FBBjiDXzKucZvYM3DOaC7ey.wwFdb2K2D4lZ9gwpxrs6Y6NDJfkqG', N'Độc giả', 'DG002', NULL),
('TKTT001', N'tt', N'$2b$10$FBBjiDXzKucZvYM3DOaC7ey.wwFdb2K2D4lZ9gwpxrs6Y6NDJfkqG', N'Thủ thư', NULL, 'TT001'),
('TKQL001', N'admin', N'$2b$10$FBBjiDXzKucZvYM3DOaC7ey.wwFdb2K2D4lZ9gwpxrs6Y6NDJfkqG', N'Quản lý', NULL, NULL);

/* -------------------- PHIEU MUON + CT MUON -------------------- */
INSERT INTO PhieuMuon (maPM, maDG, maTT, ngayMuon, ngayHenTra) VALUES
('PM0001', 'DG001', 'TT001', '2025-10-01', '2025-10-15'),
('PM0002', 'DG002', 'TT001', '2025-10-02', '2025-10-16');

INSERT INTO ChiTietPhieuMuon (maCTM, maPM, maSach, soLuong, trangThai) VALUES
('CTM0001', 'PM0001', 'S001', 1, N'Đã trả'),
('CTM0002', 'PM0001', 'S009', 1, N'Đang mượn'),
('CTM0003', 'PM0002', 'S004', 1, N'Đang mượn'),
('CTM0004', 'PM0002', 'S011', 1, N'Đang mượn');

/* -------------------- (VÍ DỤ) PHIEU TRA + CT TRA -------------------- */
INSERT INTO PhieuTra (maPT, maPM, maTT, ngayTra) VALUES
('PT0001', 'PM0001', 'TT001', '2025-10-10');

INSERT INTO ChiTietPhieuTra (maCTPT, maPT, maSach, soLuong, tinhTrang) VALUES
('CTPT0001', 'PT0001', 'S001', 1, N'Bình thường');

COMMIT TRAN;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRAN;
    THROW;
END CATCH;
