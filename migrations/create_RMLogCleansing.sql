-- ==========================================================================================
-- Skrip DDL: Pembuatan Tabel RMLogCleansing
-- Deskripsi: Menyimpan riwayat audit log cleansing duplikasi nomor peserta BPJS
-- Modul: Rekam Medis (RM)
-- Standar: SIMRS / YAKKUM Database
-- ==========================================================================================

USE [yakkum2database]; -- Sesuaikan nama database jika berbeda
GO

IF NOT EXISTS (
    SELECT * FROM sys.tables t 
    JOIN sys.schemas s ON t.schema_id = s.schema_id 
    WHERE t.name = 'RMLogCleansing' AND s.name = 'dbo'
)
BEGIN
    CREATE TABLE dbo.RMLogCleansing (
        in_id INT IDENTITY(1,1) PRIMARY KEY,
        vc_no_rm VARCHAR(50) NOT NULL,
        vc_nama_p VARCHAR(255) NULL,
        vc_no_peserta_bpjs_lama VARCHAR(100) NULL,
        vc_no_peserta_bpjs_baru VARCHAR(100) NOT NULL DEFAULT 'XXX',
        vc_user_clean VARCHAR(100) NOT NULL DEFAULT 'ADMIN',
        dt_tgl_clean DATETIME2 DEFAULT GETDATE()
    );

    -- Index untuk mempercepat pencarian berdasarkan No RM dan tanggal cleansing
    CREATE INDEX IX_RMLogCleansing_vc_no_rm ON dbo.RMLogCleansing (vc_no_rm);
    CREATE INDEX IX_RMLogCleansing_dt_tgl_clean ON dbo.RMLogCleansing (dt_tgl_clean DESC);

    PRINT 'Tabel dbo.RMLogCleansing dan index berhasil dibuat.';
END
ELSE
BEGIN
    PRINT 'Tabel dbo.RMLogCleansing sudah ada di database.';
END
GO
