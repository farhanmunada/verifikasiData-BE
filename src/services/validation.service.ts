import { rmPasienRepository } from '../repositories/rmpasien.repository';
import { rmLogCleansingRepository, GetLogsParams } from '../repositories/rmlogcleansing.repository';

export class ValidationService {
  async getDashboardStats() {
    return await rmPasienRepository.getDashboardStats();
  }

  async getDuplicateCandidates() {
    const candidateGroups = await rmPasienRepository.findDuplicateCandidates();
    return candidateGroups;
  }

  async checkIdentity(identityNumber: string) {
    if (!identityNumber) {
      throw { statusCode: 400, message: 'Nomor identitas BPJS wajib diisi.', code: 'VALIDATION_ERROR' };
    }

    if (identityNumber === 'XXX') {
      return {
        no_identitas: 'XXX',
        is_duplicate: false,
        message: 'Nomor identitas XXX merupakan penanda data yang telah dicleansing.',
        registrations: [],
      };
    }

    const records = await rmPasienRepository.findByIdentityNumber(identityNumber);
    const uniqueRM = new Set(records.map((r: any) => r.vc_no_rm));
    const isDuplicate = uniqueRM.size > 1;

    return {
      no_identitas: identityNumber,
      total_records: records.length,
      total_rm: uniqueRM.size,
      is_duplicate: isDuplicate,
      records: records,
    };
  }

  async cleanDuplicate(vc_no_rm: string, userClean: string = 'ADMIN') {
    const record = await rmPasienRepository.findByRm(vc_no_rm);
    if (!record) {
      throw { statusCode: 404, message: 'Data pasien tidak ditemukan.', code: 'NOT_FOUND' };
    }

    const oldIdentity = record.vc_no_peserta_bpjs;
    const patientName = record.vc_nama_p;

    await rmPasienRepository.updateIdentity(vc_no_rm, 'XXX');

    // Catat log perubahan ke dbo.RMLogCleansing (jika tabel sudah dibuat oleh Kepala IT/DBA)
    let logRecord: any = null;
    try {
      logRecord = await rmLogCleansingRepository.createLog({
        vc_no_rm,
        vc_nama_p: patientName,
        vc_no_peserta_bpjs_lama: oldIdentity,
        vc_no_peserta_bpjs_baru: 'XXX',
        vc_user_clean: userClean,
      });
    } catch (logErr: any) {
      console.warn(
        `[Peringatan Log Cleansing] Gagal menyimpan riwayat ke dbo.RMLogCleansing. Kemungkinan tabel belum dibuat oleh Kepala IT/DBA: ${logErr?.message || logErr}`
      );
    }

    return {
      vc_no_rm,
      vc_nama_p: patientName,
      old_identity: oldIdentity,
      new_identity: 'XXX',
      user_clean: userClean,
      status: 'CLEANED',
      log: logRecord,
    };
  }

  async getCleansingLogs(params: GetLogsParams) {
    return await rmLogCleansingRepository.getLogs(params);
  }
}

export const validationService = new ValidationService();

