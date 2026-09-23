import { getPool, isSqlServer, sqliteDb, sql } from '../db';

export interface RMPasienRecord {
  id?: number;
  vc_no_rm: string;
  vc_nama_p?: string;
  vc_no_peserta_bpjs?: string;
  [key: string]: any;
}

export class RMPasienRepository {
  async findByIdentityNumber(identityNumber: string): Promise<RMPasienRecord[]> {
    if (isSqlServer) {
      const pool = await getPool();
      const res = await pool
        .request()
        .input('identityNumber', sql.VarChar, identityNumber)
        .query('SELECT * FROM dbo.RMPasien WHERE vc_no_peserta_bpjs = @identityNumber');
      return res.recordset;
    } else {
      return sqliteDb!.query(`SELECT * FROM RMPasien WHERE vc_no_peserta_bpjs = ?`).all(identityNumber) as RMPasienRecord[];
    }
  }

  async findByRm(rm: string): Promise<RMPasienRecord | null> {
    if (isSqlServer) {
      const pool = await getPool();
      const res = await pool
        .request()
        .input('rm', sql.VarChar, rm)
        .query('SELECT * FROM dbo.RMPasien WHERE vc_no_rm = @rm');
      return res.recordset[0] || null;
    } else {
      return (sqliteDb!.query(`SELECT * FROM RMPasien WHERE vc_no_rm = ?`).get(rm) as RMPasienRecord) || null;
    }
  }

  async findDuplicateCandidates(): Promise<Array<{ vc_no_peserta_bpjs: string; count: number }>> {
    if (isSqlServer) {
      const pool = await getPool();
      const res = await pool.request().query(`
        SELECT vc_no_peserta_bpjs, COUNT(*) as count
        FROM dbo.RMPasien
        WHERE vc_no_peserta_bpjs IS NOT NULL
          AND vc_no_peserta_bpjs != ''
          AND vc_no_peserta_bpjs != 'XXX'
        GROUP BY vc_no_peserta_bpjs
        HAVING COUNT(*) > 1
      `);
      return res.recordset;
    } else {
      return sqliteDb!.query(`
        SELECT vc_no_peserta_bpjs, COUNT(*) as count
        FROM RMPasien
        WHERE vc_no_peserta_bpjs IS NOT NULL
          AND vc_no_peserta_bpjs != ''
          AND vc_no_peserta_bpjs != 'XXX'
        GROUP BY vc_no_peserta_bpjs
        HAVING COUNT(*) > 1
      `).all() as Array<{ vc_no_peserta_bpjs: string; count: number }>;
    }
  }

  async updateIdentity(vc_no_rm: string, newIdentity: string): Promise<RMPasienRecord | null> {
    if (isSqlServer) {
      const pool = await getPool();
      await pool
        .request()
        .input('rm', sql.VarChar, vc_no_rm)
        .input('newIdentity', sql.VarChar, newIdentity)
        .query('UPDATE dbo.RMPasien SET vc_no_peserta_bpjs = @newIdentity WHERE vc_no_rm = @rm');
      return this.findByRm(vc_no_rm);
    } else {
      sqliteDb!.query(`UPDATE RMPasien SET vc_no_peserta_bpjs = ? WHERE vc_no_rm = ?`).run(newIdentity, vc_no_rm);
      return this.findByRm(vc_no_rm);
    }
  }

  async getDashboardStats() {
    if (isSqlServer) {
      const pool = await getPool();

      const totalRes = await pool.request().query('SELECT COUNT(*) as total FROM dbo.RMPasien');
      const totalData = totalRes.recordset[0]?.total || 0;

      const uniqueRes = await pool.request().query(`
        SELECT COUNT(DISTINCT vc_no_peserta_bpjs) as total
        FROM dbo.RMPasien
        WHERE vc_no_peserta_bpjs IS NOT NULL AND vc_no_peserta_bpjs != ''
      `);
      const totalIdentities = uniqueRes.recordset[0]?.total || 0;

      const cleanedRes = await pool.request().query(`
        SELECT COUNT(*) as total FROM dbo.RMPasien WHERE vc_no_peserta_bpjs = 'XXX'
      `);
      const totalCleaned = cleanedRes.recordset[0]?.total || 0;

      const duplicateGroups = await this.findDuplicateCandidates();

      return {
        totalData,
        totalIdentities,
        totalCleanedRegistrations: totalCleaned,
        totalDuplicateGroups: duplicateGroups.length,
      };
    } else {
      const totalDataRow = sqliteDb!.query(`SELECT COUNT(*) as total FROM RMPasien`).get() as any;
      const totalData = totalDataRow?.total || 0;

      const uniqueRow = sqliteDb!.query(`
        SELECT COUNT(DISTINCT vc_no_peserta_bpjs) as total
        FROM RMPasien
        WHERE vc_no_peserta_bpjs IS NOT NULL AND vc_no_peserta_bpjs != ''
      `).get() as any;
      const totalIdentities = uniqueRow?.total || 0;

      const cleanedRow = sqliteDb!.query(`
        SELECT COUNT(*) as total FROM RMPasien WHERE vc_no_peserta_bpjs = 'XXX'
      `).get() as any;
      const totalCleaned = cleanedRow?.total || 0;

      const duplicateGroups = await this.findDuplicateCandidates();

      return {
        totalData,
        totalIdentities,
        totalCleanedRegistrations: totalCleaned,
        totalDuplicateGroups: duplicateGroups.length,
      };
    }
  }
}

export const rmPasienRepository = new RMPasienRepository();
