-- ==========================================================================================
-- Skrip Query: Mengambil Data Pasien Duplikat Berdasarkan Nomor Identitas BPJS
-- Modul: Rekam Medis (RM) - Sistem Validasi & Cleansing
-- Standar: SQL Server (T-SQL) / SIMRS YAKKUM Database
-- ==========================================================================================

USE [yakkum2database]; -- Sesuaikan dengan nama database aktif Anda jika berbeda
GO

-- ------------------------------------------------------------------------------------------
-- 1. QUERY UTAMA: Menampilkan Semua Baris Pasien yang Memiliki Nomor BPJS Duplikat
--    - Mengabaikan data bernilai NULL, string kosong, dan 'XXX' (data hasil cleansing)
--    - Menampilkan total_duplikat (berapa kali nomor identitas tersebut dipakai)
--    - Menampilkan urutan_kemunculan (ROW_NUMBER untuk melihat urutan RM)
-- ------------------------------------------------------------------------------------------
WITH DuplikatBPJS AS (
    SELECT 
        vc_no_rm,
        vc_nama_p,
        vc_no_peserta_bpjs,
        dt_tgl_lahir,
        vc_alamat,
        COUNT(*) OVER (
            PARTITION BY vc_no_peserta_bpjs
        ) AS total_duplikat,
        ROW_NUMBER() OVER (
            PARTITION BY vc_no_peserta_bpjs 
            ORDER BY vc_no_rm ASC
        ) AS urutan_kemunculan
    FROM dbo.RMPasien WITH (NOLOCK)
    WHERE vc_no_peserta_bpjs IS NOT NULL
      AND LTRIM(RTRIM(vc_no_peserta_bpjs)) != ''
      AND vc_no_peserta_bpjs != 'XXX'
)
SELECT 
    vc_no_peserta_bpjs  AS [No Peserta BPJS],
    total_duplikat      AS [Total Digunakan],
    urutan_kemunculan   AS [Urutan RM],
    vc_no_rm            AS [No RM],
    vc_nama_p           AS [Nama Pasien],
    dt_tgl_lahir        AS [Tgl Lahir],
    vc_alamat           AS [Alamat]
FROM DuplikatBPJS
WHERE total_duplikat > 1
ORDER BY 
    total_duplikat DESC,
    vc_no_peserta_bpjs ASC,
    vc_no_rm ASC;
GO

-- ------------------------------------------------------------------------------------------
-- 2. QUERY RINGKASAN: Mengetahui Nomor BPJS Mana Saja yang Duplikat & Berapa Jumlahnya
-- ------------------------------------------------------------------------------------------
/*
SELECT 
    vc_no_peserta_bpjs AS [No Peserta BPJS],
    COUNT(*)           AS [Jumlah Pasien/RM]
FROM dbo.RMPasien WITH (NOLOCK)
WHERE vc_no_peserta_bpjs IS NOT NULL
  AND LTRIM(RTRIM(vc_no_peserta_bpjs)) != ''
  AND vc_no_peserta_bpjs != 'XXX'
GROUP BY vc_no_peserta_bpjs
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;
*/
