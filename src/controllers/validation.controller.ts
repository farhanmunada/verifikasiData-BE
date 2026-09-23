import { Context } from 'hono';
import { validationService } from '../services/validation.service';
import { successResponse, errorResponse } from '../utils/response';

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

      const result = await validationService.cleanDuplicate(vc_no_rm);
      return successResponse(c, 'Cleansing berhasil.', result);
    } catch (err: any) {
      if (err.statusCode) {
        return errorResponse(c, err.message, err.code, undefined, err.statusCode);
      }
      return errorResponse(c, 'Gagal menjalankan action cleansing.', 'CLEANSING_ERROR', undefined, 500);
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
