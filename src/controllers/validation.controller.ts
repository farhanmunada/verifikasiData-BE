import { Context } from 'hono';
import { validationService } from '../services/validation.service';
import { successResponse, errorResponse } from '../utils/response';
import { verifyToken } from '../utils/jwt';

export class ValidationController {
  async checkIdentity(c: Context) {
    try {
      const identityNumber = c.req.param('identityNumber') ?? '';
      const result = await validationService.checkIdentity(identityNumber);
      return successResponse(c, 'Pemeriksaan nomor identitas berhasil.', result);
    } catch (err: any) {
      if (err.statusCode) {
        return errorResponse(c, err.message, err.code, undefined, err.statusCode);
      }
      return errorResponse(c, 'Gagal memeriksa nomor identitas.', 'CHECK_ERROR', undefined, 500);
    }
  }

  async getDuplicates(c: Context) {
    try {
      const results = await validationService.getDuplicateCandidates();
      return successResponse(c, 'Daftar kandidat duplikat berhasil diambil.', results);
    } catch (err: any) {
      return errorResponse(c, 'Gagal mengambil daftar kandidat duplikat.', 'FETCH_ERROR', undefined, 500);
    }
  }

  async clean(c: Context) {
    try {
      const vc_no_rm = c.req.param('id'); // using 'id' as vc_no_rm route param
      if (!vc_no_rm) {
        return errorResponse(c, 'Nomor RM tidak valid.', 'VALIDATION_ERROR', undefined, 400);
      }

      // Deteksi user yang melakukan cleansing secara fleksibel:
      let userClean = 'ADMIN';

      // 1. Coba dari Token Bearer jika dikirim di Authorization header
      const authHeader = c.req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        const payload = await verifyToken(token);
        if (payload?.username) {
          userClean = payload.username;
        }
      }

      // 2. Coba dari Header X-User jika tersedia
      const headerUser = c.req.header('X-User');
      if (headerUser) {
        userClean = headerUser;
      }

      // 3. Coba dari request body JSON jika ada
      try {
        const body = await c.req.json();
        if (body?.user || body?.username || body?.vc_user_clean) {
          userClean = body.user || body.username || body.vc_user_clean;
        }
      } catch {
        // Body opsional / kosong, abaikan error parsing
      }

      const result = await validationService.cleanDuplicate(vc_no_rm, userClean);
      return successResponse(c, 'Cleansing berhasil.', result);
    } catch (err: any) {
      console.error('Error pada proses cleansing:', err);
      if (err.statusCode) {
        return errorResponse(c, err.message, err.code, undefined, err.statusCode);
      }
      return errorResponse(c, err.message || 'Gagal menjalankan action cleansing.', 'CLEANSING_ERROR', undefined, 500);
    }
  }

  async getLogs(c: Context) {
    try {
      const page = c.req.query('page');
      const limit = c.req.query('limit');
      const search = c.req.query('search');

      const logs = await validationService.getCleansingLogs({
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        search: search || undefined,
      });

      return successResponse(c, 'Daftar riwayat cleansing berhasil diambil.', logs);
    } catch (err: any) {
      console.error('Error getLogs:', err);
      return errorResponse(c, 'Gagal mengambil riwayat cleansing.', 'LOGS_ERROR', undefined, 500);
    }
  }

  async getDashboard(c: Context) {
    try {
      const stats = await validationService.getDashboardStats();
      return successResponse(c, 'Ringkasan dashboard berhasil diambil.', stats);
    } catch (err: any) {
      return errorResponse(c, 'Gagal mengambil data dashboard.', 'DASHBOARD_ERROR', undefined, 500);
    }
  }
}

export const validationController = new ValidationController();

