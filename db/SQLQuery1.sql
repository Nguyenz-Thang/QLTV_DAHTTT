create database quanlythuvien
-- 1) Nhân viên (Th? thu)
CREATE TABLE ThuThu (
    maTT VARCHAR(20) PRIMARY KEY,
    tenTT NVARCHAR(200) NOT NULL,
    ngaySinh DATE,
    SDT NVARCHAR(20),
    cccd VARCHAR(20),
    email NVARCHAR(150),
    diaChi NVARCHAR(255),
    chucVu NVARCHAR(100)
);

-- 2) Tác gi?
CREATE TABLE TacGia (
    maTG VARCHAR(20) PRIMARY KEY,
    tenTG NVARCHAR(200) NOT NULL,
    thongTin NVARCHAR(MAX)
);

-- 3) Nhà xu?t b?n
CREATE TABLE NhaXuatBan (
    maNXB VARCHAR(20) PRIMARY KEY,
    tenNXB NVARCHAR(255) NOT NULL,
    diaChi NVARCHAR(255),
    SDT NVARCHAR(20),
    email NVARCHAR(150)
);

-- 4) Th? lo?i
CREATE TABLE TheLoai (
    maTL VARCHAR(20) PRIMARY KEY,
    tenTL NVARCHAR(150) NOT NULL,
    moTa NVARCHAR(MAX)
);

-- 5) Sách
CREATE TABLE Sach (
    maSach VARCHAR(20) PRIMARY KEY,
    tieuDe NVARCHAR(500) NOT NULL,
    tomTat NVARCHAR(MAX),
    maTL VARCHAR(20) FOREIGN KEY REFERENCES TheLoai(maTL),
    maNXB VARCHAR(20) FOREIGN KEY REFERENCES NhaXuatBan(maNXB),
    soLuong INT DEFAULT 0,        
    soLuongMuon INT DEFAULT 0, 
    taiLieuOnl VARCHAR(MAX),
    maTG VARCHAR(20) FOREIGN KEY REFERENCES TacGia(maTG),
);

-- 6) Ð?c gi?
CREATE TABLE DocGia (
    maDG VARCHAR(20) PRIMARY KEY,
    MSV NVARCHAR(50),              
    hoTen NVARCHAR(200) NOT NULL,
    gioiTinh NVARCHAR(10) DEFAULT N'Nam', 
    ngaySinh DATE,
    lop NVARCHAR(100),
    khoa NVARCHAR(100),
    email NVARCHAR(150),
    SDT NVARCHAR(20),
    diaChi NVARCHAR(255)
);

-- 7) Tài kho?n
CREATE TABLE TaiKhoan (
    maTK VARCHAR(20) PRIMARY KEY,
    tenDangNhap NVARCHAR(100) UNIQUE NOT NULL,
    matKhau NVARCHAR(255) NOT NULL,
    vaiTro NVARCHAR(20) DEFAULT N'Ð?c gi?', -- Ð?c gi? / Nhân viên / Qu?n tr?
    maDG VARCHAR(20) FOREIGN KEY REFERENCES DocGia(maDG),
    maTT VARCHAR(20) FOREIGN KEY REFERENCES ThuThu(maTT),
    ngayTao DATETIME DEFAULT GETDATE()
);

-- 8) Phi?u mu?n
CREATE TABLE PhieuMuon (
    maPM VARCHAR(20) PRIMARY KEY,
    maDG VARCHAR(20) FOREIGN KEY REFERENCES DocGia(maDG),
    maTT VARCHAR(20) FOREIGN KEY REFERENCES ThuThu(maTT),
    ngayMuon DATE DEFAULT GETDATE(),
    ngayHenTra DATE
);

-- 9) Chi ti?t mu?n
CREATE TABLE ChiTietPhieuMuon (
    maCTM VARCHAR(20) PRIMARY KEY,
    maPM VARCHAR(20) FOREIGN KEY REFERENCES PhieuMuon(maPM) ON DELETE CASCADE,
    maSach VARCHAR(20) FOREIGN KEY REFERENCES Sach(maSach),
    soLuong INT DEFAULT 1,
    trangThai NVARCHAR(20) DEFAULT N'Ðang mu?n'
);
CREATE TABLE PhieuTra (
    maPT VARCHAR(20) PRIMARY KEY,
    maPM VARCHAR(20) FOREIGN KEY REFERENCES PhieuMuon(maPM),
    maTT VARCHAR(20) FOREIGN KEY REFERENCES ThuThu(maTT),
    ngayTra DATE DEFAULT GETDATE()
);
CREATE TABLE ChiTietPhieuTra (
    maCTPT VARCHAR(20) PRIMARY KEY,
    maPT VARCHAR(20) FOREIGN KEY REFERENCES PhieuTra(maPT) ON DELETE CASCADE,
    maSach VARCHAR(20) FOREIGN KEY REFERENCES Sach(maSach),
    soLuong INT DEFAULT 1,
    tinhTrang NVARCHAR(100) DEFAULT N'Bình thu?ng'
);


-- 10) Bình lu?n
CREATE TABLE BinhLuan (
    maBL VARCHAR(20) PRIMARY KEY,  
    maSach VARCHAR(20) NOT NULL,                  
    maTK VARCHAR(20) NOT NULL,
    maBLCha VARCHAR(20) NULL,                     
    noiDung NVARCHAR(500) NOT NULL,      
    ngayBL DATETIME DEFAULT GETDATE(),  
    FOREIGN KEY (maSach) REFERENCES Sach(maSach),
    FOREIGN KEY (maTK) REFERENCES TaiKhoan(maTK)
);

