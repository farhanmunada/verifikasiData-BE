import { getPool, isSqlServer, sqliteDb, sql } from '../db';

export interface RMLogCleansingRecord {
  in_id?: number;
  vc_no_rm: string;
  vc_nama_p?: string | null;
  vc_no_peserta_bpjs_lama?: string | null;
  vc_no_peserta_bpjs_baru: string;
  vc_user_clean: string;
  dt_tgl_clean?: string | Date;
}

export interface CreateLogCleansingDto {
  vc_no_rm: string;
  vc_nama_p?: string | null;
  vc_no_peserta_bpjs_lama?: string | null;
  vc_no_peserta_bpjs_baru?: string;
  vc_user_clean?: string;
}

export interface GetLogsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export class RMLogCleansingRepository {
  private tableInitialized = false;

  async ensureTableExists(): Promise<void> {
    if (this.tableInitialized) return;

    if (isSqlServer) {
      try {
        const pool = await getPool();
        await pool.request().query(`
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
          END
        `);
        this.tableInitialized = true;
      } catch (err) {
        console.error('Gagal inisialisasi tabel dbo.RMLogCleansing di SQL Server:', err);
      }
    } else {
      try {
        sqliteDb!.run(`
          CREATE TABLE IF NOT EXISTS RMLogCleansing (
            in_id INTEGER PRIMARY KEY AUTOINCREMENT,
            vc_no_rm TEXT NOT NULL,
            vc_nama_p TEXT,
            vc_no_peserta_bpjs_lama TEXT,
            vc_no_peserta_bpjs_baru TEXT NOT NULL DEFAULT 'XXX',
            vc_user_clean TEXT NOT NULL DEFAULT 'ADMIN',
            dt_tgl_clean DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        this.tableInitialized = true;
      } catch (err) {
        console.error('Gagal inisialisasi tabel RMLogCleansing di SQLite:', err);
      }
    }
  }

  async createLog(data: CreateLogCleansingDto): Promise<RMLogCleansingRecord> {
    await this.ensureTableExists();

    const newIdentity = data.vc_no_peserta_bpjs_baru || 'XXX';
    const userClean = data.vc_user_clean || 'ADMIN';

    if (isSqlServer) {
      const pool = await getPool();
      const res = await pool
        .request()
        .input('vc_no_rm', sql.VarChar(50), data.vc_no_rm)
        .input('vc_nama_p', sql.VarChar(255), data.vc_nama_p || null)
        .input('vc_no_peserta_bpjs_lama', sql.VarChar(100), data.vc_no_peserta_bpjs_lama || null)
        .input('vc_no_peserta_bpjs_baru', sql.VarChar(100), newIdentity)
        .input('vc_user_clean', sql.VarChar(100), userClean)
        .query(`
          INSERT INTO dbo.RMLogCleansing (
            vc_no_rm, 
            vc_nama_p, 
            vc_no_peserta_bpjs_lama, 
            vc_no_peserta_bpjs_baru, 
            vc_user_clean, 
            dt_tgl_clean
          )
          OUTPUT INSERTED.*
          VALUES (
            @vc_no_rm, 
            @vc_nama_p, 
            @vc_no_peserta_bpjs_lama, 
            @vc_no_peserta_bpjs_baru, 
            @vc_user_clean, 
            GETDATE()
          )
        `);

      return res.recordset[0];
    } else {
      const stmt = sqliteDb!.prepare(`
        INSERT INTO RMLogCleansing (
          vc_no_rm, 
          vc_nama_p, 
          vc_no_peserta_bpjs_lama, 
          vc_no_peserta_bpjs_baru, 
          vc_user_clean
        )
        VALUES (?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        data.vc_no_rm,
        data.vc_nama_p || null,
        data.vc_no_peserta_bpjs_lama || null,
        newIdentity,
        userClean
      );

      const inserted = sqliteDb!.query(`SELECT * FROM RMLogCleansing WHERE in_id = ?`).get(result.lastInsertRowid) as RMLogCleansingRecord;
      return inserted;
    }
  }

  async getLogs(params: GetLogsParams): Promise<{
    data: RMLogCleansingRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    await this.ensureTableExists();

    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 10));
    const offset = (page - 1) * limit;
    const search = params.search ? `%${params.search.trim()}%` : null;

    if (isSqlServer) {
      const pool = await getPool();

      let countQuery = `SELECT COUNT(*) AS total FROM dbo.RMLogCleansing`;
      let dataQuery = `
        SELECT in_id, vc_no_rm, vc_nama_p, vc_no_peserta_bpjs_lama, vc_no_peserta_bpjs_baru, vc_user_clean, dt_tgl_clean
        FROM dbo.RMLogCleansing
      `;

      if (search) {
        const whereClause = ` WHERE (vc_no_rm LIKE @search OR vc_nama_p LIKE @search OR vc_no_peserta_bpjs_lama LIKE @search)`;
        countQuery += whereClause;
        dataQuery += whereClause;
      }

      dataQuery += ` ORDER BY dt_tgl_clean DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;

      const countReq = pool.request();
      if (search) countReq.input('search', sql.VarChar(255), search);
      const countRes = await countReq.query(countQuery);
      const total = countRes.recordset[0]?.total || 0;

      const dataReq = pool.request();
      if (search) dataReq.input('search', sql.VarChar(255), search);
      dataReq.input('offset', sql.Int, offset);
      dataReq.input('limit', sql.Int, limit);
      const dataRes = await dataReq.query(dataQuery);

      return {
        data: dataRes.recordset,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    } else {
      let countQuery = `SELECT COUNT(*) AS total FROM RMLogCleansing`;
      let dataQuery = `SELECT * FROM RMLogCleansing`;
      const queryParams: any[] = [];

      if (search) {
        const whereClause = ` WHERE (vc_no_rm LIKE ? OR vc_nama_p LIKE ? OR vc_no_peserta_bpjs_lama LIKE ?)`;
        countQuery += whereClause;
        dataQuery += whereClause;
        queryParams.push(search, search, search);
      }

      dataQuery += ` ORDER BY dt_tgl_clean DESC LIMIT ? OFFSET ?`;

      const totalRow = sqliteDb!.query(countQuery).get(...queryParams) as any;
      const total = totalRow?.total || 0;

      const dataRows = sqliteDb!.query(dataQuery).all(...queryParams, limit, offset) as RMLogCleansingRecord[];

      return {
        data: dataRows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    }
  }
}

export const rmLogCleansingRepository = new RMLogCleansingRepository();
